<script setup lang="ts">
import { useRouter } from 'vue-router';
import Lobby from './Lobby/Lobby.vue';
import { useGameState } from '../composables/useGameState';

const router = useRouter();
const {
  roomState,
  handleCreateRoom,
  handleJoinRoom,
  handleAddBotPlayer,
} = useGameState();

const onStartGame = () => {
  router.push('/game');
};

const onBackToHome = () => {
  router.push('/');
};
</script>

<template>
  <div class="flex-1 flex flex-col font-serif">
    <!-- Standard Header for LOBBY -->
    <header class="panel-dossier-header border-b border-theme-border sticky top-0 z-40 px-4 py-2 backdrop-blur-md transition-colors">
      <div class="max-w-360 mx-auto flex items-center justify-between">
        <button
          type="button"
          @click="onBackToHome"
          class="flex items-center space-x-2 text-left group cursor-pointer"
        >
          <div class="w-7 h-7 rounded-lg flex items-center justify-center font-bold text-xs border border-theme-border bg-theme-surface text-theme-accent shadow-xs">
            密
          </div>
          <span class="font-bold text-sm text-theme-ink">
            迷雾剧场 · 午夜画廊
          </span>
        </button>
        <button
          type="button"
          @click="onBackToHome"
          class="text-xs text-theme-muted hover:text-theme-ink transition cursor-pointer"
        >
          返回封面
        </button>
      </div>
    </header>

    <main class="flex-1 max-w-5xl mx-auto w-full p-4 flex items-center justify-center">
      <Lobby
        :roomId="roomState.roomId"
        :roomCode="roomState.roomCode"
        :players="roomState.players"
        :isHost="true"
        @startGame="onStartGame"
        @createRoom="handleCreateRoom"
        @joinRoom="handleJoinRoom"
        @backToHome="onBackToHome"
        @addBotPlayer="handleAddBotPlayer"
      />
    </main>
  </div>
</template>
