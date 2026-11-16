<script setup lang="ts">
import { ref } from 'vue';
import coverImage from '../../assets/images/midnight_gallery_cover_1793514263967.jpg';
import { sound } from '../../utils/audio';
import { Volume2, VolumeX, Users, ArrowRight } from 'lucide-vue-next';

interface HomeHeroProps {
  hasStudio?: boolean;
}

withDefaults(defineProps<HomeHeroProps>(), {
  hasStudio: true,
});

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

const handleStartInvestigation = () => {
  sound.playClueFound();
  emit('startSinglePlayer');
};
</script>

<template>
  <div class="relative w-full h-dvh overflow-hidden select-none bg-theme-desk text-theme-ink font-serif">
    <!-- 1. Fullscreen Visual Background & Ambient Vignette -->
    <div class="hero-backdrop">
      <img :src="coverImage" alt="午夜画廊" class="hero-cover-image" />
      <div class="hero-ambient-mask" />
    </div>

    <!-- 2. Top-Right: Studio Entry, Sound Toggle & Multiplayer Lobby -->
    <header class="absolute top-5 right-5 sm:top-7 sm:right-7 md:top-9 md:right-9 z-20 flex items-center gap-3">
      <!-- Case Studio LangGraph Button -->
      <button
        v-if="hasStudio"
        type="button"
        @click="sound.playPaperRustle(); emit('openStudio');"
        class="nav-pill-btn border-theme-accent/60 text-theme-accent hover:border-theme-accent"
        title="进入案件创作工坊 (LangGraph Pipeline)"
        aria-label="案件创作工坊"
      >
        <span class="w-2 h-2 rounded-full bg-theme-accent animate-pulse" />
        <span class="text-xs sm:text-sm font-sans font-semibold tracking-wide">
          案件创作工坊
        </span>
      </button>

      <!-- Sound toggle button -->
      <button
        type="button"
        @click="handleToggleSound"
        class="nav-pill-btn border-theme-border text-theme-ink"
        :title="isMuted ? '开启悬疑声景' : '静音'"
        :aria-label="isMuted ? '开启悬疑声景' : '静音'"
      >
        <VolumeX v-if="isMuted" class="w-4 h-4 text-theme-muted" />
        <Volume2 v-else class="w-4 h-4 text-theme-accent animate-pulse" />
        <span class="text-xs sm:text-sm font-sans tracking-wide">
          {{ isMuted ? '静音' : '现场声景' }}
        </span>
      </button>

      <!-- Multiplayer Lobby Button -->
      <button
        type="button"
        @click="sound.playHeartbeatTick(); emit('openLobby');"
        class="nav-pill-btn border-theme-border text-theme-ink"
        title="进入多人联机大厅"
        aria-label="联机大厅"
      >
        <Users class="w-4 h-4 text-theme-accent" />
        <span class="text-xs sm:text-sm font-sans tracking-wide">联机大厅</span>
      </button>
    </header>

    <!-- 4. Bottom-Left: Theatrical Story Entrance -->
    <main class="absolute bottom-8 left-6 sm:bottom-10 sm:left-10 md:bottom-14 md:left-14 lg:bottom-16 lg:left-16 z-20 max-w-xl">
      <!-- Subtitle -->
      <div class="flex items-center gap-2 mb-2 sm:mb-2.5">
        <span class="inline-block w-1.5 h-1.5 rounded-full bg-theme-accent shadow-sm" />
        <p class="text-theme-accent text-xs sm:text-sm font-medium tracking-[0.35em] drop-shadow-md">
          互动推理游戏 · 双核引擎
        </p>
      </div>

      <!-- Main Title -->
      <h1 class="text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-black text-theme-ink tracking-tight drop-shadow-[0_4px_24px_rgba(0,0,0,0.95)] mb-3.5 sm:mb-4 leading-none font-serif">
        午夜画廊
      </h1>

      <!-- Suspense Tagline -->
      <p class="text-stone-200/90 text-sm sm:text-base md:text-lg font-serif leading-relaxed tracking-wider drop-shadow-md mb-6 sm:mb-8 border-l-2 border-theme-accent/70 pl-3.5 max-w-lg">
        22:15，所有人都看见他走进修复室；没有人看见他出来。
      </p>

      <!-- Tactile Action Buttons -->
      <div class="flex flex-wrap items-center gap-4">
        <button
          type="button"
          @click="handleStartInvestigation"
          class="hero-primary-btn group"
        >
          <span>进入调查</span>
          <ArrowRight class="w-5 h-5 transition-transform duration-200 group-hover:translate-x-1" />
        </button>

        <button
          v-if="hasStudio"
          type="button"
          @click="sound.playPaperRustle(); emit('openStudio');"
          class="hero-secondary-btn"
        >
          <span>LangGraph 创作工坊</span>
        </button>
      </div>
    </main>
  </div>
</template>

<style scoped>
@reference "../../index.css";

.hero-backdrop {
  @apply absolute inset-0 pointer-events-none overflow-hidden;
}

.hero-cover-image {
  @apply w-full h-full object-cover object-center scale-105 transition-transform duration-1000 ease-out;
}

.hero-ambient-mask {
  @apply absolute inset-0;
  background:
    radial-gradient(ellipse at center, transparent 35%, rgba(0, 0, 0, 0.85) 100%),
    linear-gradient(to top, rgba(0, 0, 0, 0.9) 0%, rgba(0, 0, 0, 0.45) 50%, transparent 100%),
    linear-gradient(to top right, rgba(0, 0, 0, 0.85) 0%, rgba(0, 0, 0, 0.35) 60%, transparent 100%);
}

.nav-pill-btn {
  @apply flex items-center gap-2 px-3.5 py-2 sm:px-4 sm:py-2.5 rounded-full bg-theme-surface/85 backdrop-blur-md border transition-all duration-200 shadow-lg cursor-pointer active:scale-95;
}

.hero-primary-btn {
  @apply inline-flex items-center gap-3 px-8 py-3.5 sm:px-9 sm:py-4 rounded-xl bg-theme-accent hover:bg-theme-accent-hover text-white font-serif font-black text-base sm:text-lg shadow-xl transition-all duration-200 cursor-pointer active:scale-95;
}

.hero-secondary-btn {
  @apply inline-flex items-center gap-2 px-6 py-3.5 sm:py-4 rounded-xl bg-theme-surface/80 hover:bg-theme-surface text-theme-accent font-serif font-bold text-sm sm:text-base border border-theme-border backdrop-blur-md transition-all duration-200 cursor-pointer shadow-lg active:scale-95;
}
</style>
