import { SuspectId, RoomLocationId } from '../types/game';

export type SceneId = 'gallery-hall' | 'restoration-room' | 'office' | 'security-room';

export interface SceneExit {
  id: string;
  label: string;
  targetSceneId: SceneId;
  x: number; // percentage 0-100 on the image
  y: number; // percentage 0-100 on the image
  description?: string;
  locked?: boolean;
  lockReason?: string;
}

export interface SceneHotspot {
  id: string;
  x: number; // percentage 0-100
  y: number; // percentage 0-100
  label: string;
  type: 'clue' | 'exit' | 'inspect' | 'npc';
  clueId?: string;
  targetSceneId?: SceneId;
  npcId?: SuspectId;
  description: string;
  detail?: string;
  unlocked?: boolean;
}

export interface SceneConfig {
  id: SceneId;
  legacyLocationId: RoomLocationId;
  title: string;
  subtitle: string;
  image: string;
  ambientDescription: string;
  unlocked: boolean;
  unlockRequirement?: string;
  requiredClueId?: string;
  exits: SceneExit[];
  hotspots: SceneHotspot[];
  presentNpcIds: SuspectId[];
  isCrimeScene?: boolean;
}

export const SCENE_CONFIGS: Record<SceneId, SceneConfig> = {
  'gallery-hall': {
    id: 'gallery-hall',
    legacyLocationId: 'main_hall',
    title: '中央艺术展厅',
    subtitle: '开幕酒会散场后的主展示厅',
    image: '/assets/scenes/gallery-hall.jpg',
    ambientDescription:
      '灯火阑珊的豪华现代展厅，实木地板倒映着射灯暖光。吧台上残留着开幕酒会的香槟酒杯，远处的拱门分别通往命案修复室、策展人办公室与安保室。',
    unlocked: true,
    isCrimeScene: false,
    presentNpcIds: ['lin_lan'],
    exits: [
      {
        id: 'exit-to-restoration',
        label: '前往文物修复室（命案现场）',
        targetSceneId: 'restoration-room',
        x: 76,
        y: 50,
        description: '被警方警戒封条锁闭的重型双开防盗门，内侧即为策展人陈默遇害的修复室。',
      },
      {
        id: 'exit-to-office',
        label: '前往策展人办公室',
        targetSceneId: 'office',
        x: 90,
        y: 54,
        description: '右侧走廊深处的磨砂玻璃双开门，门头挂着「私密会客室」铭牌。',
      },
      {
        id: 'exit-to-security',
        label: '前往安保监控室',
        targetSceneId: 'security-room',
        x: 56,
        y: 52,
        description: '中央拱廊内侧的防火铁门，连通后勤与全馆电力监控中枢。',
      },
    ],
    hotspots: [
      {
        id: 'hs-champagne-glass',
        x: 37,
        y: 64,
        label: '吧台翻倒的香槟杯',
        type: 'clue',
        clueId: 'clue_glass',
        description: '吧台大理石台面上翻倒的高脚杯，杯沿残留少许白色晶体粉末与一枚完整食指指纹。',
        detail: '化验报告显示粉末为佐匹克隆速效镇静剂，杯壁提取出周衡的清晰指纹。',
      },
      {
        id: 'hs-shredded-contract',
        x: 29,
        y: 76,
        label: '地面垃圾桶碎片',
        type: 'clue',
        clueId: 'clue_agreement',
        description: '散落在吧台角落被撕成碎片的打印件，依稀可见「投资清偿条款」与「500万」字样。',
        detail: '拼凑后证实为周衡要求陈默归还画展挪用资金的补充协议，双方当晚发生了激烈争吵。',
      },
      {
        id: 'hs-featured-painting',
        x: 13,
        y: 45,
        label: '焦点展出油画《微光》',
        type: 'inspect',
        description: '本次画展的主打巨幅先锋油画，署名为青年画家林岚，笔触细腻而有古典功底。',
        detail: '仔细观察发现，其底层罩染画法与修复室内许宁的工作手稿呈现完全相同的笔压习惯！',
      },
      {
        id: 'hs-linlan-npc',
        x: 23,
        y: 62,
        label: '林岚（知名画家）',
        type: 'npc',
        npcId: 'lin_lan',
        description: '林岚独自坐在吧台一角的贵宾椅上，脸色苍白，手指紧扣着手包。',
      },
    ],
  },

  'restoration-room': {
    id: 'restoration-room',
    legacyLocationId: 'restoration_room',
    title: '文物修复室',
    subtitle: '反锁封闭的命案第一现场',
    image: '/assets/scenes/restoration-room.jpg',
    ambientDescription:
      '画廊最内侧的密闭恒温工坊，空气中弥漫着浓烈的松节油与古旧木料气味。死者陈默倒在画架旁，金色怀表、破碎颜料盘散落一地。',
    unlocked: true,
    isCrimeScene: true,
    presentNpcIds: ['xu_ning'],
    exits: [
      {
        id: 'exit-to-hall-from-repair',
        label: '返回中央艺术展厅',
        targetSceneId: 'gallery-hall',
        x: 11,
        y: 46,
        description: '贴有醒目黄色警用警戒封条的防盗重门，通往展厅主廊。',
      },
    ],
    hotspots: [
      {
        id: 'hs-gold-watch',
        x: 54,
        y: 86,
        label: '停摆的古董金怀表',
        type: 'clue',
        clueId: 'clue_watch',
        description: '死者贴身携带的古董怀表，受强力钝击后齿轮卡死，指针精准定格在 22:15。',
        detail: '受害者头部重创与怀表撞击地面发生在同一瞬间，精准标定了致死行凶时间为 22:15。',
      },
      {
        id: 'hs-cadmium-cloth',
        x: 24,
        y: 89,
        label: '沾染镉红颜料的抹布',
        type: 'clue',
        clueId: 'clue_cloth',
        description: '被揉成团塞在调色板旁角落的抹布，浸透法国定制「镉红 302 号」高纯度颜料。',
        detail: '此颜料为林岚本次画展独家配给，但抹布平时由负责清洗工具的助理许宁保管。',
      },
      {
        id: 'hs-vent-thread',
        x: 52,
        y: 14,
        label: '高位排气窗与悬挂尼龙线',
        type: 'clue',
        clueId: 'clue_thread',
        description: '离地 2.8 米的排风小窗半开，窗框暗锁上系着一段极细的高拉力透明尼龙钓线。',
        detail: '凶手在击打死者后走出大门，从窗外拉扯尼龙线将门内插销拉下锁死，制造了密室假象！',
      },
      {
        id: 'hs-easel-canvas',
        x: 41,
        y: 46,
        label: '修复架上的古画半成品',
        type: 'inspect',
        description: '画架上固定着待修复的明代古画，画框边缘被重新固定过，旁边放着固定专用的尼龙线卷。',
      },
      {
        id: 'hs-xuning-npc',
        x: 74,
        y: 58,
        label: '许宁（画廊助理）',
        type: 'npc',
        npcId: 'xu_ning',
        description: '许宁静静立在修复台旁，低头注视着地面的散落工具，神情显得异常平静。',
      },
    ],
  },

  'office': {
    id: 'office',
    legacyLocationId: 'curator_office',
    title: '策展人办公室',
    subtitle: '陈默的私人会客与机要室',
    image: '/assets/scenes/office.jpg',
    ambientDescription:
      '暗色红木装潢的豪华书斋，书柜摆满绝版画册。办公桌台灯依然亮着，抽屉半开，空气中飘散着威士忌与古龙水的微苦香气。',
    unlocked: true,
    isCrimeScene: false,
    presentNpcIds: ['zhou_heng'],
    exits: [
      {
        id: 'exit-to-hall-from-office',
        label: '返回中央艺术展厅',
        targetSceneId: 'gallery-hall',
        x: 10,
        y: 44,
        description: '带有「PRIVATE」磨砂金字的厚重玻璃门，通往展厅外廊。',
      },
    ],
    hotspots: [
      {
        id: 'hs-hidden-keycard',
        x: 58,
        y: 85,
        label: '抽屉夹层备用门禁卡',
        type: 'clue',
        clueId: 'clue_keycard',
        description: '从桌下暗格中滑出的电子权限卡，芯片读取出今晚 22:12 刷开修复室大门的记录。',
        detail: '全画廊仅两张卡具有修复室权限，该卡边缘沾有许宁常用的护手霜成分，且刷卡时间在行凶前 3 分钟！',
      },
      {
        id: 'hs-secret-journal',
        x: 65,
        y: 70,
        label: '策展人私密手记',
        type: 'clue',
        clueId: 'clue_journal',
        description: '摊开在皮质垫板上的手写真迹，记载了陈默威逼许宁长期为林岚代笔的完整内幕。',
        detail: '手记写道：“许宁今晚要求解约并署名，必须彻底毁掉她的原创底稿……”揭示了许宁致命的杀人动机。',
      },
      {
        id: 'hs-desk-agreements',
        x: 44,
        y: 66,
        label: '桌上的财务审计清偿函',
        type: 'inspect',
        description: '周衡带来的经侦调查备忘录，限令陈默在今夜交出挪用的 500 万款项。',
      },
      {
        id: 'hs-zhouheng-npc',
        x: 77,
        y: 58,
        label: '周衡（画廊投资人）',
        type: 'npc',
        npcId: 'zhou_heng',
        description: '周衡坐在深红皮沙发上，目光冷峻地审视着进入办公室的每一个人。',
      },
    ],
  },

  'security-room': {
    id: 'security-room',
    legacyLocationId: 'security_room',
    title: '安保监控与设备室',
    subtitle: '全画廊视频安防与配电控制台',
    image: '/assets/scenes/security-room.jpg',
    ambientDescription:
      '昏暗闪烁的监控中控室，荧光屏的冷光映照着控制台。多路走廊摄像头正运转着，唯独通往修复室的关键通道在关键时段呈现雪花杂波。',
    unlocked: true,
    isCrimeScene: false,
    presentNpcIds: ['zhao_lei'],
    exits: [
      {
        id: 'exit-to-hall-from-sec',
        label: '返回中央艺术展厅',
        targetSceneId: 'gallery-hall',
        x: 9,
        y: 60,
        description: '通往外部回廊的防火铁门。',
      },
    ],
    hotspots: [
      {
        id: 'hs-patrol-clipboard',
        x: 35,
        y: 84,
        label: '巡逻值班记录夹',
        type: 'clue',
        clueId: 'clue_log',
        description: '铁制夹板上的夜班签到表，记载了监控在 22:00 至 22:20 存在 20 分钟录制盲区。',
        detail: '保安赵磊声称在外回廊巡逻，但系统日志记录下总控电源曾被手动短路分闸。',
      },
      {
        id: 'hs-flicker-screen',
        x: 36,
        y: 42,
        label: '闪烁雪花的 2 号监控屏',
        type: 'inspect',
        description: '对准修复室走廊的摄像头，画面在 22:00 突遭断电信号干扰，22:20 恢复正常。',
      },
      {
        id: 'hs-breaker-box',
        x: 79,
        y: 34,
        label: '后院配电箱总闸分路',
        type: 'inspect',
        description: '监控专用供电空开有扳动磨损痕迹，锁孔上插着保安赵磊的随身折叠小刀。',
      },
      {
        id: 'hs-zhaolei-npc',
        x: 55,
        y: 72,
        label: '赵磊（安保主管）',
        type: 'npc',
        npcId: 'zhao_lei',
        description: '赵磊守在对讲机旁，手里握着强光手电，眼神闪烁不安。',
      },
    ],
  },
};
