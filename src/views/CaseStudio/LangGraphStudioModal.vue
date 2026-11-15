<script setup lang="ts">
import { ref, computed, watch } from 'vue';
import type { LangGraphNodeId, StudioCaseData } from '../../core/studio';
import {
  type LangGraphPipelineSnapshot,
  createInitialPipelineSnapshot,
  executeLangGraphStep,
  buildNPCKnowledgeAndBoundaries,
} from '../../core/studio';
import { sound } from '../../utils/audio';
import {
  X,
  Play,
  RotateCcw,
  Upload,
  Zap,
  Activity,
  CheckCircle2,
  AlertTriangle,
  Users,
  Compass,
  ShieldCheck,
  ChevronRight,
  Terminal,
  Layers,
  Check,
  RefreshCw,
  Eye,
  FileCode,
} from 'lucide-vue-next';

interface Props {
  isOpen: boolean;
  themeMode?: 'dark' | 'light';
  initialScript?: {
    filename: string;
    text: string;
  };
}

const props = withDefaults(defineProps<Props>(), {
  themeMode: 'dark',
  initialScript: undefined,
});

const emit = defineEmits<{
  (e: 'close'): void;
  (e: 'applyCase', caseData: StudioCaseData): void;
  (e: 'directPlay', caseData: StudioCaseData): void;
}>();

const PRESET_SCRIPTS = [
  {
    id: 'midnight_gallery',
    title: '《午夜画廊：锁闭之谜》',
    filename: 'midnight_gallery_script.md',
    tag: '标杆闭环案',
    description: '秋季画展策展人死于内锁修复室，停摆怀表倒拨制造死者活人假象。',
    text: `【剧本案名】《午夜画廊：锁闭之谜》
【类型】经典密室 / 物理与时空双重诡计
【案发时间】2026年10月18日 22:30 报案
【案发地点】星海现代美术馆 · 文物修复室（第一现场）
【受害者】陈默（42岁，知名策展人兼艺术评论家）

【案发背景】
美术馆正在举办秋季特展「微光之境」开幕酒会。21:50 散场；22:00 林岚与陈默发生激烈争执；
22:15 陈默进入修复室整理藏品后大门自锁；22:35 保安强行破门，发现陈默倒在工作台旁身亡，后脑遭钝器重击。

【涉案人员】
1. 林岚（27岁，青年画家）：因被陈默剥夺署名权，22:05 打翻镉红颜料抹布并哭着跑回大厅。
2. 周衡（38岁，天使投资人）：500万投资借款清偿违约，曾在香槟杯投放温和镇静剂。
3. 许宁（25岁，画廊助理兼代笔画师）：长期受压榨，22:12 偷偷使用借调的备用门禁卡进入，完成致死钝击后倒拨怀表制造假象。
4. 赵磊（34岁，夜班安保主管）：22:20 电闸跳闸巡视，未注意到修复室微光。

【核心诡计】
利用停摆怀表倒拨 20 分钟（实际死亡在 22:12，怀表定格在 22:15），制造死者在真凶离开后依然活着的错觉，并借用备用门禁卡从外侧反锁。`,
  },
  {
    id: 'snow_manor',
    title: '《暴风雪山庄：钟楼之锁》',
    filename: 'snow_manor_case.txt',
    tag: '含逻辑冲突·演示自愈',
    description: '大雪封山古老庄园，钟楼机芯室离奇锁死。内置时空位移与权限矛盾，供 LangGraph 自愈修复演示。',
    text: `【剧本案名】《暴风雪山庄：钟楼之锁》
【类型】暴风雪山庄 / 孤岛机械密室
【案发时间】暴风雪之夜 23:00
【案发地点】雪原孤庄 · 独立钟楼机芯室（外围雪地无脚印）
【受害者】霍华德公爵（65岁，庄园领主）

【涉案人员】
1. 伊森（28岁，远房侄子）：因遗嘱修改被剥夺继承权，心怀杀意。
2. 罗素（45岁，私人医生）：因违规开具处方麻醉药被领主勒索。
3. 阿诺（58岁，庄园老管家）：贪墨公款即将败露。
4. 艾拉（23岁，年轻女仆）：在暴风雪中目击钟楼敲击异常。

【故意植入矛盾（供自愈演示）】
- 原始记录中伊森在 22:45 既在宴会大厅壁炉旁，又被记录在钟楼机芯室。
- 钟楼大门于 22:30 上锁，但有人在 22:50 无卡无钥匙声称自由出入。
LangGraph 将在 LOGIC_VALIDATE 节点捕获冲突，并调度 REVISION_NODE 自动重规划时间线闭环！`,
  },
  {
    id: 'yacht_poison',
    title: '《深海游艇：无声晚宴》',
    filename: 'ocean_yacht_mystery.json',
    tag: '毒理与延时递送',
    description: '公海夜航中的暴风雨晚宴，顶层VIP观景舱毒杀案，冰块延时融化与双重口供掩护。',
    text: `【剧本案名】《深海游艇：无声晚宴》
【类型】海上游艇 / 毒物物理延时
【案发时间】公海航行途中 21:45
【案发地点】奢华游艇 · 顶层VIP全景观景舱
【受害者】雷蒙德（50岁，跨国游艇俱乐部创始人）

【涉案人员】
1. 维多利亚（32岁，名媛社交家）：因家族股权清算与雷蒙德彻底决裂。
2. 卡特（29岁，首席调酒师）：家族酒庄被强占，利用空心冰块封装速效毒素，延时45分钟融化。
3. 戴维（40岁，游艇安保长）：掩盖违禁品走私，在关键时刻提供伪证。
4. 肖恩（35岁，大副）：负责航海雷达记录，声称案发时无任何船只靠泊。

【核心诡计】
将毒素封装于特殊冻结的重层空心冰球中。雷蒙德独饮香槟时，冰球未化；直至45分钟后凶手在甲板拥有完全不在场证明时毒发。`,
  },
];

const activeTab = ref<'GRAPH' | 'ARTIFACT' | 'TERMINAL'>('GRAPH');
const selectedNodeForInspect = ref<LangGraphNodeId>('CASE_GENERATE');
const isRunningAll = ref(false);

const initialScriptData = props.initialScript || PRESET_SCRIPTS[0];
const pipelineState = ref<LangGraphPipelineSnapshot>(
  createInitialPipelineSnapshot(initialScriptData.filename, initialScriptData.text)
);

