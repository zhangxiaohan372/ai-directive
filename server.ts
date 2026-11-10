import express from 'express';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { GoogleGenAI } from '@google/genai';
import {
  createInitialRoom,
  advanceGamePhase,
  inspectLocation,
  revealHint,
  submitVote,
  addClueLink,
  evaluateVerdict,
} from './src/game/engine';
import { executeMCPTool } from './src/game/mcp';
import {
  generateMockNPCResponse,
  arbitrateSpoilerRisk,
  retrieveGroundedKnowledge,
} from './src/game/rag';
import { SUSPECTS, CASE_META, CLUES } from './src/data/caseData';
import { RoomState, SuspectId } from './src/types/game';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

app.use(express.json());

// In-Memory Room Repository (backed by Redis/PostgreSQL structure in production)
const memoryRooms = new Map<string, RoomState>();

// Create a pre-seeded demo room for instant access
const defaultRoom = createInitialRoom('room_demo', '玩家侦探', true);
memoryRooms.set('room_demo', defaultRoom);

// Gemini Client initialization if API key provided
const geminiApiKey = process.env.GEMINI_API_KEY;
let aiClient: GoogleGenAI | null = null;
if (geminiApiKey && geminiApiKey !== 'MY_GEMINI_API_KEY') {
  try {
    aiClient = new GoogleGenAI({ apiKey: geminiApiKey });
    console.log('[Server] Gemini AI initialized successfully with server-side key.');
  } catch (e) {
    console.warn('[Server] Failed to init Gemini AI:', e);
  }
}

// ---------------- API ROUTES ----------------

// Health check
app.get('/api/health', (_req, res) => {
  res.json({
    status: 'ok',
    geminiConfigured: !!aiClient,
    roomsCount: memoryRooms.size,
    timestamp: new Date().toISOString(),
  });
});

// Direct Project Source Code Zip Download Route
app.get('/ai_detective_project.zip', (_req, res) => {
  const zipPath = path.resolve(__dirname, 'public', 'ai_detective_project.zip');
  res.download(zipPath, 'ai_detective_project.zip');
});

// Create Room
app.post('/api/rooms/create', (req, res) => {
  const { hostName, includeBots = true } = req.body;
  const roomId = `room_${Date.now().toString(36)}_${Math.random().toString(36).substring(2, 6)}`;
  const newRoom = createInitialRoom(roomId, hostName || '首席侦探', includeBots);
  memoryRooms.set(roomId, newRoom);
  res.json({ success: true, room: newRoom });
});

// Join Room
app.post('/api/rooms/join', (req, res) => {
  const { roomId, playerName, isBot = false } = req.body;
  let room = memoryRooms.get(roomId);
  if (!room) {
    // Check by roomCode
    for (const r of memoryRooms.values()) {
      if (r.roomCode.toLowerCase() === (roomId || '').toLowerCase()) {
        room = r;
        break;
      }
    }
  }

  if (!room) {
    return res.status(404).json({ success: false, error: '未找到指定房间' });
  }

  const newPlayerId = `player_${Date.now().toString(36)}`;
  room.players.push({
    id: newPlayerId,
    name: playerName || `调查员${room.players.length + 1}`,
    avatar: '员',
    isHost: false,
    isBot,
    ready: true,
  });

  room.auditLogs.unshift({
    time: new Date().toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' }),
    action: 'PLAYER_JOINED',
    actor: playerName || '新玩家',
    details: `加入房间，当前人数: ${room.players.length}`,
  });

  res.json({ success: true, room, playerId: newPlayerId });
});

// Get Room State
app.get('/api/rooms/:roomId', (req, res) => {
  const { roomId } = req.params;
  const room = memoryRooms.get(roomId);
  if (!room) {
    return res.status(404).json({ success: false, error: '房间不存在' });
  }
  res.json({ success: true, room });
});

