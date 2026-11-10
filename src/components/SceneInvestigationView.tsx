import React, { useState } from 'react';
import { SceneId, SCENE_CONFIGS, SceneHotspot, SceneExit } from '../data/sceneData';
import { Clue, SuspectId } from '../types/game';
import { CLUES, SUSPECTS } from '../data/caseData';
import {
  MapPin,
  Compass,
  ArrowRight,
  Eye,
  MessageSquare,
  Sparkles,
  Check,
} from 'lucide-react';

interface SceneInvestigationViewProps {
  currentSceneId: SceneId;
  onSwitchScene: (targetSceneId: SceneId) => void;
  onInspectClue: (clue: Clue) => void;
  onDiscoveredClue: (clueId: string) => void;
  discoveredClueIds: string[];
  onOpenFloorPlan: () => void;
  onSelectSuspect: (suspectId: SuspectId) => void;
  themeMode?: 'dark' | 'light';
}

export const SceneInvestigationView: React.FC<SceneInvestigationViewProps> = ({
  currentSceneId,
  onSwitchScene,
  onInspectClue,
  onDiscoveredClue,
  discoveredClueIds,
  onOpenFloorPlan,
  onSelectSuspect,
  themeMode = 'dark',
}) => {
  const [hoveredHotspotId, setHoveredHotspotId] = useState<string | null>(null);
  const [hoveredExitId, setHoveredExitId] = useState<string | null>(null);
  const [inspectMessage, setInspectMessage] = useState<string | null>(null);

  const isDark = themeMode === 'dark';
  const sceneConfig = SCENE_CONFIGS[currentSceneId] || SCENE_CONFIGS['gallery-hall'];

  const handleHotspotClick = (hs: SceneHotspot) => {
    if (hs.type === 'clue' && hs.clueId) {
      onDiscoveredClue(hs.clueId);
      const clue = CLUES.find((c) => c.id === hs.clueId);
      if (clue) {
        onInspectClue(clue);
      }
    } else if (hs.type === 'exit' && hs.targetSceneId) {
      onSwitchScene(hs.targetSceneId);
    } else if (hs.type === 'npc' && hs.npcId) {
      onSelectSuspect(hs.npcId);
      setInspectMessage(`已将提问焦点对准【${SUSPECTS.find((s) => s.id === hs.npcId)?.name}】`);
      setTimeout(() => setInspectMessage(null), 3000);
    } else if (hs.type === 'inspect') {
      setInspectMessage(`【现场物证】${hs.description}${hs.detail ? ' ' + hs.detail : ''}`);
      setTimeout(() => setInspectMessage(null), 4000);
    }
  };

  return (
    <div
      className={`relative w-full h-full min-h-[480px] lg:min-h-[580px] backdrop-blur-md rounded-2xl overflow-hidden border transition-colors duration-300 flex flex-col select-none ring-1 ${
        isDark
          ? 'bg-[#181411]/85 border-[#3B3027] shadow-[0_25px_60px_-15px_rgba(0,0,0,0.95),0_12px_28px_-6px_rgba(0,0,0,0.8)] ring-black/40 text-[#F3EFEA]'
          : 'bg-white/95 border-[#EBE4DC] shadow-[0_20px_50px_-10px_rgba(0,0,0,0.08)] ring-stone-200/50 text-[#1C1917]'
      }`}
    >
      {/* Top Left Location & Map Trigger (Minimalist, quiet) */}
      <div className="absolute top-3 left-3 z-20 pointer-events-auto">
        <button
          onClick={onOpenFloorPlan}
          className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg border backdrop-blur-md text-xs font-serif transition cursor-pointer shadow-md ${
            isDark
              ? 'bg-[#0C0A09]/85 hover:bg-[#181411] border-[#3B3027] hover:border-[#C9942D]/60 text-[#AFA49A] hover:text-[#F3EFEA]'
              : 'bg-white/95 hover:bg-[#FAF7F2] border-[#E0D5C7] hover:border-[#8B3A2B] text-[#5C4F44] hover:text-[#1C1917]'
          }`}
          title="点击查看画廊建筑平面图"
        >
          <MapPin className={`w-3.5 h-3.5 ${isDark ? 'text-[#C9942D]' : 'text-[#8B3A2B]'}`} />
          <span className={`font-bold ${isDark ? 'text-[#F3EFEA]' : 'text-[#1C1917]'}`}>
            {sceneConfig.title}
          </span>
          {sceneConfig.isCrimeScene && (
            <span
              className={`text-[10px] font-mono ml-1 font-bold ${
                isDark ? 'text-[#A44A4A]' : 'text-[#8B3A2B]'
              }`}
            >
              [案发现场]
            </span>
          )}
          <span className={`text-[10px] font-sans ml-1 ${isDark ? 'text-[#8E8378]' : 'text-[#8C7E72]'}`}>
            · 平面图
          </span>
        </button>
      </div>

      {/* Main Scene Image Canvas */}
      <div className="relative flex-1 w-full h-full overflow-hidden bg-[#0C0A09]">
        <img
          key={sceneConfig.id}
          src={sceneConfig.image}
          alt={sceneConfig.title}
          className="w-full h-full object-cover object-center filter brightness-95 contrast-105"
        />

        {/* Cinematic Vignette */}
        <div className="absolute inset-0 bg-gradient-to-t from-[#0C0A09]/90 via-transparent to-[#0C0A09]/40 pointer-events-none" />
        <div className="absolute inset-0 shadow-[inset_0_0_100px_rgba(12,10,9,0.85)] pointer-events-none" />

        {/* 1. Hotspots: Refined, restrained, high-fidelity pins */}
        {sceneConfig.hotspots.map((hs) => {
          const isDiscovered = hs.clueId ? discoveredClueIds.includes(hs.clueId) : false;
          const isHovered = hoveredHotspotId === hs.id;

          return (
            <div
              key={hs.id}
              style={{ left: `${hs.x}%`, top: `${hs.y}%` }}
              className="absolute -translate-x-1/2 -translate-y-1/2 z-20 group"
              onMouseEnter={() => setHoveredHotspotId(hs.id)}
              onMouseLeave={() => setHoveredHotspotId(null)}
            >
              <button
                onClick={() => handleHotspotClick(hs)}
                className="relative flex items-center justify-center cursor-pointer p-1.5 focus:outline-none"
                aria-label={hs.label}
              >
                {/* Gold pulse ONLY for undiscovered key clues */}
                {hs.type === 'clue' && !isDiscovered && (
                  <span className="absolute w-6 h-6 rounded-full bg-[#C9942D]/35 animate-ping pointer-events-none" />
                )}

                {/* Pin Head */}
                <span
                  className={`w-5 h-5 rounded-full flex items-center justify-center border transition-all duration-200 shadow-md backdrop-blur-xs ${
                    isDiscovered
                      ? 'bg-[#181411]/90 border-[#3B3027] text-[#AFA49A] hover:scale-110'
                      : hs.type === 'clue'
                      ? 'bg-[#C9942D]/20 border-[#C9942D] text-[#C9942D] hover:scale-125 hover:bg-[#C9942D]/40'
                      : hs.type === 'npc'
                      ? 'bg-[#181411]/90 border-[#3B3027] text-[#F3EFEA] hover:scale-110 hover:border-[#C9942D]/70'
                      : 'bg-[#181411]/80 border-[#3B3027] text-[#AFA49A] hover:scale-110 hover:border-[#524135]'
                  }`}
                >
                  {isDiscovered ? (
                    <Check className="w-3 h-3 text-emerald-400" />
                  ) : hs.type === 'clue' ? (
                    <span className="w-1.5 h-1.5 rounded-full bg-[#C9942D]" />
                  ) : hs.type === 'npc' ? (
                    <MessageSquare className="w-2.5 h-2.5 text-[#C9942D]" />
                  ) : (
                    <span className="w-1 h-1 rounded-full bg-[#AFA49A]" />
                  )}
                </span>
              </button>

              {/* Quiet, sharp warm charcoal floating tag */}
              <div
                className={`absolute bottom-full left-1/2 -translate-x-1/2 mb-1.5 w-52 p-2 rounded-lg bg-[#181411]/95 border border-[#3B3027] shadow-xl backdrop-blur-md text-xs font-serif transition-all duration-150 pointer-events-none z-30 ${
                  isHovered
                    ? 'opacity-100 translate-y-0 scale-100'
                    : 'opacity-0 translate-y-1 scale-95 pointer-events-none'
                }`}
              >
                <div className="flex items-center justify-between mb-0.5">
                  <span className="font-bold text-[#F3EFEA] text-xs">{hs.label}</span>
                  <span className="text-[10px] text-[#C9942D] font-mono">
                    {isDiscovered ? '已记录' : hs.type === 'clue' ? '线索' : '现场'}
                  </span>
                </div>
                <p className="text-[#AFA49A] text-[11px] leading-snug line-clamp-2">
                  {hs.description}
                </p>
              </div>
            </div>
          );
        })}

        {/* 2. Scene Exits: Subtle, architectural doorway cues (not loud pill buttons) */}
        {sceneConfig.exits.map((exit) => {
          const isHovered = hoveredExitId === exit.id;

          return (
            <div
              key={exit.id}
              style={{ left: `${exit.x}%`, top: `${exit.y}%` }}
              className="absolute -translate-x-1/2 -translate-y-1/2 z-20 group"
              onMouseEnter={() => setHoveredExitId(exit.id)}
              onMouseLeave={() => setHoveredExitId(null)}
            >
              <button
                onClick={() => onSwitchScene(exit.targetSceneId)}
                className={`group/exit flex items-center space-x-1.5 px-3 py-1.5 rounded-lg border shadow-lg backdrop-blur-md transition-all duration-150 cursor-pointer text-xs font-serif ${
                  isDark
                    ? 'bg-[#130F0D]/90 hover:bg-[#251D17] border-[#3B3027] hover:border-[#C9942D]/70 text-[#DCD4CA] hover:text-[#F3EFEA]'
                    : 'bg-white/95 hover:bg-[#FAF7F2] border-[#E0D5C7] hover:border-[#8B3A2B] text-[#1C1917]'
                }`}
              >
                <span className="font-bold">{exit.label}</span>
                <ArrowRight className={`w-3 h-3 group-hover/exit:translate-x-0.5 transition ${
                  isDark ? 'text-[#C9942D]' : 'text-[#8B3A2B]'
                }`} />
              </button>

              {exit.description && (
                <div
                  className={`absolute top-full left-1/2 -translate-x-1/2 mt-1 w-44 p-2 rounded-lg border text-[10px] font-serif shadow-lg pointer-events-none transition-all duration-150 z-30 ${
                    isDark
                      ? 'bg-[#181411]/95 border-[#3B3027] text-[#AFA49A]'
                      : 'bg-white/95 border-[#E0D5C7] text-[#5C4F44]'
                  } ${
                    isHovered ? 'opacity-100 scale-100' : 'opacity-0 scale-95 pointer-events-none'
                  }`}
                >
                  {exit.description}
                </div>
              )}
            </div>
          );
        })}

        {/* 3. On-Screen Inspection Pop Toast */}
        {inspectMessage && (
          <div className="absolute bottom-10 left-1/2 -translate-x-1/2 z-30 max-w-md w-full px-4 animate-fadeIn">
            <div
              className={`p-2.5 rounded-lg border text-xs font-serif shadow-2xl backdrop-blur-md flex items-start space-x-2 ${
                isDark
                  ? 'bg-[#181411]/95 border-[#3B3027] text-[#F3EFEA]'
                  : 'bg-white/95 border-[#E0D5C7] text-[#1C1917]'
              }`}
            >
              <Sparkles className={`w-3.5 h-3.5 shrink-0 mt-0.5 ${
                isDark ? 'text-[#C9942D]' : 'text-[#8B3A2B]'
              }`} />
              <span>{inspectMessage}</span>
            </div>
          </div>
        )}
      </div>

      {/* Bottom Quiet Caption Strip */}
      <div
        className={`backdrop-blur-md px-4 py-2 border-t flex items-center justify-between text-xs font-serif transition-colors ${
          isDark
            ? 'bg-[#130F0D]/90 border-[#3B3027] text-[#AFA49A]'
            : 'bg-[#FAF7F2]/95 border-[#E8DFD5] text-[#5C4F44]'
        }`}
      >
        <span className="truncate pr-2 font-medium">
          {sceneConfig.ambientDescription}
        </span>
        <span className={`shrink-0 font-mono text-[10px] ${
          isDark ? 'text-[#8E8378]' : 'text-[#8C7E72]'
        }`}>
          点击现场光标勘验
        </span>
      </div>
    </div>
  );
};
