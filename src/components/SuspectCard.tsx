import React from 'react';
import { Suspect, SuspectEmotion } from '../types/game';
import { MessageSquare, AlertCircle, Shield, User, Sparkles } from 'lucide-react';

interface SuspectCardProps {
  suspect: Suspect;
  isSelected?: boolean;
  currentEmotion?: SuspectEmotion;
  onSelect: (suspectId: Suspect['id']) => void;
  onInterrogate?: (suspectId: Suspect['id']) => void;
  secretUnlocked?: boolean;
  cluesLinkedCount?: number;
}

export const SuspectCard: React.FC<SuspectCardProps> = ({
  suspect,
  isSelected,
  currentEmotion,
  onSelect,
  onInterrogate,
  secretUnlocked = false,
  cluesLinkedCount = 0,
}) => {
  const emotion = currentEmotion || suspect.initialEmotion;

  const emotionStyles: Record<SuspectEmotion, { label: string; bg: string; text: string; border: string }> = {
    calm: { label: '镇定自若', bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200' },
    nervous: { label: '神色慌张', bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-200' },
    defensive: { label: '戒备抵赖', bg: 'bg-sky-50', text: 'text-sky-700', border: 'border-sky-200' },
    agitated: { label: '情绪激动', bg: 'bg-coral-50', text: 'text-coral-700', border: 'border-coral-200' },
    broken: { label: '防线动摇', bg: 'bg-purple-50', text: 'text-purple-700', border: 'border-purple-200' },
  };

  const currentEmotionStyle = emotionStyles[emotion];

  return (
    <div
      onClick={() => onSelect(suspect.id)}
      className={`group cursor-pointer rounded-2xl p-4 transition-all duration-200 border relative flex flex-col justify-between ${
        isSelected
          ? 'bg-white border-coral-500 shadow-md ring-2 ring-coral-100'
          : 'bg-white/90 border-slate-200/90 hover:border-slate-300 hover:shadow-xs'
      }`}
    >
      <div>
        {/* Header with Avatar & Emotion badge */}
        <div className="flex items-start justify-between">
          <div className="flex items-center space-x-3">
            {/* 3D-styled stylized avatar token */}
            <div
              className="w-12 h-12 rounded-2xl flex items-center justify-center font-bold text-lg text-white shadow-inner transition-transform group-hover:scale-105"
              style={{ backgroundColor: suspect.avatarColor }}
            >
              {suspect.name.slice(0, 1)}
            </div>

            <div>
              <div className="flex items-center space-x-1.5">
                <h4 className="font-bold text-slate-800 text-sm">{suspect.name}</h4>
                <span className="text-[11px] text-slate-400 font-medium">({suspect.age}岁)</span>
              </div>
              <p className="text-xs text-slate-500 font-medium">{suspect.title}</p>
            </div>
          </div>

          <span
            className={`text-[10px] px-2 py-0.5 rounded-full font-semibold border ${currentEmotionStyle.bg} ${currentEmotionStyle.text} ${currentEmotionStyle.border}`}
          >
            {currentEmotionStyle.label}
          </span>
        </div>

        {/* Bio preview */}
        <p className="text-xs text-slate-600 mt-3 line-clamp-2 leading-relaxed">
          {suspect.bio}
        </p>

        {/* Alibi statement */}
        <div className="mt-3 p-2.5 rounded-xl bg-slate-50 border border-slate-100 text-[11px] text-slate-600 italic">
          <span className="font-semibold text-slate-700 not-italic block mb-0.5">口供陈述：</span>
          <span className="line-clamp-2">{suspect.alibi}</span>
        </div>

        {/* Secret Status badge */}
        {secretUnlocked && (
          <div className="mt-2.5 p-2 rounded-xl bg-purple-50/70 border border-purple-200/70 text-[11px] text-purple-900 flex items-start space-x-1.5">
            <Sparkles className="w-3.5 h-3.5 text-purple-600 shrink-0 mt-0.5" />
            <span className="line-clamp-2 font-medium">{suspect.secret}</span>
          </div>
        )}
      </div>

      {/* Footer action bar */}
      <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
        <span className="text-[11px] text-slate-400">
          已关联物证：<strong className="text-slate-700 font-semibold">{cluesLinkedCount}</strong> 件
        </span>

        <button
          onClick={(e) => {
            e.stopPropagation();
            onInterrogate?.(suspect.id);
          }}
          className="text-xs font-semibold text-coral-600 hover:text-coral-700 flex items-center space-x-1 px-2.5 py-1 rounded-lg hover:bg-coral-50 transition"
        >
          <MessageSquare className="w-3.5 h-3.5" />
          <span>质询盘问</span>
        </button>
      </div>
    </div>
  );
};
