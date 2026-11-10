import React, { useState } from 'react';
import { Clue, TimelineEntry, ClueLink, SuspectId } from '../types/game';
import { CLUES, TIMELINE, SUSPECTS } from '../data/caseData';
import {
  X,
  ExternalLink,
  Trash2,
  Pin,
  FileText,
  Clock,
  Network,
  Edit3,
  FolderArchive,
  Sparkles,
  Lock,
  Sun,
  Moon,
} from 'lucide-react';

interface CaseBoardDrawerProps {
  isOpen: boolean;
  onToggle: () => void;
  discoveredClueIds: string[];
  clueLinks: ClueLink[];
  onInspectClue: (clue: Clue) => void;
  onRemoveClueLink?: (clueId: string, targetId: string) => void;
  onAddClueLink?: (clueId: string, targetId: string, note?: string) => void;
  playerNotes: string;
  onSaveNotes: (notes: string) => void;
  themeMode?: 'dark' | 'light';
  onToggleTheme?: () => void;
}

export const CaseBoardDrawer: React.FC<CaseBoardDrawerProps> = ({
  isOpen,
  onToggle,
  discoveredClueIds,
  clueLinks,
  onInspectClue,
  onRemoveClueLink,
  onAddClueLink,
  playerNotes,
  onSaveNotes,
  themeMode = 'dark',
  onToggleTheme,
}) => {
  const [boardView, setBoardView] = useState<'board' | 'timeline' | 'links' | 'notes'>('board');
  const [selectedClueForLink, setSelectedClueForLink] = useState<string>('');
  const [selectedTargetSuspect, setSelectedTargetSuspect] = useState<SuspectId>('xu_ning');
  const [linkNote, setLinkNote] = useState<string>('');
  const [showUndiscoveredDrawer, setShowUndiscoveredDrawer] = useState(false);

  if (!isOpen) return null;

  const isDark = themeMode === 'dark';
  const discoveredClues = CLUES.filter((c) => discoveredClueIds.includes(c.id));
  const undiscoveredClues = CLUES.filter((c) => !discoveredClueIds.includes(c.id));

  const handleCreateLink = () => {
    if (!selectedClueForLink) return;
    onAddClueLink?.(selectedClueForLink, selectedTargetSuspect, linkNote);
    setLinkNote('');
  };

  // Rotation angles for organic scatter effect
  const cardRotations = ['-rotate-1', 'rotate-2', '-rotate-2', 'rotate-1', 'rotate-3', '-rotate-1'];

  return (
    <div className={`fixed inset-0 z-50 backdrop-blur-md flex items-center justify-center p-2 sm:p-5 select-none animate-fadeIn font-serif transition-colors duration-300 ${
      isDark ? 'bg-black/85' : 'bg-stone-900/55'
    }`}>
      {/* Outer Wood Frame - Walnut in Dark, Warm Beech/Oak in Light */}
      <div className={`relative w-full max-w-6xl h-[92vh] max-h-[840px] rounded-xl border-[10px] flex flex-col overflow-hidden transition-all duration-300 ${
        isDark
          ? 'bg-[#2a1b12] border-[#382417] shadow-[0_25px_60px_-15px_rgba(0,0,0,0.95),inset_0_2px_10px_rgba(0,0,0,0.8)]'
          : 'bg-[#EDE4D5] border-[#D8CABE] shadow-[0_25px_60px_-15px_rgba(45,30,20,0.3),inset_0_2px_6px_rgba(255,255,255,0.7)]'
      }`}>
        {/* Metal Corner Brackets */}
        <div className={`absolute top-0 left-0 w-8 h-8 border-t-2 border-l-2 pointer-events-none z-30 ${isDark ? 'border-amber-600/60' : 'border-amber-800/40'}`} />
        <div className={`absolute top-0 right-0 w-8 h-8 border-t-2 border-r-2 pointer-events-none z-30 ${isDark ? 'border-amber-600/60' : 'border-amber-800/40'}`} />
        <div className={`absolute bottom-0 left-0 w-8 h-8 border-b-2 border-l-2 pointer-events-none z-30 ${isDark ? 'border-amber-600/60' : 'border-amber-800/40'}`} />
        <div className={`absolute bottom-0 right-0 w-8 h-8 border-b-2 border-r-2 pointer-events-none z-30 ${isDark ? 'border-amber-600/60' : 'border-amber-800/40'}`} />

        {/* 1. Header: Minimalist Case Bar (Case name, Clues count, Theme toggle, Subtabs, Close) */}
        <div className={`px-4 py-2.5 flex items-center justify-between border-b z-20 transition-colors duration-300 ${
          isDark
            ? 'bg-[#1f130c] border-[#3d2719] text-stone-200'
            : 'bg-[#FAF6F0] border-[#E2D8CA] text-stone-900'
        }`}>
          <div className="flex items-center space-x-3">
            <span className={`font-bold text-sm tracking-wider font-serif ${isDark ? 'text-[#faebd7]' : 'text-[#2C1810]'}`}>
              案件卷宗 · 午夜画廊
            </span>
            <span className={`font-mono text-xs px-2 py-0.5 rounded border ${
              isDark
                ? 'text-[#c4a482] bg-[#2a1b12]/60 border-[#3d2719]'
                : 'text-[#8B3A2B] bg-[#F0E6D8] border-[#DECFC0]'
            }`}>
              [ 已钉证物: {discoveredClues.length}/8 ]
            </span>
          </div>

          {/* Board Pinned Sub-Tabs (Wood peg tabs) */}
          <div className="flex items-center space-x-1 text-xs">
            <button
              onClick={() => setBoardView('board')}
              className={`flex items-center gap-1.5 px-3 py-1 rounded transition cursor-pointer font-medium ${
                boardView === 'board'
                  ? isDark
                    ? 'bg-[#4a2e1b] text-amber-200 shadow-inner border border-amber-700/60'
                    : 'bg-[#8B3A2B] text-white shadow-xs border border-[#783023]'
                  : isDark
                    ? 'text-stone-400 hover:text-stone-200 hover:bg-[#382316]'
                    : 'text-stone-600 hover:text-stone-900 hover:bg-[#EFE7DC]'
              }`}
            >
              <Pin className="w-3.5 h-3.5" />
              <span>实体案板</span>
            </button>
            <button
              onClick={() => setBoardView('timeline')}
              className={`flex items-center gap-1.5 px-3 py-1 rounded transition cursor-pointer font-medium ${
                boardView === 'timeline'
                  ? isDark
                    ? 'bg-[#4a2e1b] text-amber-200 shadow-inner border border-amber-700/60'
                    : 'bg-[#8B3A2B] text-white shadow-xs border border-[#783023]'
                  : isDark
                    ? 'text-stone-400 hover:text-stone-200 hover:bg-[#382316]'
                    : 'text-stone-600 hover:text-stone-900 hover:bg-[#EFE7DC]'
              }`}
            >
              <Clock className="w-3.5 h-3.5" />
              <span>案发时刻</span>
            </button>
            <button
              onClick={() => setBoardView('links')}
              className={`flex items-center gap-1.5 px-3 py-1 rounded transition cursor-pointer font-medium ${
                boardView === 'links'
                  ? isDark
                    ? 'bg-[#4a2e1b] text-amber-200 shadow-inner border border-amber-700/60'
                    : 'bg-[#8B3A2B] text-white shadow-xs border border-[#783023]'
                  : isDark
                    ? 'text-stone-400 hover:text-stone-200 hover:bg-[#382316]'
                    : 'text-stone-600 hover:text-stone-900 hover:bg-[#EFE7DC]'
              }`}
            >
              <Network className="w-3.5 h-3.5" />
              <span>红线推演网 ({clueLinks.length})</span>
            </button>
            <button
              onClick={() => setBoardView('notes')}
              className={`flex items-center gap-1.5 px-3 py-1 rounded transition cursor-pointer font-medium ${
                boardView === 'notes'
                  ? isDark
                    ? 'bg-[#4a2e1b] text-amber-200 shadow-inner border border-amber-700/60'
                    : 'bg-[#8B3A2B] text-white shadow-xs border border-[#783023]'
                  : isDark
                    ? 'text-stone-400 hover:text-stone-200 hover:bg-[#382316]'
                    : 'text-stone-600 hover:text-stone-900 hover:bg-[#EFE7DC]'
              }`}
            >
              <FileText className="w-3.5 h-3.5" />
              <span>侦探手记</span>
            </button>
          </div>

          {/* Right Controls: Light / Dark Toggle + Close Button */}
          <div className="flex items-center space-x-2">
            {onToggleTheme && (
              <div
                className={`flex items-center p-0.5 rounded-full border transition-colors ${
                  isDark
                    ? 'border-stone-700 bg-stone-900/90 text-stone-400'
                    : 'border-[#DACFBF] bg-[#ECE4D8] text-stone-600'
                }`}
              >
                <button
                  onClick={onToggleTheme}
                  className={`flex items-center space-x-1 px-2.5 py-0.5 rounded-full font-serif text-[11px] transition cursor-pointer ${
                    !isDark
                      ? 'bg-[#8B3A2B] text-white font-bold shadow-xs'
                      : 'hover:text-stone-200'
                  }`}
                  title="切换至白昼明亮模式"
                >
                  <Sun className="w-3 h-3" />
                  <span>白昼</span>
                </button>
                <button
                  onClick={onToggleTheme}
                  className={`flex items-center space-x-1 px-2.5 py-0.5 rounded-full font-serif text-[11px] transition cursor-pointer ${
                    isDark
                      ? 'bg-amber-400 text-stone-950 font-bold shadow-xs'
                      : 'hover:text-stone-900'
                  }`}
                  title="切换至暗夜破案模式"
                >
                  <Moon className="w-3 h-3" />
                  <span>暗夜</span>
                </button>
              </div>
            )}

            {/* Close Button */}
            <button
              onClick={onToggle}
              className={`p-1 rounded transition cursor-pointer ${
                isDark
                  ? 'text-stone-400 hover:text-white hover:bg-[#382316]'
                  : 'text-stone-600 hover:text-stone-900 hover:bg-[#EAE1D3]'
              }`}
              title="关闭案板"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* 2. Detective Desk Wooden Surface Canvas */}
        <div
          className="relative flex-1 overflow-y-auto p-6 md:p-8 select-text transition-all duration-300"
          style={{
            backgroundColor: isDark ? '#1b120c' : '#F4EEE5',
            backgroundImage: isDark
              ? `linear-gradient(to bottom, rgba(12, 7, 3, 0.4), rgba(8, 5, 2, 0.65)), url('/assets/textures/desk-wood.jpg')`
              : `linear-gradient(to bottom, rgba(255, 252, 246, 0.78), rgba(240, 233, 222, 0.9)), url('/assets/textures/desk-wood.jpg')`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            backgroundRepeat: 'no-repeat',
          }}
        >
          {/* Desk surface depth vignette */}
          <div
            className={`absolute inset-0 pointer-events-none transition-opacity duration-300 ${
              isDark
                ? 'shadow-[inset_0_0_120px_rgba(5,3,1,0.85)]'
                : 'shadow-[inset_0_0_90px_rgba(180,165,145,0.35)]'
            }`}
          />

          {/* VIEW 1: SCATTERED PHYSICAL EVIDENCE DESK */}
          {boardView === 'board' && (
            <div className="relative min-h-[560px]">
              {/* Connected Red String Layer (Only shown when clues are present on the desk) */}
              {discoveredClues.length > 0 && (
                <svg className="absolute inset-0 w-full h-full pointer-events-none z-10 opacity-75">
                  <line
                    x1="240"
                    y1="160"
                    x2="520"
                    y2="200"
                    stroke="#dc2626"
                    strokeWidth="2.5"
                    strokeDasharray="6 3"
                  />
                  {discoveredClues.length > 1 && (
                    <line
                      x1="520"
                      y1="200"
                      x2="480"
                      y2="380"
                      stroke="#dc2626"
                      strokeWidth="2"
                    />
                  )}
                </svg>
              )}

              {/* Central Yellow Sticky Note: Case Core Thesis */}
              <div className="absolute top-2 left-1/2 -translate-x-1/2 z-20 w-72 bg-[#fef08a] text-[#713f12] p-3 shadow-lg -rotate-1 border border-yellow-300/80 font-serif">
                {/* Brass Thumbtack */}
                <div className="absolute -top-2.5 left-1/2 -translate-x-1/2 w-4 h-4 rounded-full bg-gradient-to-br from-amber-300 via-amber-500 to-amber-700 shadow-md border border-amber-900/40" />
                <span className="text-[10px] font-mono block text-[#854d0e] uppercase tracking-wider">
                  // 案发现场核心疑问
                </span>
                <p className="text-xs leading-snug mt-1 font-bold">
                  “陈默死于 22:15（停摆怀表），修复室从内反锁。门后发现镉红抹布，窗边留有尼龙线。谁是真凶？”
                </p>
              </div>

              {/* Discovered Physical Evidence Items (Organic Paper / Polaroid Scatter) */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 pt-16 z-20 relative">
                {discoveredClues.map((clue, idx) => {
                  const rotation = cardRotations[idx % cardRotations.length];

                  return (
                    <div
                      key={clue.id}
                      className={`relative rounded p-4 transition-all hover:scale-102 hover:z-30 hover:shadow-2xl group ${rotation} ${
                        isDark
                          ? 'bg-[#fcf9f2] text-stone-900 shadow-[0_10px_25px_-5px_rgba(0,0,0,0.5),0_8px_10px_-6px_rgba(0,0,0,0.4)] border border-[#e5dec9]'
                          : 'bg-white text-stone-900 shadow-[0_10px_25px_-5px_rgba(130,110,90,0.22),0_6px_10px_-4px_rgba(130,110,90,0.15)] border border-[#ded5c2]'
                      }`}
                    >
                      {/* Red Pushpin on top */}
                      <div className="absolute -top-3 left-1/2 -translate-x-1/2 w-5 h-5 rounded-full bg-gradient-to-br from-rose-400 via-rose-600 to-rose-900 shadow-md border border-rose-950 flex items-center justify-center">
                        <span className="w-1.5 h-1.5 rounded-full bg-white/60" />
                      </div>

                      {/* Polaroid / Paper Clipping Tape on top right */}
                      <div className="absolute -top-2 right-4 w-12 h-3.5 bg-amber-100/40 rotate-12 backdrop-blur-xs border-t border-b border-amber-300/30" />

                      {/* Evidence Header */}
                      <div className="border-b-2 border-stone-800/20 pb-2 mb-2">
                        <div className="flex items-center justify-between">
                          <span className="font-mono text-[10px] font-bold text-red-700 uppercase tracking-widest">
                            EXHIBIT #{idx + 1} · 物证档案
                          </span>
                          {clue.isCrucial && (
                            <span className="border border-red-700/80 text-red-800 px-1.5 py-0.2 font-mono text-[9px] font-bold tracking-widest uppercase rotate-2">
                              CRUCIAL
                            </span>
                          )}
                        </div>
                        <h4 className="font-bold text-sm text-stone-900 mt-1 font-serif">
                          {clue.name}
                        </h4>
                      </div>

                      {/* Evidence Body */}
                      <p className="text-xs text-stone-700 leading-relaxed font-serif mb-3">
                        {clue.detail}
                      </p>

                      {/* Red Marker / Hand-drawn Note Box */}
                      <div className="p-2 rounded bg-[#f5ebd7] border-l-2 border-red-700 text-[11px] text-stone-800 leading-snug">
                        <span className="font-bold text-red-800 block text-[10px] font-mono">
                          // 法医与技术勘验批注:
                        </span>
                        <span>{clue.forensicNote}</span>
                      </div>

                      {/* Bottom Tags & 3D Inspect Trigger */}
                      <div className="mt-3 pt-2 border-t border-stone-300 flex items-center justify-between">
                        <div className="flex flex-wrap gap-1">
                          {clue.tags.map((t, tIdx) => (
                            <span
                              key={tIdx}
                              className="text-[9px] text-stone-600 font-mono"
                            >
                              #{t}
                            </span>
                          ))}
                        </div>

                        <button
                          onClick={() => onInspectClue(clue)}
                          className="px-2 py-0.5 rounded bg-stone-900 hover:bg-stone-800 text-amber-200 text-xs font-serif transition flex items-center space-x-1 cursor-pointer shadow-xs"
                        >
                          <span>物证特写</span>
                          <ExternalLink className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  );
                })}

                {/* Kraft Paper Envelope: Undiscovered Clues Folder (Compact on side, NOT 6 huge cards) */}
                <div
                  onClick={() => setShowUndiscoveredDrawer(!showUndiscoveredDrawer)}
                  className={`relative rounded-md p-4 cursor-pointer hover:scale-102 transition group rotate-1 flex flex-col justify-between min-h-[220px] ${
                    isDark
                      ? 'bg-[#d4a373] text-[#432818] shadow-xl border-2 border-[#bc8a5f]'
                      : 'bg-[#dfaf80] text-[#3d2010] shadow-lg border-2 border-[#c59365]'
                  }`}
                >
                  {/* Metal Eyelet / Brass Brad */}
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 w-5 h-5 rounded-full bg-gradient-to-br from-amber-200 via-amber-400 to-amber-700 shadow border border-amber-900 flex items-center justify-center">
                    <span className="w-1.5 h-1.5 rounded-full bg-stone-900" />
                  </div>

                  {/* Red String Tie Graphic */}
                  <div className="border-b-2 border-dashed border-[#8d5b4c] pb-2 mb-2">
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-[10px] font-bold uppercase tracking-wider text-[#7f4f24]">
                        CONFIDENTIAL · 待破获物证袋
                      </span>
                      <FolderArchive className="w-4 h-4 text-[#7f4f24]" />
                    </div>
                    <h4 className="font-bold text-sm text-[#432818] mt-1 font-serif">
                      尚有 {undiscoveredClues.length} 件现场物证待提取
                    </h4>
                  </div>

                  <p className="text-xs text-[#582f0e] leading-relaxed">
                    画廊各房间深处仍潜藏着致命线索与不在场矛盾。前往修复室、办公室与安保室勘验光标以破除疑云。
                  </p>

                  <div className="mt-3 pt-2 border-t border-[#bc8a5f] flex items-center justify-between text-[11px] text-[#7f4f24]">
                    <span>点击展开未提取线索线索简报</span>
                    <span className="font-bold underline">
                      {showUndiscoveredDrawer ? '收起 ▴' : '查看 ▾'}
                    </span>
                  </div>

                  {/* Expandable Mini List */}
                  {showUndiscoveredDrawer && (
                    <div className="mt-2 p-2 bg-[#faedcd] rounded text-[11px] text-[#582f0e] space-y-1 animate-fadeIn">
                      {undiscoveredClues.map((uc) => (
                        <div key={uc.id} className="flex items-center space-x-1.5">
                          <Lock className="w-3 h-3 text-stone-500 shrink-0" />
                          <span className="font-medium">{uc.name}</span>
                          <span className="text-[10px] text-stone-500 font-mono">
                            (位置待查)
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* VIEW 2: TIME TRACKER (Minute-by-minute with contradiction stamps) */}
          {boardView === 'timeline' && (
            <div className="max-w-3xl mx-auto space-y-4 relative z-20">
              <div className="p-3 bg-[#fef08a] text-[#713f12] rounded shadow border border-yellow-400/70 text-xs">
                <strong>致命时间刻度：</strong>
                死者后脑钝击致死时间被定格在 22:15（停摆金怀表）。格外审视 22:00 至 22:20 之间的口供断档。
              </div>

              <div className="relative pl-6 border-l-2 border-red-800/80 space-y-5">
                {TIMELINE.map((item, idx) => (
                  <div key={idx} className="relative group">
                    {/* Metal Thumbtack dot */}
                    <div
                      className={`absolute -left-[31px] top-1.5 w-3.5 h-3.5 rounded-full border-2 border-stone-900 ${
                        item.isContradiction ? 'bg-red-600 animate-ping' : 'bg-amber-400'
                      }`}
                    />
                    <div
                      className={`p-3.5 rounded shadow-md border ${
                        item.isContradiction
                          ? 'border-red-600 bg-[#fff5f5]'
                          : isDark
                            ? 'bg-[#fcf9f2] text-stone-900 border-[#e0d5be]'
                            : 'bg-white text-stone-900 border-[#ded5c2]'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-mono font-bold text-xs text-red-800">
                          {item.time} · {item.title}
                        </span>
                        <span className="text-[10px] font-mono text-stone-500">
                          {item.verified ? '已核实物证' : '待查证口供'}
                        </span>
                      </div>
                      <p className="text-xs text-stone-800 leading-relaxed font-serif">
                        {item.desc}
                      </p>
                      {item.isContradiction && (
                        <div className="mt-2 text-[11px] text-red-900 bg-red-100/80 p-2 rounded border border-red-300 font-mono">
                          口供矛盾：该时刻与现场物证存在直接冲突！
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* VIEW 3: RED STRING RELATIONSHIP LINKER */}
          {boardView === 'links' && (
            <div className="max-w-4xl mx-auto space-y-6 relative z-20">
              {/* Creator Form */}
              <div className={`p-4 rounded border shadow-md flex flex-col md:flex-row items-center gap-3 text-stone-900 ${
                isDark ? 'bg-[#fcf9f2] border-[#d5caa8]' : 'bg-white border-[#d8ceba]'
              }`}>
                <span className="text-xs font-bold text-red-900 shrink-0 font-mono">
                  // 钉红线推演:
                </span>
                <select
                  value={selectedClueForLink}
                  onChange={(e) => setSelectedClueForLink(e.target.value)}
                  className="bg-stone-50 border border-stone-300 rounded px-2.5 py-1 text-xs text-stone-800 focus:outline-none"
                >
                  <option value="">选择已收集物证...</option>
                  {discoveredClues.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>

                <span className="text-xs text-red-700 font-bold">-&gt; 连线 -&gt;</span>

                <select
                  value={selectedTargetSuspect}
                  onChange={(e) => setSelectedTargetSuspect(e.target.value as SuspectId)}
                  className="bg-stone-50 border border-stone-300 rounded px-2.5 py-1 text-xs text-stone-800 focus:outline-none"
                >
                  {SUSPECTS.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name} ({s.title})
                    </option>
                  ))}
                </select>

                <input
                  type="text"
                  placeholder="关联批注（如：备用卡刷卡时间吻合...）"
                  value={linkNote}
                  onChange={(e) => setLinkNote(e.target.value)}
                  className="flex-1 bg-stone-50 border border-stone-300 rounded px-2.5 py-1 text-xs text-stone-800 placeholder-stone-400 focus:outline-none"
                />

                <button
                  onClick={handleCreateLink}
                  disabled={!selectedClueForLink}
                  className="px-3 py-1 rounded bg-red-800 hover:bg-red-700 text-white font-bold text-xs transition cursor-pointer disabled:opacity-40"
                >
                  钉在案板
                </button>
              </div>

              {/* Established Links Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {clueLinks.length === 0 ? (
                  <div className={`col-span-2 text-center py-12 font-serif ${
                    isDark ? 'text-stone-300' : 'text-stone-700'
                  }`}>
                    案板上暂未钉上红线推演。在上方选择物证与当事人，建立因果连线。
                  </div>
                ) : (
                  clueLinks.map((link) => {
                    const clueObj = CLUES.find((c) => c.id === link.clueId);
                    const suspObj = SUSPECTS.find((s) => s.id === link.targetId);

                    return (
                      <div
                        key={`${link.clueId}_${link.targetId}`}
                        className={`p-3 rounded border shadow flex items-center justify-between text-stone-900 ${
                          isDark ? 'bg-[#fcf9f2] border-[#d5caa8]' : 'bg-white border-[#d8ceba]'
                        }`}
                      >
                        <div className="space-y-0.5">
                          <div className="flex items-center space-x-2 text-xs">
                            <span className="font-bold text-red-800">
                              {clueObj?.name || '未知物证'}
                            </span>
                            <span className="text-red-600 font-mono">--------&gt;</span>
                            <span className="font-bold text-stone-900">
                              {suspObj?.name || '目标人员'}
                            </span>
                          </div>
                          {link.note && (
                            <p className="text-[11px] text-stone-600 italic">{link.note}</p>
                          )}
                        </div>

                        {onRemoveClueLink && (
                          <button
                            onClick={() => onRemoveClueLink(link.clueId, link.targetId)}
                            className="p-1 rounded text-stone-400 hover:text-red-700 transition cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          )}

          {/* VIEW 4: DETECTIVE NOTES (Typewriter Paper) */}
          {boardView === 'notes' && (
            <div className="max-w-2xl mx-auto space-y-4 relative z-20">
              <div className={`p-4 border rounded shadow-lg text-stone-900 ${
                isDark ? 'bg-[#fcf9f2] border-[#d5caa8]' : 'bg-white border-[#d8ceba]'
              }`}>
                <div className="flex items-center justify-between border-b border-stone-300 pb-2 mb-3">
                  <span className="font-mono text-xs font-bold text-stone-700">
                    // 首席侦探破案笔录草稿
                  </span>
                  <span className="font-mono text-[10px] text-stone-400">自动保存已开启</span>
                </div>
                <textarea
                  value={playerNotes}
                  onChange={(e) => onSaveNotes(e.target.value)}
                  placeholder="在此写下你的破案假设、动机推理、密室解法..."
                  className="w-full h-72 bg-transparent border-0 focus:outline-none text-xs font-mono text-stone-800 leading-relaxed resize-none"
                />
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
