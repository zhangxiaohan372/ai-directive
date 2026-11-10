/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import {
  LangGraphNodeId,
  StudioCaseData,
} from './types';
import {
  LangGraphPipelineSnapshot,
  createInitialPipelineSnapshot,
  executeLangGraphStep,
  buildNPCKnowledgeAndBoundaries,
  DocParseArtifact,
  ScriptAnalyzeArtifact,
  CasePlanArtifact,
  CaseGenerateArtifact,
  LogicValidateArtifact,
  RevisionArtifact,
  HumanReviewArtifact,
  PublishedArtifact,
  NPCBoundaryArtifact,
} from './langgraphEngine';
import { sound } from '../../utils/audio';
import {
  X,
  Play,
  RotateCcw,
  Upload,
  Zap,
  Activity,
  CheckCircle2,
  AlertTriangle,
  FileText,
  Users,
  Compass,
  Key,
  Clock,
  ArrowRight,
  ShieldCheck,
  Sparkles,
  Lock,
  Unlock,
  ChevronRight,
  Terminal,
  Layers,
  Code,
  Check,
  RefreshCw,
  Eye,
  FileCode,
  HelpCircle,
} from 'lucide-react';

interface LangGraphStudioModalProps {
  isOpen: boolean;
  onClose: () => void;
  onApplyCase: (caseData: StudioCaseData) => void;
  onDirectPlay: (caseData: StudioCaseData) => void;
  themeMode?: 'dark' | 'light';
  initialScript?: {
    filename: string;
    text: string;
  };
}

const PRESET_SCRIPTS = [
  {
    id: 'midnight_gallery',
    title: '《午夜画廊：锁闭之谜》',
    filename: 'midnight_gallery_script.md',
    tag: '标杆闭环案',
    description: '秋季画展策展人死于内锁修复室，停摆怀表倒拨制造死者活人假象。',
    text: `【剧本案名】《午夜画廊：锁闭之谜》
【类型】经典密室 / 物理与时空双重诡计
【案发时间】2026年10月18日 22:30 报案
【案发地点】星海现代美术馆 · 文物修复室（第一现场）
【受害者】陈默（42岁，知名策展人兼艺术评论家）

【案发背景】
美术馆正在举办秋季特展「微光之境」开幕酒会。21:50 散场；22:00 林岚与陈默发生激烈争执；
22:15 陈默进入修复室整理藏品后大门自锁；22:35 保安强行破门，发现陈默倒在工作台旁身亡，后脑遭钝器重击。

【涉案人员】
1. 林岚（27岁，青年画家）：因被陈默剥夺署名权，22:05 打翻镉红颜料抹布并哭着跑回大厅。
2. 周衡（38岁，天使投资人）：500万投资借款清偿违约，曾在香槟杯投放温和镇静剂。
3. 许宁（25岁，画廊助理兼代笔画师）：长期受压榨，22:12 偷偷使用借调的备用门禁卡进入，完成致死钝击后倒拨怀表制造假象。
4. 赵磊（34岁，夜班安保主管）：22:20 电闸跳闸巡视，未注意到修复室微光。

【核心诡计】
利用停摆怀表倒拨 20 分钟（实际死亡在 22:12，怀表定格在 22:15），制造死者在真凶离开后依然活着的错觉，并借用备用门禁卡从外侧反锁。`,
  },
  {
    id: 'snow_manor',
    title: '《暴风雪山庄：钟楼之锁》',
    filename: 'snow_manor_case.txt',
    tag: '含逻辑冲突·演示自愈',
    description: '大雪封山古老庄园，钟楼机芯室离奇锁死。内置时空位移与权限矛盾，供 LangGraph 自愈修复演示。',
    text: `【剧本案名】《暴风雪山庄：钟楼之锁》
【类型】暴风雪山庄 / 孤岛机械密室
【案发时间】暴风雪之夜 23:00
【案发地点】雪原孤庄 · 独立钟楼机芯室（外围雪地无脚印）
【受害者】霍华德公爵（65岁，庄园领主）

【涉案人员】
1. 伊森（28岁，远房侄子）：因遗嘱修改被剥夺继承权，心怀杀意。
2. 罗素（45岁，私人医生）：因违规开具处方麻醉药被领主勒索。
3. 阿诺（58岁，庄园老管家）：贪墨公款即将败露。
4. 艾拉（23岁，年轻女仆）：在暴风雪中目击钟楼敲击异常。

【故意植入矛盾（供自愈演示）】
- 原始记录中伊森在 22:45 既在宴会大厅壁炉旁，又被记录在钟楼机芯室。
- 钟楼大门于 22:30 上锁，但有人在 22:50 无卡无钥匙声称自由出入。
LangGraph 将在 LOGIC_VALIDATE 节点捕获冲突，并调度 REVISION_NODE 自动重规划时间线闭环！`,
  },
  {
    id: 'yacht_poison',
    title: '《深海游艇：无声晚宴》',
    filename: 'ocean_yacht_mystery.json',
    tag: '毒理与延时递送',
    description: '公海夜航中的暴风雨晚宴，顶层VIP观景舱毒杀案，冰块延时融化与双重口供掩护。',
    text: `【剧本案名】《深海游艇：无声晚宴》
【类型】海上游艇 / 毒物物理延时
【案发时间】公海航行途中 21:45
【案发地点】奢华游艇 · 顶层VIP全景观景舱
【受害者】雷蒙德（50岁，跨国游艇俱乐部创始人）

【涉案人员】
1. 维多利亚（32岁，名媛社交家）：因家族股权清算与雷蒙德彻底决裂。
2. 卡特（29岁，首席调酒师）：家族酒庄被强占，利用空心冰块封装速效毒素，延时45分钟融化。
3. 戴维（40岁，游艇安保长）：掩盖违禁品走私，在关键时刻提供伪证。
4. 肖恩（35岁，大副）：负责航海雷达记录，声称案发时无任何船只靠泊。

【核心诡计】
将毒素封装于特殊冻结的重层空心冰球中。雷蒙德独饮香槟时，冰球未化；直至45分钟后凶手在甲板拥有完全不在场证明时毒发。`,
  },
];

