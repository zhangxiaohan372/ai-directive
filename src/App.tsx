/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import {
  GamePhase,
  RoomState,
  SuspectId,
  RoomLocationId,
  Clue,
  Suspect,
} from './types/game';
import { CASE_META, SUSPECTS, CLUES, GALLERY_ROOMS } from './data/caseData';
import { SceneId, SCENE_CONFIGS } from './data/sceneData';
import {
  createInitialRoom,
  advanceGamePhase,
  inspectLocation,
  revealHint,
  submitVote,
  addClueLink,
} from './game/engine';
import { executeMCPTool } from './game/mcp';
import { HomeHero } from './components/HomeHero';
import { HomePortal } from './components/HomePortal';
import { DualPortalEntrance } from './components/DualPortalEntrance';
import { Lobby } from './components/Lobby';
import { SceneInvestigationView } from './components/SceneInvestigationView';
import { InvestigationDrawer } from './components/InvestigationDrawer';
import { DetectiveBottomDock } from './components/DetectiveBottomDock';
import { CaseBoardDrawer } from './components/CaseBoardDrawer';
import { FloorPlanModal } from './components/FloorPlanModal';
import { SuspectDossierModal } from './components/SuspectDossierModal';
import { EvidenceModal3D } from './components/EvidenceModal3D';
import { VoteModal } from './components/VoteModal';
import { TruthReview } from './components/TruthReview';
import { StorySubtitleBar } from './components/StorySubtitleBar';
import { sound } from './utils/audio';
import {
  HelpCircle,
  Vote,
  Volume2,
  VolumeX,
  Users,
  LogOut,
  Clock,
  Layers,
  Sparkles,
  MapPin,
  Compass,
  GitGraph,
  Sun,
  Moon,
} from 'lucide-react';
import { CaseStudio } from './components/CaseStudio/CaseStudio';
import { StudioCaseData } from './components/CaseStudio/types';

type ScreenView = 'HOME' | 'LOBBY' | 'GAME' | 'STUDIO';

export type ThemeMode = 'dark' | 'light';

