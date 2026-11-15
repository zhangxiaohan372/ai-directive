<script setup lang="ts">
import { ref, computed } from 'vue';
import type { StudioCaseData } from '../../core/studio';
import { PRESET_STUDIO_CASES, validateCaseConsistency, repairCaseConflicts } from '../../core/studio';
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
  Plus,
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
const isCaseDropdownOpen = ref(false);
const isUploadModalOpen = ref(false);
const isLangGraphModalOpen = ref(false);
const isTraceDrawerOpen = ref(false);
const saveToast = ref(false);
const isMuted = ref(sound.getIsMuted());

const currentCase = ref<StudioCaseData>({
  ...(PRESET_STUDIO_CASES[props.initialPresetId] || PRESET_STUDIO_CASES['midnight_gallery']),
});

const testingNpcId = ref<string>(currentCase.value.suspects[0]?.id || 'xu_ning');
const testQuestion = ref('你当晚22:15分究竟有没有进过修复室？那张备用卡是在哪里找到的？');
const testResponse = ref<string | null>(null);

const uploadedFileName = ref('midnight_gallery_script.md');
const uploadedFileSize = ref(4820);
const scriptText = ref(SAMPLE_SCRIPTS.midnight_gallery.text);

const narrativeBeats = ref<NarrativeBeat[]>([
  { id: '1', stage: '展开', title: '艺术展开幕酒会与名画《夜巡者》亮相', color: '#8B3A2B' },
  { id: '2', stage: '突发', title: '22:35 文物修复室反锁与陈默受害被发现', color: '#C9942D' },
  { id: '3', stage: '调查', title: '停摆怀表与松节油抹布揭示物理不在场伪证', color: '#38BDF8' },
  { id: '4', stage: '对质', title: '对徐宁总控备用门禁卡记录提起终极指控', color: '#10B981' },
]);

const terminalLogs = ref<string[]>([
  '[00:00.120] [DOC_CHUNK] 初始化剧本分块引擎：载入 midnight_gallery_script.md (4.8KB)。',
  '[00:00.350] [ENTITY_EXTRACT] 识别到 4 位核心角色、4 个涉案地点与 8 件关键证物。',
  '[00:00.680] [SCRIPT_ANALYZE] 动机图谱生成：代笔纠纷、注资纠纷与盗窃瓷器被撞破。',
  '[00:01.120] [CASE_PLAN] 核心诡计确立：停摆怀表倒拨 20 分钟制造死者活人假象 + 备用卡外侧反锁。',
  '[00:01.540] [CASE_GENERATE] 生成微观物证图谱、365nm UV鉴识层及 4 组嫌疑人防剧透边界。',
  '[00:01.890] [LOGIC_VALIDATE] 确定性时空与锁闭规则校验通过（得分：100/100，零冲突）。',
]);

const repairLogs = ref<string[]>([]);
const validationReport = computed(() => currentCase.value.validationReport || validateCaseConsistency(currentCase.value));

