<script setup lang="ts">
import { ref, computed } from 'vue';
import heroDeskImage from '../../assets/images/detective_desk_hero_1793628837475.jpg';
import gothicManorImage from '../../assets/images/gothic_manor_case_1793628855550.jpg';
import rainyCityImage from '../../assets/images/rainy_city_case_1793628875087.jpg';
import studyRoomImage from '../../assets/images/study_room_case_1793628901150.jpg';
import lighthouseImage from '../../assets/images/lighthouse_mist_case_1793628922679.jpg';
import { sound } from '../../utils/audio';
import {
  Search,
  Play,
  ArrowRight,
  ChevronRight,
  Flame,
  FileText,
  GitGraph,
  Gamepad2,
  ShieldCheck,
  Volume2,
  VolumeX,
  Users,
  Compass,
  X,
  Sun,
  Moon,
  ShieldAlert,
} from 'lucide-vue-next';
import { useAuth } from '../../composables/useAuth';

export interface CaseCardItem {
  id: string;
  title: string;
  heat: string;
  image: string;
  tags: string[];
  description: string;
  isPlayable: boolean;
  statusText: string;
}

const CASES_DATA: CaseCardItem[] = [
  {
    id: 'midnight_gallery',
    title: '午夜庄园 · 血色遗产',
    heat: '9.8',
    image: gothicManorImage,
    tags: ['悬疑', '推理', '家族'],
    description: '22:15，所有人都看见策展人陈默走进修复室；没有人看见他出来。4大现场，8项微观物证，100%确定性规则合规。',
    isPlayable: true,
    statusText: '可立即探案',
  },
  {
    id: 'rainy_night',
    title: '雨夜迷案',
    heat: '9.5',
    image: rainyCityImage,
    tags: ['悬疑', '都市', '犯罪'],
    description: '暴雨冲刷着霓虹交错的阴暗巷道。雨伞骨架上检测出的微量剧毒涂层，彻底粉碎了嫌疑人的不在场证明。',
    isPlayable: false,
    statusText: '工坊解析完成',
  },
  {
    id: 'study_secret',
    title: '书房的秘密',
    heat: '9.2',
    image: studyRoomImage,
    tags: ['推理', '密室', '人性'],
    description: '反锁的书房、暗藏的密道与被撕裂的遗嘱原件。停摆的时钟究竟被谁动过了手脚？',
    isPlayable: false,
    statusText: '自愈修复就绪',
  },
  {
    id: 'lighthouse_mystery',
    title: '灯塔之谜',
    heat: '9.1',
    image: lighthouseImage,
    tags: ['悬疑', '海滨', '失踪'],
    description: '暴风雨袭击孤悬海外的旧石灯塔。守塔人凭空失踪，而灯室透镜上却留下了一串湿漉漉的单向足迹。',
    isPlayable: false,
    statusText: '工坊构建中',
  },
];

interface HomePortalProps {
  themeMode?: 'dark' | 'light';
}

const props = withDefaults(defineProps<HomePortalProps>(), {
  themeMode: 'dark',
});

const emit = defineEmits<{
  (e: 'startSinglePlayer'): void;
  (e: 'openLobby'): void;
  (e: 'openStudio'): void;
  (e: 'toggleTheme'): void;
}>();

const searchQuery = ref('');
const isMuted = ref(sound.getIsMuted());
const selectedCaseModal = ref<CaseCardItem | null>(null);

const { currentUser, trigger401, openLogin } = useAuth();

const isDark = computed(() => props.themeMode === 'dark');

const handleToggleSound = () => {
  const muted = sound.toggleMute();
  isMuted.value = muted;
  if (!muted) {
    sound.startAmbientMystery();
  }
};

const filteredCases = computed(() => {
  if (!searchQuery.value.trim()) return CASES_DATA;
  const query = searchQuery.value.toLowerCase().trim();
  return CASES_DATA.filter(
    (c) =>
      c.title.toLowerCase().includes(query) ||
      c.description.toLowerCase().includes(query) ||
      c.tags.some((t) => t.toLowerCase().includes(query))
  );
});

