<script setup lang="ts">
import { useRouter } from 'vue-router';
import Lobby from '../components/Lobby.vue';
import { useGameState } from '../composables/useGameState';
import { useTheme } from '../composables/useTheme';

const router = useRouter();
const { themeMode } = useTheme();
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
  <div class="flex-1 flex flex-col">
    <!-- Standard Header for LOBBY -->
    <header
      :class="[
        'border-b sticky top-0 z-40 px-4 py-2 backdrop-blur-md transition-colors',
        themeMode === 'dark'
          ? 'bg-[#0C0A09]/92 border-[#3B3027] text-[#F3EFEA]'
          : 'bg-[#FAF7F2]/95 border-[#E8DFD5] text-[#1C1917]'
      ]"
    >
      <div class="max-w-[1440px] mx-auto flex items-center justify-between">
        <button
          @click="onBackToHome"
          class="flex items-center space-x-2 text-left group cursor-pointer"
        >
          <div
            :class="[
              'w-7 h-7 rounded-lg flex items-center justify-center font-bold text-xs border',
              themeMode === 'dark'
                ? 'bg-[#241B15] text-[#C9942D] border-[#3B3027]'
                : 'bg-[#F2ECE4] text-[#8B3A2B] border-[#E0D5C7]'
            ]"
          >
            密
          </div>
          <span
            :class="[
              'font-bold text-sm',
              themeMode === 'dark' ? 'text-[#F3EFEA]' : 'text-[#1C1917]'
            ]"
          >
            迷雾剧场 · 午夜画廊
          </span>
        </button>
        <button
          @click="onBackToHome"
          :class="[
            'text-xs transition cursor-pointer',
            themeMode === 'dark' ? 'text-[#AFA49A] hover:text-[#F3EFEA]' : 'text-[#786B60] hover:text-[#1C1917]'
          ]"
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
