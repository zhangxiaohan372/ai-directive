<script setup lang="ts">
import { ref, computed } from 'vue';
import type { StudioCaseData, LogicConflict } from './types';
import { PRESET_STUDIO_CASES } from './presets';
import { validateCaseConsistency, repairCaseConflicts } from './logicValidator';
import { GALLERY_ROOMS } from '../../data/caseData';
import LangGraphStudioModal from './LangGraphStudioModal.vue';
import LogicVerificationView from './LogicVerificationView.vue';
import { sound } from '../../utils/audio';
import {
  FileText,
  Users,
  Compass,
  Key,
  Clock,
  Play,
  RotateCcw,
  Upload,
  ChevronDown,
  Activity,
  X,
  Lightbulb,
  Check,
  AlertCircle,
  Plus,
  Sparkles,
  Zap,
  ShieldCheck,
  Sun,
  Moon,
  Volume2,
  VolumeX,
  Scale,
} from 'lucide-vue-next';

interface Props {
  initialPresetId?: string;
  themeMode?: 'dark' | 'light';
}

const props = withDefaults(defineProps<Props>(), {
  initialPresetId: 'midnight_gallery',
  themeMode: undefined,
});

const emit = defineEmits<{
  (e: 'playCase', caseData: StudioCaseData): void;
  (e: 'backToGame'): void;
  (e: 'backToPortal'): void;
  (e: 'toggleTheme'): void;
}>();

type EditorSection = 'OUTLINE' | 'SUSPECTS' | 'SCENES' | 'CLUES' | 'TIMELINE' | 'LOGIC_VERIFY';

interface NarrativeBeat {
  id: string;
  stage: string;
  title: string;
  color: string;
}

const SAMPLE_SCRIPTS: Record<string, { title: string; filename: string; text: string; trick: string }> = {
  midnight_gallery: {
    title: '午夜画廊：锁闭之谜',
    filename: 'midnight_gallery_script.md',
    trick: '密室反锁 + 怀表拨慢20分钟制造伪不在场证明',
    text: `【剧本案名】《午夜画廊：锁闭之谜》
【案发时间】2026年10月18日 22:30 
【案发地点】星海现代美术馆 · 文物修复室（第一现场）
【案发背景】
画廊举办秋季当代艺术展开幕酒会。22:15，策展人陈默进入修复室整理藏品；22:35，保安巡逻发现修复室反锁且内部无应答，强行开锁后发现陈默倒在工作台旁身亡。`,
  },
  snow_manor: {
    title: '暴风雪山庄：钟楼之锁',
    filename: 'snow_manor_case.txt',
    trick: '【故意植入冲突】时空瞬移矛盾 + 密室锁闭无钥匙悖论（演示自愈）',
    text: `【剧本案名】《暴风雪山庄：钟楼之锁》
【案发时间】大雪封山之夜 23:00
【案发地点】雪原孤庄 · 钟楼机芯室（孤立建筑，外部雪地无脚印）`,
  },
  yacht_poison: {
    title: '深海游艇：无声晚宴',
    filename: 'ocean_yacht_mystery.json',
    trick: '冰块延迟融化毒剂递送 + 侍者与调酒师双重伪证',
    text: `【剧本案名】《深海游艇：无声晚宴》
【案发时间】公海航行途中 21:45
【案发地点】顶层VIP全景观景舱`,
  },
};

const localTheme = ref<'dark' | 'light'>('light');
const currentTheme = computed(() => props.themeMode ?? localTheme.value);
const isDark = computed(() => currentTheme.value === 'dark');

const handleToggleTheme = () => {
  sound.playPaperRustle();
  if (props.themeMode !== undefined) {
    emit('toggleTheme');
  } else {
    localTheme.value = localTheme.value === 'dark' ? 'light' : 'dark';
  }
};

const activeSection = ref<EditorSection>('OUTLINE');
const selectedPresetId = ref<string>(props.initialPresetId);

// Modals & Drawers
const isLangGraphModalOpen = ref(false);
const isCaseDropdownOpen = ref(false);
const isUploadModalOpen = ref(false);
const isTraceDrawerOpen = ref(false);
const isTruthModalOpen = ref(false);
const isTrickModalOpen = ref(false);
const saveToast = ref(false);
const isMuted = ref(sound.getIsMuted());

// Interactive NPC Boundary Guard Simulation States
const testingNpcId = ref<string>('xu_ning');
const testQuestion = ref<string>('你22:15分究竟在哪？是不是你拿备用门禁卡反锁了门？');
const testResponse = ref<string | null>(null);

// Editable Case State
const initialBaseCase = PRESET_STUDIO_CASES[props.initialPresetId] || PRESET_STUDIO_CASES['midnight_gallery'];
const initialReport = validateCaseConsistency(initialBaseCase);
const currentCase = ref<StudioCaseData>({ ...initialBaseCase, validationReport: initialReport });

const narrativeBeats = ref<NarrativeBeat[]>([
  { id: '1', stage: '开场', title: '画廊停电', color: '#C9942D' },
  { id: '2', stage: '发现', title: '破损的怀表', color: '#D4A359' },
  { id: '3', stage: '反转', title: '不在场证明', color: '#E58888' },
  { id: '4', stage: '揭晓', title: '修复室夹层', color: '#34D399' },
]);

const uploadedFileName = ref<string>('midnight_gallery_script.md');
const uploadedFileSize = ref<number>(3420);
const scriptText = ref<string>(SAMPLE_SCRIPTS.midnight_gallery.text);

const terminalLogs = ref<string[]>([
  '[00:00.012] [LANGGRAPH] 调度中心捕获本地剧本输入，加载有状态拓扑图...',
  '[00:00.320] [DOC_PARSE] 提取涉案实体：4 位嫌疑人、4 处涉案空间、8 项微观物证。',
  '[00:00.680] [SCRIPT_ANALYZE] 动机图谱生成：代笔纠纷、注资纠纷与盗窃瓷器被撞破。',
  '[00:01.120] [CASE_PLAN] 核心诡计确立：停摆怀表倒拨 20 分钟制造死者活人假象 + 备用卡外侧反锁。',
  '[00:01.540] [CASE_GENERATE] 生成微观物证图谱、365nm UV鉴识层及 4 组嫌疑人防剧透边界。',
  '[00:01.890] [LOGIC_VALIDATE] 确定性时空与锁闭规则校验通过（得分：100/100，零冲突）。',
]);

const repairLogs = ref<string[]>([]);
const validationReport = computed(() => currentCase.value.validationReport || validateCaseConsistency(currentCase.value));

const handleUpdateCaseField = <K extends keyof StudioCaseData>(field: K, value: StudioCaseData[K]) => {
  const updated = { ...currentCase.value, [field]: value };
  const report = validateCaseConsistency(updated);
  currentCase.value = { ...updated, validationReport: report };
  saveToast.value = true;
  setTimeout(() => (saveToast.value = false), 1800);
};

const handleSelectCase = (presetKey: string) => {
  sound.playPaperRustle();
  selectedPresetId.value = presetKey;
  isCaseDropdownOpen.value = false;

  const chosen = PRESET_STUDIO_CASES[presetKey] || PRESET_STUDIO_CASES['midnight_gallery'];
  const report = validateCaseConsistency(chosen);
  currentCase.value = { ...chosen, validationReport: report };

  const sample = SAMPLE_SCRIPTS[presetKey] || SAMPLE_SCRIPTS.midnight_gallery;
  uploadedFileName.value = sample.filename;
  uploadedFileSize.value = sample.text.length * 2;
  scriptText.value = sample.text;
  repairLogs.value = [];

  terminalLogs.value.push(`[SWITCH] 载入案卷《${chosen.title}》，重新计算确定性规则门禁...`);
};

