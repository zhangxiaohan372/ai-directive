import React, { useEffect } from 'react';
import confetti from 'canvas-confetti';
import { RoomState, SuspectId } from '../types/game';
import { evaluateVerdict } from '../game/engine';
import {
  SUSPECTS,
  CLUES,
  ERRONEOUS_PATHS,
  TRUE_DEDUCTION_CHAIN,
  CASE_META,
} from '../data/caseData';
import {
  Award,
  AlertTriangle,
  CheckCircle,
  HelpCircle,
  Shield,
  FileCheck2,
  TrendingUp,
  RotateCcw,
  Sparkles,
  ArrowRight,
} from 'lucide-react';

interface TruthReviewProps {
  roomState: RoomState;
  onRestart: () => void;
  themeMode?: 'dark' | 'light';
}

export const TruthReview: React.FC<TruthReviewProps> = ({
  roomState,
  onRestart,
  themeMode = 'dark',
}) => {
  const verdict = evaluateVerdict(roomState);
  const isDark = themeMode === 'dark';

  useEffect(() => {
    if (verdict.isSolved) {
      try {
        confetti({
          particleCount: 80,
          spread: 70,
          origin: { y: 0.6 },
          colors: ['#FB7185', '#38BDF8', '#C084FC', '#F59E0B'],
        });
      } catch {}
    }
  }, [verdict.isSolved]);

  const culprit = SUSPECTS.find((s) => s.id === TRUE_DEDUCTION_CHAIN.culprit);
  const missedClues = CLUES.filter(
    (c) => c.isCrucial && !roomState.discoveredClueIds.includes(c.id)
  );

  return (
    <div className="max-w-5xl mx-auto p-4 md:p-6 space-y-6 font-serif">
      {/* 1. Header Banner */}
      <div
        className={`rounded-3xl p-6 md:p-8 text-white shadow-xl relative overflow-hidden border ${
          isDark ? 'border-[#3B3027]' : 'border-[#E0D5C7]'
        } ${
          verdict.isSolved
            ? isDark
              ? 'bg-gradient-to-br from-[#1E2E20] via-[#1A261B] to-[#0C0A09]'
              : 'bg-gradient-to-br from-[#2E4830] via-[#3B5B3E] to-[#1E3020]'
            : isDark
            ? 'bg-gradient-to-br from-[#3B1919] via-[#241313] to-[#0C0A09]'
            : 'bg-gradient-to-br from-[#8B3A2B] via-[#70281C] to-[#501A10]'
        }`}
      >
        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center space-x-2 text-xs font-bold uppercase tracking-wider text-[#C9942D] mb-2">
              <Award className="w-4 h-4" />
              <span>全案真相推演复盘报告</span>
            </div>
            <h1 className="text-2xl md:text-3xl font-extrabold text-[#F3EFEA]">
              {verdict.isSolved
                ? '完美破案！成功勘破午夜画廊密室诡计！'
                : '推理未能定罪：真凶瞒过了侦探团！'}
            </h1>
            <p className="text-xs md:text-sm text-[#AFA49A] mt-2 max-w-2xl leading-relaxed">
              {verdict.isSolved
                ? `侦探团队准确识别了关键致命时间差（22:15）与备用钥匙卡刷卡记录，锁定了真凶【${culprit?.name}】！`
                : `指控出现了偏差或被伪造的假象误导。真正的凶手是受害人长期剥削压迫的助理【${culprit?.name}】！`}
            </p>
          </div>

          <button
            onClick={onRestart}
            className="px-5 py-2.5 rounded-xl bg-[#C9942D] hover:bg-[#B38325] text-[#0C0A09] font-bold text-xs transition shadow-md flex items-center space-x-1.5 shrink-0 cursor-pointer"
          >
            <RotateCcw className="w-4 h-4" />
            <span>开启新案件局</span>
          </button>
        </div>
      </div>

      {/* 2. Visual Scores & Deduction Metrics Bar */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Metric 1: Spoiler Control */}
        <div className={`p-5 rounded-2xl border shadow-xs flex flex-col justify-between ${
          isDark
            ? 'bg-[#181411] border-[#3B3027]'
            : 'bg-[#FAF7F2] border-[#E0D5C7]'
        }`}>
          <div className="flex items-center justify-between">
            <span className={`text-xs font-bold ${isDark ? 'text-[#AFA49A]' : 'text-[#786B60]'}`}>AI 剧透控制评分</span>
            <Shield className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="my-3">
            <div className={`text-3xl font-extrabold ${isDark ? 'text-[#F3EFEA]' : 'text-[#1C1917]'}`}>
              {verdict.spoilerControlScore}
              <span className={`text-sm font-semibold ${isDark ? 'text-[#8E8378]' : 'text-[#8C7E72]'}`}> / 100</span>
            </div>
            <div className={`w-full h-2 rounded-full mt-2 overflow-hidden border ${
              isDark ? 'bg-[#100D0B] border-[#3B3027]' : 'bg-[#E8DFD5] border-[#E0D5C7]'
            }`}>
              <div
                className="bg-emerald-500 h-full rounded-full transition-all duration-500"
                style={{ width: `${verdict.spoilerControlScore}%` }}
              />
            </div>
          </div>
          <p className={`text-[11px] ${isDark ? 'text-[#8E8378]' : 'text-[#8C7E72]'}`}>
            RAG 权限隔离成功拦截 {roomState.spoilerInterceptions.length} 次潜在泄密
          </p>
        </div>

        {/* Metric 2: Clue Utilization Rate */}
        <div className={`p-5 rounded-2xl border shadow-xs flex flex-col justify-between ${
          isDark
            ? 'bg-[#181411] border-[#3B3027]'
            : 'bg-[#FAF7F2] border-[#E0D5C7]'
        }`}>
          <div className="flex items-center justify-between">
            <span className={`text-xs font-bold ${isDark ? 'text-[#AFA49A]' : 'text-[#786B60]'}`}>关键物证利用率</span>
            <FileCheck2 className={`w-4 h-4 ${isDark ? 'text-[#C9942D]' : 'text-[#8B3A2B]'}`} />
          </div>
          <div className="my-3">
            <div className={`text-3xl font-extrabold ${isDark ? 'text-[#F3EFEA]' : 'text-[#1C1917]'}`}>
              {verdict.clueUtilizationRate}%
            </div>
            <div className={`w-full h-2 rounded-full mt-2 overflow-hidden border ${
              isDark ? 'bg-[#100D0B] border-[#3B3027]' : 'bg-[#E8DFD5] border-[#E0D5C7]'
            }`}>
              <div
                className={`h-full rounded-full transition-all duration-500 ${
                  isDark ? 'bg-[#C9942D]' : 'bg-[#8B3A2B]'
                }`}
                style={{ width: `${verdict.clueUtilizationRate}%` }}
              />
            </div>
          </div>
          <p className={`text-[11px] ${isDark ? 'text-[#8E8378]' : 'text-[#8C7E72]'}`}>
            已探索线索 {roomState.discoveredClueIds.length} 件 / 共 8 件
          </p>
        </div>

        {/* Metric 3: Team Accuracy */}
        <div className={`p-5 rounded-2xl border shadow-xs flex flex-col justify-between ${
          isDark
            ? 'bg-[#181411] border-[#3B3027]'
            : 'bg-[#FAF7F2] border-[#E0D5C7]'
        }`}>
          <div className="flex items-center justify-between">
            <span className={`text-xs font-bold ${isDark ? 'text-[#AFA49A]' : 'text-[#786B60]'}`}>指控命中与投票率</span>
            <TrendingUp className="w-4 h-4 text-purple-500" />
          </div>
          <div className="my-3">
            <div className={`text-3xl font-extrabold ${isDark ? 'text-[#F3EFEA]' : 'text-[#1C1917]'}`}>
              {verdict.accuracyRate}%
            </div>
            <div className={`w-full h-2 rounded-full mt-2 overflow-hidden border ${
              isDark ? 'bg-[#100D0B] border-[#3B3027]' : 'bg-[#E8DFD5] border-[#E0D5C7]'
            }`}>
              <div
                className="bg-purple-500 h-full rounded-full transition-all duration-500"
                style={{ width: `${verdict.accuracyRate}%` }}
              />
            </div>
          </div>
          <p className={`text-[11px] ${isDark ? 'text-[#8E8378]' : 'text-[#8C7E72]'}`}>
            多数票判定：{SUSPECTS.find((s) => s.id === verdict.majoritySuspectId)?.name}
          </p>
        </div>
      </div>

      {/* 3. The Whole Truth & Mechanism Unfolding */}
      <div className={`p-6 rounded-3xl border shadow-sm space-y-4 ${
        isDark
          ? 'bg-[#181411] border-[#3B3027]'
          : 'bg-[#FAF7F2] border-[#E0D5C7]'
      }`}>
        <h3 className={`font-extrabold text-base flex items-center space-x-2 ${
          isDark ? 'text-[#F3EFEA]' : 'text-[#1C1917]'
        }`}>
          <Sparkles className={`w-4 h-4 ${isDark ? 'text-[#C9942D]' : 'text-[#8B3A2B]'}`} />
          <span>全案完整真相与密室推演（The Verifiable Truth）</span>
        </h3>

        <div className={`p-4 rounded-2xl border text-xs md:text-sm leading-relaxed space-y-2 ${
          isDark
            ? 'bg-[#130F0D] border-[#3B3027] text-[#D8CFC5]'
            : 'bg-white border-[#E0D5C7] text-[#44382F]'
        }`}>
          <p>
            <strong>【真凶身份】：</strong>
            <span className={`font-bold ${isDark ? 'text-[#E58888]' : 'text-[#8B3A2B]'}`}>画廊助理兼修复师 许宁</span>
          </p>
          <p>
            <strong>【深层杀意与动机】：</strong>
            许宁才是知名画家林岚名下所有成名画作的真正原创画师！策展人陈默长期残酷剽窃掠夺许宁的艺术才华充当“影子画师”。今晚陈默意欲将她开除，并试图借故收缴其修复手稿，将二人彻底扫地出门。
          </p>
          <p>
            <strong>【致命案发过程（22:12 - 22:15）】：</strong>
            22:00 周衡因查出假画与陈默发生激烈争吵，并在香槟里投放了安眠镇静剂；22:05 林岚闯入争论署名权打翻颜料后痛哭跑出大厅。22:12，许宁持藏在抽屉暗层的备用门禁卡刷开修复室，本欲讨回公道，却遭昏昏欲睡的陈默傲慢侮辱。激愤之下，许宁抓起修复台上的青铜重型镇纸猛击陈默后脑及太阳穴致死，死者怀表在撞击中粉碎并永远停摆在
            <strong className={isDark ? 'text-[#C9942D]' : 'text-[#8B3A2B]'}> 22:15</strong>。
          </p>
          <p>
            <strong>【密室反锁诡计（22:16 - 22:20）】：</strong>
            由于正门只能从内部手动转动旋钮反锁，许宁踩着修复台翻出高处排气窗，将预先绑在内侧窗栓上的极细尼龙钓鱼线经由外廊拉扯，使窗栓自弹回扣，随后抽回钓鱼线伪造成绝命密室，并将林岚画架上的镉红松节油布条丢在门缝栽赃！
          </p>
        </div>

        {/* Best Deduction Chain Visual Nodes */}
        <div className={`mt-4 pt-3 border-t ${isDark ? 'border-[#3B3027]' : 'border-[#E8DFD5]'}`}>
          <span className={`text-xs font-bold block mb-2 ${isDark ? 'text-[#AFA49A]' : 'text-[#786B60]'}`}>
            最佳证据链闭环推导图谱：
          </span>
          <div className="flex flex-wrap items-center gap-2 text-xs">
            {TRUE_DEDUCTION_CHAIN.evidenceChain.map((clueId, idx) => {
              const clue = CLUES.find((c) => c.id === clueId);
              return (
                <React.Fragment key={clueId}>
                  <div className={`px-3 py-1.5 rounded-xl font-semibold border ${
                    isDark
                      ? 'bg-[#251D17] text-[#C9942D] border-[#3B3027]'
                      : 'bg-white text-[#8B3A2B] border-[#E0D5C7]'
                  }`}>
                    {clue?.name}
                  </div>
                  {idx < TRUE_DEDUCTION_CHAIN.evidenceChain.length - 1 && (
                    <ArrowRight className={`w-3.5 h-3.5 shrink-0 ${isDark ? 'text-[#8E8378]' : 'text-[#8C7E72]'}`} />
                  )}
                </React.Fragment>
              );
            })}
          </div>
        </div>
      </div>

      {/* 4. Three Erroneous Deduction Paths (Red Herrings Breakdown) */}
      <div className={`p-6 rounded-3xl border shadow-sm space-y-4 ${
        isDark
          ? 'bg-[#181411] border-[#3B3027]'
          : 'bg-[#FAF7F2] border-[#E0D5C7]'
      }`}>
        <h3 className={`font-extrabold text-base flex items-center space-x-2 ${
          isDark ? 'text-[#F3EFEA]' : 'text-[#1C1917]'
        }`}>
          <AlertTriangle className={`w-4 h-4 ${isDark ? 'text-[#A44A4A]' : 'text-[#8B3A2B]'}`} />
          <span>三大误导性推理路径深度剖析（Red Herrings）</span>
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
          {ERRONEOUS_PATHS.map((path, idx) => (
            <div
              key={idx}
              className={`p-4 rounded-2xl border flex flex-col justify-between ${
                isDark
                  ? 'bg-[#130F0D] border-[#3B3027]'
                  : 'bg-white border-[#E0D5C7]'
              }`}
            >
              <div>
                <h4 className={`text-xs font-bold mb-1.5 ${isDark ? 'text-[#F3EFEA]' : 'text-[#1C1917]'}`}>{path.name}</h4>
                <div className={`text-[11px] mb-2 ${isDark ? 'text-[#AFA49A]' : 'text-[#786B60]'}`}>
                  <span className={`font-semibold ${isDark ? 'text-[#D8CFC5]' : 'text-[#1C1917]'}`}>表面假设：</span>
                  {path.theory}
                </div>
                <div className={`text-[11px] p-2 rounded-xl border ${
                  isDark
                    ? 'text-[#E58888] bg-[#2E1414] border-[#592626]'
                    : 'text-[#8B3A2B] bg-rose-50 border-rose-200'
                }`}>
                  <span className="font-bold">逻辑破绽：</span>
                  {path.flaw}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 5. Team Votes & Missed Clues */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Votes Summary */}
        <div className={`p-5 rounded-2xl border shadow-xs ${
          isDark ? 'bg-[#181411] border-[#3B3027]' : 'bg-[#FAF7F2] border-[#E0D5C7]'
        }`}>
          <h4 className={`text-xs font-bold mb-3 ${isDark ? 'text-[#F3EFEA]' : 'text-[#1C1917]'}`}>玩家最终指控记录：</h4>
          <div className="space-y-2 text-xs">
            {Object.entries(roomState.votes).map(([pId, voteData]) => {
              const player = roomState.players.find((p) => p.id === pId);
              const suspect = SUSPECTS.find((s) => s.id === voteData.suspectId);
              const isCorrect = voteData.suspectId === TRUE_DEDUCTION_CHAIN.culprit;
              return (
                <div
                  key={pId}
                  className={`p-2.5 rounded-xl border flex items-center justify-between ${
                    isDark
                      ? 'border-[#3B3027] bg-[#130F0D]'
                      : 'border-[#E0D5C7] bg-white'
                  }`}
                >
                  <div>
                    <span className={`font-bold ${isDark ? 'text-[#F3EFEA]' : 'text-[#1C1917]'}`}>{player?.name || pId}</span>
                    <span className={`mx-1.5 ${isDark ? 'text-[#8E8378]' : 'text-[#8C7E72]'}`}>指认</span>
                    <span
                      className="font-bold px-1.5 py-0.5 rounded text-white text-[11px]"
                      style={{ backgroundColor: suspect?.avatarColor }}
                    >
                      {suspect?.name}
                    </span>
                  </div>
                  <span
                    className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                      isCorrect
                        ? isDark
                          ? 'bg-emerald-950/80 text-emerald-300 border border-emerald-800'
                          : 'bg-emerald-50 text-emerald-700 border border-emerald-300'
                        : isDark
                        ? 'bg-rose-950/80 text-rose-300 border border-rose-800'
                        : 'bg-rose-50 text-rose-700 border border-rose-300'
                    }`}
                  >
                    {isCorrect ? '指认正确' : '指认错误'}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Missed Clues */}
        <div className={`p-5 rounded-2xl border shadow-xs ${
          isDark ? 'bg-[#181411] border-[#3B3027]' : 'bg-[#FAF7F2] border-[#E0D5C7]'
        }`}>
          <h4 className={`text-xs font-bold mb-3 ${isDark ? 'text-[#F3EFEA]' : 'text-[#1C1917]'}`}>遗漏未解的关键物证：</h4>
          {missedClues.length === 0 ? (
            <div className={`p-4 text-center text-xs rounded-xl font-medium border ${
              isDark
                ? 'text-emerald-400 bg-emerald-950/40 border-emerald-900/50'
                : 'text-emerald-700 bg-emerald-50 border-emerald-200'
            }`}>
              全场所有关键铁证均已被侦探团队搜查提取完毕！
            </div>
          ) : (
            <div className="space-y-2 text-xs">
              {missedClues.map((c) => (
                <div
                  key={c.id}
                  className={`p-2.5 rounded-xl border flex items-center justify-between ${
                    isDark
                      ? 'border-[#3B3027] bg-[#14100E]'
                      : 'border-[#E0D5C7] bg-white'
                  }`}
                >
                  <span className={`font-bold ${isDark ? 'text-[#C9942D]' : 'text-[#8B3A2B]'}`}>{c.name}</span>
                  <span className={`text-[10px] ${isDark ? 'text-[#AFA49A]' : 'text-[#786B60]'}`}>{c.shortDesc.slice(0, 20)}...</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
