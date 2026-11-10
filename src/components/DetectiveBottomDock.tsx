import React from 'react';
import { SuspectId, Suspect, Clue } from '../types/game';
import { SUSPECTS, CLUES } from '../data/caseData';
import { Layers, Vote, FileText, ChevronUp, Pin } from 'lucide-react';

interface DetectiveBottomDockProps {
  selectedSuspectId: SuspectId | null;
  onSelectSuspect: (sId: SuspectId) => void;
  onOpenDossier: (suspect: Suspect) => void;
  discoveredClueIds: string[];
  onInspectClue: (clue: Clue) => void;
  onToggleCaseBoard: () => void;
  isCaseBoardOpen: boolean;
  onStartVote: () => void;
  interrogatedSuspectIds?: string[];
  currentSceneId?: string;
  themeMode?: 'dark' | 'light';
}

export const DetectiveBottomDock: React.FC<DetectiveBottomDockProps> = ({
  selectedSuspectId,
  onSelectSuspect,
  onOpenDossier,
  discoveredClueIds,
  onInspectClue,
  onToggleCaseBoard,
  isCaseBoardOpen,
  onStartVote,
  interrogatedSuspectIds = [],
  currentSceneId,
  themeMode = 'dark',
}) => {
  const isDark = themeMode === 'dark';
  const discoveredClues = CLUES.filter((c) => discoveredClueIds.includes(c.id));

  return (
    <div
      className={`w-full border-t backdrop-blur-md px-3 sm:px-4 py-2 flex items-center justify-between gap-3 text-xs font-serif select-none z-30 shrink-0 transition-colors duration-300 ${
        isDark
          ? 'bg-[#0C0A09]/95 border-[#3B3027] shadow-[0_-15px_30px_rgba(0,0,0,0.7)] text-[#F3EFEA]'
          : 'bg-[#FAF7F2]/95 border-[#E8DFD5] shadow-[0_-10px_25px_rgba(0,0,0,0.06)] text-[#1C1917]'
      }`}
    >
      {/* 1. Left: 4 Suspect Profile Seats (Borderless, Narrative-Driven) */}
      <div className="flex items-center space-x-3 shrink-0">
        <span
          className={`text-[10px] font-mono tracking-wider uppercase hidden sm:inline ${
            isDark ? 'text-[#73675E]' : 'text-[#8C7E72]'
          }`}
        >
          现场人员 · 4
        </span>
        <div className="flex items-center space-x-2 sm:space-x-3">
          {SUSPECTS.map((suspect) => {
            const isSelected = selectedSuspectId === suspect.id;
            const isInterrogated = interrogatedSuspectIds.includes(suspect.id);
            const isInSameRoom =
              (suspect.id === 'lin_lan' && currentSceneId === 'gallery-hall') ||
              (suspect.id === 'zhou_heng' && currentSceneId === 'office') ||
              (suspect.id === 'xu_ning' && currentSceneId === 'restoration-room') ||
              (suspect.id === 'zhao_lei' && currentSceneId === 'security-room');

            const statusLabel = isSelected
              ? '交谈中'
              : isInterrogated
              ? '已询问'
              : isInSameRoom
              ? '在场'
              : '观察中';

            return (
              <button
                key={suspect.id}
                onClick={() => onSelectSuspect(suspect.id)}
                className={`group flex items-center space-x-2 py-1 px-1.5 rounded-lg transition-all duration-200 cursor-pointer bg-transparent border-0 outline-none ${
                  isSelected ? 'opacity-100' : 'opacity-60 hover:opacity-95'
                }`}
                title={`${suspect.name} · ${suspect.title} (${statusLabel})`}
              >
                {/* Circular Illustrated Avatar with Glowing Border on Selection */}
                <div className="relative shrink-0">
                  <img
                    src={suspect.avatarImage || `/assets/portraits/${suspect.id}.jpg`}
                    alt={suspect.name}
                    className={`w-7 h-7 rounded-full object-cover object-top transition-all duration-200 ${
                      isSelected
                        ? isDark
                          ? 'ring-2 ring-[#C9942D] ring-offset-2 ring-offset-[#0C0A09] shadow-[0_0_10px_rgba(201,148,45,0.7)]'
                          : 'ring-2 ring-[#8B3A2B] ring-offset-2 ring-offset-[#FAF7F2] shadow-[0_0_10px_rgba(139,58,43,0.4)]'
                        : isDark
                        ? 'ring-1 ring-[#3B3027] group-hover:ring-[#6E5B4D]'
                        : 'ring-1 ring-[#E0D5C7] group-hover:ring-[#8B3A2B]/50'
                    }`}
                  />
                  {isInSameRoom && !isSelected && (
                    <span
                      className={`absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-emerald-400 ring-1 ${
                        isDark ? 'ring-[#0C0A09]' : 'ring-[#FAF7F2]'
                      }`}
                      title="在此房间"
                    />
                  )}
                </div>

                {/* Name, Role & Status Inline */}
                <div className="flex flex-col text-left leading-tight">
                  <div className="flex items-center space-x-1.5">
                    <span
                      className={`text-xs transition-colors duration-150 ${
                        isSelected
                          ? isDark
                            ? 'font-bold text-[#F3EFEA]'
                            : 'font-bold text-[#1C1917]'
                          : isDark
                          ? 'text-[#AFA49A] group-hover:text-[#F3EFEA]'
                          : 'text-[#786B60] group-hover:text-[#1C1917]'
                      }`}
                    >
                      {suspect.name}
                    </span>
                    <span
                      className={`text-[9px] font-mono transition-colors ${
                        isSelected
                          ? isDark
                            ? 'text-[#C9942D] font-bold'
                            : 'text-[#8B3A2B] font-bold'
                          : isDark
                          ? 'text-[#73675E] group-hover:text-[#AFA49A]'
                          : 'text-[#8C7E72] group-hover:text-[#1C1917]'
                      }`}
                    >
                      {statusLabel}
                    </span>
                  </div>
                  <span
                    className={`text-[10px] font-serif hidden md:block truncate max-w-[90px] ${
                      isDark ? 'text-[#73675E]' : 'text-[#8C7E72]'
                    }`}
                  >
                    {suspect.title}
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* 2. Middle: Discovered Evidence Shelf (Ultra Slim) */}
      <div className="flex items-center space-x-1.5 overflow-x-auto scrollbar-none max-w-xl mx-2">
        <span
          className={`text-[11px] font-mono shrink-0 hidden lg:inline ${
            isDark ? 'text-[#AFA49A]' : 'text-[#8C7E72]'
          }`}
        >
          物证 ({discoveredClues.length}/8):
        </span>
        {discoveredClues.length === 0 ? (
          <span
            className={`text-[11px] italic ${
              isDark ? 'text-[#7A6F65]' : 'text-[#8C7E72]'
            }`}
          >
            点击现场光标勘验并提取物证...
          </span>
        ) : (
          discoveredClues.map((clue) => (
            <button
              key={clue.id}
              onClick={() => onInspectClue(clue)}
              className={`flex items-center space-x-1 px-2.5 py-1 rounded border text-[11px] transition shrink-0 cursor-pointer shadow-xs ${
                isDark
                  ? 'bg-[#181411] hover:bg-[#241B15] border-[#3B3027] hover:border-[#C9942D]/60 text-[#D8CFC5] hover:text-[#F3EFEA]'
                  : 'bg-white hover:bg-[#F2ECE4] border-[#E0D5C7] hover:border-[#8B3A2B] text-[#1C1917] hover:text-[#8B3A2B]'
              }`}
              title={`${clue.name}（点击检视物证相片）`}
            >
              <span className={`w-1.5 h-1.5 rounded-full ${isDark ? 'bg-[#C9942D]' : 'bg-[#8B3A2B]'} shrink-0`} />
              <span className="truncate max-w-[90px] font-medium">{clue.name}</span>
            </button>
          ))
        )}
      </div>

      {/* 3. Right: Case Board Toggle & Vote Button */}
      <div className="flex items-center space-x-2 shrink-0">
        <button
          onClick={onToggleCaseBoard}
          className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg border text-xs transition cursor-pointer shadow-xs ${
            isCaseBoardOpen
              ? isDark
                ? 'bg-[#241B15] border-[#C9942D] text-[#C9942D]'
                : 'bg-[#F5E7DF] border-[#8B3A2B] text-[#8B3A2B]'
              : isDark
              ? 'bg-[#181411] border-[#3B3027] text-[#D8CFC5] hover:text-[#F3EFEA] hover:border-[#524135]'
              : 'bg-white border-[#E0D5C7] text-[#5C4F44] hover:text-[#1C1917] hover:border-[#8B3A2B]'
          }`}
          title="展开案件推演板（时间线/关联网/笔录）"
        >
          <Pin className={`w-3.5 h-3.5 ${isDark ? 'text-[#C9942D]' : 'text-[#8B3A2B]'}`} />
          <span className="hidden sm:inline font-bold">推演案板</span>
        </button>

        <button
          onClick={onStartVote}
          className="flex items-center space-x-1.5 px-3.5 py-1.5 rounded-lg bg-[#8B3A2B] hover:bg-[#783023] border border-[#783023] text-white text-xs font-bold transition cursor-pointer shadow-md active:scale-95"
          title="向 AI 主持人指控真凶并复盘"
        >
          <Vote className="w-3.5 h-3.5" />
          <span>指控真凶</span>
        </button>
      </div>
    </div>
  );
};
