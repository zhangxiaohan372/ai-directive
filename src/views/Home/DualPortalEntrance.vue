<script setup lang="ts">
import { ref } from 'vue';
import coverImage from '../../assets/images/midnight_gallery_cover_1793514263967.jpg';
import { sound } from '../../utils/audio';
import {
  Volume2,
  VolumeX,
  Users,
  ArrowRight,
  GitGraph,
  Sparkles,
  Upload,
  ShieldCheck,
  Play,
} from 'lucide-vue-next';

const emit = defineEmits<{
  (e: 'startSinglePlayer'): void;
  (e: 'openLobby'): void;
  (e: 'openStudio'): void;
}>();

const isMuted = ref(sound.getIsMuted());

const handleToggleSound = () => {
  const muted = sound.toggleMute();
  isMuted.value = muted;
  if (!muted) {
    sound.startAmbientMystery();
  }
};

const handlePlayMidnightGallery = () => {
  sound.playClueFound();
  emit('startSinglePlayer');
};

const handleEnterStudio = () => {
  sound.playPaperRustle();
  emit('openStudio');
};
</script>

<template>
  <div class="relative w-full min-h-screen bg-theme-desk text-theme-ink font-serif select-none overflow-x-hidden flex flex-col justify-between">
    <!-- Top Header -->
    <header class="relative z-20 w-full max-w-7xl mx-auto px-5 sm:px-8 py-5 flex items-center justify-between">
      <div class="flex items-center gap-3">
        <div class="w-9 h-9 rounded-lg bg-theme-card border border-theme-border flex items-center justify-center text-theme-accent shadow-sm">
          <span class="font-serif font-black text-sm tracking-wider">密</span>
        </div>
        <div>
          <div class="flex items-center gap-2">
            <span class="font-serif font-bold text-theme-ink text-base tracking-wide">
              AI DETECTIVE
            </span>
            <span class="px-1.5 py-0.5 rounded text-[10px] font-mono tracking-wider bg-theme-card-subtle text-theme-accent border border-theme-border">
              双核架构
            </span>
          </div>
          <p class="text-[11px] text-theme-muted font-serif">
            智能探案平台 · Agent 智能创作与确定性游戏引擎
          </p>
        </div>
      </div>

      <!-- Audio & Quick Lobby Controls -->
      <div class="flex items-center gap-2.5">
        <button
          type="button"
          @click="handleToggleSound"
          class="portal-nav-btn"
          :title="isMuted ? '开启环境悬疑声景' : '静音'"
        >
          <VolumeX v-if="isMuted" class="w-3.5 h-3.5 text-theme-muted" />
          <Volume2 v-else class="w-3.5 h-3.5 text-theme-accent animate-pulse" />
          <span class="hidden sm:inline font-sans text-xs">
            {{ isMuted ? '声景静音' : '现场声景' }}
          </span>
        </button>

        <button
          type="button"
          @click="sound.playHeartbeatTick(); emit('openLobby');"
          class="portal-nav-btn"
        >
          <Users class="w-3.5 h-3.5 text-theme-accent" />
          <span class="font-sans text-xs">多人大厅</span>
        </button>
      </div>
    </header>

    <!-- Main Dual-Portal Section -->
    <main class="relative z-10 w-full max-w-7xl mx-auto px-5 sm:px-8 py-4 sm:py-6 flex-1 flex flex-col justify-center">
      <!-- Intro Tagline -->
      <div class="text-center mb-8 sm:mb-10 max-w-3xl mx-auto">
        <div class="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-theme-card border border-theme-border text-theme-accent text-xs font-mono mb-3">
          <Sparkles class="w-3.5 h-3.5" />
          <span>Agent 智能推理解析 + 游戏引擎确定性状态判定</span>
        </div>
        <h2 class="text-2xl sm:text-3xl md:text-4xl font-serif font-black text-theme-ink tracking-tight leading-snug">
          选择进入方向：即刻现场探案，或上传剧本开创案件
        </h2>
        <p class="mt-2 text-theme-muted text-xs sm:text-sm font-serif">
          左侧即玩标准验证级剧本，右侧一键上传本地文档交给 LangGraph 多智能体协同流水线解析
        </p>
      </div>

      <!-- Dual Cards Grid -->
      <div class="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-8 items-stretch">
        <!-- Card 1: 互动探案剧场 (Playable Detective Cases) -->
        <div class="portal-card group">
          <!-- Visual Cover Layer -->
          <div class="relative h-64 sm:h-72 w-full overflow-hidden">
            <img
              :src="coverImage"
              alt="午夜画廊"
              class="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-700 ease-out"
            />
            <div class="absolute inset-0 bg-linear-to-t from-theme-card via-theme-card/50 to-transparent" />
            <div class="absolute top-4 left-4 flex flex-wrap items-center gap-2">
              <span class="px-2.5 py-1 rounded bg-theme-surface/90 border border-theme-border text-theme-accent text-[11px] font-mono font-medium shadow-md">
                精选首发案件 · 100% 规则合规
              </span>
              <span class="px-2.5 py-1 rounded bg-theme-card-subtle/90 border border-theme-border text-theme-muted text-[11px] font-mono">
                4 现场 · 8 物证 · 4 嫌疑人
              </span>
            </div>
          </div>

          <!-- Content & Actions -->
          <div class="p-6 sm:p-7 flex-1 flex flex-col justify-between -mt-6 relative z-10">
            <div>
              <div class="flex items-center gap-2 mb-2">
                <span class="w-2 h-2 rounded-full bg-theme-accent" />
                <span class="text-theme-accent text-xs font-mono tracking-wider">
                  CASE #01 · 密室与时间倒错
                </span>
              </div>
              <h3 class="font-serif font-black text-2xl sm:text-3xl text-theme-ink tracking-tight mb-2">
                午夜画廊：锁闭之谜
              </h3>
              <p class="font-serif text-sm text-theme-secondary leading-relaxed border-l-2 border-theme-accent pl-3 mb-4">
                “22:15，所有人都看见策展人陈默走进修复室；没有人看见他出来。”
              </p>
              <p class="text-xs text-theme-muted leading-relaxed mb-6">
                深入 4 大画廊现场，搜集受害者停摆怀表与松节油抹布等 8 项物证。现场人员根据角色记忆真实交互，严守确定性防剧透边界。
              </p>

              <!-- Sub-cases in library -->
              <div class="mb-6 pt-4 border-t border-theme-border">
                <p class="text-[11px] font-mono text-theme-muted mb-2.5">
                  案件库其他待激活案件：
                </p>
                <div class="grid grid-cols-2 gap-2 text-xs">
                  <div class="p-2 rounded bg-theme-card-subtle border border-theme-border text-theme-secondary flex items-center justify-between">
                    <span class="truncate">《暴风雪山庄：钟楼之锁》</span>
                    <span class="text-[10px] text-theme-accent font-mono shrink-0">待自愈</span>
                  </div>
                  <div class="p-2 rounded bg-theme-card-subtle border border-theme-border text-theme-secondary flex items-center justify-between">
                    <span class="truncate">《深海游艇：无声晚宴》</span>
                    <span class="text-[10px] text-theme-ink font-mono font-bold shrink-0">已收录</span>
                  </div>
                </div>
              </div>
            </div>

            <!-- Action Buttons -->
            <div class="flex flex-col sm:flex-row items-center gap-3 pt-2">
              <button
                type="button"
                @click="handlePlayMidnightGallery"
                class="portal-primary-action-btn"
              >
                <Play class="w-4 h-4 fill-current" />
                <span>进入单人现场调查</span>
              </button>

              <button
                type="button"
                @click="sound.playHeartbeatTick(); emit('openLobby');"
                class="portal-secondary-action-btn"
              >
                <Users class="w-3.5 h-3.5 text-theme-accent" />
                <span>多人联机大厅</span>
              </button>
            </div>
          </div>
        </div>

        <!-- Card 2: 案件创作工坊 (Multi-Agent Case Studio) -->
        <div class="portal-card group">
          <!-- Technical Header Graphic -->
          <div class="relative p-6 sm:p-7 bg-theme-card-subtle border-b border-theme-border">
            <div class="flex items-center justify-between mb-4">
              <div class="flex items-center gap-2">
                <div class="w-8 h-8 rounded-lg bg-theme-surface border border-theme-border flex items-center justify-center text-theme-accent">
                  <GitGraph class="w-4 h-4" />
                </div>
                <span class="font-mono text-xs text-theme-accent font-semibold tracking-wide">
                  LANGGRAPH MULTI-AGENT STUDIO
                </span>
              </div>
              <span class="px-2.5 py-1 rounded bg-theme-card border border-theme-border text-theme-accent text-[11px] font-mono">
                本地剧本上传 · 即刻解析
              </span>
            </div>

            <h3 class="font-serif font-black text-2xl sm:text-3xl text-theme-ink tracking-tight mb-2">
              案件创作工坊
            </h3>
            <p class="text-xs text-theme-secondary leading-relaxed font-serif">
              上传你的本地 PDF、Word、Markdown 或 TXT 剧本，让 LangGraph Agent 完成全流程解析，构建可玩案件。
            </p>
          </div>

          <!-- Pipeline Feature Blueprint Showcase -->
          <div class="p-6 sm:p-7 flex-1 flex flex-col justify-between">
            <div>
              <p class="text-[11px] font-mono text-theme-muted uppercase tracking-wider mb-3">
                六步协同解析与校验工作流：
              </p>

              <!-- Workflow Badges -->
              <div class="space-y-2 mb-6">
                <div class="workflow-step-badge">
                  <div class="flex items-center gap-2.5 text-xs">
                    <span class="step-num">01</span>
                    <span class="font-medium text-theme-ink">文档分块与实体抽取</span>
                  </div>
                  <span class="text-[11px] text-theme-muted font-mono">.md / .txt / .pdf / .json</span>
                </div>

                <div class="workflow-step-badge">
                  <div class="flex items-center gap-2.5 text-xs">
                    <span class="step-num">02</span>
                    <span class="font-medium text-theme-ink">剧本语义与核心动机网</span>
                  </div>
                  <span class="text-[11px] text-theme-accent font-mono">关系图谱与嫌疑人动机</span>
                </div>

                <div class="workflow-step-badge">
                  <div class="flex items-center gap-2.5 text-xs">
                    <span class="step-num">03</span>
                    <span class="font-medium text-theme-ink">确定性时空与锁闭防悖论</span>
                  </div>
                  <span class="text-[11px] text-theme-ink font-mono font-medium">无瞬移 · 无钥匙悖论</span>
                </div>

                <div class="workflow-step-badge">
                  <div class="flex items-center gap-2.5 text-xs">
                    <span class="step-num">04</span>
                    <span class="font-medium text-theme-ink">定向自愈修复节点</span>
                  </div>
                  <span class="text-[11px] text-theme-accent font-mono">冲突自动平滑校正</span>
                </div>
              </div>

              <!-- Technical highlights -->
              <div class="p-3 rounded-lg bg-theme-surface border border-theme-border text-xs text-theme-muted mb-6 flex items-start gap-2.5">
                <ShieldCheck class="w-4 h-4 text-theme-accent shrink-0 mt-0.5" />
                <p class="leading-relaxed">
                  <strong class="text-theme-ink">硬核工程理念：</strong> Agent 负责智能与剧本理解，Game Engine 负责确定性与规则校验。拒绝纯 LLM 编造，逻辑校验全绿才可发布。
                </p>
              </div>
            </div>

            <!-- Action Button -->
            <button
              type="button"
              @click="handleEnterStudio"
              class="portal-action-btn"
            >
              <Upload class="w-4 h-4 text-theme-accent" />
              <span>进入创作工坊（上传本地剧本让 Agent 解析）</span>
              <ArrowRight class="w-4 h-4 text-theme-accent group-hover:translate-x-1 transition-transform" />
            </button>
          </div>
        </div>
      </div>
    </main>

    <!-- Footer -->
    <footer class="relative z-10 w-full max-w-7xl mx-auto px-5 sm:px-8 py-5 border-t border-theme-border flex flex-col sm:flex-row items-center justify-between text-xs text-theme-muted gap-2">
      <div class="flex items-center gap-3">
        <span class="font-serif">AI Detective · 智能探案平台</span>
        <span>•</span>
        <span class="font-mono text-[11px]">LangGraph Multi-Agent Architecture</span>
        <span>•</span>
        <span class="font-mono text-[11px]">Deterministic State Engine</span>
      </div>
      <div class="font-mono text-[11px] text-theme-muted">
        Ready for Interactive Investigation & Script Ingestion
      </div>
    </footer>
  </div>