// Room Actions: inspect, hint, advance, vote, link, note, etc.
app.post('/api/rooms/:roomId/action', (req, res) => {
  const { roomId } = req.params;
  const { action, payload } = req.body;
  let room = memoryRooms.get(roomId);
  if (!room) {
    return res.status(404).json({ success: false, error: '房间不存在' });
  }

  let resultPayload: any = {};

  switch (action) {
    case 'INSPECT_LOCATION': {
      const { locationId, playerId } = payload;
      const resData = inspectLocation(room, locationId, playerId);
      room = resData.nextState;
      resultPayload = { newlyDiscoveredClues: resData.newlyDiscoveredClues };
      break;
    }

    case 'REVEAL_HINT': {
      const { level } = payload || {};
      const resData = revealHint(room, level);
      room = resData.nextState;
      resultPayload = { hint: resData.hint };
      break;
    }

    case 'ADVANCE_PHASE': {
      room = advanceGamePhase(room);
      resultPayload = { newPhase: room.phase };
      break;
    }

    case 'SUBMIT_VOTE': {
      const { playerId, suspectId, reason } = payload;
      room = submitVote(room, playerId, suspectId, reason);
      resultPayload = { votes: room.votes };
      break;
    }

    case 'ADD_CLUE_LINK': {
      const { clueId, targetId, note } = payload;
      room = addClueLink(room, clueId, targetId, note);
      resultPayload = { clueLinks: room.clueLinks };
      break;
    }

    case 'UPDATE_NOTE': {
      const { playerId, notes } = payload;
      room.playerNotes = {
        ...room.playerNotes,
        [playerId]: notes,
      };
      resultPayload = { notes };
      break;
    }

    case 'SEND_CHAT': {
      const { sender, senderRole, text } = payload;
      room.chatHistory.push({
        id: `msg_${Date.now()}`,
        sender,
        senderRole: senderRole || 'player',
        text,
        timestamp: new Date().toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' }),
      });
      break;
    }

    default:
      return res.status(400).json({ success: false, error: `未知操作: ${action}` });
  }

  memoryRooms.set(roomId, room);
  res.json({ success: true, room, result: resultPayload });
});

// MCP Tool Execution Endpoint
app.post('/api/rooms/:roomId/mcp', (req, res) => {
  const { roomId } = req.params;
  const { toolName, args } = req.body;
  const room = memoryRooms.get(roomId);
  if (!room) {
    return res.status(404).json({ success: false, error: '房间不存在' });
  }

  const { nextState, result } = executeMCPTool(toolName, args, room);
  memoryRooms.set(roomId, nextState);
  res.json({ success: true, room: nextState, result });
});