const navSections = computed(() => [
  { key: 'OUTLINE' as EditorSection, label: '案件概览', icon: FileText },
  { key: 'SUSPECTS' as EditorSection, label: '人物', icon: Users, count: currentCase.value.suspects.length },
  { key: 'SCENES' as EditorSection, label: '场景', icon: Compass },
  { key: 'CLUES' as EditorSection, label: '线索', icon: Key, count: currentCase.value.clues.length },
  { key: 'TIMELINE' as EditorSection, label: '时间线', icon: Clock },
  { key: 'LOGIC_VERIFY' as EditorSection, label: '逻辑校验 (图表)', icon: Scale, badge: `${validationReport.value.score}%` },
]);

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
    color: isDark.value ? '#DFB36C' : '#8B3A2B',
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
  <div class="min-h-screen flex flex-col font-serif select-none antialiased transition-colors duration-300 bg-theme-desk text-theme-ink">
    <!-- 1. TOP NAVBAR -->
    <header class="h-16 px-6 sm:px-10 border-b border-theme-border bg-theme-card/95 flex items-center justify-between shrink-0 sticky top-0 z-40 backdrop-blur-md transition-colors duration-300">
      <!-- Left: Brand Logo & Title -->
      <div
        @click="emit('backToPortal')"
        class="flex items-center gap-3 cursor-pointer group"
        title="返回首页"
      >
        <div class="w-9 h-9 rounded-xl border border-theme-border bg-theme-surface text-theme-accent flex items-center justify-center shadow-xs shrink-0 font-serif font-black text-sm">
          密
        </div>
        <div>
          <div class="flex items-center gap-2">
            <h1 class="font-serif font-black text-base text-theme-ink tracking-wide leading-none">
              AI Detective
            </h1>
          </div>
          <p class="text-[10px] font-serif tracking-widest mt-0.5 text-theme-muted">
            智能探案平台
          </p>
        </div>
      </div>

      <!-- Center: Navigation Links -->
      <nav class="hidden md:flex items-center gap-7 text-xs font-serif">
        <button
          type="button"
          @click="sound.playPaperRustle(); emit('backToPortal')"
          class="flex items-center gap-1.5 text-theme-muted hover:text-theme-ink transition-colors cursor-pointer"
        >
          <span>首页</span>
        </button>
        <button
          type="button"
          class="flex items-center gap-1.5 font-bold border-b-2 pb-0.5 border-theme-accent text-theme-accent cursor-pointer"
        >
          <span>案件创作</span>
        </button>
      </nav>

      <!-- Right: Controls -->
      <div class="flex items-center gap-2.5 sm:gap-3">
        <!-- GLOBAL THEME SWITCHER -->
        <div
          class="p-1 rounded-full border border-theme-border bg-theme-surface flex items-center gap-1 transition-all shadow-xs shrink-0"
          title="全局主题切换：暗夜书房 / 白昼手稿"
        >
          <button
            type="button"
            @click="handleToggleTheme"
            class="studio-theme-switch-btn"
            :class="{ 'is-active': !isDark }"
            title="切换为白昼手稿羊皮纸风格"
          >
            <Sun class="w-3.5 h-3.5" />
            <span>白昼</span>
          </button>
          <button
            type="button"
            @click="handleToggleTheme"
            class="studio-theme-switch-btn"
            :class="{ 'is-active': isDark }"
            title="切换为暗夜侦探书房风格"
          >
            <Moon class="w-3.5 h-3.5" />
            <span>暗夜</span>
          </button>
        </div>

        <!-- Soundscape Ambient Toggle -->
        <button
          type="button"
          @click="handleToggleSound"
          class="p-2 rounded-full border border-theme-border bg-theme-surface hover:bg-theme-card-subtle text-theme-muted hover:text-theme-accent transition cursor-pointer"
          :title="isMuted ? '开启环境悬疑声景' : '静音'"
        >
          <VolumeX v-if="isMuted" class="w-4 h-4 opacity-50" />
          <Volume2 v-else class="w-4 h-4 text-theme-accent animate-pulse" />
        </button>

        <!-- User Avatar -->
        <div class="w-8 h-8 rounded-full border border-theme-border bg-theme-surface text-theme-accent flex items-center justify-center text-xs shrink-0 shadow-xs font-serif font-bold">
          <span>侦</span>
        </div>

        <!-- Primary Action Button: 进入试玩 -->
        <button
          type="button"
          @click="emit('playCase', currentCase)"
          :disabled="!validationReport.isValid"
          class="flex items-center gap-2 px-5 py-2 rounded-xl font-serif font-black text-xs sm:text-sm tracking-wide transition shadow-sm bg-theme-accent hover:bg-theme-accent-hover text-white cursor-pointer active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed"
        >
          <Play class="w-3.5 h-3.5 fill-current" />
          <span>进入试玩</span>
        </button>
      </div>
    </header>

    <!-- 2. THREE-COLUMN EDITORIAL DESK WORKSPACE -->
    <div class="flex-1 max-w-360 w-full mx-auto p-4 sm:p-6 flex flex-col lg:flex-row gap-6 min-h-0">
      <!-- LEFT COLUMN: 案件导航 -->
      <aside class="w-full lg:w-56 shrink-0 flex flex-col justify-between space-y-6">
        <div class="space-y-4">
          <div class="pl-3">
            <span class="text-[11px] font-serif tracking-wider uppercase font-medium text-theme-muted">
              案件导航
            </span>
          </div>

          <nav class="space-y-1 font-serif">
            <!-- AI 剧本生成工作流按钮 -->
            <button
              type="button"
              @click="sound.playClueFound(); isLangGraphModalOpen = true"
              class="w-full flex items-center justify-between px-3 py-2 text-xs transition cursor-pointer rounded-xl font-bold border border-theme-border bg-theme-surface text-theme-accent hover:border-theme-accent shadow-xs mb-2"
              title="启动 LangGraph 8 节点剧本生产工作流"
            >
              <div class="flex items-center gap-2">
                <Zap class="w-3.5 h-3.5 text-theme-accent" />
                <span>AI 剧本生成 (LangGraph)</span>
              </div>
              <span class="text-[10px] font-mono px-1.5 py-0.5 rounded font-bold bg-theme-card-subtle text-theme-accent">
                8节点
              </span>
            </button>

            <!-- Navigation Sections -->
            <button
              v-for="sec in navSections"
              :key="sec.key"
              type="button"
              @click="sound.playPaperRustle(); activeSection = sec.key"
              class="studio-nav-btn"
              :class="{ 'studio-nav-btn-active': activeSection === sec.key }"
            >
              <div class="flex items-center gap-2.5">
                <component
                  :is="sec.icon"
                  class="w-4 h-4"
                />
                <span>{{ sec.label }}</span>
              </div>
              <span
                v-if="sec.count !== undefined"
                class="w-5 h-5 rounded-full text-[11px] font-mono flex items-center justify-center font-bold bg-theme-card-subtle border border-theme-border text-theme-accent"
              >
                {{ sec.count }}
              </span>
              <span
                v-else-if="sec.badge !== undefined"
                class="studio-badge-status"
                :class="{ 'is-valid': validationReport.isValid, 'is-warning': !validationReport.isValid }"
              >
                {{ sec.badge }}
              </span>
            </button>
          </nav>
        </div>

        <!-- Bottom Card: 灵感卡住了？ -->
        <div class="rounded-2xl p-4 border border-theme-border bg-theme-card text-theme-ink shadow-sm space-y-2 font-serif transition-colors">
          <h4 class="font-bold text-xs flex items-center gap-1.5 text-theme-ink">
            <Lightbulb class="w-3.5 h-3.5 text-theme-accent" />
            <span>灵感卡住了？</span>
          </h4>
          <p class="text-[11px] leading-relaxed text-theme-muted">
            让助手从你的设定里延展一个新的转折。
          </p>
          <button
            type="button"
            @click="sound.playPaperRustle(); isUploadModalOpen = true"
            class="text-xs font-bold inline-flex items-center gap-1 text-theme-accent hover:underline cursor-pointer transition"
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
            <span class="text-xs text-theme-muted">
              案件 / {{ activeSection === 'OUTLINE' ? '概览' : activeSection === 'SUSPECTS' ? '人物' : activeSection === 'SCENES' ? '场景' : activeSection === 'CLUES' ? '线索' : activeSection === 'TIMELINE' ? '时间线' : '逻辑校验 (图表)' }}
            </span>
            <span class="text-xs text-theme-border">·</span>

            <!-- Case Switcher Dropdown -->
            <div class="relative">
              <button
                type="button"
                @click="isCaseDropdownOpen = !isCaseDropdownOpen"
                class="flex items-center gap-2 px-2.5 py-1 rounded-lg border border-theme-border bg-theme-surface hover:bg-theme-card-subtle text-theme-ink text-xs font-serif font-bold transition cursor-pointer shadow-xs"
                title="切换编辑案卷"
              >
                <span class="truncate max-w-35 sm:max-w-50">
                  {{ currentCase.title }}
                </span>
                <ChevronDown class="w-3 h-3 opacity-60 text-theme-muted" />
              </button>

              <div
                v-if="isCaseDropdownOpen"
                class="absolute left-0 mt-1.5 w-72 rounded-xl border border-theme-border bg-theme-card text-theme-ink p-1.5 shadow-2xl z-50 text-xs font-serif"
              >
                <div class="px-2 py-1 text-[10px] font-mono text-theme-muted uppercase tracking-wider">
                  切换编辑案卷：
                </div>
                <button
                  v-for="(item, key) in SAMPLE_SCRIPTS"
                  :key="key"
                  type="button"
                  @click="handleSelectCase(key)"
                  class="studio-preset-item"
                  :class="{ 'is-active': selectedPresetId === key }"
                >
                  <span class="font-serif">{{ item.title }}</span>
                  <span class="text-[10px] text-theme-muted font-mono">{{ item.filename }}</span>
                </button>

                <div class="pt-1 mt-1 border-t border-theme-border">
                  <button
                    type="button"
                    @click="isCaseDropdownOpen = false; isUploadModalOpen = true"
                    class="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-left transition cursor-pointer font-medium text-theme-accent hover:bg-theme-card-subtle"
                  >
                    <Upload class="w-3.5 h-3.5 text-theme-accent" />
                    <span>上传本地剧本让 Agent 解析...</span>
                  </button>
                </div>
              </div>
            </div>

            <!-- Auto-save Status -->
            <div class="flex items-center gap-1.5 text-xs font-serif text-theme-muted">
              <span class="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>{{ saveToast ? '已保存更改' : '已自动保存' }}</span>
            </div>
          </div>

          <div class="flex items-center gap-2">
            <!-- LangGraph Pipeline Trigger -->
            <button
              type="button"
              @click="sound.playClueFound(); isLangGraphModalOpen = true"
              class="flex items-center gap-1.5 px-3 py-1 rounded-lg border border-theme-border bg-theme-surface hover:bg-theme-card-subtle text-theme-accent text-xs font-serif font-bold transition cursor-pointer shadow-xs"
              title="打开 LangGraph 剧本创作工作流控制台"
            >
              <Zap class="w-3.5 h-3.5 text-theme-accent" />
              <span>AI 剧本生成管线 (LangGraph)</span>
            </button>

            <!-- Trace Drawer Trigger -->
            <button
              type="button"
              @click="sound.playPaperRustle(); isTraceDrawerOpen = true"
              class="flex items-center gap-1.5 px-3 py-1 rounded-lg border border-theme-border bg-theme-surface hover:bg-theme-card-subtle text-theme-muted hover:text-theme-ink text-xs font-serif transition cursor-pointer shadow-xs"
              title="查看 LangGraph 8 节点状态流与终端日志"
            >
              <Activity class="w-3.5 h-3.5 text-theme-accent" />
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
            class="font-serif font-black text-2xl sm:text-3xl bg-transparent border-b border-transparent hover:border-theme-border focus:border-theme-accent text-theme-ink transition w-full py-0.5 focus:outline-none"
            title="点击直接修改案名"
          />
          <div class="text-xs flex items-center gap-2 pt-0.5 text-theme-muted">
            <span>最后编辑于刚刚</span>
            <span>·</span>
            <span>悬疑推理</span>
            <span>·</span>
            <span>预计 20 分钟体验</span>
          </div>
        </div>

        <!-- AI 剧本生成管线横幅 -->
        <div class="rounded-2xl p-5 border border-theme-border bg-theme-card text-theme-ink shadow-sm font-serif transition-colors">
          <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div class="space-y-1">
              <div class="flex items-center gap-2">
                <span class="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-theme-card-subtle text-theme-accent border border-theme-border">
                  LangGraph 工作流已激活
                </span>
                <span class="text-xs font-mono text-theme-muted">
                  拓扑架构: 8节点有状态 DAG
                </span>
              </div>
              <h3 class="font-bold text-sm sm:text-base text-theme-ink">
                长剧本自动解析、实体分块与防剧透护栏生成
              </h3>
              <p class="text-xs leading-relaxed max-w-2xl text-theme-secondary">
                支持输入 PDF/Word/MD 原始小说，通过 LangGraph 有状态图构建嫌疑人社会关系、核心诡计、密室物理门禁与防剧透边界指令。
              </p>
            </div>

            <div class="flex items-center gap-2 shrink-0">
              <button
                type="button"
                @click="sound.playClueFound(); isLangGraphModalOpen = true"
                class="px-4 py-2 rounded-xl text-xs font-bold transition shadow-xs flex items-center gap-1.5 cursor-pointer bg-theme-accent hover:bg-theme-accent-hover text-white"
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
          <div class="studio-card space-y-3">
            <div class="flex items-center justify-between">
              <h3 class="font-bold text-sm tracking-wide text-theme-ink">
                故事梗概 (Case Synopsis)
              </h3>
              <span class="text-xs font-mono text-theme-muted">
                字数：{{ currentCase.summary.length }}
              </span>
            </div>
            <textarea
              :value="currentCase.summary"
              @input="(e) => handleUpdateCaseField('summary', (e.target as HTMLTextAreaElement).value)"
              rows="4"
              class="studio-input resize-none"
            />
          </div>

          <!-- 叙事节奏卡片 -->
          <div class="studio-card space-y-4">
            <div class="flex items-center justify-between">
              <div>
                <h3 class="font-bold text-sm tracking-wide text-theme-ink">
                  叙事推进节奏 (Narrative Progression Beats)
                </h3>
                <p class="text-xs mt-0.5 text-theme-muted">
                  规划案件从发现到高潮的 4 个转折节奏点
                </p>
              </div>
              <button
                type="button"
                @click="handleAddBeat"
                class="px-3 py-1.5 rounded-xl border border-theme-border bg-theme-surface hover:bg-theme-card-subtle text-theme-accent text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-xs"
              >
                <Plus class="w-3.5 h-3.5 text-theme-accent" />
                <span>新增转折</span>
              </button>
            </div>

            <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              <div
                v-for="beat in narrativeBeats"
                :key="beat.id"
                class="p-3.5 rounded-xl border border-theme-border bg-theme-surface space-y-1.5 relative group"
              >
                <div class="flex items-center justify-between">
                  <span
                    class="text-[10px] px-2 py-0.5 rounded-full font-bold text-white font-mono"
                    :style="{ backgroundColor: beat.color }"
                  >
                    {{ beat.stage }}
                  </span>
                  <span class="text-[10px] font-mono text-theme-muted opacity-50">#{{ beat.id }}</span>
                </div>
                <h4 class="font-bold text-xs text-theme-ink">
                  {{ beat.title }}
                </h4>
              </div>
            </div>
          </div>
        </div>

        <!-- TAB 2: SUSPECTS -->
        <div v-else-if="activeSection === 'SUSPECTS'" class="space-y-6 animate-fadeIn">
          <div class="studio-card space-y-4">
            <div class="flex items-center justify-between pb-2 border-b border-theme-border">
              <div>
                <h3 class="font-bold text-sm tracking-wide text-theme-ink">
                  涉案嫌疑人设定与防剧透回答边界 (Suspect Roster & NPC Guardrails)
                </h3>
                <p class="text-xs mt-0.5 text-theme-muted">
                  4 位涉案人员的动机、不在场证明、作案嫌疑度与 LLM 防剧透知识库指令
                </p>
              </div>
            </div>

            <!-- Suspects Grid -->
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div
                v-for="s in currentCase.suspects"
                :key="s.id"
                class="studio-suspect-card"
                :class="{ 'is-culprit': s.id === currentCase.trueCulpritId }"
              >
                <div class="flex items-center justify-between">
                  <div class="flex items-center gap-2.5">
                    <span class="w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs bg-theme-surface border border-theme-border text-theme-accent">
                      {{ s.name.slice(0, 1) }}
                    </span>
                    <div>
                      <div class="flex items-center gap-2">
                        <span class="font-bold text-sm text-theme-ink">{{ s.name }}</span>
                        <span
                          v-if="s.id === currentCase.trueCulpritId"
                          class="text-[10px] px-2 py-0.5 rounded-full bg-red-500/20 text-red-500 font-mono font-bold"
                        >
                          真实凶手
                        </span>
                      </div>
                      <span class="text-xs text-theme-muted">{{ s.title }} · {{ s.age }}岁</span>
                    </div>
                  </div>
                </div>

                <div class="text-xs space-y-1.5 leading-relaxed text-theme-secondary">
                  <div><strong class="text-amber-500">动机：</strong>{{ s.motiveSummary }}</div>
                  <div><strong class="text-sky-500">不在场证明：</strong>{{ s.alibi }}</div>
                </div>
              </div>
            </div>

            <!-- Interactive NPC Boundary Guard Simulation Panel -->
            <div class="mt-6 p-5 rounded-2xl border border-theme-border bg-theme-card-subtle space-y-4">
              <div class="flex items-center justify-between">
                <div class="flex items-center gap-2">
                  <ShieldCheck class="w-4 h-4 text-theme-accent" />
                  <h4 class="font-bold text-xs sm:text-sm text-theme-ink">
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
                  class="studio-suspect-chip"
                  :class="{ 'is-active': testingNpcId === s.id }"
                >
                  {{ s.name }} ({{ s.title }})
                </div>
              </div>

              <div class="space-y-2">
                <input
                  v-model="testQuestion"
                  type="text"
                  placeholder="输入向该 NPC 质询的话语，测试其是否会提前剧透或泄露不应知晓的秘密..."
                  class="studio-input"
                />

                <div class="flex items-center justify-between">
                  <span class="text-[11px] text-theme-muted">尝试询问：备用门禁卡、停摆怀表、真实凶手等敏感词汇</span>
                  <button
                    type="button"
                    @click="handleTestNPCBoundary(currentCase.suspects.find((s) => s.id === testingNpcId)?.name || '嫌疑人', testQuestion)"
                    class="px-4 py-1.5 rounded-xl text-xs font-bold transition shadow-xs cursor-pointer bg-theme-accent hover:bg-theme-accent-hover text-white"
                  >
                    模拟质询
                  </button>
                </div>
              </div>

              <!-- Output response -->
              <div
                v-if="testResponse"
                class="p-3.5 rounded-xl border border-emerald-500/40 bg-emerald-950/20 text-emerald-400 text-xs leading-relaxed whitespace-pre-line animate-fadeIn font-mono"
              >
                {{ testResponse }}
              </div>
            </div>
          </div>
        </div>

        <!-- TAB 3: SCENES -->
        <div v-else-if="activeSection === 'SCENES'" class="space-y-6 animate-fadeIn">
          <div class="studio-card space-y-4">
            <h3 class="font-bold text-sm tracking-wide text-theme-ink">
              涉案空间与三维勘验场景 (Scenes & Locations)
            </h3>
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div
                v-for="loc in GALLERY_ROOMS"
                :key="loc.id"
                class="studio-location-card"
                :class="{ 'is-crime-scene': loc.isCrimeScene }"
              >
                <div class="flex items-center justify-between">
                  <span class="font-bold text-sm flex items-center gap-1.5 text-theme-ink">
                    <Compass class="w-4 h-4 text-theme-accent" />
                    <span>{{ loc.name }}</span>
                  </span>
                  <span v-if="loc.isCrimeScene" class="text-[10px] font-mono px-2 py-0.5 rounded-full bg-red-500/20 text-red-500 font-bold">
                    案发现场
                  </span>
                </div>
                <p class="text-xs text-theme-secondary leading-relaxed">{{ loc.desc }}</p>
                <div class="pt-2 border-t border-theme-border text-[11px] font-mono text-theme-muted">
                  包含物证：{{ loc.availableClues.length }} 件
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- TAB 4: CLUES -->
        <div v-else-if="activeSection === 'CLUES'" class="space-y-6 animate-fadeIn">
          <div class="studio-card space-y-4">
            <h3 class="font-bold text-sm tracking-wide text-theme-ink">
              微观物证清单与鉴识注记 (Clues & Forensic Traces)
            </h3>
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div
                v-for="clue in currentCase.clues"
                :key="clue.id"
                class="studio-clue-card"
                :class="{ 'is-crucial': clue.isCrucial }"
              >
                <div class="flex items-center justify-between">
                  <span class="font-bold text-sm flex items-center gap-1.5 text-theme-ink">
                    <Key class="w-4 h-4 text-theme-accent" />
                    <span>{{ clue.name }}</span>
                  </span>
                  <span
                    v-if="clue.isCrucial"
                    class="text-[10px] font-mono px-2 py-0.5 rounded-full bg-red-500/20 text-red-500 font-bold"
                  >
                    关键铁证
                  </span>
                </div>
                <p class="text-xs text-theme-secondary leading-relaxed">{{ clue.detail }}</p>
                <div v-if="clue.forensicNote" class="text-[11px] p-2 rounded bg-theme-surface border border-theme-border text-theme-accent">
                  <strong>法医注记：</strong>{{ clue.forensicNote }}
                </div>
                <div v-if="clue.tags.length" class="text-[11px] p-2 rounded bg-theme-surface border border-theme-border text-theme-muted">
                  <strong>鉴识特征：</strong>{{ clue.tags.join(' · ') }}
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- TAB 5: TIMELINE -->
        <div v-else-if="activeSection === 'TIMELINE'" class="space-y-6 animate-fadeIn">
          <div class="studio-card space-y-4">
            <h3 class="font-bold text-sm tracking-wide text-theme-ink">
              案发精确时空时间线 (Timeline Events)
            </h3>
            <div class="space-y-3">
              <div
                v-for="(ev, idx) in currentCase.timeline"
                :key="idx"
                class="p-3.5 rounded-xl border border-theme-border bg-theme-surface flex items-start gap-4"
              >
                <span class="font-mono font-bold text-xs text-theme-accent shrink-0 mt-0.5">
                  {{ ev.time }}
                </span>
                <div class="space-y-1">
                  <div class="flex items-center gap-2">
                    <span class="font-bold text-xs text-theme-ink">{{ ev.location }}</span>
                    <span class="text-[11px] text-theme-muted font-mono">涉案: {{ ev.actor }}</span>
                  </div>
                  <p class="text-xs text-theme-secondary leading-relaxed">{{ ev.action }}</p>
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
        <div class="studio-side-card space-y-4">
          <div class="flex items-center justify-between">
            <h3 class="font-bold text-sm tracking-wide text-theme-ink">
              确定性规则校验
            </h3>
            <span
              class="studio-badge-status text-xs"
              :class="{ 'is-valid': validationReport.isValid, 'is-warning': !validationReport.isValid }"
            >
              {{ validationReport.score }} / 100
            </span>
          </div>

          <p class="text-xs leading-relaxed text-theme-secondary">
            {{ validationReport.isValid ? '规则闭环全绿通过，不存在时空或密室锁闭冲突。' : `存在 ${validationReport.conflicts.length} 处硬逻辑冲突，建议执行自愈修复。` }}
          </p>

          <button
            v-if="!validationReport.isValid"
            type="button"
            @click="handleTriggerSelfRepair"
            class="w-full flex items-center justify-center gap-2 py-2 rounded-xl text-xs font-bold transition shadow-xs cursor-pointer bg-theme-accent hover:bg-theme-accent-hover text-white"
          >
            <RotateCcw class="w-3.5 h-3.5" />
            <span>执行自愈重规划</span>
          </button>

          <button
            type="button"
            @click="activeSection = 'LOGIC_VERIFY'"
            class="w-full flex items-center justify-center gap-1.5 py-1.5 rounded-xl border border-theme-border bg-theme-surface hover:bg-theme-card-subtle text-theme-accent text-xs font-medium transition cursor-pointer"
          >
            <Scale class="w-3.5 h-3.5 text-theme-accent" />
            <span>查看完整逻辑校验图表 →</span>
          </button>
        </div>

        <!-- Case Metadata Card -->
        <div class="studio-side-card space-y-3 text-xs">
          <h3 class="font-bold text-sm tracking-wide text-theme-ink">
            案卷关键属性
          </h3>
          <div class="space-y-2 text-theme-secondary">
            <div class="flex items-center justify-between">
              <span>预设凶手：</span>
              <span class="font-bold text-theme-accent">
                {{ currentCase.suspects.find((s) => s.id === currentCase.trueCulpritId)?.name || '未锁定' }}
              </span>
            </div>
            <div class="flex items-center justify-between">
              <span>涉案人数：</span>
              <span class="font-mono text-theme-ink">{{ currentCase.suspects.length }} 位</span>
            </div>
            <div class="flex items-center justify-between">
              <span>搜查物证：</span>
              <span class="font-mono text-theme-ink">{{ currentCase.clues.length }} 件</span>
            </div>
            <div class="flex items-center justify-between">
              <span>涉案场景：</span>
              <span class="font-mono text-theme-ink">{{ GALLERY_ROOMS.length }} 处</span>
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
      <div class="w-full max-w-lg rounded-2xl border border-theme-border bg-theme-card text-theme-ink p-6 space-y-4 shadow-2xl">
        <div class="flex items-center justify-between">
          <h3 class="font-bold text-sm text-theme-ink">上传本地剧本让 Agent 解析</h3>
          <button
            type="button"
            @click="isUploadModalOpen = false"
            class="p-1 rounded opacity-60 hover:opacity-100 cursor-pointer text-theme-muted hover:text-theme-ink"
          >
            <X class="w-4 h-4" />
          </button>
        </div>
        <p class="text-xs text-theme-secondary leading-relaxed">
          支持解析 PDF、Word (.docx)、Markdown 或纯文本剧本。解析引擎将自动提取人物、时空与物证关系并注入工作台。
        </p>

        <div class="border-2 border-dashed border-theme-border rounded-xl p-8 text-center space-y-2 bg-theme-surface">
          <Upload class="w-8 h-8 mx-auto text-theme-accent opacity-50" />
          <div class="text-xs font-bold text-theme-ink">点击选择或拖拽剧本文件至此处</div>
          <div class="text-[10px] text-theme-muted">支持格式: .pdf, .docx, .md, .txt, .json</div>
        </div>

        <div class="flex justify-end gap-2 pt-2">
          <button
            type="button"
            @click="isUploadModalOpen = false"
            class="px-4 py-1.5 rounded-xl border border-theme-border bg-theme-surface text-theme-secondary hover:text-theme-ink text-xs font-medium cursor-pointer"
          >
            取消
          </button>
          <button
            type="button"
            @click="handleSimulateScriptIngest"
            class="px-5 py-1.5 rounded-xl text-xs font-bold shadow-xs cursor-pointer bg-theme-accent hover:bg-theme-accent-hover text-white"
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
      <div class="w-full max-w-md h-full border-l border-theme-border bg-theme-card text-theme-ink p-6 flex flex-col justify-between shadow-2xl animate-fadeIn">
        <div class="space-y-4 flex-1 overflow-y-auto">
          <div class="flex items-center justify-between pb-3 border-b border-theme-border">
            <div class="flex items-center gap-2">
              <Activity class="w-4 h-4 text-theme-accent" />
              <h3 class="font-bold text-sm text-theme-ink">工作流执行详情与日志</h3>
            </div>
            <button
              type="button"
              @click="isTraceDrawerOpen = false"
              class="p-1 rounded opacity-60 hover:opacity-100 cursor-pointer text-theme-muted hover:text-theme-ink"
            >
              <X class="w-4 h-4" />
            </button>
          </div>

          <div class="space-y-2 text-xs font-mono">
            <div v-for="(log, i) in terminalLogs" :key="i" class="p-2 rounded bg-theme-surface border border-theme-border leading-relaxed text-[11px] text-theme-secondary">
              {{ log }}
            </div>
          </div>
        </div>

        <div class="pt-4 border-t border-theme-border flex justify-end">
          <button
            type="button"
            @click="isTraceDrawerOpen = false"
            class="px-4 py-1.5 rounded-xl border border-theme-border bg-theme-surface text-theme-secondary hover:text-theme-ink text-xs font-bold cursor-pointer"
          >
            关闭详情
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
@reference "../../index.css";

