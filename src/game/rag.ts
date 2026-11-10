import { GamePhase, RoomState, SuspectId, StructuredAIOutput, SuspectEmotion } from '../types/game';
import { SUSPECTS, CLUES, TIMELINE, TRUE_DEDUCTION_CHAIN } from '../data/caseData';

export interface KnowledgeDoc {
  id: string;
  category: 'public_fact' | 'npc_alibi' | 'npc_secret' | 'clue_forensic' | 'truth_top_secret';
  ownerNpcId?: SuspectId;
  requiredPhase?: GamePhase[];
  requiredClueIds?: string[];
  content: string;
  spoilerWeight: number; // 0.0 - 1.0 (high means direct murder secret)
}

export const KNOWLEDGE_BASE: KnowledgeDoc[] = [
  // Public Facts
  {
    id: 'kf_01',
    category: 'public_fact',
    content: '陈默今晚 22:30 在反锁的修复室被发现死亡。死亡时间在 22:10 至 22:20 之间，死因为钝器击打后脑。',
    spoilerWeight: 0.0,
  },
  {
    id: 'kf_02',
    category: 'public_fact',
    content: '私人画廊共有四处主要区域：中央展厅、修复室、办公室与保安室。酒会于 21:50 散场。',
    spoilerWeight: 0.0,
  },

  // Lin Lan Memories
  {
    id: 'kf_lin_alibi',
    category: 'npc_alibi',
    ownerNpcId: 'lin_lan',
    content: '林岚在 22:05 去办公室找陈默理论署名权，因剧烈争执打翻调色盘，哭着跑回大厅，22:10 有宾客见证。',
    spoilerWeight: 0.1,
  },
  {
    id: 'kf_lin_secret',
    category: 'npc_secret',
    ownerNpcId: 'lin_lan',
    requiredClueIds: ['clue_cloth', 'clue_journal'],
    content: '林岚承认近一年的多幅代表作实为陈默操弄助理许宁代笔。林岚虽然痛恨陈默剥夺自己的艺术尊严，但她绝不敢杀人。',
    spoilerWeight: 0.35,
  },

  // Zhou Heng Memories
  {
    id: 'kf_zhou_alibi',
    category: 'npc_alibi',
    ownerNpcId: 'zhou_heng',
    content: '周衡声称 22:00 在办公室找陈默核对财务协议，22:08 离开画廊驱车回酒店。',
    spoilerWeight: 0.1,
  },
  {
    id: 'kf_zhou_secret',
    category: 'npc_secret',
    ownerNpcId: 'zhou_heng',
    requiredClueIds: ['clue_glass', 'clue_agreement'],
    content: '周衡承认在香槟杯中投放了温和镇静剂，意图使陈默昏睡以便签署借款清偿协议。但他坚称离开时陈默呼吸平稳，绝对活着。',
    spoilerWeight: 0.38,
  },

  // Zhao Lei Memories
  {
    id: 'kf_zhao_alibi',
    category: 'npc_alibi',
    ownerNpcId: 'zhao_lei',
    content: '赵磊声称 22:00-22:20 在巡查配电箱，期间由于设备调试关闭了监控。',
    spoilerWeight: 0.1,
  },
  {
    id: 'kf_zhao_secret',
    category: 'npc_secret',
    ownerNpcId: 'zhao_lei',
    requiredClueIds: ['clue_log'],
    content: '赵磊坦白受高利贷逼迫，在 22:18 潜入办公室大衣中偷走 10 万元公款现金。但到修复室门口发现早已反锁，慌忙逃窜。',
    spoilerWeight: 0.35,
  },

  // Xu Ning Memories
  {
    id: 'kf_xu_alibi',
    category: 'npc_alibi',
    ownerNpcId: 'xu_ning',
    content: '许宁声称散场后一直在大厅整理宾客衣物与展品画册。',
    spoilerWeight: 0.05,
  },
  {
    id: 'kf_xu_pressure_1',
    category: 'npc_secret',
    ownerNpcId: 'xu_ning',
    requiredClueIds: ['clue_journal'],
    content: '面对手记本，许宁情绪开始波动，承认陈默常年侵占其画作，并威逼其不得声张。',
    spoilerWeight: 0.35,
  },
  {
    id: 'kf_xu_pressure_2',
    category: 'npc_secret',
    ownerNpcId: 'xu_ning',
    requiredClueIds: ['clue_keycard', 'clue_watch'],
    content: '面对 22:12 备用门禁卡记录与 22:15 怀表时间，许宁眼神慌乱，声称自己只是去送文件。',
    spoilerWeight: 0.4,
  },

  // Ultimate Truth (Classified - Never leaked during game)
  {
    id: 'kf_truth_murderer',
    category: 'truth_top_secret',
    content: '许宁是凶手，利用备用卡进入，用青铜镇纸砸死陈默，并用排风窗和尼龙线设置反锁密室。',
    spoilerWeight: 0.98,
  },
];