const fileInputRef = ref<HTMLInputElement | null>(null);

watch(
  () => props.initialScript,
  (newScript) => {
    if (newScript) {
      pipelineState.value = createInitialPipelineSnapshot(newScript.filename, newScript.text);
    }
  }
);

const handleRunSingleStep = async (targetNode?: LangGraphNodeId) => {
  sound.playPaperRustle();
  const nextNode = targetNode || pipelineState.value.currentStep;

  const { nextSnapshot } = await executeLangGraphStep(nextNode, pipelineState.value);

  const order: LangGraphNodeId[] = [
    'DOC_PARSE',
    'SCRIPT_ANALYZE',
    'CASE_PLAN',
    'CASE_GENERATE',
    'LOGIC_VALIDATE',
    'REVISION_NODE',
    'HUMAN_REVIEW',
    'PUBLISHED',
  ];

  const currentIndex = order.indexOf(nextNode);
  let nextStep = order[Math.min(currentIndex + 1, order.length - 1)];

  if (nextNode === 'LOGIC_VALIDATE') {
    const isValid = nextSnapshot.artifacts.LOGIC_VALIDATE?.report.isValid;
    if (!isValid) {
      nextStep = 'REVISION_NODE';
    } else {
      nextStep = 'HUMAN_REVIEW';
    }
  } else if (nextNode === 'REVISION_NODE') {
    nextStep = 'HUMAN_REVIEW';
  }

  pipelineState.value = {
    ...nextSnapshot,
    currentStep: nextStep,
  };
  selectedNodeForInspect.value = nextNode;
};

const handleRunFullPipeline = async () => {
  sound.playClueFound();
  isRunningAll.value = true;

  let current = pipelineState.value;

  const sequence: LangGraphNodeId[] = [
    'DOC_PARSE',
    'SCRIPT_ANALYZE',
    'CASE_PLAN',
    'CASE_GENERATE',
    'LOGIC_VALIDATE',
  ];

  for (const node of sequence) {
    selectedNodeForInspect.value = node;
    const res = await executeLangGraphStep(node, current);
    current = res.nextSnapshot;
    pipelineState.value = current;
  }

  const isValid = current.artifacts.LOGIC_VALIDATE?.report.isValid;
  if (!isValid) {
    selectedNodeForInspect.value = 'REVISION_NODE';
    const resRev = await executeLangGraphStep('REVISION_NODE', current);
    current = resRev.nextSnapshot;
    pipelineState.value = current;
  }

  selectedNodeForInspect.value = 'HUMAN_REVIEW';
  const resReview = await executeLangGraphStep('HUMAN_REVIEW', current);
  current = resReview.nextSnapshot;
  pipelineState.value = current;

  selectedNodeForInspect.value = 'PUBLISHED';
  const resPub = await executeLangGraphStep('PUBLISHED', current);
  current = resPub.nextSnapshot;
  pipelineState.value = current;

  isRunningAll.value = false;
};

const handleResetPipeline = () => {
  sound.playPaperRustle();
  const fresh = createInitialPipelineSnapshot(
    pipelineState.value.inputScript.fileName,
    pipelineState.value.inputScript.rawText
  );
  pipelineState.value = fresh;
  selectedNodeForInspect.value = 'DOC_PARSE';
};

const handleSelectPreset = (preset: (typeof PRESET_SCRIPTS)[0]) => {
  sound.playPaperRustle();
  const fresh = createInitialPipelineSnapshot(preset.filename, preset.text);
  pipelineState.value = fresh;
  selectedNodeForInspect.value = 'DOC_PARSE';
};

const handleFileUpload = (e: Event) => {
  const target = e.target as HTMLInputElement;
  const file = target.files?.[0];
  if (!file) return;

  sound.playPaperRustle();
  const reader = new FileReader();

  reader.onload = (event) => {
    const content = (event.target?.result as string) || '';
    const fresh = createInitialPipelineSnapshot(file.name, content);
    pipelineState.value = fresh;
    selectedNodeForInspect.value = 'DOC_PARSE';
  };

  if (file.name.endsWith('.pdf') || file.name.endsWith('.docx')) {
    reader.onload = () => {
      const simulatedText = `【解析自 ${file.name}】
【案发时间】2026年夜间
【受害者】策展人
【涉案人物】画家、投资人、助手、安保
【现场提取物证】怀表、抹布、账册、门禁卡
${file.name} 包含长篇剧本故事与不在场证明陈述，已完成结构化分块。`;
      const fresh = createInitialPipelineSnapshot(file.name, simulatedText);
      pipelineState.value = fresh;
    };
    reader.readAsArrayBuffer(file);
  } else {
    reader.readAsText(file);
  }
};

const pipelineNodes = [
  {
    id: 'DOC_PARSE' as LangGraphNodeId,
    step: '01',
    title: '文档解析与实体分块',
    desc: '读取 PDF/Word/MD，提取人物实体、地点与时空锚点',
    icon: FileCode,
  },
  {
    id: 'SCRIPT_ANALYZE' as LangGraphNodeId,
    step: '02',
    title: '剧本分析与动机图谱',
    desc: '构建人物利益网络、嫌疑人社会关系与潜在口供矛盾',
    icon: Users,
  },
  {
    id: 'CASE_PLAN' as LangGraphNodeId,
    step: '03',
    title: '案件规划与诡计架构',
    desc: '反锁密室设计、致死时间差诡计与真相骨架规划',
    icon: Compass,
  },
  {
    id: 'CASE_GENERATE' as LangGraphNodeId,
    step: '04',
    title: '案件生成与边界护栏',
    desc: '生成微观物证、分钟时间线与 NPC 防剧透知识库边界',
    icon: ShieldCheck,
  },
  {
    id: 'LOGIC_VALIDATE' as LangGraphNodeId,
    step: '05',
    title: '确定性硬逻辑校验',
    desc: '时空瞬移、密室锁闭、口供矛盾与证据链闭环审查',
    icon: CheckCircle2,
  },
  {
    id: 'REVISION_NODE' as LangGraphNodeId,
    step: '06',
    title: '定向自愈修复 (Conditional Loop)',
    desc: '若校验有矛盾，触发自愈节点定向修平时间戳与证据链',
    icon: RefreshCw,
  },
  {
    id: 'HUMAN_REVIEW' as LangGraphNodeId,
    step: '07',
    title: '人工审核微调',
    desc: '创作者查看中间产物快照，确认无误后签批发布',
    icon: Activity,
  },
  {
    id: 'PUBLISHED' as LangGraphNodeId,
    step: '08',
    title: '案件发布就绪',
    desc: '数据注入游戏引擎运行时，支持一键进入 3D 试玩',
    icon: Play,
  },
];

