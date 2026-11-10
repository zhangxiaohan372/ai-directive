import {
  RoomState,
  SuspectId,
  RoomLocationId,
  MCPToolLog,
  StructuredAIOutput,
  ChatMessage,
} from '../types/game';
import {
  inspectLocation,
  revealHint,
  submitVote,
  advanceGamePhase,
} from './engine';
import { generateMockNPCResponse, arbitrateSpoilerRisk } from './rag';
import { CLUES, SUSPECTS } from '../data/caseData';

export interface MCPToolDefinition {
  name: string;
  description: string;
  parameters: Record<string, { type: string; description: string; required?: boolean }>;
}

export const MCP_TOOL_DEFINITIONS: MCPToolDefinition[] = [
  {
    name: 'get_game_state',
    description: '获取当前房间的完整游戏状态，包括阶段、已搜查地点、线索总数、玩家列表。',
    parameters: {
      roomId: { type: 'string', description: '房间唯一标识符', required: true },
    },
  },
  {
    name: 'get_player_inventory',
    description: '获取指定玩家已掌握的所有线索与笔记。',
    parameters: {
      roomId: { type: 'string', description: '房间唯一标识符', required: true },
      playerId: { type: 'string', description: '玩家唯一标识符', required: true },
    },
  },
  {
    name: 'inspect_location',
    description: '对画廊特定房间执行物证勘验搜查，解锁潜在物理/文档/化验线索。',
    parameters: {
      roomId: { type: 'string', description: '房间唯一标识符', required: true },
      locationId: { type: 'string', description: '搜查地点ID: main_hall, restoration_room, curator_office, security_room', required: true },
    },
  },
  {
    name: 'interrogate_npc',
    description: '向指定嫌疑人 NPC 提出质询，结合已解锁线索获取结构化反应及情绪变化。',
    parameters: {
      roomId: { type: 'string', description: '房间唯一标识符', required: true },
      npcId: { type: 'string', description: '嫌疑人ID: lin_lan, zhou_heng, xu_ning, zhao_lei', required: true },
      question: { type: 'string', description: '质询问题或出示证物', required: true },
    },
  },
  {
    name: 'reveal_hint',
    description: 'AI 主持人按层级（1-3 级）解锁破案推演指引。',
    parameters: {
      roomId: { type: 'string', description: '房间唯一标识符', required: true },
      level: { type: 'number', description: '提示等级: 1, 2, 3', required: false },
    },
  },
  {
    name: 'start_vote',
    description: '推进游戏进入全员指控投票阶段。',
    parameters: {
      roomId: { type: 'string', description: '房间唯一标识符', required: true },
    },
  },
  {
    name: 'submit_vote',
    description: '玩家提交针对真凶的最终指控投票及推演论点。',
    parameters: {
      roomId: { type: 'string', description: '房间唯一标识符', required: true },
      playerId: { type: 'string', description: '投票玩家ID', required: true },
      suspectId: { type: 'string', description: '指认嫌疑人ID', required: true },
    },
  },
  {
    name: 'advance_story',
    description: '由主持人或投票仲裁推进主线故事进入下一个阶段。',
    parameters: {
      roomId: { type: 'string', description: '房间唯一标识符', required: true },
    },
  },
];