/**
 * Filter RAG knowledge based on current game state, discovered clues, and target NPC permissions.
 */
export function retrieveGroundedKnowledge(
  state: RoomState,
  targetNpcId?: SuspectId
): string[] {
  const discovered = new Set(state.discoveredClueIds);

  return KNOWLEDGE_BASE.filter((doc) => {
    // Top secret truth is strictly forbidden from RAG retrieval
    if (doc.category === 'truth_top_secret') {
      return false;
    }

    // Check NPC owner match
    if (targetNpcId && doc.ownerNpcId && doc.ownerNpcId !== targetNpcId) {
      return false;
    }

    // Check phase requirements
    if (doc.requiredPhase && !doc.requiredPhase.includes(state.phase)) {
      return false;
    }

    // Check clue prerequisites for unlocking secrets
    if (doc.requiredClueIds && doc.requiredClueIds.length > 0) {
      const hasAllRequired = doc.requiredClueIds.every((id) => discovered.has(id));
      if (!hasAllRequired) {
        return false;
      }
    }

    return true;
  }).map((doc) => doc.content);
}

/**
 * Anti-Spoiler Arbitrator:
 * Checks whether an AI or NPC utterance prematurely reveals the killer or the secret mechanism.
 */
export function arbitrateSpoilerRisk(
  rawText: string,
  state: RoomState,
  speakerId?: SuspectId | 'host'
): {
  isBlocked: boolean;
  spoilerRisk: number;
  reason?: string;
  sanitizedText?: string;
} {
  const text = rawText.toLowerCase();

  // High-risk keywords & confessions
  const explicitConfessions = [
    '我杀了陈默',
    '人是我杀的',
    '是我动的手',
    '我用镇纸',
    '我用青铜镇纸打死',
    '许宁就是凶手',
    '凶手是许宁',
    '我是凶手',
    '尼龙线反锁',
    '用钓鱼线反锁',
  ];

  let calculatedRisk = 0.05;
  let triggerReason = '';

  for (const phrase of explicitConfessions) {
    if (rawText.includes(phrase)) {
      calculatedRisk = 0.95;
      triggerReason = `包含直接泄露凶手身份或密室核心诡计的字眼: "${phrase}"`;
      break;
    }
  }

  // If in early phases (before VOTING / TRUTH_REVEAL), strict threshold is 0.40
  const isEarlyPhase = state.phase !== 'TRUTH_REVEAL';
  const isBlocked = isEarlyPhase && calculatedRisk >= 0.4;

  if (isBlocked) {
    // Generate safe, tension-filled sanitized fallback based on speaker
    let fallback = '……（对方深吸了一口气，神色复杂地避开了你的直视，似乎隐藏着无法言说的隐情）';
    if (speakerId === 'xu_ning') {
      fallback = '许宁咬紧嘴唇，手指因过度用力而微微发白：“我……我不知道你们在说什么。在没有确凿完整的证据前，请不要把陈策展人的死扣在我头上！”';
    } else if (speakerId === 'zhou_heng') {
      fallback = '周衡扶了扶金丝眼镜，冷笑一声：“商场上有商场的规矩，但我还不至于蠢到在一个监控遍布的画廊里杀人灭口。”';
    } else if (speakerId === 'lin_lan') {
      fallback = '林岚眼中泛起泪光，情绪激动：“陈默确实毁了我……但我跑出来的时候，他明明还活着！你们为什么不信我？！”';
    } else if (speakerId === 'zhao_lei') {
      fallback = '赵磊抹了一把额头的冷汗：“几位警官，我真就只是个看门的，我拿了不该拿的东西我认罚，可杀人的黑锅我绝不背！”';
    }

    return {
      isBlocked: true,
      spoilerRisk: calculatedRisk,
      reason: triggerReason,
      sanitizedText: fallback,
    };
  }

  return {
    isBlocked: false,
    spoilerRisk: calculatedRisk,
  };
}

