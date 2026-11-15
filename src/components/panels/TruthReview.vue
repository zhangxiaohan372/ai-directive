<script setup lang="ts">
import { onMounted, computed } from 'vue';
import confetti from 'canvas-confetti';
import type { RoomState } from '../../types/game';
import { evaluateVerdict } from '../../core/game/engine';
import {
  SUSPECTS,
  CLUES,
  ERRONEOUS_PATHS,
  TRUE_DEDUCTION_CHAIN,
} from '../../data/caseData';
import {
  Award,
  AlertTriangle,
  Shield,
  FileCheck2,
  TrendingUp,
  RotateCcw,
  Sparkles,
  ArrowRight,
} from 'lucide-vue-next';

interface TruthReviewProps {
  roomState: RoomState;
}

const props = defineProps<TruthReviewProps>();

const emit = defineEmits<{
  (e: 'restart'): void;
}>();

const verdict = computed(() => evaluateVerdict(props.roomState));

onMounted(() => {
  if (verdict.value.isSolved) {
    try {
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#FB7185', '#38BDF8', '#C084FC', '#F59E0B'],
      });
    } catch {}
  }
});

const culprit = computed(() => SUSPECTS.find((s) => s.id === TRUE_DEDUCTION_CHAIN.culprit));
const missedClues = computed(() => CLUES.filter(
  (c) => c.isCrucial && !props.roomState.discoveredClueIds.includes(c.id)
));
</script>

