import React, { useState } from 'react';
import { SuspectId } from '../types/game';
import { SUSPECTS } from '../data/caseData';
import { ShieldCheck, Check, AlertOctagon, HelpCircle } from 'lucide-react';

interface VoteModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmitVote: (suspectId: SuspectId, reason: string) => void;
  themeMode?: 'dark' | 'light';
}

export const VoteModal: React.FC<VoteModalProps> = ({
  isOpen,
  onClose,
  onSubmitVote,
  themeMode = 'dark',
}) => {
  const [selectedSuspect, setSelectedSuspect] = useState<SuspectId>('xu_ning');
  const [method, setMethod] = useState<string>('blunt_force_locked_room');
  const [reason, setReason] = useState<string>('');

  const isDark = themeMode === 'dark';

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const fullReason = `${reason.trim() || '依据 22:15 怀表时间差与修复室高强尼龙线反锁机制'} [行凶手段: ${
      method === 'blunt_force_locked_room'
        ? '青铜镇纸钝击+排风窗密室'
        : method === 'poison'
        ? '香槟镇静剂毒杀'
        : '盗窃搏斗勒毙'
    }]`;
    onSubmitVote(selectedSuspect, fullReason);
    onClose();
  };

  return (
    <div className={`fixed inset-0 z-50 backdrop-blur-sm flex items-center justify-center p-4 ${
      isDark ? 'bg-black/80' : 'bg-stone-900/60'
    }`}>
      <div className={`rounded-3xl max-w-xl w-full shadow-2xl border overflow-hidden font-serif transition-colors duration-300 ${
        isDark
          ? 'bg-[#181411] border-[#3B3027] text-[#F3EFEA]'
          : 'bg-[#FAF7F2] border-[#E0D5C7] text-[#1C1917]'
      }`}>
        {/* Header */}
        <div className={`p-6 border-b flex items-center justify-between ${
          isDark
            ? 'border-[#3B3027] bg-[#130F0D]'
            : 'border-[#E8DFD5] bg-[#F5EFE6]'
        }`}>
          <div className="flex items-center space-x-2.5">
            <div className={`w-9 h-9 rounded-xl text-white flex items-center justify-center shadow-xs ${
              isDark ? 'bg-[#A44A4A]' : 'bg-[#8B3A2B]'
            }`}>
              <AlertOctagon className="w-5 h-5" />
            </div>
            <div>
              <h3 className={`font-extrabold text-base ${isDark ? 'text-[#F3EFEA]' : 'text-[#1C1917]'}`}>
                全员指控投票 · 终极指认
              </h3>
              <p className={`text-xs ${isDark ? 'text-[#AFA49A]' : 'text-[#786B60]'}`}>
                请根据已掌握的全部物证与时间线矛盾，投出你认定的真凶！
              </p>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {/* 1. Pick Suspect */}
          <div>
            <label className={`text-xs font-bold block mb-2 ${isDark ? 'text-[#F3EFEA]' : 'text-[#1C1917]'}`}>
              1. 指认谁是杀害策展人陈默的真凶？
            </label>
            <div className="grid grid-cols-2 gap-2.5">
              {SUSPECTS.map((s) => {
                const isChosen = selectedSuspect === s.id;
                return (
                  <button
                    type="button"
                    key={s.id}
                    onClick={() => setSelectedSuspect(s.id)}
                    className={`p-3 rounded-2xl border transition text-left flex items-center space-x-3 cursor-pointer ${
                      isChosen
                        ? isDark
                          ? 'border-[#C9942D] bg-[#241B15] ring-1 ring-[#C9942D]/40 shadow-xs'
                          : 'border-[#8B3A2B] bg-[#F7EFE9] ring-1 ring-[#8B3A2B]/40 shadow-xs'
                        : isDark
                        ? 'border-[#3B3027] bg-[#14100E] hover:border-[#524135]'
                        : 'border-[#E0D5C7] bg-white hover:border-[#8B3A2B]/60'
                    }`}
                  >
                    <img
                      src={s.avatarImage || `/assets/portraits/${s.id}.jpg`}
                      alt={s.name}
                      className={`w-10 h-10 rounded-xl object-cover object-top shrink-0 shadow-xs border ${
                        isDark ? 'border-[#3B3027]' : 'border-[#E0D5C7]'
                      }`}
                    />
                    <div className="flex-1">
                      <div className={`text-xs font-bold ${isDark ? 'text-[#F3EFEA]' : 'text-[#1C1917]'}`}>
                        {s.name}
                      </div>
                      <div className={`text-[11px] ${isDark ? 'text-[#AFA49A]' : 'text-[#786B60]'}`}>
                        {s.title.slice(0, 6)}
                      </div>
                    </div>
                    {isChosen && (
                      <Check className={`w-4 h-4 shrink-0 ${isDark ? 'text-[#C9942D]' : 'text-[#8B3A2B]'}`} />
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* 2. Pick Modus Operandi */}
          <div>
            <label className={`text-xs font-bold block mb-2 ${isDark ? 'text-[#F3EFEA]' : 'text-[#1C1917]'}`}>
              2. 判定其行凶手段与诡计：
            </label>
            <div className="space-y-1.5 text-xs">
              {[
                {
                  id: 'blunt_force_locked_room',
                  title: '青铜镇纸后脑重击 + 排风窗尼龙线反锁机关',
                  desc: '22:15 钝击致死，反锁房门后从通风窗拉线抽拉窗栓逃脱。',
                },
                {
                  id: 'poison',
                  title: '香槟酒杯投放佐匹克隆镇静剂直接毒杀',
                  desc: '利用酒会下毒，被害人由于药物过量暴毙于修复室内。',
                },
                {
                  id: 'robbery_strangle',
                  title: '入室盗窃公款被撞破后的冲动行凶',
                  desc: '因十万元欠款纠纷引发推搡，趁乱反锁逃窜。',
                },
              ].map((opt) => (
                <label
                  key={opt.id}
                  className={`p-3 rounded-xl border flex items-start space-x-2.5 cursor-pointer transition ${
                    method === opt.id
                      ? isDark
                        ? 'border-[#C9942D] bg-[#241B15]'
                        : 'border-[#8B3A2B] bg-[#F7EFE9]'
                      : isDark
                      ? 'border-[#3B3027] bg-[#14100E] hover:border-[#524135]'
                      : 'border-[#E0D5C7] bg-white hover:border-[#8B3A2B]/60'
                  }`}
                >
                  <input
                    type="radio"
                    name="method"
                    value={opt.id}
                    checked={method === opt.id}
                    onChange={(e) => setMethod(e.target.value)}
                    className={`mt-0.5 ${isDark ? 'accent-[#C9942D]' : 'accent-[#8B3A2B]'}`}
                  />
                  <div>
                    <div className={`font-bold ${isDark ? 'text-[#F3EFEA]' : 'text-[#1C1917]'}`}>
                      {opt.title}
                    </div>
                    <div className={`text-[11px] mt-0.5 ${isDark ? 'text-[#AFA49A]' : 'text-[#786B60]'}`}>
                      {opt.desc}
                    </div>
                  </div>
                </label>
              ))}
            </div>
          </div>

          {/* 3. Reason & deduction logic */}
          <div>
            <label className={`text-xs font-bold block mb-1 ${isDark ? 'text-[#F3EFEA]' : 'text-[#1C1917]'}`}>
              3. 核心证据链与推论陈述：
            </label>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="列出你定罪的证据链（如：怀表22:15、备用钥匙卡22:12、尼龙线痕迹与替身画师动机）……"
              className={`w-full text-xs p-3 rounded-xl border focus:outline-none h-20 resize-none font-serif ${
                isDark
                  ? 'bg-[#0F0C0A] border-[#3B3027] focus:border-[#C9942D]/70 text-[#F3EFEA] placeholder-[#73675E]'
                  : 'bg-white border-[#E0D5C7] focus:border-[#8B3A2B] text-[#1C1917] placeholder-stone-400'
              }`}
            />
          </div>

          {/* Submit buttons */}
          <div className={`flex items-center justify-end space-x-3 pt-3 border-t ${
            isDark ? 'border-[#3B3027]' : 'border-[#E8DFD5]'
          }`}>
            <button
              type="button"
              onClick={onClose}
              className={`px-4 py-2 text-xs font-semibold transition cursor-pointer ${
                isDark ? 'text-[#AFA49A] hover:text-[#F3EFEA]' : 'text-[#786B60] hover:text-[#1C1917]'
              }`}
            >
              稍后投票
            </button>
            <button
              type="submit"
              className={`px-6 py-2.5 text-xs font-bold rounded-xl transition shadow-md flex items-center space-x-1.5 cursor-pointer border ${
                isDark
                  ? 'bg-[#A44A4A] text-[#F8F6F0] hover:bg-[#8F3D3D] border-[#B85656]'
                  : 'bg-[#8B3A2B] text-white hover:bg-[#722F22] border-[#8B3A2B]'
              }`}
            >
              <ShieldCheck className={`w-4 h-4 ${isDark ? 'text-[#C9942D]' : 'text-amber-200'}`} />
              <span>确认提交指控投票</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