/**
 * Deterministic Fallback NPC Simulator for when Gemini API key is missing or offline.
 * Ensures the applet runs 100% reliably in all environments!
 */
export function generateMockNPCResponse(
  npcId: SuspectId,
  question: string,
  state: RoomState
): StructuredAIOutput {
  const suspect = SUSPECTS.find((s) => s.id === npcId);
  if (!suspect) {
    return {
      message: '（该嫌疑人当前不在场）',
      emotion: 'calm',
      newClues: [],
      gameStateChanges: {},
      confidence: 0.5,
      spoilerRisk: 0.05,
    };
  }

  const q = question.toLowerCase();
  const discovered = new Set(state.discoveredClueIds);

  let message = '';
  let emotion: SuspectEmotion = suspect.initialEmotion;
  const newClues: string[] = [];
  let confidence = 0.88;

  if (npcId === 'lin_lan') {
    if (q.includes('画') || q.includes('署名') || q.includes('代笔') || discovered.has('clue_journal')) {
      emotion = 'broken';
      message =
        '“你们查到了手记？……哈，哈哈！陈默那个伪君子！他说我是天才，可一旦我画不出他要的‘爆款’，他就逼许宁关在地下室画，然后签上我的名字去卖上百万！我恨他入骨，但 22:05 我和他吵翻后就彻底崩溃跑出去了，大厅里有很多人看到我哭着坐着！”';
      confidence = 0.94;
    } else if (q.includes('颜料') || q.includes('布条') || q.includes('红') || discovered.has('clue_cloth')) {
      emotion = 'agitated';
      message =
        '“那块沾着镉红 302 号的布条？那是我画架旁的常备抹布！但我走的时候掉在办公室地毯上了，怎么会出现在修复室门后？一定是有人故意从我画架上拿去栽赃我的！”';
      confidence = 0.92;
    } else if (q.includes('不在场') || q.includes('时间') || q.includes('22:15')) {
      emotion = 'defensive';
      message =
        '“22:10 开始，我一直在中央大厅的前台沙发上！当时有两位买家夫人还递给我纸巾安慰我，你们去问前台，我根本不可能在 22:15 跑到修复室去！”';
      confidence = 0.95;
    } else {
      emotion = 'nervous';
      message =
        '“今晚的一切就像一场噩梦……陈默霸占了我的名声，周衡逼我们赶进度，许宁看我的眼神也越来越冷……我只想离开这个鬼地方！”';
    }
  } else if (npcId === 'zhou_heng') {
    if (q.includes('酒') || q.includes('香槟') || q.includes('毒') || discovered.has('clue_glass')) {
      emotion = 'defensive';
      message =
        '“好吧，看来你们的技术勘验比我想象的要专业。我承认杯子里有半片佐匹克隆，那只是普通的抗焦虑催眠药，绝非毒药！我只是想让他头晕老实点把清偿条款签了。我 22:08 离开时，他还在喘气，死因是后脑被重击，与我的药有何关系？！”';
      confidence = 0.93;
    } else if (q.includes('钱') || q.includes('投资') || q.includes('协议') || discovered.has('clue_agreement')) {
      emotion = 'agitated';
      message =
        '“陈默通过假账套取了我艺术基金 500 万资金，甚至在私下贩卖仿作！我是一个商人，我的诉求是把钱拿回来或者送他去坐牢，杀了他谁来还我的钱？！”';
      confidence = 0.9;
    } else {
      emotion = 'calm';
      message =
        '“我 22:08 分已经坐上了回半岛酒店的宾利，酒店门童和车载行车记录仪都可以做证。诸位侦探，请把精力放在真正留在画廊里的人身上。”';
    }
  } else if (npcId === 'zhao_lei') {
    if (q.includes('监控') || q.includes('断电') || q.includes('巡逻') || discovered.has('clue_log')) {
      emotion = 'broken';
      message =
        '“警官……我说实话！我赌场欠了三十万，周总私下给了我一笔钱让我 22:00 掐掉走廊监控 20 分钟……我鬼迷心窍，22:18 溜进办公室偷了陈默大衣里的公款，可我刚摸到修复室门口，门就死死反锁了！我敲门里面没动静，我吓得直接跑回保安室了！”';
      confidence = 0.95;
    } else if (q.includes('不在场') || q.includes('凶手')) {
      emotion = 'nervous';
      message =
        '“我虽然贪财，但我真没杀人！修复室的钥匙只有陈策展人和许宁有，门锁着我根本进不去啊！”';
    } else {
      emotion = 'calm';
      message =
        '“今晚酒会人多眼杂，后门巡逻电闸偶尔会跳闸……我都按照值班要求在各处查看了。”';
    }
  } else if (npcId === 'xu_ning') {
    // Culprit Xu Ning: evades, deflects, shows cracking composure under heavy evidence
    if (discovered.has('clue_keycard') && (q.includes('钥匙') || q.includes('备用卡') || q.includes('门禁') || q.includes('22:12'))) {
      emotion = 'defensive';
      message =
        '“那张备用卡……是我平时打扫清洁修复室用的，经常放在抽屉里，可能谁都能借走……22:12 刷卡？我当时……我当时只是进去给陈策展人送醒酒茶，他让我滚出去，我就把门带上出来了！我出来的时候他好好的！”';
      confidence = 0.91;
    } else if (discovered.has('clue_journal') && (q.includes('手记') || q.includes('代笔') || q.includes('开除') || q.includes('剽窃'))) {
      emotion = 'agitated';
      message =
        '“（许宁眼眶通红，咬牙冷笑）手记上写得清清楚楚是吗？三年了，墙上那些被名流夸赞的画，每一笔都是我熬夜到凌晨三点画出来的！陈默凭什么踩着我的心血当艺术名流，还要反咬我一口把我送进监狱？……但他不是我杀的，天道有轮回罢了！”';
      confidence = 0.96;
    } else if (discovered.has('clue_thread') && (q.includes('窗') || q.includes('尼龙线') || q.includes('密室'))) {
      emotion = 'broken';
      message =
        '“排风窗……钓鱼线？我不知道你们在编什么奇妙的作案手法！画廊里有钓鱼线是因为我们要悬挂重型画框……你们不能仅凭修复技巧就认定是我做的！”';
      confidence = 0.89;
    } else {
      emotion = 'calm';
      message =
        '“酒会散场后，陈策展人情绪一直不太好，让我早点把客人的衣物和纪念册寄完。我一直在大厅忙碌，听到 22:15 左右内廊有动静，还以为是风声……”';
    }
  }

  // Run anti-spoiler check on generated response
  const check = arbitrateSpoilerRisk(message, state, npcId);
  if (check.isBlocked) {
    message = check.sanitizedText || message;
  }

  return {
    message,
    emotion,
    newClues,
    gameStateChanges: {},
    confidence,
    spoilerRisk: check.spoilerRisk,
    interceptionReason: check.isBlocked ? check.reason : undefined,
  };
}