const handleCaseCardClick = (item: CaseCardItem) => {
  sound.playPaperRustle();
  selectedCaseModal.value = item;
};

const handlePlayCaseDirect = (_item: CaseCardItem) => {
  sound.playClueFound();
  selectedCaseModal.value = null;
  emit('startSinglePlayer');
};

const handleExploreCaseInStudio = (_item: CaseCardItem) => {
  sound.playPaperRustle();
  selectedCaseModal.value = null;
  emit('openStudio');
};

const handleScrollToCases = () => {
  sound.playPaperRustle();
  const el = document.getElementById('popular-cases-section');
  if (el) {
    el.scrollIntoView({ behavior: 'smooth' });
  }
};
</script>

<template>
  <div class="w-full min-h-screen font-serif flex flex-col bg-theme-desk text-theme-ink selection:bg-theme-accent/20 overflow-x-hidden transition-colors duration-300">
    <!-- 1. TOP NAVBAR WITH GLOBAL THEME CONTROL -->
    <header class="h-16 px-6 sm:px-10 border-b border-theme-border bg-theme-card/95 flex items-center justify-between shrink-0 sticky top-0 z-40 backdrop-blur-md transition-colors duration-300">
      <!-- Left: Brand Logo & Title -->
      <div class="flex items-center gap-3">
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

      <!-- Center: Top Navigation Links -->
      <nav class="hidden md:flex items-center gap-7 text-xs font-serif">
        <button
          type="button"
          class="flex items-center gap-1.5 font-bold border-b-2 pb-0.5 border-theme-accent text-theme-accent cursor-pointer"
        >
          <span>首页</span>
        </button>
        <button
          type="button"
          @click="sound.playPaperRustle(); emit('openStudio');"
          class="flex items-center gap-1.5 text-theme-muted hover:text-theme-ink transition-colors cursor-pointer"
        >
          <span>案件创作</span>
        </button>
      </nav>

      <!-- Right: Theme Toggle, Search, Sound, Notification & User Avatar -->
      <div class="flex items-center gap-2.5 sm:gap-3">
        <!-- GLOBAL THEME SWITCHER -->
        <div
          class="p-1 rounded-full border border-theme-border bg-theme-surface flex items-center gap-1 transition-all shadow-xs shrink-0"
          title="全局主题切换：暗夜书房 / 白昼手稿"
        >
          <button
            type="button"
            @click="if (isDark) emit('toggleTheme');"
            class="portal-theme-switch-btn"
            :class="{ 'is-active': !isDark }"
            title="切换为白昼手稿羊皮纸风格（全平台同步）"
          >
            <Sun class="w-3.5 h-3.5" />
            <span>白昼</span>
          </button>
          <button
            type="button"
            @click="if (!isDark) emit('toggleTheme');"
            class="portal-theme-switch-btn"
            :class="{ 'is-active': isDark }"
            title="切换为暗夜侦探书房风格（全平台同步）"
          >
            <Moon class="w-3.5 h-3.5" />
            <span>暗夜</span>
          </button>
        </div>

        <!-- Search Input Bar -->
        <div class="relative hidden sm:flex items-center">
          <Search class="w-3.5 h-3.5 absolute left-3 pointer-events-none text-theme-muted" />
          <input
            type="text"
            v-model="searchQuery"
            placeholder="搜索案件..."
            class="w-36 lg:w-48 pl-9 pr-3 py-1.5 rounded-full border border-theme-border bg-theme-surface text-theme-ink placeholder-theme-muted text-xs transition-all focus:outline-none focus:w-56 focus:border-theme-accent"
          />
          <button
            v-if="searchQuery"
            type="button"
            @click="searchQuery = ''"
            class="absolute right-2.5 text-theme-muted hover:text-theme-ink cursor-pointer"
          >
            <X class="w-3 h-3" />
          </button>
        </div>

        <!-- Soundscape Ambient Toggle -->
        <button
          type="button"
          @click="handleToggleSound"
          class="nav-icon-btn"
          :title="isMuted ? '开启环境悬疑声景' : '静音'"
        >
          <VolumeX v-if="isMuted" class="w-4 h-4 opacity-50" />
          <Volume2 v-else class="w-4 h-4 text-theme-accent animate-pulse" />
        </button>

        <!-- Simulated 401 Unauthorized Trigger Button -->
        <button
          type="button"
          @click="trigger401('用户在首页顶栏主动触发 401 模拟：会话凭证过期，请重新验证侦探档案。')"
          class="portal-sim-btn"
          title="点击模拟触发 HTTP 401 登录失效，展示侦探档案核验界面"
        >
          <ShieldAlert class="w-3.5 h-3.5 shrink-0" />
          <span class="hidden sm:inline font-serif font-bold text-[11px]">模拟401失效</span>
        </button>

        <!-- User Detective Profile Stamp / Login Trigger -->
        <div class="relative">
          <button
            type="button"
            @click="openLogin"
            class="portal-profile-btn"
            :title="`当前侦探：${currentUser?.name || '未登录'} [${currentUser?.badgeNo || '无警号'}] - 点击切换或验证`"
          >
            <div class="w-6 h-6 rounded-full overflow-hidden border border-theme-border bg-theme-card-subtle text-theme-accent flex items-center justify-center text-xs shrink-0 font-serif font-bold">
              {{ currentUser?.initials || '访' }}
            </div>
            <div class="hidden lg:flex flex-col text-left leading-none font-serif pr-1">
              <span class="text-xs font-bold truncate max-w-22.5">{{ currentUser?.name || '未登录' }}</span>
              <span class="text-[9px] font-mono text-theme-muted">{{ currentUser?.badgeNo || '点击登录' }}</span>
            </div>
          </button>
        </div>
      </div>
    </header>

    <!-- 2. HERO SECTION WITH DETECTIVE DESK BACKGROUND -->
    <section class="portal-hero-section">
      <!-- Background Image & Atmospheric Mask Layer -->
      <div class="portal-hero-backdrop">
        <img
          :src="heroDeskImage"
          alt="AI Detective Desk"
          class="portal-hero-img"
        />
        <div class="portal-hero-mask" />
      </div>

      <!-- Hero Content Block -->
      <div class="relative z-10 max-w-7xl mx-auto px-6 sm:px-10 w-full">
        <div class="max-w-2xl space-y-4 sm:space-y-5">
          <h2 class="text-3xl sm:text-4xl md:text-5xl lg:text-5xl font-serif font-black tracking-tight leading-[1.18] text-theme-ink drop-shadow-sm">
            让每个人都能成为
            <br />
            <span class="text-theme-accent">
              案件创作者，也能成为侦探
            </span>
          </h2>

          <p class="text-sm sm:text-base md:text-lg font-serif leading-relaxed text-theme-secondary">
            上传剧本，AI 为你生成完整案件，开启沉浸式的推理之旅
          </p>

          <!-- CTA Buttons -->
          <div class="flex flex-wrap items-center gap-4 pt-2">
            <button
              type="button"
              @click="sound.playPaperRustle(); emit('openStudio');"
              class="flex items-center gap-2.5 px-6 py-3.5 rounded-full font-serif font-black text-sm tracking-wide bg-theme-accent hover:bg-theme-accent-hover text-white shadow-xl cursor-pointer active:scale-95 transition-all"
            >
              <Play class="w-4 h-4 fill-current" />
              <span>开始创作 →</span>
            </button>

            <button
              type="button"
              @click="handleScrollToCases"
              class="flex items-center gap-2 px-6 py-3.5 rounded-full font-serif font-medium text-sm border border-theme-border bg-theme-surface hover:bg-theme-card-subtle text-theme-ink transition-all cursor-pointer shadow-md"
            >
              <Compass class="w-4 h-4 text-theme-accent" />
              <span>探索案例</span>
            </button>
          </div>
        </div>
      </div>
    </section>

    <!-- 3. FOUR FEATURE PILLARS BAR -->
    <section class="relative z-20 max-w-7xl mx-auto px-6 sm:px-10 -mt-10 sm:-mt-12 w-full">
      <div class="rounded-2xl border border-theme-border bg-theme-surface/95 backdrop-blur-md p-5 sm:p-6 shadow-2xl grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 divide-y sm:divide-y-0 sm:divide-x divide-theme-border transition-colors duration-300">
        <div class="feature-pillar-box">
          <div class="feature-pillar-icon">
            <FileText class="w-6 h-6" />
          </div>
          <div>
            <h3 class="font-serif font-bold text-sm text-theme-ink">
              多格式支持
            </h3>
            <p class="text-xs font-serif mt-0.5 text-theme-muted">
              支持 PDF / Word / Markdown
            </p>
          </div>
        </div>

        <div class="feature-pillar-box">
          <div class="feature-pillar-icon">
            <GitGraph class="w-6 h-6" />
          </div>
          <div>
            <h3 class="font-serif font-bold text-sm text-theme-ink">
              智能创作
            </h3>
            <p class="text-xs font-serif mt-0.5 text-theme-muted">
              基于 LangGraph 的工作流
            </p>
          </div>
        </div>

        <div class="feature-pillar-box">
          <div class="feature-pillar-icon">
            <Gamepad2 class="w-6 h-6" />
          </div>
          <div>
            <h3 class="font-serif font-bold text-sm text-theme-ink">
              沉浸推理
            </h3>
            <p class="text-xs font-serif mt-0.5 text-theme-muted">
              与 AI NPC 展开互动
            </p>
          </div>
        </div>

        <div class="feature-pillar-box">
          <div class="feature-pillar-icon">
            <ShieldCheck class="w-6 h-6 text-emerald-500" />
          </div>
          <div>
            <h3 class="font-serif font-bold text-sm text-theme-ink">
              逻辑严谨
            </h3>
            <p class="text-xs font-serif mt-0.5 text-theme-muted">
              多重校验，保证可玩性
            </p>
          </div>
        </div>
      </div>
    </section>

    <!-- 4. POPULAR CASES GALLERY -->
    <section
      id="popular-cases-section"
      class="max-w-7xl mx-auto px-6 sm:px-10 py-12 sm:py-16 w-full space-y-6"
    >
      <div class="flex items-center justify-between">
        <div class="flex items-center gap-3">
          <div class="w-1 h-6 rounded-full bg-theme-accent" />
          <h2 class="font-serif font-black text-xl sm:text-2xl tracking-tight text-theme-ink">
            热门案件
          </h2>
          <span class="hidden sm:inline text-xs font-serif border-l border-theme-border pl-3 text-theme-muted">
            探索精选案件，开启你的推理之旅
          </span>
        </div>

        <button
          type="button"
          @click="sound.playPaperRustle(); emit('openStudio');"
          class="flex items-center gap-1.5 text-xs font-serif text-theme-muted hover:text-theme-accent transition-colors cursor-pointer group"
        >
          <span>查看更多</span>
          <ArrowRight class="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
        </button>
      </div>

      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <div
          v-for="caseItem in filteredCases"
          :key="caseItem.id"
          @click="handleCaseCardClick(caseItem)"
          class="case-card group"
        >
          <div class="relative h-44 w-full overflow-hidden">
            <img
              :src="caseItem.image"
              :alt="caseItem.title"
              class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 ease-out"
            />
            <div class="absolute inset-0 bg-linear-to-t from-theme-card via-transparent to-transparent" />

            <div class="absolute top-3 left-3 flex items-center gap-1 px-2.5 py-1 rounded-full border border-theme-border bg-theme-surface/90 text-theme-accent text-[11px] font-mono shadow-md backdrop-blur-md">
              <Flame class="w-3 h-3 text-amber-500 fill-current" />
              <span>热度 {{ caseItem.heat }}</span>
            </div>

            <div
              v-if="caseItem.isPlayable"
              class="absolute top-3 right-3 px-2 py-0.5 rounded bg-emerald-950/80 border border-emerald-500/50 text-emerald-400 text-[10px] font-mono"
            >
              可立即探案
            </div>
          </div>

          <div class="p-4 pt-1 flex flex-col justify-between flex-1">
            <div>
              <h3 class="font-serif font-bold text-sm sm:text-base text-theme-ink group-hover:text-theme-accent transition-colors mb-2 truncate">
                {{ caseItem.title }}
              </h3>

              <div class="flex flex-wrap items-center gap-1.5 mb-3">
                <span
                  v-for="tag in caseItem.tags"
                  :key="tag"
                  class="tag-pill"
                >
                  {{ tag }}
                </span>
              </div>
            </div>

            <div class="flex items-center justify-between pt-2 border-t border-theme-border">
              <span class="text-[11px] font-serif text-theme-muted">
                {{ caseItem.statusText }}
              </span>
              <div class="w-7 h-7 rounded-full border border-theme-border bg-theme-surface text-theme-muted group-hover:bg-theme-accent group-hover:border-theme-accent group-hover:text-white flex items-center justify-center transition-all">
                <ChevronRight class="w-4 h-4 stroke-2" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- 5. CASE DETAIL / PLAY MODAL -->
    <div
      v-if="selectedCaseModal"
      class="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 font-serif"
    >
      <div class="w-full max-w-lg rounded-2xl border border-theme-border bg-theme-card text-theme-ink p-6 shadow-2xl space-y-4 animate-in fade-in zoom-in-95 duration-200">
        <div class="flex items-center justify-between pb-3 border-b border-theme-border">
          <div class="flex items-center gap-2">
            <span class="w-2 h-2 rounded-full bg-theme-accent" />
            <h3 class="font-serif font-black text-lg text-theme-ink">
              {{ selectedCaseModal.title }}
            </h3>
          </div>
          <button
            type="button"
            @click="selectedCaseModal = null"
            class="p-1 rounded opacity-60 hover:opacity-100 transition cursor-pointer text-theme-muted hover:text-theme-ink"
          >
            <X class="w-5 h-5" />
          </button>
        </div>

        <div class="h-44 w-full rounded-xl overflow-hidden border border-theme-border relative">
          <img
            :src="selectedCaseModal.image"
            :alt="selectedCaseModal.title"
            class="w-full h-full object-cover"
          />
          <div class="absolute top-3 left-3 flex items-center gap-1 px-2.5 py-1 rounded-full bg-black/75 text-white text-xs font-mono">
            <Flame class="w-3 h-3 text-amber-500 fill-current" />
            <span>热度 {{ selectedCaseModal.heat }}</span>
          </div>
        </div>

        <div class="space-y-2">
          <div class="flex items-center gap-2">
            <span
              v-for="tag in selectedCaseModal.tags"
              :key="tag"
              class="tag-pill text-theme-accent"
            >
              {{ tag }}
            </span>
          </div>
          <p class="text-xs font-serif leading-relaxed text-theme-secondary">
            {{ selectedCaseModal.description }}
          </p>
        </div>

        <div class="flex flex-col sm:flex-row items-center gap-3 pt-3 border-t border-theme-border">
          <button
            v-if="selectedCaseModal.isPlayable"
            type="button"
            @click="handlePlayCaseDirect(selectedCaseModal)"
            class="portal-modal-primary-btn"
          >
            <Play class="w-4 h-4 fill-current" />
            <span>立即开始现场调查</span>
          </button>
          <button
            v-else
            type="button"
            @click="handleExploreCaseInStudio(selectedCaseModal)"
            class="portal-modal-secondary-btn"
          >
            <GitGraph class="w-4 h-4 text-theme-accent" />
            <span>在创作工坊中解析 / 完善</span>
          </button>

          <button
            type="button"
            @click="sound.playHeartbeatTick(); selectedCaseModal = null; emit('openLobby');"
            class="portal-modal-aux-btn"
          >
            <Users class="w-3.5 h-3.5 text-theme-accent" />
            <span>联机大厅</span>
          </button>
        </div>
      </div>
    </div>

    <!-- 6. FOOTER -->
    <footer class="mt-auto border-t border-theme-border bg-theme-card-subtle py-6 px-6 sm:px-10 text-xs font-serif text-theme-muted flex flex-col sm:flex-row items-center justify-between gap-3 transition-colors duration-300">
      <div class="flex items-center gap-3">
        <span>AI Detective · 智能探案平台</span>
        <span>•</span>
        <span class="font-mono text-[11px]">LangGraph Multi-Agent Architecture</span>
        <span>•</span>
        <span class="font-mono text-[11px]">Deterministic State Engine</span>
      </div>
      <div class="font-mono text-[11px] opacity-75">
        Ready for Multi-Case Investigation & AI Authorship
      </div>
    </footer>
  </div>
