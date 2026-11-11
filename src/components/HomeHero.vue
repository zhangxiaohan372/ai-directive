<script setup lang="ts">
import { ref } from 'vue';
import coverImage from '../assets/images/midnight_gallery_cover_1793514263967.jpg';
import { sound } from '../utils/audio';
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
  <div class="relative w-full h-[100dvh] overflow-hidden select-none bg-[#070913] text-stone-100 font-serif">
    <!-- 1. Fullscreen Main Visual Background -->
    <img
      :src="coverImage"
      alt="午夜画廊"
      class="absolute inset-0 w-full h-full object-cover object-center pointer-events-none scale-[1.01] transition-transform duration-1000 ease-out"
    />

    <!-- 2. Deep Indigo Transparent Gradient Masks for Text Readability & Cinematic Mood -->
    <div class="absolute inset-0 bg-gradient-to-t from-[#050711]/95 via-[#070c1d]/45 to-transparent pointer-events-none" />
    <div class="absolute inset-0 bg-gradient-to-tr from-[#050711]/90 via-[#060a18]/45 to-transparent w-full md:w-3/4 pointer-events-none" />
    <div class="absolute inset-0 shadow-[inset_0_0_120px_rgba(2,4,10,0.85)] pointer-events-none" />

    <!-- 3. Top-Right: Studio Entry, Sound Toggle & Multiplayer Lobby -->
    <header class="absolute top-5 right-5 sm:top-7 sm:right-7 md:top-9 md:right-9 z-20 flex items-center gap-2.5 sm:gap-3">
      <!-- Case Studio LangGraph Button -->
      <button
        v-if="hasStudio"
        @click="sound.playPaperRustle(); emit('openStudio');"
        class="group flex items-center gap-2 px-3.5 py-2 sm:px-4 sm:py-2.5 rounded-full bg-amber-950/70 hover:bg-amber-900/80 text-amber-300 border border-amber-500/50 backdrop-blur-md transition-all duration-200 shadow-lg hover:border-amber-400 cursor-pointer active:scale-95"
        title="进入案件创作工坊 (LangGraph Pipeline)"
        aria-label="案件创作工坊"
      >
        <span class="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
        <span class="text-xs sm:text-sm font-sans font-semibold tracking-wide">
          案件创作工坊
        </span>
      </button>

      <!-- Sound toggle button -->
      <button
        @click="handleToggleSound"
        class="group flex items-center gap-2 px-3.5 py-2 sm:px-4 sm:py-2.5 rounded-full bg-stone-950/60 hover:bg-stone-900/80 text-stone-200 border border-stone-600/40 backdrop-blur-md transition-all duration-200 shadow-lg hover:border-amber-400/50 cursor-pointer active:scale-95"
        :title="isMuted ? '开启悬疑声景' : '静音'"
        :aria-label="isMuted ? '开启悬疑声景' : '静音'"
      >
        <VolumeX v-if="isMuted" class="w-4 h-4 text-stone-400 group-hover:text-stone-200" />
        <Volume2 v-else class="w-4 h-4 text-amber-400 animate-pulse" />
        <span class="text-xs sm:text-sm font-sans tracking-wide">
          {{ isMuted ? '静音' : '现场声景' }}
        </span>
      </button>

      <!-- Multiplayer Lobby Button -->
      <button
        @click="sound.playHeartbeatTick(); emit('openLobby');"
        class="group flex items-center gap-2 px-4 py-2 sm:px-4.5 sm:py-2.5 rounded-full bg-stone-950/60 hover:bg-stone-900/80 text-stone-200 border border-stone-600/40 backdrop-blur-md transition-all duration-200 shadow-lg hover:border-amber-400/50 cursor-pointer active:scale-95"
        title="进入多人联机大厅"
        aria-label="联机大厅"
      >
        <Users class="w-4 h-4 text-amber-400 group-hover:scale-110 transition-transform" />
        <span class="text-xs sm:text-sm font-sans tracking-wide">联机大厅</span>
      </button>
    </header>

    <!-- 4. Bottom-Left: Minimal & Theatrical Story Entrance -->
    <main class="absolute bottom-8 left-6 sm:bottom-10 sm:left-10 md:bottom-14 md:left-14 lg:bottom-16 lg:left-16 z-20 max-w-xl">
      <!-- Subtitle / Category -->
      <div class="flex items-center gap-2 mb-2 sm:mb-2.5">
        <span class="inline-block w-1.5 h-1.5 rounded-full bg-amber-400 shadow-[0_0_8px_rgba(251,191,36,0.9)]" />
        <p class="text-amber-300 text-xs sm:text-sm font-medium tracking-[0.35em] drop-shadow-md">
          互动推理游戏 · 双核引擎
        </p>
      </div>

      <!-- Main Title -->
      <h1 class="text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-black text-amber-50 tracking-tight drop-shadow-[0_4px_24px_rgba(0,0,0,0.95)] mb-3.5 sm:mb-4 leading-none font-serif">
        午夜画廊
      </h1>

      <!-- Suspense Tagline -->
      <p class="text-stone-200/90 text-sm sm:text-base md:text-lg font-serif leading-relaxed tracking-wider drop-shadow-[0_2px_8px_rgba(0,0,0,0.9)] mb-6 sm:mb-8 border-l-2 border-amber-400/70 pl-3.5 max-w-lg">
        22:15，所有人都看见他走进修复室；没有人看见他出来。
      </p>

      <!-- Tactile Action Buttons -->
      <div class="flex flex-wrap items-center gap-4">
        <button
          @click="handleStartInvestigation"
          class="group inline-flex items-center gap-3 px-8 py-3.5 sm:px-9 sm:py-4 rounded-xl bg-amber-500 hover:bg-amber-400 text-stone-950 font-serif font-black text-base sm:text-lg shadow-[0_10px_25px_-5px_rgba(245,158,11,0.5),0_2px_4px_rgba(0,0,0,0.4)] hover:shadow-[0_15px_30px_-5px_rgba(245,158,11,0.65),0_4px_8px_rgba(0,0,0,0.4)] transition-all duration-200 cursor-pointer active:translate-y-0.5 active:scale-[0.99]"
        >
          <span>进入调查</span>
          <ArrowRight class="w-5 h-5 transition-transform duration-200 group-hover:translate-x-1" />
        </button>

        <button
          v-if="hasStudio"
          @click="sound.playPaperRustle(); emit('openStudio');"
          class="inline-flex items-center gap-2 px-6 py-3.5 sm:py-4 rounded-xl bg-stone-950/70 hover:bg-stone-900/90 text-amber-300 font-serif font-bold text-sm sm:text-base border border-amber-600/40 backdrop-blur-md transition-all duration-200 cursor-pointer shadow-lg active:scale-95"
        >
          <span>LangGraph 创作工坊</span>
        </button>
      </div>
    </main>
  </div>
</template>
