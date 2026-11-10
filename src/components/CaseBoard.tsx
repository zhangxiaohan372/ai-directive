import React, { useState } from 'react';
import { Clue, TimelineEntry, ClueLink, SuspectId } from '../types/game';
import { CLUES, TIMELINE, SUSPECTS } from '../data/caseData';
import {
  FileText,
  Clock,
  Network,
  Edit3,
  Search,
  ExternalLink,
  CheckCircle2,
  AlertCircle,
  Trash2,
  Plus,
} from 'lucide-react';

interface CaseBoardProps {
  discoveredClueIds: string[];
  clueLinks: ClueLink[];
  onInspectClue: (clue: Clue) => void;
  onRemoveClueLink?: (clueId: string, targetId: string) => void;
  onAddClueLink?: (clueId: string, targetId: string, note?: string) => void;
  playerNotes: string;
  onSaveNotes: (notes: string) => void;
}

export const CaseBoard: React.FC<CaseBoardProps> = ({
  discoveredClueIds,
  clueLinks,
  onInspectClue,
  onRemoveClueLink,
  onAddClueLink,
  playerNotes,
  onSaveNotes,
}) => {
  const [activeTab, setActiveTab] = useState<'clues' | 'timeline' | 'links' | 'notes'>('clues');
  const [selectedClueForLink, setSelectedClueForLink] = useState<string>('');
  const [selectedTargetSuspect, setSelectedTargetSuspect] = useState<SuspectId>('xu_ning');
  const [linkNote, setLinkNote] = useState<string>('');

  const discoveredClues = CLUES.filter((c) => discoveredClueIds.includes(c.id));

  const handleCreateLink = () => {
    if (!selectedClueForLink) return;
    onAddClueLink?.(selectedClueForLink, selectedTargetSuspect, linkNote);
    setLinkNote('');
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200/90 shadow-sm flex flex-col h-full min-h-[520px] overflow-hidden">
      {/* Tab Navigation */}
      <div className="flex items-center justify-between px-3 pt-3 pb-2 border-b border-slate-100 bg-slate-50/60">
        <div className="flex items-center space-x-1">
          <button
            onClick={() => setActiveTab('clues')}
            className={`flex items-center space-x-1 text-xs px-3 py-1.5 rounded-xl font-bold transition ${
              activeTab === 'clues'
                ? 'bg-white text-slate-800 shadow-xs border border-slate-200'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <FileText className="w-3.5 h-3.5 text-coral-500" />
            <span>物证 ({discoveredClues.length}/8)</span>
          </button>

          <button
            onClick={() => setActiveTab('timeline')}
            className={`flex items-center space-x-1 text-xs px-3 py-1.5 rounded-xl font-bold transition ${
              activeTab === 'timeline'
                ? 'bg-white text-slate-800 shadow-xs border border-slate-200'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <Clock className="w-3.5 h-3.5 text-sky-500" />
            <span>时间线</span>
          </button>

          <button
            onClick={() => setActiveTab('links')}
            className={`flex items-center space-x-1 text-xs px-3 py-1.5 rounded-xl font-bold transition ${
              activeTab === 'links'
                ? 'bg-white text-slate-800 shadow-xs border border-slate-200'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <Network className="w-3.5 h-3.5 text-purple-500" />
            <span>关联网 ({clueLinks.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('notes')}
            className={`flex items-center space-x-1 text-xs px-3 py-1.5 rounded-xl font-bold transition ${
              activeTab === 'notes'
                ? 'bg-white text-slate-800 shadow-xs border border-slate-200'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <Edit3 className="w-3.5 h-3.5 text-emerald-500" />
            <span>备忘录</span>
          </button>
        </div>
      </div>

      {/* Content Area */}
      <div className="flex-1 p-4 overflow-y-auto bg-slate-50/20">
        {/* Tab 1: Clues List */}
        {activeTab === 'clues' && (
          <div className="space-y-2.5">
            {discoveredClues.length === 0 ? (
              <div className="h-64 flex flex-col items-center justify-center text-center text-slate-400">
                <Search className="w-8 h-8 mb-2 text-slate-300" />
                <p className="text-xs font-semibold text-slate-600">暂未发现任何现场物证</p>
                <p className="text-[11px] text-slate-400 mt-1">
                  前往现场或地点导览图，点击房间进行深度勘验搜查！
                </p>
              </div>
            ) : (
              discoveredClues.map((clue) => (
                <div
                  key={clue.id}
                  onClick={() => onInspectClue(clue)}
                  className="group bg-white p-3.5 rounded-xl border border-slate-200/80 hover:border-coral-400 hover:shadow-xs transition cursor-pointer flex items-start justify-between"
                >
                  <div className="flex-1">
                    <div className="flex items-center space-x-2">
                      <span className="text-xs font-bold text-slate-800 group-hover:text-coral-600 transition">
                        {clue.name}
                      </span>
                      {clue.isCrucial && (
                        <span className="text-[9px] px-1.5 py-0.2 rounded-full font-bold bg-amber-100 text-amber-800">
                          关键铁证
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-slate-500 mt-1 line-clamp-2">{clue.shortDesc}</p>
                    <div className="mt-2 flex items-center space-x-2">
                      <span className="text-[10px] text-slate-400">
                        类别: {clue.category}
                      </span>
                      <span className="text-[10px] text-coral-600 font-medium flex items-center space-x-0.5">
                        <span>点击检视物证相片</span>
                        <ExternalLink className="w-2.5 h-2.5" />
                      </span>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* Tab 2: Timeline */}
        {activeTab === 'timeline' && (
          <div className="relative pl-6 space-y-4 before:content-[''] before:absolute before:left-2 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200">
            {TIMELINE.map((item, idx) => {
              const isHighlight = item.time === '22:15' || item.time === '22:12';
              return (
                <div key={idx} className="relative group">
                  {/* Timeline dot */}
                  <div
                    className={`absolute -left-[22px] top-1.5 w-3 h-3 rounded-full border-2 border-white shadow-xs ${
                      isHighlight ? 'bg-coral-500 ring-2 ring-coral-200' : 'bg-slate-400'
                    }`}
                  />

                  <div
                    className={`p-3 rounded-xl border transition ${
                      isHighlight
                        ? 'bg-coral-50/40 border-coral-200'
                        : 'bg-white border-slate-200/80'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span
                        className={`text-xs font-extrabold ${
                          isHighlight ? 'text-coral-600' : 'text-slate-800'
                        }`}
                      >
                        {item.time} · {item.title}
                      </span>
                      {item.verified && (
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                      )}
                    </div>
                    <p className="text-xs text-slate-600 mt-1 leading-relaxed">{item.desc}</p>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Tab 3: Relationship Graph / Clue Links */}
        {activeTab === 'links' && (
          <div className="space-y-4">
            {/* Create new link widget */}
            <div className="p-3.5 bg-white rounded-xl border border-slate-200 shadow-xs">
              <span className="text-xs font-bold text-slate-700 block mb-2 flex items-center space-x-1">
                <Plus className="w-3.5 h-3.5 text-purple-600" />
                <span>建立推论关联（物证 -&gt; 嫌疑人）：</span>
              </span>
              <div className="grid grid-cols-2 gap-2 mb-2">
                <select
                  value={selectedClueForLink}
                  onChange={(e) => setSelectedClueForLink(e.target.value)}
                  className="text-xs p-2 rounded-lg border border-slate-200 focus:outline-none focus:ring-1 focus:ring-purple-400"
                >
                  <option value="">-- 选择已获物证 --</option>
                  {discoveredClues.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>

                <select
                  value={selectedTargetSuspect}
                  onChange={(e) => setSelectedTargetSuspect(e.target.value as SuspectId)}
                  className="text-xs p-2 rounded-lg border border-slate-200 focus:outline-none focus:ring-1 focus:ring-purple-400"
                >
                  {SUSPECTS.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name} ({s.title.slice(0, 4)})
                    </option>
                  ))}
                </select>
              </div>

              <input
                type="text"
                value={linkNote}
                onChange={(e) => setLinkNote(e.target.value)}
                placeholder="推论批注（例：22:12备用卡开门排除周衡，直指许宁）"
                className="w-full text-xs p-2 rounded-lg border border-slate-200 mb-2 focus:outline-none focus:ring-1 focus:ring-purple-400"
              />

              <button
                onClick={handleCreateLink}
                disabled={!selectedClueForLink}
                className="w-full py-1.5 rounded-lg bg-purple-600 text-white text-xs font-semibold hover:bg-purple-700 disabled:opacity-40 transition"
              >
                绑定至推论关系网
              </button>
            </div>

            {/* List of active links */}
            <div className="space-y-2">
              {clueLinks.length === 0 ? (
                <p className="text-xs text-center text-slate-400 py-6">
                  暂无物证与嫌疑人的关联推论。出示证物或点击上方快速关联。
                </p>
              ) : (
                clueLinks.map((link, idx) => {
                  const clue = CLUES.find((c) => c.id === link.clueId);
                  const suspect = SUSPECTS.find((s) => s.id === link.targetId);
                  return (
                    <div
                      key={idx}
                      className="p-3 bg-white rounded-xl border border-slate-200 flex items-start justify-between"
                    >
                      <div>
                        <div className="flex items-center space-x-1.5 text-xs">
                          <span className="font-bold text-slate-800">{clue?.name || link.clueId}</span>
                          <span className="text-slate-400">-&gt;</span>
                          <span
                            className="font-bold px-1.5 py-0.2 rounded-md text-white text-[11px]"
                            style={{ backgroundColor: suspect?.avatarColor || '#64748b' }}
                          >
                            {suspect?.name || link.targetId}
                          </span>
                        </div>
                        {link.note && (
                          <p className="text-xs text-slate-600 mt-1.5 italic bg-slate-50 p-1.5 rounded-lg">
                            “{link.note}”
                          </p>
                        )}
                      </div>
                      <button
                        onClick={() => onRemoveClueLink?.(link.clueId, link.targetId)}
                        className="text-slate-400 hover:text-red-500 p-1 transition"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        )}

        {/* Tab 4: Detective Notes */}
        {activeTab === 'notes' && (
          <div className="h-full flex flex-col">
            <textarea
              value={playerNotes}
              onChange={(e) => onSaveNotes(e.target.value)}
              placeholder="在此记录你的破案推演笔记、各人不在场证明疑点与密室手法猜想……（实时自动保存）"
              className="flex-1 w-full text-xs p-3.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-200 resize-none font-mono leading-relaxed bg-white text-slate-800"
            />
            <div className="mt-2 text-[10px] text-slate-400 text-right">
              已启用客户端实时自动暂存
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
