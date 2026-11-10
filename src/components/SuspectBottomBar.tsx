import React from 'react';
import { SuspectId, Suspect } from '../types/game';
import { SUSPECTS } from '../data/caseData';
import { FileText, Vote, ShieldAlert } from 'lucide-react';

interface SuspectBottomBarProps {
  selectedSuspectId: SuspectId | null;
  onSelectSuspect: (sId: SuspectId) => void;
  onOpenDossier: (suspect: Suspect) => void;
  onStartVote: () => void;
  cluesLinkedCount?: (suspectId: SuspectId) => number;
}

export const SuspectBottomBar: React.FC<SuspectBottomBarProps> = ({
  selectedSuspectId,
  onSelectSuspect,
  onOpenDossier,
  onStartVote,
  cluesLinkedCount,
}) => {
  const getEmotionBrief = (sId: SuspectId) => {
    switch (sId) {
      case 'lin_lan':
        return { label: '防备', style: 'text-rose-400 bg-rose-950/60 border-rose-800/40' };
      case 'zhou_heng':
        return { label: '回避', style: 'text-sky-400 bg-sky-950/60 border-sky-800/40' };
      case 'xu_ning':
        return { label: '镇定', style: 'text-purple-400 bg-purple-950/60 border-purple-800/40' };
      case 'zhao_lei':
        return { label: '紧张', style: 'text-emerald-400 bg-emerald-950/60 border-emerald-800/40' };
      default:
        return { label: '观察', style: 'text-stone-400 bg-stone-900 border-stone-700' };
    }
  };

  return (
    <div className="w-full bg-slate-950/90 border-t border-slate-800/90 backdrop-blur-md px-4 py-2.5 shadow-2xl flex flex-col md:flex-row items-center justify-between gap-3 font-serif select-none z-30">
      {/* Suspect Roster Horizontal Bar */}
      <div className="flex items-center space-x-2.5 overflow-x-auto w-full md:w-auto pb-1 md:pb-0 scrollbar-none">
        <span className="text-[11px] font-mono text-slate-400 uppercase tracking-wider hidden lg:inline mr-1">
          当事人卷宗 (4人)：
        </span>

        {SUSPECTS.map((suspect) => {
          const isSelected = selectedSuspectId === suspect.id;
          const emotion = getEmotionBrief(suspect.id);
          const linkCount = cluesLinkedCount ? cluesLinkedCount(suspect.id) : 0;

          return (
            <div
              key={suspect.id}
              onClick={() => onSelectSuspect(suspect.id)}
              className={`flex items-center space-x-2.5 px-3 py-1.5 rounded-xl border transition-all cursor-pointer group shrink-0 ${
                isSelected
                  ? 'bg-slate-800/90 border-amber-400/90 shadow-md ring-2 ring-amber-400/30'
                  : 'bg-slate-900/70 border-slate-700/60 hover:bg-slate-800/60 hover:border-slate-500'
              }`}
            >
              {/* Avatar circle */}
              <div
                className="w-8 h-8 rounded-lg flex items-center justify-center font-bold text-xs text-white shadow-xs shrink-0"
                style={{ backgroundColor: suspect.avatarColor }}
              >
                {suspect.name.slice(0, 1)}
              </div>

              {/* Name & Emotion status */}
              <div className="text-left">
                <div className="flex items-center space-x-1.5">
                  <span
                    className={`font-bold text-xs block ${
                      isSelected ? 'text-amber-300' : 'text-slate-200 group-hover:text-white'
                    }`}
                  >
                    {suspect.name}
                  </span>
                  <span
                    className={`text-[9px] px-1.5 py-0.2 rounded border font-mono ${emotion.style}`}
                  >
                    {emotion.label}
                  </span>
                </div>
                <span className="text-[10px] text-slate-400 block truncate max-w-[90px]">
                  {suspect.title}
                </span>
              </div>

              {/* Dossier icon button */}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onOpenDossier(suspect);
                }}
                className="p-1 rounded-md text-slate-400 hover:text-amber-300 hover:bg-slate-700/50 transition cursor-pointer ml-1"
                title="查看人物档案详情"
              >
                <FileText className="w-3.5 h-3.5" />
              </button>
            </div>
          );
        })}
      </div>

      {/* Right Action: Accuse / Vote button */}
      <div className="flex items-center space-x-2.5 shrink-0 w-full md:w-auto justify-end">
        <button
          onClick={onStartVote}
          className="w-full md:w-auto px-4 py-2 rounded-xl bg-gradient-to-r from-rose-600 to-rose-700 hover:from-rose-500 hover:to-rose-600 text-white font-bold text-xs shadow-lg transition flex items-center justify-center space-x-1.5 cursor-pointer border border-rose-500/50 active:scale-98"
        >
          <Vote className="w-4 h-4 text-rose-200" />
          <span>推演完毕 · 指控真凶</span>
        </button>
      </div>
    </div>
  );
};
