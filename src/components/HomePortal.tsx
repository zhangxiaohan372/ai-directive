/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from 'react';
import heroDeskImage from '../assets/images/detective_desk_hero_1793628837475.jpg';
import gothicManorImage from '../assets/images/gothic_manor_case_1793628855550.jpg';
import rainyCityImage from '../assets/images/rainy_city_case_1793628875087.jpg';
import studyRoomImage from '../assets/images/study_room_case_1793628901150.jpg';
import lighthouseImage from '../assets/images/lighthouse_mist_case_1793628922679.jpg';
import { sound } from '../utils/audio';
import {
  Search,
  Play,
  ArrowRight,
  ChevronRight,
  Flame,
  FileText,
  GitGraph,
  Gamepad2,
  ShieldCheck,
  Volume2,
  VolumeX,
  Users,
  Compass,
  X,
  Sparkles,
  Zap,
  Sun,
  Moon,
  Download,
} from 'lucide-react';

export interface CaseCardItem {
  id: string;
  title: string;
  heat: string;
  image: string;
  tags: string[];
  description: string;
  isPlayable: boolean;
  statusText: string;
}

const CASES_DATA: CaseCardItem[] = [
  {
    id: 'midnight_gallery',
    title: '午夜庄园 · 血色遗产',
    heat: '9.8',
    image: gothicManorImage,
    tags: ['悬疑', '推理', '家族'],
    description: '22:15，所有人都看见策展人陈默走进修复室；没有人看见他出来。4大现场，8项微观物证，100%确定性规则合规。',
    isPlayable: true,
    statusText: '可立即探案',
  },
  {
    id: 'rainy_night',
    title: '雨夜迷案',
    heat: '9.5',
    image: rainyCityImage,
    tags: ['悬疑', '都市', '犯罪'],
    description: '暴雨冲刷着霓虹交错的阴暗巷道。雨伞骨架上检测出的微量剧毒涂层，彻底粉碎了嫌疑人的不在场证明。',
    isPlayable: false,
    statusText: '工坊解析完成',
  },
  {
    id: 'study_secret',
    title: '书房的秘密',
    heat: '9.2',
    image: studyRoomImage,
    tags: ['推理', '密室', '人性'],
    description: '反锁的书房、暗藏的密道与被撕裂的遗嘱原件。停摆的时钟究竟被谁动过了手脚？',
    isPlayable: false,
    statusText: '自愈修复就绪',
  },
  {
    id: 'lighthouse_mystery',
    title: '灯塔之谜',
    heat: '9.1',
    image: lighthouseImage,
    tags: ['悬疑', '海滨', '失踪'],
    description: '暴风雨袭击孤悬海外的旧石灯塔。守塔人凭空失踪，而灯室透镜上却留下了一串湿漉漉的单向足迹。',
    isPlayable: false,
    statusText: '工坊构建中',
  },
];

interface HomePortalProps {
  onStartSinglePlayer: () => void;
  onOpenLobby: () => void;
  onOpenStudio: () => void;
  themeMode?: 'dark' | 'light';
  onToggleTheme?: () => void;
}

