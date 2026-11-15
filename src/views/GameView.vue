<script setup lang="ts">
import { onMounted, onUnmounted, watch } from 'vue';
import { useRouter } from 'vue-router';
import {
  MapPin,
  Clock,
  GitGraph,
  Sun,
  Moon,
  Volume2,
  VolumeX,
  LogOut,
} from 'lucide-vue-next';
import SceneInvestigationView from './Investigation/SceneInvestigationView.vue';
import InvestigationDrawer from '../components/panels/InvestigationDrawer.vue';
import DetectiveBottomDock from '../components/panels/DetectiveBottomDock.vue';
import CaseBoardDrawer from '../components/panels/CaseBoardDrawer.vue';
import FloorPlanModal from '../components/modals/FloorPlanModal.vue';
import SuspectDossierModal from '../components/modals/SuspectDossierModal.vue';
import EvidenceModal3D from '../components/modals/EvidenceModal3D.vue';
import VoteModal from '../components/modals/VoteModal.vue';
import TruthReview from '../components/panels/TruthReview.vue';
import { addClueLink } from '../game/engine';
import { useGameState } from '../composables/useGameState';
import { useTheme } from '../composables/useTheme';

const router = useRouter();
const { themeMode, toggleTheme } = useTheme();
const {
  roomState,
  currentSceneId,
  isFloorPlanOpen,
  isSceneTransitioning,
  unlockedScenes,
  selectedLocationId,
  selectedSuspectId,
  inspectingClue,
  selectedDossierSuspect,
  isVoteModalOpen,
  isCaseBoardOpen,
  isInterrogating,
  clueCountPulse,
  elapsedSeconds,
  isMuted,
  isTruthPhase,
  currentSceneConfig,
  startTimer,
  stopTimer,
  formatTimer,
  handleToggleAudio,
  handleSwitchScene,
  handleDiscoverClue,
  handleStartVote,
  handleSubmitVote,
  handleSendMessageToSuspect,
  handleLinkClueToSuspect,
  handleRestartGame,
} = useGameState();

onMounted(() => {
  if (!isTruthPhase.value) {
    startTimer();
  }
});

onUnmounted(() => {
  stopTimer();
});

watch(isTruthPhase, (truthPhase) => {
  if (truthPhase) {
    stopTimer();
  } else {
    startTimer();
  }
});

const onGoHome = () => {
  router.push('/');
};

const onGoStudio = () => {
  router.push('/studio');
};

const onRestart = () => {
  handleRestartGame();
  router.push('/');
};
</script>

