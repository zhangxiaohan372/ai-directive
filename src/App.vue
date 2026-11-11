<script setup lang="ts">
import { ref, computed, watch, onMounted, onUnmounted } from 'vue';
import type {
  GamePhase,
  RoomState,
  SuspectId,
  RoomLocationId,
  Clue,
  Suspect,
} from './types/game';
import { CASE_META, SUSPECTS, CLUES, GALLERY_ROOMS } from './data/caseData';
import { type SceneId, SCENE_CONFIGS } from './data/sceneData';
import {
  createInitialRoom,
  advanceGamePhase,
  addClueLink,
} from './game/engine';
import { executeMCPTool } from './game/mcp';
import HomePortal from './components/HomePortal.vue';
import Lobby from './components/Lobby.vue';
import SceneInvestigationView from './components/SceneInvestigationView.vue';
import InvestigationDrawer from './components/InvestigationDrawer.vue';
import DetectiveBottomDock from './components/DetectiveBottomDock.vue';
import CaseBoardDrawer from './components/CaseBoardDrawer.vue';
import FloorPlanModal from './components/FloorPlanModal.vue';
import SuspectDossierModal from './components/SuspectDossierModal.vue';
import EvidenceModal3D from './components/EvidenceModal3D.vue';
import VoteModal from './components/VoteModal.vue';
import TruthReview from './components/TruthReview.vue';
import StorySubtitleBar from './components/StorySubtitleBar.vue';
import CaseStudio from './components/CaseStudio/CaseStudio.vue';
import type { StudioCaseData } from './components/CaseStudio/types';
import { sound } from './utils/audio';
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

type ScreenView = 'HOME' | 'LOBBY' | 'GAME' | 'STUDIO';
export type ThemeMode = 'dark' | 'light';

const currentScreen = ref<ScreenView>('HOME');

const savedTheme = localStorage.getItem('ai_detective_theme');
const themeMode = ref<ThemeMode>(
  savedTheme === 'light' || savedTheme === 'dark' ? savedTheme : 'dark'
);

watch(
  themeMode,
  (newMode) => {
    document.documentElement.classList.toggle('dark', newMode === 'dark');
    document.documentElement.setAttribute('data-theme', newMode);
    localStorage.setItem('ai_detective_theme', newMode);
  },
  { immediate: true }
);

const handleToggleTheme = () => {
  sound.playPaperRustle();
  themeMode.value = themeMode.value === 'dark' ? 'light' : 'dark';
};

const roomState = ref<RoomState>(createInitialRoom('room_demo', '首席侦探', true));

// Multi-Scene Management
const currentSceneId = ref<SceneId>('gallery-hall');
const isFloorPlanOpen = ref(false);
const isSceneTransitioning = ref(false);
const unlockedScenes = ref<Record<SceneId, boolean>>({
  'gallery-hall': true,
  'restoration-room': true,
  office: true,
  'security-room': true,
});

const selectedLocationId = ref<RoomLocationId>('main_hall');
const selectedSuspectId = ref<SuspectId | null>('lin_lan');
const inspectingClue = ref<Clue | null>(null);
const selectedDossierSuspect = ref<Suspect | null>(null);
const isVoteModalOpen = ref(false);
const isCaseBoardOpen = ref(false);
const isInterrogating = ref(false);
const storySubtitle = ref<string | null>(null);
const clueCountPulse = ref(false);

// In-Game Elapsed Timer
const elapsedSeconds = ref(0);
let timerId: ReturnType<typeof setInterval> | null = null;

const startTimer = () => {
  stopTimer();
  timerId = setInterval(() => {
    if (currentScreen.value === 'GAME' && roomState.value.phase !== 'TRUTH_REVEAL') {
      elapsedSeconds.value++;
    }
  }, 1000);
};

const stopTimer = () => {
  if (timerId) {
    clearInterval(timerId);
    timerId = null;
  }
};

watch([currentScreen, () => roomState.value.phase], () => {
  if (currentScreen.value === 'GAME' && roomState.value.phase !== 'TRUTH_REVEAL') {
    if (!timerId) startTimer();
  } else {
    stopTimer();
  }
});

onMounted(() => {
  const params = new URLSearchParams(window.location.search);
  if (params.get('autostart') === '1') {
    const room = createInitialRoom('room_autostart', '先锋侦探', true);
    const adv = advanceGamePhase(room);
    roomState.value = adv;
    currentScreen.value = 'GAME';
  }
});

onUnmounted(() => {
  stopTimer();
});

