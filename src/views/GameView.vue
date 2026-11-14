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
import SceneInvestigationView from '../components/SceneInvestigationView.vue';
import InvestigationDrawer from '../components/InvestigationDrawer.vue';
import DetectiveBottomDock from '../components/DetectiveBottomDock.vue';
import CaseBoardDrawer from '../components/CaseBoardDrawer.vue';
import FloorPlanModal from '../components/FloorPlanModal.vue';
import SuspectDossierModal from '../components/SuspectDossierModal.vue';
import EvidenceModal3D from '../components/EvidenceModal3D.vue';
import VoteModal from '../components/VoteModal.vue';
import TruthReview from '../components/TruthReview.vue';
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
      :class="[
        'sticky top-0 z-40 px-4 py-2 backdrop-blur-md border-b transition-colors duration-300',
        themeMode === 'dark'
          ? 'bg-[#0C0A09]/92 border-[#3B3027] text-[#F3EFEA]'
          : 'bg-[#FAF7F2]/95 border-[#E8DFD5] text-[#1C1917]'
      ]"
    >
      <div class="max-w-[1440px] mx-auto flex items-center justify-between text-xs font-serif">
        <!-- Left: Location -->
        <div class="flex items-center space-x-2">
          <button
            @click="onGoHome"
            :class="[
              'transition font-medium cursor-pointer',
              themeMode === 'dark' ? 'text-[#AFA49A] hover:text-[#F3EFEA]' : 'text-[#786B60] hover:text-[#1C1917]'
            ]"
            title="返回封面"
          >
            午夜画廊
          </button>
          <span :class="themeMode === 'dark' ? 'text-[#3B3027]' : 'text-[#D8CFC5]'">/</span>
          <button
            @click="isFloorPlanOpen = true"
            :class="[
              'flex items-center space-x-1 transition cursor-pointer',
              themeMode === 'dark' ? 'text-[#D9D1C7] hover:text-[#C9942D]' : 'text-[#5C4F44] hover:text-[#8B3A2B]'
            ]"
            title="查看画廊平面图"
          >
            <MapPin :class="['w-3.5 h-3.5', themeMode === 'dark' ? 'text-[#C9942D]' : 'text-[#8B3A2B]']" />
            <span :class="['font-bold', themeMode === 'dark' ? 'text-[#F3EFEA]' : 'text-[#1C1917]']">
              {{ currentSceneConfig.title }}
            </span>
          </button>
        </div>

        <!-- Middle: Progress & Time -->
        <div :class="['flex items-center space-x-3 text-xs font-mono', themeMode === 'dark' ? 'text-[#AFA49A]' : 'text-[#786B60]']">
          <div class="flex items-center space-x-1">
            <span :class="['font-sans', themeMode === 'dark' ? 'text-[#8E8378]' : 'text-[#8C7E72]']">
              物证:
            </span>
            <span
              :class="[
                'font-bold transition-all',
                clueCountPulse
                  ? themeMode === 'dark' ? 'scale-110 text-[#C9942D]' : 'scale-110 text-[#8B3A2B]'
                  : themeMode === 'dark' ? 'text-[#F3EFEA]' : 'text-[#1C1917]'
              ]"
            >
              {{ roomState.discoveredClueIds.length }}/8
            </span>
          </div>
          <span :class="themeMode === 'dark' ? 'text-[#3B3027]' : 'text-[#D8CFC5]'">·</span>
          <div class="flex items-center space-x-1">
            <Clock :class="['w-3.5 h-3.5', themeMode === 'dark' ? 'text-[#8E8378]' : 'text-[#8C7E72]']" />
            <span :class="themeMode === 'dark' ? 'text-[#AFA49A]' : 'text-[#1C1917]'">
              {{ formatTimer(elapsedSeconds) }}
            </span>
          </div>
        </div>

        <!-- Right: Studio Trace, Theme Switcher, Sound & Exit -->
        <div class="flex items-center space-x-2">
          <button
            @click="onGoStudio"
            :class="[
              'flex items-center space-x-1.5 px-2.5 py-1 rounded border transition text-[11px] font-sans cursor-pointer active:scale-95 shadow-sm',
              themeMode === 'dark'
                ? 'bg-[#181411] hover:bg-stone-900 text-[#C9942D] border-[#3B3027] hover:border-[#C9942D]/50'
                : 'bg-white hover:bg-[#F2ECE4] text-[#8B3A2B] border-[#E0D5C7]'
            ]"
            title="查看该案件在 LangGraph 创作工坊中的逻辑验证报告与状态机"
          >
            <GitGraph :class="['w-3 h-3', themeMode === 'dark' ? 'text-[#C9942D]' : 'text-[#8B3A2B]']" />
            <span class="hidden sm:inline">工坊逻辑图谱</span>
            <span
              :class="[
                'text-[10px] px-1 rounded font-mono',
                themeMode === 'dark'
                  ? 'bg-emerald-950/80 text-emerald-400 border border-emerald-600/30'
                  : 'bg-emerald-50 text-emerald-700 border border-emerald-300'
              ]"
            >
              100%
            </span>
          </button>

          <!-- In-Game Global Theme Switcher -->
          <div
            :class="[
              'p-0.5 rounded-full border flex items-center gap-0.5 transition-all shadow-xs',
              themeMode === 'dark' ? 'bg-[#18130E] border-[#3E2D1E]' : 'bg-white border-[#E0D5C7]'
            ]"
            title="案件游玩全局主题切换：暗夜书房 / 白昼手稿"
          >
            <button
              @click="if (themeMode === 'dark') toggleTheme();"
              :class="[
                'px-2 py-0.5 rounded-full flex items-center gap-1 transition text-[11px] font-serif font-bold cursor-pointer',
                themeMode === 'light' ? 'bg-[#8B3A2B] text-white shadow-xs' : 'text-[#8C765E] hover:text-[#E5C384]'
              ]"
              title="切换为白昼手稿羊皮纸风格"
            >
              <Sun class="w-3 h-3" />
              <span class="hidden md:inline">白昼</span>
            </button>
            <button
              @click="if (themeMode === 'light') toggleTheme();"
              :class="[
                'px-2 py-0.5 rounded-full flex items-center gap-1 transition text-[11px] font-serif font-bold cursor-pointer',
                themeMode === 'dark'
                  ? 'bg-gradient-to-r from-[#DFB36C] via-[#C9942D] to-[#DFB36C] text-[#140E07] shadow-xs'
                  : 'text-[#8C7E72] hover:text-[#1C1917]'
              ]"
              title="切换为暗夜侦探书房风格"
            >
              <Moon class="w-3 h-3" />
              <span class="hidden md:inline">暗夜</span>
            </button>
          </div>

          <button
            @click="handleToggleAudio"
            :class="[
              'p-1.5 rounded transition cursor-pointer',
              themeMode === 'dark' ? 'text-[#AFA49A] hover:text-[#F3EFEA]' : 'text-[#786B60] hover:text-[#1C1917]'
            ]"
            :title="isMuted ? '开启声景' : '静音'"
          >
            <VolumeX v-if="isMuted" class="w-4 h-4 opacity-50" />
            <Volume2 v-else :class="['w-4 h-4', themeMode === 'dark' ? 'text-[#C9942D]' : 'text-[#8B3A2B]']" />
          </button>
          <button
            @click="onGoHome"
            :class="[
              'p-1.5 rounded transition cursor-pointer',
              themeMode === 'dark' ? 'text-[#AFA49A] hover:text-[#A44A4A]' : 'text-[#786B60] hover:text-[#8B3A2B]'
            ]"
            title="退出案件"
          >
            <LogOut class="w-4 h-4" />
          </button>
        </div>
      </div>
    </header>

    <!-- Main Game Workspace -->
    <main class="relative flex-1 max-w-[1440px] mx-auto w-full p-3 sm:p-4 flex flex-col justify-between overflow-hidden">
      <!-- Global Scene Transition Mask Overlay -->
      <div
        :class="[
          'absolute inset-0 z-40 transition-opacity duration-300 pointer-events-none flex items-center justify-center backdrop-blur-xs',
          isSceneTransitioning
            ? 'opacity-100 bg-[#0C0A09]/85 pointer-events-auto'
            : 'opacity-0 bg-[#0C0A09]/0'
        ]"
      >
        <div
          v-if="isSceneTransitioning"
          class="flex items-center space-x-2.5 text-[#C9942D] font-serif text-xs tracking-wider bg-[#181411]/95 px-4 py-2 rounded-full border border-[#3B3027] shadow-2xl animate-pulse"
        >
          <span class="w-2 h-2 rounded-full bg-[#C9942D]" />
          <span class="text-[#F3EFEA]">正在穿过走廊，进入新区域...</span>
        </div>
      </div>

      <TruthReview
        v-if="isTruthPhase"
        :roomState="roomState"
        :themeMode="themeMode"
        @restart="onRestart"
      />

      <div v-else class="flex flex-col flex-1 space-y-3">
        <!-- Core 2-Column Workspace -->
        <div class="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-3 items-stretch min-h-[520px]">
          <!-- Left Scene Exploration -->
          <div class="lg:col-span-8 xl:col-span-9 flex flex-col">
            <SceneInvestigationView
              :currentSceneId="currentSceneId"
              :discoveredClueIds="roomState.discoveredClueIds"
              :themeMode="themeMode"
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
              :themeMode="themeMode"
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
          :themeMode="themeMode"
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
          :themeMode="themeMode"
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
      :themeMode="themeMode"
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
      :themeMode="themeMode"
      @close="inspectingClue = null"
      @linkSuspect="handleLinkClueToSuspect"
    />

    <VoteModal
      :isOpen="isVoteModalOpen"
      :themeMode="themeMode"
      @close="isVoteModalOpen = false"
      @submitVote="handleSubmitVote"
    />
  </div>
</template>
