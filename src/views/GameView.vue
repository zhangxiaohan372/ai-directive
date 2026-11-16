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
import { useAuth } from '../composables/useAuth';

const router = useRouter();
const { themeMode, toggleTheme } = useTheme();
const { currentUser, openLogin } = useAuth();
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
    <!-- Top Nav Bar in Game Mode (Unified with Home Header Structure) -->
    <header
      v-if="!isTruthPhase"
      class="h-16 px-4 sm:px-8 border-b border-theme-border bg-theme-card/95 flex items-center justify-between shrink-0 sticky top-0 z-40 backdrop-blur-md transition-colors duration-300 font-serif"
    >
      <!-- Left: Brand Logo + Dossier Breadcrumb -->
      <div class="flex items-center gap-3">
        <button
          type="button"
          @click="onGoHome"
          class="flex items-center gap-2.5 text-left group cursor-pointer"
          title="返回首页"
        >
          <div class="w-8 h-8 sm:w-9 sm:h-9 rounded-xl border border-theme-border bg-theme-surface text-theme-accent flex items-center justify-center shadow-xs shrink-0 font-serif font-black text-sm group-hover:border-theme-accent transition-colors">
            密
          </div>
          <div class="hidden sm:block">
            <span class="font-serif font-black text-sm sm:text-base text-theme-ink tracking-wide leading-none block">
              AI Detective
            </span>
            <span class="text-[9px] font-serif tracking-widest text-theme-muted block mt-0.5">
              智能探案平台
            </span>
          </div>
        </button>

        <span class="text-theme-border">|</span>

        <div class="flex items-center gap-1.5 text-xs font-serif">
          <button
            type="button"
            @click="onGoHome"
            class="text-theme-muted hover:text-theme-ink transition font-medium hidden md:inline cursor-pointer"
            title="返回封面"
          >
            午夜庄园 · 血色遗产
          </button>
          <span class="text-theme-border hidden md:inline">/</span>
          <button
            type="button"
            @click="isFloorPlanOpen = true"
            class="flex items-center gap-1 px-2.5 py-1 rounded-md border border-theme-border bg-theme-surface hover:bg-theme-card-subtle text-theme-ink transition cursor-pointer"
            title="查看画廊平面图"
          >
            <MapPin class="w-3.5 h-3.5 text-theme-accent" />
            <span class="font-bold">{{ currentSceneConfig.title }}</span>
            <span class="text-[10px] text-theme-muted hidden lg:inline">平面图</span>
          </button>
        </div>
      </div>

      <!-- Middle: Dossier Progress & Timer (Strict Monospace Hard Cap <= 2) -->
      <div class="flex items-center gap-3 text-xs font-serif">
        <div class="flex items-center gap-1 font-serif text-xs">
          <span class="text-theme-muted">物证:</span>
          <span
            class="font-bold text-theme-accent transition-all font-serif"
            :class="{ 'scale-110': clueCountPulse }"
          >
            {{ roomState.discoveredClueIds.length }}/8
          </span>
        </div>

        <span class="text-theme-border">·</span>

        <!-- Monospace Slot 1: Case Dossier Code -->
        <span class="font-mono text-[11px] text-theme-muted hidden xl:inline">
          NO.1924-MG
        </span>

        <span class="text-theme-border hidden xl:inline">·</span>

        <!-- Monospace Slot 2: Elapsed Timer -->
        <div class="flex items-center gap-1 font-mono text-xs text-theme-ink">
          <Clock class="w-3.5 h-3.5 text-theme-muted" />
          <span>{{ formatTimer(elapsedSeconds) }}</span>
        </div>
      </div>

      <!-- Right: Theme Switcher, Sound, Profile Avatar, Exit (Matches Home Topbar) -->
      <div class="flex items-center gap-2 sm:gap-3">
        <!-- Global Theme Switcher -->
        <div
          class="p-1 rounded-full border border-theme-border bg-theme-surface flex items-center gap-1 transition-all shadow-xs shrink-0"
          title="全局主题切换：暗夜书房 / 白昼手稿"
        >
          <button
            type="button"
            @click="if (themeMode === 'dark') toggleTheme();"
            class="portal-theme-switch-btn"
            :class="{ 'is-active': themeMode === 'light' }"
            title="切换为白昼手稿羊皮纸风格"
          >
            <Sun class="w-3.5 h-3.5" />
            <span class="hidden sm:inline">白昼</span>
          </button>
          <button
            type="button"
            @click="if (themeMode === 'light') toggleTheme();"
            class="portal-theme-switch-btn"
            :class="{ 'is-active': themeMode === 'dark' }"
            title="切换为暗夜侦探书房风格"
          >
            <Moon class="w-3.5 h-3.5" />
            <span class="hidden sm:inline">暗夜</span>
          </button>
        </div>

        <!-- Ambient Soundscape Toggle -->
        <button
          type="button"
          @click="handleToggleAudio"
          class="p-2 rounded-full border border-theme-border bg-theme-surface hover:bg-theme-card-subtle text-theme-muted hover:text-theme-accent transition cursor-pointer"
          :title="isMuted ? '开启环境声景' : '静音'"
        >
          <VolumeX v-if="isMuted" class="w-4 h-4 opacity-50" />
          <Volume2 v-else class="w-4 h-4 text-theme-accent animate-pulse" />
        </button>

        <!-- User Profile Avatar Stamp -->
        <button
          type="button"
          @click="openLogin"
          class="flex items-center gap-1.5 px-2 py-1 rounded-full border border-theme-border bg-theme-surface text-theme-ink hover:border-theme-accent transition cursor-pointer shadow-xs"
          :title="`当前侦探：${currentUser?.name || '未登录'}`"
        >
          <div class="w-6 h-6 rounded-full overflow-hidden border border-theme-border bg-theme-card-subtle text-theme-accent flex items-center justify-center text-xs shrink-0 font-serif font-bold">
            {{ currentUser?.initials || '探' }}
          </div>
          <span class="text-xs font-bold font-serif hidden md:inline truncate max-w-20">
            {{ currentUser?.name || '侦探' }}
          </span>
        </button>

        <!-- Exit to Home -->
        <button
          type="button"
          @click="onGoHome"
          class="p-2 rounded-full border border-theme-border bg-theme-surface hover:bg-theme-accent/20 text-theme-muted hover:text-theme-accent transition cursor-pointer"
          title="退出案件并返回首页"
        >
          <LogOut class="w-4 h-4" />
        </button>
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

.portal-theme-switch-btn {
  @apply px-2.5 py-1 rounded-full flex items-center gap-1.5 transition text-xs font-serif font-bold cursor-pointer text-theme-muted hover:text-theme-ink;
}

.portal-theme-switch-btn.is-active {
  @apply bg-theme-accent text-white shadow-xs;
}
</style>