const isTruthPhase = computed(() => roomState.value.phase === 'TRUTH_REVEAL');

// Action Handlers
const handleStartSinglePlayer = () => {
  const newRoom = createInitialRoom('room_single', '首席侦探', true);
  roomState.value = newRoom;
  currentSceneId.value = 'gallery-hall';
  selectedLocationId.value = 'main_hall';
  selectedSuspectId.value = 'lin_lan';
  currentScreen.value = 'GAME';
  storySubtitle.value = '【新案件】策展人陈默死于反锁的修复室，搜查现场并查清真相！';
};

const handleOpenLobby = () => {
  currentScreen.value = 'LOBBY';
};

const handleCreateRoom = (hostName: string, includeBots: boolean) => {
  const rId = `room_${Date.now().toString(36)}`;
  roomState.value = createInitialRoom(rId, hostName, includeBots);
};

const handleJoinRoom = (roomCode: string, playerName: string) => {
  roomState.value = createInitialRoom(`room_${roomCode.toLowerCase()}`, playerName, true);
};

const handleAddBotPlayer = () => {
  if (roomState.value.players.length >= 4) return;
  const botNum = roomState.value.players.filter((p) => p.isBot).length + 1;
  const newBot = {
    id: `bot_${Date.now().toString(36)}`,
    name: `AI协助侦探 ${botNum}号`,
    avatar: 'AI',
    isHost: false,
    isBot: true,
    ready: true,
  };
  roomState.value = {
    ...roomState.value,
    players: [...roomState.value.players, newBot],
  };
};

const isMuted = ref(sound.getIsMuted());

const handleToggleAudio = () => {
  const muted = sound.toggleMute();
  isMuted.value = muted;
  if (!muted) {
    sound.startAmbientMystery();
  }
};

const handleSwitchScene = (targetSceneId: SceneId) => {
  if (targetSceneId === currentSceneId.value || isSceneTransitioning.value) return;

  isSceneTransitioning.value = true;
  sound.playCameraGlide();

  setTimeout(() => {
    currentSceneId.value = targetSceneId;

    const config = SCENE_CONFIGS[targetSceneId];
    selectedLocationId.value = config.legacyLocationId;

    if (config.presentNpcIds.length > 0) {
      selectedSuspectId.value = config.presentNpcIds[0];
    }

    storySubtitle.value = `【移步调查】来到「${config.title}」：${config.subtitle}`;

    setTimeout(() => {
      isSceneTransitioning.value = false;
    }, 150);
  }, 150);
};

const handleDiscoverClue = (clueId: string) => {
  if (roomState.value.discoveredClueIds.includes(clueId)) return;

  sound.playClueFound();
  clueCountPulse.value = true;
  setTimeout(() => (clueCountPulse.value = false), 1200);

  const clueObj = CLUES.find((c) => c.id === clueId);
  roomState.value = {
    ...roomState.value,
    discoveredClueIds: [...roomState.value.discoveredClueIds, clueId],
  };

  if (clueObj) {
    inspectingClue.value = clueObj;
    storySubtitle.value = `【现场勘验突破】在「${SCENE_CONFIGS[currentSceneId.value].title}」提取到关键物证「${clueObj.name}」！`;
  }
};

const handleStartVote = () => {
  sound.playHeartbeatTick();
  isVoteModalOpen.value = true;
};

const handleSubmitVote = (suspectId: SuspectId, reason: string) => {
  sound.playClueFound();
  const { nextState } = executeMCPTool(
    'submit_vote',
    { roomId: roomState.value.roomId, playerId: 'player_host', suspectId, reason },
    roomState.value
  );
  roomState.value = {
    ...nextState,
    phase: 'TRUTH_REVEAL' as GamePhase,
  };
};

const handleSendMessageToSuspect = async (question: string) => {
  if (!selectedSuspectId.value) return;
  isInterrogating.value = true;
  try {
    const { nextState } = executeMCPTool(
      'interrogate_npc',
      { roomId: roomState.value.roomId, npcId: selectedSuspectId.value, question },
      roomState.value
    );
    roomState.value = nextState;
  } finally {
    isInterrogating.value = false;
  }
};

const handleLinkClueToSuspect = (clueId: string, suspectId: SuspectId) => {
  const clueObj = CLUES.find((c) => c.id === clueId);
  const suspObj = SUSPECTS.find((s) => s.id === suspectId);
  const note = `关联: ${clueObj?.name} -> ${suspObj?.name}`;
  roomState.value = addClueLink(roomState.value, clueId, suspectId, note);
  inspectingClue.value = null;
  storySubtitle.value = `已将物证「${clueObj?.name}」与嫌疑人「${suspObj?.name}」钉在案件板上。`;
};

