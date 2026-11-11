<script setup lang="ts">
import { ref, computed } from 'vue';
import heroDeskImage from '../assets/images/detective_desk_hero_1793628837475.jpg';
import gothicManorImage from '../assets/images/gothic_manor_case_1793628855550.jpg';
import rainyCityImage from '../assets/images/rainy_city_case_1793628875087.jpg';
import studyRoomImage from '../assets/images/study_room_case_1793628901150.jpg';
import lighthouseImage from '../assets/images/lighthouse_mist_case_1793628922679.jpg';
import { sound } from '../utils/audio';
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
} from 'lucide-vue-next';

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
  <div
    class="w-full min-h-screen font-sans flex flex-col selection:bg-amber-600/30 overflow-x-hidden transition-colors duration-300"
    :class="isDark ? 'bg-[#0C0A09] text-[#E5DCD0]' : 'bg-[#F5EFE6] text-[#2C241E]'"
  >
    <!-- 1. TOP NAVBAR WITH GLOBAL THEME CONTROL -->
    <header
      class="h-16 px-6 sm:px-10 border-b flex items-center justify-between shrink-0 sticky top-0 z-40 backdrop-blur-md transition-colors duration-300"
      :class="isDark ? 'bg-[#120F0D]/95 border-[#2C2117]' : 'bg-[#FAF7F2]/95 border-[#E8DFD5]'"
    >
      <!-- Left: Brand Logo & Title -->
      <div class="flex items-center gap-3">
        <div
          class="w-9 h-9 rounded-xl border flex items-center justify-center shadow-inner shrink-0"
          :class="
            isDark
              ? 'bg-gradient-to-br from-[#2D2115] via-[#1A130C] to-[#0D0906] border-[#543F2A] text-[#E5C384]'
              : 'bg-[#8B3A2B] border-[#783023] text-white shadow-xs ring-2 ring-[#8B3A2B]/10'
          "
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
            <h1
              class="font-serif font-black text-base tracking-wide leading-none"
              :class="isDark ? 'text-[#F3EFEA]' : 'text-[#1C1917]'"
            >
              AI Detective
            </h1>
          </div>
          <p
            class="text-[10px] font-serif tracking-widest mt-0.5"
            :class="isDark ? 'text-[#A89073]' : 'text-[#8C7E72]'"
          >
            智能探案平台
          </p>
        </div>
      </div>

      <!-- Center: Top Navigation Links -->
      <nav class="hidden md:flex items-center gap-7 text-xs font-serif">
        <button
          class="flex items-center gap-1.5 font-bold border-b-2 pb-0.5 cursor-pointer"
          :class="isDark ? 'text-[#F5E2BD] border-[#D4A359]' : 'text-[#8B3A2B] border-[#8B3A2B]'"
        >
          <span>首页</span>
        </button>
        <button
          @click="sound.playPaperRustle(); emit('openStudio');"
          class="flex items-center gap-1.5 transition-colors cursor-pointer"
          :class="isDark ? 'text-[#A89073] hover:text-[#F3EFEA]' : 'text-[#786B60] hover:text-[#1C1917]'"
        >
          <span>案件创作</span>
        </button>
      </nav>

      <!-- Right: Theme Toggle, Search, Sound, Notification & User Avatar -->
      <div class="flex items-center gap-2.5 sm:gap-3">
        <!-- GLOBAL THEME SWITCHER -->
        <div
          class="p-1 rounded-full border flex items-center gap-1 transition-all shadow-xs shrink-0"
          :class="isDark ? 'bg-[#18130E] border-[#3E2D1E]' : 'bg-white border-[#E0D5C7]'"
          title="全局主题切换：暗夜书房 / 白昼手稿"
        >
          <button
            @click="if (isDark) emit('toggleTheme');"
            class="px-3 py-1 rounded-full flex items-center gap-1.5 transition text-xs font-serif font-bold cursor-pointer"
            :class="!isDark ? 'bg-[#8B3A2B] text-white shadow-xs' : 'text-[#8C765E] hover:text-[#E5C384]'"
            title="切换为白昼手稿羊皮纸风格（全平台同步）"
          >
            <Sun class="w-3.5 h-3.5" />
            <span>白昼</span>
          </button>
          <button
            @click="if (!isDark) emit('toggleTheme');"
            class="px-3 py-1 rounded-full flex items-center gap-1.5 transition text-xs font-serif font-bold cursor-pointer"
            :class="
              isDark
                ? 'bg-gradient-to-r from-[#DFB36C] via-[#C9942D] to-[#DFB36C] text-[#140E07] shadow-xs'
                : 'text-[#8C7E72] hover:text-[#1C1917]'
            "
            title="切换为暗夜侦探书房风格（全平台同步）"
          >
            <Moon class="w-3.5 h-3.5" />
            <span>暗夜</span>
          </button>
        </div>

        <!-- Search Input Bar -->
        <div class="relative hidden sm:flex items-center">
          <Search
            class="w-3.5 h-3.5 absolute left-3 pointer-events-none"
            :class="isDark ? 'text-[#8C765E]' : 'text-[#8C7E72]'"
          />
          <input
            type="text"
            v-model="searchQuery"
            placeholder="搜索案件..."
            class="w-36 lg:w-48 pl-9 pr-3 py-1.5 rounded-full border text-xs transition-all focus:outline-none focus:w-56"
            :class="
              isDark
                ? 'bg-[#1A140F] border-[#3A2B1D] text-[#E5DCD0] placeholder-[#8C765E] focus:border-[#C9942D]'
                : 'bg-white border-[#E0D5C7] text-[#1C1917] placeholder-[#8C7E72] focus:border-[#8B3A2B]'
            "
          />
          <button
            v-if="searchQuery"
            @click="searchQuery = ''"
            class="absolute right-2.5 opacity-60 hover:opacity-100 cursor-pointer"
          >
            <X class="w-3 h-3" />
          </button>
        </div>

        <!-- Soundscape Ambient Toggle -->
        <button
          @click="handleToggleSound"
          class="p-2 rounded-full border transition cursor-pointer"
          :class="
            isDark
              ? 'bg-[#18130E] hover:bg-[#241B13] text-[#A89073] hover:text-[#E5C384] border-[#3A2B1D]'
              : 'bg-white hover:bg-[#F2ECE4] text-[#8C7E72] hover:text-[#8B3A2B] border-[#E0D5C7]'
          "
          :title="isMuted ? '开启环境悬疑声景' : '静音'"
        >
          <VolumeX v-if="isMuted" class="w-4 h-4 opacity-50" />
          <Volume2 v-else class="w-4 h-4 animate-pulse" :class="isDark ? 'text-[#C9942D]' : 'text-[#8B3A2B]'" />
        </button>

        <!-- User Avatar -->
        <div
          class="w-8 h-8 rounded-full overflow-hidden border flex items-center justify-center text-xs shrink-0 shadow-md font-serif"
          :class="
            isDark
              ? 'border-[#523A25] bg-[#221810] text-[#E8C88B]'
              : 'border-[#E0D5C7] bg-[#FAF7F2] text-[#8B3A2B]'
          "
        >
          <span class="font-bold">侦</span>
        </div>
      </div>
    </header>

    <!-- 2. HERO SECTION WITH DETECTIVE DESK BACKGROUND -->
    <section class="relative w-full h-[540px] sm:h-[580px] lg:h-[620px] overflow-hidden flex items-center">
      <!-- Background Image Layer -->
      <img
        :src="heroDeskImage"
        alt="AI Detective Desk"
        class="absolute inset-0 w-full h-full object-cover object-center pointer-events-none scale-[1.01] transition-all duration-700"
        :class="isDark ? 'brightness-100 contrast-100' : 'brightness-105 contrast-[0.92] sepia-[0.2]'"
      />

      <!-- Cinematic Darkness or Warm Daytime Overlay -->
      <div
        class="absolute inset-0 pointer-events-none transition-colors duration-500"
        :class="
          isDark
            ? 'bg-gradient-to-r from-[#0C0A09]/95 via-[#0C0A09]/75 to-transparent'
            : 'bg-gradient-to-r from-[#F5EFE6] via-[#F5EFE6]/92 to-[#F5EFE6]/40'
        "
      />
      <div
        class="absolute inset-0 pointer-events-none transition-colors duration-500"
        :class="
          isDark
            ? 'bg-gradient-to-t from-[#0C0A09] via-transparent to-[#0C0A09]/40'
            : 'bg-gradient-to-t from-[#F5EFE6] via-transparent to-[#FAF7F2]/60'
        "
      />

      <!-- Hero Content Block -->
      <div class="relative z-10 max-w-7xl mx-auto px-6 sm:px-10 w-full">
        <div class="max-w-2xl space-y-4 sm:space-y-5">
          <h2
            class="text-3xl sm:text-4xl md:text-5xl lg:text-[54px] font-serif font-black tracking-tight leading-[1.18]"
            :class="
              isDark
                ? 'text-[#F3EFEA] drop-shadow-[0_4px_24px_rgba(0,0,0,0.9)]'
                : 'text-[#1C1917] drop-shadow-sm'
            "
          >
            让每个人都能成为
            <br />
            <span
              class="text-transparent bg-clip-text"
              :class="
                isDark
                  ? 'bg-gradient-to-r from-[#F5E2BD] via-[#DFB36C] to-[#C9942D]'
                  : 'bg-gradient-to-r from-[#8B3A2B] via-[#C9942D] to-[#8B3A2B]'
              "
            >
              案件创作者，也能成为侦探
            </span>
          </h2>

          <p
            class="text-sm sm:text-base md:text-lg font-serif leading-relaxed"
            :class="isDark ? 'text-[#C7B59D] drop-shadow-md' : 'text-[#5C4F44]'"
          >
            上传剧本，AI 为你生成完整案件，开启沉浸式的推理之旅
          </p>

          <!-- CTA Buttons -->
          <div class="flex flex-wrap items-center gap-4 pt-2">
            <button
              @click="sound.playPaperRustle(); emit('openStudio');"
              class="flex items-center gap-2.5 px-6 py-3.5 rounded-full font-serif font-black text-sm tracking-wide shadow-xl cursor-pointer active:scale-95 transition-all"
              :class="
                isDark
                  ? 'bg-gradient-to-r from-[#DFB36C] via-[#C9942D] to-[#DFB36C] hover:from-[#E8C485] hover:to-[#D4A359] text-[#140E07] shadow-amber-950/40'
                  : 'bg-[#8B3A2B] hover:bg-[#783023] text-white shadow-red-950/20'
              "
            >
              <Play class="w-4 h-4 fill-current" />
              <span>开始创作 →</span>
            </button>

            <button
              @click="handleScrollToCases"
              class="flex items-center gap-2 px-6 py-3.5 rounded-full font-serif font-medium text-sm transition-all cursor-pointer shadow-md border"
              :class="
                isDark
                  ? 'bg-[#18130E]/85 hover:bg-[#251D15] text-[#E8C88B] border-[#523A25] hover:border-[#8C683F]'
                  : 'bg-white hover:bg-[#FAF7F2] text-[#8B3A2B] border-[#E0D5C7]'
              "
            >
              <Compass class="w-4 h-4" />
              <span>探索案例</span>
            </button>
          </div>
        </div>
      </div>
    </section>

    <!-- 3. FOUR FEATURE PILLARS BAR -->
    <section class="relative z-20 max-w-7xl mx-auto px-6 sm:px-10 -mt-10 sm:-mt-12 w-full">
      <div
        class="rounded-2xl border backdrop-blur-md p-5 sm:p-6 shadow-2xl grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 divide-y sm:divide-y-0 sm:divide-x transition-colors duration-300"
        :class="
          isDark
            ? 'bg-[#14100D]/90 border-[#3B2B1D] divide-[#2C2015]'
            : 'bg-white/95 border-[#EBE4DC] divide-[#F0EAE1]'
        "
      >
        <div class="flex items-center gap-4 pt-3 sm:pt-0 sm:px-3">
          <div
            class="w-12 h-12 rounded-xl border flex items-center justify-center shrink-0"
            :class="isDark ? 'bg-[#221810] border-[#523A25] text-[#E8C88B]' : 'bg-[#FAF7F2] border-[#EAE1D5] text-[#8B3A2B]'"
          >
            <FileText class="w-6 h-6" />
          </div>
          <div>
            <h3 class="font-serif font-bold text-sm" :class="isDark ? 'text-[#F3EFEA]' : 'text-[#1C1917]'">
              多格式支持
            </h3>
            <p class="text-xs font-serif mt-0.5" :class="isDark ? 'text-[#9E866D]' : 'text-[#786B60]'">
              支持 PDF / Word / Markdown
            </p>
          </div>
        </div>

        <div class="flex items-center gap-4 pt-3 sm:pt-0 sm:px-3">
          <div
            class="w-12 h-12 rounded-xl border flex items-center justify-center shrink-0"
            :class="isDark ? 'bg-[#221810] border-[#523A25] text-[#E8C88B]' : 'bg-[#FAF7F2] border-[#EAE1D5] text-[#8B3A2B]'"
          >
            <GitGraph class="w-6 h-6" />
          </div>
          <div>
            <h3 class="font-serif font-bold text-sm" :class="isDark ? 'text-[#F3EFEA]' : 'text-[#1C1917]'">
              智能创作
            </h3>
            <p class="text-xs font-serif mt-0.5" :class="isDark ? 'text-[#9E866D]' : 'text-[#786B60]'">
              基于 LangGraph 的工作流
            </p>
          </div>
        </div>

        <div class="flex items-center gap-4 pt-3 sm:pt-0 sm:px-3">
          <div
            class="w-12 h-12 rounded-xl border flex items-center justify-center shrink-0"
            :class="isDark ? 'bg-[#221810] border-[#523A25] text-[#E8C88B]' : 'bg-[#FAF7F2] border-[#EAE1D5] text-[#8B3A2B]'"
          >
            <Gamepad2 class="w-6 h-6" />
          </div>
          <div>
            <h3 class="font-serif font-bold text-sm" :class="isDark ? 'text-[#F3EFEA]' : 'text-[#1C1917]'">
              沉浸推理
            </h3>
            <p class="text-xs font-serif mt-0.5" :class="isDark ? 'text-[#9E866D]' : 'text-[#786B60]'">
              与 AI NPC 展开互动
            </p>
          </div>
        </div>

        <div class="flex items-center gap-4 pt-3 sm:pt-0 sm:px-3">
          <div
            class="w-12 h-12 rounded-xl border flex items-center justify-center shrink-0"
            :class="isDark ? 'bg-[#221810] border-[#523A25] text-[#E8C88B]' : 'bg-[#FAF7F2] border-[#EAE1D5] text-[#8B3A2B]'"
          >
            <ShieldCheck class="w-6 h-6 text-emerald-500" />
          </div>
          <div>
            <h3 class="font-serif font-bold text-sm" :class="isDark ? 'text-[#F3EFEA]' : 'text-[#1C1917]'">
              逻辑严谨
            </h3>
            <p class="text-xs font-serif mt-0.5" :class="isDark ? 'text-[#9E866D]' : 'text-[#786B60]'">
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
          <div class="w-1 h-6 rounded-full" :class="isDark ? 'bg-[#C9942D]' : 'bg-[#8B3A2B]'" />
          <h2 class="font-serif font-black text-xl sm:text-2xl tracking-tight" :class="isDark ? 'text-[#F3EFEA]' : 'text-[#1C1917]'">
            热门案件
          </h2>
          <span
            class="hidden sm:inline text-xs font-serif border-l pl-3"
            :class="isDark ? 'text-[#8C765E] border-[#3D2D1E]' : 'text-[#8C7E72] border-[#E0D5C7]'"
          >
            探索精选案件，开启你的推理之旅
          </span>
        </div>

        <button
          @click="sound.playPaperRustle(); emit('openStudio');"
          class="flex items-center gap-1.5 text-xs font-serif transition-colors cursor-pointer group"
          :class="isDark ? 'text-[#A89073] hover:text-[#E8C88B]' : 'text-[#8C7E72] hover:text-[#8B3A2B]'"
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
          class="group relative rounded-2xl overflow-hidden border transition-all duration-300 shadow-xl flex flex-col justify-between cursor-pointer"
          :class="
            isDark
              ? 'bg-[#14100D] border-[#2E2217] hover:border-[#7A5B36]'
              : 'bg-white border-[#EBE4DC] hover:border-[#D9CFC4]'
          "
        >
          <div class="relative h-44 w-full overflow-hidden">
            <img
              :src="caseItem.image"
              :alt="caseItem.title"
              class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 ease-out"
            />
            <div
              class="absolute inset-0 bg-gradient-to-t via-transparent to-transparent"
              :class="isDark ? 'from-[#14100D]' : 'from-white'"
            />

            <div
              class="absolute top-3 left-3 flex items-center gap-1 px-2.5 py-1 rounded-full border backdrop-blur-md text-[11px] font-mono shadow-md"
              :class="
                isDark
                  ? 'bg-[#0C0A09]/80 border-[#4A3725] text-[#E8C88B]'
                  : 'bg-white/90 border-[#E0D5C7] text-[#8B3A2B]'
              "
            >
              <Flame class="w-3 h-3 text-[#FF7A00] fill-current" />
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
              <h3
                class="font-serif font-bold text-sm sm:text-base transition-colors mb-2 truncate"
                :class="isDark ? 'text-[#F3EFEA] group-hover:text-[#E8C88B]' : 'text-[#1C1917] group-hover:text-[#8B3A2B]'"
              >
                {{ caseItem.title }}
              </h3>

              <div class="flex flex-wrap items-center gap-1.5 mb-3">
                <span
                  v-for="tag in caseItem.tags"
                  :key="tag"
                  class="px-2 py-0.5 rounded text-[10px] font-serif"
                  :class="
                    isDark
                      ? 'bg-[#1C1510] border border-[#3A2A1D] text-[#A89073]'
                      : 'bg-[#F5E7DF] text-[#8B3A2B]'
                  "
                >
                  {{ tag }}
                </span>
              </div>
            </div>

            <div
              class="flex items-center justify-between pt-2 border-t"
              :class="isDark ? 'border-[#221811]' : 'border-[#F0EAE1]'"
            >
              <span class="text-[11px] font-serif" :class="isDark ? 'text-[#7A6652]' : 'text-[#8C7E72]'">
                {{ caseItem.statusText }}
              </span>
              <div
                class="w-7 h-7 rounded-full border flex items-center justify-center transition-all"
                :class="
                  isDark
                    ? 'bg-[#1F1711] border-[#3E2C1D] text-[#A89073] group-hover:bg-[#C9942D] group-hover:border-[#C9942D] group-hover:text-[#140E07]'
                    : 'bg-[#FAF7F2] border-[#E0D5C7] text-[#8C7E72] group-hover:bg-[#8B3A2B] group-hover:border-[#8B3A2B] group-hover:text-white'
                "
              >
                <ChevronRight class="w-4 h-4 stroke-[2.5]" />
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
      <div
        class="w-full max-w-lg rounded-2xl border p-6 shadow-2xl space-y-4 animate-in fade-in zoom-in-95 duration-200"
        :class="isDark ? 'bg-[#14100D] border-[#4A3723] text-[#E5DCD0]' : 'bg-white border-[#E0D5C7] text-[#1C1917]'"
      >
        <div class="flex items-center justify-between pb-3 border-b" :class="isDark ? 'border-[#2C2117]' : 'border-[#F0EAE1]'">
          <div class="flex items-center gap-2">
            <span class="w-2 h-2 rounded-full" :class="isDark ? 'bg-[#C9942D]' : 'bg-[#8B3A2B]'" />
            <h3 class="font-serif font-black text-lg" :class="isDark ? 'text-[#F1DFBA]' : 'text-[#1C1917]'">
              {{ selectedCaseModal.title }}
            </h3>
          </div>
          <button
            @click="selectedCaseModal = null"
            class="p-1 rounded opacity-60 hover:opacity-100 transition cursor-pointer"
          >
            <X class="w-5 h-5" />
          </button>
        </div>

        <div class="h-44 w-full rounded-xl overflow-hidden border border-black/20 relative">
          <img
            :src="selectedCaseModal.image"
            :alt="selectedCaseModal.title"
            class="w-full h-full object-cover"
          />
          <div class="absolute top-3 left-3 flex items-center gap-1 px-2.5 py-1 rounded-full bg-black/75 text-white text-xs font-mono">
            <Flame class="w-3 h-3 text-[#FF7A00] fill-current" />
            <span>热度 {{ selectedCaseModal.heat }}</span>
          </div>
        </div>

        <div class="space-y-2">
          <div class="flex items-center gap-2">
            <span
              v-for="tag in selectedCaseModal.tags"
              :key="tag"
              class="px-2 py-0.5 rounded text-xs font-serif"
              :class="
                isDark
                  ? 'bg-[#221810] border border-[#473422] text-[#E8C88B]'
                  : 'bg-[#F5E7DF] text-[#8B3A2B]'
              "
            >
              {{ tag }}
            </span>
          </div>
          <p class="text-xs font-serif leading-relaxed" :class="isDark ? 'text-[#C7B59D]' : 'text-[#5C4F44]'">
            {{ selectedCaseModal.description }}
          </p>
        </div>

        <div class="flex flex-col sm:flex-row items-center gap-3 pt-3 border-t" :class="isDark ? 'border-[#2C2117]' : 'border-[#F0EAE1]'">
          <button
            v-if="selectedCaseModal.isPlayable"
            @click="handlePlayCaseDirect(selectedCaseModal)"
            class="w-full sm:flex-1 flex items-center justify-center gap-2 py-3 rounded-xl font-serif font-bold text-xs shadow-lg cursor-pointer active:scale-95 transition-all"
            :class="
              isDark
                ? 'bg-gradient-to-r from-[#DFB36C] via-[#C9942D] to-[#DFB36C] text-[#140E07]'
                : 'bg-[#8B3A2B] hover:bg-[#783023] text-white'
            "
          >
            <Play class="w-4 h-4 fill-current" />
            <span>立即开始现场调查</span>
          </button>
          <button
            v-else
            @click="handleExploreCaseInStudio(selectedCaseModal)"
            class="w-full sm:flex-1 flex items-center justify-center gap-2 py-3 rounded-xl font-serif font-bold text-xs cursor-pointer transition-all border"
            :class="
              isDark
                ? 'bg-[#271C12] hover:bg-[#342618] text-[#E8C88B] border-[#5A4027]'
                : 'bg-[#FAF7F2] hover:bg-[#F2ECE4] text-[#8B3A2B] border-[#E0D5C7]'
            "
          >
            <GitGraph class="w-4 h-4" />
            <span>在创作工坊中解析 / 完善</span>
          </button>

          <button
            @click="sound.playHeartbeatTick(); selectedCaseModal = null; emit('openLobby');"
            class="w-full sm:w-auto px-4 py-3 rounded-xl border text-xs font-serif cursor-pointer transition-colors flex items-center justify-center gap-1.5"
            :class="
              isDark
                ? 'bg-[#1A140F] hover:bg-[#251D15] text-[#A89073] hover:text-[#E8C88B] border-[#3A2B1D]'
                : 'bg-white hover:bg-[#FAF7F2] text-[#6E5F52] hover:text-[#1C1917] border-[#E0D5C7]'
            "
          >
            <Users class="w-3.5 h-3.5" />
            <span>联机大厅</span>
          </button>
        </div>
      </div>
    </div>

    <!-- 6. FOOTER -->
    <footer
      class="mt-auto border-t py-6 px-6 sm:px-10 text-xs font-serif flex flex-col sm:flex-row items-center justify-between gap-3 transition-colors duration-300"
      :class="
        isDark
          ? 'bg-[#0A0807] border-[#221810] text-[#7A6652]'
          : 'bg-[#FAF7F2] border-[#E8DFD5] text-[#8C7E72]'
      "
    >
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
