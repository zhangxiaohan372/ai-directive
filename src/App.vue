<script setup lang="ts">
import { computed, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import StorySubtitleBar from './components/StorySubtitleBar.vue';
import DetectiveLoginModal from './components/DetectiveLoginModal.vue';
import { useTheme } from './composables/useTheme';
import { useGameState } from './composables/useGameState';
import { createInitialRoom, advanceGamePhase } from './game/engine';

const route = useRoute();
const router = useRouter();
const { themeMode, toggleTheme } = useTheme();
const { storySubtitle, roomState } = useGameState();

onMounted(() => {
  const params = new URLSearchParams(window.location.search);
  if (params.get('autostart') === '1') {
    const room = createInitialRoom('room_autostart', '先锋侦探', true);
    const adv = advanceGamePhase(room);
    roomState.value = adv;
    router.replace('/game');
  }
});

const backgroundStyle = computed(() => {
  if (route.path === '/game' || route.name === 'game') {
    return themeMode.value === 'dark'
      ? {
          backgroundColor: '#0C0A09',
          backgroundImage: `linear-gradient(to bottom, rgba(12, 10, 9, 0.65), rgba(12, 10, 9, 0.88)), url('/assets/textures/desk-wood.jpg')`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundAttachment: 'fixed',
        }
      : {
          backgroundColor: '#F5EFE6',
          backgroundImage: `radial-gradient(circle at 50% 0%, rgba(255, 255, 255, 0.85), transparent 75%), linear-gradient(to bottom, #FAF7F2, #F5EFE6)`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundAttachment: 'fixed',
        };
  }
  return { backgroundColor: themeMode.value === 'dark' ? '#0C0A09' : '#F5EFE6' };
});
</script>

<template>
  <div
    :class="[
      'min-h-screen flex flex-col font-serif selection:bg-[#A44A4A]/50 selection:text-white transition-colors duration-500',
      themeMode === 'dark' ? 'text-[#F3EFEA]' : 'text-[#2C241E]'
    ]"
    :style="backgroundStyle"
  >
    <!-- Universal Floating Story Subtitle Banner -->
    <StorySubtitleBar
      :message="storySubtitle"
      @dismiss="storySubtitle = null"
    />

    <!-- Routed Views -->
    <router-view />

    <!-- Global Detective Auth & 401 Credential Verification Modal -->
    <DetectiveLoginModal
      :themeMode="themeMode"
      @toggleTheme="toggleTheme"
    />
  </div>
</template>