export function executeMCPTool(
  toolName: string,
  args: Record<string, any>,
  state: RoomState
): {
  nextState: RoomState;
  result: Record<string, any>;
} {
  const logId = `mcp_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
  let result: Record<string, any> = {};
  let nextState: RoomState = { ...state };
  let status: 'success' | 'blocked' | 'error' = 'success';

  try {
    switch (toolName) {
      case 'get_game_state': {
        result = {
          roomId: state.roomId,
          roomCode: state.roomCode,
          phase: state.phase,
          playerCount: state.players.length,
          discoveredCluesCount: state.discoveredClueIds.length,
          inspectedLocations: state.inspectedLocations,
          hintLevel: state.hintLevel,
        };
        break;
      }

      case 'get_player_inventory': {
        const playerId = args.playerId || 'player_host';
        const discoveredClueObjects = CLUES.filter((c) =>
          state.discoveredClueIds.includes(c.id)
        );
        result = {
          playerId,
          clues: discoveredClueObjects,
          notes: state.playerNotes[playerId] || '',
          clueLinksCount: state.clueLinks.length,
        };
        break;
      }

      case 'inspect_location': {
        const locationId = args.locationId as RoomLocationId;
        const res = inspectLocation(state, locationId, args.playerId || 'player_host');
        nextState = res.nextState;
        result = {
          locationId,
          newlyDiscoveredClues: res.newlyDiscoveredClues,
          totalDiscovered: nextState.discoveredClueIds.length,
        };
        break;
      }

      case 'interrogate_npc': {
        const npcId = args.npcId as SuspectId;
        const question = args.question || '';
        const aiOutput: StructuredAIOutput = generateMockNPCResponse(npcId, question, state);

        // Anti-spoiler check
        const spoilerCheck = arbitrateSpoilerRisk(aiOutput.message, state, npcId);
        let activeSpoilerInterceptions = nextState.spoilerInterceptions || [];
        if (spoilerCheck.isBlocked) {
          status = 'blocked';
          activeSpoilerInterceptions = [
            {
              time: new Date().toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' }),
              originalText: aiOutput.message,
              riskScore: spoilerCheck.spoilerRisk,
              reason: spoilerCheck.reason || '剧透风险超标',
            },
            ...activeSpoilerInterceptions,
          ];
        }

        const npcObj = SUSPECTS.find((s) => s.id === npcId);
        const displayText = spoilerCheck.isBlocked
          ? (spoilerCheck.sanitizedText || '【AI 裁判系统防剧透介入】：该嫌疑人险些吐露未被证实的案情核心秘密，此回答已被裁判封存。请继续出示现场物证质问。')
          : aiOutput.message;

        const timeStr = new Date().toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' });
        const playerMsg: ChatMessage = {
          id: `msg_p_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
          sender: '首席侦探 (我)',
          senderRole: 'player',
          text: question,
          timestamp: timeStr,
          suspectId: npcId,
        };

        const npcMsg: ChatMessage = {
          id: `msg_npc_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
          sender: npcObj ? `${npcObj.name} (${npcObj.title})` : '嫌疑人',
          senderRole: 'suspect',
          text: displayText,
          timestamp: timeStr,
          emotion: aiOutput.emotion,
          suspectId: npcId,
        };

        nextState = {
          ...nextState,
          currentSuspectId: npcId,
          spoilerInterceptions: activeSpoilerInterceptions,
          chatHistory: [...nextState.chatHistory, playerMsg, npcMsg],
        };

        result = {
          npcId,
          aiResponse: aiOutput,
          displayText,
          spoilerRisk: aiOutput.spoilerRisk,
          isBlocked: spoilerCheck.isBlocked,
        };
        break;
      }

      case 'reveal_hint': {
        const level = args.level ? Number(args.level) : undefined;
        const res = revealHint(state, level);
        nextState = res.nextState;
        result = {
          hintLevel: nextState.hintLevel,
          hint: res.hint,
        };
        break;
      }

      case 'start_vote': {
        if (state.phase !== 'VOTING') {
          nextState = {
            ...advanceGamePhase(state),
            phase: 'VOTING',
          };
        }
        result = {
          status: 'VOTING_INITIATED',
          currentPhase: nextState.phase,
        };
        break;
      }

      case 'submit_vote': {
        const playerId = args.playerId || 'player_host';
        const suspectId = args.suspectId as SuspectId;
        const reason = args.reason || '根据现场证据与时间线矛盾判定';
        nextState = submitVote(state, playerId, suspectId, reason);
        result = {
          playerId,
          votedFor: suspectId,
          totalVotesRecorded: Object.keys(nextState.votes).length,
        };
        break;
      }

      case 'advance_story': {
        nextState = advanceGamePhase(state);
        result = {
          previousPhase: state.phase,
          newPhase: nextState.phase,
        };
        break;
      }

      default: {
        status = 'error';
        result = { error: `未知的 MCP 工具调用: ${toolName}` };
      }
    }
  } catch (err: any) {
    status = 'error';
    result = { error: err.message || 'MCP 执行内部错误' };
  }

  const logEntry: MCPToolLog = {
    id: logId,
    timestamp: new Date().toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' }),
    toolName,
    args,
    result,
    status,
  };

  nextState.mcpCallHistory = [logEntry, ...nextState.mcpCallHistory.slice(0, 49)];

  return { nextState, result };
}
