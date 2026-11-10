/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from 'react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  CartesianGrid,
  RadarChart,
  Radar,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  ReferenceLine,
} from 'recharts';
import {
  ShieldCheck,
  AlertTriangle,
  Scale,
  Sparkles,
  CheckCircle2,
  XCircle,
  HelpCircle,
  FileText,
  Key,
  Users,
  Clock,
  ArrowRight,
  RotateCcw,
  Sliders,
  ChevronDown,
  Lock,
  Search,
  ExternalLink,
  Target,
} from 'lucide-react';
import { StudioCaseData } from './types';
import {
  calculateSuspectEvidenceProfiles,
  buildClueCorrelationMatrix,
  buildRadarInferenceData,
  evaluateInferenceRigor,
  SuspectEvidenceProfile,
  ClueAssociationCell,
} from './evidenceLogicEngine';
import { sound } from '../../utils/audio';

interface LogicVerificationViewProps {
  caseData: StudioCaseData;
  isDark: boolean;
  onTriggerSelfRepair?: () => void;
  onNavigateToSection?: (section: 'OUTLINE' | 'SUSPECTS' | 'SCENES' | 'CLUES' | 'TIMELINE') => void;
}

export const LogicVerificationView: React.FC<LogicVerificationViewProps> = ({
  caseData,
  isDark,
  onTriggerSelfRepair,
  onNavigateToSection,
}) => {
  // Active sub-tab inside logic verification
  const [activeTab, setActiveTab] = useState<'OVERVIEW' | 'MATRIX' | 'TRIAL'>('OVERVIEW');
  const [selectedSuspectId, setSelectedSuspectId] = useState<string>(caseData.trueCulpritId);
  const [selectedCell, setSelectedCell] = useState<ClueAssociationCell | null>(null);

  // Simulated trial verdict state
  const [trialSuspectId, setTrialSuspectId] = useState<string>(caseData.trueCulpritId);
  const [trialResult, setTrialResult] = useState<{
    verdict: 'CONVICTED' | 'ACQUITTED';
    title: string;
    reason: string;
    supportingClues: string[];
  } | null>(null);

  // Calculate pure logic profiles and rigor metrics
  const profiles = useMemo(
    () => calculateSuspectEvidenceProfiles(caseData.clues, caseData.suspects, caseData.trueCulpritId),
    [caseData]
  );

  const correlationMatrix = useMemo(
    () => buildClueCorrelationMatrix(caseData.clues, caseData.suspects, caseData.trueCulpritId),
    [caseData]
  );

  const radarData = useMemo(
    () => buildRadarInferenceData(caseData.suspects, caseData.clues, caseData.trueCulpritId),
    [caseData]
  );

  const rigorResult = useMemo(
    () => evaluateInferenceRigor(caseData),
    [caseData]
  );

  // Stacked Bar Data for Recharts
  const barChartData = useMemo(() => {
    return profiles.map((p) => ({
      name: p.name,
      title: p.title,
      isTrueCulprit: p.isTrueCulprit,
      '核心致命铁证': p.crucialEvidenceWeight,
      '动机与文书证据': p.motiveEvidenceWeight,
      '环境痕迹与旁证': p.circumstantialWeight,
      '不在场脱罪权重': p.exculpatoryWeight,
      totalScore: p.totalInculpationScore,
      statusLabel: p.statusLabel,
    }));
  }, [profiles]);

  // Color palette based on theme
  const colors = {
    crucial: isDark ? '#EF4444' : '#DC2626',
    motive: isDark ? '#C084FC' : '#9333EA',
    circumstantial: isDark ? '#38BDF8' : '#0284C7',
    exculpatory: isDark ? '#34D399' : '#059669',
    gold: isDark ? '#DFB36C' : '#8B3A2B',
    grid: isDark ? '#261D15' : '#E8DFD5',
    tooltipBg: isDark ? '#1C150F' : '#FFFFFF',
    tooltipBorder: isDark ? '#3E2E1E' : '#E2D8CC',
  };

  const handleRunSimulatedTrial = (suspectId: string) => {
    sound.playClueFound();
    const suspect = caseData.suspects.find((s) => s.id === suspectId);
    if (!suspect) return;

    const isCulprit = suspectId === caseData.trueCulpritId;
    const profile = profiles.find((p) => p.suspectId === suspectId);
    const linkedClues = caseData.clues.filter((c) =>
      (c.connectedSuspects as string[])?.includes(suspectId) || (c as any).relatedSuspectIds?.includes(suspectId)
    );

    if (isCulprit && (!caseData.validationReport || caseData.validationReport.isValid)) {
      setTrialResult({
        verdict: 'CONVICTED',
        title: `法庭裁决：${suspect.name} 故意杀害策展人陈默 罪名成立`,
        reason: `公诉方出示的证据链形成了唯一闭环：22:12 备用门禁卡刷卡记录排他性锁定了物理权限；现场抹布与尼龙暗线破坏了反锁假象；策展人加密手记证实了致命动机。辩方提出的不在场证明被客观物证全数驳回，达到排除一切合理怀疑的定罪标准。`,
        supportingClues: linkedClues.map((c) => c.name),
      });
    } else if (isCulprit && caseData.validationReport && !caseData.validationReport.isValid) {
      setTrialResult({
        verdict: 'ACQUITTED',
        title: `法庭裁决：指控暂时中止 · 证据链存在未解悖论`,
        reason: `虽然针对 ${suspect.name} 存在重大作案嫌疑，但目前案卷时间线或物理密室存在 ${caseData.validationReport.conflicts.length} 处硬逻辑冲突。在自愈修复前，该指控因程序性疑点无法形成排他性定罪。`,
        supportingClues: linkedClues.map((c) => c.name),
      });
    } else {
      setTrialResult({
        verdict: 'ACQUITTED',
        title: `法庭裁决：${suspect.name} 无罪释放 · 疑罪从无`,
        reason: `虽然其与死者存在矛盾或动机嫌疑，但缺乏致命凶器或第一现场进出物理铁证；且其在案发关键时间窗口内具备第三方目击或客观监控证明，不构成杀人罪定罪要件。`,
        supportingClues: linkedClues.map((c) => c.name),
      });
    }
  };

  return (
    <div className="space-y-6 animate-fadeIn pb-12">
      {/* 1. TOP HEADER & RIGOR SCORE BANNER */}
      <div
        className={`rounded-2xl p-6 border shadow-sm transition-colors ${
          isDark
            ? 'bg-gradient-to-br from-[#1C150F] via-[#140F0B] to-[#0D0A08] border-[#3E2D1E]'
            : 'bg-gradient-to-br from-[#FAF5EE] via-[#F5ECE1] to-[#EFE2D2] border-[#E2D2BF]'
        }`}
      >
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <div className="flex items-center gap-3">
              <span
                className={`px-3 py-1 rounded-full text-xs font-mono font-bold tracking-wider uppercase border flex items-center gap-1.5 ${
                  rigorResult.verdict === 'RATIONALLY_SEALED'
                    ? isDark
                      ? 'bg-emerald-950/60 text-emerald-400 border-emerald-800/60'
                      : 'bg-emerald-100 text-emerald-800 border-emerald-300'
                    : rigorResult.verdict === 'WARNING_AMBIGUITY'
                    ? isDark
                      ? 'bg-amber-950/60 text-amber-400 border-amber-800/60'
                      : 'bg-amber-100 text-amber-800 border-amber-300'
                    : isDark
                    ? 'bg-rose-950/60 text-rose-400 border-rose-800/60'
                    : 'bg-rose-100 text-rose-800 border-rose-300'
                }`}
              >
                <Scale className="w-3.5 h-3.5" />
                <span>{rigorResult.verdictTitle}</span>
              </span>
              <span
                className={`text-xs font-mono ${
                  isDark ? 'text-[#8C765E]' : 'text-[#8C7E72]'
                }`}
              >
                案卷编号: {caseData.id}
              </span>
            </div>

            <h2
              className={`text-xl sm:text-2xl font-serif font-black tracking-wide ${
                isDark ? 'text-[#F3EFEA]' : 'text-[#2C241E]'
              }`}
            >
              案卷逻辑校验与推理严密性审查
            </h2>
            <p
              className={`text-xs sm:text-sm leading-relaxed ${
                isDark ? 'text-[#A89073]' : 'text-[#6E5F52]'
              }`}
            >
              {rigorResult.verdictDescription}
            </p>
          </div>

          {/* Right Score Pill */}
          <div className="flex items-center gap-4 shrink-0">
            <div
              className={`p-4 rounded-xl border text-center min-w-[130px] shadow-inner ${
                isDark
                  ? 'bg-[#150F0B] border-[#38281A]'
                  : 'bg-white border-[#E5DACD]'
              }`}
            >
              <div
                className={`text-[11px] font-mono uppercase tracking-wider ${
                  isDark ? 'text-[#8C765E]' : 'text-[#8C7E72]'
                }`}
              >
                严密性评分
              </div>
              <div
                className={`text-3xl font-serif font-black ${
                  rigorResult.overallRigorScore >= 85
                    ? isDark ? 'text-[#DFB36C]' : 'text-[#8B3A2B]'
                    : isDark ? 'text-amber-400' : 'text-amber-600'
                }`}
              >
                {rigorResult.overallRigorScore}
                <span className="text-xs font-sans font-normal opacity-60"> / 100</span>
              </div>
              <div className="text-[10px] font-mono mt-0.5 opacity-80">
                {rigorResult.isUniqueClosure ? '排他性闭环达标' : '待强化分差'}
              </div>
            </div>

            {/* If conflicts exist, trigger self-repair */}
            {caseData.validationReport && !caseData.validationReport.isValid && onTriggerSelfRepair && (
              <button
                onClick={onTriggerSelfRepair}
                className={`flex items-center gap-2 px-4 py-3 rounded-xl font-serif font-bold text-xs shadow-md transition cursor-pointer active:scale-95 ${
                  isDark
                    ? 'bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-500 hover:to-amber-600 text-stone-950'
                    : 'bg-[#8B3A2B] hover:bg-[#783023] text-white'
                }`}
              >
                <RotateCcw className="w-4 h-4" />
                <span>一键执行自愈修复</span>
              </button>
            )}
          </div>
        </div>

        {/* 4 Indicators Quick Bar */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6 pt-5 border-t border-dashed border-[#8C765E]/20">
          <div className="flex flex-col">
            <span className="text-[11px] opacity-70">定罪领先差 (Margin)</span>
            <span className="text-sm font-bold font-mono text-emerald-500">
              +{rigorResult.convictionMargin}%
            </span>
          </div>
          <div className="flex flex-col">
            <span className="text-[11px] opacity-70">核心物证覆盖率</span>
            <span className="text-sm font-bold font-mono">
              {rigorResult.crucialClueExclusiveRatio}%
            </span>
          </div>
          <div className="flex flex-col">
            <span className="text-[11px] opacity-70">无辜者误判防线</span>
            <span className={`text-sm font-bold font-mono ${rigorResult.innocentSafeguarded ? 'text-emerald-500' : 'text-amber-500'}`}>
              {rigorResult.innocentSafeguarded ? '全员脱罪保护' : '存在误判风险'}
            </span>
          </div>
          <div className="flex flex-col">
            <span className="text-[11px] opacity-70">密室物理自洽度</span>
            <span className={`text-sm font-bold font-mono ${(!caseData.validationReport || caseData.validationReport.isValid) ? 'text-emerald-500' : 'text-rose-500'}`}>
              {(!caseData.validationReport || caseData.validationReport.isValid) ? '100% 零冲突' : '有物理冲突'}
            </span>
          </div>
        </div>
      </div>

      {/* 2. SUB-NAVIGATION TABS */}
      <div className="flex items-center justify-between border-b border-[#8C765E]/20 pb-2">
        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              sound.playPaperRustle();
              setActiveTab('OVERVIEW');
            }}
            className={`px-4 py-2 rounded-xl text-xs font-serif font-bold transition cursor-pointer ${
              activeTab === 'OVERVIEW'
                ? isDark
                  ? 'bg-[#241A12] text-[#E5C384] border border-[#4E3725]'
                  : 'bg-white text-[#8B3A2B] border border-[#E2D2BF] shadow-xs'
                : isDark
                ? 'text-[#A89073] hover:text-[#E5C384]'
                : 'text-[#6E5F52] hover:text-[#8B3A2B]'
            }`}
          >
            证据强度与推理雷达
          </button>
          <button
            onClick={() => {
              sound.playPaperRustle();
              setActiveTab('MATRIX');
            }}
            className={`px-4 py-2 rounded-xl text-xs font-serif font-bold transition cursor-pointer ${
              activeTab === 'MATRIX'
                ? isDark
                  ? 'bg-[#241A12] text-[#E5C384] border border-[#4E3725]'
                  : 'bg-white text-[#8B3A2B] border border-[#E2D2BF] shadow-xs'
                : isDark
                ? 'text-[#A89073] hover:text-[#E5C384]'
                : 'text-[#6E5F52] hover:text-[#8B3A2B]'
            }`}
          >
            物证与涉案人关联矩阵
          </button>
          <button
            onClick={() => {
              sound.playPaperRustle();
              setActiveTab('TRIAL');
            }}
            className={`px-4 py-2 rounded-xl text-xs font-serif font-bold transition cursor-pointer ${
              activeTab === 'TRIAL'
                ? isDark
                  ? 'bg-[#241A12] text-[#E5C384] border border-[#4E3725]'
                  : 'bg-white text-[#8B3A2B] border border-[#E2D2BF] shadow-xs'
                : isDark
                ? 'text-[#A89073] hover:text-[#E5C384]'
                : 'text-[#6E5F52] hover:text-[#8B3A2B]'
            }`}
          >
            模拟法庭指控推演
          </button>
        </div>

        <div className="text-xs font-mono text-[#8C765E]">
          数据源: Recharts 确定性统计引擎
        </div>
      </div>

      {/* 3. TAB 1: OVERVIEW CHARTS (Stacked Bar + Radar) */}
      {activeTab === 'OVERVIEW' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Chart A: Recharts Stacked Bar Chart (嫌疑人证据关联强度分布) */}
            <div
              className={`lg:col-span-7 rounded-2xl p-5 border flex flex-col justify-between ${
                isDark ? 'bg-[#150F0B] border-[#2C2117]' : 'bg-white border-[#E8DFD5]'
              }`}
            >
              <div>
                <div className="flex items-center justify-between mb-2">
                  <h3
                    className={`font-serif font-bold text-sm tracking-wide flex items-center gap-2 ${
                      isDark ? 'text-[#F3EFEA]' : 'text-[#2C241E]'
                    }`}
                  >
                    <Target className={`w-4 h-4 ${isDark ? 'text-[#DFB36C]' : 'text-[#8B3A2B]'}`} />
                    <span>各嫌疑人证据关联强度分布 (Evidence Distribution)</span>
                  </h3>
                  <span className="text-[11px] font-mono text-emerald-500">
                    定罪门槛: 80分
                  </span>
                </div>
                <p
                  className={`text-xs mb-4 ${
                    isDark ? 'text-[#8C765E]' : 'text-[#8C7E72]'
                  }`}
                >
                  通过叠加计算决定性物证、深层动机、现场痕迹及不在场证据，检验真凶是否达成唯一定罪闭环。
                </p>
              </div>

              {/* Responsive Container for Recharts BarChart */}
              <div className="w-full h-[320px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={barChartData}
                    margin={{ top: 20, right: 30, left: 0, bottom: 25 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke={colors.grid} />
                    <XAxis
                      dataKey="name"
                      stroke={isDark ? '#A89073' : '#6E5F52'}
                      fontSize={12}
                      tickLine={false}
                    />
                    <YAxis
                      stroke={isDark ? '#A89073' : '#6E5F52'}
                      fontSize={11}
                      domain={[0, 100]}
                      tickLine={false}
                    />
                    <Tooltip
                      content={({ active, payload, label }) => {
                        if (active && payload && payload.length) {
                          const data = payload[0].payload;
                          return (
                            <div
                              className="p-3 rounded-xl shadow-xl text-xs space-y-1.5 border"
                              style={{
                                backgroundColor: colors.tooltipBg,
                                borderColor: colors.tooltipBorder,
                                color: isDark ? '#F3EFEA' : '#2C241E',
                              }}
                            >
                              <div className="font-bold font-serif flex items-center justify-between gap-4">
                                <span>{label} ({data.title})</span>
                                {data.isTrueCulprit && (
                                  <span className="px-1.5 py-0.5 rounded text-[10px] bg-red-500/20 text-red-400 font-mono">
                                    真实凶手
                                  </span>
                                )}
                              </div>
                              <div className="text-[11px] font-mono text-emerald-500">
                                综合定罪判定: {data.totalScore}分 · {data.statusLabel}
                              </div>
                              <div className="border-t border-[#8C765E]/20 pt-1.5 space-y-1">
                                {payload.map((entry, idx) => (
                                  <div key={idx} className="flex items-center justify-between gap-4">
                                    <span className="flex items-center gap-1.5">
                                      <span
                                        className="w-2 h-2 rounded-full"
                                        style={{ backgroundColor: entry.color }}
                                      />
                                      {entry.name}:
                                    </span>
                                    <span className="font-mono font-bold">{entry.value}%</span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          );
                        }
                        return null;
                      }}
                    />
                    <Legend wrapperStyle={{ fontSize: 11, paddingTop: 10 }} />
                    <ReferenceLine
                      y={80}
                      stroke={isDark ? '#E5C384' : '#8B3A2B'}
                      strokeDasharray="4 4"
                      label={{
                        value: '法庭唯一定罪线 (80)',
                        fill: isDark ? '#E5C384' : '#8B3A2B',
                        fontSize: 10,
                        position: 'top',
                      }}
                    />
                    <Bar dataKey="核心致命铁证" stackId="a" fill={colors.crucial} radius={[0, 0, 0, 0]} />
                    <Bar dataKey="动机与文书证据" stackId="a" fill={colors.motive} />
                    <Bar dataKey="环境痕迹与旁证" stackId="a" fill={colors.circumstantial} />
                    <Bar dataKey="不在场脱罪权重" stackId="b" fill={colors.exculpatory} radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Chart B: Recharts Radar Chart (五维推理判定雷达图) */}
            <div
              className={`lg:col-span-5 rounded-2xl p-5 border flex flex-col justify-between ${
                isDark ? 'bg-[#150F0B] border-[#2C2117]' : 'bg-white border-[#E8DFD5]'
              }`}
            >
              <div>
                <h3
                  className={`font-serif font-bold text-sm tracking-wide flex items-center gap-2 mb-1 ${
                    isDark ? 'text-[#F3EFEA]' : 'text-[#2C241E]'
                  }`}
                >
                  <Scale className={`w-4 h-4 ${isDark ? 'text-[#DFB36C]' : 'text-[#8B3A2B]'}`} />
                  <span>五维推理闭环雷达 (Inference Dimensions)</span>
                </h3>
                <p
                  className={`text-xs mb-3 ${
                    isDark ? 'text-[#8C765E]' : 'text-[#8C7E72]'
                  }`}
                >
                  对比真凶与主要嫌疑人在物证、动机、时空窗口及诡计可行度上的分化。
                </p>
              </div>

              {/* Radar Chart */}
              <div className="w-full h-[320px]">
                <ResponsiveContainer width="100%" height="100%">
                  <RadarChart cx="50%" cy="50%" outerRadius="75%" data={radarData}>
                    <PolarGrid stroke={colors.grid} />
                    <PolarAngleAxis
                      dataKey="subject"
                      stroke={isDark ? '#A89073' : '#6E5F52'}
                      fontSize={11}
                    />
                    <PolarRadiusAxis
                      angle={30}
                      domain={[0, 100]}
                      stroke={isDark ? '#6B543D' : '#C2B4A3'}
                      fontSize={10}
                    />
                    {/* Culprit */}
                    <Radar
                      name="许宁 (真凶)"
                      dataKey="许宁"
                      stroke={isDark ? '#DFB36C' : '#8B3A2B'}
                      fill={isDark ? '#DFB36C' : '#8B3A2B'}
                      fillOpacity={0.45}
                    />
                    {/* Innocent 1 */}
                    <Radar
                      name="周衡 (投资人)"
                      dataKey="周衡"
                      stroke="#38BDF8"
                      fill="#38BDF8"
                      fillOpacity={0.2}
                    />
                    {/* Innocent 2 */}
                    <Radar
                      name="林岚 (画家)"
                      dataKey="林岚"
                      stroke="#FB7185"
                      fill="#FB7185"
                      fillOpacity={0.15}
                    />
                    <Tooltip
                      content={({ active, payload }) => {
                        if (active && payload && payload.length) {
                          return (
                            <div
                              className="p-2.5 rounded-xl text-xs space-y-1 shadow-lg border"
                              style={{
                                backgroundColor: colors.tooltipBg,
                                borderColor: colors.tooltipBorder,
                                color: isDark ? '#F3EFEA' : '#2C241E',
                              }}
                            >
                              <div className="font-bold">{payload[0].payload.subject}</div>
                              {payload.map((entry, idx) => (
                                <div key={idx} className="flex items-center justify-between gap-3 text-[11px]">
                                  <span style={{ color: entry.color }}>{entry.name}:</span>
                                  <span className="font-mono font-bold">{entry.value}分</span>
                                </div>
                              ))}
                            </div>
                          );
                        }
                        return null;
                      }}
                    />
                    <Legend wrapperStyle={{ fontSize: 11, paddingTop: 5 }} />
                  </RadarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          {/* 4 CHECKPOINTS REVIEW CARDS */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {rigorResult.checkpoints.map((cp) => (
              <div
                key={cp.id}
                className={`p-4 rounded-xl border flex items-start justify-between gap-4 transition-colors ${
                  isDark ? 'bg-[#150F0B] border-[#2C2117]' : 'bg-white border-[#E8DFD5]'
                }`}
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    {cp.status === 'PASS' ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                    ) : cp.status === 'WARN' ? (
                      <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0" />
                    ) : (
                      <XCircle className="w-4 h-4 text-rose-500 shrink-0" />
                    )}
                    <h4
                      className={`text-xs font-serif font-bold ${
                        isDark ? 'text-[#F3EFEA]' : 'text-[#2C241E]'
                      }`}
                    >
                      {cp.label}
                    </h4>
                  </div>
                  <p
                    className={`text-[11px] leading-relaxed ${
                      isDark ? 'text-[#8C765E]' : 'text-[#8C7E72]'
                    }`}
                  >
                    {cp.description}
                  </p>
                </div>

                <span
                  className={`text-xs font-mono font-bold px-2 py-1 rounded shrink-0 ${
                    cp.status === 'PASS'
                      ? 'bg-emerald-500/10 text-emerald-500'
                      : cp.status === 'WARN'
                      ? 'bg-amber-500/10 text-amber-500'
                      : 'bg-rose-500/10 text-rose-500'
                  }`}
                >
                  {cp.value}
                </span>
              </div>
            ))}
          </div>

          {/* Actionable Rigor Improvement Tips */}
          <div
            className={`p-4 rounded-xl border flex items-start gap-3 ${
              isDark ? 'bg-[#1C140D] border-[#3E2D1E]' : 'bg-[#FAF4ED] border-[#E8DACB]'
            }`}
          >
            <Sparkles className={`w-4 h-4 shrink-0 mt-0.5 ${isDark ? 'text-[#DFB36C]' : 'text-[#8B3A2B]'}`} />
            <div className="space-y-1">
              <h5
                className={`text-xs font-serif font-bold ${
                  isDark ? 'text-[#E5C384]' : 'text-[#8B3A2B]'
                }`}
              >
                推理严密性工程建议 (AI Engineering Suggestions)
              </h5>
              <ul className="text-xs space-y-1 opacity-80 list-disc list-inside">
                {rigorResult.actionableAdvices.map((advice, idx) => (
                  <li key={idx}>{advice}</li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* 4. TAB 2: CORRELATION MATRIX GRID */}
      {activeTab === 'MATRIX' && (
        <div className="space-y-4">
          <div
            className={`p-4 rounded-xl border ${
              isDark ? 'bg-[#150F0B] border-[#2C2117]' : 'bg-white border-[#E8DFD5]'
            }`}
          >
            <h3
              className={`font-serif font-bold text-sm mb-1 ${
                isDark ? 'text-[#F3EFEA]' : 'text-[#2C241E]'
              }`}
            >
              物证与嫌疑人全息关联矩阵 (Correlation Matrix)
            </h3>
            <p
              className={`text-xs mb-4 ${
                isDark ? 'text-[#8C765E]' : 'text-[#8C7E72]'
              }`}
            >
              点击任一交叉单元格，查看该证物在定罪链中对该嫌疑人的指向属性（直接凶器、动机书面、时间锁闭、嫁祸伪造或无接触）。
            </p>

            {/* Matrix Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className={`border-b ${isDark ? 'border-[#2C2117]' : 'border-[#E8DFD5]'}`}>
                    <th className="p-2.5 font-serif font-bold">证物名称 / 属性</th>
                    <th className="p-2.5 font-serif font-bold">类别</th>
                    {caseData.suspects.map((s) => (
                      <th
                        key={s.id}
                        className={`p-2.5 font-serif font-bold text-center ${
                          s.id === caseData.trueCulpritId ? 'text-amber-500' : ''
                        }`}
                      >
                        {s.name} {s.id === caseData.trueCulpritId ? '(真凶)' : ''}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#8C765E]/10">
                  {caseData.clues.map((clue) => (
                    <tr
                      key={clue.id}
                      className={`hover:bg-[#8C765E]/5 transition-colors`}
                    >
                      <td className="p-2.5 font-serif font-medium flex items-center gap-2">
                        {clue.isCrucial && (
                          <span className="w-1.5 h-1.5 rounded-full bg-red-500 shrink-0" title="核心关键物证" />
                        )}
                        <span>{clue.name}</span>
                      </td>
                      <td className="p-2.5 opacity-70 font-mono text-[11px]">
                        {clue.category}
                      </td>
                      {caseData.suspects.map((suspect) => {
                        const cell = correlationMatrix.find(
                          (m) => m.clueId === clue.id && m.suspectId === suspect.id
                        );
                        if (!cell) return <td key={suspect.id} className="p-2.5 text-center">-</td>;

                        const isSelected = selectedCell?.clueId === clue.id && selectedCell?.suspectId === suspect.id;

                        return (
                          <td
                            key={suspect.id}
                            onClick={() => {
                              sound.playPaperRustle();
                              setSelectedCell(cell);
                            }}
                            className={`p-2.5 text-center cursor-pointer transition ${
                              isSelected ? 'ring-2 ring-amber-500 rounded' : ''
                            }`}
                          >
                            <span
                              className={`inline-block px-2 py-1 rounded text-[11px] font-mono font-bold ${
                                cell.linkType === 'DIRECT_WEAPON'
                                  ? 'bg-red-500/20 text-red-400'
                                  : cell.linkType === 'TIMING_KEY'
                                  ? 'bg-amber-500/20 text-amber-400'
                                  : cell.linkType === 'MOTIVE_PAPER'
                                  ? 'bg-purple-500/20 text-purple-400'
                                  : cell.linkType === 'FRAME_UP'
                                  ? 'bg-emerald-500/20 text-emerald-400'
                                  : cell.linkType === 'ALIBI_BREAK'
                                  ? 'bg-blue-500/20 text-blue-400'
                                  : 'opacity-30'
                              }`}
                            >
                              {cell.strength}%
                            </span>
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Selected Cell Detail Card */}
            {selectedCell && (
              <div
                className={`mt-4 p-4 rounded-xl border animate-fadeIn flex items-start justify-between gap-4 ${
                  isDark ? 'bg-[#1D1610] border-[#3E2D1E]' : 'bg-[#FAF6F0] border-[#E2D2BF]'
                }`}
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-serif font-bold text-sm">
                      {selectedCell.clueName} ↔ {selectedCell.suspectName}
                    </span>
                    <span
                      className={`text-[10px] font-mono px-2 py-0.5 rounded font-bold ${
                        selectedCell.linkType === 'DIRECT_WEAPON'
                          ? 'bg-red-500/20 text-red-400'
                          : selectedCell.linkType === 'TIMING_KEY'
                          ? 'bg-amber-500/20 text-amber-400'
                          : 'bg-[#8C765E]/20'
                      }`}
                    >
                      {selectedCell.linkType} ({selectedCell.strength}%)
                    </span>
                  </div>
                  <p className="text-xs leading-relaxed opacity-85">
                    {selectedCell.linkDescription}
                  </p>
                </div>

                <button
                  onClick={() => setSelectedCell(null)}
                  className="text-xs opacity-60 hover:opacity-100 cursor-pointer"
                >
                  关闭详情
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* 5. TAB 3: SIMULATED TRIAL (模拟法庭定罪推演) */}
      {activeTab === 'TRIAL' && (
        <div className="space-y-6">
          <div
            className={`p-6 rounded-2xl border ${
              isDark ? 'bg-[#150F0B] border-[#2C2117]' : 'bg-white border-[#E8DFD5]'
            }`}
          >
            <div className="max-w-2xl mb-6">
              <h3
                className={`font-serif font-bold text-base mb-1 flex items-center gap-2 ${
                  isDark ? 'text-[#F3EFEA]' : 'text-[#2C241E]'
                }`}
              >
                <Scale className={`w-5 h-5 ${isDark ? 'text-[#DFB36C]' : 'text-[#8B3A2B]'}`} />
                <span>法庭级定罪排他推演器 (Simulated Court Inculpation)</span>
              </h3>
              <p
                className={`text-xs leading-relaxed ${
                  isDark ? 'text-[#8C765E]' : 'text-[#8C7E72]'
                }`}
              >
                验证案件能否经受住法庭级严密审理：选择任一嫌疑人提起公诉，系统将根据目前生成的物证链、不在场证据和物理闭环状态，裁决罪名是否成立。
              </p>
            </div>

            {/* Suspect Selector Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 mb-6">
              {caseData.suspects.map((suspect) => {
                const profile = profiles.find((p) => p.suspectId === suspect.id);
                const isSelected = trialSuspectId === suspect.id;
                const isCulprit = suspect.id === caseData.trueCulpritId;

                return (
                  <div
                    key={suspect.id}
                    onClick={() => {
                      sound.playPaperRustle();
                      setTrialSuspectId(suspect.id);
                      setTrialResult(null);
                    }}
                    className={`p-3.5 rounded-xl border cursor-pointer transition ${
                      isSelected
                        ? isDark
                          ? 'bg-[#261B12] border-[#DFB36C] ring-1 ring-[#DFB36C]'
                          : 'bg-[#F9ECE3] border-[#8B3A2B] ring-1 ring-[#8B3A2B]'
                        : isDark
                        ? 'bg-[#18110C] border-[#2A1E14] hover:bg-[#22170F]'
                        : 'bg-[#FAF7F2] border-[#E8DFD5] hover:bg-[#F2ECE3]'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="font-serif font-bold text-xs">{suspect.name}</span>
                      <span className="text-[10px] font-mono opacity-60">{suspect.title}</span>
                    </div>
                    <div className="flex items-center justify-between text-[11px] font-mono">
                      <span>物证指向度:</span>
                      <span className={`font-bold ${isCulprit ? 'text-amber-500' : ''}`}>
                        {profile?.totalInculpationScore}%
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Trigger Button */}
            <div className="flex items-center gap-3">
              <button
                onClick={() => handleRunSimulatedTrial(trialSuspectId)}
                className={`flex items-center gap-2 px-6 py-2.5 rounded-xl font-serif font-bold text-xs shadow-md transition cursor-pointer active:scale-95 ${
                  isDark
                    ? 'bg-gradient-to-r from-[#DFB36C] to-[#C9942D] text-[#140E07]'
                    : 'bg-[#8B3A2B] text-white hover:bg-[#783023]'
                }`}
              >
                <Scale className="w-4 h-4" />
                <span>对选中嫌疑人提起定罪指控</span>
              </button>
            </div>

            {/* Trial Result Panel */}
            {trialResult && (
              <div
                className={`mt-6 p-5 rounded-2xl border animate-fadeIn space-y-3 ${
                  trialResult.verdict === 'CONVICTED'
                    ? isDark
                      ? 'bg-emerald-950/30 border-emerald-800/60 text-emerald-200'
                      : 'bg-emerald-50 border-emerald-300 text-emerald-950'
                    : isDark
                    ? 'bg-amber-950/30 border-amber-800/60 text-amber-200'
                    : 'bg-amber-50 border-amber-300 text-amber-950'
                }`}
              >
                <div className="flex items-center gap-2">
                  {trialResult.verdict === 'CONVICTED' ? (
                    <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" />
                  ) : (
                    <AlertTriangle className="w-5 h-5 text-amber-500 shrink-0" />
                  )}
                  <h4 className="font-serif font-bold text-sm tracking-wide">
                    {trialResult.title}
                  </h4>
                </div>

                <p className="text-xs leading-relaxed opacity-90">
                  {trialResult.reason}
                </p>

                <div className="pt-2 border-t border-current/15 flex flex-wrap items-center gap-2">
                  <span className="text-[11px] font-mono opacity-80">关联呈堂证物:</span>
                  {trialResult.supportingClues.map((clueName, idx) => (
                    <span
                      key={idx}
                      className="px-2 py-0.5 rounded text-[10px] font-serif bg-current/10 border border-current/20"
                    >
                      {clueName}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