const getNodeStatusBadgeClass = (status: string) => {
  if (status === 'COMPLETED') return 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30';
  if (status === 'FAILED') return 'bg-red-500/20 text-red-400 border border-red-500/30';
  if (status === 'REPAIRING') return 'bg-amber-500/20 text-amber-400 animate-spin';
  return 'bg-theme-surface text-theme-muted border border-theme-border';
};

const getNodeStatusPillClass = (status: string) => {
  if (status === 'COMPLETED') return 'bg-emerald-500/15 text-emerald-500';
  if (status === 'RUNNING' || status === 'REPAIRING') return 'bg-amber-500/15 text-amber-500 animate-pulse';
  if (status === 'FAILED') return 'bg-red-500/15 text-red-500';
  return 'opacity-40';
};
</script>

<template>
  <div v-if="isOpen" class="langgraph-modal-overlay">
    <!-- Outer Modal Container -->
    <div class="langgraph-modal-window">
      <!-- Top Header Bar -->
      <header class="langgraph-header">
        <!-- Brand & Workflow Title -->
        <div class="flex items-center gap-3">
          <div class="langgraph-brand-badge">
            <Layers class="w-4 h-4" />
          </div>
          <div>
            <div class="flex items-center gap-2">
              <h2 class="font-bold text-sm tracking-wide text-theme-ink">
                LangGraph 案件生成工作流引擎 (Agentic Pipeline)
              </h2>
              <span class="text-[10px] px-2 py-0.5 rounded-full font-mono font-bold bg-theme-surface text-theme-accent border border-theme-border">
                StateGraph: 8 Nodes · Directed Cyclic Graph
              </span>
            </div>
            <p class="text-[11px] font-sans text-theme-muted">
              从长文本剧本到确定性闭环探案游戏：有状态拓扑、硬规则校验与自愈重规划回环
            </p>
          </div>
        </div>

        <!-- Center Tabs: Graph Topology / Artifacts / Terminal -->
        <div class="langgraph-tab-group">
          <button
            @click="activeTab = 'GRAPH'"
            class="langgraph-tab-btn"
            :class="{ 'is-active': activeTab === 'GRAPH' }"
          >
            <Activity class="w-3.5 h-3.5" />
            <span>全景拓扑图</span>
          </button>
          <button
            @click="activeTab = 'ARTIFACT'"
            class="langgraph-tab-btn"
            :class="{ 'is-active': activeTab === 'ARTIFACT' }"
          >
            <Eye class="w-3.5 h-3.5" />
            <span>中间产物监视器</span>
          </button>
          <button
            @click="activeTab = 'TERMINAL'"
            class="langgraph-tab-btn"
            :class="{ 'is-active': activeTab === 'TERMINAL' }"
          >
            <Terminal class="w-3.5 h-3.5" />
            <span>执行流式终端 ({{ pipelineState.logs.length }})</span>
          </button>
        </div>

        <!-- Right Action: Close -->
        <button
          @click="emit('close')"
          class="langgraph-icon-btn"
          title="关闭窗口"
        >
          <X class="w-5 h-5" />
        </button>
      </header>

      <!-- 2. SCRIPT INGESTION STRIP -->
      <div class="langgraph-strip">
        <!-- File Picker & Active Script -->
        <div class="flex items-center flex-wrap gap-2.5">
          <input
            type="file"
            ref="fileInputRef"
            @change="handleFileUpload"
            accept=".pdf,.docx,.doc,.md,.txt,.json"
            class="hidden"
          />
          <button
            @click="fileInputRef?.click()"
            class="langgraph-btn-secondary"
          >
            <Upload class="w-3.5 h-3.5" />
            <span>上传本地剧本 (PDF/Word/MD)</span>
          </button>

          <span class="text-[11px] text-theme-muted">
            或快捷载入精品范例：
          </span>

          <button
            v-for="ps in PRESET_SCRIPTS"
            :key="ps.id"
            @click="handleSelectPreset(ps)"
            class="langgraph-preset-chip"
            :class="{ 'is-active': pipelineState.inputScript.fileName === ps.filename }"
            :title="ps.description"
          >
            <span>{{ ps.title }}</span>
            <span
              :class="[
                'ml-1 text-[9px] px-1 py-0.5 rounded',
                ps.id === 'snow_manor' ? 'bg-amber-500/20 text-amber-500 font-bold' : 'opacity-60'
              ]"
            >
              {{ ps.tag }}
            </span>
          </button>
        </div>

        <!-- Workflow Execution Buttons -->
        <div class="flex items-center gap-2 shrink-0">
          <button
            @click="handleResetPipeline"
            class="langgraph-icon-btn"
            title="重置状态机为初始就绪"
          >
            <RotateCcw class="w-4 h-4" />
          </button>

          <button
            @click="handleRunSingleStep()"
            :disabled="isRunningAll || pipelineState.currentStep === 'PUBLISHED'"
            class="langgraph-btn-secondary"
          >
            <ChevronRight class="w-3.5 h-3.5" />
            <span>单步推进: {{ pipelineState.currentStep }}</span>
          </button>

          <button
            @click="handleRunFullPipeline"
            :disabled="isRunningAll"
            class="langgraph-btn-primary"
          >
            <template v-if="isRunningAll">
              <RefreshCw class="w-3.5 h-3.5 animate-spin" />
              <span>LangGraph 拓扑运行中...</span>
            </template>
            <template v-else>
              <Zap class="w-3.5 h-3.5 fill-current" />
              <span>启动 LangGraph 自动构建与校验</span>
            </template>
          </button>
        </div>
      </div>

      <!-- 3. MAIN WORKSPACE AREA -->
      <div class="flex-1 min-h-0 flex flex-col overflow-hidden">
        <!-- VIEW A: GRAPH TOPOLOGY -->
        <div v-if="activeTab === 'GRAPH'" class="flex-1 overflow-y-auto p-6 space-y-6">
          <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div
              v-for="node in pipelineNodes"
              :key="node.id"
              @click="
                sound.playPaperRustle();
                selectedNodeForInspect = node.id;
                activeTab = 'ARTIFACT';
              "
              class="langgraph-node-card"
              :class="{ 'is-selected': selectedNodeForInspect === node.id }"
            >
              <div class="flex items-center justify-between">
                <div class="flex items-center gap-2">
                  <span
                    class="w-6 h-6 rounded-lg text-xs font-mono font-bold flex items-center justify-center"
                    :class="getNodeStatusBadgeClass(pipelineState.nodeStates[node.id].status)"
                  >
                    {{ node.step }}
                  </span>
                  <component
                    :is="node.icon"
                    class="w-4 h-4"
                    :class="
                      pipelineState.nodeStates[node.id].status === 'COMPLETED'
                        ? 'text-emerald-500'
                        : pipelineState.nodeStates[node.id].status === 'FAILED'
                        ? 'text-red-500'
                        : 'text-theme-accent'
                    "
                  />
                </div>

                <span
                  class="text-[10px] font-mono px-2 py-0.5 rounded-full font-bold"
                  :class="[
                    getNodeStatusPillClass(pipelineState.nodeStates[node.id].status),
                    pipelineState.currentStep === node.id ? 'bg-theme-accent/15 text-theme-accent font-bold' : ''
                  ]"
                >
                  {{
                    pipelineState.nodeStates[node.id].status === 'COMPLETED'
                      ? `已完成 ${pipelineState.nodeStates[node.id].durationMs ? `${pipelineState.nodeStates[node.id].durationMs}ms` : ''}`
                      : pipelineState.nodeStates[node.id].status === 'RUNNING'
                      ? '运行中...'
                      : pipelineState.nodeStates[node.id].status === 'FAILED'
                      ? '逻辑冲突 (转入自愈)'
                      : pipelineState.nodeStates[node.id].status === 'REPAIRING'
                      ? '自愈修复中'
                      : '待执行'
                  }}
                </span>
              </div>

              <div class="space-y-1 my-2">
                <h4 class="font-bold text-xs text-theme-ink">
                  {{ node.title }}
                </h4>
                <p class="text-[11px] leading-relaxed line-clamp-2 text-theme-muted">
                  {{ node.desc }}
                </p>
              </div>

              <div class="pt-2 border-t border-theme-border flex items-center justify-between text-[11px] text-theme-muted">
                <span class="font-mono">{{ node.id }}</span>
                <span class="group-hover:translate-x-0.5 transition-transform font-medium text-theme-accent">
                  查看产物 →
                </span>
              </div>
            </div>
          </div>

          <!-- Feature highlights -->
          <div class="langgraph-info-card space-y-3 font-sans">
            <div class="flex items-center gap-2">
              <ShieldCheck class="w-4 h-4 text-theme-accent" />
              <h3 class="font-bold text-xs text-theme-ink">
                为什么剧本创作需要 LangGraph 而不是单次 LLM Prompt？
              </h3>
            </div>
            <div class="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
              <div class="p-3 rounded-xl border border-theme-border bg-theme-card-subtle">
                <span class="font-bold block mb-1 text-theme-ink">1. 有状态长拓扑图 (Stateful Graph)</span>
                <p class="leading-relaxed text-[11px] text-theme-muted">
                  各节点传递严格结构化的中间产物（实体库、关系图、密室骨架、NPC边界），杜绝单次调用丢失上下文。
                </p>
              </div>
              <div class="p-3 rounded-xl border border-theme-border bg-theme-card-subtle">
                <span class="font-bold block mb-1 text-theme-ink">2. 确定性硬规则门禁 (Engine Validation)</span>
                <p class="leading-relaxed text-[11px] text-theme-muted">
                  由 Game Engine 负责确定性校验（时空碰撞、反锁悖论、口供断裂），而非由 LLM 主观幻觉自行判断。
                </p>
              </div>
              <div class="p-3 rounded-xl border border-theme-border bg-theme-card-subtle">
                <span class="font-bold block mb-1 text-theme-ink">3. 条件分支自愈重规划 (Revision Loop)</span>
                <p class="leading-relaxed text-[11px] text-theme-muted">
                  校验失败不抛弃成果，自动进入定向自愈节点微调时间戳与证据钥匙，形成闭环后才准予发布。
                </p>
              </div>
            </div>
          </div>
        </div>

        <!-- VIEW B: ARTIFACT INSPECTOR -->
        <div v-if="activeTab === 'ARTIFACT'" class="flex-1 overflow-y-auto p-6 space-y-6">
          <div class="flex items-center gap-1.5 overflow-x-auto pb-1 font-sans text-xs">
            <button
              v-for="node in pipelineNodes"
              :key="node.id"
              @click="
                sound.playPaperRustle();
                selectedNodeForInspect = node.id;
              "
              class="langgraph-artifact-chip"
              :class="{ 'is-active': selectedNodeForInspect === node.id }"
            >
              <span>{{ pipelineState.nodeStates[node.id].label.split('与')[0] }}</span>
            </button>
          </div>

          <div class="langgraph-info-card font-sans space-y-4">
            <!-- 1. DOC_PARSE -->
            <div v-if="selectedNodeForInspect === 'DOC_PARSE'" class="space-y-4">
              <div class="flex items-center justify-between pb-3 border-b border-theme-border">
                <div>
                  <h3 class="font-bold text-sm text-theme-ink">
                    01 文档解析产物 (DocParseArtifact)
                  </h3>
                  <p class="text-xs text-theme-muted">
                    已成功提取文档原始字数与四大关键实体清单
                  </p>
                </div>
                <span class="text-xs font-mono font-bold text-emerald-500">
                  {{ pipelineState.artifacts.DOC_PARSE?.rawWordCount || pipelineState.inputScript.rawText.length }} 字符
                </span>
              </div>

              <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
                <div class="p-3.5 rounded-xl border border-theme-border bg-theme-card-subtle">
                  <span class="font-bold block mb-2 text-theme-accent">涉案人物实体:</span>
                  <ul class="space-y-1 text-theme-secondary opacity-90">
                    <li v-for="(c, i) in (pipelineState.artifacts.DOC_PARSE?.entities.characters || ['陈默', '林岚', '周衡', '许宁', '赵磊'])" :key="i">
                      • {{ c }}
                    </li>
                  </ul>
                </div>

                <div class="p-3.5 rounded-xl border border-theme-border bg-theme-card-subtle">
                  <span class="font-bold block mb-2 text-theme-accent">涉案空间坐标:</span>
                  <ul class="space-y-1 text-theme-secondary opacity-90">
                    <li v-for="(l, i) in (pipelineState.artifacts.DOC_PARSE?.entities.locations || ['文物修复室', '中央艺术展厅', '策展人办公室', '安保监控室'])" :key="i">
                      • {{ l }}
                    </li>
                  </ul>
                </div>

                <div class="p-3.5 rounded-xl border border-theme-border bg-theme-card-subtle">
                  <span class="font-bold block mb-2 text-theme-accent">关键物理物证:</span>
                  <ul class="space-y-1 text-theme-secondary opacity-90">
                    <li v-for="(c, i) in (pipelineState.artifacts.DOC_PARSE?.entities.clues || ['停摆怀表', '带颜料抹布', '撕碎借款协议', '门禁刷卡'])" :key="i">
                      • {{ c }}
                    </li>
                  </ul>
                </div>

                <div class="p-3.5 rounded-xl border border-theme-border bg-theme-card-subtle">
                  <span class="font-bold block mb-2 text-theme-accent">时空时间基准:</span>
                  <ul class="space-y-1 text-theme-secondary opacity-90">
                    <li v-for="(t, i) in (pipelineState.artifacts.DOC_PARSE?.entities.timeAnchors || ['21:50 散场', '22:00 理论', '22:15 致死', '22:30 破门'])" :key="i">
                      • {{ t }}
                    </li>
                  </ul>
                </div>
              </div>
            </div>

            <!-- 2. SCRIPT_ANALYZE -->
            <div v-else-if="selectedNodeForInspect === 'SCRIPT_ANALYZE'" class="space-y-4">
              <div class="flex items-center justify-between pb-3 border-b border-theme-border">
                <div>
                  <h3 class="font-bold text-sm text-theme-ink">
                    02 剧本分析与动机图谱 (ScriptAnalyzeArtifact)
                  </h3>
                  <p class="text-xs text-theme-muted">
                    自动建立嫌疑人社会关系矩阵、利益冲突与作案动机排查
                  </p>
                </div>
              </div>

              <div class="space-y-3">
                <span class="text-xs font-bold block text-theme-ink">动机冲突图谱矩阵：</span>
                <div class="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
                  <div
                    v-for="(m, i) in (pipelineState.artifacts.SCRIPT_ANALYZE?.motives || [
                      { suspect: '许宁', target: '陈默', reason: '长期遭受代笔剥削，署名权被夺', severity: 'FATAL' },
                      { suspect: '林岚', target: '陈默', reason: '因画作署名权发生激烈争吵，打翻抹布', severity: 'HIGH' },
                      { suspect: '周衡', target: '陈默', reason: '500万投资协议违约清偿纠纷', severity: 'MEDIUM' },
                    ])"
                    :key="i"
                    :class="[
                      'p-3 rounded-xl border space-y-1.5',
                      m.severity === 'FATAL'
                        ? 'bg-red-500/10 border-red-500/30'
                        : 'bg-theme-card-subtle border-theme-border'
                    ]"
                  >
                    <div class="flex items-center justify-between">
                      <span class="font-bold text-xs text-theme-ink">{{ m.suspect }} → {{ m.target }}</span>
                      <span
                        :class="[
                          'text-[10px] font-mono px-1.5 py-0.5 rounded font-bold',
                          m.severity === 'FATAL' ? 'bg-red-600 text-white' : 'opacity-60 text-theme-muted'
                        ]"
                      >
                        {{ m.severity }}
                      </span>
                    </div>
                    <p class="leading-relaxed text-[11px] text-theme-secondary">
                      {{ m.reason }}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <!-- 3. CASE_PLAN -->
            <div v-else-if="selectedNodeForInspect === 'CASE_PLAN'" class="space-y-4">
              <div class="flex items-center justify-between pb-3 border-b border-theme-border">
                <div>
                  <h3 class="font-bold text-sm text-theme-ink">
                    03 案件规划与核心诡计 (CasePlanArtifact)
                  </h3>
                  <p class="text-xs text-theme-muted">
                    确立密室破局物理机制、时间线错觉与反转节奏
                  </p>
                </div>
              </div>

              <div class="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                <div class="p-4 rounded-xl border border-theme-border bg-theme-card-subtle space-y-2">
                  <span class="font-bold text-xs text-theme-accent block">物理与时空核心诡计：</span>
                  <p class="leading-relaxed text-theme-ink">
                    {{
                      pipelineState.artifacts.CASE_PLAN?.truth.coreTrick ||
                      '利用停摆金怀表倒拨 20 分钟制造死者活人假象；通过备用门禁卡从外侧完成反锁。'
                    }}
                  </p>
                  <div class="pt-2 border-t border-theme-border space-y-1 text-[11px] text-theme-muted">
                    <div>• 法医死亡推断窗口：{{ pipelineState.artifacts.CASE_PLAN?.truth.murderWindow.start || '22:10' }} - {{ pipelineState.artifacts.CASE_PLAN?.truth.murderWindow.end || '22:20' }}</div>
                    <div>• 第一凶案现场：{{ pipelineState.artifacts.CASE_PLAN?.truth.foundLocation || '文物修复室' }}</div>
                    <div>• 致死机制：{{ pipelineState.artifacts.CASE_PLAN?.truth.causeOfDeath || '后脑钝器打击致颅脑损伤' }}</div>
                  </div>
                </div>

                <div class="p-4 rounded-xl border border-theme-border bg-theme-card-subtle space-y-2">
                  <span class="font-bold text-xs text-theme-accent block">玩家叙事推进节奏：</span>
                  <div class="space-y-1.5">
                    <div
                      v-for="(b, i) in (pipelineState.artifacts.CASE_PLAN?.narrativeBeats || [
                        { stage: '开场', title: '画廊停电与意外锁死', triggerClue: '配电闸' },
                        { stage: '发现', title: '停摆的怀表', triggerClue: '停摆怀表' },
                        { stage: '反转', title: '不在场证明与备用卡', triggerClue: '备用门禁卡' },
                        { stage: '揭晓', title: '修复室夹层与代笔真相', triggerClue: '带颜料抹布' },
                      ])"
                      :key="i"
                      class="flex items-center justify-between text-[11px]"
                    >
                      <span class="font-bold text-theme-ink">{{ b.stage }}：{{ b.title }}</span>
                      <span class="text-theme-muted font-mono">触发物证: {{ b.triggerClue }}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <!-- 4. CASE_GENERATE -->
            <div v-else-if="selectedNodeForInspect === 'CASE_GENERATE'" class="space-y-5">
              <div class="flex items-center justify-between pb-3 border-b border-theme-border">
                <div>
                  <h3 class="font-bold text-sm text-theme-ink">
                    04 案件生成与 NPC 防剧透回答边界 (CaseGenerateArtifact)
                  </h3>
                  <p class="text-xs text-theme-muted">
                    已生成全量微观物证、时间线与 4 组嫌疑人专属背景知识库与防破防回答边界系统指令
                  </p>
                </div>
              </div>

              <div class="space-y-3">
                <span class="text-xs font-bold block text-theme-ink">
                  NPC 背景知识库与防剧透护栏边界 (NPC Knowledge Boundaries & Anti-Spoiler Prompts)：
                </span>

                <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div
                    v-for="npc in (pipelineState.artifacts.CASE_GENERATE?.npcBoundaries || (pipelineState.generatedCase ? buildNPCKnowledgeAndBoundaries(pipelineState.generatedCase) : []))"
                    :key="npc.suspectId"
                    class="p-4 rounded-xl border border-theme-border bg-theme-card-subtle space-y-3 text-xs"
                  >
                    <div class="flex items-center justify-between">
                      <div class="flex items-center gap-2">
                        <span class="w-7 h-7 rounded-full flex items-center justify-center font-bold text-xs bg-theme-accent text-white">
                          {{ npc.name.slice(0, 1) }}
                        </span>
                        <div>
                          <span class="font-bold text-sm text-theme-ink">{{ npc.name }}</span>
                          <span class="text-[11px] text-theme-muted ml-1.5">{{ npc.title }}</span>
                        </div>
                      </div>
                      <span class="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 font-bold">
                        护栏激活
                      </span>
                    </div>

                    <div class="space-y-1">
                      <span class="font-bold text-[11px] text-theme-accent block">
                        【NPC 背景认知与记忆边界】:
                      </span>
                      <ul class="space-y-1 text-[11px] text-theme-secondary leading-relaxed">
                        <li v-for="(k, ki) in npc.backgroundKnowledge.slice(0, 3)" :key="ki">
                          • {{ k }}
                        </li>
                      </ul>
                    </div>

                    <div class="space-y-1 pt-2 border-t border-theme-border">
                      <span class="font-bold text-[11px] text-red-500 block">
                        【严格禁止讨论与自辩策略】:
                      </span>
                      <div class="text-[11px] space-y-1 leading-relaxed text-theme-secondary">
                        <div>• 禁答敏感点：{{ npc.boundaryRules.forbiddenTopics[0] }}</div>
                        <div>• 质询应对：{{ npc.boundaryRules.confessionDefense }}</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <!-- 5. LOGIC_VALIDATE -->
            <div v-else-if="selectedNodeForInspect === 'LOGIC_VALIDATE'" class="space-y-4">
              <div class="flex items-center justify-between pb-3 border-b border-theme-border">
                <div>
                  <h3 class="font-bold text-sm text-theme-ink">
                    05 确定性硬规则校验矩阵 (LogicValidateArtifact)
                  </h3>
                  <p class="text-xs text-theme-muted">
                    Game Engine 严苛审查时空重叠、物理自锁悖论与不在场证明
                  </p>
                </div>
                <span
                  class="text-base font-bold font-mono"
                  :class="{
                    'text-emerald-500': pipelineState.artifacts.LOGIC_VALIDATE?.report.isValid,
                    'text-amber-500': !pipelineState.artifacts.LOGIC_VALIDATE?.report.isValid
                  }"
                >
                  综合得分: {{ pipelineState.artifacts.LOGIC_VALIDATE?.report.score || 100 }} / 100
                </span>
              </div>

              <div class="space-y-2 text-xs">
                <div
                  v-for="(chk, i) in (pipelineState.artifacts.LOGIC_VALIDATE?.matrixChecks || [
                    { id: '1', name: '时空瞬移悖论检查', status: 'PASS', note: '无同一时间身处两地现象。' },
                    { id: '2', name: '物理密室锁闭屏障检查', status: 'PASS', note: '出入均有门禁卡物理物证支撑。' },
                    { id: '3', name: '真凶致命物证闭环检查', status: 'PASS', note: '存在直接绑定真凶的纤维与时间戳物证。' },
                    { id: '4', name: '真凶作案时间不在场矛盾检查', status: 'PASS', note: '不在场证明留有合理破绽。' },
                  ])"
                  :key="i"
                  class="p-3 rounded-xl border flex items-center justify-between"
                  :class="{
                    'bg-emerald-500/10 border-emerald-500/20': chk.status === 'PASS',
                    'bg-red-500/10 border-red-500/20': chk.status !== 'PASS'
                  }"
                >
                  <div class="flex items-center gap-2.5">
                    <CheckCircle2 v-if="chk.status === 'PASS'" class="w-4 h-4 text-emerald-500" />
                    <AlertTriangle v-else class="w-4 h-4 text-red-500" />
                    <div>
                      <span class="font-bold block text-xs text-theme-ink">{{ chk.name }}</span>
                      <span class="text-[11px] text-theme-muted">{{ chk.note }}</span>
                    </div>
                  </div>
                  <span
                    class="font-mono font-bold text-xs"
                    :class="{ 'text-emerald-500': chk.status === 'PASS', 'text-red-500': chk.status !== 'PASS' }"
                  >
                    {{ chk.status }}
                  </span>
                </div>
              </div>
            </div>

            <!-- 6. REVISION_NODE -->
            <div v-else-if="selectedNodeForInspect === 'REVISION_NODE'" class="space-y-4">
              <div class="flex items-center justify-between pb-3 border-b border-theme-border">
                <div>
                  <h3 class="font-bold text-sm text-theme-ink">
                    06 定向自愈与重规划产物 (RevisionArtifact)
                  </h3>
                  <p class="text-xs text-theme-muted">
                    捕获逻辑矛盾后，自动触发 Directed Cyclic Feedback Loop 注入补丁
                  </p>
                </div>
                <span class="text-xs font-mono font-bold text-amber-500">
                  循环回环: #{{ pipelineState.artifacts.REVISION_NODE?.loopCount || 1 }}
                </span>
              </div>

              <div class="space-y-3 text-xs">
                <div
                  v-for="(fix, i) in (pipelineState.artifacts.REVISION_NODE?.fixes || [
                    {
                      category: '时空瞬移校准补丁',
                      description: '校正嫌疑人路程在途动线，平滑走廊到达时间戳，消除空间瞬移矛盾。',
                      before: '22:00 同时处于宴会大厅与钟楼',
                      after: '22:05 走廊通行，22:10 到达钟楼机芯室',
                    },
                    {
                      category: '物理权限破局补丁',
                      description: '在证据链中注入借调的备用钥匙卡与刷卡记录，闭环自锁密室通行逻辑。',
                      before: '无卡直接穿行密闭防盗门',
                      after: '持偷拿的编号#04备用门禁卡通过感应',
                    },
                  ])"
                  :key="i"
                  class="p-3.5 rounded-xl border border-theme-border bg-theme-card-subtle space-y-2"
                >
                  <div class="flex items-center justify-between">
                    <span class="font-bold text-emerald-400 font-mono">
                      // {{ fix.category }}
                    </span>
                    <span class="text-[10px] bg-emerald-500/20 text-emerald-400 font-bold px-2 py-0.5 rounded-full">
                      已打补丁
                    </span>
                  </div>
                  <p class="leading-relaxed text-theme-secondary">{{ fix.description }}</p>
                  <div class="grid grid-cols-2 gap-2 text-[11px] pt-1">
                    <div class="p-2 rounded bg-red-950/30 text-red-300 border border-red-500/20">
                      <span class="font-bold block">修复前 (矛盾):</span>
                      <span>{{ fix.before }}</span>
                    </div>
                    <div class="p-2 rounded bg-emerald-950/30 text-emerald-300 border border-emerald-500/20">
                      <span class="font-bold block">修复后 (闭环):</span>
                      <span>{{ fix.after }}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <!-- 7. HUMAN_REVIEW -->
            <div v-else-if="selectedNodeForInspect === 'HUMAN_REVIEW'" class="space-y-4">
              <div class="flex items-center justify-between pb-3 border-b border-theme-border">
                <div>
                  <h3 class="font-bold text-sm text-theme-ink">
                    07 人工审核微调清单 (HumanReviewArtifact)
                  </h3>
                  <p class="text-xs text-theme-muted">
                    创作者签署确认：所有要素符合沉浸互动探案标准
                  </p>
                </div>
                <span class="text-xs font-mono font-bold text-emerald-500">
                  审查就绪
                </span>
              </div>

              <div class="space-y-2 text-xs">
                <div
                  v-for="(item, i) in [
                    '核心作案动机与人物社会关系合理',
                    '物理密室与怀表时间差诡计可被玩家推理破解',
                    '4 位 NPC 防剧透系统指令与知识库边界齐备',
                    '8 件微观证物均包含法医及365nm UV勘验注记',
                    '确定性硬逻辑校验已全绿（100分闭环）',
                  ]"
                  :key="i"
                  class="p-3 rounded-xl border border-theme-border bg-theme-card-subtle flex items-center justify-between text-theme-ink"
                >
                  <span class="font-medium">{{ item }}</span>
                  <span class="flex items-center gap-1 text-emerald-500 font-bold text-xs">
                    <Check class="w-3.5 h-3.5" />
                    <span>通过</span>
                  </span>
                </div>
              </div>
            </div>

            <!-- 8. PUBLISHED -->
            <div v-else-if="selectedNodeForInspect === 'PUBLISHED'" class="space-y-4">
              <div class="flex items-center justify-between pb-3 border-b border-theme-border">
                <div>
                  <h3 class="font-bold text-sm text-theme-ink">
                    08 案件发布就绪 (PublishedArtifact)
                  </h3>
                  <p class="text-xs text-theme-muted">
                    已生成完整的游戏引擎可执行案卷对象，随时进入试玩
                  </p>
                </div>
              </div>

              <div class="p-4 rounded-xl border border-emerald-500/30 bg-emerald-500/10 text-center space-y-3">
                <CheckCircle2 class="w-8 h-8 text-emerald-500 mx-auto" />
                <div>
                  <h4 class="font-bold text-sm text-theme-ink">
                    《{{ pipelineState.generatedCase?.title || '午夜画廊：锁闭之谜' }}》发布就绪
                  </h4>
                  <p class="text-xs text-theme-muted mt-1">
                    已装载 4 个场景、{{ pipelineState.generatedCase?.clues.length || 8 }} 件证物、4 位 NPC 的全部防剧透知识库边界。
                  </p>
                </div>

                <div class="flex items-center justify-center gap-3 pt-2">
                  <button
                    @click="
                      if (pipelineState.generatedCase) {
                        emit('applyCase', pipelineState.generatedCase);
                      }
                      emit('close');
                    "
                    class="langgraph-btn-secondary"
                  >
                    装载至创作工作台
                  </button>
                  <button
                    @click="
                      if (pipelineState.generatedCase) {
                        emit('directPlay', pipelineState.generatedCase);
                      }
                    "
                    class="langgraph-btn-primary"
                  >
                    <Play class="w-3.5 h-3.5 fill-current" />
                    <span>立即试玩刚刚生成的案件</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- VIEW C: TERMINAL -->
        <div v-if="activeTab === 'TERMINAL'" class="flex-1 overflow-y-auto p-6 font-mono text-xs">
          <div class="rounded-2xl p-4 border border-theme-border bg-stone-950 text-stone-200 space-y-2 h-full flex flex-col justify-between">
            <div class="flex items-center justify-between pb-2 border-b border-stone-800">
              <div class="flex items-center gap-2">
                <Terminal class="w-4 h-4 text-theme-accent" />
                <span class="font-bold text-[11px] uppercase tracking-wider text-stone-400">
                  LangGraph Engine Execution Logs
                </span>
              </div>
              <span class="text-[10px] text-stone-500">
                {{ pipelineState.logs.length }} 条记录
              </span>
            </div>

            <div class="flex-1 overflow-y-auto space-y-1.5 pr-2 py-2">
              <div v-for="log in pipelineState.logs" :key="log.id" class="flex items-start gap-2.5 leading-relaxed text-[11px]">
                <span class="text-stone-500 shrink-0">[{{ log.timestamp }}]</span>
                <span
                  :class="[
                    'px-1.5 py-0.5 rounded text-[10px] font-bold shrink-0',
                    log.level === 'SUCCESS'
                      ? 'bg-emerald-950 text-emerald-400 border border-emerald-800/40'
                      : log.level === 'WARN'
                      ? 'bg-red-950 text-red-400 border border-red-800/40'
                      : log.level === 'REPAIR'
                      ? 'bg-amber-950 text-amber-400 border border-amber-800/40'
                      : 'bg-stone-800 text-stone-300'
                  ]"
                >
                  {{ log.nodeId }}
                </span>
                <span
                  :class="[
                    log.level === 'SUCCESS'
                      ? 'text-emerald-300 font-bold'
                      : log.level === 'WARN'
                      ? 'text-red-300 font-bold'
                      : log.level === 'REPAIR'
                      ? 'text-amber-300 font-bold'
                      : 'text-stone-300'
                  ]"
                >
                  {{ log.message }}
                </span>
              </div>
            </div>

            <div class="pt-2 border-t border-stone-800 text-[10px] text-stone-500 flex items-center justify-between">
              <span>状态机拓扑: DOC_PARSE -&gt; SCRIPT_ANALYZE -&gt; CASE_PLAN -&gt; CASE_GENERATE -&gt; LOGIC_VALIDATE -&gt; REVISION_NODE -&gt; HUMAN_REVIEW -&gt; PUBLISHED</span>
              <span class="text-emerald-400">● 调度就绪</span>
            </div>
          </div>
        </div>
      </div>

      <!-- 4. MODAL FOOTER BAR -->
      <footer class="langgraph-footer">
        <div class="flex items-center gap-3">
          <span class="font-mono text-theme-muted">
            当前就绪案卷：{{ pipelineState.generatedCase?.title || '午夜画廊：锁闭之谜' }}
          </span>
          <span
            class="px-2 py-0.5 rounded-full text-[10px] font-bold"
            :class="
              pipelineState.artifacts.LOGIC_VALIDATE?.report.isValid
                ? 'bg-emerald-500/15 text-emerald-500'
                : 'bg-amber-500/15 text-amber-500'
            "
          >
            {{ pipelineState.artifacts.LOGIC_VALIDATE?.report.isValid ? '规则闭环通过 (100%)' : '待校验修复' }}
          </span>
        </div>

        <div class="flex items-center gap-2">
          <button
            @click="emit('close')"
            class="langgraph-btn-secondary"
          >
            关闭
          </button>
          <button
            @click="
              sound.playClueFound();
              if (pipelineState.generatedCase) {
                emit('applyCase', pipelineState.generatedCase);
              }
              emit('close');
            "
            class="langgraph-btn-secondary font-bold"
          >
            应用至工作台
          </button>
          <button
            @click="
              sound.playClueFound();
              if (pipelineState.generatedCase) {
                emit('directPlay', pipelineState.generatedCase);
              }
            "
            class="langgraph-btn-primary"
          >
            <Play class="w-3.5 h-3.5 fill-current" />
            <span>进入游戏试玩</span>
          </button>
        </div>
      </footer>
    </div>
  </div>