export const HomePortal: React.FC<HomePortalProps> = ({
  onStartSinglePlayer,
  onOpenLobby,
  onOpenStudio,
  themeMode = 'dark',
  onToggleTheme,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [isMuted, setIsMuted] = useState(sound.getIsMuted());
  const [selectedCaseModal, setSelectedCaseModal] = useState<CaseCardItem | null>(null);

  const isDark = themeMode === 'dark';

  const handleToggleSound = () => {
    const muted = sound.toggleMute();
    setIsMuted(muted);
    if (!muted) {
      sound.startAmbientMystery();
    }
  };

  const filteredCases = useMemo(() => {
    if (!searchQuery.trim()) return CASES_DATA;
    const query = searchQuery.toLowerCase().trim();
    return CASES_DATA.filter(
      (c) =>
        c.title.toLowerCase().includes(query) ||
        c.description.toLowerCase().includes(query) ||
        c.tags.some((t) => t.toLowerCase().includes(query))
    );
  }, [searchQuery]);

  const handleCaseCardClick = (item: CaseCardItem) => {
    sound.playPaperRustle();
    setSelectedCaseModal(item);
  };

  const handlePlayCaseDirect = (item: CaseCardItem) => {
    sound.playClueFound();
    setSelectedCaseModal(null);
    onStartSinglePlayer();
  };

  const handleExploreCaseInStudio = (item: CaseCardItem) => {
    sound.playPaperRustle();
    setSelectedCaseModal(null);
    onOpenStudio();
  };

  const handleScrollToCases = () => {
    sound.playPaperRustle();
    const el = document.getElementById('popular-cases-section');
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <div
      className={`w-full min-h-screen font-sans flex flex-col selection:bg-amber-600/30 overflow-x-hidden transition-colors duration-300 ${
        isDark ? 'bg-[#0C0A09] text-[#E5DCD0]' : 'bg-[#F5EFE6] text-[#2C241E]'
      }`}
    >
      {/* 1. TOP NAVBAR WITH GLOBAL THEME CONTROL */}
      <header
        className={`h-16 px-6 sm:px-10 border-b flex items-center justify-between shrink-0 sticky top-0 z-40 backdrop-blur-md transition-colors duration-300 ${
          isDark ? 'bg-[#120F0D]/95 border-[#2C2117]' : 'bg-[#FAF7F2]/95 border-[#E8DFD5]'
        }`}
      >
        {/* Left: Brand Logo & Title */}
        <div className="flex items-center gap-3">
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
            className={`flex items-center gap-1.5 font-bold border-b-2 pb-0.5 cursor-pointer ${
              isDark ? 'text-[#F5E2BD] border-[#D4A359]' : 'text-[#8B3A2B] border-[#8B3A2B]'
            }`}
          >
            <span>首页</span>
          </button>
          <button
            onClick={() => {
              sound.playPaperRustle();
              onOpenStudio();
            }}
            className={`flex items-center gap-1.5 transition-colors cursor-pointer ${
              isDark ? 'text-[#A89073] hover:text-[#F3EFEA]' : 'text-[#786B60] hover:text-[#1C1917]'
            }`}
          >
            <span>案件创作</span>
          </button>
        </nav>

        {/* Right: Theme Toggle, Search, Sound, Notification & User Avatar */}
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

          {/* Search Input Bar */}
          <div className="relative hidden sm:flex items-center">
            <Search className={`w-3.5 h-3.5 absolute left-3 pointer-events-none ${isDark ? 'text-[#8C765E]' : 'text-[#8C7E72]'}`} />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="搜索案件..."
              className={`w-36 lg:w-48 pl-9 pr-3 py-1.5 rounded-full border text-xs transition-all focus:outline-none focus:w-56 ${
                isDark
                  ? 'bg-[#1A140F] border-[#3A2B1D] text-[#E5DCD0] placeholder-[#8C765E] focus:border-[#C9942D]'
                  : 'bg-white border-[#E0D5C7] text-[#1C1917] placeholder-[#8C7E72] focus:border-[#8B3A2B]'
              }`}
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 opacity-60 hover:opacity-100"
              >
                <X className="w-3 h-3" />
              </button>
            )}
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
                ? 'bg-[#221810] hover:bg-[#322317] text-[#E8C88B] border-[#523A25] hover:border-[#8C683F]'
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
        </div>
      </header>

      {/* 2. HERO SECTION WITH DETECTIVE DESK BACKGROUND */}
      <section className="relative w-full h-[540px] sm:h-[580px] lg:h-[620px] overflow-hidden flex items-center">
        {/* Background Image Layer */}
        <img
          src={heroDeskImage}
          alt="AI Detective Desk"
          className={`absolute inset-0 w-full h-full object-cover object-center pointer-events-none scale-[1.01] transition-all duration-700 ${
            isDark ? 'brightness-100 contrast-100' : 'brightness-105 contrast-[0.92] sepia-[0.2]'
          }`}
        />

        {/* Cinematic Darkness or Warm Daytime Overlay */}
        <div
          className={`absolute inset-0 pointer-events-none transition-colors duration-500 ${
            isDark
              ? 'bg-gradient-to-r from-[#0C0A09]/95 via-[#0C0A09]/75 to-transparent'
              : 'bg-gradient-to-r from-[#F5EFE6] via-[#F5EFE6]/92 to-[#F5EFE6]/40'
          }`}
        />
        <div
          className={`absolute inset-0 pointer-events-none transition-colors duration-500 ${
            isDark
              ? 'bg-gradient-to-t from-[#0C0A09] via-transparent to-[#0C0A09]/40'
              : 'bg-gradient-to-t from-[#F5EFE6] via-transparent to-[#FAF7F2]/60'
          }`}
        />

        {/* Hero Content Block (Left Aligned) */}
        <div className="relative z-10 max-w-7xl mx-auto px-6 sm:px-10 w-full">
          <div className="max-w-2xl space-y-4 sm:space-y-5">
            {/* Main Headline */}
            <h2
              className={`text-3xl sm:text-4xl md:text-5xl lg:text-[54px] font-serif font-black tracking-tight leading-[1.18] ${
                isDark
                  ? 'text-[#F3EFEA] drop-shadow-[0_4px_24px_rgba(0,0,0,0.9)]'
                  : 'text-[#1C1917] drop-shadow-sm'
              }`}
            >
              让每个人都能成为
              <br />
              <span
                className={`text-transparent bg-clip-text ${
                  isDark
                    ? 'bg-gradient-to-r from-[#F5E2BD] via-[#DFB36C] to-[#C9942D]'
                    : 'bg-gradient-to-r from-[#8B3A2B] via-[#C9942D] to-[#8B3A2B]'
                }`}
              >
                案件创作者，也能成为侦探
              </span>
            </h2>

            {/* Subtitle */}
            <p
              className={`text-sm sm:text-base md:text-lg font-serif leading-relaxed ${
                isDark ? 'text-[#C7B59D] drop-shadow-md' : 'text-[#5C4F44]'
              }`}
            >
              上传剧本，AI 为你生成完整案件，开启沉浸式的推理之旅
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-wrap items-center gap-4 pt-2">
              <button
                onClick={() => {
                  sound.playPaperRustle();
                  onOpenStudio();
                }}
                className={`flex items-center gap-2.5 px-6 py-3.5 rounded-full font-serif font-black text-sm tracking-wide shadow-xl cursor-pointer active:scale-95 transition-all ${
                  isDark
                    ? 'bg-gradient-to-r from-[#DFB36C] via-[#C9942D] to-[#DFB36C] hover:from-[#E8C485] hover:to-[#D4A359] text-[#140E07] shadow-amber-950/40'
                    : 'bg-[#8B3A2B] hover:bg-[#783023] text-white shadow-red-950/20'
                }`}
              >
                <Play className="w-4 h-4 fill-current" />
                <span>开始创作 →</span>
              </button>

              <button
                onClick={handleScrollToCases}
                className={`flex items-center gap-2 px-6 py-3.5 rounded-full font-serif font-medium text-sm transition-all cursor-pointer shadow-md border ${
                  isDark
                    ? 'bg-[#18130E]/85 hover:bg-[#251D15] text-[#E8C88B] border-[#523A25] hover:border-[#8C683F]'
                    : 'bg-white hover:bg-[#FAF7F2] text-[#8B3A2B] border-[#E0D5C7]'
                }`}
              >
                <Compass className="w-4 h-4" />
                <span>探索案例</span>
              </button>
            </div>

          </div>
        </div>
      </section>

      {/* 3. FOUR FEATURE PILLARS BAR (FLOATING HORIZONTAL PANEL) */}
      <section className="relative z-20 max-w-7xl mx-auto px-6 sm:px-10 -mt-10 sm:-mt-12 w-full">
        <div
          className={`rounded-2xl border backdrop-blur-md p-5 sm:p-6 shadow-2xl grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 divide-y sm:divide-y-0 sm:divide-x transition-colors duration-300 ${
            isDark
              ? 'bg-[#14100D]/90 border-[#3B2B1D] divide-[#2C2015]'
              : 'bg-white/95 border-[#EBE4DC] divide-[#F0EAE1]'
          }`}
        >
          {/* Pillar 1 */}
          <div className="flex items-center gap-4 pt-3 sm:pt-0 sm:px-3">
            <div
              className={`w-12 h-12 rounded-xl border flex items-center justify-center shrink-0 ${
                isDark ? 'bg-[#221810] border-[#523A25] text-[#E8C88B]' : 'bg-[#FAF7F2] border-[#EAE1D5] text-[#8B3A2B]'
              }`}
            >
              <FileText className="w-6 h-6" />
            </div>
            <div>
              <h3 className={`font-serif font-bold text-sm ${isDark ? 'text-[#F3EFEA]' : 'text-[#1C1917]'}`}>
                多格式支持
              </h3>
              <p className={`text-xs font-serif mt-0.5 ${isDark ? 'text-[#9E866D]' : 'text-[#786B60]'}`}>
                支持 PDF / Word / Markdown
              </p>
            </div>
          </div>

          {/* Pillar 2 */}
          <div className="flex items-center gap-4 pt-3 sm:pt-0 sm:px-3">
            <div
              className={`w-12 h-12 rounded-xl border flex items-center justify-center shrink-0 ${
                isDark ? 'bg-[#221810] border-[#523A25] text-[#E8C88B]' : 'bg-[#FAF7F2] border-[#EAE1D5] text-[#8B3A2B]'
              }`}
            >
              <GitGraph className="w-6 h-6" />
            </div>
            <div>
              <h3 className={`font-serif font-bold text-sm ${isDark ? 'text-[#F3EFEA]' : 'text-[#1C1917]'}`}>
                智能创作
              </h3>
              <p className={`text-xs font-serif mt-0.5 ${isDark ? 'text-[#9E866D]' : 'text-[#786B60]'}`}>
                基于 LangGraph 的工作流
              </p>
            </div>
          </div>

          {/* Pillar 3 */}
          <div className="flex items-center gap-4 pt-3 sm:pt-0 sm:px-3">
            <div
              className={`w-12 h-12 rounded-xl border flex items-center justify-center shrink-0 ${
                isDark ? 'bg-[#221810] border-[#523A25] text-[#E8C88B]' : 'bg-[#FAF7F2] border-[#EAE1D5] text-[#8B3A2B]'
              }`}
            >
              <Gamepad2 className="w-6 h-6" />
            </div>
            <div>
              <h3 className={`font-serif font-bold text-sm ${isDark ? 'text-[#F3EFEA]' : 'text-[#1C1917]'}`}>
                沉浸推理
              </h3>
              <p className={`text-xs font-serif mt-0.5 ${isDark ? 'text-[#9E866D]' : 'text-[#786B60]'}`}>
                与 AI NPC 展开互动
              </p>
            </div>
          </div>

          {/* Pillar 4 */}
          <div className="flex items-center gap-4 pt-3 sm:pt-0 sm:px-3">
            <div
              className={`w-12 h-12 rounded-xl border flex items-center justify-center shrink-0 ${
                isDark ? 'bg-[#221810] border-[#523A25] text-[#E8C88B]' : 'bg-[#FAF7F2] border-[#EAE1D5] text-[#8B3A2B]'
              }`}
            >
              <ShieldCheck className="w-6 h-6 text-emerald-500" />
            </div>
            <div>
              <h3 className={`font-serif font-bold text-sm ${isDark ? 'text-[#F3EFEA]' : 'text-[#1C1917]'}`}>
                逻辑严谨
              </h3>
              <p className={`text-xs font-serif mt-0.5 ${isDark ? 'text-[#9E866D]' : 'text-[#786B60]'}`}>
                多重校验，保证可玩性
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 4. POPULAR CASES GALLERY (热门案件) */}
      <section
        id="popular-cases-section"
        className="max-w-7xl mx-auto px-6 sm:px-10 py-12 sm:py-16 w-full space-y-6"
      >
        {/* Section Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={`w-1 h-6 rounded-full ${isDark ? 'bg-[#C9942D]' : 'bg-[#8B3A2B]'}`} />
            <h2 className={`font-serif font-black text-xl sm:text-2xl tracking-tight ${isDark ? 'text-[#F3EFEA]' : 'text-[#1C1917]'}`}>
              热门案件
            </h2>
            <span
              className={`hidden sm:inline text-xs font-serif border-l pl-3 ${
                isDark ? 'text-[#8C765E] border-[#3D2D1E]' : 'text-[#8C7E72] border-[#E0D5C7]'
              }`}
            >
              探索精选案件，开启你的推理之旅
            </span>
          </div>

          <button
            onClick={() => {
              sound.playPaperRustle();
              onOpenStudio();
            }}
            className={`flex items-center gap-1.5 text-xs font-serif transition-colors cursor-pointer group ${
              isDark ? 'text-[#A89073] hover:text-[#E8C88B]' : 'text-[#8C7E72] hover:text-[#8B3A2B]'
            }`}
          >
            <span>查看更多</span>
            <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
          </button>
        </div>

        {/* 4 Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {filteredCases.map((caseItem) => (
            <div
              key={caseItem.id}
              onClick={() => handleCaseCardClick(caseItem)}
              className={`group relative rounded-2xl overflow-hidden border transition-all duration-300 shadow-xl flex flex-col justify-between cursor-pointer ${
                isDark
                  ? 'bg-[#14100D] border-[#2E2217] hover:border-[#7A5B36]'
                  : 'bg-white border-[#EBE4DC] hover:border-[#D9CFC4]'
              }`}
            >
              {/* Card Cover Image */}
              <div className="relative h-44 w-full overflow-hidden">
                <img
                  src={caseItem.image}
                  alt={caseItem.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 ease-out"
                />
                <div
                  className={`absolute inset-0 bg-gradient-to-t via-transparent to-transparent ${
                    isDark ? 'from-[#14100D]' : 'from-white'
                  }`}
                />

                {/* Heat Badge */}
                <div
                  className={`absolute top-3 left-3 flex items-center gap-1 px-2.5 py-1 rounded-full border backdrop-blur-md text-[11px] font-mono shadow-md ${
                    isDark
                      ? 'bg-[#0C0A09]/80 border-[#4A3725] text-[#E8C88B]'
                      : 'bg-white/90 border-[#E0D5C7] text-[#8B3A2B]'
                  }`}
                >
                  <Flame className="w-3 h-3 text-[#FF7A00] fill-current" />
                  <span>热度 {caseItem.heat}</span>
                </div>

                {/* Status Badge */}
                {caseItem.isPlayable && (
                  <div className="absolute top-3 right-3 px-2 py-0.5 rounded bg-emerald-950/80 border border-emerald-500/50 text-emerald-400 text-[10px] font-mono">
                    可立即探案
                  </div>
                )}
              </div>

              {/* Card Bottom Meta */}
              <div className="p-4 pt-1 flex flex-col justify-between flex-1">
                <div>
                  <h3
                    className={`font-serif font-bold text-sm sm:text-base transition-colors mb-2 truncate ${
                      isDark ? 'text-[#F3EFEA] group-hover:text-[#E8C88B]' : 'text-[#1C1917] group-hover:text-[#8B3A2B]'
                    }`}
                  >
                    {caseItem.title}
                  </h3>

                  {/* Tags */}
                  <div className="flex flex-wrap items-center gap-1.5 mb-3">
                    {caseItem.tags.map((tag) => (
                      <span
                        key={tag}
                        className={`px-2 py-0.5 rounded text-[10px] font-serif ${
                          isDark
                            ? 'bg-[#1C1510] border border-[#3A2A1D] text-[#A89073]'
                            : 'bg-[#F5E7DF] text-[#8B3A2B]'
                        }`}
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Arrow Action Button */}
                <div className={`flex items-center justify-between pt-2 border-t ${isDark ? 'border-[#221811]' : 'border-[#F0EAE1]'}`}>
                  <span className={`text-[11px] font-serif ${isDark ? 'text-[#7A6652]' : 'text-[#8C7E72]'}`}>
                    {caseItem.statusText}
                  </span>
                  <div
                    className={`w-7 h-7 rounded-full border flex items-center justify-center transition-all ${
                      isDark
                        ? 'bg-[#1F1711] border-[#3E2C1D] text-[#A89073] group-hover:bg-[#C9942D] group-hover:border-[#C9942D] group-hover:text-[#140E07]'
                        : 'bg-[#FAF7F2] border-[#E0D5C7] text-[#8C7E72] group-hover:bg-[#8B3A2B] group-hover:border-[#8B3A2B] group-hover:text-white'
                    }`}
                  >
                    <ChevronRight className="w-4 h-4 stroke-[2.5]" />
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 5. CASE DETAIL / PLAY MODAL */}
      {selectedCaseModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div
            className={`w-full max-w-lg rounded-2xl border p-6 shadow-2xl space-y-4 animate-in fade-in zoom-in-95 duration-200 ${
              isDark ? 'bg-[#14100D] border-[#4A3723] text-[#E5DCD0]' : 'bg-white border-[#E0D5C7] text-[#1C1917]'
            }`}
          >
            {/* Modal Header */}
            <div className={`flex items-center justify-between pb-3 border-b ${isDark ? 'border-[#2C2117]' : 'border-[#F0EAE1]'}`}>
              <div className="flex items-center gap-2">
                <span className={`w-2 h-2 rounded-full ${isDark ? 'bg-[#C9942D]' : 'bg-[#8B3A2B]'}`} />
                <h3 className={`font-serif font-black text-lg ${isDark ? 'text-[#F1DFBA]' : 'text-[#1C1917]'}`}>
                  {selectedCaseModal.title}
                </h3>
              </div>
              <button
                onClick={() => setSelectedCaseModal(null)}
                className="p-1 rounded opacity-60 hover:opacity-100 transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Image */}
            <div className="h-44 w-full rounded-xl overflow-hidden border border-black/20 relative">
              <img
                src={selectedCaseModal.image}
                alt={selectedCaseModal.title}
                className="w-full h-full object-cover"
              />
              <div className="absolute top-3 left-3 flex items-center gap-1 px-2.5 py-1 rounded-full bg-black/75 text-white text-xs font-mono">
                <Flame className="w-3 h-3 text-[#FF7A00] fill-current" />
                <span>热度 {selectedCaseModal.heat}</span>
              </div>
            </div>

            {/* Tags & Description */}
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                {selectedCaseModal.tags.map((tag) => (
                  <span
                    key={tag}
                    className={`px-2 py-0.5 rounded text-xs font-serif ${
                      isDark
                        ? 'bg-[#221810] border border-[#473422] text-[#E8C88B]'
                        : 'bg-[#F5E7DF] text-[#8B3A2B]'
                    }`}
                  >
                    {tag}
                  </span>
                ))}
              </div>
              <p className={`text-xs font-serif leading-relaxed ${isDark ? 'text-[#C7B59D]' : 'text-[#5C4F44]'}`}>
                {selectedCaseModal.description}
              </p>
            </div>

            {/* Actions */}
            <div className={`flex flex-col sm:flex-row items-center gap-3 pt-3 border-t ${isDark ? 'border-[#2C2117]' : 'border-[#F0EAE1]'}`}>
              {selectedCaseModal.isPlayable ? (
                <button
                  onClick={() => handlePlayCaseDirect(selectedCaseModal)}
                  className={`w-full sm:flex-1 flex items-center justify-center gap-2 py-3 rounded-xl font-serif font-bold text-xs shadow-lg cursor-pointer active:scale-95 transition-all ${
                    isDark
                      ? 'bg-gradient-to-r from-[#DFB36C] via-[#C9942D] to-[#DFB36C] text-[#140E07]'
                      : 'bg-[#8B3A2B] hover:bg-[#783023] text-white'
                  }`}
                >
                  <Play className="w-4 h-4 fill-current" />
                  <span>立即开始现场调查</span>
                </button>
              ) : (
                <button
                  onClick={() => handleExploreCaseInStudio(selectedCaseModal)}
                  className={`w-full sm:flex-1 flex items-center justify-center gap-2 py-3 rounded-xl font-serif font-bold text-xs cursor-pointer transition-all border ${
                    isDark
                      ? 'bg-[#271C12] hover:bg-[#342618] text-[#E8C88B] border-[#5A4027]'
                      : 'bg-[#FAF7F2] hover:bg-[#F2ECE4] text-[#8B3A2B] border-[#E0D5C7]'
                  }`}
                >
                  <GitGraph className="w-4 h-4" />
                  <span>在创作工坊中解析 / 完善</span>
                </button>
              )}

              <button
                onClick={() => {
                  sound.playHeartbeatTick();
                  setSelectedCaseModal(null);
                  onOpenLobby();
                }}
                className={`w-full sm:w-auto px-4 py-3 rounded-xl border text-xs font-serif cursor-pointer transition-colors flex items-center justify-center gap-1.5 ${
                  isDark
                    ? 'bg-[#1A140F] hover:bg-[#251D15] text-[#A89073] hover:text-[#E8C88B] border-[#3A2B1D]'
                    : 'bg-white hover:bg-[#FAF7F2] text-[#6E5F52] hover:text-[#1C1917] border-[#E0D5C7]'
                }`}
              >
                <Users className="w-3.5 h-3.5" />
                <span>联机大厅</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 6. FOOTER */}
      <footer
        className={`mt-auto border-t py-6 px-6 sm:px-10 text-xs font-serif flex flex-col sm:flex-row items-center justify-between gap-3 transition-colors duration-300 ${
          isDark
            ? 'bg-[#0A0807] border-[#221810] text-[#7A6652]'
            : 'bg-[#FAF7F2] border-[#E8DFD5] text-[#8C7E72]'
        }`}
      >
        <div className="flex items-center gap-3">
          <span>AI Detective · 智能探案平台</span>
          <span>•</span>
          <span className="font-mono text-[11px]">LangGraph Multi-Agent Architecture</span>
          <span>•</span>
          <span className="font-mono text-[11px]">Deterministic State Engine</span>
        </div>
        <div className="font-mono text-[11px] opacity-75">
          Ready for Multi-Case Investigation & AI Authorship
        </div>
      </footer>

    </div>
  );
};