const handleRestartGame = () => {
  roomState.value = createInitialRoom('room_demo', '首席侦探', true);
  elapsedSeconds.value = 0;
  currentSceneId.value = 'gallery-hall';
  selectedLocationId.value = 'main_hall';
  selectedSuspectId.value = 'lin_lan';
  currentScreen.value = 'HOME';
};

const formatTimer = (totalSeconds: number) => {
  const mins = Math.floor(totalSeconds / 60);
  const secs = totalSeconds % 60;
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
};

const currentSceneConfig = computed(
  () => SCENE_CONFIGS[currentSceneId.value] || SCENE_CONFIGS['gallery-hall']
);

const backgroundStyle = computed(() => {
  if (currentScreen.value === 'GAME') {
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
    <!-- 1. Universal Floating Story Subtitle Banner -->
    <StorySubtitleBar
      :message="storySubtitle"
      @dismiss="storySubtitle = null"
    />

    <!-- 2. Top Nav Bar in Game Mode -->
    <header
      v-if="currentScreen === 'GAME' && !isTruthPhase"
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
            @click="currentScreen = 'HOME'"
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
            @click="currentScreen = 'STUDIO'"
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
              @click="if (themeMode === 'dark') handleToggleTheme();"
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
              @click="if (themeMode === 'light') handleToggleTheme();"
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
            @click="currentScreen = 'HOME'"
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

    <!-- Standard Header for LOBBY -->
    <header
      v-if="currentScreen === 'LOBBY'"
      class="bg-[#0C0A09]/92 border-b border-[#3B3027] sticky top-0 z-40 px-4 py-2 backdrop-blur-md"
    >
      <div class="max-w-[1440px] mx-auto flex items-center justify-between">
        <button
          @click="currentScreen = 'HOME'"
          class="flex items-center space-x-2 text-left group cursor-pointer"
        >
          <div class="w-7 h-7 rounded-lg bg-[#241B15] text-[#C9942D] border border-[#3B3027] flex items-center justify-center font-bold text-xs">
            密
          </div>
          <span class="font-bold text-[#F3EFEA] text-sm">迷雾剧场 · 午夜画廊</span>
        </button>
        <button
          @click="currentScreen = 'HOME'"
          class="text-xs text-[#AFA49A] hover:text-[#F3EFEA] transition cursor-pointer"
        >
          返回封面
        </button>
      </div>
    </header>

    <!-- Main Content Body -->
    <HomePortal
      v-if="currentScreen === 'HOME'"
      :themeMode="themeMode"
      @startSinglePlayer="handleStartSinglePlayer"
      @openLobby="handleOpenLobby"
      @openStudio="currentScreen = 'STUDIO'"
      @toggleTheme="handleToggleTheme"
    />

    <CaseStudio
      v-else-if="currentScreen === 'STUDIO'"
      :themeMode="themeMode"
      @playCase="(caseData) => {
        const nextRoom = createInitialRoom('room_studio_play', '首席侦探', true);
        roomState = nextRoom;
        elapsedSeconds = 0;
        currentSceneId = 'gallery-hall';
        selectedLocationId = 'main_hall';
        selectedSuspectId = 'lin_lan';
        currentScreen = 'GAME';
        storySubtitle = `已成功载入工坊案件「${caseData.title}」，所有确定性规则与物证网校验全绿通过！`;
      }"
      @backToGame="currentScreen = 'GAME'"
      @backToPortal="currentScreen = 'HOME'"
      @toggleTheme="handleToggleTheme"
    />

    <main
      v-else-if="currentScreen === 'LOBBY'"
      class="flex-1 max-w-5xl mx-auto w-full p-4 flex items-center justify-center"
    >
      <Lobby
        :roomId="roomState.roomId"
        :roomCode="roomState.roomCode"
        :players="roomState.players"
        :isHost="true"
        @startGame="currentScreen = 'GAME'"
        @createRoom="handleCreateRoom"
        @joinRoom="handleJoinRoom"
        @backToHome="currentScreen = 'HOME'"
        @addBotPlayer="handleAddBotPlayer"
      />
    </main>

    <!-- GAME VIEW -->
    <main
      v-else
      class="relative flex-1 max-w-[1440px] mx-auto w-full p-3 sm:p-4 flex flex-col justify-between overflow-hidden"
    >
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
        @restart="handleRestartGame"
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
          @toggleTheme="handleToggleTheme"
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
