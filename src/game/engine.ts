import {
  GamePhase,
  RoomState,
  Player,
  SuspectId,
  RoomLocationId,
  StructuredAIOutput,
  MCPToolLog,
} from '../types/game';
import { CASE_META, SUSPECTS, CLUES, GALLERY_ROOMS, TIERED_HINTS, TRUE_DEDUCTION_CHAIN } from '../data/caseData';

export function createInitialRoom(
  roomId: string,
  hostPlayerName: string = '首席侦探',
  includeBots: boolean = true
): RoomState {
  const hostPlayer: Player = {
    id: 'player_host',
    name: hostPlayerName,
    avatar: '侦',
    isHost: true,
    isBot: false,
    ready: true,
  };

  const players: Player[] = [hostPlayer];

  if (includeBots) {
    players.push({
      id: 'bot_lin',
      name: '侦探小林',
      avatar: '林',
      isHost: false,
      isBot: true,
      ready: true,
    });
    players.push({
      id: 'bot_qiang',
      name: '解密达人阿强',
      avatar: '强',
      isHost: false,
      isBot: true,
      ready: true,
    });
  }

  const initialCode = roomId.slice(-4).toUpperCase() || 'MIST';

  return {
    roomId,
    roomCode: initialCode,
    phase: 'BRIEFING',
    players,
    discoveredClueIds: [],
    chatHistory: [
      {
        id: 'msg_init_1',
        sender: 'AI 主持人',
        senderRole: 'host',
        text: `各位侦探，欢迎来到《午夜画廊：锁闭之谜》。策展人陈默于今晚 22:30 被发现倒毙于紧闭的文物修复室中。四位嫌疑人已由安保人员留滞画廊各处。请大家搜查现场、调查询问、收集物证，揭开锁闭之室下的致命真相！`,
        timestamp: new Date().toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' }),
      },
    ],
    currentSuspectId: 'lin_lan',
    clueLinks: [],
    playerNotes: {
      player_host: '【我的初步线索备忘录】\n- 重点关注各人不在场证明\n- 留意修复室反锁原理与凶器',
    },
    hintLevel: 0,
    hintsRevealed: [],
    inspectedLocations: [],
    votes: {},
    auditLogs: [
      {
        time: new Date().toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' }),
        action: 'ROOM_CREATED',
        actor: hostPlayerName,
        details: `创建房间并初始化案件数据 (包含模拟玩家 ${includeBots ? '2名' : '0名'})`,
      },
    ],
    spoilerInterceptions: [],
    mcpCallHistory: [],
  };
}

export function advanceGamePhase(state: RoomState): RoomState {
  const sequence: GamePhase[] = [
    'BRIEFING',
    'INVESTIGATION',
    'INTERROGATION',
    'DISCUSSION',
    'VOTING',
    'TRUTH_REVEAL',
  ];

  const currentIndex = sequence.indexOf(state.phase);
  if (currentIndex === -1 || currentIndex >= sequence.length - 1) {
    return state;
  }

  const nextPhase = sequence[currentIndex + 1];
  const phaseAnnouncements: Record<GamePhase, string> = {
    LOBBY: '进入大厅等待中。',
    BRIEFING: '案件已建档。请侦探们阅读案情简报，知悉受害人死因与案发背景。',
    INVESTIGATION: '【现场搜查阶段开启】画廊四个关键区域已开放搜查，点击现场光标或地点卡片发现线索。',
    INTERROGATION: '【嫌疑人审问阶段开启】四位嫌疑人接受分别问话。出示搜集到的物证，观察嫌疑人的微表情与心理防线！',
    DISCUSSION: '【全员案情讨论阶段】整合时间线与证物网，拖拽线索建立关系链，比对疑点矛盾。',
    VOTING: '【指控投票阶段开启】指认真凶并提交行凶手段与动机判定！',
    TRUTH_REVEAL: '【案件真相终极复盘】全案推演解析、判定结果与剧透控制评分出炉！',
  };

  const newLog = {
    time: new Date().toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' }),
    action: 'PHASE_CHANGED',
    actor: 'AI 主持人',
    details: `阶段流转: ${state.phase} -> ${nextPhase}`,
  };

  const newHistory = [
    ...state.chatHistory,
    {
      id: `msg_phase_${Date.now()}`,
      sender: 'AI 主持人',
      senderRole: 'host' as const,
      text: phaseAnnouncements[nextPhase],
      timestamp: new Date().toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' }),
    },
  ];

  return {
    ...state,
    phase: nextPhase,
    chatHistory: newHistory,
    auditLogs: [newLog, ...state.auditLogs],
  };
}

