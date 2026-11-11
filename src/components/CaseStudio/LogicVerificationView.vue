<script setup lang="ts">
import { ref, computed } from 'vue';
import {
  Scale,
  Sparkles,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  RotateCcw,
  Target,
} from 'lucide-vue-next';
import type { StudioCaseData } from './types';
import {
  calculateSuspectEvidenceProfiles,
  buildClueCorrelationMatrix,
  buildRadarInferenceData,
  evaluateInferenceRigor,
  type ClueAssociationCell,
} from './evidenceLogicEngine';
import { sound } from '../../utils/audio';

interface Props {
  caseData: StudioCaseData;
  isDark: boolean;
}

const props = defineProps<Props>();

const emit = defineEmits<{
  (e: 'triggerSelfRepair'): void;
  (e: 'navigateToSection', section: 'OUTLINE' | 'SUSPECTS' | 'SCENES' | 'CLUES' | 'TIMELINE'): void;
}>();

const activeTab = ref<'OVERVIEW' | 'MATRIX' | 'TRIAL'>('OVERVIEW');
const selectedCell = ref<ClueAssociationCell | null>(null);

// Simulated trial verdict state
const trialSuspectId = ref<string>(props.caseData.trueCulpritId);
const trialResult = ref<{
  verdict: 'CONVICTED' | 'ACQUITTED';
  title: string;
  reason: string;
  supportingClues: string[];
} | null>(null);

// Tooltip state for custom SVG charts
const hoveredBarIndex = ref<number | null>(null);
const hoveredRadarSuspect = ref<string | null>(null);

const profiles = computed(() =>
  calculateSuspectEvidenceProfiles(props.caseData.clues, props.caseData.suspects, props.caseData.trueCulpritId)
);

const correlationMatrix = computed(() =>
  buildClueCorrelationMatrix(props.caseData.clues, props.caseData.suspects, props.caseData.trueCulpritId)
);

const radarData = computed(() =>
  buildRadarInferenceData(props.caseData.suspects, props.caseData.clues, props.caseData.trueCulpritId)
);

const rigorResult = computed(() =>
  evaluateInferenceRigor(props.caseData)
);

// Colors
const colors = computed(() => ({
  crucial: props.isDark ? '#EF4444' : '#DC2626',
  motive: props.isDark ? '#C084FC' : '#9333EA',
  circumstantial: props.isDark ? '#38BDF8' : '#0284C7',
  exculpatory: props.isDark ? '#34D399' : '#059669',
  gold: props.isDark ? '#DFB36C' : '#8B3A2B',
  grid: props.isDark ? '#261D15' : '#E8DFD5',
  text: props.isDark ? '#A89073' : '#6E5F52',
  tooltipBg: props.isDark ? '#1C150F' : '#FFFFFF',
  tooltipBorder: props.isDark ? '#3E2E1E' : '#E2D8CC',
}));

// SVG Radar computation helpers
const radarCenter = 150;
const radarRadius = 100;
const radarAngles = [
  -Math.PI / 2,
  -Math.PI / 2 + (2 * Math.PI) / 5,
  -Math.PI / 2 + (4 * Math.PI) / 5,
  -Math.PI / 2 + (6 * Math.PI) / 5,
  -Math.PI / 2 + (8 * Math.PI) / 5,
];

const getRadarPoint = (angle: number, value: number) => {
  const r = (value / 100) * radarRadius;
  return {
    x: radarCenter + r * Math.cos(angle),
    y: radarCenter + r * Math.sin(angle),
  };
};

const getRadarGridPolygon = (level: number) => {
  return radarAngles
    .map((angle) => {
      const p = getRadarPoint(angle, level * 20);
      return `${p.x},${p.y}`;
    })
    .join(' ');
};

const getSuspectPolygon = (suspectName: string) => {
  return radarData.value
    .map((row, i) => {
      const val = Number(row[suspectName]) || 0;
      const p = getRadarPoint(radarAngles[i], val);
      return `${p.x},${p.y}`;
    })
    .join(' ');
};

