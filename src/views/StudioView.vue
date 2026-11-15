<script setup lang="ts">
import { useRouter } from 'vue-router';
import CaseStudio from './CaseStudio/CaseStudio.vue';
import type { StudioCaseData } from '../core/studio';
import { useGameState } from '../composables/useGameState';
import { useTheme } from '../composables/useTheme';

const router = useRouter();
const { themeMode, toggleTheme } = useTheme();
const { handlePlayStudioCase } = useGameState();

const onPlayCase = (caseData: StudioCaseData) => {
  handlePlayStudioCase(caseData);
  router.push('/game');
};

const onBackToGame = () => {
  router.push('/game');
};

const onBackToPortal = () => {
  router.push('/');
};
</script>

<template>
  <CaseStudio
    :themeMode="themeMode"
    @playCase="onPlayCase"
    @backToGame="onBackToGame"
    @backToPortal="onBackToPortal"
    @toggleTheme="toggleTheme"
  />
</template>
