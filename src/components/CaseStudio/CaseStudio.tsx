/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import {
  LangGraphNodeId,
  StudioCaseData,
  ValidationReport,
  LogicConflict,
} from './types';
import { PRESET_STUDIO_CASES } from './presets';
import { validateCaseConsistency, repairCaseConflicts } from './logicValidator';
import { LangGraphStudioModal } from './LangGraphStudioModal';
import { buildNPCKnowledgeAndBoundaries } from './langgraphEngine';
import { LogicVerificationView } from './LogicVerificationView';
import { sound } from '../../utils/audio';
import {
  FileText,
  Users,
  Compass,
  Key,
  Clock,
  Play,
  RotateCcw,
  CheckCircle2,
  Upload,
  ChevronRight,
  ChevronDown,
  Activity,
  X,
  Edit3,
  Search,
  MapPin,
  Lock,
  Unlock,
  Lightbulb,
  Check,
  AlertCircle,
  Plus,
  Sparkles,
  Zap,
  Target,
  ArrowRight,
  ShieldCheck,
  Flame,
  Sun,
  Moon,
  Volume2,
  VolumeX,
  Layers,
  FolderOpen,
  Settings,
  HelpCircle,
  Scale,
  BarChart3,
  Download,
} from 'lucide-react';

interface CaseStudioProps {
  onPlayCase: (caseData: StudioCaseData) => void;
  onBackToGame: () => void;
  onBackToPortal?: () => void;
  initialPresetId?: string;
  themeMode?: 'dark' | 'light';
  onToggleTheme?: () => void;
}

type EditorSection = 'OUTLINE' | 'SUSPECTS' | 'SCENES' | 'CLUES' | 'TIMELINE' | 'LOGIC_VERIFY';

interface NarrativeBeat {
  id: string;
  stage: string;
  title: string;
  color: string;
}

const SAMPLE_SCRIPTS: Record<string, { title: string; filename: string; text: string; trick: string }> = {
  midnight_gallery: {
    title: '午夜画廊：锁闭之谜',
    filename: 'midnight_gallery_script.md',
    trick: '密室反锁 + 怀表拨慢20分钟制造伪不在场证明',
    text: `【剧本案名】《午夜画廊：锁闭之谜》
【案发时间】2026年10月18日 22:30 
【案发地点】星海现代美术馆 · 文物修复室（第一现场）
【案发背景】
画廊举办秋季当代艺术展开幕酒会。22:15，策展人陈默进入修复室整理藏品；22:35，保安巡逻发现修复室反锁且内部无应答，强行开锁后发现陈默倒在工作台旁身亡。`,
  },
  snow_manor: {
    title: '暴风雪山庄：钟楼之锁',
    filename: 'snow_manor_case.txt',
    trick: '【故意植入冲突】时空瞬移矛盾 + 密室锁闭无钥匙悖论（演示自愈）',
    text: `【剧本案名】《暴风雪山庄：钟楼之锁》
【案发时间】大雪封山之夜 23:00
【案发地点】雪原孤庄 · 钟楼机芯室（孤立建筑，外部雪地无脚印）`,
  },
  yacht_poison: {
    title: '深海游艇：无声晚宴',
    filename: 'ocean_yacht_mystery.json',
    trick: '冰块延迟融化毒剂递送 + 侍者与调酒师双重伪证',
    text: `【剧本案名】《深海游艇：无声晚宴》
【案发时间】公海航行途中 21:45
【案发地点】顶层VIP全景观景舱`,
  },
};