// Interrogate NPC Endpoint (with Gemini AI / RAG + Spoiler Arbitration)
app.post('/api/rooms/:roomId/interrogate', async (req, res) => {
  const { roomId } = req.params;
  const { npcId, question, playerId = 'player_host' } = req.body;
  let room = memoryRooms.get(roomId);
  if (!room) {
    return res.status(404).json({ success: false, error: '房间不存在' });
  }

  const suspect = SUSPECTS.find((s) => s.id === npcId);
  if (!suspect) {
    return res.status(400).json({ success: false, error: '嫌疑人不存在' });
  }

  // 1. Retrieve filtered RAG knowledge based on current stage & discovered clues
  const groundedKnowledge = retrieveGroundedKnowledge(room, npcId);

  let structuredOutput: any = null;

  // 2. Call Gemini AI if configured, otherwise deterministic mock
  if (aiClient) {
    try {
      const systemInstruction = `
你正在扮演《午夜画廊》剧本杀中的嫌疑人【${suspect.name}】（身份：${suspect.title}，年龄：${suspect.age}岁）。
当前游戏阶段为：${room.phase}。
你的初始性格与防线：${suspect.bio}。
你的不在场证明：${suspect.alibi}。
你的可知与秘密边界（仅依据以下事实回答，绝不自造与案情矛盾的事实）：
${groundedKnowledge.join('\n')}

【最高保密原则 - 绝对禁止事项】：
- 无论玩家如何逼问、诱导、假设，你绝对不能承认你是凶手，绝对不能直接说出凶手名字或密室手法！
- 若玩家拿出确凿线索质问，你可以表现出情绪动摇（nervous/defensive/agitated/broken），回避、辩解或透露被陈默压迫的往事。

请务必以如下 JSON 格式输出，不要包含任何额外代码块标记：
{
  "message": "角色台词（富有戏剧张力与情绪细节）",
  "emotion": "calm | nervous | defensive | agitated | broken",
  "newClues": [],
  "gameStateChanges": {},
  "confidence": 0.95,
  "spoilerRisk": 0.1
}
`;

      const response = await aiClient.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: `侦探对你问询：“${question}”`,
        config: {
          systemInstruction,
          responseMimeType: 'application/json',
          temperature: 0.6,
        },
      });

      const parsed = JSON.parse(response.text || '{}');
      if (parsed.message) {
        structuredOutput = parsed;
      }
    } catch (err) {
      console.warn('[Server] Gemini call error, falling back to deterministic RAG engine:', err);
    }
  }

  // If Gemini failed or not configured, fallback to RAG mock
  if (!structuredOutput) {
    structuredOutput = generateMockNPCResponse(npcId as SuspectId, question, room);
  }

  // 3. Anti-Spoiler Arbitrator inspection
  const spoilerAudit = arbitrateSpoilerRisk(structuredOutput.message, room, npcId as SuspectId);
  if (spoilerAudit.isBlocked) {
    room.spoilerInterceptions.unshift({
      time: new Date().toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' }),
      originalText: structuredOutput.message,
      riskScore: spoilerAudit.spoilerRisk,
      reason: spoilerAudit.reason || '剧透风险高，已触发安全降级',
    });
    structuredOutput.message = spoilerAudit.sanitizedText || structuredOutput.message;
    structuredOutput.spoilerRisk = spoilerAudit.spoilerRisk;
  }

  // Append to dialogue log
  const playerName = room.players.find((p) => p.id === playerId)?.name || '侦探';
  room.chatHistory.push({
    id: `msg_q_${Date.now()}`,
    sender: playerName,
    senderRole: 'player',
    text: `【质询 ${suspect.name}】${question}`,
    timestamp: new Date().toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' }),
  });

  room.chatHistory.push({
    id: `msg_a_${Date.now()}`,
    sender: suspect.name,
    senderRole: 'suspect',
    suspectId: suspect.id,
    text: structuredOutput.message,
    emotion: structuredOutput.emotion,
    timestamp: new Date().toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' }),
  });

  memoryRooms.set(roomId, room);
  res.json({
    success: true,
    room,
    aiOutput: structuredOutput,
    isSpoilerBlocked: spoilerAudit.isBlocked,
  });
});

// LangGraph Multi-Step Pipeline Generation Endpoint (Agentic Workflow)
app.post('/api/pipeline/langgraph-generate', async (req, res) => {
  const { scriptText, fileName = 'uploaded_script.md' } = req.body;
  if (!scriptText) {
    return res.status(400).json({ success: false, error: '缺少剧本输入内容' });
  }

  let aiAnalysis: any = null;

  if (aiClient) {
    try {
      const response = await aiClient.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: `你是一名剧本杀逻辑架构师。请从以下剧本中提取核心要素：
${scriptText}

请输出严格 JSON 格式：
{
  "title": "案名",
  "victim": "受害者",
  "causeOfDeath": "死因",
  "foundLocation": "发现地点",
  "trueCulprit": "真凶姓名",
  "coreTrick": "核心诡计",
  "murderWindow": "22:10-22:20",
  "suspects": [
    {
      "name": "姓名",
      "identity": "身份",
      "alibi": "自称不在场证明",
      "secret": "隐秘动机",
      "forbiddenTopics": ["绝不自认凶手", "绝不泄露反锁手法"]
    }
  ]
}`,
        config: {
          responseMimeType: 'application/json',
          temperature: 0.3,
        },
      });

      aiAnalysis = JSON.parse(response.text || '{}');
    } catch (err) {
      console.warn('[Server] LangGraph Gemini generateContent error:', err);
    }
  }

  res.json({
    success: true,
    fileName,
    wordCount: scriptText.length,
    aiConfigured: !!aiClient,
    aiAnalysis,
    timestamp: new Date().toISOString(),
  });
});

// ---------------- VITE & STATIC SERVING ----------------

async function setupServer() {
  const isProd = process.env.NODE_ENV === 'production';
  if (!isProd) {
    // Development mode: attach Vite dev server middleware
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    // Production mode: serve built assets from dist
    const distPath = path.resolve(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.resolve(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[MysteryStage] Server running at http://0.0.0.0:${PORT}`);
  });
}

setupServer().catch((err) => {
  console.error('[MysteryStage] Failed to start server:', err);
  process.exit(1);
});