<template>
  <div class="max-w-5xl mx-auto p-4 md:p-6 space-y-6 font-serif">
    <!-- 1. Header Banner -->
    <header class="panel-dossier-card relative rounded-3xl p-6 md:p-8 border border-theme-border shadow-2xl overflow-hidden transition-colors">
      <div class="relative z-10 flex flex-col md:flex-row items-center justify-between gap-6">
        <div class="flex items-center space-x-5 text-left">
          <div
            class="w-16 h-16 rounded-2xl flex items-center justify-center shrink-0 border border-theme-border shadow-md"
            :class="verdict.isSolved ? 'bg-amber-500/20 text-amber-500' : 'bg-red-500/20 text-red-500'"
          >
            <Award v-if="verdict.isSolved" class="w-8 h-8" />
            <AlertTriangle v-else class="w-8 h-8" />
          </div>
          <div>
            <div class="flex items-center space-x-2.5 mb-1">
              <span
                class="px-2.5 py-0.5 rounded-full text-xs font-mono font-bold tracking-wider uppercase border border-theme-border"
                :class="verdict.isSolved ? 'bg-amber-500/10 text-amber-500' : 'bg-red-500/10 text-red-500'"
              >
                {{ verdict.isSolved ? '案情全盘告破' : '推演错失真凶' }}
              </span>
              <span class="text-xs font-mono text-theme-muted">
                DEDUCTION ACCURACY // {{ Math.round(verdict.accuracyRate * 100) }}%
              </span>
            </div>
            <h1 class="text-2xl md:text-3xl font-extrabold tracking-tight text-theme-ink">
              {{ verdict.isSolved ? '真相水落石出 · 闭门密室彻底瓦解' : '遗漏关键链条 · 狡猾真凶隐匿暗处' }}
            </h1>
          </div>
        </div>

        <button
          type="button"
          @click="emit('restart')"
          class="shrink-0 px-6 py-3 rounded-2xl font-sans font-bold text-xs bg-theme-accent hover:bg-theme-accent-hover text-white transition shadow-lg flex items-center space-x-2 active:scale-95 cursor-pointer"
        >
          <RotateCcw class="w-4 h-4" />
          <span>重新开局探案</span>
        </button>
      </div>
    </header>

    <!-- 2. True Culprit & Trick Breakdown -->
    <section class="grid grid-cols-1 md:grid-cols-3 gap-6">
      <!-- True Culprit Dossier Card -->
      <div class="panel-dossier-card rounded-2xl p-5 border border-theme-border shadow-md flex flex-col justify-between">
        <div>
          <div class="flex items-center justify-between mb-3">
            <span class="text-xs font-mono uppercase tracking-wider text-theme-accent">
              // 案件真凶
            </span>
            <span class="text-xs px-2 py-0.5 rounded-full font-bold bg-red-950/40 text-red-400 border border-red-500/40">
              IRREFUTABLE CULPRIT
            </span>
          </div>

          <div v-if="culprit" class="flex items-center space-x-3 mb-4">
            <img
              :src="culprit.avatarImage || `/assets/portraits/${culprit.id}.jpg`"
              :alt="culprit.name"
              class="w-14 h-14 rounded-xl object-cover object-top border border-theme-border shadow-xs"
            />
            <div>
              <h3 class="font-bold text-base text-theme-ink">{{ culprit.name }}</h3>
              <p class="text-xs text-theme-muted">{{ culprit.title }} · {{ culprit.age }}岁</p>
            </div>
          </div>

          <div class="space-y-2 text-xs leading-relaxed text-theme-secondary">
            <p><strong class="text-theme-ink">作案动机：</strong>{{ TRUE_DEDUCTION_CHAIN.motive }}</p>
            <p><strong class="text-theme-ink">关键破局矛盾：</strong>{{ TRUE_DEDUCTION_CHAIN.keyContradiction }}</p>
          </div>
        </div>

        <div class="mt-4 pt-3 border-t border-theme-border text-[11px] text-theme-muted">
          真实作案时刻: 22:12 - 22:15
        </div>
      </div>

      <!-- Locked Room Trick Diagram -->
      <div class="md:col-span-2 panel-dossier-card rounded-2xl p-5 border border-theme-border shadow-md flex flex-col justify-between">
        <div>
          <span class="text-xs font-mono uppercase tracking-wider block mb-2 text-theme-accent">
            // 密室核心诡计还原 (MECHANICAL DECONSTRUCTION)
          </span>
          <h4 class="font-bold text-base mb-3 text-theme-ink">
            尼龙细线穿窗反锁密室
          </h4>
          <p class="text-xs leading-relaxed text-theme-secondary mb-4">
            凶手许宁在用青铜镇纸击昏陈默后，利用修复台的高强度尼龙丝线穿过排风窗活页抽栓，在室外拉动绳索将门栓扣合，并将尼龙线抽回焚毁，伪造出反锁密室假象。
          </p>
        </div>

        <!-- Chain Steps Grid -->
        <div class="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-3 border-t border-theme-border text-xs">
          <div class="p-2.5 rounded-lg border border-theme-border bg-theme-surface">
            <span class="font-mono text-[10px] block text-theme-muted">STEP 01</span>
            <span class="font-bold text-theme-ink">怀表伪证</span>
            <p class="text-[11px] text-theme-muted mt-0.5">调慢怀表指针至 22:15 伪造死亡时刻</p>
          </div>
          <div class="p-2.5 rounded-lg border border-theme-border bg-theme-surface">
            <span class="font-mono text-[10px] block text-theme-muted">STEP 02</span>
            <span class="font-bold text-theme-ink">刷卡破绽</span>
            <p class="text-[11px] text-theme-muted mt-0.5">22:12 备用卡刷卡进入留下门禁电子记录</p>
          </div>
          <div class="p-2.5 rounded-lg border border-theme-border bg-theme-surface">
            <span class="font-mono text-[10px] block text-theme-muted">STEP 03</span>
            <span class="font-bold text-theme-ink">尼龙线反锁</span>
            <p class="text-[11px] text-theme-muted mt-0.5">通风窗口拉线锁扣窗栓制造自内锁死假象</p>
          </div>
        </div>
      </div>
    </section>

    <!-- 3. Clue Coverage & False Leads -->
    <section class="grid grid-cols-1 md:grid-cols-2 gap-6">
      <!-- Missed Clues List -->
      <div class="panel-dossier-card rounded-2xl p-5 border border-theme-border shadow-md">
        <h4 class="font-bold text-xs uppercase tracking-wider font-mono mb-3 text-theme-ink flex items-center space-x-1.5">
          <FileCheck2 class="w-4 h-4 text-theme-accent" />
          <span>现场关键证据搜集率 ({{ roomState.discoveredClueIds.length }}/8)</span>
        </h4>
        <div v-if="missedClues.length === 0" class="p-4 rounded-xl border border-emerald-500/40 bg-emerald-950/20 text-emerald-300 text-xs text-center">
          全部核心关键物证均已勘验齐全！展现了极高水平的现场观察力。
        </div>
        <div v-else class="space-y-2">
          <div
            v-for="clue in missedClues"
            :key="clue.id"
            class="p-2.5 rounded-lg border border-theme-border bg-theme-surface flex items-start space-x-2 text-xs"
          >
            <span class="text-amber-500 font-bold">●</span>
            <div>
              <span class="font-bold text-theme-ink">{{ clue.name }} (遗漏)</span>
              <p class="text-[11px] text-theme-muted mt-0.5">{{ clue.shortDesc }}</p>
            </div>
          </div>
        </div>
      </div>

      <!-- Erroneous Leads Explanation -->
      <div class="panel-dossier-card rounded-2xl p-5 border border-theme-border shadow-md">
        <h4 class="font-bold text-xs uppercase tracking-wider font-mono mb-3 text-theme-ink flex items-center space-x-1.5">
          <TrendingUp class="w-4 h-4 text-theme-accent" />
          <span>涉案其他人员嫌疑排除解析</span>
        </h4>
        <div class="space-y-2.5 text-xs">
          <div
            v-for="path in ERRONEOUS_PATHS"
            :key="path.name"
            class="p-2.5 rounded-lg border border-theme-border bg-theme-surface leading-relaxed"
          >
            <span class="font-bold text-theme-accent block mb-0.5">
              【{{ path.name }}】嫌疑破除点：
            </span>
            <p class="text-[11px] text-theme-secondary">{{ path.flaw }}</p>
          </div>
        </div>
      </div>
    </section>
  </div>
</template>
