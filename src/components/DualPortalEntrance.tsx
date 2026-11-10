/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import coverImage from '../assets/images/midnight_gallery_cover_1793514263967.jpg';
import { sound } from '../utils/audio';
import {
  Volume2,
  VolumeX,
  Users,
  ArrowRight,
  GitGraph,
  Sparkles,
  Upload,
  Cpu,
  Layers,
  ShieldCheck,
  Search,
  CheckCircle2,
  Clock,
  Play,
  FileText,
  AlertTriangle,
} from 'lucide-react';

interface DualPortalEntranceProps {
  onStartSinglePlayer: () => void;
  onOpenLobby: () => void;
  onOpenStudio: () => void;
}

export const DualPortalEntrance: React.FC<DualPortalEntranceProps> = ({
  onStartSinglePlayer,
  onOpenLobby,
  onOpenStudio,
}) => {
  const [isMuted, setIsMuted] = useState(sound.getIsMuted());

  const handleToggleSound = () => {
    const muted = sound.toggleMute();
    setIsMuted(muted);
    if (!muted) {
      sound.startAmbientMystery();
    }
  };

  const handlePlayMidnightGallery = () => {
    sound.playClueFound();
    onStartSinglePlayer();
  };

  const handleEnterStudio = () => {
    sound.playPaperRustle();
    onOpenStudio();
  };

  return (
    <div className="relative w-full min-h-screen bg-[#070913] text-stone-100 font-sans select-none overflow-x-hidden flex flex-col justify-between">
      {/* Background ambient lighting */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-amber-950/20 via-[#070913]/90 to-[#04050a] pointer-events-none" />
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#8080800a_1px,transparent_1px),linear-gradient(to_bottom,#8080800a_1px,transparent_1px)] bg-[size:32px_32px] pointer-events-none" />

      {/* Top Header */}
      <header className="relative z-20 w-full max-w-7xl mx-auto px-5 sm:px-8 py-5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-amber-600/30 to-[#181411] border border-amber-500/40 flex items-center justify-center text-amber-400 shadow-md">
            <span className="font-serif font-black text-sm tracking-wider">密</span>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-serif font-bold text-amber-100 text-base tracking-wide">
                AI DETECTIVE
              </span>
              <span className="px-1.5 py-0.5 rounded text-[10px] font-mono tracking-wider bg-amber-950/80 text-amber-300 border border-amber-600/40">
                双核架构
              </span>
            </div>
            <p className="text-[11px] text-[#AFA49A] font-serif">
              智能探案平台 · Agent 智能创作与确定性游戏引擎
            </p>
          </div>
        </div>

        {/* Audio & Quick Lobby Controls */}
        <div className="flex items-center gap-2.5">
          <button
            onClick={handleToggleSound}
            className="group flex items-center gap-2 px-3 py-1.5 sm:px-3.5 sm:py-2 rounded-lg bg-[#181411]/80 hover:bg-[#241B15] text-stone-300 border border-[#3B3027] hover:border-amber-500/50 backdrop-blur-md transition-all text-xs cursor-pointer active:scale-95 shadow-sm"
            title={isMuted ? '开启环境悬疑声景' : '静音'}
          >
            {isMuted ? (
              <VolumeX className="w-3.5 h-3.5 text-stone-400 group-hover:text-stone-200" />
            ) : (
              <Volume2 className="w-3.5 h-3.5 text-amber-400 animate-pulse" />
            )}
            <span className="hidden sm:inline font-sans text-xs">
              {isMuted ? '声景静音' : '现场声景'}
            </span>
          </button>

          <button
            onClick={() => {
              sound.playHeartbeatTick();
              onOpenLobby();
            }}
            className="flex items-center gap-2 px-3 py-1.5 sm:px-3.5 sm:py-2 rounded-lg bg-[#181411]/80 hover:bg-[#241B15] text-stone-300 border border-[#3B3027] hover:border-amber-500/50 backdrop-blur-md transition-all text-xs cursor-pointer active:scale-95 shadow-sm"
          >
            <Users className="w-3.5 h-3.5 text-amber-400" />
            <span className="font-sans text-xs">多人大厅</span>
          </button>
        </div>
      </header>

      {/* Main Dual-Portal Section */}
      <main className="relative z-10 w-full max-w-7xl mx-auto px-5 sm:px-8 py-4 sm:py-6 flex-1 flex flex-col justify-center">
        {/* Intro Tagline */}
        <div className="text-center mb-8 sm:mb-10 max-w-3xl mx-auto">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-950/40 border border-amber-600/30 text-amber-300 text-xs font-mono mb-3">
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            <span>Agent 智能推理解析 + 游戏引擎确定性状态判定</span>
          </div>
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-serif font-black text-[#F3EFEA] tracking-tight leading-snug">
            选择进入方向：即刻现场探案，或上传剧本开创案件
          </h2>
          <p className="mt-2 text-stone-400 text-xs sm:text-sm font-serif">
            左侧即玩标准验证级剧本，右侧一键上传本地文档交给 LangGraph 多智能体协同流水线解析
          </p>
        </div>

        {/* Dual Cards Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-8 items-stretch">
          {/* Card 1: 互动探案剧场 (Playable Detective Cases) */}
          <div className="group relative rounded-2xl overflow-hidden bg-[#120F0D] border border-[#3B3027] hover:border-amber-500/60 transition-all duration-300 shadow-2xl flex flex-col justify-between">
            {/* Visual Cover Layer */}
            <div className="relative h-64 sm:h-72 w-full overflow-hidden">
              <img
                src={coverImage}
                alt="午夜画廊"
                className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-700 ease-out"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#120F0D] via-[#120F0D]/50 to-transparent" />
              <div className="absolute top-4 left-4 flex flex-wrap items-center gap-2">
                <span className="px-2.5 py-1 rounded bg-[#0C0A09]/90 border border-amber-500/40 text-amber-300 text-[11px] font-mono font-medium shadow-md">
                  精选首发案件 · 100% 规则合规
                </span>
                <span className="px-2.5 py-1 rounded bg-stone-900/90 border border-stone-700/60 text-stone-300 text-[11px] font-mono">
                  4 现场 · 8 物证 · 4 嫌疑人
                </span>
              </div>
            </div>

            {/* Content & Actions */}
            <div className="p-6 sm:p-7 flex-1 flex flex-col justify-between -mt-6 relative z-10">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <span className="w-2 h-2 rounded-full bg-amber-400" />
                  <span className="text-amber-400 text-xs font-mono tracking-wider">
                    CASE #01 · 密室与时间倒错
                  </span>
                </div>
                <h3 className="font-serif font-black text-2xl sm:text-3xl text-amber-100 tracking-tight mb-2">
                  午夜画廊：锁闭之谜
                </h3>
                <p className="font-serif text-sm text-stone-300 leading-relaxed border-l-2 border-amber-500/60 pl-3 mb-4">
                  “22:15，所有人都看见策展人陈默走进修复室；没有人看见他出来。”
                </p>
                <p className="text-xs text-stone-400 leading-relaxed mb-6">
                  深入 4 大画廊现场，搜集受害者停摆怀表与松节油抹布等 8 项物证。现场人员根据角色记忆真实交互，严守确定性防剧透边界。
                </p>

                {/* Sub-cases in library */}
                <div className="mb-6 pt-4 border-t border-[#251E18]">
                  <p className="text-[11px] font-mono text-stone-400 mb-2.5">
                    案件库其他待激活案件：
                  </p>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div className="p-2 rounded bg-[#181411] border border-[#2B231D] text-stone-300 flex items-center justify-between">
                      <span className="truncate">《暴风雪山庄：钟楼之锁》</span>
                      <span className="text-[10px] text-amber-400 font-mono shrink-0">待自愈</span>
                    </div>
                    <div className="p-2 rounded bg-[#181411] border border-[#2B231D] text-stone-300 flex items-center justify-between">
                      <span className="truncate">《深海游艇：无声晚宴》</span>
                      <span className="text-[10px] text-emerald-400 font-mono shrink-0">已收录</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row items-center gap-3 pt-2">
                <button
                  onClick={handlePlayMidnightGallery}
                  className="w-full sm:flex-1 flex items-center justify-center gap-2.5 px-6 py-3.5 rounded-xl bg-gradient-to-r from-amber-600 via-amber-500 to-amber-600 hover:from-amber-500 hover:to-amber-400 text-stone-950 font-serif font-bold text-sm tracking-wide shadow-lg shadow-amber-950/40 cursor-pointer active:scale-98 transition-all"
                >
                  <Play className="w-4 h-4 fill-current" />
                  <span>进入单人现场调查</span>
                </button>

                <button
                  onClick={() => {
                    sound.playHeartbeatTick();
                    onOpenLobby();
                  }}
                  className="w-full sm:w-auto px-5 py-3.5 rounded-xl bg-[#181411] hover:bg-[#241B15] text-amber-200 border border-[#3B3027] hover:border-amber-500/50 text-xs font-medium cursor-pointer transition-colors flex items-center justify-center gap-2"
                >
                  <Users className="w-3.5 h-3.5 text-amber-400" />
                  <span>多人联机大厅</span>
                </button>
              </div>
            </div>
          </div>

          {/* Card 2: 案件创作工坊 (Multi-Agent Case Studio) */}
          <div className="group relative rounded-2xl overflow-hidden bg-[#120F0D] border border-[#3B3027] hover:border-amber-500/60 transition-all duration-300 shadow-2xl flex flex-col justify-between">
            {/* Technical Header Graphic */}
            <div className="relative p-6 sm:p-7 bg-gradient-to-b from-[#181411] to-[#120F0D] border-b border-[#2B231D]">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
                    <GitGraph className="w-4 h-4" />
                  </div>
                  <span className="font-mono text-xs text-amber-300 font-semibold tracking-wide">
                    LANGGRAPH MULTI-AGENT STUDIO
                  </span>
                </div>
                <span className="px-2.5 py-1 rounded bg-amber-950/70 border border-amber-600/40 text-amber-300 text-[11px] font-mono">
                  本地剧本上传 · 即刻解析
                </span>
              </div>

              <h3 className="font-serif font-black text-2xl sm:text-3xl text-amber-100 tracking-tight mb-2">
                案件创作工坊
              </h3>
              <p className="text-xs text-stone-300 leading-relaxed font-serif">
                上传你的本地 PDF、Word、Markdown 或 TXT 剧本，让 LangGraph Agent 完成全流程解析，构建可玩案件。
              </p>
            </div>

            {/* Pipeline Feature Blueprint Showcase */}
            <div className="p-6 sm:p-7 flex-1 flex flex-col justify-between">
              <div>
                <p className="text-[11px] font-mono text-stone-400 uppercase tracking-wider mb-3">
                  六步协同解析与校验工作流：
                </p>

                {/* 6 Node Workflow Badges */}
                <div className="space-y-2 mb-6">
                  <div className="p-2.5 rounded-lg bg-[#181411] border border-[#2B231D] flex items-center justify-between">
                    <div className="flex items-center gap-2.5 text-xs">
                      <span className="w-5 h-5 rounded bg-amber-500/10 text-amber-400 text-[10px] font-mono flex items-center justify-center font-bold">
                        01
                      </span>
                      <span className="font-medium text-stone-200">文档分块与实体抽取</span>
                    </div>
                    <span className="text-[11px] text-stone-400 font-mono">.md / .txt / .pdf / .json</span>
                  </div>

                  <div className="p-2.5 rounded-lg bg-[#181411] border border-[#2B231D] flex items-center justify-between">
                    <div className="flex items-center gap-2.5 text-xs">
                      <span className="w-5 h-5 rounded bg-amber-500/10 text-amber-400 text-[10px] font-mono flex items-center justify-center font-bold">
                        02
                      </span>
                      <span className="font-medium text-stone-200">剧本语义与核心动机网</span>
                    </div>
                    <span className="text-[11px] text-amber-400/80 font-mono">关系图谱与嫌疑人动机</span>
                  </div>

                  <div className="p-2.5 rounded-lg bg-[#181411] border border-[#2B231D] flex items-center justify-between">
                    <div className="flex items-center gap-2.5 text-xs">
                      <span className="w-5 h-5 rounded bg-amber-500/10 text-amber-400 text-[10px] font-mono flex items-center justify-center font-bold">
                        03
                      </span>
                      <span className="font-medium text-stone-200">确定性时空与锁闭防悖论</span>
                    </div>
                    <span className="text-[11px] text-emerald-400 font-mono">无瞬移 · 无钥匙悖论</span>
                  </div>

                  <div className="p-2.5 rounded-lg bg-[#181411] border border-[#2B231D] flex items-center justify-between">
                    <div className="flex items-center gap-2.5 text-xs">
                      <span className="w-5 h-5 rounded bg-amber-500/10 text-amber-400 text-[10px] font-mono flex items-center justify-center font-bold">
                        04
                      </span>
                      <span className="font-medium text-stone-200">定向自愈修复节点</span>
                    </div>
                    <span className="text-[11px] text-amber-300 font-mono">冲突自动平滑校正</span>
                  </div>
                </div>

                {/* Technical highlights */}
                <div className="p-3 rounded-lg bg-[#0E0C0A] border border-[#251E18] text-xs text-stone-400 mb-6 flex items-start gap-2.5">
                  <ShieldCheck className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                  <p className="leading-relaxed">
                    <strong className="text-amber-200">硬核工程理念：</strong> Agent 负责智能与剧本理解，Game Engine 负责确定性与规则校验。拒绝纯 LLM 编造，逻辑校验全绿才可发布。
                  </p>
                </div>
              </div>

              {/* Action Button: Opens Studio in File Upload Mode */}
              <button
                onClick={handleEnterStudio}
                className="w-full flex items-center justify-center gap-2.5 px-6 py-3.5 rounded-xl bg-amber-950/70 hover:bg-amber-900/80 text-amber-300 border border-amber-500/50 hover:border-amber-400 font-serif font-bold text-sm tracking-wide shadow-lg cursor-pointer active:scale-98 transition-all"
              >
                <Upload className="w-4 h-4 text-amber-400" />
                <span>进入创作工坊（上传本地剧本让 Agent 解析）</span>
                <ArrowRight className="w-4 h-4 text-amber-400 group-hover:translate-x-1 transition-transform" />
              </button>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="relative z-10 w-full max-w-7xl mx-auto px-5 sm:px-8 py-5 border-t border-[#251E18] flex flex-col sm:flex-row items-center justify-between text-xs text-stone-500 gap-2">
        <div className="flex items-center gap-3">
          <span className="font-serif">AI Detective · 智能探案平台</span>
          <span>•</span>
          <span className="font-mono text-[11px]">LangGraph Multi-Agent Architecture</span>
          <span>•</span>
          <span className="font-mono text-[11px]">Deterministic State Engine</span>
        </div>
        <div className="font-mono text-[11px] text-stone-500">
          Ready for Interactive Investigation & Script Ingestion
        </div>
      </footer>
    </div>
  );
};