</template>

<style scoped>
@reference "../../index.css";

.portal-nav-btn {
  @apply flex items-center gap-2 px-3 py-1.5 sm:px-3.5 sm:py-2 rounded-lg bg-theme-surface hover:bg-theme-card-subtle text-theme-ink border border-theme-border hover:border-theme-accent/60 backdrop-blur-md transition-all text-xs cursor-pointer active:scale-95 shadow-xs;
}

.portal-card {
  @apply relative rounded-2xl overflow-hidden bg-theme-card border border-theme-border hover:border-theme-accent/60 transition-all duration-300 shadow-xl flex flex-col justify-between;
}

.workflow-step-badge {
  @apply p-2.5 rounded-lg bg-theme-surface border border-theme-border flex items-center justify-between;
}

.step-num {
  @apply w-5 h-5 rounded bg-theme-card-subtle text-theme-accent text-[10px] font-mono flex items-center justify-center font-bold;
}

.portal-primary-action-btn {
  @apply w-full sm:flex-1 flex items-center justify-center gap-2.5 px-6 py-3.5 rounded-xl bg-theme-accent hover:bg-theme-accent-hover text-white font-serif font-bold text-sm tracking-wide shadow-lg cursor-pointer active:scale-95 transition-all;
}

.portal-secondary-action-btn {
  @apply w-full sm:w-auto px-5 py-3.5 rounded-xl bg-theme-surface hover:bg-theme-card-subtle text-theme-accent border border-theme-border text-xs font-medium cursor-pointer transition-colors flex items-center justify-center gap-2;
}

.portal-action-btn {
  @apply w-full flex items-center justify-center gap-2.5 px-6 py-3.5 rounded-xl bg-theme-surface hover:bg-theme-card-subtle text-theme-accent border border-theme-border hover:border-theme-accent font-serif font-bold text-sm tracking-wide shadow-md cursor-pointer active:scale-95 transition-all;
}
</style>