.studio-card {
  @apply rounded-2xl p-6 border border-theme-border bg-theme-card text-theme-ink shadow-sm font-serif;
}

.studio-side-card {
  @apply rounded-2xl p-5 border border-theme-border bg-theme-card text-theme-ink shadow-sm font-serif;
}

.studio-nav-btn {
  @apply w-full flex items-center justify-between px-3.5 py-2.5 text-xs transition cursor-pointer rounded-xl text-theme-muted hover:bg-theme-card-subtle hover:text-theme-ink;
}

.studio-nav-btn-active {
  @apply bg-theme-card-subtle text-theme-accent font-bold border-l-4 border-theme-accent rounded-r-xl rounded-l-none shadow-xs hover:text-theme-accent;
}

.studio-input {
  @apply w-full text-xs p-3 rounded-xl border border-theme-border bg-theme-surface text-theme-ink focus:outline-none focus:border-theme-accent transition;
}

.studio-theme-switch-btn {
  @apply px-3 py-1 rounded-full flex items-center gap-1.5 transition text-xs font-serif font-bold cursor-pointer text-theme-muted hover:text-theme-ink;
}

.studio-theme-switch-btn.is-active {
  @apply bg-theme-accent text-white shadow-xs;
}

.studio-preset-item {
  @apply w-full flex items-center justify-between px-2.5 py-2 rounded-lg text-left transition cursor-pointer text-theme-secondary hover:bg-theme-card-subtle;
}