</template>

<style scoped>
@reference "../../index.css";

.langgraph-modal-overlay {
  @apply fixed inset-0 z-50 backdrop-blur-md flex items-center justify-center p-2 sm:p-5 select-none font-serif bg-black/60 transition-colors duration-300;
}

.langgraph-modal-window {
  @apply relative w-full max-w-7xl h-[94vh] max-h-230 rounded-2xl border border-theme-border bg-theme-desk text-theme-ink flex flex-col overflow-hidden shadow-2xl transition-all duration-300;
}

.langgraph-header {
  @apply px-5 py-3 border-b border-theme-border bg-theme-surface flex items-center justify-between shrink-0 transition-colors;
}

.langgraph-brand-badge {
  @apply w-8 h-8 rounded-lg flex items-center justify-center font-bold text-xs shadow-xs bg-theme-accent text-white;
}

.langgraph-strip {
  @apply px-5 py-2.5 border-b border-theme-border bg-theme-card-subtle flex flex-col md:flex-row items-center justify-between gap-3 text-xs font-sans shrink-0;
}

.langgraph-tab-group {
  @apply flex items-center p-1 rounded-xl border border-theme-border bg-theme-surface text-xs font-sans font-medium;
}

.langgraph-tab-btn {
  @apply flex items-center gap-1.5 px-3 py-1 rounded-lg transition cursor-pointer text-theme-muted hover:text-theme-ink;
}