export function inspectLocation(state: RoomState, locationId: RoomLocationId, playerId: string = 'player_host'): {
  nextState: RoomState;
  newlyDiscoveredClues: string[];
} {
  const room = GALLERY_ROOMS.find((r) => r.id === locationId);
  if (!room) {
    return { nextState: state, newlyDiscoveredClues: [] };
  }

  const alreadyDiscovered = new Set(state.discoveredClueIds);
  const newlyFound = room.availableClues.filter((clueId) => !alreadyDiscovered.has(clueId));

  const updatedClues = Array.from(new Set([...state.discoveredClueIds, ...newlyFound]));
  const updatedInspected = Array.from(new Set([...state.inspectedLocations, locationId]));

  const playerName = state.players.find((p) => p.id === playerId)?.name || '侦探';

  const newLogs = [...state.auditLogs];
  newLogs.unshift({
    time: new Date().toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' }),
    action: 'INSPECT_LOCATION',
    actor: playerName,
    details: `搜查地点 [${room.name}]，发现新线索 ${newlyFound.length} 件`,
  });

  const newHistory = [...state.chatHistory];
  if (newlyFound.length > 0) {
    const clueNames = newlyFound
      .map((id) => CLUES.find((c) => c.id === id)?.name)
      .filter(Boolean)
      .join('、');

    newHistory.push({
      id: `msg_found_${Date.now()}`,
      sender: '物证搜查员',
      senderRole: 'system',
      text: `${playerName} 在【${room.name}】发现了关键证物：${clueNames}！物证特写相片已录入案件板，可进行微距放大检视。`,
      timestamp: new Date().toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' }),
    });
  } else {
    newHistory.push({
      id: `msg_found_none_${Date.now()}`,
      sender: '物证搜查员',
      senderRole: 'system',
      text: `${playerName} 仔细勘查了【${room.name}】，该区域所有明暗物证均已被提取完毕。`,
      timestamp: new Date().toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' }),
    });
  }

  return {
    nextState: {
      ...state,
      discoveredClueIds: updatedClues,
      inspectedLocations: updatedInspected,
      chatHistory: newHistory,
      auditLogs: newLogs,
    },
    newlyDiscoveredClues: newlyFound,
  };
}

export function revealHint(state: RoomState, level?: number): { nextState: RoomState; hint: string } {
  const targetLevel = level || state.hintLevel + 1;
  const hintItem = TIERED_HINTS.find((h) => h.level === targetLevel);

  if (!hintItem) {
    return {
      nextState: state,
      hint: '已无更高阶提示，真相就在现有的线索与时间线矛盾之中！',
    };
  }

  const newRevealed = [...state.hintsRevealed, hintItem.content];
  const newLogs = [
    {
      time: new Date().toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' }),
      action: 'REVEAL_HINT',
      actor: 'AI 主持人',
      details: `解锁第 ${targetLevel} 级提示: ${hintItem.title}`,
    },
    ...state.auditLogs,
  ];

  const newHistory = [
    ...state.chatHistory,
    {
      id: `msg_hint_${Date.now()}`,
      sender: 'AI 主持人',
      senderRole: 'host' as const,
      text: `【调查破案提示 Level ${targetLevel}】${hintItem.content}`,
      timestamp: new Date().toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' }),
    },
  ];

  return {
    nextState: {
      ...state,
      hintLevel: Math.max(state.hintLevel, targetLevel),
      hintsRevealed: newRevealed,
      chatHistory: newHistory,
      auditLogs: newLogs,
    },
    hint: hintItem.content,
  };
}