</template>

<style scoped>
@reference "../../index.css";

.portal-hero-section {
  @apply relative w-full h-135 sm:h-145 lg:h-155 overflow-hidden flex items-center;
}

.portal-hero-backdrop {
  @apply absolute inset-0 pointer-events-none;
}

.portal-hero-img {
  @apply absolute inset-0 w-full h-full object-cover object-center scale-105 transition-all duration-700 dark:brightness-95 dark:contrast-105 brightness-105 contrast-95 sepia-[0.2];
}

.portal-hero-mask {
  @apply absolute inset-0 transition-colors duration-500;
  background:
    linear-gradient(to right, var(--bg-overlay, var(--bg-desk)) 0%, rgba(0, 0, 0, 0) 70%),
    linear-gradient(to top, var(--bg-desk) 0%, rgba(0, 0, 0, 0) 50%);
}

.nav-icon-btn {
  @apply p-2 rounded-full border border-theme-border bg-theme-surface hover:bg-theme-card-subtle text-theme-muted hover:text-theme-accent transition cursor-pointer;
}

.portal-theme-switch-btn {
  @apply px-3 py-1 rounded-full flex items-center gap-1.5 transition text-xs font-serif font-bold cursor-pointer text-theme-muted hover:text-theme-ink;
}

.portal-theme-switch-btn.is-active {
  @apply bg-theme-accent text-white shadow-xs;
}