const handleRunSimulatedTrial = (suspectId: string) => {
  sound.playClueFound();
  const suspect = props.caseData.suspects.find((s) => s.id === suspectId);
  if (!suspect) return;

  const isCulprit = suspectId === props.caseData.trueCulpritId;
  const linkedClues = props.caseData.clues.filter((c) =>
    (c.connectedSuspects as string[])?.includes(suspectId) || (c as any).relatedSuspectIds?.includes(suspectId)
  );

  if (isCulprit && (!props.caseData.validationReport || props.caseData.validationReport.isValid)) {
    trialResult.value = {
      verdict: 'CONVICTED',
      title: `法庭裁决：${suspect.name} 故意杀害策展人陈默 罪名成立`,
      reason: `公诉方出示的证据链形成了唯一闭环：22:12 备用门禁卡刷卡记录排他性锁定了物理权限；现场抹布与尼龙暗线破坏了反锁假象；策展人加密手记证实了致命动机。辩方提出的不在场证明被客观物证全数驳回，达到排除一切合理怀疑的定罪标准。`,
      supportingClues: linkedClues.map((c) => c.name),
    };
  } else if (isCulprit && props.caseData.validationReport && !props.caseData.validationReport.isValid) {
    trialResult.value = {
      verdict: 'ACQUITTED',
      title: `法庭裁决：指控暂时中止 · 证据链存在未解悖论`,
      reason: `虽然针对 ${suspect.name} 存在重大作案嫌疑，但目前案卷时间线或物理密室存在 ${props.caseData.validationReport.conflicts.length} 处硬逻辑冲突。在自愈修复前，该指控因程序性疑点无法形成排他性定罪。`,
      supportingClues: linkedClues.map((c) => c.name),
    };
  } else {
    trialResult.value = {
      verdict: 'ACQUITTED',
      title: `法庭裁决：${suspect.name} 无罪释放 · 疑罪从无`,
      reason: `虽然其与死者存在矛盾或动机嫌疑，但缺乏致命凶器或第一现场进出物理铁证；且其在案发关键时间窗口内具备第三方目击或客观监控证明，不构成杀人罪定罪要件。`,
      supportingClues: linkedClues.map((c) => c.name),
    };
  }
};
</script>