export function submitVote(
  state: RoomState,
  playerId: string,
  suspectId: SuspectId,
  reason: string
): RoomState {
  const updatedVotes = {
    ...state.votes,
    [playerId]: {
      suspectId,
      reason,
      timestamp: new Date().toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' }),
    },
  };

  const playerName = state.players.find((p) => p.id === playerId)?.name || '玩家';
  const suspectName = SUSPECTS.find((s) => s.id === suspectId)?.name || suspectId;

  const newLogs = [
    {
      time: new Date().toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' }),
      action: 'SUBMIT_VOTE',
      actor: playerName,
      details: `指控 [${suspectName}]，推论: ${reason.slice(0, 30)}...`,
    },
    ...state.auditLogs,
  ];

  // Auto-fill bot votes if not yet voted
  for (const p of state.players) {
    if (p.isBot && !updatedVotes[p.id]) {
      if (p.id === 'bot_lin') {
        updatedVotes[p.id] = {
          suspectId: 'xu_ning',
          reason: '比对 22:15 怀表与 22:12 备用门禁卡记录，许宁的不在场证明存在致命时间差，且通风窗拉线手法唯有她符合。',
          timestamp: new Date().toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' }),
        };
      } else if (p.id === 'bot_qiang') {
        // Red herring path vote to simulate diverse team debate!
        updatedVotes[p.id] = {
          suspectId: 'zhou_heng',
          reason: '周衡有 500 万资金重大作案动机，且香槟杯上有他的指纹与沉淀物！',
          timestamp: new Date().toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' }),
        };
      }
    }
  }

  return {
    ...state,
    votes: updatedVotes,
    auditLogs: newLogs,
  };
}

export function addClueLink(state: RoomState, clueId: string, targetId: string, note: string = ''): RoomState {
  const exists = state.clueLinks.some((l) => l.clueId === clueId && l.targetId === targetId);
  if (exists) {
    return {
      ...state,
      clueLinks: state.clueLinks.filter((l) => !(l.clueId === clueId && l.targetId === targetId)),
    };
  }
  return {
    ...state,
    clueLinks: [...state.clueLinks, { clueId, targetId, note }],
  };
}

export function evaluateVerdict(state: RoomState): {
  isSolved: boolean;
  accuracyRate: number;
  clueUtilizationRate: number;
  spoilerControlScore: number;
  voteSummary: Record<SuspectId, number>;
  majoritySuspectId: SuspectId;
} {
  const votes = Object.values(state.votes);
  const tally: Record<SuspectId, number> = {
    lin_lan: 0,
    zhou_heng: 0,
    xu_ning: 0,
    zhao_lei: 0,
  };

  votes.forEach((v) => {
    if (tally[v.suspectId] !== undefined) {
      tally[v.suspectId] += 1;
    }
  });

  let majoritySuspectId: SuspectId = 'lin_lan';
  let maxVotes = -1;
  (Object.keys(tally) as SuspectId[]).forEach((sId) => {
    if (tally[sId] > maxVotes) {
      maxVotes = tally[sId];
      majoritySuspectId = sId;
    }
  });

  const totalPlayers = state.players.length || 1;
  const correctVotes = votes.filter((v) => v.suspectId === TRUE_DEDUCTION_CHAIN.culprit).length;
  const accuracyRate = Math.round((correctVotes / Math.max(1, votes.length)) * 100);

  const crucialClues = CLUES.filter((c) => c.isCrucial).map((c) => c.id);
  const discoveredCrucialCount = state.discoveredClueIds.filter((id) => crucialClues.includes(id)).length;
  const clueUtilizationRate = Math.round((discoveredCrucialCount / crucialClues.length) * 100);

  // Spoiler control rating based on intercepted leaks
  const spoilerControlScore = Math.max(60, 100 - state.spoilerInterceptions.length * 8);

  const isSolved = majoritySuspectId === TRUE_DEDUCTION_CHAIN.culprit;

  return {
    isSolved,
    accuracyRate,
    clueUtilizationRate,
    spoilerControlScore,
    voteSummary: tally,
    majoritySuspectId,
  };
}