<template>
  <div class="flex-1 flex flex-col">
    <!-- Top Nav Bar in Game Mode -->
    <header
      v-if="!isTruthPhase"
      class="panel-dossier-header sticky top-0 z-40 px-4 py-2 backdrop-blur-md border-b border-theme-border transition-colors duration-300"
    >
      <div class="max-w-360 mx-auto flex items-center justify-between text-xs font-serif">
        <!-- Left: Location -->
        <div class="flex items-center space-x-2">
          <button
            type="button"
            @click="onGoHome"
            class="transition font-medium cursor-pointer text-theme-muted hover:text-theme-ink"
            title="返回封面"
          >
            午夜画廊
          </button>
          <span class="text-theme-border">/</span>
          <button
            type="button"
            @click="isFloorPlanOpen = true"
            class="flex items-center space-x-1 transition cursor-pointer text-theme-secondary hover:text-theme-accent"
            title="查看画廊平面图"
          >
            <MapPin class="w-3.5 h-3.5 text-theme-accent" />
            <span class="font-bold text-theme-ink">
              {{ currentSceneConfig.title }}
            </span>
          </button>
        </div>

        <!-- Middle: Progress & Time -->
        <div class="flex items-center space-x-3 text-xs font-mono text-theme-muted">
          <div class="flex items-center space-x-1">
            <span class="font-sans text-theme-muted">物证:</span>
            <span
              class="font-bold transition-all text-theme-accent"
              :class="{ 'scale-110': clueCountPulse }"
            >
              {{ roomState.discoveredClueIds.length }}/8
            </span>
          </div>
          <span class="text-theme-border">·</span>
          <div class="flex items-center space-x-1">
            <Clock class="w-3.5 h-3.5 text-theme-muted" />
            <span class="text-theme-ink">
              {{ formatTimer(elapsedSeconds) }}
            </span>
          </div>
        </div>

        <!-- Right: Studio Trace, Theme Switcher, Sound & Exit -->
        <div class="flex items-center space-x-2">
          <button
            type="button"
            @click="onGoStudio"
            class="flex items-center space-x-1.5 px-2.5 py-1 rounded border border-theme-border bg-theme-surface hover:bg-theme-card-subtle text-theme-accent transition text-[11px] font-sans cursor-pointer active:scale-95 shadow-sm"
            title="查看该案件在 LangGraph 创作工坊中的逻辑验证报告与状态机"
          >
            <GitGraph class="w-3 h-3 text-theme-accent" />
            <span class="hidden sm:inline">工坊逻辑图谱</span>
            <span class="text-[10px] px-1 rounded font-mono bg-emerald-950/20 text-emerald-500 border border-emerald-500/30">
              100%
            </span>
          </button>

          <!-- In-Game Global Theme Switcher -->
          <div
            class="p-0.5 rounded-full border border-theme-border bg-theme-surface flex items-center gap-0.5 transition-all shadow-xs"
            title="案件游玩全局主题切换：暗夜书房 / 白昼手稿"
          >
            <button
              type="button"
              @click="if (themeMode === 'dark') toggleTheme();"
              class="game-theme-switch-btn"
              :class="{ 'is-active': themeMode === 'light' }"
              title="切换为白昼手稿羊皮纸风格"
            >
              <Sun class="w-3 h-3" />
              <span class="hidden md:inline">白昼</span>
            </button>
            <button
              type="button"
              @click="if (themeMode === 'light') toggleTheme();"
              class="game-theme-switch-btn"
              :class="{ 'is-active': themeMode === 'dark' }"
              title="切换为暗夜侦探书房风格"
            >
              <Moon class="w-3 h-3" />
              <span class="hidden md:inline">暗夜</span>
            </button>
          </div>

          <button
            type="button"
            @click="handleToggleAudio"
            class="p-1.5 rounded transition cursor-pointer text-theme-muted hover:text-theme-ink"
            :title="isMuted ? '开启声景' : '静音'"
          >
            <VolumeX v-if="isMuted" class="w-4 h-4 opacity-50" />
            <Volume2 v-else class="w-4 h-4 text-theme-accent" />
          </button>
          <button
            type="button"
            @click="onGoHome"
            class="p-1.5 rounded transition cursor-pointer text-theme-muted hover:text-red-500"
            title="退出案件"
          >
            <LogOut class="w-4 h-4" />
          </button>
        </div>
      </div>
    </header>

    <!-- Main Game Workspace -->
    <main class="relative flex-1 max-w-360 mx-auto w-full p-3 sm:p-4 flex flex-col justify-between overflow-hidden">
      <!-- Global Scene Transition Mask Overlay -->
      <div
        :class="[
          'absolute inset-0 z-40 transition-opacity duration-300 pointer-events-none flex items-center justify-center backdrop-blur-xs',
          isSceneTransitioning
            ? 'opacity-100 bg-theme-desk/85 pointer-events-auto'
            : 'opacity-0 bg-theme-desk/0'
        ]"
      >
        <div
          v-if="isSceneTransitioning"
          class="flex items-center space-x-2.5 text-theme-accent font-serif text-xs tracking-wider bg-theme-surface/95 px-4 py-2 rounded-full border border-theme-border shadow-2xl animate-pulse"
        >
          <span class="w-2 h-2 rounded-full bg-theme-accent" />
          <span class="text-theme-ink">正在穿过走廊，进入新区域...</span>
        </div>
      </div>

      <TruthReview
        v-if="isTruthPhase"
        :roomState="roomState"
        @restart="onRestart"
      />

      <div v-else class="flex flex-col flex-1 space-y-3">
        <!-- Core 2-Column Workspace -->
        <div class="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-3 items-stretch min-h-130">
          <!-- Left Scene Exploration -->
          <div class="lg:col-span-8 xl:col-span-9 flex flex-col">
            <SceneInvestigationView
              :currentSceneId="currentSceneId"
              :discoveredClueIds="roomState.discoveredClueIds"
              @switchScene="handleSwitchScene"
              @inspectClue="(clue) => inspectingClue = clue"
              @discoveredClue="handleDiscoverClue"
              @openFloorPlan="isFloorPlanOpen = true"
              @selectSuspect="(sId) => selectedSuspectId = sId"
            />
          </div>

          <!-- Right Compact Dossier & Interrogation Slate -->
          <div class="lg:col-span-4 xl:col-span-3 flex flex-col">
            <InvestigationDrawer
              :suspectId="selectedSuspectId"
              :chatHistory="roomState.chatHistory"
              :discoveredClueIds="roomState.discoveredClueIds"
              :isLoading="isInterrogating"
              :currentSceneId="currentSceneId"
              @selectSuspect="(sId) => selectedSuspectId = sId"
              @sendMessage="handleSendMessageToSuspect"
              @openDossier="(suspect) => selectedDossierSuspect = suspect"
            />
          </div>
        </div>

        <!-- Detective Bottom Dock -->
        <DetectiveBottomDock
          :selectedSuspectId="selectedSuspectId"
          :discoveredClueIds="roomState.discoveredClueIds"
          :isCaseBoardOpen="isCaseBoardOpen"
          :currentSceneId="currentSceneId"
          :interrogatedSuspectIds="
            roomState.chatHistory
              .filter((m) => m.suspectId && m.senderRole === 'player')
              .map((m) => m.suspectId!)
          "
          @selectSuspect="(sId) => selectedSuspectId = sId"
          @openDossier="(suspect) => selectedDossierSuspect = suspect"
          @inspectClue="(clue) => inspectingClue = clue"
          @toggleCaseBoard="isCaseBoardOpen = !isCaseBoardOpen"
          @startVote="handleStartVote"
        />

        <!-- Full Case Board Corkboard Modal -->
        <CaseBoardDrawer
          :isOpen="isCaseBoardOpen"
          :discoveredClueIds="roomState.discoveredClueIds"
          :clueLinks="roomState.clueLinks"
          :playerNotes="roomState.playerNotes['player_host'] || ''"
          @toggle="isCaseBoardOpen = !isCaseBoardOpen"
          @inspectClue="(clue) => inspectingClue = clue"
          @removeClueLink="(clueId, targetId) => {
            roomState = addClueLink(roomState, clueId, targetId);
          }"
          @addClueLink="(clueId, targetId, note) => {
            roomState = addClueLink(roomState, clueId, targetId, note);
          }"
          @saveNotes="(notes) => {
            roomState = {
              ...roomState,
              playerNotes: {
                ...roomState.playerNotes,
                player_host: notes,
              },
            };
          }"
          @toggleTheme="toggleTheme"
        />
      </div>
    </main>

    <!-- Modals -->
    <FloorPlanModal
      :isOpen="isFloorPlanOpen"
      :currentSceneId="currentSceneId"
      :discoveredClueIds="roomState.discoveredClueIds"
      :unlockedScenes="unlockedScenes"
      @close="isFloorPlanOpen = false"
      @selectScene="handleSwitchScene"
    />

    <SuspectDossierModal
      :suspect="selectedDossierSuspect"
      @close="selectedDossierSuspect = null"
      @selectForInvestigation="(sId) => {
        selectedSuspectId = sId;
        selectedDossierSuspect = null;
      }"
    />

    <EvidenceModal3D
      :clue="inspectingClue"
      @close="inspectingClue = null"
      @linkSuspect="handleLinkClueToSuspect"
    />

    <VoteModal
      :isOpen="isVoteModalOpen"
      @close="isVoteModalOpen = false"
      @submitVote="handleSubmitVote"
    />
  </div>
</template>

<style scoped>
@reference "../index.css";

.game-theme-switch-btn {
  @apply px-2 py-0.5 rounded-full flex items-center gap-1 transition text-[11px] font-serif font-bold cursor-pointer text-theme-muted hover:text-theme-ink;
}

.game-theme-switch-btn.is-active {
  @apply bg-theme-accent text-white shadow-xs;
}
</style>