.langgraph-tab-btn.is-active {
  @apply bg-theme-accent text-white font-bold shadow-xs;
}

.langgraph-icon-btn {
  @apply p-1.5 rounded-lg border border-theme-border text-theme-muted hover:text-theme-ink hover:bg-theme-surface transition cursor-pointer;
}

.langgraph-btn-primary {
  @apply px-4 py-1.5 rounded-lg text-xs font-bold transition shadow-xs flex items-center gap-1.5 cursor-pointer disabled:opacity-50 bg-theme-accent hover:opacity-90 text-white;
}

.langgraph-btn-secondary {
  @apply px-3 py-1.5 rounded-lg border border-theme-border bg-theme-surface hover:bg-theme-card-subtle text-theme-ink font-medium text-xs transition cursor-pointer flex items-center gap-1.5 disabled:opacity-40;
}

.langgraph-preset-chip {
  @apply px-2.5 py-1 rounded-lg border border-theme-border bg-theme-surface text-theme-muted text-[11px] transition cursor-pointer font-serif hover:border-theme-border-strong hover:text-theme-ink;
}

.langgraph-preset-chip.is-active {
  @apply bg-theme-card text-theme-accent border-theme-accent font-bold shadow-xs;
}

.langgraph-node-card {
  @apply relative rounded-2xl p-4 border border-theme-border bg-theme-card transition-all cursor-pointer shadow-sm flex flex-col justify-between min-h-36 hover:border-theme-border-strong;
}

.langgraph-node-card.is-selected {
  @apply border-theme-accent ring-2 ring-theme-accent/20 shadow-md bg-theme-surface;
}

.langgraph-info-card {
  @apply rounded-2xl p-5 border border-theme-border bg-theme-card shadow-xs;
}

.langgraph-artifact-chip {
  @apply px-3 py-1.5 rounded-xl border border-theme-border bg-theme-surface text-theme-muted transition cursor-pointer font-medium whitespace-nowrap hover:text-theme-ink hover:bg-theme-card-subtle;
}

.langgraph-artifact-chip.is-active {
  @apply bg-theme-card text-theme-accent border-theme-accent font-bold shadow-xs;
}

.langgraph-footer {
  @apply px-6 py-3 border-t border-theme-border bg-theme-surface flex items-center justify-between shrink-0 font-sans text-xs;
}
</style>