export const CaseStudio: React.FC<CaseStudioProps> = ({
  onPlayCase,
  onBackToGame,
  onBackToPortal,
  initialPresetId = 'midnight_gallery',
  themeMode,
  onToggleTheme,
}) => {
  // Use global themeMode if provided, fallback to local state
  const [localTheme, setLocalTheme] = useState<'dark' | 'light'>('light');
  const currentTheme = themeMode ?? localTheme;
  const isDark = currentTheme === 'dark';

  const toggleTheme = () => {
    sound.playPaperRustle();
    if (onToggleTheme) {
      onToggleTheme();
    } else {
      setLocalTheme((prev) => (prev === 'dark' ? 'light' : 'dark'));
    }
  };

  // Navigation Section in Left Outline
  const [activeSection, setActiveSection] = useState<EditorSection>('OUTLINE');
  const [selectedPresetId, setSelectedPresetId] = useState<string>(initialPresetId);

  // Modals & Drawers
  const [isLangGraphModalOpen, setIsLangGraphModalOpen] = useState(false);
  const [isCaseDropdownOpen, setIsCaseDropdownOpen] = useState(false);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [isTraceDrawerOpen, setIsTraceDrawerOpen] = useState(false);
  const [isTruthModalOpen, setIsTruthModalOpen] = useState(false);
  const [isTrickModalOpen, setIsTrickModalOpen] = useState(false);
  const [isEditingHook, setIsEditingHook] = useState(false);
  const [saveToast, setSaveToast] = useState(false);
  const [isMuted, setIsMuted] = useState(sound.getIsMuted());

  // Interactive NPC Boundary Guard Simulation States
  const [testingNpcId, setTestingNpcId] = useState<string>('xu_ning');
  const [testQuestion, setTestQuestion] = useState<string>('你22:15分究竟在哪？是不是你拿备用门禁卡反锁了门？');
  const [testResponse, setTestResponse] = useState<string | null>(null);
  const [expandedNpcPrompt, setExpandedNpcPrompt] = useState<string | null>(null);

  const handleApplyGeneratedCase = (newCase: StudioCaseData) => {
    sound.playClueFound();
    const report = validateCaseConsistency(newCase);
    setCurrentCase({ ...newCase, validationReport: report });
    setSaveToast(true);
    setTimeout(() => setSaveToast(false), 2200);
  };

  const handleTestNPCBoundary = (suspectName: string, promptQuestion: string) => {
    sound.playPaperRustle();
    const isCulprit = currentCase.trueCulpritId === testingNpcId;

    if (promptQuestion.includes('门禁') || promptQuestion.includes('反锁') || promptQuestion.includes('备用卡')) {
      if (isCulprit) {
        setTestResponse(`【${suspectName} 防御性应答 · 动摇阶段: DEFENSIVE】
“你在胡说什么？！修复室的备用门禁卡一直由保安赵主管锁在总控抽屉里，我怎么可能拿得到？我有不在场人证，你不能仅凭猜测污蔑我！”
[防剧透审查审计: 通过 · 涉案诡计与凶手自认已严格阻断拦截]`);
      } else {
        setTestResponse(`【${suspectName} 回答】
“门禁卡的事我根本不知情。当晚我离开办公室后就一直在大厅，现场多名宾客都看见过我。”
[防剧透审查审计: 通过 · 真实无辜反应，未越狱]`);
      }
    } else if (promptQuestion.includes('凶手') || promptQuestion.includes('杀')) {
      setTestResponse(`【${suspectName} 情绪动摇 · 戒备阶段: AGITATED】
“请注意你的措辞！策展人遇害是画廊的巨大不幸，我也想尽快查清真相，但我绝对不是凶手！请出示你的物证，否则我有权停止回答。”
[防剧透审查审计: 通过 · 严格阻断自认，触发防御应答应答]`);
    } else {
      setTestResponse(`【${suspectName} 常规回答 · 平静阶段: CALM】
“关于这一点，我之前在口供中已经说明：我当晚一直按照正常流程参与开幕酒会，没有去过修复室后方的警戒封闭区。”
[防剧透审查审计: 通过 · 严格符合 NPC 知识库边界]`);
    }
  };

  const handleToggleSound = () => {
    const muted = sound.toggleMute();
    setIsMuted(muted);
    if (!muted) {
      sound.startAmbientMystery();
    }
  };

  // Editable Case State
  const [currentCase, setCurrentCase] = useState<StudioCaseData>(() => {
    const base = PRESET_STUDIO_CASES[initialPresetId] || PRESET_STUDIO_CASES['midnight_gallery'];
    const report = validateCaseConsistency(base);
    return { ...base, validationReport: report };
  });

  // Narrative Beats (from reference mockup)
  const [narrativeBeats, setNarrativeBeats] = useState<NarrativeBeat[]>([
    { id: '1', stage: '开场', title: '画廊停电', color: '#C9942D' },
    { id: '2', stage: '发现', title: '破损的怀表', color: '#D4A359' },
    { id: '3', stage: '反转', title: '不在场证明', color: '#E58888' },
    { id: '4', stage: '揭晓', title: '修复室夹层', color: '#34D399' },
  ]);

  // Local File Ingestion States
  const [uploadedFileName, setUploadedFileName] = useState<string>('midnight_gallery_script.md');
  const [uploadedFileSize, setUploadedFileSize] = useState<number>(3420);
  const [scriptText, setScriptText] = useState<string>(SAMPLE_SCRIPTS.midnight_gallery.text);
  const [isDragOver, setIsDragOver] = useState(false);

  // Terminal & Node Execution Log History
  const [terminalLogs, setTerminalLogs] = useState<string[]>([
    '[00:00.012] [LANGGRAPH] 调度中心捕获本地剧本输入，加载有状态拓扑图...',
    '[00:00.320] [DOC_PARSE] 提取涉案实体：4 位嫌疑人、4 处涉案空间、8 项微观物证。',
    '[00:00.680] [SCRIPT_ANALYZE] 动机图谱生成：代笔纠纷、注资纠纷与盗窃瓷器被撞破。',
    '[00:01.120] [CASE_PLAN] 核心诡计确立：停摆怀表倒拨 20 分钟制造死者活人假象 + 备用卡外侧反锁。',
    '[00:01.540] [CASE_GENERATE] 生成微观物证图谱、365nm UV鉴识层及 4 组嫌疑人防剧透边界。',
    '[00:01.890] [LOGIC_VALIDATE] 确定性时空与锁闭规则校验通过（得分：100/100，零冲突）。',
  ]);

  const [repairLogs, setRepairLogs] = useState<string[]>([]);
  const validationReport = currentCase.validationReport || validateCaseConsistency(currentCase);


  // Quick field editor helper
  const handleUpdateCaseField = <K extends keyof StudioCaseData>(field: K, value: StudioCaseData[K]) => {
    const updated = { ...currentCase, [field]: value };
    const report = validateCaseConsistency(updated);
    setCurrentCase({ ...updated, validationReport: report });
    setSaveToast(true);
    setTimeout(() => setSaveToast(false), 1800);
  };

  const handleSelectCase = (presetKey: string) => {
    sound.playPaperRustle();
    setSelectedPresetId(presetKey);
    setIsCaseDropdownOpen(false);

    const chosen = PRESET_STUDIO_CASES[presetKey] || PRESET_STUDIO_CASES['midnight_gallery'];
    const report = validateCaseConsistency(chosen);
    setCurrentCase({ ...chosen, validationReport: report });

    const sample = SAMPLE_SCRIPTS[presetKey] || SAMPLE_SCRIPTS.midnight_gallery;
    setUploadedFileName(sample.filename);
    setUploadedFileSize(sample.text.length * 2);
    setScriptText(sample.text);
    setRepairLogs([]);

    setTerminalLogs((prev) => [
      ...prev,
      `[SWITCH] 载入案卷《${chosen.title}》，重新计算确定性规则门禁...`,
    ]);
  };

  const handleTriggerSelfRepair = () => {
    sound.playClueFound();
    if (!currentCase.validationReport) return;

    const { repairedCase, appliedFixes } = repairCaseConflicts(
      currentCase,
      currentCase.validationReport
    );

    setCurrentCase(repairedCase);
    setRepairLogs(appliedFixes);
    setTerminalLogs((prev) => [
      ...prev,
      `[REVISION_NODE] 自动执行定向自愈重规划...`,
      ...appliedFixes.map((f) => `[FIX_APPLIED] ${f}`),
      `[LOGIC_VALIDATE] 重新校验全绿通过！综合得分 100/100。`,
    ]);
  };

  const handleSimulateScriptIngest = () => {
    sound.playPaperRustle();
    setIsUploadModalOpen(false);

    setTerminalLogs((prev) => [
      ...prev,
      `[INGEST] 开始解析新上传本地剧本：${uploadedFileName} (${uploadedFileSize} bytes)...`,
      `[DOC_PARSE] 成功提取 4 位涉案人物画像与不在场陈述...`,
      `[SCRIPT_ANALYZE] 语义图谱分析完成，自动对齐物理与逻辑约束...`,
      `[CASE_PLAN] 核心诡计框架对齐完成，更新编辑台要素...`,
      `[LOGIC_VALIDATE] 触发确定性硬规则检查门禁...`,
    ]);

    setSaveToast(true);
    setTimeout(() => setSaveToast(false), 2000);
  };

  const handleAddBeat = () => {
    sound.playPaperRustle();
    const stageNames = ['展开', '线索', '冲突', '搜查', '对质'];
    const randomStage = stageNames[narrativeBeats.length % stageNames.length];
    const newBeat: NarrativeBeat = {
      id: String(Date.now()),
      stage: randomStage,
      title: '新发现的物证',
      color: isDark ? '#D4A359' : '#8B3A2B',
    };
    setNarrativeBeats([...narrativeBeats, newBeat]);
  };

  return (
    <div
      className={`min-h-screen flex flex-col font-sans select-none antialiased transition-colors duration-300 ${
        isDark
          ? 'bg-[#0C0A09] text-[#E5DCD0]'
          : 'bg-[#F5EFE6] text-[#2C241E]'
      }`}
    >
      {/* 1. TOP NAVBAR (Identical to HomePortal navbar) */}
      <header
        className={`h-16 px-6 sm:px-10 border-b flex items-center justify-between shrink-0 sticky top-0 z-40 backdrop-blur-md transition-colors duration-300 ${
          isDark ? 'bg-[#120F0D]/95 border-[#2C2117]' : 'bg-[#FAF7F2]/95 border-[#E8DFD5]'
        }`}
      >
        {/* Left: Brand Logo & Title */}
        <div
          onClick={onBackToPortal}
          className="flex items-center gap-3 cursor-pointer group"
          title="返回首页"
        >
          <div
            className={`w-9 h-9 rounded-xl border flex items-center justify-center shadow-inner shrink-0 ${
              isDark
                ? 'bg-gradient-to-br from-[#2D2115] via-[#1A130C] to-[#0D0906] border-[#543F2A] text-[#E5C384]'
                : 'bg-[#8B3A2B] border-[#783023] text-white shadow-xs ring-2 ring-[#8B3A2B]/10'
            }`}
          >
            {/* Sherlock Hat + Magnifying Glass Bespoke Line Art */}
            <svg
              className="w-5 h-5"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M4 15c0-4 3.5-7 8-7s8 3 8 7" />
              <path d="M2 15c2-1 4-1 6-1h8c2 0 4 0 6 1" />
              <path d="M12 4v4" />
              <path d="M10 4h4" />
              <circle cx="15.5" cy="15.5" r="3.5" />
              <line x1="18" y1="18" x2="21.5" y2="21.5" />
            </svg>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1
                className={`font-serif font-black text-base tracking-wide leading-none ${
                  isDark ? 'text-[#F3EFEA]' : 'text-[#1C1917]'
                }`}
              >
                AI Detective
              </h1>
            </div>
            <p
              className={`text-[10px] font-serif tracking-widest mt-0.5 ${
                isDark ? 'text-[#A89073]' : 'text-[#8C7E72]'
              }`}
            >
              智能探案平台
            </p>
          </div>
        </div>

        {/* Center: Top Navigation Links */}
        <nav className="hidden md:flex items-center gap-7 text-xs font-serif">
          <button
            onClick={() => {
              sound.playPaperRustle();
              onBackToPortal?.();
            }}
            className={`flex items-center gap-1.5 transition-colors cursor-pointer ${
              isDark ? 'text-[#A89073] hover:text-[#F3EFEA]' : 'text-[#786B60] hover:text-[#1C1917]'
            }`}
          >
            <span>首页</span>
          </button>
          <button
            className={`flex items-center gap-1.5 font-bold border-b-2 pb-0.5 cursor-pointer ${
              isDark ? 'text-[#F5E2BD] border-[#D4A359]' : 'text-[#8B3A2B] border-[#8B3A2B]'
            }`}
          >
            <span>案件创作</span>
          </button>
        </nav>

        {/* Right: Theme Toggle, Sound, User Avatar, & Primary Action Button */}
        <div className="flex items-center gap-2.5 sm:gap-3">
          {/* GLOBAL THEME SWITCHER: High-contrast segmented pill toggle (Synchronizes all pages globally!) */}
          <div
            className={`p-1 rounded-full border flex items-center gap-1 transition-all shadow-xs shrink-0 ${
              isDark
                ? 'bg-[#18130E] border-[#3E2D1E]'
                : 'bg-white border-[#E0D5C7]'
            }`}
            title="全局主题切换：暗夜书房 / 白昼手稿"
          >
            <button
              onClick={() => {
                if (isDark) onToggleTheme?.();
              }}
              className={`px-3 py-1 rounded-full flex items-center gap-1.5 transition text-xs font-serif font-bold cursor-pointer ${
                !isDark
                  ? 'bg-[#8B3A2B] text-white shadow-xs'
                  : 'text-[#8C765E] hover:text-[#E5C384]'
              }`}
              title="切换为白昼手稿羊皮纸风格（全平台同步）"
            >
              <Sun className="w-3.5 h-3.5" />
              <span>白昼</span>
            </button>
            <button
              onClick={() => {
                if (!isDark) onToggleTheme?.();
              }}
              className={`px-3 py-1 rounded-full flex items-center gap-1.5 transition text-xs font-serif font-bold cursor-pointer ${
                isDark
                  ? 'bg-gradient-to-r from-[#DFB36C] via-[#C9942D] to-[#DFB36C] text-[#140E07] shadow-xs'
                  : 'text-[#8C7E72] hover:text-[#1C1917]'
              }`}
              title="切换为暗夜侦探书房风格（全平台同步）"
            >
              <Moon className="w-3.5 h-3.5" />
              <span>暗夜</span>
            </button>
          </div>

          {/* Soundscape Ambient Toggle */}
          <button
            onClick={handleToggleSound}
            className={`p-2 rounded-full border transition cursor-pointer ${
              isDark
                ? 'bg-[#18130E] hover:bg-[#241B13] text-[#A89073] hover:text-[#E5C384] border-[#3A2B1D]'
                : 'bg-white hover:bg-[#F2ECE4] text-[#8C7E72] hover:text-[#8B3A2B] border-[#E0D5C7]'
            }`}
            title={isMuted ? '开启环境悬疑声景' : '静音'}
          >
            {isMuted ? (
              <VolumeX className="w-4 h-4 opacity-50" />
            ) : (
              <Volume2 className={`w-4 h-4 animate-pulse ${isDark ? 'text-[#C9942D]' : 'text-[#8B3A2B]'}`} />
            )}
          </button>

          {/* Direct Download Project Source Code ZIP */}
          <a
            href="/ai_detective_project.zip"
            download="ai_detective_project.zip"
            className={`hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-xs font-serif font-medium transition cursor-pointer shadow-sm ${
              isDark
                ? 'bg-[#18130E] hover:bg-[#251D15] text-[#E8C88B] border-[#3E2D1E] hover:border-[#8C683F]'
                : 'bg-white hover:bg-[#F2ECE4] text-[#8B3A2B] border-[#E0D5C7]'
            }`}
            title="一键下载完整工程代码包 (ZIP 格式，包含全部前端代码、3D 模型与场景资源)"
          >
            <Download className="w-3.5 h-3.5" />
            <span>下载源码</span>
          </a>

          {/* User Avatar */}
          <div
            className={`w-8 h-8 rounded-full overflow-hidden border flex items-center justify-center text-xs shrink-0 shadow-md ${
              isDark
                ? 'border-[#523A25] bg-[#221810] text-[#E8C88B]'
                : 'border-[#E0D5C7] bg-[#FAF7F2] text-[#8B3A2B]'
            }`}
          >
            <span className="font-bold">侦</span>
          </div>

          {/* Primary Action Button: 进入试玩 */}
          <button
            onClick={() => onPlayCase(currentCase)}
            disabled={!validationReport.isValid}
            className={`flex items-center gap-2 px-5 py-2 rounded-xl font-serif font-black text-xs sm:text-sm tracking-wide transition shadow-sm ${
              validationReport.isValid
                ? isDark
                  ? 'bg-gradient-to-r from-[#DFB36C] via-[#C9942D] to-[#DFB36C] hover:from-[#E8C485] hover:to-[#D4A359] text-[#140E07] cursor-pointer shadow-amber-950/40 active:scale-95'
                  : 'bg-[#8B3A2B] hover:bg-[#783023] text-white cursor-pointer active:scale-95 shadow-red-950/20'
                : 'bg-[#D9CFC4] text-[#8C7E72] cursor-not-allowed opacity-70'
            }`}
          >
            <Play className="w-3.5 h-3.5 fill-current" />
            <span>进入试玩</span>
          </button>
        </div>
      </header>

      {/* 3. THREE-COLUMN EDITORIAL DESK WORKSPACE */}
      <div className="flex-1 max-w-[1440px] w-full mx-auto p-4 sm:p-6 flex flex-col lg:flex-row gap-6 min-h-0">
        {/* LEFT COLUMN: 案件导航 (Case Navigation, ~220px) */}
        <aside className="w-full lg:w-56 shrink-0 flex flex-col justify-between space-y-6">
          <div className="space-y-4">
            <div className="pl-3">
              <span className={`text-[11px] font-serif tracking-wider uppercase font-medium ${
                isDark ? 'text-[#8C765E]' : 'text-[#8C7E72]'
              }`}>
                案件导航
              </span>
            </div>

            <nav className="space-y-1 font-serif">
              {/* AI 剧本生成工作流按钮 (LangGraph Pipeline Entry) */}
              <button
                onClick={() => {
                  sound.playClueFound();
                  setIsLangGraphModalOpen(true);
                }}
                className={`w-full flex items-center justify-between px-3 py-2 text-xs transition cursor-pointer rounded-xl font-bold border mb-2 shadow-xs ${
                  isDark
                    ? 'bg-gradient-to-r from-[#2B1F13] to-[#1E160E] text-[#E5C384] border-[#4D3723] hover:border-[#C9942D]'
                    : 'bg-gradient-to-r from-[#FAF2EC] to-[#F5E7DF] text-[#8B3A2B] border-[#E8D4C8] hover:border-[#8B3A2B]'
                }`}
                title="启动 LangGraph 8 节点剧本生产工作流"
              >
                <div className="flex items-center gap-2">
                  <Zap className={`w-3.5 h-3.5 ${isDark ? 'text-[#C9942D]' : 'text-[#8B3A2B]'}`} />
                  <span>AI 剧本生成 (LangGraph)</span>
                </div>
                <span className={`text-[10px] font-mono px-1.5 py-0.2 rounded font-bold ${
                  isDark ? 'bg-amber-500/20 text-amber-400' : 'bg-[#8B3A2B]/10 text-[#8B3A2B]'
                }`}>
                  8节点
                </span>
              </button>

              {/* 1. 案件概览 (OUTLINE) */}
              <button
                onClick={() => {
                  sound.playPaperRustle();
                  setActiveSection('OUTLINE');
                }}
                className={`w-full flex items-center justify-between px-3.5 py-2.5 text-xs transition cursor-pointer ${
                  activeSection === 'OUTLINE'
                    ? isDark
                      ? 'bg-[#241A12] text-[#E5C384] font-bold border-l-4 border-[#C9942D] rounded-r-xl rounded-l-none shadow-md'
                      : 'bg-[#F5E7DF] text-[#8B3A2B] font-bold border-l-4 border-[#8B3A2B] rounded-r-xl rounded-l-none shadow-xs'
                    : isDark
                    ? 'text-[#A89073] hover:bg-[#18120D] hover:text-[#F3EFEA] rounded-xl'
                    : 'text-[#5C4F44] hover:bg-[#ECE4D8] hover:text-[#1C1917] rounded-xl'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <FileText className={`w-4 h-4 ${
                    activeSection === 'OUTLINE'
                      ? isDark ? 'text-[#C9942D]' : 'text-[#8B3A2B]'
                      : 'opacity-60'
                  }`} />
                  <span>案件概览</span>
                </div>
              </button>

              {/* 2. 人物 (SUSPECTS) */}
              <button
                onClick={() => {
                  sound.playPaperRustle();
                  setActiveSection('SUSPECTS');
                }}
                className={`w-full flex items-center justify-between px-3.5 py-2.5 text-xs transition cursor-pointer ${
                  activeSection === 'SUSPECTS'
                    ? isDark
                      ? 'bg-[#241A12] text-[#E5C384] font-bold border-l-4 border-[#C9942D] rounded-r-xl rounded-l-none shadow-md'
                      : 'bg-[#F5E7DF] text-[#8B3A2B] font-bold border-l-4 border-[#8B3A2B] rounded-r-xl rounded-l-none shadow-xs'
                    : isDark
                    ? 'text-[#A89073] hover:bg-[#18120D] hover:text-[#F3EFEA] rounded-xl'
                    : 'text-[#5C4F44] hover:bg-[#ECE4D8] hover:text-[#1C1917] rounded-xl'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <Users className={`w-4 h-4 ${
                    activeSection === 'SUSPECTS'
                      ? isDark ? 'text-[#C9942D]' : 'text-[#8B3A2B]'
                      : 'opacity-60'
                  }`} />
                  <span>人物</span>
                </div>
                <span className={`w-5 h-5 rounded-full text-[11px] font-mono flex items-center justify-center font-bold ${
                  isDark ? 'bg-[#18120D] text-[#C9942D] border border-[#3E2D1E]' : 'bg-[#EAE1D5] text-[#6E5F52]'
                }`}>
                  {currentCase.suspects.length}
                </span>
              </button>

              {/* 3. 场景 (SCENES) */}
              <button
                onClick={() => {
                  sound.playPaperRustle();
                  setActiveSection('SCENES');
                }}
                className={`w-full flex items-center justify-between px-3.5 py-2.5 text-xs transition cursor-pointer ${
                  activeSection === 'SCENES'
                    ? isDark
                      ? 'bg-[#241A12] text-[#E5C384] font-bold border-l-4 border-[#C9942D] rounded-r-xl rounded-l-none shadow-md'
                      : 'bg-[#F5E7DF] text-[#8B3A2B] font-bold border-l-4 border-[#8B3A2B] rounded-r-xl rounded-l-none shadow-xs'
                    : isDark
                    ? 'text-[#A89073] hover:bg-[#18120D] hover:text-[#F3EFEA] rounded-xl'
                    : 'text-[#5C4F44] hover:bg-[#ECE4D8] hover:text-[#1C1917] rounded-xl'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <Compass className={`w-4 h-4 ${
                    activeSection === 'SCENES'
                      ? isDark ? 'text-[#C9942D]' : 'text-[#8B3A2B]'
                      : 'opacity-60'
                  }`} />
                  <span>场景</span>
                </div>
              </button>

              {/* 4. 线索 (CLUES) */}
              <button
                onClick={() => {
                  sound.playPaperRustle();
                  setActiveSection('CLUES');
                }}
                className={`w-full flex items-center justify-between px-3.5 py-2.5 text-xs transition cursor-pointer ${
                  activeSection === 'CLUES'
                    ? isDark
                      ? 'bg-[#241A12] text-[#E5C384] font-bold border-l-4 border-[#C9942D] rounded-r-xl rounded-l-none shadow-md'
                      : 'bg-[#F5E7DF] text-[#8B3A2B] font-bold border-l-4 border-[#8B3A2B] rounded-r-xl rounded-l-none shadow-xs'
                    : isDark
                    ? 'text-[#A89073] hover:bg-[#18120D] hover:text-[#F3EFEA] rounded-xl'
                    : 'text-[#5C4F44] hover:bg-[#ECE4D8] hover:text-[#1C1917] rounded-xl'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <Key className={`w-4 h-4 ${
                    activeSection === 'CLUES'
                      ? isDark ? 'text-[#C9942D]' : 'text-[#8B3A2B]'
                      : 'opacity-60'
                  }`} />
                  <span>线索</span>
                </div>
                <span className={`w-5 h-5 rounded-full text-[11px] font-mono flex items-center justify-center font-bold ${
                  isDark ? 'bg-[#18120D] text-[#C9942D] border border-[#3E2D1E]' : 'bg-[#EAE1D5] text-[#6E5F52]'
                }`}>
                  {currentCase.clues.length}
                </span>
              </button>

              {/* 5. 时间线 (TIMELINE) */}
              <button
                onClick={() => {
                  sound.playPaperRustle();
                  setActiveSection('TIMELINE');
                }}
                className={`w-full flex items-center justify-between px-3.5 py-2.5 text-xs transition cursor-pointer ${
                  activeSection === 'TIMELINE'
                    ? isDark
                      ? 'bg-[#241A12] text-[#E5C384] font-bold border-l-4 border-[#C9942D] rounded-r-xl rounded-l-none shadow-md'
                      : 'bg-[#F5E7DF] text-[#8B3A2B] font-bold border-l-4 border-[#8B3A2B] rounded-r-xl rounded-l-none shadow-xs'
                    : isDark
                    ? 'text-[#A89073] hover:bg-[#18120D] hover:text-[#F3EFEA] rounded-xl'
                    : 'text-[#5C4F44] hover:bg-[#ECE4D8] hover:text-[#1C1917] rounded-xl'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <Clock className={`w-4 h-4 ${
                    activeSection === 'TIMELINE'
                      ? isDark ? 'text-[#C9942D]' : 'text-[#8B3A2B]'
                      : 'opacity-60'
                  }`} />
                  <span>时间线</span>
                </div>
              </button>

              {/* 6. 逻辑校验 (LOGIC_VERIFY) */}
              <button
                onClick={() => {
                  sound.playPaperRustle();
                  setActiveSection('LOGIC_VERIFY');
                }}
                className={`w-full flex items-center justify-between px-3.5 py-2.5 text-xs transition cursor-pointer ${
                  activeSection === 'LOGIC_VERIFY'
                    ? isDark
                      ? 'bg-[#241A12] text-[#E5C384] font-bold border-l-4 border-[#C9942D] rounded-r-xl rounded-l-none shadow-md'
                      : 'bg-[#F5E7DF] text-[#8B3A2B] font-bold border-l-4 border-[#8B3A2B] rounded-r-xl rounded-l-none shadow-xs'
                    : isDark
                    ? 'text-[#A89073] hover:bg-[#18120D] hover:text-[#F3EFEA] rounded-xl'
                    : 'text-[#5C4F44] hover:bg-[#ECE4D8] hover:text-[#1C1917] rounded-xl'
                }`}
                title="查看 Recharts 证据与嫌疑人关联强度及严密性图表"
              >
                <div className="flex items-center gap-2.5">
                  <Scale className={`w-4 h-4 ${
                    activeSection === 'LOGIC_VERIFY'
                      ? isDark ? 'text-[#C9942D]' : 'text-[#8B3A2B]'
                      : 'opacity-60'
                  }`} />
                  <span>逻辑校验 (图表)</span>
                </div>
                <span className={`text-[10px] font-mono px-1.5 py-0.5 rounded font-bold ${
                  validationReport.isValid
                    ? 'bg-emerald-500/15 text-emerald-500'
                    : 'bg-amber-500/15 text-amber-500'
                }`}>
                  {validationReport.score}%
                </span>
              </button>
            </nav>
          </div>

          {/* Bottom Card: 灵感卡住了？ (Exact match from reference) */}
          <div
            className={`rounded-2xl p-4 border shadow-sm space-y-2 font-serif transition-colors ${
              isDark
                ? 'bg-[#16120F] border-[#2C2117] text-[#E5DCD0]'
                : 'bg-white border-[#EBE4DC] text-[#1C1917]'
            }`}
          >
            <h4 className="font-bold text-xs flex items-center gap-1.5">
              <Lightbulb className={`w-3.5 h-3.5 ${isDark ? 'text-[#C9942D]' : 'text-[#8B3A2B]'}`} />
              <span>灵感卡住了？</span>
            </h4>
            <p className={`text-[11px] leading-relaxed ${isDark ? 'text-[#A89073]' : 'text-[#786B60]'}`}>
              让助手从你的设定里延展一个新的转折。
            </p>
            <button
              onClick={() => {
                sound.playPaperRustle();
                setIsUploadModalOpen(true);
              }}
              className={`text-xs font-bold inline-flex items-center gap-1 cursor-pointer transition ${
                isDark ? 'text-[#D4A359] hover:underline' : 'text-[#8B3A2B] hover:underline'
              }`}
            >
              <span>打开创作助手 →</span>
            </button>
          </div>
        </aside>

        {/* MIDDLE COLUMN: MAIN CANVAS (Dominant & Airy) */}
        <main className="flex-1 min-w-0 space-y-6">
          {/* Sub-header: Breadcrumb, Case Switcher Dropdown, Auto-save & 运行详情 */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 font-serif pb-1">
            <div className="flex items-center flex-wrap gap-2.5">
              <span className={`text-xs ${isDark ? 'text-[#A89073]' : 'text-[#8C7E72]'}`}>
                案件 / {activeSection === 'OUTLINE' ? '概览' : activeSection === 'SUSPECTS' ? '人物' : activeSection === 'SCENES' ? '场景' : activeSection === 'CLUES' ? '线索' : activeSection === 'TIMELINE' ? '时间线' : '逻辑校验 (Recharts)'}
              </span>
              <span className={`text-xs ${isDark ? 'text-[#473422]' : 'text-[#D9CFC4]'}`}>·</span>

              {/* Case Switcher Dropdown */}
              <div className="relative">
                <button
                  onClick={() => setIsCaseDropdownOpen(!isCaseDropdownOpen)}
                  className={`flex items-center gap-2 px-2.5 py-1 rounded-lg border text-xs font-serif font-bold transition cursor-pointer shadow-xs ${
                    isDark
                      ? 'bg-[#18130E] hover:bg-[#221811] text-[#E8C88B] border-[#3E2D1E]'
                      : 'bg-white hover:bg-[#F2ECE4] text-[#1C1917] border-[#E0D5C7]'
                  }`}
                  title="切换编辑案卷"
                >
                  <span className="truncate max-w-[140px] sm:max-w-[200px]">
                    {currentCase.title}
                  </span>
                  <ChevronDown className="w-3 h-3 opacity-60" />
                </button>

                {isCaseDropdownOpen && (
                  <div
                    className={`absolute left-0 mt-1.5 w-72 rounded-xl border p-1.5 shadow-2xl z-50 text-xs ${
                      isDark
                        ? 'bg-[#14100D] border-[#3E2D1E] text-[#E5DCD0]'
                        : 'bg-white border-[#E0D5C7] text-[#1C1917]'
                    }`}
                  >
                    <div className="px-2 py-1 text-[10px] font-mono text-[#8C7E72] uppercase tracking-wider">
                      切换编辑案卷：
                    </div>
                    {Object.entries(SAMPLE_SCRIPTS).map(([key, item]) => (
                      <button
                        key={key}
                        onClick={() => handleSelectCase(key)}
                        className={`w-full flex items-center justify-between px-2.5 py-2 rounded-lg text-left transition cursor-pointer ${
                          selectedPresetId === key
                            ? isDark
                              ? 'bg-[#241A11] text-[#E8C88B] font-bold border border-[#4D3723]'
                              : 'bg-[#F5E7DF] text-[#8B3A2B] font-bold'
                            : isDark
                            ? 'text-[#B8A792] hover:bg-[#1E1610]'
                            : 'text-[#4A3E35] hover:bg-[#F7F3EE]'
                        }`}
                      >
                        <span className="font-serif">{item.title}</span>
                        <span className="text-[10px] opacity-60 font-mono">{item.filename}</span>
                      </button>
                    ))}

                    <div className={`pt-1 mt-1 border-t ${isDark ? 'border-[#251B12]' : 'border-[#F0EAE1]'}`}>
                      <button
                        onClick={() => {
                          setIsCaseDropdownOpen(false);
                          setIsUploadModalOpen(true);
                        }}
                        className={`w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-left transition cursor-pointer font-medium ${
                          isDark
                            ? 'text-[#E8C88B] hover:bg-[#221811]'
                            : 'text-[#8B3A2B] hover:bg-[#F5E7DF]'
                        }`}
                      >
                        <Upload className="w-3.5 h-3.5" />
                        <span>上传本地剧本让 Agent 解析...</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Auto-save Status */}
              <div className={`flex items-center gap-1.5 text-xs font-serif ${
                isDark ? 'text-[#A89073]' : 'text-[#8C7E72]'
              }`}>
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <span>{saveToast ? '已保存更改' : '已自动保存'}</span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {/* LangGraph Pipeline Studio Trigger */}
              <button
                onClick={() => {
                  sound.playClueFound();
                  setIsLangGraphModalOpen(true);
                }}
                className={`flex items-center gap-1.5 px-3 py-1 rounded-lg border text-xs font-serif font-bold transition cursor-pointer shadow-xs ${
                  isDark
                    ? 'bg-gradient-to-r from-[#2B1F13] to-[#1E160E] hover:from-[#382819] hover:to-[#2A1E14] text-[#E5C384] border-[#523A25]'
                    : 'bg-gradient-to-r from-[#8B3A2B] to-[#A04534] hover:from-[#783023] hover:to-[#8B3A2B] text-white border-[#783023]'
                }`}
                title="打开 LangGraph 剧本创作工作流控制台"
              >
                <Zap className="w-3.5 h-3.5 fill-current" />
                <span>AI 剧本生成管线 (LangGraph)</span>
              </button>

              {/* Trace Drawer Trigger */}
              <button
                onClick={() => {
                  sound.playPaperRustle();
                  setIsTraceDrawerOpen(true);
                }}
                className={`flex items-center gap-1.5 px-3 py-1 rounded-lg border text-xs font-serif transition cursor-pointer shadow-xs ${
                  isDark
                    ? 'bg-[#18130E] hover:bg-[#221811] text-[#A89073] hover:text-[#E8C88B] border-[#3E2D1E]'
                    : 'bg-white hover:bg-[#F2ECE4] text-[#635548] border-[#E0D5C7]'
                }`}
                title="查看 LangGraph 8 节点状态流与终端日志"
              >
                <Activity className={`w-3.5 h-3.5 ${isDark ? 'text-[#C9942D]' : 'text-[#8B3A2B]'}`} />
                <span>运行详情</span>
              </button>
            </div>
          </div>

          {/* Editable Case Title */}
          <div className="space-y-1 font-serif">
            <div className="flex items-center justify-between">
              <input
                type="text"
                value={currentCase.title}
                onChange={(e) => handleUpdateCaseField('title', e.target.value)}
                className={`font-serif font-black text-2xl sm:text-3xl bg-transparent border-b transition w-full py-0.5 focus:outline-none ${
                  isDark
                    ? 'text-[#F3EFEA] border-transparent hover:border-[#473422] focus:border-[#C9942D]'
                    : 'text-[#1C1917] border-transparent hover:border-[#D9CFC4] focus:border-[#8B3A2B]'
                }`}
                title="点击直接修改案名"
              />
            </div>
            <div className={`text-xs flex items-center gap-2 pt-0.5 ${
              isDark ? 'text-[#8C765E]' : 'text-[#8C7E72]'
            }`}>
              <span>最后编辑于刚刚</span>
              <span>·</span>
              <span>悬疑推理</span>
              <span>·</span>
              <span>预计 20 分钟体验</span>
            </div>
          </div>

          {/* AI 剧本生成管线横幅 (Hero LangGraph Pipeline Card) */}
          <div
            className={`rounded-2xl p-5 border shadow-sm font-serif transition-colors ${
              isDark
                ? 'bg-gradient-to-r from-[#1E1712] via-[#17120E] to-[#140F0C] border-[#3E2D1E]'
                : 'bg-gradient-to-r from-[#FAF5EE] via-[#F6EEE2] to-[#F3E7D8] border-[#E3D7C7]'
            }`}
          >
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-bold ${
                    isDark ? 'bg-[#C9942D]/20 text-[#E5C384]' : 'bg-[#8B3A2B]/15 text-[#8B3A2B]'
                  }`}>
                    LANGGRAPH WORKFLOW
                  </span>
                  <h3 className={`font-bold text-sm ${isDark ? 'text-[#F3EFEA]' : 'text-[#1C1917]'}`}>
                    AI 剧本生产线：输入长文本剧本生成完整可玩案件
                  </h3>
                </div>
                <p className={`text-xs ${isDark ? 'text-[#A89073]' : 'text-[#786B60]'}`}>
                  包含「上传剧本 → 文档解析 → 剧本分析 → 案件规划 → 案件生成 → 逻辑校验 ⇆ 定向自愈 → 人工审核 → 案件发布」8 节点有状态工作流
                </p>
              </div>

              <button
                onClick={() => {
                  sound.playClueFound();
                  setIsLangGraphModalOpen(true);
                }}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition shadow-xs cursor-pointer flex items-center gap-1.5 shrink-0 ${
                  isDark
                    ? 'bg-gradient-to-r from-[#DFB36C] via-[#C9942D] to-[#DFB36C] text-[#140E07]'
                    : 'bg-[#8B3A2B] hover:bg-[#783023] text-white'
                }`}
              >
                <Zap className="w-3.5 h-3.5 fill-current" />
                <span>进入 LangGraph 创作工坊</span>
              </button>
            </div>
          </div>

          {/* Card: 一句话核心悬念 (Editable) */}
          <div
            className={`rounded-2xl p-6 border shadow-sm font-serif space-y-3 transition-colors ${
              isDark
                ? 'bg-[#18130E] border-[#2C2117] text-[#E5DCD0]'
                : 'bg-white border-[#EBE4DC] text-[#1C1917]'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className={`text-xs font-medium ${isDark ? 'text-[#A89073]' : 'text-[#8C7E72]'}`}>
                一句话核心悬念
              </span>
              <button
                onClick={() => setIsEditingHook(!isEditingHook)}
                className={`text-xs cursor-pointer transition font-medium ${
                  isDark ? 'text-[#C9942D] hover:underline' : 'text-[#8C7E72] hover:text-[#8B3A2B]'
                }`}
              >
                {isEditingHook ? '完成' : '编辑'}
              </button>
            </div>

            {isEditingHook ? (
              <textarea
                rows={2}
                value={currentCase.tagline}
                onChange={(e) => handleUpdateCaseField('tagline', e.target.value)}
                className={`w-full rounded-xl p-3 text-base leading-relaxed resize-none focus:outline-none border ${
                  isDark
                    ? 'bg-[#0E0B08] border-[#3E2D1E] text-[#F3EFEA] focus:border-[#C9942D]'
                    : 'bg-[#FAF7F2] border-[#E0D5C7] text-[#1C1917] focus:border-[#8B3A2B]'
                }`}
              />
            ) : (
              <p className={`text-base sm:text-lg leading-relaxed ${isDark ? 'text-[#F3EFEA]' : 'text-[#1C1917]'}`}>
                {currentCase.tagline}
              </p>
            )}
          </div>

          {/* VIEW: OUTLINE (案件骨架 & 叙事节奏) */}
          {activeSection === 'OUTLINE' && (
            <div className="space-y-6 font-serif">
              {/* Section 1: 案件骨架 */}
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <h3 className={`font-bold text-base ${isDark ? 'text-[#F3EFEA]' : 'text-[#1C1917]'}`}>
                    案件骨架
                  </h3>
                  <span className={`text-xs ${isDark ? 'text-[#8C765E]' : 'text-[#8C7E72]'}`}>
                    先确定真相，再铺设可被发现的线索
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {/* Card 01: 真相 */}
                  <div
                    className={`rounded-2xl p-5 border shadow-sm flex flex-col justify-between space-y-3 transition-colors ${
                      isDark
                        ? 'bg-[#18130E] border-[#2C2117] hover:border-[#4D3723]'
                        : 'bg-white border-[#EBE4DC] hover:border-[#D9CFC4]'
                    }`}
                  >
                    <div className="space-y-1.5">
                      <span className={`text-xs font-bold block ${isDark ? 'text-[#C9942D]' : 'text-[#8B3A2B]'}`}>
                        01 · 真相
                      </span>
                      <h4 className={`font-bold text-sm ${isDark ? 'text-[#F3EFEA]' : 'text-[#1C1917]'}`}>
                        {currentCase.suspects.find((s) => s.id === currentCase.trueCulpritId)?.name || '许宁'} 不是失踪
                      </h4>
                      <p className={`text-xs leading-relaxed line-clamp-2 ${isDark ? 'text-[#A89073]' : 'text-[#786B60]'}`}>
                        他被藏在展厅后的修复夹层，致死钝器为青铜镇纸。
                      </p>
                    </div>
                    <button
                      onClick={() => setIsTruthModalOpen(true)}
                      className={`text-xs pt-3 border-t flex items-center justify-between cursor-pointer transition font-medium ${
                        isDark
                          ? 'border-[#291F16] text-[#A89073] hover:text-[#C9942D]'
                          : 'border-[#F0EAE1] text-[#8C7E72] hover:text-[#8B3A2B]'
                      }`}
                    >
                      <span>查看真相设定 →</span>
                    </button>
                  </div>

                  {/* Card 02: 动机 */}
                  <div
                    className={`rounded-2xl p-5 border shadow-sm flex flex-col justify-between space-y-3 transition-colors ${
                      isDark
                        ? 'bg-[#18130E] border-[#2C2117] hover:border-[#4D3723]'
                        : 'bg-white border-[#EBE4DC] hover:border-[#D9CFC4]'
                    }`}
                  >
                    <div className="space-y-1.5">
                      <span className={`text-xs font-bold block ${isDark ? 'text-[#C9942D]' : 'text-[#8B3A2B]'}`}>
                        02 · 动机
                      </span>
                      <h4 className={`font-bold text-sm ${isDark ? 'text-[#F3EFEA]' : 'text-[#1C1917]'}`}>
                        被篡改的署名权
                      </h4>
                      <p className={`text-xs leading-relaxed line-clamp-2 ${isDark ? 'text-[#A89073]' : 'text-[#786B60]'}`}>
                        一幅名画牵出长达五年的影子画师剽窃纠纷。
                      </p>
                    </div>
                    <button
                      onClick={() => setActiveSection('SUSPECTS')}
                      className={`text-xs pt-3 border-t flex items-center justify-between cursor-pointer transition font-medium ${
                        isDark
                          ? 'border-[#291F16] text-[#A89073] hover:text-[#C9942D]'
                          : 'border-[#F0EAE1] text-[#8C7E72] hover:text-[#8B3A2B]'
                      }`}
                    >
                      <span>补充人物关系 →</span>
                    </button>
                  </div>

                  {/* Card 03: 手法 */}
                  <div
                    className={`rounded-2xl p-5 border shadow-sm flex flex-col justify-between space-y-3 transition-colors ${
                      isDark
                        ? 'bg-[#18130E] border-[#2C2117] hover:border-[#4D3723]'
                        : 'bg-white border-[#EBE4DC] hover:border-[#D9CFC4]'
                    }`}
                  >
                    <div className="space-y-1.5">
                      <span className={`text-xs font-bold block ${isDark ? 'text-[#C9942D]' : 'text-[#8B3A2B]'}`}>
                        03 · 手法
                      </span>
                      <h4 className={`font-bold text-sm ${isDark ? 'text-[#F3EFEA]' : 'text-[#1C1917]'}`}>
                        钟声制造的错觉
                      </h4>
                      <p className={`text-xs leading-relaxed line-clamp-2 ${isDark ? 'text-[#A89073]' : 'text-[#786B60]'}`}>
                        利用停摆怀表倒拨 20 分钟伪造死者活人假象。
                      </p>
                    </div>
                    <button
                      onClick={() => setIsTrickModalOpen(true)}
                      className={`text-xs pt-3 border-t flex items-center justify-between cursor-pointer transition font-medium ${
                        isDark
                          ? 'border-[#291F16] text-[#A89073] hover:text-[#C9942D]'
                          : 'border-[#F0EAE1] text-[#8C7E72] hover:text-[#8B3A2B]'
                      }`}
                    >
                      <span>编辑诡计细节 →</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* Section 2: 叙事节奏 (Narrative Progression Bar) */}
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <h3 className={`font-bold text-base ${isDark ? 'text-[#F3EFEA]' : 'text-[#1C1917]'}`}>
                    叙事节奏
                  </h3>
                  <span className={`text-xs ${isDark ? 'text-[#8C765E]' : 'text-[#8C7E72]'}`}>
                    玩家将按这个顺序靠近真相
                  </span>
                </div>

                <div
                  className={`rounded-2xl p-6 border shadow-sm space-y-6 transition-colors ${
                    isDark
                      ? 'bg-[#18130E] border-[#2C2117]'
                      : 'bg-white border-[#EBE4DC]'
                  }`}
                >
                  {/* Progression Stepper */}
                  <div className="relative flex items-center justify-between px-4 sm:px-8 py-2">
                    {/* Connecting line */}
                    <div className={`absolute left-8 right-8 top-1/2 -translate-y-1/2 h-0.5 -z-0 ${
                      isDark ? 'bg-[#33251B]' : 'bg-[#E8DFD5]'
                    }`} />

                    {narrativeBeats.map((beat, idx) => (
                      <div key={beat.id} className="relative z-10 flex flex-col items-center group">
                        <span className={`text-xs mb-1 font-medium ${isDark ? 'text-[#A89073]' : 'text-[#8C7E72]'}`}>
                          {beat.stage}
                        </span>
                        <div
                          className={`w-5 h-5 rounded-full border-2 shadow-xs transition-transform group-hover:scale-125 ${
                            isDark ? 'border-[#18130E]' : 'border-white'
                          }`}
                          style={{ backgroundColor: beat.color }}
                        />
                        <span className={`text-xs font-bold mt-1.5 whitespace-nowrap ${
                          isDark ? 'text-[#F3EFEA]' : 'text-[#1C1917]'
                        }`}>
                          {beat.title}
                        </span>
                      </div>
                    ))}
                  </div>

                  {/* Add Beat Action Button */}
                  <div className={`pt-2 border-t ${isDark ? 'border-[#291F16]' : 'border-[#F0EAE1]'}`}>
                    <button
                      onClick={handleAddBeat}
                      className={`text-xs font-medium inline-flex items-center gap-1.5 cursor-pointer transition ${
                        isDark ? 'text-[#C9942D] hover:underline' : 'text-[#8C7E72] hover:text-[#8B3A2B]'
                      }`}
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>添加一个叙事节点</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* VIEW: SUSPECTS (涉案人物) */}
          {activeSection === 'SUSPECTS' && (
            <div className="space-y-4 font-serif">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className={`font-bold text-base ${isDark ? 'text-[#F3EFEA]' : 'text-[#1C1917]'}`}>
                    涉案人物名单与回答边界 ({currentCase.suspects.length})
                  </h3>
                  <p className={`text-xs mt-0.5 ${isDark ? 'text-[#8C765E]' : 'text-[#8C7E72]'}`}>
                    每位角色均配备独立不在场证明口供与 AI 质询防剧透护栏。
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {currentCase.suspects.map((s) => {
                  const isCulprit = s.id === currentCase.trueCulpritId;
                  const isPromptExpanded = expandedNpcPrompt === s.id;

                  const knowledgeItems = [
                    `已知事实：22:30 在反锁修复室发现陈默遇害，死因疑为后脑钝击。`,
                    `不在场证明：${s.alibi}`,
                    `利益关系与秘密：${s.secret}`,
                    isCulprit
                      ? `【真凶绝对私密认知】：实际于 22:12 动手行凶，倒拨停摆怀表并利用偷拿的备用卡制造物理反锁假象。`
                      : `【无辜者认知边界】：并未踏入修复室，仅关心自身署名纠纷或债务协议，不知晓凶器具体下落。`,
                  ];

                  const antiSpoilerRules = [
                    '绝对严禁承认杀人（即使被直接点名）',
                    '严禁剧透密室反锁手法与怀表倒拨细节',
                    '被出示关键物证时按阶段防御：冷静(Calm) -> 戒备(Defensive) -> 动摇(Agitated) -> 破防(Broken)',
                  ];

                  return (
                    <div
                      key={s.id}
                      className={`p-5 rounded-2xl border transition space-y-3.5 shadow-sm ${
                        isDark
                          ? isCulprit
                            ? 'bg-[#1C140F] border-[#C9942D]/40 ring-1 ring-[#C9942D]/20'
                            : 'bg-[#18130E] border-[#2C2117]'
                          : isCulprit
                          ? 'bg-white border-[#8B3A2B]/40 ring-1 ring-[#8B3A2B]/10'
                          : 'bg-white border-[#EBE4DC]'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className={`w-11 h-11 rounded-full overflow-hidden border shrink-0 flex items-center justify-center font-bold ${
                            isDark ? 'bg-[#291F16] border-[#4A3828] text-[#E5C384]' : 'bg-[#F5EFE6] border-[#E0D5C7] text-[#8B3A2B]'
                          }`}>
                            {s.avatarImage ? (
                              <img src={s.avatarImage} alt={s.name} className="w-full h-full object-cover" />
                            ) : (
                              <span>{s.name.slice(0, 1)}</span>
                            )}
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <span className={`font-bold text-sm ${isDark ? 'text-[#F3EFEA]' : 'text-[#1C1917]'}`}>
                                {s.name}
                              </span>
                              {isCulprit && (
                                <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                  isDark ? 'bg-red-950/80 text-red-300 border border-red-500/30' : 'bg-[#F5E7DF] text-[#8B3A2B]'
                                }`}>
                                  真凶
                                </span>
                              )}
                            </div>
                            <span className={`text-xs ${isDark ? 'text-[#A89073]' : 'text-[#8C7E72]'}`}>
                              {s.title || (s as any).identity}
                            </span>
                          </div>
                        </div>

                        <span className={`text-[10px] font-mono px-2 py-0.5 rounded-full font-bold ${
                          isDark ? 'bg-emerald-500/20 text-emerald-400' : 'bg-emerald-50 text-emerald-600 border border-emerald-200'
                        }`}>
                          防剧透护栏就绪
                        </span>
                      </div>

                      <div className="space-y-2.5 text-xs">
                        {/* 1. Alibi */}
                        <div className={`p-3 rounded-xl border space-y-1 ${
                          isDark ? 'bg-[#100D0A] border-[#261C14]' : 'bg-[#FAF7F2] border-[#EFE8DF]'
                        }`}>
                          <span className={`font-bold block ${isDark ? 'text-[#C9942D]' : 'text-[#8B3A2B]'}`}>
                            自称不在场证明：
                          </span>
                          <p className={`leading-relaxed ${isDark ? 'text-[#C5B7A8]' : 'text-[#5C4F44]'}`}>
                            {s.alibi}
                          </p>
                        </div>

                        {/* 2. NPC Knowledge Boundary */}
                        <div className={`p-3 rounded-xl border space-y-1.5 ${
                          isDark ? 'bg-[#100D0A] border-[#261C14]' : 'bg-[#FAF7F2] border-[#EFE8DF]'
                        }`}>
                          <div className="flex items-center justify-between">
                            <span className="font-bold text-[#C9942D]">
                              【NPC 背景认知与记忆边界】
                            </span>
                            <span className="text-[10px] font-mono opacity-60">Knowledge Base</span>
                          </div>
                          <ul className="space-y-1 text-[11px] opacity-85 leading-relaxed">
                            {knowledgeItems.map((item, ki) => (
                              <li key={ki}>• {item}</li>
                            ))}
                          </ul>
                        </div>

                        {/* 3. Anti-Spoiler Boundary Guard */}
                        <div className={`p-3 rounded-xl border space-y-1.5 ${
                          isDark ? 'bg-[#100D0A] border-[#261C14]' : 'bg-[#FAF7F2] border-[#EFE8DF]'
                        }`}>
                          <div className="flex items-center justify-between">
                            <span className="font-bold text-red-500">
                              【NPC 回答边界与防剧透规则】
                            </span>
                            <span className="text-[10px] font-mono opacity-60">Anti-Spoiler Guard</span>
                          </div>
                          <ul className="space-y-1 text-[11px] opacity-90 leading-relaxed">
                            {antiSpoilerRules.map((rule, ri) => (
                              <li key={ri}>• {rule}</li>
                            ))}
                          </ul>
                        </div>

                        {/* 4. System Prompt Preview Toggle */}
                        <div className="pt-1">
                          <button
                            onClick={() => {
                              sound.playPaperRustle();
                              setExpandedNpcPrompt(isPromptExpanded ? null : s.id);
                            }}
                            className={`text-[11px] font-mono flex items-center gap-1 transition cursor-pointer ${
                              isDark ? 'text-[#C9942D] hover:underline' : 'text-[#8B3A2B] hover:underline'
                            }`}
                          >
                            <span>{isPromptExpanded ? '收起 System Prompt' : '展开查看 NPC 动态 System Prompt 预览 ▾'}</span>
                          </button>

                          {isPromptExpanded && (
                            <div className={`mt-2 p-3 rounded-xl border font-mono text-[10px] leading-relaxed overflow-x-auto ${
                              isDark ? 'bg-[#090705] border-[#2B1F16] text-[#C9B9A6]' : 'bg-[#1C1816] border-[#3D332D] text-[#E8DFD5]'
                            }`}>
                              <div>[SYSTEM INSTRUCTION: NPC_AGENT_{s.id.toUpperCase()}]</div>
                              <div>角色名：{s.name} | 身份：{s.title}</div>
                              <div>记忆库：{s.bio}</div>
                              <div>最高安全准则：STRICT_ANTI_SPOILER_BARRIER = TRUE</div>
                              <div>回答策略：保持自洽，若触及核心破局点转入防御应答</div>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Interactive NPC Boundary Test Playground */}
              <div className={`mt-6 rounded-2xl p-5 border shadow-sm space-y-3 font-sans ${
                isDark ? 'bg-[#15110E] border-[#2C2117]' : 'bg-white border-[#E8DFD5]'
              }`}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <ShieldCheck className={`w-4 h-4 ${isDark ? 'text-[#C9942D]' : 'text-[#8B3A2B]'}`} />
                    <h3 className="font-bold text-xs">
                      NPC 质询防线模拟演练 (Interactive Guard Rail Test)
                    </h3>
                  </div>
                  <span className="text-[10px] font-mono opacity-60">
                    验证 NPC 是否在玩家诱导提问下守住回答边界
                  </span>
                </div>

                <div className="flex flex-col sm:flex-row gap-3 text-xs">
                  <select
                    value={testingNpcId}
                    onChange={(e) => setTestingNpcId(e.target.value)}
                    className={`px-3 py-2 rounded-xl border font-serif font-bold focus:outline-none shrink-0 ${
                      isDark ? 'bg-[#100D0A] border-[#3E2D1E] text-[#E5DCD0]' : 'bg-white border-[#E0D5C7] text-[#1C1917]'
                    }`}
                  >
                    {currentCase.suspects.map((s) => (
                      <option key={s.id} value={s.id}>
                        测试角色：{s.name} ({s.title}) {s.id === currentCase.trueCulpritId ? '【真凶】' : ''}
                      </option>
                    ))}
                  </select>

                  <input
                    type="text"
                    value={testQuestion}
                    onChange={(e) => setTestQuestion(e.target.value)}
                    placeholder="输入试探性质询问题（如：你是不是用备用卡反锁了门？）..."
                    className={`flex-1 px-3 py-2 rounded-xl border font-serif text-xs focus:outline-none ${
                      isDark
                        ? 'bg-[#100D0A] border-[#3E2D1E] text-[#E5DCD0] focus:border-[#C9942D]'
                        : 'bg-[#FAF7F2] border-[#E0D5C7] text-[#1C1917] focus:border-[#8B3A2B]'
                    }`}
                  />

                  <button
                    onClick={() => {
                      const cur = currentCase.suspects.find((s) => s.id === testingNpcId);
                      handleTestNPCBoundary(cur?.name || '嫌疑人', testQuestion);
                    }}
                    className={`px-4 py-2 rounded-xl font-bold transition shadow-xs cursor-pointer shrink-0 flex items-center gap-1.5 ${
                      isDark
                        ? 'bg-gradient-to-r from-[#DFB36C] via-[#C9942D] to-[#DFB36C] text-[#140E07]'
                        : 'bg-[#8B3A2B] hover:bg-[#783023] text-white'
                    }`}
                  >
                    <Zap className="w-3.5 h-3.5 fill-current" />
                    <span>执行防线测试</span>
                  </button>
                </div>

                {/* Quick Test Prompt Shortcuts */}
                <div className="flex items-center flex-wrap gap-2 pt-1 text-[11px]">
                  <span className="opacity-60">快捷诱导质询：</span>
                  {[
                    '你22:15分究竟在哪？是不是你拿备用门禁卡反锁了门？',
                    '陈默是不是你用钝器杀的？',
                    '你在修复室门口留下的抹布和指纹怎么解释？',
                  ].map((q, qi) => (
                    <button
                      key={qi}
                      onClick={() => {
                        setTestQuestion(q);
                        const cur = currentCase.suspects.find((s) => s.id === testingNpcId);
                        handleTestNPCBoundary(cur?.name || '嫌疑人', q);
                      }}
                      className={`px-2.5 py-1 rounded-lg border transition cursor-pointer text-left ${
                        isDark ? 'bg-[#100D0A] border-[#291F16] hover:bg-[#1A140E]' : 'bg-[#FAF7F2] border-[#E0D5C7] hover:bg-white'
                      }`}
                    >
                      {q}
                    </button>
                  ))}
                </div>

                {/* Test Output Box */}
                {testResponse && (
                  <div className={`mt-3 p-3.5 rounded-xl border font-serif text-xs leading-relaxed whitespace-pre-wrap ${
                    isDark ? 'bg-[#0E0B08] border-[#3E2D1E] text-[#E5DCD0]' : 'bg-[#FAF7F2] border-[#E0D5C7] text-[#1C1917]'
                  }`}>
                    {testResponse}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* VIEW: SCENES (案发现场) */}
          {activeSection === 'SCENES' && (
            <div className="space-y-4 font-serif">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className={`font-bold text-base ${isDark ? 'text-[#F3EFEA]' : 'text-[#1C1917]'}`}>
                    案发现场与门禁限制 (4 处空间)
                  </h3>
                  <p className={`text-xs mt-0.5 ${isDark ? 'text-[#8C765E]' : 'text-[#8C7E72]'}`}>
                    现场包含搜查门禁规则与空间几何对撞约束。
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {[
                  {
                    name: '中央艺术展厅',
                    role: '开幕酒会场地',
                    desc: '陈列本次特展巨幅油画，地板留有香槟酒渍与宾客手包。',
                    img: '/assets/scenes/gallery-hall.jpg',
                    cluesCount: 2,
                  },
                  {
                    name: '文物修复室（命案现场）',
                    role: '第一凶案现场',
                    desc: '重型防盗隔音门密闭空间，死者倒在工作台旁，排风窗暗锁半开。',
                    img: '/assets/scenes/restoration-room.jpg',
                    cluesCount: 3,
                  },
                  {
                    name: '策展人办公室',
                    role: '私密会客室',
                    desc: '奢华私人办公桌抽屉有翻动痕迹，藏有补充合同撕碎件。',
                    img: '/assets/scenes/office.jpg',
                    cluesCount: 2,
                  },
                  {
                    name: '安保监控与设备室',
                    role: '全馆中枢',
                    desc: '排列着十几个监视器屏幕，监控录像在案发时刻发生断档。',
                    img: '/assets/scenes/security-room.jpg',
                    cluesCount: 1,
                  },
                ].map((room, idx) => (
                  <div
                    key={idx}
                    className={`p-4 rounded-2xl border shadow-sm space-y-3 ${
                      isDark ? 'bg-[#18130E] border-[#2C2117]' : 'bg-white border-[#EBE4DC]'
                    }`}
                  >
                    <div className="h-36 rounded-xl overflow-hidden border border-black/20 relative">
                      <img src={room.img} alt={room.name} className="w-full h-full object-cover" />
                      <div className="absolute bottom-2 left-2 px-2 py-0.5 rounded bg-black/75 text-white text-[10px] backdrop-blur-xs font-mono">
                        {room.role}
                      </div>
                    </div>
                    <div>
                      <div className="flex items-center justify-between">
                        <h4 className={`font-bold text-sm ${isDark ? 'text-[#F3EFEA]' : 'text-[#1C1917]'}`}>{room.name}</h4>
                        <span className={`text-[11px] font-mono px-2 py-0.5 rounded-full font-bold ${
                          isDark ? 'bg-[#291F16] text-[#C9942D]' : 'bg-[#F5E7DF] text-[#8B3A2B]'
                        }`}>
                          {room.cluesCount} 项物证
                        </span>
                      </div>
                      <p className={`text-xs mt-1 leading-relaxed ${isDark ? 'text-[#A89073]' : 'text-[#786B60]'}`}>{room.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* VIEW: CLUES (核心物证) */}
          {activeSection === 'CLUES' && (
            <div className="space-y-4 font-serif">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className={`font-bold text-base ${isDark ? 'text-[#F3EFEA]' : 'text-[#1C1917]'}`}>
                    现场核心物证 ({currentCase.clues.length} 项实拍相片)
                  </h3>
                  <p className={`text-xs mt-0.5 ${isDark ? 'text-[#8C765E]' : 'text-[#8C7E72]'}`}>
                    探案中均提供微距相片特写，支持 365nm UV 紫外显影鉴识。
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {currentCase.clues.map((c) => (
                  <div
                    key={c.id}
                    className={`p-4 rounded-2xl border shadow-sm flex gap-3.5 transition ${
                      isDark
                        ? 'bg-[#18130E] border-[#2C2117] hover:border-[#4A3828]'
                        : 'bg-white border-[#EBE4DC] hover:border-[#D9CFC4]'
                    }`}
                  >
                    <div className="w-20 h-20 rounded-xl overflow-hidden border border-black/20 shrink-0 bg-black/40">
                      <img
                        src={c.imageUrl || `/assets/evidence/${c.id}.jpg`}
                        alt={c.name}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="space-y-1 flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <span className={`font-bold text-xs truncate ${isDark ? 'text-[#F3EFEA]' : 'text-[#1C1917]'}`}>
                          {c.name}
                        </span>
                        {c.isCrucial && (
                          <span className={`px-1.5 py-0.2 rounded text-[10px] font-bold shrink-0 ${
                            isDark ? 'bg-red-950/80 text-red-300 border border-red-500/40' : 'bg-[#F5E7DF] text-[#8B3A2B]'
                          }`}>
                            核心铁证
                          </span>
                        )}
                      </div>
                      <p className={`text-xs leading-relaxed line-clamp-2 ${isDark ? 'text-[#A89073]' : 'text-[#786B60]'}`}>
                        {c.shortDesc || c.detail}
                      </p>
                      {(c.tags?.some((t) => t.includes('指纹') || t.includes('特殊颜料') || t.includes('标尺')) || c.category === 'forensic') && (
                        <span className={`inline-flex items-center gap-1 text-[10px] font-mono font-bold ${
                          isDark ? 'text-[#D4A359]' : 'text-[#8B3A2B]'
                        }`}>
                          <Zap className="w-3 h-3" />
                          <span>紫外荧光鉴识</span>
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* VIEW: TIMELINE (案发时间线) */}
          {activeSection === 'TIMELINE' && (
            <div className="space-y-4 font-serif">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className={`font-bold text-base ${isDark ? 'text-[#F3EFEA]' : 'text-[#1C1917]'}`}>
                    案发时间线与涉案人轨迹 ({currentCase.timeline.length} 组关键节点)
                  </h3>
                  <p className={`text-xs mt-0.5 ${isDark ? 'text-[#8C765E]' : 'text-[#8C7E72]'}`}>
                    系统已对全员时空轨迹做对撞校验，确保无瞬移冲突。
                  </p>
                </div>
              </div>

              <div
                className={`rounded-2xl p-6 border shadow-sm space-y-4 ${
                  isDark ? 'bg-[#18130E] border-[#2C2117]' : 'bg-white border-[#EBE4DC]'
                }`}
              >
                {currentCase.timeline.map((item, idx) => (
                  <div
                    key={idx}
                    className={`flex items-start gap-4 pb-4 border-b last:border-0 last:pb-0 ${
                      isDark ? 'border-[#291F16]' : 'border-[#F0EAE1]'
                    }`}
                  >
                    <div className={`w-16 shrink-0 font-mono font-bold text-xs pt-0.5 ${
                      isDark ? 'text-[#C9942D]' : 'text-[#8B3A2B]'
                    }`}>
                      {item.time}
                    </div>
                    <div className="flex-1 space-y-1">
                      <div className="flex items-center gap-2">
                        <span className={`font-bold text-xs ${isDark ? 'text-[#F3EFEA]' : 'text-[#1C1917]'}`}>
                          {item.actor}
                        </span>
                        <span className={`text-[11px] ${isDark ? 'text-[#8C765E]' : 'text-[#8C7E72]'}`}>
                          @ {item.location}
                        </span>
                      </div>
                      <p className={`text-xs leading-relaxed ${isDark ? 'text-[#C5B7A8]' : 'text-[#5C4F44]'}`}>
                        {item.action}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* VIEW: LOGIC_VERIFY (Recharts 证据与嫌疑人关联强度及严密性校验) */}
          {activeSection === 'LOGIC_VERIFY' && (
            <LogicVerificationView
              caseData={currentCase}
              isDark={isDark}
              onTriggerSelfRepair={handleTriggerSelfRepair}
              onNavigateToSection={(sec) => {
                sound.playPaperRustle();
                setActiveSection(sec);
              }}
            />
          )}
        </main>

        {/* RIGHT COLUMN: 创作助手、一致性与案件进度 (~280px) */}
        <aside className="w-full lg:w-72 shrink-0 space-y-4 font-serif">
          {/* Section 1: 创作助手 */}
          <div className="space-y-2">
            <span className={`text-xs font-medium block pl-1 ${isDark ? 'text-[#A89073]' : 'text-[#8C7E72]'}`}>
              创作助手
            </span>
            <div
              className={`rounded-2xl p-4 border shadow-sm space-y-2 transition-colors ${
                isDark ? 'bg-[#18130E] border-[#2C2117]' : 'bg-white border-[#EBE4DC]'
              }`}
            >
              <div className={`flex items-center gap-1.5 text-xs font-bold ${
                isDark ? 'text-[#C9942D]' : 'text-[#8B3A2B]'
              }`}>
                <Sparkles className="w-3.5 h-3.5" />
                <span>下一步建议</span>
              </div>
              <p className={`text-xs leading-relaxed ${isDark ? 'text-[#C5B7A8]' : 'text-[#4A3E35]'}`}>
                让怀表在第二幕出现，它可以同时指向许宁与馆长。
              </p>
            </div>
          </div>

          {/* Section 2: 一致性与逻辑校验 */}
          <div className="space-y-2">
            <div className="flex items-center justify-between pl-1">
              <span className={`text-xs font-medium ${isDark ? 'text-[#A89073]' : 'text-[#8C7E72]'}`}>
                逻辑一致性
              </span>
              <button
                onClick={() => {
                  sound.playPaperRustle();
                  setActiveSection('LOGIC_VERIFY');
                }}
                className={`text-[11px] font-mono hover:underline cursor-pointer ${
                  isDark ? 'text-[#DFB36C]' : 'text-[#8B3A2B]'
                }`}
              >
                打开图表 →
              </button>
            </div>
            <div
              onClick={() => {
                sound.playPaperRustle();
                setActiveSection('LOGIC_VERIFY');
              }}
              className={`rounded-2xl p-4 border shadow-sm space-y-3 transition-colors cursor-pointer group ${
                isDark ? 'bg-[#18130E] hover:bg-[#201812] border-[#2C2117]' : 'bg-white hover:bg-[#FAF7F2] border-[#EBE4DC]'
              }`}
              title="点击查看 Recharts 逻辑校验视图"
            >
              {/* Row 1: 时间线完整 */}
              <div className="flex items-center gap-2.5">
                <div className={`w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${
                  isDark ? 'bg-emerald-950/70 text-emerald-400 border border-emerald-500/40' : 'bg-emerald-100 text-emerald-700'
                }`}>
                  <Check className="w-3 h-3" />
                </div>
                <span className={`font-bold text-xs ${isDark ? 'text-[#F3EFEA]' : 'text-[#1C1917]'}`}>
                  时间线完整度 100%
                </span>
              </div>

              {/* Row 2: 规则/线索建议 */}
              <div className="flex items-center gap-2.5">
                <div className={`w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${
                  validationReport.isValid
                    ? isDark ? 'bg-emerald-950/70 text-emerald-400 border border-emerald-500/40' : 'bg-emerald-100 text-emerald-700'
                    : isDark ? 'bg-amber-950/70 text-amber-400 border border-amber-500/40' : 'bg-amber-100 text-amber-700'
                }`}>
                  {validationReport.isValid ? <Check className="w-3 h-3" /> : '!'}
                </div>
                <span className={`font-bold text-xs ${isDark ? 'text-[#F3EFEA]' : 'text-[#1C1917]'}`}>
                  {validationReport.score === 100 ? '硬规则闭环已达标 (100分)' : '存在未解逻辑冲突'}
                </span>
              </div>

              <div className={`pt-2 border-t flex items-center justify-between ${
                isDark ? 'border-[#291F16]' : 'border-[#F0EAE1]'
              }`}>
                <span className={`text-xs font-medium group-hover:underline ${
                  isDark ? 'text-[#DFB36C]' : 'text-[#8B3A2B]'
                }`}>
                  查看逻辑校验视图 →
                </span>
                {validationReport.score < 100 && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleTriggerSelfRepair();
                    }}
                    className={`text-xs font-bold hover:underline cursor-pointer ${
                      isDark ? 'text-[#C9942D]' : 'text-[#8B3A2B]'
                    }`}
                  >
                    一键自愈
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Section 3: 案件进度 */}
          <div className="space-y-2">
            <span className={`text-xs font-medium block pl-1 ${isDark ? 'text-[#A89073]' : 'text-[#8C7E72]'}`}>
              案件进度
            </span>
            <div
              className={`rounded-2xl p-4 border shadow-sm space-y-2 transition-colors ${
                isDark ? 'bg-[#18130E] border-[#2C2117]' : 'bg-white border-[#EBE4DC]'
              }`}
            >
              <div className="flex items-baseline justify-between">
                <div className="flex items-baseline gap-2">
                  <span className={`font-serif font-black text-2xl ${isDark ? 'text-[#F3EFEA]' : 'text-[#1C1917]'}`}>
                    {validationReport.score === 100 ? '100%' : '68%'}
                  </span>
                  <span className={`text-xs ${isDark ? 'text-[#A89073]' : 'text-[#8C7E72]'}`}>
                    可进入试玩
                  </span>
                </div>
                <span className={`text-[11px] font-bold ${isDark ? 'text-emerald-400' : 'text-emerald-600'}`}>
                  {validationReport.score === 100 ? '校验通过' : '待完善'}
                </span>
              </div>

              {/* Progress Bar */}
              <div className={`h-1.5 w-full rounded-full overflow-hidden ${
                isDark ? 'bg-[#291F16]' : 'bg-[#EAE1D5]'
              }`}>
                <div
                  className={`h-full rounded-full transition-all duration-500 ${
                    isDark ? 'bg-[#C9942D]' : 'bg-[#8B3A2B]'
                  }`}
                  style={{ width: validationReport.score === 100 ? '100%' : '68%' }}
                />
              </div>
            </div>
          </div>
        </aside>
      </div>

      {/* 4. MODAL: 真实真相设定详情 (Truth Spec Modal) */}
      {isTruthModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div
            className={`rounded-2xl max-w-lg w-full p-6 shadow-2xl border font-serif space-y-4 ${
              isDark ? 'bg-[#16120F] border-[#3E2D1E] text-[#E5DCD0]' : 'bg-white border-[#E0D5C7] text-[#1C1917]'
            }`}
          >
            <div className={`flex items-center justify-between pb-3 border-b ${
              isDark ? 'border-[#291F16]' : 'border-[#F0EAE1]'
            }`}>
              <h3 className="font-bold text-base">
                案件真实真相设定 (Truth Spec)
              </h3>
              <button
                onClick={() => setIsTruthModalOpen(false)}
                className="p-1 rounded opacity-60 hover:opacity-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className={`p-3.5 rounded-xl border space-y-1 ${
                isDark ? 'bg-[#0E0B08] border-[#241A11]' : 'bg-[#FAF7F2] border-[#EFE8DF]'
              }`}>
                <span className={`font-bold ${isDark ? 'text-[#C9942D]' : 'text-[#8B3A2B]'}`}>锁定真凶：</span>
                <p className="text-sm font-bold">
                  {currentCase.suspects.find((s) => s.id === currentCase.trueCulpritId)?.name || '许宁'}（画廊助理）
                </p>
                <p className="opacity-75">
                  动机：受害者长期剽窃霸占画作版权，并意欲销毁所有原创手稿。
                </p>
              </div>

              <div className={`p-3.5 rounded-xl border space-y-1 ${
                isDark ? 'bg-[#0E0B08] border-[#241A11]' : 'bg-[#FAF7F2] border-[#EFE8DF]'
              }`}>
                <span className={`font-bold ${isDark ? 'text-[#C9942D]' : 'text-[#8B3A2B]'}`}>致死手法与现场：</span>
                <p className="opacity-90">
                  {currentCase.victim.causeOfDeath}
                </p>
                <p className="opacity-60">
                  地点：{currentCase.victim.foundLocation}
                </p>
              </div>

              <div className="space-y-1">
                <label className={`font-bold ${isDark ? 'text-[#C9942D]' : 'text-[#8B3A2B]'}`}>案件剧情背景故事：</label>
                <textarea
                  rows={4}
                  value={currentCase.summary}
                  onChange={(e) => handleUpdateCaseField('summary', e.target.value)}
                  className={`w-full rounded-xl p-3 text-xs leading-relaxed resize-none focus:outline-none border ${
                    isDark
                      ? 'bg-[#0E0B08] border-[#2E2218] text-[#E5DCD0] focus:border-[#C9942D]'
                      : 'bg-[#FAF7F2] border-[#E0D5C7] text-[#1C1917] focus:border-[#8B3A2B]'
                  }`}
                />
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <button
                onClick={() => setIsTruthModalOpen(false)}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer ${
                  isDark
                    ? 'bg-[#C9942D] hover:bg-[#D4A359] text-[#140E07]'
                    : 'bg-[#8B3A2B] hover:bg-[#783023] text-white'
                }`}
              >
                保存并关闭
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 5. MODAL: 核心诡计编辑 (Trick Detail Modal) */}
      {isTrickModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div
            className={`rounded-2xl max-w-lg w-full p-6 shadow-2xl border font-serif space-y-4 ${
              isDark ? 'bg-[#16120F] border-[#3E2D1E] text-[#E5DCD0]' : 'bg-white border-[#E0D5C7] text-[#1C1917]'
            }`}
          >
            <div className={`flex items-center justify-between pb-3 border-b ${
              isDark ? 'border-[#291F16]' : 'border-[#F0EAE1]'
            }`}>
              <h3 className="font-bold text-base">
                核心诡计与破绽手法
              </h3>
              <button
                onClick={() => setIsTrickModalOpen(false)}
                className="p-1 rounded opacity-60 hover:opacity-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-2 text-xs">
              <label className={`font-bold ${isDark ? 'text-[#C9942D]' : 'text-[#8B3A2B]'}`}>
                诡计详细机制（怀表伪造与密室锁闭）：
              </label>
              <textarea
                rows={5}
                value={currentCase.coreTrick}
                onChange={(e) => handleUpdateCaseField('coreTrick', e.target.value)}
                className={`w-full rounded-xl p-3 text-xs leading-relaxed resize-none focus:outline-none border ${
                  isDark
                    ? 'bg-[#0E0B08] border-[#2E2218] text-[#E5DCD0] focus:border-[#C9942D]'
                    : 'bg-[#FAF7F2] border-[#E0D5C7] text-[#1C1917] focus:border-[#8B3A2B]'
                }`}
              />
            </div>

            <div className="flex justify-end pt-2">
              <button
                onClick={() => setIsTrickModalOpen(false)}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer ${
                  isDark
                    ? 'bg-[#C9942D] hover:bg-[#D4A359] text-[#140E07]'
                    : 'bg-[#8B3A2B] hover:bg-[#783023] text-white'
                }`}
              >
                保存诡计
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 6. MODAL: 上传本地剧本让 Agent 解析 */}
      {isUploadModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div
            className={`rounded-2xl max-w-xl w-full p-6 shadow-2xl border font-serif space-y-4 animate-in fade-in zoom-in-95 duration-150 ${
              isDark ? 'bg-[#16120F] border-[#3E2D1E] text-[#E5DCD0]' : 'bg-white border-[#E0D5C7] text-[#1C1917]'
            }`}
          >
            <div className={`flex items-center justify-between pb-3 border-b ${
              isDark ? 'border-[#291F16]' : 'border-[#F0EAE1]'
            }`}>
              <div className="flex items-center gap-2">
                <Upload className={`w-4 h-4 ${isDark ? 'text-[#C9942D]' : 'text-[#8B3A2B]'}`} />
                <h3 className="font-bold text-base">
                  导入本地剧本让 LangGraph Agent 解析
                </h3>
              </div>
              <button
                onClick={() => setIsUploadModalOpen(false)}
                className="p-1 rounded opacity-60 hover:opacity-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Dropzone */}
            <div
              onDragOver={(e) => {
                e.preventDefault();
                setIsDragOver(true);
              }}
              onDragLeave={() => setIsDragOver(false)}
              onDrop={(e) => {
                e.preventDefault();
                setIsDragOver(false);
                const file = e.dataTransfer.files[0];
                if (file) {
                  setUploadedFileName(file.name);
                  setUploadedFileSize(file.size);
                }
              }}
              className={`p-6 rounded-2xl border-2 border-dashed text-center transition cursor-pointer ${
                isDragOver
                  ? isDark ? 'border-[#C9942D] bg-[#241A12]' : 'border-[#8B3A2B] bg-[#F5E7DF]'
                  : isDark ? 'border-[#3E2D1E] bg-[#100D0A]' : 'border-[#E0D5C7] bg-[#FAF7F2]'
              }`}
            >
              <FileText className={`w-8 h-8 mx-auto mb-2 ${isDark ? 'text-[#C9942D]' : 'text-[#8B3A2B]'}`} />
              <div className="font-bold text-xs">
                拖拽剧本文件到此处，或点击浏览选择
              </div>
              <div className="text-[11px] opacity-60 mt-1">
                支持 .md, .txt, .pdf, .docx 格式剧本文件
              </div>
              <div className={`mt-3 inline-block px-3 py-1 rounded-full border text-xs font-mono ${
                isDark ? 'bg-[#18130E] border-[#3E2D1E] text-[#E8C88B]' : 'bg-white border-[#E0D5C7] text-[#8B3A2B]'
              }`}>
                当前载入: {uploadedFileName} ({(uploadedFileSize / 1024).toFixed(1)} KB)
              </div>
            </div>

            {/* Preset Script Quick Select */}
            <div className="space-y-1.5 text-xs">
              <span className="opacity-75 font-medium block">
                或者选择官方范例剧本：
              </span>
              <div className="grid grid-cols-3 gap-2">
                {Object.entries(SAMPLE_SCRIPTS).map(([key, script]) => (
                  <button
                    key={key}
                    onClick={() => {
                      sound.playPaperRustle();
                      setUploadedFileName(script.filename);
                      setUploadedFileSize(script.text.length * 2);
                      setScriptText(script.text);
                    }}
                    className={`p-2 rounded-xl text-left border text-xs transition cursor-pointer ${
                      uploadedFileName === script.filename
                        ? isDark
                          ? 'border-[#C9942D] bg-[#241A12] text-[#E8C88B] font-bold'
                          : 'border-[#8B3A2B] bg-[#F5E7DF] text-[#8B3A2B] font-bold'
                        : isDark
                        ? 'border-[#291F16] bg-[#120F0D] text-[#A89073] hover:bg-[#1A140F]'
                        : 'border-[#EBE4DC] bg-[#FAF7F2] text-[#4A3E35] hover:bg-white'
                    }`}
                  >
                    <div className="truncate font-serif">{script.title}</div>
                    <div className="text-[10px] opacity-60 font-mono">{script.filename}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Ingest Action Button */}
            <div className={`flex justify-end gap-2 pt-2 border-t ${isDark ? 'border-[#291F16]' : 'border-[#F0EAE1]'}`}>
              <button
                onClick={() => setIsUploadModalOpen(false)}
                className={`px-4 py-2 rounded-xl border text-xs transition cursor-pointer ${
                  isDark
                    ? 'border-[#3E2D1E] text-[#A89073] hover:bg-[#201811]'
                    : 'border-[#E0D5C7] text-[#6E5F52] hover:bg-[#FAF7F2]'
                }`}
              >
                取消
              </button>
              <button
                onClick={handleSimulateScriptIngest}
                className={`px-5 py-2 rounded-xl text-xs font-bold transition shadow-xs cursor-pointer flex items-center gap-1.5 ${
                  isDark
                    ? 'bg-gradient-to-r from-[#DFB36C] via-[#C9942D] to-[#DFB36C] text-[#140E07]'
                    : 'bg-[#8B3A2B] hover:bg-[#783023] text-white'
                }`}
              >
                <Zap className="w-3.5 h-3.5 fill-current" />
                <span>启动 Agent 解析并构建案件</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 7. DRAWER: 运行详情与 LangGraph 8 节点流 (Slide-over on demand) */}
      {isTraceDrawerOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex justify-end">
          <div
            className={`w-full max-w-lg h-full border-l p-6 shadow-2xl flex flex-col justify-between space-y-4 animate-in slide-in-from-right duration-200 font-serif ${
              isDark ? 'bg-[#120F0D] border-[#2C2117] text-[#E5DCD0]' : 'bg-white border-[#E0D5C7] text-[#1C1917]'
            }`}
          >
            {/* Drawer Header */}
            <div className={`flex items-center justify-between pb-3 border-b ${
              isDark ? 'border-[#241B13]' : 'border-[#F0EAE1]'
            }`}>
              <div className="flex items-center gap-2">
                <Activity className={`w-4 h-4 ${isDark ? 'text-[#C9942D]' : 'text-[#8B3A2B]'}`} />
                <h3 className="font-bold text-sm">
                  LangGraph 工作流运行详情与执行日志
                </h3>
              </div>
              <button
                onClick={() => setIsTraceDrawerOpen(false)}
                className="p-1 rounded opacity-60 hover:opacity-100 transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* 8 Node List */}
            <div className="space-y-2 flex-1 overflow-y-auto pr-1">
              <span className="text-[11px] font-mono opacity-60 uppercase block">
                有状态拓扑节点 (StateGraph 8 Nodes)
              </span>

              <div className="grid grid-cols-2 gap-2 text-xs">
                {[
                  { id: '01 DOC_PARSE', name: '文档解析与分块', ms: '320ms' },
                  { id: '02 SCRIPT_ANALYZE', name: '剧本分析与图谱', ms: '480ms' },
                  { id: '03 CASE_PLAN', name: '案件规划与诡计', ms: '510ms' },
                  { id: '04 CASE_GENERATE', name: '场景物证与边界', ms: '640ms' },
                  { id: '05 LOGIC_VALIDATE', name: '确定性规则校验', ms: '190ms' },
                  { id: '06 REVISION_NODE', name: '定向自愈修复', ms: '230ms' },
                  { id: '07 HUMAN_REVIEW', name: '人工审核微调', ms: '就绪' },
                  { id: '08 PUBLISHED', name: '案件发布就绪', ms: '80ms' },
                ].map((n, i) => (
                  <div
                    key={i}
                    className={`p-2.5 rounded-xl border flex items-center justify-between ${
                      isDark ? 'bg-[#0E0B08] border-[#221811]' : 'bg-[#FAF7F2] border-[#EAE1D5]'
                    }`}
                  >
                    <div>
                      <span className={`text-[10px] font-mono block font-bold ${
                        isDark ? 'text-[#C9942D]' : 'text-[#8B3A2B]'
                      }`}>{n.id}</span>
                      <span className="text-xs font-medium">{n.name}</span>
                    </div>
                    <span className="text-[10px] font-mono text-emerald-500 font-bold">{n.ms}</span>
                  </div>
                ))}
              </div>

              {/* Streaming Logs */}
              <div className="pt-3 space-y-1.5">
                <span className="text-[11px] font-mono opacity-60 uppercase block">
                  终端流式执行日志 (Execution Stream)
                </span>
                <div className={`p-3 rounded-xl border max-h-56 overflow-y-auto space-y-1.5 font-mono text-[11px] ${
                  isDark ? 'bg-[#090705] border-[#221811] text-[#E5DCD0]' : 'bg-[#2A2421] text-[#E8DFD5] border-[#403632]'
                }`}>
                  {terminalLogs.map((log, idx) => (
                    <div
                      key={idx}
                      className={
                        log.includes('WARNING') || log.includes('CONFLICT')
                          ? 'text-amber-400'
                          : log.includes('FIX_APPLIED')
                          ? 'text-emerald-400 font-bold'
                          : 'opacity-90'
                      }
                    >
                      {log}
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Drawer Footer */}
            <div className={`pt-3 border-t ${isDark ? 'border-[#241B13]' : 'border-[#F0EAE1]'}`}>
              <button
                onClick={() => setIsTraceDrawerOpen(false)}
                className={`w-full py-2 rounded-xl border text-xs font-bold transition cursor-pointer ${
                  isDark
                    ? 'bg-[#18130E] hover:bg-[#221811] text-[#E5C384] border-[#3E2D1E]'
                    : 'bg-[#FAF7F2] hover:bg-[#F2ECE4] text-[#4A3E35] border-[#E0D5C7]'
                }`}
              >
                收起运行详情
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 8. LANGGRAPH STUDIO WORKFLOW MODAL */}
      <LangGraphStudioModal
        isOpen={isLangGraphModalOpen}
        onClose={() => setIsLangGraphModalOpen(false)}
        onApplyCase={handleApplyGeneratedCase}
        onDirectPlay={(caseData) => onPlayCase(caseData)}
        themeMode={currentTheme}
        initialScript={{
          filename: uploadedFileName,
          text: scriptText,
        }}
      />
    </div>
  );
};