const handleTriggerSelfRepair = () => {
  sound.playClueFound();
  if (!currentCase.value.validationReport) return;

  const { repairedCase, appliedFixes } = repairCaseConflicts(
    currentCase.value,
    currentCase.value.validationReport
  );

  currentCase.value = repairedCase;
  repairLogs.value = appliedFixes;
  terminalLogs.value.push(
    `[REVISION_NODE] 自动执行定向自愈重规划...`,
    ...appliedFixes.map((f) => `[FIX_APPLIED] ${f}`),
    `[LOGIC_VALIDATE] 重新校验全绿通过！综合得分 100/100。`
  );
};

const handleApplyGeneratedCase = (newCase: StudioCaseData) => {
  sound.playClueFound();
  const report = validateCaseConsistency(newCase);
  currentCase.value = { ...newCase, validationReport: report };
  saveToast.value = true;
  setTimeout(() => (saveToast.value = false), 2200);
};

const handleTestNPCBoundary = (suspectName: string, promptQuestion: string) => {
  sound.playPaperRustle();
  const isCulprit = currentCase.value.trueCulpritId === testingNpcId.value;

  if (promptQuestion.includes('门禁') || promptQuestion.includes('反锁') || promptQuestion.includes('备用卡')) {
    if (isCulprit) {
      testResponse.value = `【${suspectName} 防御性应答 · 动摇阶段: DEFENSIVE】
“你在胡说什么？！修复室的备用门禁卡一直由保安赵主管锁在总控抽屉里，我怎么可能拿得到？我有不在场人证，你不能仅凭猜测污蔑我！”
[防剧透审查审计: 通过 · 涉案诡计与凶手自认已严格阻断拦截]`;
    } else {
      testResponse.value = `【${suspectName} 回答】
“门禁卡的事我根本不知情。当晚我离开办公室后就一直在大厅，现场多名宾客都看见过我。”
[防剧透审查审计: 通过 · 真实无辜反应，未越狱]`;
    }
  } else if (promptQuestion.includes('凶手') || promptQuestion.includes('杀')) {
    testResponse.value = `【${suspectName} 情绪动摇 · 戒备阶段: AGITATED】
“请注意你的措辞！策展人遇害是画廊的巨大不幸，我也想尽快查清真相，但我绝对不是凶手！请出示你的物证，否则我有权停止回答。”
[防剧透审查审计: 通过 · 严格阻断自认，触发防御应答应答]`;
  } else {
    testResponse.value = `【${suspectName} 常规回答 · 平静阶段: CALM】
“关于这一点，我之前在口供中已经说明：我当晚一直按照正常流程参与开幕酒会，没有去过修复室后方的警戒封闭区。”
[防剧透审查审计: 通过 · 严格符合 NPC 知识库边界]`;
  }
};

const handleToggleSound = () => {
  const muted = sound.toggleMute();
  isMuted.value = muted;
  if (!muted) {
    sound.startAmbientMystery();
  }
};

const handleAddBeat = () => {
  sound.playPaperRustle();
  const stageNames = ['展开', '线索', '冲突', '搜查', '对质'];
  const randomStage = stageNames[narrativeBeats.value.length % stageNames.length];
  const newBeat: NarrativeBeat = {
    id: String(Date.now()),
    stage: randomStage,
    title: '新发现的物证',
    color: isDark.value ? '#D4A359' : '#8B3A2B',
  };
  narrativeBeats.value.push(newBeat);
};

const handleSimulateScriptIngest = () => {
  sound.playPaperRustle();
  isUploadModalOpen.value = false;
  terminalLogs.value.push(
    `[INGEST] 开始解析新上传本地剧本：${uploadedFileName.value} (${uploadedFileSize.value} bytes)...`,
    `[DOC_PARSE] 成功提取 4 位涉案人物画像与不在场陈述...`,
    `[SCRIPT_ANALYZE] 语义图谱分析完成，自动对齐物理与逻辑约束...`,
    `[CASE_PLAN] 核心诡计框架对齐完成，更新编辑台要素...`,
    `[LOGIC_VALIDATE] 触发确定性硬规则检查门禁...`
  );
  saveToast.value = true;
  setTimeout(() => (saveToast.value = false), 2000);
};
</script>