.portal-sim-btn {
  @apply flex items-center gap-1.5 px-2.5 py-1 rounded-full border border-red-500/30 bg-red-950/15 text-red-500 hover:bg-red-950/25 text-xs font-mono transition cursor-pointer active:scale-95 shadow-xs;
}

.portal-profile-btn {
  @apply flex items-center gap-2 px-2 py-1 rounded-full border border-theme-border bg-theme-surface text-theme-ink hover:border-theme-accent transition cursor-pointer active:scale-95 shadow-xs;
}

.portal-modal-primary-btn {
  @apply w-full sm:flex-1 flex items-center justify-center gap-2 py-3 rounded-xl font-serif font-bold text-xs bg-theme-accent hover:bg-theme-accent-hover text-white shadow-lg cursor-pointer active:scale-95 transition-all;
}

.portal-modal-secondary-btn {
  @apply w-full sm:flex-1 flex items-center justify-center gap-2 py-3 rounded-xl font-serif font-bold text-xs border border-theme-border bg-theme-surface hover:bg-theme-card-subtle text-theme-accent cursor-pointer transition-all;
}

.portal-modal-aux-btn {
  @apply w-full sm:w-auto px-4 py-3 rounded-xl border border-theme-border bg-theme-surface hover:bg-theme-card-subtle text-theme-secondary hover:text-theme-ink text-xs font-serif cursor-pointer transition-colors flex items-center justify-center gap-1.5;
}

.feature-pillar-box {
  @apply flex items-center gap-4 pt-3 sm:pt-0 sm:px-3;
}

.feature-pillar-icon {
  @apply w-12 h-12 rounded-xl border border-theme-border bg-theme-card-subtle flex items-center justify-center shrink-0 text-theme-accent;
}

.case-card {
  @apply relative rounded-2xl overflow-hidden border border-theme-border bg-theme-card hover:border-theme-accent/60 transition-all duration-300 shadow-xl flex flex-col justify-between cursor-pointer;
}

.tag-pill {
  @apply px-2 py-0.5 rounded text-[10px] font-serif bg-theme-card-subtle border border-theme-border text-theme-muted;
}
</style>
