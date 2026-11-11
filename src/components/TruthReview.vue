<script setup lang="ts">
import { onMounted, computed } from 'vue';
import confetti from 'canvas-confetti';
import type { RoomState } from '../types/game';
import { evaluateVerdict } from '../game/engine';
import {
  SUSPECTS,
  CLUES,
  ERRONEOUS_PATHS,
  TRUE_DEDUCTION_CHAIN,
} from '../data/caseData';
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
  themeMode?: 'dark' | 'light';
}

const props = withDefaults(defineProps<TruthReviewProps>(), {
  themeMode: 'dark',
});

const emit = defineEmits<{
  (e: 'restart'): void;
}>();

const verdict = computed(() => evaluateVerdict(props.roomState));
const isDark = computed(() => props.themeMode === 'dark');

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
    <div
      class="rounded-3xl p-6 md:p-8 text-white shadow-xl relative overflow-hidden border"
      :class="[
        isDark ? 'border-[#3B3027]' : 'border-[#E0D5C7]',
        verdict.isSolved
          ? isDark
            ? 'bg-gradient-to-br from-[#1E2E20] via-[#1A261B] to-[#0C0A09]'
            : 'bg-gradient-to-br from-[#2E4830] via-[#3B5B3E] to-[#1E3020]'
          : isDark
          ? 'bg-gradient-to-br from-[#3B1919] via-[#241313] to-[#0C0A09]'
          : 'bg-gradient-to-br from-[#8B3A2B] via-[#70281C] to-[#501A10]'
      ]"
    >
      <div class="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div class="flex items-center space-x-2 text-xs font-bold uppercase tracking-wider text-[#C9942D] mb-2 font-mono">
            <Award class="w-4 h-4" />
            <span>全案真相推演复盘报告</span>
          </div>
          <h1 class="text-2xl md:text-3xl font-extrabold text-[#F3EFEA]">
            {{
              verdict.isSolved
                ? '完美破案！成功勘破午夜画廊密室诡计！'
                : '推理未能定罪：真凶瞒过了侦探团！'
            }}
          </h1>
          <p class="text-xs md:text-sm text-[#AFA49A] mt-2 max-w-2xl leading-relaxed">
            {{
              verdict.isSolved
                ? `侦探团队准确识别了关键致命时间差（22:15）与备用钥匙卡刷卡记录，锁定了真凶【${culprit?.name}】！`
                : `指控出现了偏差或被伪造的假象误导。真正的凶手是受害人长期剥削压迫的助理【${culprit?.name}】！`
            }}
          </p>
        </div>

        <button
          @click="emit('restart')"
          class="px-5 py-2.5 rounded-xl bg-[#C9942D] hover:bg-[#B38325] text-[#0C0A09] font-bold text-xs transition shadow-md flex items-center space-x-1.5 shrink-0 cursor-pointer"
        >
          <RotateCcw class="w-4 h-4" />
          <span>开启新案件局</span>
        </button>
      </div>
    </div>

    <!-- 2. Visual Scores & Deduction Metrics Bar -->
    <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
      <!-- Metric 1: Spoiler Control -->
      <div
        class="p-5 rounded-2xl border shadow-xs flex flex-col justify-between"
        :class="isDark ? 'bg-[#181411] border-[#3B3027]' : 'bg-[#FAF7F2] border-[#E0D5C7]'"
      >
        <div class="flex items-center justify-between">
          <span class="text-xs font-bold" :class="isDark ? 'text-[#AFA49A]' : 'text-[#786B60]'">AI 剧透控制评分</span>
          <Shield class="w-4 h-4 text-emerald-500" />
        </div>
        <div class="my-3">
          <div class="text-3xl font-extrabold" :class="isDark ? 'text-[#F3EFEA]' : 'text-[#1C1917]'">
            {{ verdict.spoilerControlScore }}
            <span class="text-sm font-semibold" :class="isDark ? 'text-[#8E8378]' : 'text-[#8C7E72]'"> / 100</span>
          </div>
          <div
            class="w-full h-2 rounded-full mt-2 overflow-hidden border"
            :class="isDark ? 'bg-[#100D0B] border-[#3B3027]' : 'bg-[#E8DFD5] border-[#E0D5C7]'"
          >
            <div
              class="bg-emerald-500 h-full rounded-full transition-all duration-500"
              :style="{ width: `${verdict.spoilerControlScore}%` }"
            />
          </div>
        </div>
        <p class="text-[11px]" :class="isDark ? 'text-[#8E8378]' : 'text-[#8C7E72]'">
          RAG 权限隔离成功拦截 {{ roomState.spoilerInterceptions.length }} 次潜在泄密
        </p>
      </div>

      <!-- Metric 2: Clue Utilization Rate -->
      <div
        class="p-5 rounded-2xl border shadow-xs flex flex-col justify-between"
        :class="isDark ? 'bg-[#181411] border-[#3B3027]' : 'bg-[#FAF7F2] border-[#E0D5C7]'"
      >
        <div class="flex items-center justify-between">
          <span class="text-xs font-bold" :class="isDark ? 'text-[#AFA49A]' : 'text-[#786B60]'">关键物证利用率</span>
          <FileCheck2 class="w-4 h-4" :class="isDark ? 'text-[#C9942D]' : 'text-[#8B3A2B]'" />
        </div>
        <div class="my-3">
          <div class="text-3xl font-extrabold" :class="isDark ? 'text-[#F3EFEA]' : 'text-[#1C1917]'">
            {{ verdict.clueUtilizationRate }}%
          </div>
          <div
            class="w-full h-2 rounded-full mt-2 overflow-hidden border"
            :class="isDark ? 'bg-[#100D0B] border-[#3B3027]' : 'bg-[#E8DFD5] border-[#E0D5C7]'"
          >
            <div
              class="h-full rounded-full transition-all duration-500"
              :class="isDark ? 'bg-[#C9942D]' : 'bg-[#8B3A2B]'"
              :style="{ width: `${verdict.clueUtilizationRate}%` }"
            />
          </div>
        </div>
        <p class="text-[11px]" :class="isDark ? 'text-[#8E8378]' : 'text-[#8C7E72]'">
          已探索线索 {{ roomState.discoveredClueIds.length }} 件 / 共 8 件
        </p>
      </div>

      <!-- Metric 3: Team Accuracy -->
      <div
        class="p-5 rounded-2xl border shadow-xs flex flex-col justify-between"
        :class="isDark ? 'bg-[#181411] border-[#3B3027]' : 'bg-[#FAF7F2] border-[#E0D5C7]'"
      >
        <div class="flex items-center justify-between">
          <span class="text-xs font-bold" :class="isDark ? 'text-[#AFA49A]' : 'text-[#786B60]'">指控命中与投票率</span>
          <TrendingUp class="w-4 h-4 text-purple-500" />
        </div>
        <div class="my-3">
          <div class="text-3xl font-extrabold" :class="isDark ? 'text-[#F3EFEA]' : 'text-[#1C1917]'">
            {{ verdict.accuracyRate }}%
          </div>
          <div
            class="w-full h-2 rounded-full mt-2 overflow-hidden border"
            :class="isDark ? 'bg-[#100D0B] border-[#3B3027]' : 'bg-[#E8DFD5] border-[#E0D5C7]'
          ">
            <div
              class="bg-purple-500 h-full rounded-full transition-all duration-500"
              :style="{ width: `${verdict.accuracyRate}%` }"
            />
          </div>
        </div>
        <p class="text-[11px]" :class="isDark ? 'text-[#8E8378]' : 'text-[#8C7E72]'">
          多数票判定：{{ SUSPECTS.find((s) => s.id === verdict.majoritySuspectId)?.name }}
        </p>
      </div>
    </div>

    <!-- 3. The Whole Truth & Mechanism Unfolding -->
    <div
      class="p-6 rounded-3xl border shadow-sm space-y-4"
      :class="isDark ? 'bg-[#181411] border-[#3B3027]' : 'bg-[#FAF7F2] border-[#E0D5C7]'"
    >
      <h3
        class="font-extrabold text-base flex items-center space-x-2"
        :class="isDark ? 'text-[#F3EFEA]' : 'text-[#1C1917]'"
      >
        <Sparkles class="w-4 h-4" :class="isDark ? 'text-[#C9942D]' : 'text-[#8B3A2B]'" />
        <span>全案完整真相与密室推演（The Verifiable Truth）</span>
      </h3>

      <div
        class="p-4 rounded-2xl border text-xs md:text-sm leading-relaxed space-y-2"
        :class="
          isDark
            ? 'bg-[#130F0D] border-[#3B3027] text-[#D8CFC5]'
            : 'bg-white border-[#E0D5C7] text-[#44382F]'
        "
      >
        <p>
          <strong>【真凶身份】：</strong>
          <span class="font-bold" :class="isDark ? 'text-[#E58888]' : 'text-[#8B3A2B]'">画廊助理兼修复师 许宁</span>
        </p>
        <p>
          <strong>【深层杀意与动机】：</strong>
          许宁才是知名画家林岚名下所有成名画作的真正原创画师！策展人陈默长期残酷剽窃掠夺许宁的艺术才华充当“影子画师”。今晚陈默意欲将她开除，并试图借故收缴其修复手稿，将二人彻底扫地出门。
        </p>
        <p>
          <strong>【致命案发过程（22:12 - 22:15）】：</strong>
          22:00 周衡因查出假画与陈默发生激烈争吵，并在香槟里投放了安眠镇静剂；22:05 林岚闯入争论署名权打翻颜料后痛哭跑出大厅。22:12，许宁持藏在抽屉暗层的备用门禁卡刷开修复室，本欲讨回公道，却遭昏昏欲睡的陈默傲慢侮辱。激愤之下，许宁抓起修复台上的青铜重型镇纸猛击陈默后脑及太阳穴致死，死者怀表在撞击中粉碎并永远停摆在
          <strong :class="isDark ? 'text-[#C9942D]' : 'text-[#8B3A2B]'"> 22:15</strong>。
        </p>
        <p>
          <strong>【密室反锁诡计（22:16 - 22:20）】：</strong>
          由于正门只能从内部手动转动旋钮反锁，许宁踩着修复台翻出高处排气窗，将预先绑在内侧窗栓上的极细尼龙钓鱼线经由外廊拉扯，使窗栓自弹回扣，随后抽回钓鱼线伪造成绝命密室，并将林岚画架上的镉红松节油布条丢在门缝栽赃！
        </p>
      </div>

      <!-- Best Deduction Chain Visual Nodes -->
      <div class="mt-4 pt-3 border-t" :class="isDark ? 'border-[#3B3027]' : 'border-[#E8DFD5]'">
        <span class="text-xs font-bold block mb-2" :class="isDark ? 'text-[#AFA49A]' : 'text-[#786B60]'">
          最佳证据链闭环推导图谱：
        </span>
        <div class="flex flex-wrap items-center gap-2 text-xs">
          <template v-for="(clueId, idx) in TRUE_DEDUCTION_CHAIN.evidenceChain" :key="clueId">
            <div
              class="px-3 py-1.5 rounded-xl font-semibold border"
              :class="
                isDark
                  ? 'bg-[#251D17] text-[#C9942D] border-[#3B3027]'
                  : 'bg-white text-[#8B3A2B] border-[#E0D5C7]'
              "
            >
              {{ CLUES.find((c) => c.id === clueId)?.name }}
            </div>
            <ArrowRight
              v-if="idx < TRUE_DEDUCTION_CHAIN.evidenceChain.length - 1"
              class="w-3.5 h-3.5 shrink-0"
              :class="isDark ? 'text-[#8E8378]' : 'text-[#8C7E72]'"
            />
          </template>
        </div>
      </div>
    </div>

    <!-- 4. Three Erroneous Deduction Paths (Red Herrings Breakdown) -->
    <div
      class="p-6 rounded-3xl border shadow-sm space-y-4"
      :class="isDark ? 'bg-[#181411] border-[#3B3027]' : 'bg-[#FAF7F2] border-[#E0D5C7]'"
    >
      <h3
        class="font-extrabold text-base flex items-center space-x-2"
        :class="isDark ? 'text-[#F3EFEA]' : 'text-[#1C1917]'"
      >
        <AlertTriangle class="w-4 h-4" :class="isDark ? 'text-[#A44A4A]' : 'text-[#8B3A2B]'" />
        <span>三大误导性推理路径深度剖析（Red Herrings）</span>
      </h3>

      <div class="grid grid-cols-1 md:grid-cols-3 gap-3.5">
        <div
          v-for="(path, idx) in ERRONEOUS_PATHS"
          :key="idx"
          class="p-4 rounded-2xl border flex flex-col justify-between"
          :class="isDark ? 'bg-[#130F0D] border-[#3B3027]' : 'bg-white border-[#E0D5C7]'"
        >
          <div>
            <h4 class="text-xs font-bold mb-1.5" :class="isDark ? 'text-[#F3EFEA]' : 'text-[#1C1917]'">{{ path.name }}</h4>
            <div class="text-[11px] mb-2" :class="isDark ? 'text-[#AFA49A]' : 'text-[#786B60]'">
              <span class="font-semibold" :class="isDark ? 'text-[#D8CFC5]' : 'text-[#1C1917]'">表面假设：</span>
              {{ path.theory }}
            </div>
            <div
              class="text-[11px] p-2 rounded-xl border"
              :class="
                isDark
                  ? 'text-[#E58888] bg-[#2E1414] border-[#592626]'
                  : 'text-[#8B3A2B] bg-rose-50 border-rose-200'
              "
            >
              <span class="font-bold">逻辑破绽：</span>
              {{ path.flaw }}
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 5. Team Votes & Missed Clues -->
    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
      <!-- Votes Summary -->
      <div
        class="p-5 rounded-2xl border shadow-xs"
        :class="isDark ? 'bg-[#181411] border-[#3B3027]' : 'bg-[#FAF7F2] border-[#E0D5C7]'"
      >
        <h4 class="text-xs font-bold mb-3" :class="isDark ? 'text-[#F3EFEA]' : 'text-[#1C1917]'">玩家最终指控记录：</h4>
        <div class="space-y-2 text-xs">
          <div
            v-for="[pId, voteData] in Object.entries(roomState.votes)"
            :key="pId"
            class="p-2.5 rounded-xl border flex items-center justify-between"
            :class="isDark ? 'border-[#3B3027] bg-[#130F0D]' : 'border-[#E0D5C7] bg-white'"
          >
            <div>
              <span class="font-bold" :class="isDark ? 'text-[#F3EFEA]' : 'text-[#1C1917]'">
                {{ roomState.players.find((p) => p.id === pId)?.name || pId }}
              </span>
              <span class="mx-1.5" :class="isDark ? 'text-[#8E8378]' : 'text-[#8C7E72]'">指认</span>
              <span
                class="font-bold px-1.5 py-0.5 rounded text-white text-[11px]"
                :style="{ backgroundColor: SUSPECTS.find((s) => s.id === voteData.suspectId)?.avatarColor }"
              >
                {{ SUSPECTS.find((s) => s.id === voteData.suspectId)?.name }}
              </span>
            </div>
            <span
              class="text-[10px] px-2 py-0.5 rounded-full font-bold"
              :class="
                voteData.suspectId === TRUE_DEDUCTION_CHAIN.culprit
                  ? isDark
                    ? 'bg-emerald-950/80 text-emerald-300 border border-emerald-800'
                    : 'bg-emerald-50 text-emerald-700 border border-emerald-300'
                  : isDark
                  ? 'bg-rose-950/80 text-rose-300 border border-rose-800'
                  : 'bg-rose-50 text-rose-700 border border-rose-300'
              "
            >
              {{ voteData.suspectId === TRUE_DEDUCTION_CHAIN.culprit ? '指认正确' : '指认错误' }}
            </span>
          </div>
        </div>
      </div>

      <!-- Missed Clues -->
      <div
        class="p-5 rounded-2xl border shadow-xs"
        :class="isDark ? 'bg-[#181411] border-[#3B3027]' : 'bg-[#FAF7F2] border-[#E0D5C7]'"
      >
        <h4 class="text-xs font-bold mb-3" :class="isDark ? 'text-[#F3EFEA]' : 'text-[#1C1917]'">遗漏未解的关键物证：</h4>
        <div
          v-if="missedClues.length === 0"
          class="p-4 text-center text-xs rounded-xl font-medium border"
          :class="
            isDark
              ? 'text-emerald-400 bg-emerald-950/40 border-emerald-900/50'
              : 'text-emerald-700 bg-emerald-50 border-emerald-200'
          "
        >
          全场所有关键铁证均已被侦探团队搜查提取完毕！
        </div>
        <div v-else class="space-y-2 text-xs">
          <div
            v-for="c in missedClues"
            :key="c.id"
            class="p-2.5 rounded-xl border flex items-center justify-between"
            :class="isDark ? 'border-[#3B3027] bg-[#14100E]' : 'border-[#E0D5C7] bg-white'"
          >
            <span class="font-bold" :class="isDark ? 'text-[#C9942D]' : 'text-[#8B3A2B]'">{{ c.name }}</span>
            <span class="text-[10px]" :class="isDark ? 'text-[#AFA49A]' : 'text-[#786B60]'">{{ c.shortDesc.slice(0, 20) }}...</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