export default function App() {
  const [currentScreen, setCurrentScreen] = useState<ScreenView>('HOME');
  const [themeMode, setThemeMode] = useState<ThemeMode>(() => {
    const saved = localStorage.getItem('ai_detective_theme');
    return saved === 'light' || saved === 'dark' ? saved : 'dark';
  });

  useEffect(() => {
    document.documentElement.classList.toggle('dark', themeMode === 'dark');
    document.documentElement.setAttribute('data-theme', themeMode);
  }, [themeMode]);

  const handleToggleTheme = () => {
    sound.playPaperRustle();
    setThemeMode((prev) => {
      const next = prev === 'dark' ? 'light' : 'dark';
      localStorage.setItem('ai_detective_theme', next);
      return next;
    });
  };

  const handleSetTheme = (mode: ThemeMode) => {
    sound.playPaperRustle();
    setThemeMode(mode);
    localStorage.setItem('ai_detective_theme', mode);
  };

  const [roomState, setRoomState] = useState<RoomState>(() =>
    createInitialRoom('room_demo', '首席侦探', true)
  );

  // Multi-Scene Management
  const [currentSceneId, setCurrentSceneId] = useState<SceneId>('gallery-hall');
  const [isFloorPlanOpen, setIsFloorPlanOpen] = useState(false);
  const [isSceneTransitioning, setIsSceneTransitioning] = useState(false);
  const [unlockedScenes, setUnlockedScenes] = useState<Record<SceneId, boolean>>({
    'gallery-hall': true,
    'restoration-room': true,
    'office': true,
    'security-room': true,
  });

  const [selectedLocationId, setSelectedLocationId] = useState<RoomLocationId>('main_hall');
  const [selectedSuspectId, setSelectedSuspectId] = useState<SuspectId | null>('lin_lan');
  const [inspectingClue, setInspectingClue] = useState<Clue | null>(null);
  const [selectedDossierSuspect, setSelectedDossierSuspect] = useState<Suspect | null>(null);
  const [isVoteModalOpen, setIsVoteModalOpen] = useState(false);
  const [isCaseBoardOpen, setIsCaseBoardOpen] = useState(false);
  const [isInterrogating, setIsInterrogating] = useState(false);
  const [storySubtitle, setStorySubtitle] = useState<string | null>(null);
  const [clueCountPulse, setClueCountPulse] = useState(false);

  // In-Game Elapsed Timer
  const [elapsedSeconds, setElapsedSeconds] = useState(0);

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (currentScreen === 'GAME' && roomState.phase !== 'TRUTH_REVEAL') {
      timer = setInterval(() => {
        setElapsedSeconds((prev) => prev + 1);
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [currentScreen, roomState.phase]);

  // Handle ?autostart=1 URL parameter for instant testing
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('autostart') === '1') {
      const room = createInitialRoom('room_autostart', '先锋侦探', true);
      const adv = advanceGamePhase(room);
      setRoomState(adv);
      setCurrentScreen('GAME');
    }
  }, []);

  const isTruthPhase = roomState.phase === 'TRUTH_REVEAL';

  // ---------------- ACTION HANDLERS ----------------

  const handleStartSinglePlayer = () => {
    const newRoom = createInitialRoom('room_single', '首席侦探', true);
    setRoomState(newRoom);
    setCurrentSceneId('gallery-hall');
    setSelectedLocationId('main_hall');
    setSelectedSuspectId('lin_lan');
    setCurrentScreen('GAME');
    setStorySubtitle('【新案件】策展人陈默死于反锁的修复室，搜查现场并查清真相！');
  };

  const handleOpenLobby = () => {
    setCurrentScreen('LOBBY');
  };

  const handleCreateRoom = (hostName: string, includeBots: boolean) => {
    const rId = `room_${Date.now().toString(36)}`;
    const newRoom = createInitialRoom(rId, hostName, includeBots);
    setRoomState(newRoom);
  };

  const handleJoinRoom = (roomCode: string, playerName: string) => {
    const newRoom = createInitialRoom(`room_${roomCode.toLowerCase()}`, playerName, true);
    setRoomState(newRoom);
  };

  const handleAddBotPlayer = () => {
    if (roomState.players.length >= 4) return;
    const botNum = roomState.players.filter((p) => p.isBot).length + 1;
    const newBot = {
      id: `bot_${Date.now().toString(36)}`,
      name: `AI协助侦探 ${botNum}号`,
      avatar: 'AI',
      isHost: false,
      isBot: true,
      ready: true,
    };
    setRoomState({
      ...roomState,
      players: [...roomState.players, newBot],
    });
  };

  const [isMuted, setIsMuted] = useState(sound.getIsMuted());

  const handleToggleAudio = () => {
    const muted = sound.toggleMute();
    setIsMuted(muted);
    if (!muted) {
      sound.startAmbientMystery();
    }
  };

  // Switch to a new scene with 300ms fade transition
  const handleSwitchScene = (targetSceneId: SceneId) => {
    if (targetSceneId === currentSceneId || isSceneTransitioning) return;

    setIsSceneTransitioning(true);
    sound.playCameraGlide();

    // Fade out / fade in swap at 150ms midpoint
    setTimeout(() => {
      setCurrentSceneId(targetSceneId);

      const config = SCENE_CONFIGS[targetSceneId];
      setSelectedLocationId(config.legacyLocationId);

      // Auto-focus on present NPC in this room
      if (config.presentNpcIds.length > 0) {
        setSelectedSuspectId(config.presentNpcIds[0]);
      }

      setStorySubtitle(`【移步调查】来到「${config.title}」：${config.subtitle}`);

      // Finish 300ms transition
      setTimeout(() => {
        setIsSceneTransitioning(false);
      }, 150);
    }, 150);
  };

  // Discovers clue from hotspot click
  const handleDiscoverClue = (clueId: string) => {
    if (roomState.discoveredClueIds.includes(clueId)) return;

    sound.playClueFound();
    setClueCountPulse(true);
    setTimeout(() => setClueCountPulse(false), 1200);

    const clueObj = CLUES.find((c) => c.id === clueId);
    const nextState = {
      ...roomState,
      discoveredClueIds: [...roomState.discoveredClueIds, clueId],
    };
    setRoomState(nextState);

    if (clueObj) {
      setInspectingClue(clueObj);
      setStorySubtitle(
        `【现场勘验突破】在「${SCENE_CONFIGS[currentSceneId].title}」提取到关键物证「${clueObj.name}」！`
      );
    }
  };

  const handleRevealHint = () => {
    sound.playHeartbeatTick();
    const { nextState, result } = executeMCPTool(
      'reveal_hint',
      { roomId: roomState.roomId },
      roomState
    );
    setRoomState(nextState);
    if (result && result.hint) {
      setStorySubtitle(`【AI 破案提示】${result.hint}`);
    }
  };

  const handleStartVote = () => {
    sound.playHeartbeatTick();
    setIsVoteModalOpen(true);
  };

  const handleSubmitVote = (suspectId: SuspectId, reason: string) => {
    sound.playClueFound();
    const { nextState } = executeMCPTool(
      'submit_vote',
      { roomId: roomState.roomId, playerId: 'player_host', suspectId, reason },
      roomState
    );
    const finalState = {
      ...nextState,
      phase: 'TRUTH_REVEAL' as GamePhase,
    };
    setRoomState(finalState);
  };

  const handleSendMessageToSuspect = async (question: string) => {
    if (!selectedSuspectId) return;
    setIsInterrogating(true);
    try {
      const { nextState } = executeMCPTool(
        'interrogate_npc',
        { roomId: roomState.roomId, npcId: selectedSuspectId, question },
        roomState
      );
      setRoomState(nextState);
    } finally {
      setIsInterrogating(false);
    }
  };

  const handleLinkClueToSuspect = (clueId: string, suspectId: SuspectId) => {
    const clueObj = CLUES.find((c) => c.id === clueId);
    const suspObj = SUSPECTS.find((s) => s.id === suspectId);
    const note = `关联: ${clueObj?.name} -> ${suspObj?.name}`;
    const nextState = addClueLink(roomState, clueId, suspectId, note);
    setRoomState(nextState);
    setInspectingClue(null);
    setStorySubtitle(`已将物证「${clueObj?.name}」与嫌疑人「${suspObj?.name}」钉在案件板上。`);
  };

  const handleRestartGame = () => {
    const reset = createInitialRoom('room_demo', '首席侦探', true);
    setRoomState(reset);
    setElapsedSeconds(0);
    setCurrentSceneId('gallery-hall');
    setSelectedLocationId('main_hall');
    setSelectedSuspectId('lin_lan');
    setCurrentScreen('HOME');
  };

  const formatTimer = (totalSeconds: number) => {
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const currentSceneConfig = SCENE_CONFIGS[currentSceneId] || SCENE_CONFIGS['gallery-hall'];

  return (
    <div
      className={`min-h-screen flex flex-col font-serif selection:bg-[#A44A4A]/50 selection:text-white transition-colors duration-500 ${
        themeMode === 'dark' ? 'text-[#F3EFEA]' : 'text-[#2C241E]'
      }`}
      style={
        currentScreen === 'GAME'
          ? themeMode === 'dark'
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
              }
          : { backgroundColor: themeMode === 'dark' ? '#0C0A09' : '#F5EFE6' }
      }
    >
      {/* 1. Universal Floating Story Subtitle Banner */}
      <StorySubtitleBar
        message={storySubtitle}
        onDismiss={() => setStorySubtitle(null)}
      />

      {/* 2. Top Nav Bar: Minimalist Warm Charcoal or Light Parchment Status Bar in Game Mode */}
      {currentScreen === 'GAME' && !isTruthPhase && (
        <header
          className={`sticky top-0 z-40 px-4 py-2 backdrop-blur-md border-b transition-colors duration-300 ${
            themeMode === 'dark'
              ? 'bg-[#0C0A09]/92 border-[#3B3027] text-[#F3EFEA]'
              : 'bg-[#FAF7F2]/95 border-[#E8DFD5] text-[#1C1917]'
          }`}
        >
          <div className="max-w-[1440px] mx-auto flex items-center justify-between text-xs font-serif">
            {/* Left: Location */}
            <div className="flex items-center space-x-2">
              <button
                onClick={() => setCurrentScreen('HOME')}
                className={`transition font-medium cursor-pointer ${
                  themeMode === 'dark'
                    ? 'text-[#AFA49A] hover:text-[#F3EFEA]'
                    : 'text-[#786B60] hover:text-[#1C1917]'
                }`}
                title="返回封面"
              >
                午夜画廊
              </button>
              <span className={themeMode === 'dark' ? 'text-[#3B3027]' : 'text-[#D8CFC5]'}>/</span>
              <button
                onClick={() => setIsFloorPlanOpen(true)}
                className={`flex items-center space-x-1 transition cursor-pointer ${
                  themeMode === 'dark'
                    ? 'text-[#D9D1C7] hover:text-[#C9942D]'
                    : 'text-[#5C4F44] hover:text-[#8B3A2B]'
                }`}
                title="查看画廊平面图"
              >
                <MapPin className={`w-3.5 h-3.5 ${themeMode === 'dark' ? 'text-[#C9942D]' : 'text-[#8B3A2B]'}`} />
                <span className={`font-bold ${themeMode === 'dark' ? 'text-[#F3EFEA]' : 'text-[#1C1917]'}`}>
                  {currentSceneConfig.title}
                </span>
              </button>
            </div>

            {/* Middle: Progress & Time */}
            <div className={`flex items-center space-x-3 text-xs font-mono ${
              themeMode === 'dark' ? 'text-[#AFA49A]' : 'text-[#786B60]'
            }`}>
              <div className="flex items-center space-x-1">
                <span className={`font-sans ${themeMode === 'dark' ? 'text-[#8E8378]' : 'text-[#8C7E72]'}`}>
                  物证:
                </span>
                <span
                  className={`font-bold transition-all ${
                    clueCountPulse
                      ? themeMode === 'dark'
                        ? 'scale-110 text-[#C9942D]'
                        : 'scale-110 text-[#8B3A2B]'
                      : themeMode === 'dark'
                      ? 'text-[#F3EFEA]'
                      : 'text-[#1C1917]'
                  }`}
                >
                  {roomState.discoveredClueIds.length}/8
                </span>
              </div>
              <span className={themeMode === 'dark' ? 'text-[#3B3027]' : 'text-[#D8CFC5]'}>·</span>
              <div className="flex items-center space-x-1">
                <Clock className={`w-3.5 h-3.5 ${themeMode === 'dark' ? 'text-[#8E8378]' : 'text-[#8C7E72]'}`} />
                <span className={themeMode === 'dark' ? 'text-[#AFA49A]' : 'text-[#1C1917]'}>
                  {formatTimer(elapsedSeconds)}
                </span>
              </div>
            </div>

            {/* Right: Studio Trace, Theme Switcher, Sound & Exit */}
            <div className="flex items-center space-x-2">
              <button
                onClick={() => setCurrentScreen('STUDIO')}
                className={`flex items-center space-x-1.5 px-2.5 py-1 rounded border transition text-[11px] font-sans cursor-pointer active:scale-95 shadow-sm ${
                  themeMode === 'dark'
                    ? 'bg-[#181411] hover:bg-stone-900 text-[#C9942D] border-[#3B3027] hover:border-[#C9942D]/50'
                    : 'bg-white hover:bg-[#F2ECE4] text-[#8B3A2B] border-[#E0D5C7]'
                }`}
                title="查看该案件在 LangGraph 创作工坊中的逻辑验证报告与状态机"
                aria-label="创作工坊逻辑图谱"
              >
                <GitGraph className={`w-3 h-3 ${themeMode === 'dark' ? 'text-[#C9942D]' : 'text-[#8B3A2B]'}`} />
                <span className="hidden sm:inline">工坊逻辑图谱</span>
                <span className={`text-[10px] px-1 rounded font-mono ${
                  themeMode === 'dark'
                    ? 'bg-emerald-950/80 text-emerald-400 border border-emerald-600/30'
                    : 'bg-emerald-50 text-emerald-700 border border-emerald-300'
                }`}>
                  100%
                </span>
              </button>

              {/* In-Game Global Theme Switcher */}
              <div
                className={`p-0.5 rounded-full border flex items-center gap-0.5 transition-all shadow-xs ${
                  themeMode === 'dark'
                    ? 'bg-[#18130E] border-[#3E2D1E]'
                    : 'bg-white border-[#E0D5C7]'
                }`}
                title="案件游玩全局主题切换：暗夜书房 / 白昼手稿"
              >
                <button
                  onClick={() => {
                    if (themeMode === 'dark') handleToggleTheme();
                  }}
                  className={`px-2 py-0.5 rounded-full flex items-center gap-1 transition text-[11px] font-serif font-bold cursor-pointer ${
                    themeMode === 'light'
                      ? 'bg-[#8B3A2B] text-white shadow-xs'
                      : 'text-[#8C765E] hover:text-[#E5C384]'
                  }`}
                  title="切换为白昼手稿羊皮纸风格"
                >
                  <Sun className="w-3 h-3" />
                  <span className="hidden md:inline">白昼</span>
                </button>
                <button
                  onClick={() => {
                    if (themeMode === 'light') handleToggleTheme();
                  }}
                  className={`px-2 py-0.5 rounded-full flex items-center gap-1 transition text-[11px] font-serif font-bold cursor-pointer ${
                    themeMode === 'dark'
                      ? 'bg-gradient-to-r from-[#DFB36C] via-[#C9942D] to-[#DFB36C] text-[#140E07] shadow-xs'
                      : 'text-[#8C7E72] hover:text-[#1C1917]'
                  }`}
                  title="切换为暗夜侦探书房风格"
                >
                  <Moon className="w-3 h-3" />
                  <span className="hidden md:inline">暗夜</span>
                </button>
              </div>

              <button
                onClick={handleToggleAudio}
                className={`p-1.5 rounded transition cursor-pointer ${
                  themeMode === 'dark'
                    ? 'text-[#AFA49A] hover:text-[#F3EFEA]'
                    : 'text-[#786B60] hover:text-[#1C1917]'
                }`}
                title={isMuted ? '开启声景' : '静音'}
              >
                {isMuted ? (
                  <VolumeX className="w-4 h-4 opacity-50" />
                ) : (
                  <Volume2 className={`w-4 h-4 ${themeMode === 'dark' ? 'text-[#C9942D]' : 'text-[#8B3A2B]'}`} />
                )}
              </button>
              <button
                onClick={() => setCurrentScreen('HOME')}
                className={`p-1.5 rounded transition cursor-pointer ${
                  themeMode === 'dark'
                    ? 'text-[#AFA49A] hover:text-[#A44A4A]'
                    : 'text-[#786B60] hover:text-[#8B3A2B]'
                }`}
                title="退出案件"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          </div>
        </header>
      )}

      {/* Standard Header for LOBBY */}
      {currentScreen === 'LOBBY' && (
        <header className="bg-[#0C0A09]/92 border-b border-[#3B3027] sticky top-0 z-40 px-4 py-2 backdrop-blur-md">
          <div className="max-w-[1440px] mx-auto flex items-center justify-between">
            <button
              onClick={() => setCurrentScreen('HOME')}
              className="flex items-center space-x-2 text-left group cursor-pointer"
            >
              <div className="w-7 h-7 rounded-lg bg-[#241B15] text-[#C9942D] border border-[#3B3027] flex items-center justify-center font-bold text-xs">
                密
              </div>
              <span className="font-bold text-[#F3EFEA] text-sm">迷雾剧场 · 午夜画廊</span>
            </button>
            <button
              onClick={() => setCurrentScreen('HOME')}
              className="text-xs text-[#AFA49A] hover:text-[#F3EFEA] transition cursor-pointer"
            >
              返回封面
            </button>
          </div>
        </header>
      )}

      {/* Main Content Body */}
      {currentScreen === 'HOME' ? (
        <HomePortal
          onStartSinglePlayer={handleStartSinglePlayer}
          onOpenLobby={handleOpenLobby}
          onOpenStudio={() => setCurrentScreen('STUDIO')}
          themeMode={themeMode}
          onToggleTheme={handleToggleTheme}
        />
      ) : currentScreen === 'STUDIO' ? (
        <CaseStudio
          onPlayCase={(caseData: StudioCaseData) => {
            const nextRoom = createInitialRoom('room_studio_play', '首席侦探', true);
            setRoomState(nextRoom);
            setElapsedSeconds(0);
            setCurrentSceneId('gallery-hall');
            setSelectedLocationId('main_hall');
            setSelectedSuspectId('lin_lan');
            setCurrentScreen('GAME');
            setStorySubtitle(`已成功载入工坊案件「${caseData.title}」，所有确定性规则与物证网校验全绿通过！`);
          }}
          onBackToGame={() => setCurrentScreen('GAME')}
          onBackToPortal={() => setCurrentScreen('HOME')}
          themeMode={themeMode}
          onToggleTheme={handleToggleTheme}
        />
      ) : currentScreen === 'LOBBY' ? (
        <main className="flex-1 max-w-5xl mx-auto w-full p-4 flex items-center justify-center">
          <Lobby
            roomId={roomState.roomId}
            roomCode={roomState.roomCode}
            players={roomState.players}
            isHost={true}
            onStartGame={() => setCurrentScreen('GAME')}
            onCreateRoom={handleCreateRoom}
            onJoinRoom={handleJoinRoom}
            onBackToHome={() => setCurrentScreen('HOME')}
            onAddBotPlayer={handleAddBotPlayer}
          />
        </main>
      ) : (
        /* GAME VIEW */
        <main className="relative flex-1 max-w-[1440px] mx-auto w-full p-3 sm:p-4 flex flex-col justify-between overflow-hidden">
          {/* Global Scene Transition Mask Overlay */}
          <div
            className={`absolute inset-0 z-40 transition-opacity duration-300 pointer-events-none flex items-center justify-center backdrop-blur-xs ${
              isSceneTransitioning
                ? 'opacity-100 bg-[#0C0A09]/85 pointer-events-auto'
                : 'opacity-0 bg-[#0C0A09]/0'
            }`}
          >
            {isSceneTransitioning && (
              <div className="flex items-center space-x-2.5 text-[#C9942D] font-serif text-xs tracking-wider bg-[#181411]/95 px-4 py-2 rounded-full border border-[#3B3027] shadow-2xl animate-pulse">
                <span className="w-2 h-2 rounded-full bg-[#C9942D]" />
                <span className="text-[#F3EFEA]">正在穿过走廊，进入新区域...</span>
              </div>
            )}
          </div>

          {isTruthPhase ? (
            <TruthReview roomState={roomState} onRestart={handleRestartGame} themeMode={themeMode} />
          ) : (
            <div className="flex flex-col flex-1 space-y-3">
              {/* Core 2-Column Workspace: Left ~75% Scene Dominance, Right ~25% Compact Dossier Slate */}
              <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-3 items-stretch min-h-[520px]">
                {/* Left Scene Exploration (Dominant visual protagonist) */}
                <div className="lg:col-span-8 xl:col-span-9 flex flex-col">
                  <SceneInvestigationView
                    currentSceneId={currentSceneId}
                    onSwitchScene={handleSwitchScene}
                    onInspectClue={(clue) => setInspectingClue(clue)}
                    onDiscoveredClue={handleDiscoverClue}
                    discoveredClueIds={roomState.discoveredClueIds}
                    onOpenFloorPlan={() => setIsFloorPlanOpen(true)}
                    onSelectSuspect={(sId) => setSelectedSuspectId(sId)}
                    themeMode={themeMode}
                  />
                </div>

                {/* Right Compact Dossier & Interrogation Slate */}
                <div className="lg:col-span-4 xl:col-span-3 flex flex-col">
                  <InvestigationDrawer
                    suspectId={selectedSuspectId}
                    onSelectSuspect={(sId) => setSelectedSuspectId(sId)}
                    chatHistory={roomState.chatHistory}
                    discoveredClueIds={roomState.discoveredClueIds}
                    onSendMessage={handleSendMessageToSuspect}
                    isLoading={isInterrogating}
                    onOpenDossier={(suspect) => setSelectedDossierSuspect(suspect)}
                    currentSceneId={currentSceneId}
                    themeMode={themeMode}
                  />
                </div>
              </div>

              {/* Single Unified Ultra-Slim Detective Dock (Evidence + Suspects + Case Board Toggle) */}
              <DetectiveBottomDock
                selectedSuspectId={selectedSuspectId}
                onSelectSuspect={(sId) => setSelectedSuspectId(sId)}
                onOpenDossier={(suspect) => setSelectedDossierSuspect(suspect)}
                discoveredClueIds={roomState.discoveredClueIds}
                onInspectClue={(clue) => setInspectingClue(clue)}
                onToggleCaseBoard={() => setIsCaseBoardOpen(!isCaseBoardOpen)}
                isCaseBoardOpen={isCaseBoardOpen}
                onStartVote={handleStartVote}
                currentSceneId={currentSceneId}
                themeMode={themeMode}
                interrogatedSuspectIds={
                  roomState.chatHistory
                    .filter((m) => m.suspectId && m.senderRole === 'player')
                    .map((m) => m.suspectId!)
                }
              />

              {/* Full Case Board Corkboard Modal (Triggered on demand) */}
              <CaseBoardDrawer
                isOpen={isCaseBoardOpen}
                onToggle={() => setIsCaseBoardOpen(!isCaseBoardOpen)}
                discoveredClueIds={roomState.discoveredClueIds}
                clueLinks={roomState.clueLinks}
                onInspectClue={(clue) => setInspectingClue(clue)}
                onRemoveClueLink={(clueId, targetId) => {
                  const next = addClueLink(roomState, clueId, targetId);
                  setRoomState(next);
                }}
                onAddClueLink={(clueId, targetId, note) => {
                  const next = addClueLink(roomState, clueId, targetId, note);
                  setRoomState(next);
                }}
                playerNotes={roomState.playerNotes['player_host'] || ''}
                onSaveNotes={(notes) => {
                  setRoomState({
                    ...roomState,
                    playerNotes: {
                      ...roomState.playerNotes,
                      player_host: notes,
                    },
                  });
                }}
                themeMode={themeMode}
                onToggleTheme={handleToggleTheme}
              />
            </div>
          )}
        </main>
      )}

      {/* 3. Modals */}
      {/* 2D Architectural Floorplan Blueprint Map */}
      <FloorPlanModal
        isOpen={isFloorPlanOpen}
        onClose={() => setIsFloorPlanOpen(false)}
        currentSceneId={currentSceneId}
        onSelectScene={handleSwitchScene}
        discoveredClueIds={roomState.discoveredClueIds}
        unlockedScenes={unlockedScenes}
        themeMode={themeMode}
      />

      {/* Suspect Full Dossier Modal */}
      <SuspectDossierModal
        suspect={selectedDossierSuspect}
        onClose={() => setSelectedDossierSuspect(null)}
        onSelectForInvestigation={(sId) => {
          setSelectedSuspectId(sId);
          setSelectedDossierSuspect(null);
        }}
      />

      {/* 3D Rotatable Evidence Modal */}
      <EvidenceModal3D
        clue={inspectingClue}
        onClose={() => setInspectingClue(null)}
        onLinkSuspect={handleLinkClueToSuspect}
        themeMode={themeMode}
      />

      {/* Voting Modal */}
      <VoteModal
        isOpen={isVoteModalOpen}
        onClose={() => setIsVoteModalOpen(false)}
        onSubmitVote={handleSubmitVote}
        themeMode={themeMode}
      />
    </div>
  );
}
