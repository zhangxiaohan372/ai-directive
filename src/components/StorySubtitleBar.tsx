import React, { useEffect, useState } from 'react';
import { Sparkles, X, AlertCircle } from 'lucide-react';

interface StorySubtitleBarProps {
  message: string | null;
  onDismiss: () => void;
  type?: 'narrative' | 'clue' | 'hint';
}

export const StorySubtitleBar: React.FC<StorySubtitleBarProps> = ({
  message,
  onDismiss,
  type = 'narrative',
}) => {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (message) {
      setVisible(true);
      const timer = setTimeout(() => {
        setVisible(false);
        setTimeout(onDismiss, 300);
      }, 4500);
      return () => clearTimeout(timer);
    } else {
      setVisible(false);
    }
  }, [message, onDismiss]);

  if (!message && !visible) return null;

  const bgStyle =
    type === 'clue'
      ? 'bg-[#181411]/95 border-[#C9942D]/60 text-[#F3EFEA]'
      : type === 'hint'
      ? 'bg-[#181411]/95 border-[#3B3027] text-[#E0D7CD]'
      : 'bg-[#181411]/95 border-[#3B3027] text-[#F3EFEA]';

  const iconColor =
    type === 'clue'
      ? 'text-[#C9942D]'
      : type === 'hint'
      ? 'text-[#C9942D]'
      : 'text-[#A44A4A]';

  return (
    <div
      className={`fixed top-14 left-1/2 -translate-x-1/2 z-40 w-full max-w-3xl px-4 transition-all duration-300 ease-out pointer-events-none ${
        visible ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-3'
      }`}
    >
      <div
        className={`pointer-events-auto flex items-center justify-between gap-3 px-4 py-2.5 rounded-full border backdrop-blur-md shadow-2xl ${bgStyle}`}
      >
        <div className="flex items-center gap-2.5 overflow-hidden">
          <Sparkles className={`w-4 h-4 shrink-0 animate-pulse ${iconColor}`} />
          <span className="text-xs md:text-sm font-medium tracking-wide truncate font-serif">
            {message}
          </span>
        </div>
        <button
          onClick={() => {
            setVisible(false);
            setTimeout(onDismiss, 200);
          }}
          className="text-[#AFA49A] hover:text-[#F3EFEA] transition p-1 shrink-0 cursor-pointer"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
};