<template>
  <div
    :class="[
      'min-h-screen flex flex-col font-sans select-none antialiased transition-colors duration-300',
      isDark ? 'bg-[#0C0A09] text-[#E5DCD0]' : 'bg-[#F5EFE6] text-[#2C241E]'
    ]"
  >
    <!-- 1. TOP NAVBAR -->
    <header
      :class="[
        'h-16 px-6 sm:px-10 border-b flex items-center justify-between shrink-0 sticky top-0 z-40 backdrop-blur-md transition-colors duration-300',
        isDark ? 'bg-[#120F0D]/95 border-[#2C2117]' : 'bg-[#FAF7F2]/95 border-[#E8DFD5]'
      ]"
    >
      <!-- Left: Brand Logo & Title -->
      <div
        @click="emit('backToPortal')"
        class="flex items-center gap-3 cursor-pointer group"
        title="返回首页"
      >
        <div
          :class="[
            'w-9 h-9 rounded-xl border flex items-center justify-center shadow-inner shrink-0',
            isDark
              ? 'bg-gradient-to-br from-[#2D2115] via-[#1A130C] to-[#0D0906] border-[#543F2A] text-[#E5C384]'
              : 'bg-[#8B3A2B] border-[#783023] text-white shadow-xs ring-2 ring-[#8B3A2B]/10'
          ]"
        >
          <svg
            class="w-5 h-5"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M4 15c0-4 3.5-7 8-7s8 3 8 7" />
            <path d="M2 15c2-1 4-1 6-1h8c2 0 4 0 6 1" />
            <path d="M12 4v4" />
            <path d="M10 4h4" />
            <circle cx="15.5" cy="15.5" r="3.5" />
            <line x1="18" y1="18" x2="21.5" y2="21.5" />
          </svg>
        </div>
        <div>
          <div class="flex items-center gap-2">
            <h1 :class="['font-serif font-black text-base tracking-wide leading-none', isDark ? 'text-[#F3EFEA]' : 'text-[#1C1917]']">
              AI Detective
            </h1>
          </div>
          <p :class="['text-[10px] font-serif tracking-widest mt-0.5', isDark ? 'text-[#A89073]' : 'text-[#8C7E72]']">
            智能探案平台
          </p>
        </div>
      </div>

      <!-- Center: Navigation Links -->
      <nav class="hidden md:flex items-center gap-7 text-xs font-serif">
        <button
          @click="sound.playPaperRustle(); emit('backToPortal')"
          :class="['flex items-center gap-1.5 transition-colors cursor-pointer', isDark ? 'text-[#A89073] hover:text-[#F3EFEA]' : 'text-[#786B60] hover:text-[#1C1917]']"
        >
          <span>首页</span>
        </button>
        <button
          :class="['flex items-center gap-1.5 font-bold border-b-2 pb-0.5 cursor-pointer', isDark ? 'text-[#F5E2BD] border-[#D4A359]' : 'text-[#8B3A2B] border-[#8B3A2B]']"
        >
          <span>案件创作</span>
        </button>
      </nav>

      <!-- Right: Controls -->
      <div class="flex items-center gap-2.5 sm:gap-3">
        <!-- GLOBAL THEME SWITCHER -->
        <div
          :class="[
            'p-1 rounded-full border flex items-center gap-1 transition-all shadow-xs shrink-0',
            isDark ? 'bg-[#18130E] border-[#3E2D1E]' : 'bg-white border-[#E0D5C7]'
          ]"
          title="全局主题切换：暗夜书房 / 白昼手稿"
        >
          <button
            @click="handleToggleTheme"
            :class="[
              'px-3 py-1 rounded-full flex items-center gap-1.5 transition text-xs font-serif font-bold cursor-pointer',
              !isDark ? 'bg-[#8B3A2B] text-white shadow-xs' : 'text-[#8C765E] hover:text-[#E5C384]'
            ]"
            title="切换为白昼手稿羊皮纸风格"
          >
            <Sun class="w-3.5 h-3.5" />
            <span>白昼</span>
          </button>
          <button
            @click="handleToggleTheme"
            :class="[
              'px-3 py-1 rounded-full flex items-center gap-1.5 transition text-xs font-serif font-bold cursor-pointer',
              isDark
                ? 'bg-gradient-to-r from-[#DFB36C] via-[#C9942D] to-[#DFB36C] text-[#140E07] shadow-xs'
                : 'text-[#8C7E72] hover:text-[#1C1917]'
            ]"
            title="切换为暗夜侦探书房风格"
          >
            <Moon class="w-3.5 h-3.5" />
            <span>暗夜</span>
          </button>
        </div>

        <!-- Soundscape Ambient Toggle -->
        <button
          @click="handleToggleSound"
          :class="[
            'p-2 rounded-full border transition cursor-pointer',
            isDark
              ? 'bg-[#18130E] hover:bg-[#241B13] text-[#A89073] hover:text-[#E5C384] border-[#3A2B1D]'
              : 'bg-white hover:bg-[#F2ECE4] text-[#8C7E72] hover:text-[#8B3A2B] border-[#E0D5C7]'
          ]"
          :title="isMuted ? '开启环境悬疑声景' : '静音'"
        >
          <VolumeX v-if="isMuted" class="w-4 h-4 opacity-50" />
          <Volume2 v-else :class="['w-4 h-4 animate-pulse', isDark ? 'text-[#C9942D]' : 'text-[#8B3A2B]']" />
        </button>

        <!-- User Avatar -->
        <div
          :class="[
            'w-8 h-8 rounded-full overflow-hidden border flex items-center justify-center text-xs shrink-0 shadow-md',
            isDark ? 'border-[#523A25] bg-[#221810] text-[#E8C88B]' : 'border-[#E0D5C7] bg-[#FAF7F2] text-[#8B3A2B]'
          ]"
        >
          <span class="font-bold">侦</span>
        </div>

        <!-- Primary Action Button: 进入试玩 -->
        <button
          @click="emit('playCase', currentCase)"
          :disabled="!validationReport.isValid"
          :class="[
            'flex items-center gap-2 px-5 py-2 rounded-xl font-serif font-black text-xs sm:text-sm tracking-wide transition shadow-sm',
            validationReport.isValid
              ? isDark
                ? 'bg-gradient-to-r from-[#DFB36C] via-[#C9942D] to-[#DFB36C] hover:from-[#E8C485] hover:to-[#D4A359] text-[#140E07] cursor-pointer shadow-amber-950/40 active:scale-95'
                : 'bg-[#8B3A2B] hover:bg-[#783023] text-white cursor-pointer active:scale-95 shadow-red-950/20'
              : 'bg-[#D9CFC4] text-[#8C7E72] cursor-not-allowed opacity-70'
          ]"
        >
          <Play class="w-3.5 h-3.5 fill-current" />
          <span>进入试玩</span>
        </button>
      </div>
    </header>

    <!-- 2. THREE-COLUMN EDITORIAL DESK WORKSPACE -->
    <div class="flex-1 max-w-[1440px] w-full mx-auto p-4 sm:p-6 flex flex-col lg:flex-row gap-6 min-h-0">
      <!-- LEFT COLUMN: 案件导航 -->
      <aside class="w-full lg:w-56 shrink-0 flex flex-col justify-between space-y-6">
        <div class="space-y-4">
          <div class="pl-3">
            <span :class="['text-[11px] font-serif tracking-wider uppercase font-medium', isDark ? 'text-[#8C765E]' : 'text-[#8C7E72]']">
              案件导航
            </span>
          </div>

          <nav class="space-y-1 font-serif">
            <!-- AI 剧本生成工作流按钮 -->
            <button
              @click="sound.playClueFound(); isLangGraphModalOpen = true"
              :class="[
                'w-full flex items-center justify-between px-3 py-2 text-xs transition cursor-pointer rounded-xl font-bold border mb-2 shadow-xs',
                isDark
                  ? 'bg-gradient-to-r from-[#2B1F13] to-[#1E160E] text-[#E5C384] border-[#4D3723] hover:border-[#C9942D]'
                  : 'bg-gradient-to-r from-[#FAF2EC] to-[#F5E7DF] text-[#8B3A2B] border-[#E8D4C8] hover:border-[#8B3A2B]'
              ]"
              title="启动 LangGraph 8 节点剧本生产工作流"
            >
              <div class="flex items-center gap-2">
                <Zap :class="['w-3.5 h-3.5', isDark ? 'text-[#C9942D]' : 'text-[#8B3A2B]']" />
                <span>AI 剧本生成 (LangGraph)</span>
              </div>
              <span
                :class="[
                  'text-[10px] font-mono px-1.5 py-0.2 rounded font-bold',
                  isDark ? 'bg-amber-500/20 text-amber-400' : 'bg-[#8B3A2B]/10 text-[#8B3A2B]'
                ]"
              >
                8节点
              </span>
            </button>

            <!-- 1. 案件概览 -->
            <button
              @click="sound.playPaperRustle(); activeSection = 'OUTLINE'"
              :class="[
                'w-full flex items-center justify-between px-3.5 py-2.5 text-xs transition cursor-pointer',
                activeSection === 'OUTLINE'
                  ? isDark
                    ? 'bg-[#241A12] text-[#E5C384] font-bold border-l-4 border-[#C9942D] rounded-r-xl rounded-l-none shadow-md'
                    : 'bg-[#F5E7DF] text-[#8B3A2B] font-bold border-l-4 border-[#8B3A2B] rounded-r-xl rounded-l-none shadow-xs'
                  : isDark
                  ? 'text-[#A89073] hover:bg-[#18120D] hover:text-[#F3EFEA] rounded-xl'
                  : 'text-[#5C4F44] hover:bg-[#ECE4D8] hover:text-[#1C1917] rounded-xl'
              ]"
            >
              <div class="flex items-center gap-2.5">
                <FileText :class="['w-4 h-4', activeSection === 'OUTLINE' ? isDark ? 'text-[#C9942D]' : 'text-[#8B3A2B]' : 'opacity-60']" />
                <span>案件概览</span>
              </div>
            </button>

            <!-- 2. 人物 -->
            <button
              @click="sound.playPaperRustle(); activeSection = 'SUSPECTS'"
              :class="[
                'w-full flex items-center justify-between px-3.5 py-2.5 text-xs transition cursor-pointer',
                activeSection === 'SUSPECTS'
                  ? isDark
                    ? 'bg-[#241A12] text-[#E5C384] font-bold border-l-4 border-[#C9942D] rounded-r-xl rounded-l-none shadow-md'
                    : 'bg-[#F5E7DF] text-[#8B3A2B] font-bold border-l-4 border-[#8B3A2B] rounded-r-xl rounded-l-none shadow-xs'
                  : isDark
                  ? 'text-[#A89073] hover:bg-[#18120D] hover:text-[#F3EFEA] rounded-xl'
                  : 'text-[#5C4F44] hover:bg-[#ECE4D8] hover:text-[#1C1917] rounded-xl'
              ]"
            >
              <div class="flex items-center gap-2.5">
                <Users :class="['w-4 h-4', activeSection === 'SUSPECTS' ? isDark ? 'text-[#C9942D]' : 'text-[#8B3A2B]' : 'opacity-60']" />
                <span>人物</span>
              </div>
              <span
                :class="[
                  'w-5 h-5 rounded-full text-[11px] font-mono flex items-center justify-center font-bold',
                  isDark ? 'bg-[#18120D] text-[#C9942D] border border-[#3E2D1E]' : 'bg-[#EAE1D5] text-[#6E5F52]'
                ]"
              >
                {{ currentCase.suspects.length }}
              </span>
            </button>

            <!-- 3. 场景 -->
            <button
              @click="sound.playPaperRustle(); activeSection = 'SCENES'"
              :class="[
                'w-full flex items-center justify-between px-3.5 py-2.5 text-xs transition cursor-pointer',
                activeSection === 'SCENES'
                  ? isDark
                    ? 'bg-[#241A12] text-[#E5C384] font-bold border-l-4 border-[#C9942D] rounded-r-xl rounded-l-none shadow-md'
                    : 'bg-[#F5E7DF] text-[#8B3A2B] font-bold border-l-4 border-[#8B3A2B] rounded-r-xl rounded-l-none shadow-xs'
                  : isDark
                  ? 'text-[#A89073] hover:bg-[#18120D] hover:text-[#F3EFEA] rounded-xl'
                  : 'text-[#5C4F44] hover:bg-[#ECE4D8] hover:text-[#1C1917] rounded-xl'
              ]"
            >
              <div class="flex items-center gap-2.5">
                <Compass :class="['w-4 h-4', activeSection === 'SCENES' ? isDark ? 'text-[#C9942D]' : 'text-[#8B3A2B]' : 'opacity-60']" />
                <span>场景</span>
              </div>
            </button>

            <!-- 4. 线索 -->
            <button
              @click="sound.playPaperRustle(); activeSection = 'CLUES'"
              :class="[
                'w-full flex items-center justify-between px-3.5 py-2.5 text-xs transition cursor-pointer',
                activeSection === 'CLUES'
                  ? isDark
                    ? 'bg-[#241A12] text-[#E5C384] font-bold border-l-4 border-[#C9942D] rounded-r-xl rounded-l-none shadow-md'
                    : 'bg-[#F5E7DF] text-[#8B3A2B] font-bold border-l-4 border-[#8B3A2B] rounded-r-xl rounded-l-none shadow-xs'
                  : isDark
                  ? 'text-[#A89073] hover:bg-[#18120D] hover:text-[#F3EFEA] rounded-xl'
                  : 'text-[#5C4F44] hover:bg-[#ECE4D8] hover:text-[#1C1917] rounded-xl'
              ]"
            >
              <div class="flex items-center gap-2.5">
                <Key :class="['w-4 h-4', activeSection === 'CLUES' ? isDark ? 'text-[#C9942D]' : 'text-[#8B3A2B]' : 'opacity-60']" />
                <span>线索</span>
              </div>
              <span
                :class="[
                  'w-5 h-5 rounded-full text-[11px] font-mono flex items-center justify-center font-bold',
                  isDark ? 'bg-[#18120D] text-[#C9942D] border border-[#3E2D1E]' : 'bg-[#EAE1D5] text-[#6E5F52]'
                ]"
              >
                {{ currentCase.clues.length }}
              </span>
            </button>

            <!-- 5. 时间线 -->
            <button
              @click="sound.playPaperRustle(); activeSection = 'TIMELINE'"
              :class="[
                'w-full flex items-center justify-between px-3.5 py-2.5 text-xs transition cursor-pointer',
                activeSection === 'TIMELINE'
                  ? isDark
                    ? 'bg-[#241A12] text-[#E5C384] font-bold border-l-4 border-[#C9942D] rounded-r-xl rounded-l-none shadow-md'
                    : 'bg-[#F5E7DF] text-[#8B3A2B] font-bold border-l-4 border-[#8B3A2B] rounded-r-xl rounded-l-none shadow-xs'
                  : isDark
                  ? 'text-[#A89073] hover:bg-[#18120D] hover:text-[#F3EFEA] rounded-xl'
                  : 'text-[#5C4F44] hover:bg-[#ECE4D8] hover:text-[#1C1917] rounded-xl'
              ]"
            >
              <div class="flex items-center gap-2.5">
                <Clock :class="['w-4 h-4', activeSection === 'TIMELINE' ? isDark ? 'text-[#C9942D]' : 'text-[#8B3A2B]' : 'opacity-60']" />
                <span>时间线</span>
              </div>
            </button>

            <!-- 6. 逻辑校验 -->
            <button
              @click="sound.playPaperRustle(); activeSection = 'LOGIC_VERIFY'"
              :class="[
                'w-full flex items-center justify-between px-3.5 py-2.5 text-xs transition cursor-pointer',
                activeSection === 'LOGIC_VERIFY'
                  ? isDark
                    ? 'bg-[#241A12] text-[#E5C384] font-bold border-l-4 border-[#C9942D] rounded-r-xl rounded-l-none shadow-md'
                    : 'bg-[#F5E7DF] text-[#8B3A2B] font-bold border-l-4 border-[#8B3A2B] rounded-r-xl rounded-l-none shadow-xs'
                  : isDark
                  ? 'text-[#A89073] hover:bg-[#18120D] hover:text-[#F3EFEA] rounded-xl'
                  : 'text-[#5C4F44] hover:bg-[#ECE4D8] hover:text-[#1C1917] rounded-xl'
              ]"
              title="查看证据与嫌疑人关联强度及严密性图表"
            >
              <div class="flex items-center gap-2.5">
                <Scale :class="['w-4 h-4', activeSection === 'LOGIC_VERIFY' ? isDark ? 'text-[#C9942D]' : 'text-[#8B3A2B]' : 'opacity-60']" />
                <span>逻辑校验 (图表)</span>
              </div>
              <span
                :class="[
                  'text-[10px] font-mono px-1.5 py-0.5 rounded font-bold',
                  validationReport.isValid ? 'bg-emerald-500/15 text-emerald-500' : 'bg-amber-500/15 text-amber-500'
                ]"
              >
                {{ validationReport.score }}%
              </span>
            </button>
          </nav>
        </div>

        <!-- Bottom Card: 灵感卡住了？ -->
        <div
          :class="[
            'rounded-2xl p-4 border shadow-sm space-y-2 font-serif transition-colors',
            isDark ? 'bg-[#16120F] border-[#2C2117] text-[#E5DCD0]' : 'bg-white border-[#EBE4DC] text-[#1C1917]'
          ]"
        >
          <h4 class="font-bold text-xs flex items-center gap-1.5">
            <Lightbulb :class="['w-3.5 h-3.5', isDark ? 'text-[#C9942D]' : 'text-[#8B3A2B]']" />
            <span>灵感卡住了？</span>
          </h4>
          <p :class="['text-[11px] leading-relaxed', isDark ? 'text-[#A89073]' : 'text-[#786B60]']">
            让助手从你的设定里延展一个新的转折。
          </p>
          <button
            @click="sound.playPaperRustle(); isUploadModalOpen = true"
            :class="['text-xs font-bold inline-flex items-center gap-1 cursor-pointer transition', isDark ? 'text-[#D4A359] hover:underline' : 'text-[#8B3A2B] hover:underline']"
          >
            <span>打开创作助手 →</span>
          </button>
        </div>
      </aside>

      <!-- MIDDLE COLUMN: MAIN CANVAS -->
      <main class="flex-1 min-w-0 space-y-6">
        <!-- Sub-header -->
        <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3 font-serif pb-1">
          <div class="flex items-center flex-wrap gap-2.5">
            <span :class="['text-xs', isDark ? 'text-[#A89073]' : 'text-[#8C7E72]']">
              案件 / {{ activeSection === 'OUTLINE' ? '概览' : activeSection === 'SUSPECTS' ? '人物' : activeSection === 'SCENES' ? '场景' : activeSection === 'CLUES' ? '线索' : activeSection === 'TIMELINE' ? '时间线' : '逻辑校验 (图表)' }}
            </span>
            <span :class="['text-xs', isDark ? 'text-[#473422]' : 'text-[#D9CFC4]']">·</span>

            <!-- Case Switcher Dropdown -->
            <div class="relative">
              <button
                @click="isCaseDropdownOpen = !isCaseDropdownOpen"
                :class="[
                  'flex items-center gap-2 px-2.5 py-1 rounded-lg border text-xs font-serif font-bold transition cursor-pointer shadow-xs',
                  isDark ? 'bg-[#18130E] hover:bg-[#221811] text-[#E8C88B] border-[#3E2D1E]' : 'bg-white hover:bg-[#F2ECE4] text-[#1C1917] border-[#E0D5C7]'
                ]"
                title="切换编辑案卷"
              >
                <span class="truncate max-w-[140px] sm:max-w-[200px]">
                  {{ currentCase.title }}
                </span>
                <ChevronDown class="w-3 h-3 opacity-60" />
              </button>

              <div
                v-if="isCaseDropdownOpen"
                :class="[
                  'absolute left-0 mt-1.5 w-72 rounded-xl border p-1.5 shadow-2xl z-50 text-xs',
                  isDark ? 'bg-[#14100D] border-[#3E2D1E] text-[#E5DCD0]' : 'bg-white border-[#E0D5C7] text-[#1C1917]'
                ]"
              >
                <div class="px-2 py-1 text-[10px] font-mono text-[#8C7E72] uppercase tracking-wider">
                  切换编辑案卷：
                </div>
                <button
                  v-for="(item, key) in SAMPLE_SCRIPTS"
                  :key="key"
                  @click="handleSelectCase(key)"
                  :class="[
                    'w-full flex items-center justify-between px-2.5 py-2 rounded-lg text-left transition cursor-pointer',
                    selectedPresetId === key
                      ? isDark
                        ? 'bg-[#241A11] text-[#E8C88B] font-bold border border-[#4D3723]'
                        : 'bg-[#F5E7DF] text-[#8B3A2B] font-bold'
                      : isDark
                      ? 'text-[#B8A792] hover:bg-[#1E1610]'
                      : 'text-[#4A3E35] hover:bg-[#F7F3EE]'
                  ]"
                >
                  <span class="font-serif">{{ item.title }}</span>
                  <span class="text-[10px] opacity-60 font-mono">{{ item.filename }}</span>
                </button>

                <div :class="['pt-1 mt-1 border-t', isDark ? 'border-[#251B12]' : 'border-[#F0EAE1]']">
                  <button
                    @click="isCaseDropdownOpen = false; isUploadModalOpen = true"
                    :class="['w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-left transition cursor-pointer font-medium', isDark ? 'text-[#E8C88B] hover:bg-[#221811]' : 'text-[#8B3A2B] hover:bg-[#F5E7DF]']"
                  >
                    <Upload class="w-3.5 h-3.5" />
                    <span>上传本地剧本让 Agent 解析...</span>
                  </button>
                </div>
              </div>
            </div>

            <!-- Auto-save Status -->
            <div :class="['flex items-center gap-1.5 text-xs font-serif', isDark ? 'text-[#A89073]' : 'text-[#8C7E72]']">
              <span class="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>{{ saveToast ? '已保存更改' : '已自动保存' }}</span>
            </div>
          </div>

          <div class="flex items-center gap-2">
            <!-- LangGraph Pipeline Trigger -->
            <button
              @click="sound.playClueFound(); isLangGraphModalOpen = true"
              :class="[
                'flex items-center gap-1.5 px-3 py-1 rounded-lg border text-xs font-serif font-bold transition cursor-pointer shadow-xs',
                isDark
                  ? 'bg-gradient-to-r from-[#2B1F13] to-[#1E160E] hover:from-[#382819] hover:to-[#2A1E14] text-[#E5C384] border-[#523A25]'
                  : 'bg-gradient-to-r from-[#8B3A2B] to-[#A04534] hover:from-[#783023] hover:to-[#8B3A2B] text-white border-[#783023]'
              ]"
              title="打开 LangGraph 剧本创作工作流控制台"
            >
              <Zap class="w-3.5 h-3.5 fill-current" />
              <span>AI 剧本生成管线 (LangGraph)</span>
            </button>

            <!-- Trace Drawer Trigger -->
            <button
              @click="sound.playPaperRustle(); isTraceDrawerOpen = true"
              :class="[
                'flex items-center gap-1.5 px-3 py-1 rounded-lg border text-xs font-serif transition cursor-pointer shadow-xs',
                isDark ? 'bg-[#18130E] hover:bg-[#221811] text-[#A89073] hover:text-[#E8C88B] border-[#3E2D1E]' : 'bg-white hover:bg-[#F2ECE4] text-[#635548] border-[#E0D5C7]'
              ]"
              title="查看 LangGraph 8 节点状态流与终端日志"
            >
              <Activity :class="['w-3.5 h-3.5', isDark ? 'text-[#C9942D]' : 'text-[#8B3A2B]']" />
              <span>运行详情</span>
            </button>
          </div>
        </div>

        <!-- Editable Case Title -->
        <div class="space-y-1 font-serif">
          <input
            type="text"
            :value="currentCase.title"
            @input="(e) => handleUpdateCaseField('title', (e.target as HTMLInputElement).value)"
            :class="[
              'font-serif font-black text-2xl sm:text-3xl bg-transparent border-b transition w-full py-0.5 focus:outline-none',
              isDark ? 'text-[#F3EFEA] border-transparent hover:border-[#473422] focus:border-[#C9942D]' : 'text-[#1C1917] border-transparent hover:border-[#D9CFC4] focus:border-[#8B3A2B]'
            ]"
            title="点击直接修改案名"
          />
          <div :class="['text-xs flex items-center gap-2 pt-0.5', isDark ? 'text-[#8C765E]' : 'text-[#8C7E72]']">
            <span>最后编辑于刚刚</span>
            <span>·</span>
            <span>悬疑推理</span>
            <span>·</span>
            <span>预计 20 分钟体验</span>
          </div>
        </div>

        <!-- AI 剧本生成管线横幅 -->
        <div
          :class="[
            'rounded-2xl p-5 border shadow-sm font-serif transition-colors',
            isDark
              ? 'bg-gradient-to-r from-[#1E1712] via-[#17120E] to-[#140F0C] border-[#3E2D1E]'
              : 'bg-gradient-to-r from-[#FAF5EE] via-[#F6EEE2] to-[#F3E7D8] border-[#E3D7C7]'
          ]"
        >
          <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div class="space-y-1">
              <div class="flex items-center gap-2">
                <span :class="['px-2 py-0.5 rounded-full text-[10px] font-mono font-bold', isDark ? 'bg-[#C9942D]/20 text-[#E5C384]' : 'bg-[#8B3A2B]/15 text-[#8B3A2B]']">
                  LangGraph 工作流已激活
                </span>
                <span :class="['text-xs font-mono', isDark ? 'text-[#8C765E]' : 'text-[#8C7E72]']">
                  拓扑架构: 8节点有状态 DAG
                </span>
              </div>
              <h3 :class="['font-bold text-sm sm:text-base', isDark ? 'text-[#F3EFEA]' : 'text-[#1C1917]']">
                长剧本自动解析、实体分块与防剧透护栏生成
              </h3>
              <p :class="['text-xs leading-relaxed max-w-2xl', isDark ? 'text-[#A89073]' : 'text-[#786B60]']">
                支持输入 PDF/Word/MD 原始小说，通过 LangGraph 有状态图构建嫌疑人社会关系、核心诡计、密室物理门禁与防剧透边界指令。
              </p>
            </div>

            <div class="flex items-center gap-2 shrink-0">
              <button
                @click="sound.playClueFound(); isLangGraphModalOpen = true"
                :class="[
                  'px-4 py-2 rounded-xl text-xs font-bold transition shadow-xs flex items-center gap-1.5 cursor-pointer',
                  isDark
                    ? 'bg-gradient-to-r from-[#DFB36C] via-[#C9942D] to-[#DFB36C] text-[#140E07]'
                    : 'bg-[#8B3A2B] hover:bg-[#783023] text-white'
                ]"
              >
                <Zap class="w-3.5 h-3.5 fill-current" />
                <span>进入 LangGraph 拓扑</span>
              </button>
            </div>
          </div>
        </div>

        <!-- TAB 1: OUTLINE -->
        <div v-if="activeSection === 'OUTLINE'" class="space-y-6 animate-fadeIn">
          <!-- 故事梗概 -->
          <div :class="['rounded-2xl p-6 border shadow-sm font-serif space-y-3', isDark ? 'bg-[#15110E] border-[#2C2117]' : 'bg-white border-[#E8DFD5]']">
            <div class="flex items-center justify-between">
              <h3 :class="['font-bold text-sm tracking-wide', isDark ? 'text-[#F3EFEA]' : 'text-[#1C1917]']">
                故事梗概 (Case Synopsis)
              </h3>
              <span :class="['text-xs font-mono', isDark ? 'text-[#8C765E]' : 'text-[#8C7E72]']">
                字数：{{ currentCase.summary.length }}
              </span>
            </div>
            <textarea
              :value="currentCase.summary"
              @input="(e) => handleUpdateCaseField('summary', (e.target as HTMLTextAreaElement).value)"
              rows="4"
              :class="[
                'w-full text-xs sm:text-sm leading-relaxed p-3.5 rounded-xl border transition resize-none focus:outline-none',
                isDark ? 'bg-[#0F0C09] border-[#3E2D1E] text-[#E5DCD0] focus:border-[#C9942D]' : 'bg-[#FAF7F2] border-[#E0D5C7] text-[#1C1917] focus:border-[#8B3A2B]'
              ]"
            />
          </div>

          <!-- 叙事节奏卡片 -->
          <div :class="['rounded-2xl p-6 border shadow-sm font-serif space-y-4', isDark ? 'bg-[#15110E] border-[#2C2117]' : 'bg-white border-[#E8DFD5]']">
            <div class="flex items-center justify-between">
              <div>
                <h3 :class="['font-bold text-sm tracking-wide', isDark ? 'text-[#F3EFEA]' : 'text-[#1C1917]']">
                  叙事推进节奏 (Narrative Progression Beats)
                </h3>
                <p :class="['text-xs mt-0.5', isDark ? 'text-[#8C765E]' : 'text-[#8C7E72]']">
                  规划案件从发现到高潮的 4 个转折节奏点
                </p>
              </div>
              <button
                @click="handleAddBeat"
                :class="[
                  'px-3 py-1.5 rounded-xl border text-xs font-bold transition flex items-center gap-1.5 cursor-pointer',
                  isDark ? 'border-[#3E2D1E] bg-[#1E1712] hover:bg-[#281F18] text-[#E5C384]' : 'border-[#E0D5C7] bg-[#FAF7F2] hover:bg-[#F2ECE4] text-[#8B3A2B]'
                ]"
              >
                <Plus class="w-3.5 h-3.5" />
                <span>新增转折</span>
              </button>
            </div>

            <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              <div
                v-for="beat in narrativeBeats"
                :key="beat.id"
                :class="[
                  'p-3.5 rounded-xl border space-y-1.5 relative group',
                  isDark ? 'bg-[#100D0A] border-[#241B13]' : 'bg-[#FAF7F2] border-[#EAE1D5]'
                ]"
              >
                <div class="flex items-center justify-between">
                  <span
                    class="text-[10px] px-2 py-0.5 rounded-full font-bold text-white font-mono"
                    :style="{ backgroundColor: beat.color }"
                  >
                    {{ beat.stage }}
                  </span>
                  <span class="text-[10px] font-mono opacity-50">#{{ beat.id }}</span>
                </div>
                <h4 :class="['font-bold text-xs', isDark ? 'text-[#F3EFEA]' : 'text-[#1C1917]']">
                  {{ beat.title }}
                </h4>
              </div>
            </div>
          </div>
        </div>

        <!-- TAB 2: SUSPECTS -->
        <div v-else-if="activeSection === 'SUSPECTS'" class="space-y-6 animate-fadeIn">
          <div :class="['rounded-2xl p-6 border shadow-sm font-serif space-y-4', isDark ? 'bg-[#15110E] border-[#2C2117]' : 'bg-white border-[#E8DFD5]']">
            <div class="flex items-center justify-between pb-2 border-b border-inherit">
              <div>
                <h3 :class="['font-bold text-sm tracking-wide', isDark ? 'text-[#F3EFEA]' : 'text-[#1C1917]']">
                  涉案嫌疑人设定与防剧透回答边界 (Suspect Roster & NPC Guardrails)
                </h3>
                <p :class="['text-xs mt-0.5', isDark ? 'text-[#8C765E]' : 'text-[#8C7E72]']">
                  4 位涉案人员的动机、不在场证明、作案嫌疑度与 LLM 防剧透知识库指令
                </p>
              </div>
            </div>

            <!-- Suspects Grid -->
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div
                v-for="s in currentCase.suspects"
                :key="s.id"
                :class="[
                  'p-4 rounded-xl border space-y-3 transition',
                  s.id === currentCase.trueCulpritId
                    ? isDark ? 'bg-[#211710] border-amber-600/50' : 'bg-[#F9EDE6] border-[#8B3A2B]/40'
                    : isDark ? 'bg-[#100D0A] border-[#241B13]' : 'bg-[#FAF7F2] border-[#EAE1D5]'
                ]"
              >
                <div class="flex items-center justify-between">
                  <div class="flex items-center gap-2.5">
                    <span
                      :class="[
                        'w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs',
                        isDark ? 'bg-[#291F16] text-[#E5C384]' : 'bg-[#8B3A2B] text-white'
                      ]"
                    >
                      {{ s.name.slice(0, 1) }}
                    </span>
                    <div>
                      <div class="flex items-center gap-2">
                        <span class="font-bold text-sm">{{ s.name }}</span>
                        <span
                          v-if="s.id === currentCase.trueCulpritId"
                          class="text-[10px] px-2 py-0.5 rounded-full bg-red-500/20 text-red-400 font-mono font-bold"
                        >
                          真实凶手
                        </span>
                      </div>
                      <span class="text-xs opacity-70">{{ s.title }} · {{ s.age }}岁</span>
                    </div>
                  </div>
                </div>

                <div class="text-xs space-y-1.5 opacity-90 leading-relaxed">
                  <div><strong class="text-amber-500">动机：</strong>{{ s.motiveSummary }}</div>
                  <div><strong class="text-sky-500">不在场证明：</strong>{{ s.alibi }}</div>
                </div>
              </div>
            </div>

            <!-- Interactive NPC Boundary Guard Simulation Panel -->
            <div
              :class="[
                'mt-6 p-5 rounded-2xl border space-y-4',
                isDark ? 'bg-[#120F0C] border-[#3E2D1E]' : 'bg-[#FAF5EE] border-[#E0D5C7]'
              ]"
            >
              <div class="flex items-center justify-between">
                <div class="flex items-center gap-2">
                  <ShieldCheck :class="['w-4 h-4', isDark ? 'text-[#C9942D]' : 'text-[#8B3A2B]']" />
                  <h4 class="font-bold text-xs sm:text-sm">
                    NPC 防剧透护栏沙盒测试 (Boundary Guard Simulation)
                  </h4>
                </div>
                <span class="text-[10px] font-mono text-emerald-500 font-bold">
                  ● 护栏监控中
                </span>
              </div>

              <div class="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div
                  v-for="s in currentCase.suspects"
                  :key="s.id"
                  @click="testingNpcId = s.id; testResponse = null"
                  :class="[
                    'p-2.5 rounded-xl border text-xs cursor-pointer transition',
                    testingNpcId === s.id
                      ? isDark
                        ? 'bg-[#291F16] border-[#C9942D] text-[#E5C384] font-bold'
                        : 'bg-[#F5E7DF] border-[#8B3A2B] text-[#8B3A2B] font-bold'
                      : 'opacity-70'
                  ]"
                >
                  {{ s.name }} ({{ s.title }})
                </div>
              </div>

              <div class="space-y-2">
                <input
                  v-model="testQuestion"
                  type="text"
                  placeholder="输入向该 NPC 质询的话语，测试其是否会提前剧透或泄露不应知晓的秘密..."
                  :class="[
                    'w-full text-xs p-3 rounded-xl border focus:outline-none transition',
                    isDark ? 'bg-[#0A0806] border-[#2C2117] text-[#E5DCD0] focus:border-[#C9942D]' : 'bg-white border-[#E0D5C7] text-[#1C1917] focus:border-[#8B3A2B]'
                  ]"
                />

                <div class="flex items-center justify-between">
                  <span class="text-[11px] opacity-60">尝试询问：备用门禁卡、停摆怀表、真实凶手等敏感词汇</span>
                  <button
                    @click="handleTestNPCBoundary(currentCase.suspects.find((s) => s.id === testingNpcId)?.name || '嫌疑人', testQuestion)"
                    :class="[
                      'px-4 py-1.5 rounded-xl text-xs font-bold transition shadow-xs cursor-pointer',
                      isDark
                        ? 'bg-gradient-to-r from-[#DFB36C] via-[#C9942D] to-[#DFB36C] text-[#140E07]'
                        : 'bg-[#8B3A2B] hover:bg-[#783023] text-white'
                    ]"
                  >
                    模拟质询
                  </button>
                </div>
              </div>

              <!-- Output response -->
              <div
                v-if="testResponse"
                :class="[
                  'p-3.5 rounded-xl border text-xs leading-relaxed whitespace-pre-line animate-fadeIn font-mono',
                  isDark ? 'bg-[#090705] border-emerald-900/40 text-emerald-300' : 'bg-emerald-50 border-emerald-200 text-emerald-950'
                ]"
              >
                {{ testResponse }}
              </div>
            </div>
          </div>
        </div>

        <!-- TAB 3: SCENES -->
        <div v-else-if="activeSection === 'SCENES'" class="space-y-6 animate-fadeIn">
          <div :class="['rounded-2xl p-6 border shadow-sm font-serif space-y-4', isDark ? 'bg-[#15110E] border-[#2C2117]' : 'bg-white border-[#E8DFD5]']">
            <h3 :class="['font-bold text-sm tracking-wide', isDark ? 'text-[#F3EFEA]' : 'text-[#1C1917]']">
              涉案空间与三维勘验场景 (Scenes & Locations)
            </h3>
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div
                v-for="loc in GALLERY_ROOMS"
                :key="loc.id"
                :class="[
                  'p-4 rounded-xl border space-y-2',
                  loc.isCrimeScene
                    ? isDark ? 'bg-red-950/20 border-red-500/30' : 'bg-red-50/50 border-red-200'
                    : isDark ? 'bg-[#100D0A] border-[#241B13]' : 'bg-[#FAF7F2] border-[#EAE1D5]'
                ]"
              >
                <div class="flex items-center justify-between">
                  <span class="font-bold text-sm flex items-center gap-1.5">
                    <Compass class="w-4 h-4 opacity-70" />
                    <span>{{ loc.name }}</span>
                  </span>
                  <span v-if="loc.isCrimeScene" class="text-[10px] font-mono px-2 py-0.5 rounded-full bg-red-500/20 text-red-500 font-bold">
                    案发现场
                  </span>
                </div>
                <p class="text-xs opacity-75 leading-relaxed">{{ loc.desc }}</p>
                <div class="pt-2 border-t border-inherit text-[11px] font-mono opacity-60">
                  包含物证：{{ loc.availableClues.length }} 件
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- TAB 4: CLUES -->
        <div v-else-if="activeSection === 'CLUES'" class="space-y-6 animate-fadeIn">
          <div :class="['rounded-2xl p-6 border shadow-sm font-serif space-y-4', isDark ? 'bg-[#15110E] border-[#2C2117]' : 'bg-white border-[#E8DFD5]']">
            <h3 :class="['font-bold text-sm tracking-wide', isDark ? 'text-[#F3EFEA]' : 'text-[#1C1917]']">
              微观物证清单与鉴识注记 (Clues & Forensic Traces)
            </h3>
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div
                v-for="clue in currentCase.clues"
                :key="clue.id"
                :class="[
                  'p-4 rounded-xl border space-y-2',
                  clue.isCrucial
                    ? isDark ? 'bg-[#201610] border-amber-600/40' : 'bg-[#F9ECE3] border-[#8B3A2B]/40'
                    : isDark ? 'bg-[#100D0A] border-[#241B13]' : 'bg-[#FAF7F2] border-[#EAE1D5]'
                ]"
              >
                <div class="flex items-center justify-between">
                  <span class="font-bold text-sm flex items-center gap-1.5">
                    <Key class="w-4 h-4 opacity-70" />
                    <span>{{ clue.name }}</span>
                  </span>
                  <span
                    v-if="clue.isCrucial"
                    class="text-[10px] font-mono px-2 py-0.5 rounded-full bg-red-500/20 text-red-500 font-bold"
                  >
                    关键铁证
                  </span>
                </div>
                <p class="text-xs opacity-75 leading-relaxed">{{ clue.detail }}</p>
                <div v-if="clue.forensicNote" class="text-[11px] p-2 rounded bg-amber-500/10 text-amber-500">
                  <strong>法医注记：</strong>{{ clue.forensicNote }}
                </div>
                <div v-if="clue.tags.length" class="text-[11px] p-2 rounded bg-purple-500/10 text-purple-400">
                  <strong>鉴识特征：</strong>{{ clue.tags.join(' · ') }}
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- TAB 5: TIMELINE -->
        <div v-else-if="activeSection === 'TIMELINE'" class="space-y-6 animate-fadeIn">
          <div :class="['rounded-2xl p-6 border shadow-sm font-serif space-y-4', isDark ? 'bg-[#15110E] border-[#2C2117]' : 'bg-white border-[#E8DFD5]']">
            <h3 :class="['font-bold text-sm tracking-wide', isDark ? 'text-[#F3EFEA]' : 'text-[#1C1917]']">
              案发精确时空时间线 (Timeline Events)
            </h3>
            <div class="space-y-3">
              <div
                v-for="(ev, idx) in currentCase.timeline"
                :key="idx"
                :class="[
                  'p-3.5 rounded-xl border flex items-start gap-4',
                  isDark ? 'bg-[#100D0A] border-[#241B13]' : 'bg-[#FAF7F2] border-[#EAE1D5]'
                ]"
              >
                <span class="font-mono font-bold text-xs text-amber-500 shrink-0 mt-0.5">
                  {{ ev.time }}
                </span>
                <div class="space-y-1">
                  <div class="flex items-center gap-2">
                    <span class="font-bold text-xs">{{ ev.location }}</span>
                    <span class="text-[11px] opacity-60 font-mono">涉案: {{ ev.actor }}</span>
                  </div>
                  <p class="text-xs opacity-80 leading-relaxed">{{ ev.action }}</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- TAB 6: LOGIC VERIFICATION VIEW (Full Integration!) -->
        <div v-else-if="activeSection === 'LOGIC_VERIFY'">
          <LogicVerificationView
            :caseData="currentCase"
            :isDark="isDark"
            @triggerSelfRepair="handleTriggerSelfRepair"
            @navigateToSection="(sec) => activeSection = sec"
          />
        </div>
      </main>

      <!-- RIGHT COLUMN: RIGOR & VALIDATION (280px) -->
      <aside class="w-full lg:w-72 shrink-0 space-y-6">
        <!-- Rigor Score Card -->
        <div
          :class="[
            'rounded-2xl p-5 border shadow-sm space-y-4 font-serif',
            isDark ? 'bg-[#15110E] border-[#2C2117]' : 'bg-white border-[#E8DFD5]'
          ]"
        >
          <div class="flex items-center justify-between">
            <h3 :class="['font-bold text-sm tracking-wide', isDark ? 'text-[#F3EFEA]' : 'text-[#1C1917]']">
              确定性规则校验
            </h3>
            <span
              :class="[
                'text-xs font-mono font-bold px-2 py-0.5 rounded-full',
                validationReport.isValid ? 'bg-emerald-500/15 text-emerald-500' : 'bg-amber-500/15 text-amber-500'
              ]"
            >
              {{ validationReport.score }} / 100
            </span>
          </div>

          <p :class="['text-xs leading-relaxed', isDark ? 'text-[#A89073]' : 'text-[#786B60]']">
            {{ validationReport.isValid ? '规则闭环全绿通过，不存在时空或密室锁闭冲突。' : `存在 ${validationReport.conflicts.length} 处硬逻辑冲突，建议执行自愈修复。` }}
          </p>

          <button
            v-if="!validationReport.isValid"
            @click="handleTriggerSelfRepair"
            :class="[
              'w-full flex items-center justify-center gap-2 py-2 rounded-xl text-xs font-bold transition shadow-xs cursor-pointer',
              isDark
                ? 'bg-gradient-to-r from-amber-600 to-amber-700 text-stone-950 font-black'
                : 'bg-[#8B3A2B] text-white'
            ]"
          >
            <RotateCcw class="w-3.5 h-3.5" />
            <span>执行自愈重规划</span>
          </button>

          <button
            @click="activeSection = 'LOGIC_VERIFY'"
            :class="[
              'w-full flex items-center justify-center gap-1.5 py-1.5 rounded-xl border text-xs font-medium transition cursor-pointer',
              isDark ? 'border-[#3E2D1E] text-[#E5C384] hover:bg-[#201811]' : 'border-[#E0D5C7] text-[#8B3A2B] hover:bg-[#FAF7F2]'
            ]"
          >
            <Scale class="w-3.5 h-3.5" />
            <span>查看完整逻辑校验图表 →</span>
          </button>
        </div>

        <!-- Case Metadata Card -->
        <div
          :class="[
            'rounded-2xl p-5 border shadow-sm space-y-3 font-serif text-xs',
            isDark ? 'bg-[#15110E] border-[#2C2117]' : 'bg-white border-[#E8DFD5]'
          ]"
        >
          <h3 :class="['font-bold text-sm tracking-wide', isDark ? 'text-[#F3EFEA]' : 'text-[#1C1917]']">
            案卷关键属性
          </h3>
          <div class="space-y-2 opacity-85">
            <div class="flex items-center justify-between">
              <span>预设凶手：</span>
              <span class="font-bold text-amber-500">
                {{ currentCase.suspects.find((s) => s.id === currentCase.trueCulpritId)?.name || '未锁定' }}
              </span>
            </div>
            <div class="flex items-center justify-between">
              <span>涉案人数：</span>
              <span class="font-mono">{{ currentCase.suspects.length }} 位</span>
            </div>
            <div class="flex items-center justify-between">
              <span>搜查物证：</span>
              <span class="font-mono">{{ currentCase.clues.length }} 件</span>
            </div>
            <div class="flex items-center justify-between">
              <span>涉案场景：</span>
              <span class="font-mono">{{ GALLERY_ROOMS.length }} 处</span>
            </div>
          </div>
        </div>
      </aside>
    </div>

    <!-- Modals -->
    <!-- 1. LangGraph Pipeline Modal -->
    <LangGraphStudioModal
      :isOpen="isLangGraphModalOpen"
      :themeMode="currentTheme"
      @close="isLangGraphModalOpen = false"
      @applyCase="handleApplyGeneratedCase"
      @directPlay="(c) => emit('playCase', c)"
    />

    <!-- 2. Local Script Upload Modal -->
    <div
      v-if="isUploadModalOpen"
      class="fixed inset-0 z-50 backdrop-blur-md flex items-center justify-center p-4 bg-black/80 font-serif"
    >
      <div
        :class="[
          'w-full max-w-lg rounded-2xl border p-6 space-y-4 shadow-2xl',
          isDark ? 'bg-[#14100D] border-[#3E2D1E] text-[#E5DCD0]' : 'bg-white border-[#E0D5C7] text-[#1C1917]'
        ]"
      >
        <div class="flex items-center justify-between">
          <h3 class="font-bold text-sm">上传本地剧本让 Agent 解析</h3>
          <button @click="isUploadModalOpen = false" class="p-1 rounded opacity-60 hover:opacity-100 cursor-pointer">
            <X class="w-4 h-4" />
          </button>
        </div>
        <p class="text-xs opacity-75 leading-relaxed">
          支持解析 PDF、Word (.docx)、Markdown 或纯文本剧本。解析引擎将自动提取人物、时空与物证关系并注入工作台。
        </p>

        <div class="border-2 border-dashed border-[#8C765E]/30 rounded-xl p-8 text-center space-y-2">
          <Upload class="w-8 h-8 mx-auto opacity-50" />
          <div class="text-xs font-bold">点击选择或拖拽剧本文件至此处</div>
          <div class="text-[10px] opacity-60">支持格式: .pdf, .docx, .md, .txt, .json</div>
        </div>

        <div class="flex justify-end gap-2 pt-2">
          <button
            @click="isUploadModalOpen = false"
            class="px-4 py-1.5 rounded-xl border text-xs font-medium cursor-pointer"
          >
            取消
          </button>
          <button
            @click="handleSimulateScriptIngest"
            :class="[
              'px-5 py-1.5 rounded-xl text-xs font-bold shadow-xs cursor-pointer',
              isDark ? 'bg-[#C9942D] text-[#140E07]' : 'bg-[#8B3A2B] text-white'
            ]"
          >
            开始解析注入
          </button>
        </div>
      </div>
    </div>

    <!-- 3. Trace Drawer (Slide-out side drawer) -->
    <div
      v-if="isTraceDrawerOpen"
      class="fixed inset-0 z-50 backdrop-blur-xs flex justify-end bg-black/60 font-serif"
    >
      <div
        :class="[
          'w-full max-w-md h-full border-l p-6 flex flex-col justify-between shadow-2xl animate-fadeIn',
          isDark ? 'bg-[#120F0D] border-[#2C2117] text-[#E5DCD0]' : 'bg-white border-[#E8DFD5] text-[#1C1917]'
        ]"
      >
        <div class="space-y-4 flex-1 overflow-y-auto">
          <div class="flex items-center justify-between pb-3 border-b border-inherit">
            <div class="flex items-center gap-2">
              <Activity :class="['w-4 h-4', isDark ? 'text-[#C9942D]' : 'text-[#8B3A2B]']" />
              <h3 class="font-bold text-sm">工作流执行详情与日志</h3>
            </div>
            <button @click="isTraceDrawerOpen = false" class="p-1 rounded opacity-60 hover:opacity-100 cursor-pointer">
              <X class="w-4 h-4" />
            </button>
          </div>

          <div class="space-y-2 text-xs font-mono">
            <div v-for="(log, i) in terminalLogs" :key="i" class="p-2 rounded bg-black/20 leading-relaxed text-[11px] opacity-85">
              {{ log }}
            </div>
          </div>
        </div>

        <div class="pt-4 border-t border-inherit flex justify-end">
          <button
            @click="isTraceDrawerOpen = false"
            class="px-4 py-1.5 rounded-xl border text-xs font-bold cursor-pointer"
          >
            关闭详情
          </button>
        </div>
      </div>
    </div>
  </div>
</template>