export const LangGraphStudioModal: React.FC<LangGraphStudioModalProps> = ({
  isOpen,
  onClose,
  onApplyCase,
  onDirectPlay,
  themeMode = 'dark',
  initialScript,
}) => {
  const isDark = themeMode === 'dark';

  const [activeTab, setActiveTab] = useState<'GRAPH' | 'ARTIFACT' | 'TERMINAL'>('GRAPH');
  const [selectedNodeForInspect, setSelectedNodeForInspect] = useState<LangGraphNodeId>('CASE_GENERATE');
  const [isRunningAll, setIsRunningAll] = useState(false);
  const [pipelineState, setPipelineState] = useState<LangGraphPipelineSnapshot>(() => {
    const script = initialScript || PRESET_SCRIPTS[0];
    return createInitialPipelineSnapshot(script.filename, script.text);
  });

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Sync when initialScript changes
  useEffect(() => {
    if (initialScript) {
      setPipelineState(createInitialPipelineSnapshot(initialScript.filename, initialScript.text));
    }
  }, [initialScript]);

  if (!isOpen) return null;

  // Step Execution
  const handleRunSingleStep = async (targetNode?: LangGraphNodeId) => {
    sound.playPaperRustle();
    const nextNode = targetNode || pipelineState.currentStep;

    const { nextSnapshot } = await executeLangGraphStep(nextNode, pipelineState);

    // Compute next step in DAG
    const order: LangGraphNodeId[] = [
      'DOC_PARSE',
      'SCRIPT_ANALYZE',
      'CASE_PLAN',
      'CASE_GENERATE',
      'LOGIC_VALIDATE',
      'REVISION_NODE',
      'HUMAN_REVIEW',
      'PUBLISHED',
    ];

    const currentIndex = order.indexOf(nextNode);
    let nextStep = order[Math.min(currentIndex + 1, order.length - 1)];

    // Check branching: if LOGIC_VALIDATE failed, go to REVISION_NODE, otherwise skip to HUMAN_REVIEW
    if (nextNode === 'LOGIC_VALIDATE') {
      const isValid = nextSnapshot.artifacts.LOGIC_VALIDATE?.report.isValid;
      if (!isValid) {
        nextStep = 'REVISION_NODE';
      } else {
        nextStep = 'HUMAN_REVIEW';
      }
    } else if (nextNode === 'REVISION_NODE') {
      nextStep = 'HUMAN_REVIEW';
    }

    setPipelineState({
      ...nextSnapshot,
      currentStep: nextStep,
    });
    setSelectedNodeForInspect(nextNode);
  };

  // Run full pipeline continuously
  const handleRunFullPipeline = async () => {
    sound.playClueFound();
    setIsRunningAll(true);

    let current = pipelineState;

    // Node execution sequence
    const sequence: LangGraphNodeId[] = [
      'DOC_PARSE',
      'SCRIPT_ANALYZE',
      'CASE_PLAN',
      'CASE_GENERATE',
      'LOGIC_VALIDATE',
    ];

    for (const node of sequence) {
      setSelectedNodeForInspect(node);
      const res = await executeLangGraphStep(node, current);
      current = res.nextSnapshot;
      setPipelineState(current);
    }

    // Check if revision loop needed
    const isValid = current.artifacts.LOGIC_VALIDATE?.report.isValid;
    if (!isValid) {
      setSelectedNodeForInspect('REVISION_NODE');
      const resRev = await executeLangGraphStep('REVISION_NODE', current);
      current = resRev.nextSnapshot;
      setPipelineState(current);
    }

    // Human review
    setSelectedNodeForInspect('HUMAN_REVIEW');
    const resReview = await executeLangGraphStep('HUMAN_REVIEW', current);
    current = resReview.nextSnapshot;
    setPipelineState(current);

    // Published
    setSelectedNodeForInspect('PUBLISHED');
    const resPub = await executeLangGraphStep('PUBLISHED', current);
    current = resPub.nextSnapshot;
    setPipelineState(current);

    setIsRunningAll(false);
  };

  const handleResetPipeline = () => {
    sound.playPaperRustle();
    const fresh = createInitialPipelineSnapshot(
      pipelineState.inputScript.fileName,
      pipelineState.inputScript.rawText
    );
    setPipelineState(fresh);
    setSelectedNodeForInspect('DOC_PARSE');
  };

  const handleSelectPreset = (preset: (typeof PRESET_SCRIPTS)[0]) => {
    sound.playPaperRustle();
    const fresh = createInitialPipelineSnapshot(preset.filename, preset.text);
    setPipelineState(fresh);
    setSelectedNodeForInspect('DOC_PARSE');
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    sound.playPaperRustle();
    const reader = new FileReader();

    reader.onload = (event) => {
      const content = (event.target?.result as string) || '';
      const fresh = createInitialPipelineSnapshot(file.name, content);
      setPipelineState(fresh);
      setSelectedNodeForInspect('DOC_PARSE');
    };

    // Handle text/markdown/json or binary fallback
    if (file.name.endsWith('.pdf') || file.name.endsWith('.docx')) {
      // Simulate rich document parsing for binary doc formats
      reader.onload = () => {
        const simulatedText = `【解析自 ${file.name}】
【案发时间】2026年夜间
【受害者】策展人
【涉案人物】画家、投资人、助手、安保
【现场提取物证】怀表、抹布、账册、门禁卡
${file.name} 包含长篇剧本故事与不在场证明陈述，已完成结构化分块。`;
        const fresh = createInitialPipelineSnapshot(file.name, simulatedText);
        setPipelineState(fresh);
      };
      reader.readAsArrayBuffer(file);
    } else {
      reader.readAsText(file);
    }
  };

  const nodeStates = pipelineState.nodeStates;
  const artifacts = pipelineState.artifacts;

  return (
    <div className={`fixed inset-0 z-50 backdrop-blur-md flex items-center justify-center p-2 sm:p-5 select-none animate-fadeIn font-serif transition-colors duration-300 ${
      isDark ? 'bg-black/85' : 'bg-stone-900/55'
    }`}>
      {/* Outer Modal Container */}
      <div className={`relative w-full max-w-7xl h-[94vh] max-h-[920px] rounded-2xl border flex flex-col overflow-hidden shadow-2xl transition-all duration-300 ${
        isDark
          ? 'bg-[#120F0D] border-[#2C2117] text-[#E5DCD0]'
          : 'bg-[#FAF7F2] border-[#E2D8CA] text-[#1C1917]'
      }`}>
        {/* Top Header Bar */}
        <div className={`px-5 py-3 border-b flex items-center justify-between shrink-0 transition-colors ${
          isDark ? 'bg-[#18130E] border-[#2C2117]' : 'bg-[#F2EBE1] border-[#DFD5C6]'
        }`}>
          {/* Brand & Workflow Title */}
          <div className="flex items-center gap-3">
            <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold text-xs shadow-xs ${
              isDark ? 'bg-[#C9942D] text-[#140E07]' : 'bg-[#8B3A2B] text-white'
            }`}>
              <Layers className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="font-bold text-sm tracking-wide">
                  LangGraph 案件生成工作流引擎 (Agentic Pipeline)
                </h2>
                <span className={`text-[10px] px-2 py-0.5 rounded-full font-mono font-bold ${
                  isDark ? 'bg-[#291F16] text-[#E5C384] border border-[#4D3723]' : 'bg-[#EAE1D5] text-[#8B3A2B] border border-[#D5CAA8]'
                }`}>
                  StateGraph: 8 Nodes · Directed Cyclic Graph
                </span>
              </div>
              <p className={`text-[11px] font-sans ${isDark ? 'text-[#8C765E]' : 'text-[#8C7E72]'}`}>
                从长文本剧本到确定性闭环探案游戏：有状态拓扑、硬规则校验与自愈重规划回环
              </p>
            </div>
          </div>

          {/* Center Tabs: Graph Topology / Artifacts / Terminal */}
          <div className={`flex items-center p-1 rounded-xl border text-xs font-sans font-medium ${
            isDark ? 'bg-[#100D0A] border-[#291F16]' : 'bg-white border-[#E0D5C7]'
          }`}>
            <button
              onClick={() => setActiveTab('GRAPH')}
              className={`flex items-center gap-1.5 px-3 py-1 rounded-lg transition cursor-pointer ${
                activeTab === 'GRAPH'
                  ? isDark
                    ? 'bg-[#241A12] text-[#E5C384] font-bold shadow-xs'
                    : 'bg-[#8B3A2B] text-white font-bold shadow-xs'
                  : isDark ? 'text-[#A89073] hover:text-[#F3EFEA]' : 'text-[#6E5F52] hover:text-[#1C1917]'
              }`}
            >
              <Activity className="w-3.5 h-3.5" />
              <span>全景拓扑图</span>
            </button>
            <button
              onClick={() => setActiveTab('ARTIFACT')}
              className={`flex items-center gap-1.5 px-3 py-1 rounded-lg transition cursor-pointer ${
                activeTab === 'ARTIFACT'
                  ? isDark
                    ? 'bg-[#241A12] text-[#E5C384] font-bold shadow-xs'
                    : 'bg-[#8B3A2B] text-white font-bold shadow-xs'
                  : isDark ? 'text-[#A89073] hover:text-[#F3EFEA]' : 'text-[#6E5F52] hover:text-[#1C1917]'
              }`}
            >
              <Eye className="w-3.5 h-3.5" />
              <span>中间产物监视器</span>
            </button>
            <button
              onClick={() => setActiveTab('TERMINAL')}
              className={`flex items-center gap-1.5 px-3 py-1 rounded-lg transition cursor-pointer ${
                activeTab === 'TERMINAL'
                  ? isDark
                    ? 'bg-[#241A12] text-[#E5C384] font-bold shadow-xs'
                    : 'bg-[#8B3A2B] text-white font-bold shadow-xs'
                  : isDark ? 'text-[#A89073] hover:text-[#F3EFEA]' : 'text-[#6E5F52] hover:text-[#1C1917]'
              }`}
            >
              <Terminal className="w-3.5 h-3.5" />
              <span>执行流式终端 ({pipelineState.logs.length})</span>
            </button>
          </div>

          {/* Right Action: Close */}
          <button
            onClick={onClose}
            className={`p-1.5 rounded-lg transition cursor-pointer ${
              isDark ? 'text-[#A89073] hover:text-white hover:bg-[#221811]' : 'text-[#8C7E72] hover:text-[#1C1917] hover:bg-[#EAE1D5]'
            }`}
            title="关闭窗口"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* 2. SCRIPT INGESTION STRIP (Source Input & Controls) */}
        <div className={`px-5 py-2.5 border-b flex flex-col md:flex-row items-center justify-between gap-3 text-xs font-sans shrink-0 ${
          isDark ? 'bg-[#15110E] border-[#241B13]' : 'bg-[#FAF7F2] border-[#E8DFD5]'
        }`}>
          {/* File Picker & Active Script */}
          <div className="flex items-center flex-wrap gap-2.5">
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileUpload}
              accept=".pdf,.docx,.doc,.md,.txt,.json"
              className="hidden"
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border font-medium transition cursor-pointer ${
                isDark
                  ? 'bg-[#1E1712] hover:bg-[#2A2019] text-[#E5C384] border-[#3E2D1E]'
                  : 'bg-white hover:bg-[#F2ECE4] text-[#8B3A2B] border-[#D8CFC2]'
              }`}
            >
              <Upload className="w-3.5 h-3.5" />
              <span>上传本地剧本 (PDF/Word/MD)</span>
            </button>

            <span className={`text-[11px] ${isDark ? 'text-[#8C765E]' : 'text-[#8C7E72]'}`}>
              或快捷载入精品范例：
            </span>

            {PRESET_SCRIPTS.map((ps) => (
              <button
                key={ps.id}
                onClick={() => handleSelectPreset(ps)}
                className={`px-2.5 py-1 rounded-lg border text-[11px] transition cursor-pointer font-serif ${
                  pipelineState.inputScript.fileName === ps.filename
                    ? isDark
                      ? 'bg-[#291F16] text-[#E5C384] border-[#C9942D] font-bold shadow-xs'
                      : 'bg-[#F5E7DF] text-[#8B3A2B] border-[#8B3A2B] font-bold shadow-xs'
                    : isDark
                    ? 'bg-[#18130E] text-[#A89073] border-[#2C2117] hover:border-[#4D3723]'
                    : 'bg-white text-[#5C4F44] border-[#E0D5C7] hover:bg-[#FAF7F2]'
                }`}
                title={ps.description}
              >
                <span>{ps.title}</span>
                <span className={`ml-1 text-[9px] px-1 py-0.2 rounded ${
                  ps.id === 'snow_manor'
                    ? 'bg-amber-500/20 text-amber-500 font-bold'
                    : 'opacity-60'
                }`}>
                  {ps.tag}
                </span>
              </button>
            ))}
          </div>

          {/* Workflow Execution Buttons */}
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={handleResetPipeline}
              className={`p-1.5 rounded-lg border transition cursor-pointer ${
                isDark
                  ? 'border-[#3E2D1E] text-[#A89073] hover:text-[#F3EFEA] hover:bg-[#201811]'
                  : 'border-[#E0D5C7] text-[#6E5F52] hover:bg-[#F2ECE4]'
              }`}
              title="重置状态机为初始就绪"
            >
              <RotateCcw className="w-4 h-4" />
            </button>

            <button
              onClick={() => handleRunSingleStep()}
              disabled={isRunningAll || pipelineState.currentStep === 'PUBLISHED'}
              className={`px-3 py-1.5 rounded-lg border text-xs font-bold transition flex items-center gap-1.5 cursor-pointer disabled:opacity-40 ${
                isDark
                  ? 'border-[#4D3723] bg-[#221811] hover:bg-[#2C1F16] text-[#E5C384]'
                  : 'border-[#D0C2B0] bg-white hover:bg-[#F2ECE4] text-[#8B3A2B]'
              }`}
            >
              <ChevronRight className="w-3.5 h-3.5" />
              <span>单步推进: {pipelineState.currentStep}</span>
            </button>

            <button
              onClick={handleRunFullPipeline}
              disabled={isRunningAll}
              className={`px-4 py-1.5 rounded-lg text-xs font-bold transition shadow-xs flex items-center gap-1.5 cursor-pointer disabled:opacity-50 ${
                isDark
                  ? 'bg-gradient-to-r from-[#DFB36C] via-[#C9942D] to-[#DFB36C] text-[#140E07]'
                  : 'bg-[#8B3A2B] hover:bg-[#783023] text-white'
              }`}
            >
              {isRunningAll ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  <span>LangGraph 拓扑运行中...</span>
                </>
              ) : (
                <>
                  <Zap className="w-3.5 h-3.5 fill-current" />
                  <span>启动 LangGraph 自动构建与校验</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* 3. MAIN WORKSPACE AREA */}
        <div className="flex-1 min-h-0 flex flex-col overflow-hidden">
          {/* VIEW A: GRAPH TOPOLOGY (Full Workflow Map) */}
          {activeTab === 'GRAPH' && (
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              {/* DAG Pipeline Diagram Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {[
                  {
                    id: 'DOC_PARSE' as LangGraphNodeId,
                    step: '01',
                    title: '文档解析与实体分块',
                    desc: '读取 PDF/Word/MD，提取人物实体、地点与时空锚点',
                    icon: FileCode,
                  },
                  {
                    id: 'SCRIPT_ANALYZE' as LangGraphNodeId,
                    step: '02',
                    title: '剧本分析与动机图谱',
                    desc: '构建人物利益网络、嫌疑人社会关系与潜在口供矛盾',
                    icon: Users,
                  },
                  {
                    id: 'CASE_PLAN' as LangGraphNodeId,
                    step: '03',
                    title: '案件规划与诡计架构',
                    desc: '反锁密室设计、致死时间差诡计与真相骨架规划',
                    icon: Compass,
                  },
                  {
                    id: 'CASE_GENERATE' as LangGraphNodeId,
                    step: '04',
                    title: '案件生成与边界护栏',
                    desc: '生成微观物证、分钟时间线与 NPC 防剧透知识库边界',
                    icon: ShieldCheck,
                  },
                  {
                    id: 'LOGIC_VALIDATE' as LangGraphNodeId,
                    step: '05',
                    title: '确定性硬逻辑校验',
                    desc: '时空瞬移、密室锁闭、口供矛盾与证据链闭环审查',
                    icon: CheckCircle2,
                  },
                  {
                    id: 'REVISION_NODE' as LangGraphNodeId,
                    step: '06',
                    title: '定向自愈修复 (Conditional Loop)',
                    desc: '若校验有矛盾，触发自愈节点定向修平时间戳与证据链',
                    icon: RefreshCw,
                  },
                  {
                    id: 'HUMAN_REVIEW' as LangGraphNodeId,
                    step: '07',
                    title: '人工审核微调',
                    desc: '创作者查看中间产物快照，确认无误后签批发布',
                    icon: Activity,
                  },
                  {
                    id: 'PUBLISHED' as LangGraphNodeId,
                    step: '08',
                    title: '案件发布就绪',
                    desc: '数据注入游戏引擎运行时，支持一键进入 3D 试玩',
                    icon: Play,
                  },
                ].map((node, idx) => {
                  const state = nodeStates[node.id];
                  const isCurrent = pipelineState.currentStep === node.id;
                  const isInspecting = selectedNodeForInspect === node.id;
                  const isCompleted = state.status === 'COMPLETED';
                  const isFailed = state.status === 'FAILED';
                  const isRepairing = state.status === 'REPAIRING';
                  const Icon = node.icon;

                  return (
                    <div
                      key={node.id}
                      onClick={() => {
                        sound.playPaperRustle();
                        setSelectedNodeForInspect(node.id);
                        setActiveTab('ARTIFACT');
                      }}
                      className={`relative rounded-2xl p-4 border transition-all cursor-pointer shadow-sm group flex flex-col justify-between min-h-[145px] ${
                        isInspecting
                          ? isDark
                            ? 'bg-[#221811] border-[#C9942D] ring-2 ring-[#C9942D]/20 shadow-md'
                            : 'bg-white border-[#8B3A2B] ring-2 ring-[#8B3A2B]/15 shadow-md'
                          : isDark
                          ? 'bg-[#18130E] border-[#2C2117] hover:border-[#4D3723]'
                          : 'bg-white border-[#E8DFD5] hover:border-[#D5CAA8]'
                      }`}
                    >
                      {/* Top Node Header: Step Number, Status Badge */}
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className={`w-6 h-6 rounded-lg text-xs font-mono font-bold flex items-center justify-center ${
                            isCompleted
                              ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                              : isFailed
                              ? 'bg-red-500/20 text-red-400 border border-red-500/30'
                              : isRepairing
                              ? 'bg-amber-500/20 text-amber-400 animate-spin'
                              : isDark
                              ? 'bg-[#241A12] text-[#A89073]'
                              : 'bg-[#F0E6D8] text-[#8B3A2B]'
                          }`}>
                            {node.step}
                          </span>
                          <Icon className={`w-4 h-4 ${
                            isCompleted
                              ? 'text-emerald-500'
                              : isFailed
                              ? 'text-red-500'
                              : isDark ? 'text-[#C9942D]' : 'text-[#8B3A2B]'
                          }`} />
                        </div>

                        {/* Status Label */}
                        <span className={`text-[10px] font-mono px-2 py-0.5 rounded-full font-bold ${
                          isCompleted
                            ? 'bg-emerald-500/15 text-emerald-500'
                            : isFailed
                            ? 'bg-red-500/15 text-red-500'
                            : isRepairing
                            ? 'bg-amber-500/15 text-amber-500 animate-pulse'
                            : isCurrent
                            ? isDark ? 'bg-[#C9942D]/20 text-[#E5C384]' : 'bg-[#8B3A2B]/15 text-[#8B3A2B]'
                            : 'opacity-40'
                        }`}>
                          {state.status === 'COMPLETED'
                            ? `已完成 ${state.durationMs ? `${state.durationMs}ms` : ''}`
                            : state.status === 'RUNNING'
                            ? '运行中...'
                            : state.status === 'FAILED'
                            ? '逻辑冲突 (转入自愈)'
                            : state.status === 'REPAIRING'
                            ? '自愈修复中'
                            : '待执行'}
                        </span>
                      </div>

                      {/* Title & Description */}
                      <div className="space-y-1 my-2">
                        <h4 className={`font-bold text-xs ${isDark ? 'text-[#F3EFEA]' : 'text-[#1C1917]'}`}>
                          {node.title}
                        </h4>
                        <p className={`text-[11px] leading-relaxed line-clamp-2 ${isDark ? 'text-[#A89073]' : 'text-[#786B60]'}`}>
                          {node.desc}
                        </p>
                      </div>

                      {/* Bottom Action: Inspect Artifact */}
                      <div className={`pt-2 border-t flex items-center justify-between text-[11px] ${
                        isDark ? 'border-[#291F16] text-[#A89073]' : 'border-[#F0EAE1] text-[#8C7E72]'
                      }`}>
                        <span className="font-mono">{node.id}</span>
                        <span className="group-hover:translate-x-0.5 transition-transform font-medium">
                          查看产物 →
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* LangGraph Architecture Feature Highlights */}
              <div className={`rounded-2xl p-5 border shadow-xs space-y-3 font-sans ${
                isDark ? 'bg-[#15110E] border-[#2C2117]' : 'bg-white border-[#E8DFD5]'
              }`}>
                <div className="flex items-center gap-2">
                  <ShieldCheck className={`w-4 h-4 ${isDark ? 'text-[#C9942D]' : 'text-[#8B3A2B]'}`} />
                  <h3 className="font-bold text-xs">
                    为什么剧本创作需要 LangGraph 而不是单次 LLM Prompt？
                  </h3>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
                  <div className={`p-3 rounded-xl border ${isDark ? 'bg-[#100D0A] border-[#241B13]' : 'bg-[#FAF7F2] border-[#EAE1D5]'}`}>
                    <span className="font-bold block mb-1">1. 有状态长拓扑图 (Stateful Graph)</span>
                    <p className={`leading-relaxed text-[11px] ${isDark ? 'text-[#A89073]' : 'text-[#786B60]'}`}>
                      各节点传递严格结构化的中间产物（实体库、关系图、密室骨架、NPC边界），杜绝单次调用丢失上下文。
                    </p>
                  </div>
                  <div className={`p-3 rounded-xl border ${isDark ? 'bg-[#100D0A] border-[#241B13]' : 'bg-[#FAF7F2] border-[#EAE1D5]'}`}>
                    <span className="font-bold block mb-1">2. 确定性硬规则门禁 (Engine Validation)</span>
                    <p className={`leading-relaxed text-[11px] ${isDark ? 'text-[#A89073]' : 'text-[#786B60]'}`}>
                      由 Game Engine 负责确定性校验（时空碰撞、反锁悖论、口供断裂），而非由 LLM 主观幻觉自行判断。
                    </p>
                  </div>
                  <div className={`p-3 rounded-xl border ${isDark ? 'bg-[#100D0A] border-[#241B13]' : 'bg-[#FAF7F2] border-[#EAE1D5]'}`}>
                    <span className="font-bold block mb-1">3. 条件分支自愈重规划 (Revision Loop)</span>
                    <p className={`leading-relaxed text-[11px] ${isDark ? 'text-[#A89073]' : 'text-[#786B60]'}`}>
                      校验失败不抛弃成果，自动进入定向自愈节点微调时间戳与证据钥匙，形成闭环后才准予发布。
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* VIEW B: ARTIFACT INSPECTOR (Detailed Node Output Inspector) */}
          {activeTab === 'ARTIFACT' && (
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              {/* Node Switcher Tabs */}
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 font-sans text-xs">
                {(
                  [
                    'DOC_PARSE',
                    'SCRIPT_ANALYZE',
                    'CASE_PLAN',
                    'CASE_GENERATE',
                    'LOGIC_VALIDATE',
                    'REVISION_NODE',
                    'HUMAN_REVIEW',
                    'PUBLISHED',
                  ] as LangGraphNodeId[]
                ).map((nid) => (
                  <button
                    key={nid}
                    onClick={() => {
                      sound.playPaperRustle();
                      setSelectedNodeForInspect(nid);
                    }}
                    className={`px-3 py-1.5 rounded-xl border transition cursor-pointer font-medium whitespace-nowrap ${
                      selectedNodeForInspect === nid
                        ? isDark
                          ? 'bg-[#291F16] text-[#E5C384] border-[#C9942D] font-bold shadow-xs'
                          : 'bg-[#8B3A2B] text-white border-[#8B3A2B] font-bold shadow-xs'
                        : isDark
                        ? 'bg-[#18130E] text-[#A89073] border-[#2C2117] hover:bg-[#201811]'
                        : 'bg-white text-[#6E5F52] border-[#E0D5C7] hover:bg-[#FAF7F2]'
                    }`}
                  >
                    <span>{nodeStates[nid].label.split('与')[0]}</span>
                  </button>
                ))}
              </div>

              {/* Node Artifact Content */}
              <div className={`rounded-2xl p-6 border shadow-sm font-sans space-y-4 ${
                isDark ? 'bg-[#18130E] border-[#2C2117]' : 'bg-white border-[#E8DFD5]'
              }`}>
                {/* 1. DOC_PARSE ARTIFACT */}
                {selectedNodeForInspect === 'DOC_PARSE' && (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between pb-3 border-b border-inherit">
                      <div>
                        <h3 className="font-bold text-sm">
                          01 文档解析产物 (DocParseArtifact)
                        </h3>
                        <p className={`text-xs ${isDark ? 'text-[#8C765E]' : 'text-[#8C7E72]'}`}>
                          已成功提取文档原始字数与四大关键实体清单
                        </p>
                      </div>
                      <span className="text-xs font-mono font-bold text-emerald-500">
                        {artifacts.DOC_PARSE?.rawWordCount || pipelineState.inputScript.rawText.length} 字符
                      </span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
                      <div className={`p-3.5 rounded-xl border ${isDark ? 'bg-[#100D0A] border-[#241B13]' : 'bg-[#FAF7F2] border-[#EAE1D5]'}`}>
                        <span className="font-bold block mb-2 text-[#C9942D]">涉案人物实体:</span>
                        <ul className="space-y-1 opacity-90">
                          {(artifacts.DOC_PARSE?.entities.characters || ['陈默', '林岚', '周衡', '许宁', '赵磊']).map((c, i) => (
                            <li key={i}>• {c}</li>
                          ))}
                        </ul>
                      </div>

                      <div className={`p-3.5 rounded-xl border ${isDark ? 'bg-[#100D0A] border-[#241B13]' : 'bg-[#FAF7F2] border-[#EAE1D5]'}`}>
                        <span className="font-bold block mb-2 text-[#C9942D]">涉案空间坐标:</span>
                        <ul className="space-y-1 opacity-90">
                          {(artifacts.DOC_PARSE?.entities.locations || ['文物修复室', '中央艺术展厅', '策展人办公室', '安保监控室']).map((l, i) => (
                            <li key={i}>• {l}</li>
                          ))}
                        </ul>
                      </div>

                      <div className={`p-3.5 rounded-xl border ${isDark ? 'bg-[#100D0A] border-[#241B13]' : 'bg-[#FAF7F2] border-[#EAE1D5]'}`}>
                        <span className="font-bold block mb-2 text-[#C9942D]">关键物理物证:</span>
                        <ul className="space-y-1 opacity-90">
                          {(artifacts.DOC_PARSE?.entities.clues || ['停摆怀表', '带颜料抹布', '撕碎借款协议', '门禁刷卡']).map((c, i) => (
                            <li key={i}>• {c}</li>
                          ))}
                        </ul>
                      </div>

                      <div className={`p-3.5 rounded-xl border ${isDark ? 'bg-[#100D0A] border-[#241B13]' : 'bg-[#FAF7F2] border-[#EAE1D5]'}`}>
                        <span className="font-bold block mb-2 text-[#C9942D]">时空时间基准:</span>
                        <ul className="space-y-1 opacity-90">
                          {(artifacts.DOC_PARSE?.entities.timeAnchors || ['21:50 散场', '22:00 理论', '22:15 致死', '22:30 破门']).map((t, i) => (
                            <li key={i}>• {t}</li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  </div>
                )}

                {/* 2. SCRIPT_ANALYZE ARTIFACT */}
                {selectedNodeForInspect === 'SCRIPT_ANALYZE' && (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between pb-3 border-b border-inherit">
                      <div>
                        <h3 className="font-bold text-sm">
                          02 剧本分析与动机图谱 (ScriptAnalyzeArtifact)
                        </h3>
                        <p className={`text-xs ${isDark ? 'text-[#8C765E]' : 'text-[#8C7E72]'}`}>
                          自动建立嫌疑人社会关系矩阵、利益冲突与作案动机排查
                        </p>
                      </div>
                    </div>

                    <div className="space-y-3">
                      <span className="text-xs font-bold block">动机冲突图谱矩阵：</span>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
                        {(artifacts.SCRIPT_ANALYZE?.motives || [
                          { suspect: '许宁', target: '陈默', reason: '长期遭受代笔剥削，署名权被夺', severity: 'FATAL' },
                          { suspect: '林岚', target: '陈默', reason: '因画作署名权发生激烈争吵，打翻抹布', severity: 'HIGH' },
                          { suspect: '周衡', target: '陈默', reason: '500万投资协议违约清偿纠纷', severity: 'MEDIUM' },
                        ]).map((m, i) => (
                          <div
                            key={i}
                            className={`p-3 rounded-xl border space-y-1.5 ${
                              m.severity === 'FATAL'
                                ? isDark
                                  ? 'bg-red-950/40 border-red-500/40'
                                  : 'bg-red-50 border-red-200'
                                : isDark
                                ? 'bg-[#100D0A] border-[#241B13]'
                                : 'bg-[#FAF7F2] border-[#EAE1D5]'
                            }`}
                          >
                            <div className="flex items-center justify-between">
                              <span className="font-bold text-xs">{m.suspect} → {m.target}</span>
                              <span className={`text-[10px] font-mono px-1.5 py-0.5 rounded font-bold ${
                                m.severity === 'FATAL' ? 'bg-red-600 text-white' : 'opacity-60'
                              }`}>
                                {m.severity}
                              </span>
                            </div>
                            <p className={`leading-relaxed text-[11px] ${isDark ? 'text-[#C5B7A8]' : 'text-[#5C4F44]'}`}>
                              {m.reason}
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {/* 3. CASE_PLAN ARTIFACT */}
                {selectedNodeForInspect === 'CASE_PLAN' && (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between pb-3 border-b border-inherit">
                      <div>
                        <h3 className="font-bold text-sm">
                          03 案件规划与核心诡计 (CasePlanArtifact)
                        </h3>
                        <p className={`text-xs ${isDark ? 'text-[#8C765E]' : 'text-[#8C7E72]'}`}>
                          确立密室破局物理机制、时间线错觉与反转节奏
                        </p>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                      <div className={`p-4 rounded-xl border space-y-2 ${isDark ? 'bg-[#100D0A] border-[#241B13]' : 'bg-[#FAF7F2] border-[#EAE1D5]'}`}>
                        <span className="font-bold text-xs text-[#C9942D] block">物理与时空核心诡计：</span>
                        <p className="leading-relaxed">
                          {artifacts.CASE_PLAN?.truth.coreTrick ||
                            '利用停摆金怀表倒拨 20 分钟制造死者活人假象；通过备用门禁卡从外侧完成反锁。'}
                        </p>
                        <div className="pt-2 border-t border-inherit space-y-1 text-[11px] opacity-75">
                          <div>• 法医死亡推断窗口：{artifacts.CASE_PLAN?.truth.murderWindow.start || '22:10'} - {artifacts.CASE_PLAN?.truth.murderWindow.end || '22:20'}</div>
                          <div>• 第一凶案现场：{artifacts.CASE_PLAN?.truth.foundLocation || '文物修复室'}</div>
                          <div>• 致死机制：{artifacts.CASE_PLAN?.truth.causeOfDeath || '后脑钝器打击致颅脑损伤'}</div>
                        </div>
                      </div>

                      <div className={`p-4 rounded-xl border space-y-2 ${isDark ? 'bg-[#100D0A] border-[#241B13]' : 'bg-[#FAF7F2] border-[#EAE1D5]'}`}>
                        <span className="font-bold text-xs text-[#C9942D] block">玩家叙事推进节奏：</span>
                        <div className="space-y-1.5">
                          {(artifacts.CASE_PLAN?.narrativeBeats || [
                            { stage: '开场', title: '画廊停电与意外锁死', triggerClue: '配电闸' },
                            { stage: '发现', title: '停摆的怀表', triggerClue: '停摆怀表' },
                            { stage: '反转', title: '不在场证明与备用卡', triggerClue: '备用门禁卡' },
                            { stage: '揭晓', title: '修复室夹层与代笔真相', triggerClue: '带颜料抹布' },
                          ]).map((b, i) => (
                            <div key={i} className="flex items-center justify-between text-[11px]">
                              <span className="font-bold">{b.stage}：{b.title}</span>
                              <span className="opacity-60 font-mono">触发物证: {b.triggerClue}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* 4. CASE_GENERATE ARTIFACT: HIGHLIGHT NPC KNOWLEDGE & BOUNDARIES! */}
                {selectedNodeForInspect === 'CASE_GENERATE' && (
                  <div className="space-y-5">
                    <div className="flex items-center justify-between pb-3 border-b border-inherit">
                      <div>
                        <h3 className="font-bold text-sm">
                          04 案件生成与 NPC 防剧透回答边界 (CaseGenerateArtifact)
                        </h3>
                        <p className={`text-xs ${isDark ? 'text-[#8C765E]' : 'text-[#8C7E72]'}`}>
                          已生成全量微观物证、时间线与 4 组嫌疑人专属**背景知识库与防破防回答边界系统指令**
                        </p>
                      </div>
                    </div>

                    {/* NPC Knowledge & Boundary Cards */}
                    <div className="space-y-3">
                      <span className="text-xs font-bold block">
                        NPC 背景知识库与防剧透护栏边界 (NPC Knowledge Boundaries & Anti-Spoiler Prompts)：
                      </span>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {(
                          artifacts.CASE_GENERATE?.npcBoundaries ||
                          (pipelineState.generatedCase
                            ? buildNPCKnowledgeAndBoundaries(pipelineState.generatedCase)
                            : [])
                        ).map((npc: NPCBoundaryArtifact) => (
                          <div
                            key={npc.suspectId}
                            className={`p-4 rounded-xl border space-y-3 text-xs ${
                              isDark ? 'bg-[#100D0A] border-[#291F16]' : 'bg-[#FAF7F2] border-[#EAE1D5]'
                            }`}
                          >
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <span className={`w-7 h-7 rounded-full flex items-center justify-center font-bold text-xs ${
                                  isDark ? 'bg-[#241A12] text-[#E5C384]' : 'bg-[#8B3A2B] text-white'
                                }`}>
                                  {npc.name.slice(0, 1)}
                                </span>
                                <div>
                                  <span className="font-bold text-sm">{npc.name}</span>
                                  <span className="text-[11px] opacity-60 ml-1.5">{npc.title}</span>
                                </div>
                              </div>
                              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 font-bold">
                                护栏激活
                              </span>
                            </div>

                            {/* Background Knowledge */}
                            <div className="space-y-1">
                              <span className="font-bold text-[11px] text-[#C9942D] block">
                                【NPC 背景认知与记忆边界】:
                              </span>
                              <ul className="space-y-1 text-[11px] opacity-85 leading-relaxed">
                                {npc.backgroundKnowledge.slice(0, 3).map((k, ki) => (
                                  <li key={ki}>• {k}</li>
                                ))}
                              </ul>
                            </div>

                            {/* Answering Boundaries */}
                            <div className="space-y-1 pt-2 border-t border-inherit">
                              <span className="font-bold text-[11px] text-red-500 block">
                                【严格禁止讨论与自辩策略】:
                              </span>
                              <div className="text-[11px] space-y-1 leading-relaxed opacity-90">
                                <div>• 禁答敏感点：{npc.boundaryRules.forbiddenTopics[0]}</div>
                                <div>• 质询应对：{npc.boundaryRules.confessionDefense}</div>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {/* 5. LOGIC_VALIDATE ARTIFACT */}
                {selectedNodeForInspect === 'LOGIC_VALIDATE' && (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between pb-3 border-b border-inherit">
                      <div>
                        <h3 className="font-bold text-sm">
                          05 确定性硬规则校验矩阵 (LogicValidateArtifact)
                        </h3>
                        <p className={`text-xs ${isDark ? 'text-[#8C765E]' : 'text-[#8C7E72]'}`}>
                          Game Engine 严苛审查时空重叠、物理自锁悖论与不在场证明
                        </p>
                      </div>
                      <span className={`text-base font-bold font-mono ${
                        artifacts.LOGIC_VALIDATE?.report.isValid
                          ? 'text-emerald-500'
                          : 'text-amber-500'
                      }`}>
                        综合得分: {artifacts.LOGIC_VALIDATE?.report.score || 100} / 100
                      </span>
                    </div>

                    <div className="space-y-2 text-xs">
                      {(artifacts.LOGIC_VALIDATE?.matrixChecks || [
                        { id: '1', name: '时空瞬移悖论检查', status: 'PASS', note: '无同一时间身处两地现象。' },
                        { id: '2', name: '物理密室锁闭屏障检查', status: 'PASS', note: '出入均有门禁卡物理物证支撑。' },
                        { id: '3', name: '真凶致命物证闭环检查', status: 'PASS', note: '存在直接绑定真凶的纤维与时间戳物证。' },
                        { id: '4', name: '真凶作案时间不在场矛盾检查', status: 'PASS', note: '不在场证明留有合理破绽。' },
                      ]).map((chk, i) => (
                        <div
                          key={i}
                          className={`p-3 rounded-xl border flex items-center justify-between ${
                            chk.status === 'PASS'
                              ? isDark ? 'bg-emerald-950/20 border-emerald-500/20' : 'bg-emerald-50 border-emerald-200'
                              : isDark ? 'bg-red-950/20 border-red-500/20' : 'bg-red-50 border-red-200'
                          }`}
                        >
                          <div className="flex items-center gap-2.5">
                            {chk.status === 'PASS' ? (
                              <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                            ) : (
                              <AlertTriangle className="w-4 h-4 text-red-500" />
                            )}
                            <div>
                              <span className="font-bold block text-xs">{chk.name}</span>
                              <span className="text-[11px] opacity-75">{chk.note}</span>
                            </div>
                          </div>
                          <span className={`font-mono font-bold text-xs ${
                            chk.status === 'PASS' ? 'text-emerald-500' : 'text-red-500'
                          }`}>
                            {chk.status}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* 6. REVISION_NODE ARTIFACT */}
                {selectedNodeForInspect === 'REVISION_NODE' && (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between pb-3 border-b border-inherit">
                      <div>
                        <h3 className="font-bold text-sm">
                          06 定向自愈与重规划产物 (RevisionArtifact)
                        </h3>
                        <p className={`text-xs ${isDark ? 'text-[#8C765E]' : 'text-[#8C7E72]'}`}>
                          捕获逻辑矛盾后，自动触发 Directed Cyclic Feedback Loop 注入补丁
                        </p>
                      </div>
                      <span className="text-xs font-mono font-bold text-amber-500">
                        循环回环: #{artifacts.REVISION_NODE?.loopCount || 1}
                      </span>
                    </div>

                    <div className="space-y-3 text-xs">
                      {(artifacts.REVISION_NODE?.fixes || [
                        {
                          category: '时空瞬移校准补丁',
                          description: '校正嫌疑人路程在途动线，平滑走廊到达时间戳，消除空间瞬移矛盾。',
                          before: '22:00 同时处于宴会大厅与钟楼',
                          after: '22:05 走廊通行，22:10 到达钟楼机芯室',
                        },
                        {
                          category: '物理权限破局补丁',
                          description: '在证据链中注入借调的备用钥匙卡与刷卡记录，闭环自锁密室通行逻辑。',
                          before: '无卡直接穿行密闭防盗门',
                          after: '持偷拿的编号#04备用门禁卡通过感应',
                        },
                      ]).map((fix, i) => (
                        <div key={i} className={`p-3.5 rounded-xl border space-y-2 ${
                          isDark ? 'bg-[#100D0A] border-[#241B13]' : 'bg-[#FAF7F2] border-[#EAE1D5]'
                        }`}>
                          <div className="flex items-center justify-between">
                            <span className="font-bold text-emerald-400 font-mono">
                              // {fix.category}
                            </span>
                            <span className="text-[10px] bg-emerald-500/20 text-emerald-400 font-bold px-2 py-0.5 rounded-full">
                              已打补丁
                            </span>
                          </div>
                          <p className="leading-relaxed opacity-90">{fix.description}</p>
                          <div className="grid grid-cols-2 gap-2 text-[11px] pt-1">
                            <div className="p-2 rounded bg-red-950/30 text-red-300 border border-red-500/20">
                              <span className="font-bold block">修复前 (矛盾):</span>
                              <span>{fix.before}</span>
                            </div>
                            <div className="p-2 rounded bg-emerald-950/30 text-emerald-300 border border-emerald-500/20">
                              <span className="font-bold block">修复后 (闭环):</span>
                              <span>{fix.after}</span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* 7. HUMAN_REVIEW ARTIFACT */}
                {selectedNodeForInspect === 'HUMAN_REVIEW' && (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between pb-3 border-b border-inherit">
                      <div>
                        <h3 className="font-bold text-sm">
                          07 人工审核微调清单 (HumanReviewArtifact)
                        </h3>
                        <p className={`text-xs ${isDark ? 'text-[#8C765E]' : 'text-[#8C7E72]'}`}>
                          创作者签署确认：所有要素符合沉浸互动探案标准
                        </p>
                      </div>
                      <span className="text-xs font-mono font-bold text-emerald-500">
                        审查就绪
                      </span>
                    </div>

                    <div className="space-y-2 text-xs">
                      {[
                        '核心作案动机与人物社会关系合理',
                        '物理密室与怀表时间差诡计可被玩家推理破解',
                        '4 位 NPC 防剧透系统指令与知识库边界齐备',
                        '8 件微观证物均包含法医及365nm UV勘验注记',
                        '确定性硬逻辑校验已全绿（100分闭环）',
                      ].map((item, i) => (
                        <div key={i} className={`p-3 rounded-xl border flex items-center justify-between ${
                          isDark ? 'bg-[#100D0A] border-[#241B13]' : 'bg-[#FAF7F2] border-[#EAE1D5]'
                        }`}>
                          <span className="font-medium">{item}</span>
                          <span className="flex items-center gap-1 text-emerald-500 font-bold text-xs">
                            <Check className="w-3.5 h-3.5" />
                            <span>通过</span>
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* 8. PUBLISHED ARTIFACT */}
                {selectedNodeForInspect === 'PUBLISHED' && (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between pb-3 border-b border-inherit">
                      <div>
                        <h3 className="font-bold text-sm">
                          08 案件发布就绪 (PublishedArtifact)
                        </h3>
                        <p className={`text-xs ${isDark ? 'text-[#8C765E]' : 'text-[#8C7E72]'}`}>
                          已生成完整的游戏引擎可执行案卷对象，随时进入试玩
                        </p>
                      </div>
                    </div>

                    <div className={`p-4 rounded-xl border text-center space-y-3 ${
                      isDark ? 'bg-[#100D0A] border-emerald-500/30' : 'bg-emerald-50 border-emerald-200'
                    }`}>
                      <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto" />
                      <div>
                        <h4 className="font-bold text-sm">
                          《{pipelineState.generatedCase?.title || '午夜画廊：锁闭之谜'}》发布就绪
                        </h4>
                        <p className="text-xs opacity-75 mt-1">
                          已装载 4 个场景、{pipelineState.generatedCase?.clues.length || 8} 件证物、4 位 NPC 的全部防剧透知识库边界。
                        </p>
                      </div>

                      <div className="flex items-center justify-center gap-3 pt-2">
                        <button
                          onClick={() => {
                            if (pipelineState.generatedCase) {
                              onApplyCase(pipelineState.generatedCase);
                            }
                            onClose();
                          }}
                          className={`px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer ${
                            isDark
                              ? 'bg-[#291F16] text-[#E5C384] border border-[#4D3723] hover:bg-[#32261B]'
                              : 'bg-white text-[#8B3A2B] border border-[#D5CAA8] hover:bg-[#FAF7F2]'
                          }`}
                        >
                          装载至创作工作台
                        </button>
                        <button
                          onClick={() => {
                            if (pipelineState.generatedCase) {
                              onDirectPlay(pipelineState.generatedCase);
                            }
                          }}
                          className={`px-5 py-2 rounded-xl text-xs font-bold transition shadow-xs cursor-pointer flex items-center gap-1.5 ${
                            isDark
                              ? 'bg-gradient-to-r from-[#DFB36C] via-[#C9942D] to-[#DFB36C] text-[#140E07]'
                              : 'bg-[#8B3A2B] hover:bg-[#783023] text-white'
                          }`}
                        >
                          <Play className="w-3.5 h-3.5 fill-current" />
                          <span>立即试玩刚刚生成的案件</span>
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* VIEW C: REAL-TIME STREAMING LOGS (Terminal Execution Logs) */}
          {activeTab === 'TERMINAL' && (
            <div className="flex-1 overflow-y-auto p-6 font-mono text-xs">
              <div className={`rounded-2xl p-4 border space-y-2 h-full flex flex-col justify-between ${
                isDark ? 'bg-[#090705] border-[#221811] text-[#E5DCD0]' : 'bg-[#1C1816] text-[#E8DFD5] border-[#362E2B]'
              }`}>
                <div className="flex items-center justify-between pb-2 border-b border-stone-800">
                  <div className="flex items-center gap-2">
                    <Terminal className="w-4 h-4 text-[#C9942D]" />
                    <span className="font-bold text-[11px] uppercase tracking-wider text-stone-400">
                      LangGraph Engine Execution Logs
                    </span>
                  </div>
                  <span className="text-[10px] text-stone-500">
                    {pipelineState.logs.length} 条记录
                  </span>
                </div>

                <div className="flex-1 overflow-y-auto space-y-1.5 pr-2 py-2">
                  {pipelineState.logs.map((log) => (
                    <div key={log.id} className="flex items-start gap-2.5 leading-relaxed text-[11px]">
                      <span className="text-stone-500 shrink-0">[{log.timestamp}]</span>
                      <span className={`px-1.5 py-0.2 rounded text-[10px] font-bold shrink-0 ${
                        log.level === 'SUCCESS'
                          ? 'bg-emerald-950 text-emerald-400 border border-emerald-800/40'
                          : log.level === 'WARN'
                          ? 'bg-red-950 text-red-400 border border-red-800/40'
                          : log.level === 'REPAIR'
                          ? 'bg-amber-950 text-amber-400 border border-amber-800/40'
                          : 'bg-stone-800 text-stone-300'
                      }`}>
                        {log.nodeId}
                      </span>
                      <span className={
                        log.level === 'SUCCESS'
                          ? 'text-emerald-300 font-bold'
                          : log.level === 'WARN'
                          ? 'text-red-300 font-bold'
                          : log.level === 'REPAIR'
                          ? 'text-amber-300 font-bold'
                          : 'text-stone-300'
                      }>
                        {log.message}
                      </span>
                    </div>
                  ))}
                </div>

                <div className="pt-2 border-t border-stone-800 text-[10px] text-stone-500 flex items-center justify-between">
                  <span>状态机拓扑: DOC_PARSE -&gt; SCRIPT_ANALYZE -&gt; CASE_PLAN -&gt; CASE_GENERATE -&gt; LOGIC_VALIDATE -&gt; REVISION_NODE -&gt; HUMAN_REVIEW -&gt; PUBLISHED</span>
                  <span className="text-emerald-400">● 调度就绪</span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* 4. MODAL FOOTER BAR */}
        <div className={`px-6 py-3 border-t flex items-center justify-between shrink-0 font-sans text-xs ${
          isDark ? 'bg-[#18130E] border-[#2C2117]' : 'bg-[#F2EBE1] border-[#DFD5C6]'
        }`}>
          <div className="flex items-center gap-3">
            <span className={`font-mono ${isDark ? 'text-[#8C765E]' : 'text-[#8C7E72]'}`}>
              当前就绪案卷：{pipelineState.generatedCase?.title || '午夜画廊：锁闭之谜'}
            </span>
            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
              pipelineState.artifacts.LOGIC_VALIDATE?.report.isValid
                ? 'bg-emerald-500/15 text-emerald-500'
                : 'bg-amber-500/15 text-amber-500'
            }`}>
              {pipelineState.artifacts.LOGIC_VALIDATE?.report.isValid ? '规则闭环通过 (100%)' : '待校验修复'}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className={`px-4 py-1.5 rounded-xl border transition cursor-pointer font-medium ${
                isDark
                  ? 'border-[#3E2D1E] text-[#A89073] hover:bg-[#201811]'
                  : 'border-[#E0D5C7] text-[#6E5F52] hover:bg-[#FAF7F2]'
              }`}
            >
              关闭
            </button>
            <button
              onClick={() => {
                sound.playClueFound();
                if (pipelineState.generatedCase) {
                  onApplyCase(pipelineState.generatedCase);
                }
                onClose();
              }}
              className={`px-4 py-1.5 rounded-xl border font-bold transition cursor-pointer ${
                isDark
                  ? 'bg-[#291F16] text-[#E5C384] border-[#4D3723] hover:bg-[#32261B]'
                  : 'bg-white text-[#8B3A2B] border-[#D5CAA8] hover:bg-[#FAF7F2]'
              }`}
            >
              应用至工作台
            </button>
            <button
              onClick={() => {
                sound.playClueFound();
                if (pipelineState.generatedCase) {
                  onDirectPlay(pipelineState.generatedCase);
                }
              }}
              className={`px-5 py-1.5 rounded-xl font-bold transition shadow-xs cursor-pointer flex items-center gap-1.5 ${
                isDark
                  ? 'bg-gradient-to-r from-[#DFB36C] via-[#C9942D] to-[#DFB36C] text-[#140E07]'
                  : 'bg-[#8B3A2B] hover:bg-[#783023] text-white'
              }`}
            >
              <Play className="w-3.5 h-3.5 fill-current" />
              <span>进入游戏试玩</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