<template>
  <div class="space-y-6 animate-fadeIn pb-12">
    <!-- 1. TOP HEADER & RIGOR SCORE BANNER -->
    <div
      :class="[
        'rounded-2xl p-6 border shadow-sm transition-colors',
        isDark
          ? 'bg-gradient-to-br from-[#1C150F] via-[#140F0B] to-[#0D0A08] border-[#3E2D1E]'
          : 'bg-gradient-to-br from-[#FAF5EE] via-[#F5ECE1] to-[#EFE2D2] border-[#E2D2BF]'
      ]"
    >
      <div class="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div class="space-y-2 max-w-2xl">
          <div class="flex items-center gap-3">
            <span
              :class="[
                'px-3 py-1 rounded-full text-xs font-mono font-bold tracking-wider uppercase border flex items-center gap-1.5',
                rigorResult.verdict === 'RATIONALLY_SEALED'
                  ? isDark
                    ? 'bg-emerald-950/60 text-emerald-400 border-emerald-800/60'
                    : 'bg-emerald-100 text-emerald-800 border-emerald-300'
                  : rigorResult.verdict === 'WARNING_AMBIGUITY'
                  ? isDark
                    ? 'bg-amber-950/60 text-amber-400 border-amber-800/60'
                    : 'bg-amber-100 text-amber-800 border-amber-300'
                  : isDark
                  ? 'bg-rose-950/60 text-rose-400 border-rose-800/60'
                  : 'bg-rose-100 text-rose-800 border-rose-300'
              ]"
            >
              <Scale class="w-3.5 h-3.5" />
              <span>{{ rigorResult.verdictTitle }}</span>
            </span>
            <span :class="['text-xs font-mono', isDark ? 'text-[#8C765E]' : 'text-[#8C7E72]']">
              案卷编号: {{ caseData.id }}
            </span>
          </div>

          <h2
            :class="[
              'text-xl sm:text-2xl font-serif font-black tracking-wide',
              isDark ? 'text-[#F3EFEA]' : 'text-[#2C241E]'
            ]"
          >
            案卷逻辑校验与推理严密性审查
          </h2>
          <p
            :class="[
              'text-xs sm:text-sm leading-relaxed',
              isDark ? 'text-[#A89073]' : 'text-[#6E5F52]'
            ]"
          >
            {{ rigorResult.verdictDescription }}
          </p>
        </div>

        <!-- Right Score Pill -->
        <div class="flex items-center gap-4 shrink-0">
          <div
            :class="[
              'p-4 rounded-xl border text-center min-w-[130px] shadow-inner',
              isDark ? 'bg-[#150F0B] border-[#38281A]' : 'bg-white border-[#E5DACD]'
            ]"
          >
            <div :class="['text-[11px] font-mono uppercase tracking-wider', isDark ? 'text-[#8C765E]' : 'text-[#8C7E72]']">
              严密性评分
            </div>
            <div
              :class="[
                'text-3xl font-serif font-black',
                rigorResult.overallRigorScore >= 85
                  ? isDark ? 'text-[#DFB36C]' : 'text-[#8B3A2B]'
                  : isDark ? 'text-amber-400' : 'text-amber-600'
              ]"
            >
              {{ rigorResult.overallRigorScore }}
              <span class="text-xs font-sans font-normal opacity-60"> / 100</span>
            </div>
            <div class="text-[10px] font-mono mt-0.5 opacity-80">
              {{ rigorResult.isUniqueClosure ? '排他性闭环达标' : '待强化分差' }}
            </div>
          </div>

          <!-- If conflicts exist, trigger self-repair -->
          <button
            v-if="caseData.validationReport && !caseData.validationReport.isValid"
            @click="emit('triggerSelfRepair')"
            :class="[
              'flex items-center gap-2 px-4 py-3 rounded-xl font-serif font-bold text-xs shadow-md transition cursor-pointer active:scale-95',
              isDark
                ? 'bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-500 hover:to-amber-600 text-stone-950'
                : 'bg-[#8B3A2B] hover:bg-[#783023] text-white'
            ]"
          >
            <RotateCcw class="w-4 h-4" />
            <span>一键执行自愈修复</span>
          </button>
        </div>
      </div>

      <!-- 4 Indicators Quick Bar -->
      <div class="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6 pt-5 border-t border-dashed border-[#8C765E]/20">
        <div class="flex flex-col">
          <span class="text-[11px] opacity-70">定罪领先差 (Margin)</span>
          <span class="text-sm font-bold font-mono text-emerald-500">
            +{{ rigorResult.convictionMargin }}%
          </span>
        </div>
        <div class="flex flex-col">
          <span class="text-[11px] opacity-70">核心物证覆盖率</span>
          <span class="text-sm font-bold font-mono">
            {{ rigorResult.crucialClueExclusiveRatio }}%
          </span>
        </div>
        <div class="flex flex-col">
          <span class="text-[11px] opacity-70">无辜者误判防线</span>
          <span :class="['text-sm font-bold font-mono', rigorResult.innocentSafeguarded ? 'text-emerald-500' : 'text-amber-500']">
            {{ rigorResult.innocentSafeguarded ? '全员脱罪保护' : '存在误判风险' }}
          </span>
        </div>
        <div class="flex flex-col">
          <span class="text-[11px] opacity-70">密室物理自洽度</span>
          <span :class="['text-sm font-bold font-mono', (!caseData.validationReport || caseData.validationReport.isValid) ? 'text-emerald-500' : 'text-rose-500']">
            {{ (!caseData.validationReport || caseData.validationReport.isValid) ? '100% 零冲突' : '有物理冲突' }}
          </span>
        </div>
      </div>
    </div>

    <!-- 2. SUB-NAVIGATION TABS -->
    <div class="flex items-center justify-between border-b border-[#8C765E]/20 pb-2">
      <div class="flex items-center gap-2">
        <button
          @click="activeTab = 'OVERVIEW'; sound.playPaperRustle()"
          :class="[
            'px-4 py-2 rounded-xl text-xs font-serif font-bold transition cursor-pointer',
            activeTab === 'OVERVIEW'
              ? isDark
                ? 'bg-[#241A12] text-[#E5C384] border border-[#4E3725]'
                : 'bg-white text-[#8B3A2B] border border-[#E2D2BF] shadow-xs'
              : isDark
              ? 'text-[#A89073] hover:text-[#E5C384]'
              : 'text-[#6E5F52] hover:text-[#8B3A2B]'
          ]"
        >
          证据强度与推理雷达
        </button>
        <button
          @click="activeTab = 'MATRIX'; sound.playPaperRustle()"
          :class="[
            'px-4 py-2 rounded-xl text-xs font-serif font-bold transition cursor-pointer',
            activeTab === 'MATRIX'
              ? isDark
                ? 'bg-[#241A12] text-[#E5C384] border border-[#4E3725]'
                : 'bg-white text-[#8B3A2B] border border-[#E2D2BF] shadow-xs'
              : isDark
              ? 'text-[#A89073] hover:text-[#E5C384]'
              : 'text-[#6E5F52] hover:text-[#8B3A2B]'
          ]"
        >
          物证与涉案人关联矩阵
        </button>
        <button
          @click="activeTab = 'TRIAL'; sound.playPaperRustle()"
          :class="[
            'px-4 py-2 rounded-xl text-xs font-serif font-bold transition cursor-pointer',
            activeTab === 'TRIAL'
              ? isDark
                ? 'bg-[#241A12] text-[#E5C384] border border-[#4E3725]'
                : 'bg-white text-[#8B3A2B] border border-[#E2D2BF] shadow-xs'
              : isDark
              ? 'text-[#A89073] hover:text-[#E5C384]'
              : 'text-[#6E5F52] hover:text-[#8B3A2B]'
          ]"
        >
          模拟法庭指控推演
        </button>
      </div>

      <div class="text-xs font-mono text-[#8C765E]">
        数据源: 确定性统计推理引擎
      </div>
    </div>

    <!-- 3. TAB 1: OVERVIEW CHARTS -->
    <div v-if="activeTab === 'OVERVIEW'" class="space-y-6">
      <div class="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <!-- Chart A: Stacked Bar Chart -->
        <div
          :class="[
            'lg:col-span-7 rounded-2xl p-5 border flex flex-col justify-between relative',
            isDark ? 'bg-[#150F0B] border-[#2C2117]' : 'bg-white border-[#E8DFD5]'
          ]"
        >
          <div>
            <div class="flex items-center justify-between mb-2">
              <h3
                :class="[
                  'font-serif font-bold text-sm tracking-wide flex items-center gap-2',
                  isDark ? 'text-[#F3EFEA]' : 'text-[#2C241E]'
                ]"
              >
                <Target :class="['w-4 h-4', isDark ? 'text-[#DFB36C]' : 'text-[#8B3A2B]']" />
                <span>各嫌疑人证据关联强度分布 (Evidence Distribution)</span>
              </h3>
              <span class="text-[11px] font-mono text-emerald-500">
                定罪门槛: 80分
              </span>
            </div>
            <p :class="['text-xs mb-4', isDark ? 'text-[#8C765E]' : 'text-[#8C7E72]']">
              通过叠加计算决定性物证、深层动机、现场痕迹及不在场证据，检验真凶是否达成唯一定罪闭环。
            </p>
          </div>

          <!-- SVG Bar Chart -->
          <div class="w-full h-[320px] relative flex flex-col justify-end">
            <svg class="w-full h-[270px]" viewBox="0 0 500 240" preserveAspectRatio="none">
              <!-- Grid lines & Y Axis -->
              <g v-for="tick in [0, 20, 40, 60, 80, 100]" :key="tick">
                <line
                  :x1="45"
                  :y1="210 - (tick / 100) * 190"
                  :x2="480"
                  :y2="210 - (tick / 100) * 190"
                  :stroke="colors.grid"
                  stroke-dasharray="3 3"
                />
                <text
                  :x="35"
                  :y="214 - (tick / 100) * 190"
                  text-anchor="end"
                  :fill="colors.text"
                  font-size="10"
                  font-family="monospace"
                >
                  {{ tick }}
                </text>
              </g>

              <!-- Reference line 80 -->
              <line
                :x1="45"
                :y1="210 - (80 / 100) * 190"
                :x2="480"
                :y2="210 - (80 / 100) * 190"
                :stroke="isDark ? '#E5C384' : '#8B3A2B'"
                stroke-dasharray="4 4"
                stroke-width="1.5"
              />
              <text
                :x="475"
                :y="205 - (80 / 100) * 190"
                text-anchor="end"
                :fill="isDark ? '#E5C384' : '#8B3A2B'"
                font-size="9"
                font-family="sans-serif"
                font-weight="bold"
              >
                法庭唯一定罪线 (80)
              </text>

              <!-- Bars for each suspect -->
              <g
                v-for="(p, idx) in profiles"
                :key="p.suspectId"
                @mouseenter="hoveredBarIndex = idx"
                @mouseleave="hoveredBarIndex = null"
                class="cursor-pointer"
              >
                <!-- Calculate heights -->
                <template v-if="true">
                  <!-- Bar stack group -->
                  <!-- x = 70 + idx * 105, width = 36 -->
                  <!-- Total Inculpation Stack -->
                  <rect
                    :x="75 + idx * 100"
                    :y="210 - ((p.crucialEvidenceWeight + p.motiveEvidenceWeight + p.circumstantialWeight) / 100) * 190"
                    width="32"
                    :height="(p.crucialEvidenceWeight / 100) * 190"
                    :fill="colors.crucial"
                    rx="2"
                  />
                  <rect
                    :x="75 + idx * 100"
                    :y="210 - ((p.motiveEvidenceWeight + p.circumstantialWeight) / 100) * 190"
                    width="32"
                    :height="(p.motiveEvidenceWeight / 100) * 190"
                    :fill="colors.motive"
                  />
                  <rect
                    :x="75 + idx * 100"
                    :y="210 - (p.circumstantialWeight / 100) * 190"
                    width="32"
                    :height="(p.circumstantialWeight / 100) * 190"
                    :fill="colors.circumstantial"
                  />
                  <!-- Exculpatory Bar (Green side-bar) -->
                  <rect
                    :x="110 + idx * 100"
                    :y="210 - (p.exculpatoryWeight / 100) * 190"
                    width="14"
                    :height="(p.exculpatoryWeight / 100) * 190"
                    :fill="colors.exculpatory"
                    rx="3"
                  />

                  <!-- X label -->
                  <text
                    :x="98 + idx * 100"
                    :y="230"
                    text-anchor="middle"
                    :fill="colors.text"
                    font-size="11"
                    font-family="serif"
                    font-weight="bold"
                  >
                    {{ p.name }}
                  </text>
                </template>
              </g>
            </svg>

            <!-- Custom Tooltip overlay when hovering a bar -->
            <div
              v-if="hoveredBarIndex !== null && profiles[hoveredBarIndex]"
              class="absolute top-2 right-4 p-3 rounded-xl shadow-xl text-xs space-y-1 border z-10 pointer-events-none transition-all"
              :style="{
                backgroundColor: colors.tooltipBg,
                borderColor: colors.tooltipBorder,
                color: isDark ? '#F3EFEA' : '#2C241E',
              }"
            >
              <div class="font-bold font-serif flex items-center justify-between gap-4">
                <span>{{ profiles[hoveredBarIndex].name }} ({{ profiles[hoveredBarIndex].title }})</span>
                <span
                  v-if="profiles[hoveredBarIndex].isTrueCulprit"
                  class="px-1.5 py-0.5 rounded text-[10px] bg-red-500/20 text-red-400 font-mono"
                >
                  真实凶手
                </span>
              </div>
              <div class="text-[11px] font-mono text-emerald-500">
                综合定罪判定: {{ profiles[hoveredBarIndex].totalInculpationScore }}分 · {{ profiles[hoveredBarIndex].statusLabel }}
              </div>
              <div class="border-t border-[#8C765E]/20 pt-1 space-y-0.5">
                <div class="flex items-center justify-between gap-4">
                  <span class="flex items-center gap-1.5"><span class="w-2 h-2 rounded-full" :style="{ backgroundColor: colors.crucial }"></span>核心致命铁证:</span>
                  <span class="font-mono font-bold">{{ profiles[hoveredBarIndex].crucialEvidenceWeight }}%</span>
                </div>
                <div class="flex items-center justify-between gap-4">
                  <span class="flex items-center gap-1.5"><span class="w-2 h-2 rounded-full" :style="{ backgroundColor: colors.motive }"></span>动机与文书证据:</span>
                  <span class="font-mono font-bold">{{ profiles[hoveredBarIndex].motiveEvidenceWeight }}%</span>
                </div>
                <div class="flex items-center justify-between gap-4">
                  <span class="flex items-center gap-1.5"><span class="w-2 h-2 rounded-full" :style="{ backgroundColor: colors.circumstantial }"></span>环境痕迹与旁证:</span>
                  <span class="font-mono font-bold">{{ profiles[hoveredBarIndex].circumstantialWeight }}%</span>
                </div>
                <div class="flex items-center justify-between gap-4">
                  <span class="flex items-center gap-1.5"><span class="w-2 h-2 rounded-full" :style="{ backgroundColor: colors.exculpatory }"></span>不在场脱罪权重:</span>
                  <span class="font-mono font-bold">{{ profiles[hoveredBarIndex].exculpatoryWeight }}%</span>
                </div>
              </div>
            </div>

            <!-- Legend -->
            <div class="flex flex-wrap items-center justify-center gap-4 text-[11px] pt-2">
              <span class="flex items-center gap-1.5">
                <span class="w-2.5 h-2.5 rounded-xs" :style="{ backgroundColor: colors.crucial }"></span>
                <span>核心致命铁证</span>
              </span>
              <span class="flex items-center gap-1.5">
                <span class="w-2.5 h-2.5 rounded-xs" :style="{ backgroundColor: colors.motive }"></span>
                <span>动机与文书证据</span>
              </span>
              <span class="flex items-center gap-1.5">
                <span class="w-2.5 h-2.5 rounded-xs" :style="{ backgroundColor: colors.circumstantial }"></span>
                <span>环境痕迹与旁证</span>
              </span>
              <span class="flex items-center gap-1.5">
                <span class="w-2.5 h-2.5 rounded-xs" :style="{ backgroundColor: colors.exculpatory }"></span>
                <span>不在场脱罪权重</span>
              </span>
            </div>
          </div>
        </div>

        <!-- Chart B: Radar Chart (五维推理判定雷达图) -->
        <div
          :class="[
            'lg:col-span-5 rounded-2xl p-5 border flex flex-col justify-between relative',
            isDark ? 'bg-[#150F0B] border-[#2C2117]' : 'bg-white border-[#E8DFD5]'
          ]"
        >
          <div>
            <h3
              :class="[
                'font-serif font-bold text-sm tracking-wide flex items-center gap-2 mb-1',
                isDark ? 'text-[#F3EFEA]' : 'text-[#2C241E]'
              ]"
            >
              <Scale :class="['w-4 h-4', isDark ? 'text-[#DFB36C]' : 'text-[#8B3A2B]']" />
              <span>五维推理闭环雷达 (Inference Dimensions)</span>
            </h3>
            <p :class="['text-xs mb-3', isDark ? 'text-[#8C765E]' : 'text-[#8C7E72]']">
              对比真凶与主要嫌疑人在物证、动机、时空窗口及诡计可行度上的分化。
            </p>
          </div>

          <!-- SVG Radar -->
          <div class="w-full h-[320px] flex flex-col items-center justify-center">
            <svg class="w-[280px] h-[260px]" viewBox="0 0 300 300">
              <!-- Concentric Pentagons -->
              <polygon
                v-for="level in [1, 2, 3, 4, 5]"
                :key="level"
                :points="getRadarGridPolygon(level)"
                fill="none"
                :stroke="colors.grid"
                stroke-width="1"
              />

              <!-- Axes -->
              <line
                v-for="(angle, i) in radarAngles"
                :key="i"
                :x1="radarCenter"
                :y1="radarCenter"
                :x2="getRadarPoint(angle, 100).x"
                :y2="getRadarPoint(angle, 100).y"
                :stroke="colors.grid"
                stroke-width="1"
              />

              <!-- Dimension Labels -->
              <text
                v-for="(row, i) in radarData"
                :key="row.subject"
                :x="getRadarPoint(radarAngles[i], 122).x"
                :y="getRadarPoint(radarAngles[i], 122).y + 3"
                text-anchor="middle"
                :fill="colors.text"
                font-size="10"
                font-family="serif"
              >
                {{ row.subject }}
              </text>

              <!-- Polygons -->
              <!-- Innocent 2 (林岚 - Rose) -->
              <polygon
                v-if="caseData.suspects[2]"
                :points="getSuspectPolygon(caseData.suspects[2].name)"
                fill="#FB7185"
                fill-opacity="0.2"
                stroke="#FB7185"
                stroke-width="1.5"
              />

              <!-- Innocent 1 (周衡 - Sky) -->
              <polygon
                v-if="caseData.suspects[1]"
                :points="getSuspectPolygon(caseData.suspects[1].name)"
                fill="#38BDF8"
                fill-opacity="0.2"
                stroke="#38BDF8"
                stroke-width="1.5"
              />

              <!-- Culprit (许宁 - Gold / Crimson) -->
              <polygon
                v-if="caseData.suspects[0]"
                :points="getSuspectPolygon(caseData.suspects[0].name)"
                :fill="isDark ? '#DFB36C' : '#8B3A2B'"
                fill-opacity="0.45"
                :stroke="isDark ? '#DFB36C' : '#8B3A2B'"
                stroke-width="2"
              />
            </svg>

            <!-- Radar Legend -->
            <div class="flex items-center justify-center gap-4 text-[11px] pt-1">
              <span class="flex items-center gap-1.5">
                <span class="w-2.5 h-2.5 rounded-full" :style="{ backgroundColor: isDark ? '#DFB36C' : '#8B3A2B' }"></span>
                <span>许宁 (真凶)</span>
              </span>
              <span class="flex items-center gap-1.5">
                <span class="w-2.5 h-2.5 rounded-full bg-[#38BDF8]"></span>
                <span>周衡 (投资人)</span>
              </span>
              <span class="flex items-center gap-1.5">
                <span class="w-2.5 h-2.5 rounded-full bg-[#FB7185]"></span>
                <span>林岚 (画家)</span>
              </span>
            </div>
          </div>
        </div>
      </div>

      <!-- 4 CHECKPOINTS REVIEW CARDS -->
      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div
          v-for="cp in rigorResult.checkpoints"
          :key="cp.id"
          :class="[
            'p-4 rounded-xl border flex items-start justify-between gap-4 transition-colors',
            isDark ? 'bg-[#150F0B] border-[#2C2117]' : 'bg-white border-[#E8DFD5]'
          ]"
        >
          <div class="space-y-1">
            <div class="flex items-center gap-2">
              <CheckCircle2 v-if="cp.status === 'PASS'" class="w-4 h-4 text-emerald-500 shrink-0" />
              <AlertTriangle v-else-if="cp.status === 'WARN'" class="w-4 h-4 text-amber-500 shrink-0" />
              <XCircle v-else class="w-4 h-4 text-rose-500 shrink-0" />
              <h4 :class="['text-xs font-serif font-bold', isDark ? 'text-[#F3EFEA]' : 'text-[#2C241E]']">
                {{ cp.label }}
              </h4>
            </div>
            <p :class="['text-[11px] leading-relaxed', isDark ? 'text-[#8C765E]' : 'text-[#8C7E72]']">
              {{ cp.description }}
            </p>
          </div>

          <span
            :class="[
              'text-xs font-mono font-bold px-2 py-1 rounded shrink-0',
              cp.status === 'PASS'
                ? 'bg-emerald-500/10 text-emerald-500'
                : cp.status === 'WARN'
                ? 'bg-amber-500/10 text-amber-500'
                : 'bg-rose-500/10 text-rose-500'
            ]"
          >
            {{ cp.value }}
          </span>
        </div>
      </div>

      <!-- Actionable Rigor Improvement Tips -->
      <div
        :class="[
          'p-4 rounded-xl border flex items-start gap-3',
          isDark ? 'bg-[#1C140D] border-[#3E2D1E]' : 'bg-[#FAF4ED] border-[#E8DACB]'
        ]"
      >
        <Sparkles :class="['w-4 h-4 shrink-0 mt-0.5', isDark ? 'text-[#DFB36C]' : 'text-[#8B3A2B]']" />
        <div class="space-y-1">
          <h5 :class="['text-xs font-serif font-bold', isDark ? 'text-[#E5C384]' : 'text-[#8B3A2B]']">
            推理严密性工程建议 (AI Engineering Suggestions)
          </h5>
          <ul class="text-xs space-y-1 opacity-80 list-disc list-inside">
            <li v-for="(advice, idx) in rigorResult.actionableAdvices" :key="idx">
              {{ advice }}
            </li>
          </ul>
        </div>
      </div>
    </div>

    <!-- 4. TAB 2: CORRELATION MATRIX GRID -->
    <div v-if="activeTab === 'MATRIX'" class="space-y-4">
      <div
        :class="[
          'p-4 rounded-xl border',
          isDark ? 'bg-[#150F0B] border-[#2C2117]' : 'bg-white border-[#E8DFD5]'
        ]"
      >
        <h3 :class="['font-serif font-bold text-sm mb-1', isDark ? 'text-[#F3EFEA]' : 'text-[#2C241E]']">
          物证与嫌疑人全息关联矩阵 (Correlation Matrix)
        </h3>
        <p :class="['text-xs mb-4', isDark ? 'text-[#8C765E]' : 'text-[#8C7E72]']">
          点击任一交叉单元格，查看该证物在定罪链中对该嫌疑人的指向属性（直接凶器、动机书面、时间锁闭、嫁祸伪造或无接触）。
        </p>

        <!-- Matrix Table -->
        <div class="overflow-x-auto">
          <table class="w-full text-left text-xs border-collapse">
            <thead>
              <tr :class="['border-b', isDark ? 'border-[#2C2117]' : 'border-[#E8DFD5]']">
                <th class="p-2.5 font-serif font-bold">证物名称 / 属性</th>
                <th class="p-2.5 font-serif font-bold">类别</th>
                <th
                  v-for="s in caseData.suspects"
                  :key="s.id"
                  :class="['p-2.5 font-serif font-bold text-center', s.id === caseData.trueCulpritId ? 'text-amber-500' : '']"
                >
                  {{ s.name }} {{ s.id === caseData.trueCulpritId ? '(真凶)' : '' }}
                </th>
              </tr>
            </thead>
            <tbody class="divide-y divide-[#8C765E]/10">
              <tr
                v-for="clue in caseData.clues"
                :key="clue.id"
                class="hover:bg-[#8C765E]/5 transition-colors"
              >
                <td class="p-2.5 font-serif font-medium flex items-center gap-2">
                  <span v-if="clue.isCrucial" class="w-1.5 h-1.5 rounded-full bg-red-500 shrink-0" title="核心关键物证" />
                  <span>{{ clue.name }}</span>
                </td>
                <td class="p-2.5 opacity-70 font-mono text-[11px]">
                  {{ clue.category }}
                </td>
                <template v-for="suspect in caseData.suspects" :key="suspect.id">
                  <td
                    v-if="correlationMatrix.find((m) => m.clueId === clue.id && m.suspectId === suspect.id)"
                    @click="
                      sound.playPaperRustle();
                      selectedCell = correlationMatrix.find((m) => m.clueId === clue.id && m.suspectId === suspect.id) || null;
                    "
                    :class="[
                      'p-2.5 text-center cursor-pointer transition',
                      selectedCell?.clueId === clue.id && selectedCell?.suspectId === suspect.id ? 'ring-2 ring-amber-500 rounded' : ''
                    ]"
                  >
                    <span
                      :class="[
                        'inline-block px-2 py-1 rounded text-[11px] font-mono font-bold',
                        correlationMatrix.find((m) => m.clueId === clue.id && m.suspectId === suspect.id)?.linkType === 'DIRECT_WEAPON'
                          ? 'bg-red-500/20 text-red-400'
                          : correlationMatrix.find((m) => m.clueId === clue.id && m.suspectId === suspect.id)?.linkType === 'TIMING_KEY'
                          ? 'bg-amber-500/20 text-amber-400'
                          : correlationMatrix.find((m) => m.clueId === clue.id && m.suspectId === suspect.id)?.linkType === 'MOTIVE_PAPER'
                          ? 'bg-purple-500/20 text-purple-400'
                          : correlationMatrix.find((m) => m.clueId === clue.id && m.suspectId === suspect.id)?.linkType === 'FRAME_UP'
                          ? 'bg-emerald-500/20 text-emerald-400'
                          : correlationMatrix.find((m) => m.clueId === clue.id && m.suspectId === suspect.id)?.linkType === 'ALIBI_BREAK'
                          ? 'bg-blue-500/20 text-blue-400'
                          : 'opacity-30'
                      ]"
                    >
                      {{ correlationMatrix.find((m) => m.clueId === clue.id && m.suspectId === suspect.id)?.strength }}%
                    </span>
                  </td>
                  <td v-else class="p-2.5 text-center">-</td>
                </template>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- Selected Cell Detail Card -->
        <div
          v-if="selectedCell"
          :class="[
            'mt-4 p-4 rounded-xl border animate-fadeIn flex items-start justify-between gap-4',
            isDark ? 'bg-[#1D1610] border-[#3E2D1E]' : 'bg-[#FAF6F0] border-[#E2D2BF]'
          ]"
        >
          <div class="space-y-1">
            <div class="flex items-center gap-2">
              <span class="font-serif font-bold text-sm">
                {{ selectedCell.clueName }} ↔ {{ selectedCell.suspectName }}
              </span>
              <span
                :class="[
                  'text-[10px] font-mono px-2 py-0.5 rounded font-bold',
                  selectedCell.linkType === 'DIRECT_WEAPON'
                    ? 'bg-red-500/20 text-red-400'
                    : selectedCell.linkType === 'TIMING_KEY'
                    ? 'bg-amber-500/20 text-amber-400'
                    : 'bg-[#8C765E]/20'
                ]"
              >
                {{ selectedCell.linkType }} ({{ selectedCell.strength }}%)
              </span>
            </div>
            <p class="text-xs leading-relaxed opacity-85">
              {{ selectedCell.linkDescription }}
            </p>
          </div>

          <button
            @click="selectedCell = null"
            class="text-xs opacity-60 hover:opacity-100 cursor-pointer"
          >
            关闭详情
          </button>
        </div>
      </div>
    </div>

    <!-- 5. TAB 3: SIMULATED TRIAL -->
    <div v-if="activeTab === 'TRIAL'" class="space-y-6">
      <div
        :class="[
          'p-6 rounded-2xl border',
          isDark ? 'bg-[#150F0B] border-[#2C2117]' : 'bg-white border-[#E8DFD5]'
        ]"
      >
        <div class="max-w-2xl mb-6">
          <h3
            :class="[
              'font-serif font-bold text-base mb-1 flex items-center gap-2',
              isDark ? 'text-[#F3EFEA]' : 'text-[#2C241E]'
            ]"
          >
            <Scale :class="['w-5 h-5', isDark ? 'text-[#DFB36C]' : 'text-[#8B3A2B]']" />
            <span>法庭级定罪排他推演器 (Simulated Court Inculpation)</span>
          </h3>
          <p :class="['text-xs leading-relaxed', isDark ? 'text-[#8C765E]' : 'text-[#8C7E72]']">
            验证案件能否经受住法庭级严密审理：选择任一嫌疑人提起公诉，系统将根据目前生成的物证链、不在场证据和物理闭环状态，裁决罪名是否成立。
          </p>
        </div>

        <!-- Suspect Selector Cards -->
        <div class="grid grid-cols-1 sm:grid-cols-4 gap-3 mb-6">
          <div
            v-for="suspect in caseData.suspects"
            :key="suspect.id"
            @click="
              sound.playPaperRustle();
              trialSuspectId = suspect.id;
              trialResult = null;
            "
            :class="[
              'p-3.5 rounded-xl border cursor-pointer transition',
              trialSuspectId === suspect.id
                ? isDark
                  ? 'bg-[#261B12] border-[#DFB36C] ring-1 ring-[#DFB36C]'
                  : 'bg-[#F9ECE3] border-[#8B3A2B] ring-1 ring-[#8B3A2B]'
                : isDark
                ? 'bg-[#18110C] border-[#2A1E14] hover:bg-[#22170F]'
                : 'bg-[#FAF7F2] border-[#E8DFD5] hover:bg-[#F2ECE3]'
            ]"
          >
            <div class="flex items-center justify-between mb-1.5">
              <span class="font-serif font-bold text-xs">{{ suspect.name }}</span>
              <span class="text-[10px] font-mono opacity-60">{{ suspect.title }}</span>
            </div>
            <div class="flex items-center justify-between text-[11px] font-mono">
              <span>物证指向度:</span>
              <span :class="['font-bold', suspect.id === caseData.trueCulpritId ? 'text-amber-500' : '']">
                {{ profiles.find((p) => p.suspectId === suspect.id)?.totalInculpationScore }}%
              </span>
            </div>
          </div>
        </div>

        <!-- Trigger Button -->
        <div class="flex items-center gap-3">
          <button
            @click="handleRunSimulatedTrial(trialSuspectId)"
            :class="[
              'flex items-center gap-2 px-6 py-2.5 rounded-xl font-serif font-bold text-xs shadow-md transition cursor-pointer active:scale-95',
              isDark
                ? 'bg-gradient-to-r from-[#DFB36C] to-[#C9942D] text-[#140E07]'
                : 'bg-[#8B3A2B] text-white hover:bg-[#783023]'
            ]"
          >
            <Scale class="w-4 h-4" />
            <span>对选中嫌疑人提起定罪指控</span>
          </button>
        </div>

        <!-- Trial Result Panel -->
        <div
          v-if="trialResult"
          :class="[
            'mt-6 p-5 rounded-2xl border animate-fadeIn space-y-3',
            trialResult.verdict === 'CONVICTED'
              ? isDark
                ? 'bg-emerald-950/30 border-emerald-800/60 text-emerald-200'
                : 'bg-emerald-50 border-emerald-300 text-emerald-950'
              : isDark
              ? 'bg-amber-950/30 border-amber-800/60 text-amber-200'
              : 'bg-amber-50 border-amber-300 text-amber-950'
          ]"
        >
          <div class="flex items-center gap-2">
            <CheckCircle2 v-if="trialResult.verdict === 'CONVICTED'" class="w-5 h-5 text-emerald-500 shrink-0" />
            <AlertTriangle v-else class="w-5 h-5 text-amber-500 shrink-0" />
            <h4 class="font-serif font-bold text-sm tracking-wide">
              {{ trialResult.title }}
            </h4>
          </div>

          <p class="text-xs leading-relaxed opacity-90">
            {{ trialResult.reason }}
          </p>

          <div class="pt-2 border-t border-current/15 flex flex-wrap items-center gap-2">
            <span class="text-[11px] font-mono opacity-80">关联呈堂证物:</span>
            <span
              v-for="(clueName, idx) in trialResult.supportingClues"
              :key="idx"
              class="px-2 py-0.5 rounded text-[10px] font-serif bg-current/10 border border-current/20"
            >
              {{ clueName }}
            </span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
