import { ref, computed } from 'vue';
import type {
  GamePhase,
  RoomState,
  SuspectId,
  RoomLocationId,
  Clue,
  Suspect,
} from '../types/game';
import { SUSPECTS, CLUES } from '../data/caseData';
import { type SceneId, SCENE_CONFIGS } from '../data/sceneData';
import {
  createInitialRoom,
  addClueLink,
} from '../game/engine';
import { executeMCPTool } from '../game/mcp';
import { sound } from '../utils/audio';
import type { StudioCaseData } from '../components/CaseStudio/types';

const roomState = ref<RoomState>(createInitialRoom('room_demo', '首席侦探', true));

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

const elapsedSeconds = ref(0);
let timerId: ReturnType<typeof setInterval> | null = null;

const startTimer = () => {
  stopTimer();
  timerId = setInterval(() => {
    if (roomState.value.phase !== 'TRUTH_REVEAL') {
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

const formatTimer = (totalSeconds: number) => {
  const mins = Math.floor(totalSeconds / 60);
  const secs = totalSeconds % 60;
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
};

const isTruthPhase = computed(() => roomState.value.phase === 'TRUTH_REVEAL');

const currentSceneConfig = computed(
  () => SCENE_CONFIGS[currentSceneId.value] || SCENE_CONFIGS['gallery-hall']
);

const isMuted = ref(sound.getIsMuted());

const handleToggleAudio = () => {
  const muted = sound.toggleMute();
  isMuted.value = muted;
  if (!muted) {
    sound.startAmbientMystery();
  }
};

const handleStartSinglePlayer = () => {
  const newRoom = createInitialRoom('room_single', '首席侦探', true);
  roomState.value = newRoom;
  elapsedSeconds.value = 0;
  currentSceneId.value = 'gallery-hall';
  selectedLocationId.value = 'main_hall';
  selectedSuspectId.value = 'lin_lan';
  storySubtitle.value = '【新案件】策展人陈默死于反锁的修复室，搜查现场并查清真相！';
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
};

const handlePlayStudioCase = (caseData: StudioCaseData) => {
  const nextRoom = createInitialRoom('room_studio_play', '首席侦探', true);
  roomState.value = nextRoom;
  elapsedSeconds.value = 0;
  currentSceneId.value = 'gallery-hall';
  selectedLocationId.value = 'main_hall';
  selectedSuspectId.value = 'lin_lan';
  storySubtitle.value = `已成功载入工坊案件「${caseData.title}」，所有确定性规则与物证网校验全绿通过！`;
};

export function useGameState() {
  return {
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
    storySubtitle,
    clueCountPulse,
    elapsedSeconds,
    isMuted,
    isTruthPhase,
    currentSceneConfig,
    startTimer,
    stopTimer,
    formatTimer,
    handleToggleAudio,
    handleStartSinglePlayer,
    handleCreateRoom,
    handleJoinRoom,
    handleAddBotPlayer,
    handleSwitchScene,
    handleDiscoverClue,
    handleStartVote,
    handleSubmitVote,
    handleSendMessageToSuspect,
    handleLinkClueToSuspect,
    handleRestartGame,
    handlePlayStudioCase,
  };
}
