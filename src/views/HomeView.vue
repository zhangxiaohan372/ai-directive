<script setup lang="ts">
import { useRouter } from 'vue-router';
import HomePortal from '../components/HomePortal.vue';
import { useTheme } from '../composables/useTheme';
import { useGameState } from '../composables/useGameState';

const router = useRouter();
const { themeMode, toggleTheme } = useTheme();
const { handleStartSinglePlayer } = useGameState();

const onStartSinglePlayer = () => {
  handleStartSinglePlayer();
  router.push('/game');
};

const onOpenLobby = () => {
  router.push('/lobby');
};

const onOpenStudio = () => {
  router.push('/studio');
};
</script>

<template>
  <HomePortal
    :themeMode="themeMode"
    @startSinglePlayer="onStartSinglePlayer"
    @openLobby="onOpenLobby"
    @openStudio="onOpenStudio"
    @toggleTheme="toggleTheme"
  />
</template>