.studio-preset-item.is-active {
  @apply bg-theme-card-subtle text-theme-accent font-bold border border-theme-border;
}

.studio-suspect-chip {
  @apply p-2.5 rounded-xl border border-theme-border bg-theme-surface/60 text-theme-muted hover:border-theme-accent/50 text-xs cursor-pointer transition;
}

.studio-suspect-chip.is-active {
  @apply bg-theme-surface border-theme-accent text-theme-accent font-bold shadow-xs;
}

.studio-badge-status {
  @apply font-mono px-2 py-0.5 rounded font-bold;
}

.studio-badge-status.is-valid {
  @apply bg-emerald-500/15 text-emerald-500;
}

.studio-badge-status.is-warning {
  @apply bg-amber-500/15 text-amber-500;
}

.studio-suspect-card {
  @apply p-4 rounded-xl border border-theme-border bg-theme-surface transition space-y-3;
}

.studio-suspect-card.is-culprit {
  @apply bg-theme-card-subtle border-theme-accent;
}

.studio-location-card {
  @apply p-4 rounded-xl border border-theme-border bg-theme-surface space-y-2;
}

.studio-location-card.is-crime-scene {
  @apply bg-red-950/15 border-red-500/30;
}

.studio-clue-card {
  @apply p-4 rounded-xl border border-theme-border bg-theme-surface space-y-2;
}

.studio-clue-card.is-crucial {
  @apply bg-theme-card-subtle border-theme-accent/60;
}
</style>
