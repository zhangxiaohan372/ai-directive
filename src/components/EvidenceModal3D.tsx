import React, { useState, useRef } from 'react';
import { Clue, SuspectId } from '../types/game';
import { SUSPECTS, GALLERY_ROOMS } from '../data/caseData';
import { sound } from '../utils/audio';
import {
  X,
  Search,
  Link2,
  ShieldAlert,
  Zap,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  CheckCircle2,
  Camera,
  Maximize2,
} from 'lucide-react';

interface EvidenceModal3DProps {
  clue: Clue | null;
  onClose: () => void;
  onLinkSuspect?: (clueId: string, suspectId: SuspectId) => void;
  themeMode?: 'dark' | 'light';
}

export const EvidenceModal3D: React.FC<EvidenceModal3DProps> = ({
  clue,
  onClose,
  onLinkSuspect,
  themeMode = 'dark',
}) => {
  const [isUVMode, setIsUVMode] = useState(false);
  const [isZoomed, setIsZoomed] = useState(false);
  const [zoomPos, setZoomPos] = useState({ x: 50, y: 50 });
  const [linkedSuspectId, setLinkedSuspectId] = useState<SuspectId | null>(null);
  const imageContainerRef = useRef<HTMLDivElement>(null);

  const isDark = themeMode === 'dark';

  if (!clue) return null;

  const room = GALLERY_ROOMS.find((r) => r.id === clue.locationId);
  const evidenceImageSrc = clue.imageUrl || `/assets/evidence/${clue.id}.jpg`;

  const toggleUVScanner = () => {
    sound.playUVScannerBeep();
    setIsUVMode(!isUVMode);
  };

  const handleLink = (suspectId: SuspectId) => {
    sound.playClueFound();
    setLinkedSuspectId(suspectId);
    onLinkSuspect?.(clue.id, suspectId);
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!isZoomed || !imageContainerRef.current) return;
    const rect = imageContainerRef.current.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    setZoomPos({
      x: Math.max(0, Math.min(100, x)),
      y: Math.max(0, Math.min(100, y)),
    });
  };

  return (
    <div className={`fixed inset-0 z-50 backdrop-blur-md flex items-center justify-center p-3 sm:p-5 select-none animate-fade-in ${
      isDark ? 'bg-black/85' : 'bg-stone-900/60'
    }`}>
      <div className={`rounded-3xl max-w-4xl w-full shadow-2xl border overflow-hidden flex flex-col md:flex-row max-h-[92vh] font-serif transition-colors duration-300 ${
        isDark
          ? 'bg-[#181411] border-[#3B3027] shadow-[0_25px_60px_rgba(0,0,0,0.85)] text-[#F3EFEA]'
          : 'bg-[#FAF7F2] border-[#E0D5C7] shadow-[0_20px_50px_rgba(0,0,0,0.15)] text-[#1C1917]'
      }`}>
        {/* Left: Forensic Macro Evidence Photo Viewport */}
        <div
          className={`md:w-1/2 p-5 flex flex-col items-center justify-between border-b md:border-b-0 md:border-r relative transition-colors duration-500 ${
            isDark ? 'border-[#3B3027]' : 'border-[#E8DFD5]'
          } ${
            isUVMode ? 'bg-[#070611]' : isDark ? 'bg-[#120E0B]' : 'bg-[#F5EFE6]'
          }`}
        >
          {/* Header Bar inside Viewport */}
          <div className="w-full flex items-center justify-between text-xs z-10">
            <span className="flex items-center space-x-1.5 font-bold tracking-wide">
              <Camera className={`w-3.5 h-3.5 ${isDark ? 'text-[#C9942D]' : 'text-[#8B3A2B]'}`} />
              <span className={`text-[13px] ${isDark ? 'text-[#F3EFEA]' : 'text-[#1C1917]'}`}>物证微距相片特写</span>
            </span>

            {/* UV Blacklight Toggle Button */}
            <button
              onClick={toggleUVScanner}
              className={`px-3 py-1 rounded-full text-[11px] font-bold flex items-center space-x-1.5 transition-all duration-300 shadow-xs cursor-pointer ${
                isUVMode
                  ? 'bg-purple-900/90 text-purple-200 ring-2 ring-purple-400 shadow-[0_0_12px_rgba(168,85,247,0.6)]'
                  : isDark
                  ? 'bg-[#251D17] text-[#D8CFC5] hover:text-white border border-[#3B3027] hover:border-[#C9942D]'
                  : 'bg-white text-[#786B60] hover:text-[#1C1917] border border-[#E0D5C7] hover:border-[#8B3A2B]'
              }`}
            >
              <Zap className={`w-3 h-3 ${isUVMode ? 'text-purple-300' : isDark ? 'text-[#C9942D]' : 'text-[#8B3A2B]'}`} />
              <span>{isUVMode ? '紫外荧光鉴识：开启' : '开启 UV 鉴识'}</span>
            </button>
          </div>

          {/* High-Resolution Forensic Photo Container */}
          <div
            ref={imageContainerRef}
            onMouseMove={handleMouseMove}
            onClick={() => setIsZoomed(!isZoomed)}
            className={`w-full h-64 md:h-80 relative rounded-2xl overflow-hidden my-2 border shadow-inner flex items-center justify-center ${
              isDark ? 'border-[#3B3027] bg-[#0A0807]' : 'border-[#E0D5C7] bg-[#EFE9DF]'
            } ${
              isZoomed ? 'cursor-zoom-out' : 'cursor-zoom-in'
            }`}
            title={isZoomed ? '点击还原全貌' : '点击开启微距放大放大镜'}
          >
            {/* The Authentic Macro Photo */}
            <img
              src={evidenceImageSrc}
              alt={clue.name}
              referrerPolicy="no-referrer"
              className={`w-full h-full object-cover transition-all duration-300 ${
                isUVMode
                  ? 'contrast-[160%] hue-rotate-[240deg] saturate-[220%] brightness-95'
                  : 'contrast-105'
              }`}
              style={
                isZoomed
                  ? {
                      transform: 'scale(2.2)',
                      transformOrigin: `${zoomPos.x}% ${zoomPos.y}%`,
                    }
                  : { transform: 'scale(1)' }
              }
            />

            {/* Forensic Overlay Vignette */}
            <div className="absolute inset-0 pointer-events-none shadow-[inset_0_0_40px_rgba(0,0,0,0.65)]" />

            {/* UV Phosphor Glow Overlay in UV mode */}
            {isUVMode && (
              <div className="absolute inset-0 pointer-events-none bg-purple-900/25 mix-blend-color-dodge transition-opacity duration-300">
                <div className="absolute top-3 right-3 px-2 py-0.5 rounded bg-purple-950/80 border border-purple-400 text-[10px] text-purple-200 font-mono tracking-wider">
                  UV FL-365nm
                </div>
              </div>
            )}

            {/* Forensic Watermark Badge */}
            <div className="absolute bottom-2 left-2 px-2 py-0.5 rounded bg-black/60 backdrop-blur-xs border border-white/10 text-[9px] text-[#AFA49A] font-mono tracking-widest uppercase pointer-events-none">
              EXHIBIT REF // #{clue.id.replace('clue_', '').toUpperCase()}
            </div>

            {/* Magnifier Status Badge */}
            <div className="absolute bottom-2 right-2 px-2 py-0.5 rounded bg-black/60 backdrop-blur-xs border border-white/10 text-[9px] text-[#C9942D] font-mono pointer-events-none flex items-center space-x-1">
              <Maximize2 className="w-2.5 h-2.5" />
              <span>{isZoomed ? '2.2x 微距放大' : '点击放大'}</span>
            </div>
          </div>

          {/* Bottom Interaction Guide */}
          <div className="w-full flex items-center justify-between text-[11px] text-[#AFA49A] px-1 z-10">
            <span className="flex items-center space-x-1">
              {isZoomed ? (
                <>
                  <ZoomOut className="w-3 h-3 text-[#C9942D]" />
                  <span>移动鼠标观察细部 · 点击缩小</span>
                </>
              ) : (
                <>
                  <ZoomIn className="w-3 h-3 text-[#C9942D]" />
                  <span>点击相片进入 2.2x 微观检视</span>
                </>
              )}
            </span>
            {isZoomed && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setIsZoomed(false);
                }}
                className="text-[10px] text-[#C9942D] hover:underline flex items-center space-x-0.5 cursor-pointer"
              >
                <RotateCcw className="w-2.5 h-2.5" />
                <span>还原</span>
              </button>
            )}
          </div>
        </div>

        {/* Right: Forensic Case File & Suspect Linkage */}
        <div className={`md:w-1/2 p-6 flex flex-col justify-between overflow-y-auto ${
          isDark ? 'bg-[#181411]' : 'bg-[#FAF7F2]'
        }`}>
          <div>
            {/* Header Badges & Close Button */}
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center space-x-2">
                <span className={`text-xs px-2.5 py-0.5 rounded-full font-bold uppercase tracking-wider border ${
                  isDark
                    ? 'bg-[#251D17] text-[#C9942D] border-[#3B3027]'
                    : 'bg-white text-[#8B3A2B] border-[#E0D5C7]'
                }`}>
                  {clue.category === 'physical' && '物理实物'}
                  {clue.category === 'forensic' && '痕迹化验'}
                  {clue.category === 'digital' && '电子数据'}
                  {clue.category === 'document' && '文书机密'}
                </span>
                {clue.isCrucial && (
                  <span className={`text-xs px-2.5 py-0.5 rounded-full font-bold border flex items-center space-x-1 ${
                    isDark
                      ? 'bg-[#331313] text-[#E58888] border-[#A44A4A]/60'
                      : 'bg-rose-50 text-rose-700 border-rose-300'
                  }`}>
                    <ShieldAlert className="w-3 h-3" />
                    <span>核心铁证</span>
                  </span>
                )}
              </div>
              <button
                onClick={onClose}
                className={`p-1.5 rounded-full transition cursor-pointer ${
                  isDark
                    ? 'text-[#AFA49A] hover:text-[#F3EFEA] hover:bg-[#251D17]'
                    : 'text-[#786B60] hover:text-[#1C1917] hover:bg-stone-200/60'
                }`}
                title="关闭物证检视"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Title & Origin Room */}
            <h3 className={`text-xl font-extrabold tracking-tight ${
              isDark ? 'text-[#F3EFEA]' : 'text-[#1C1917]'
            }`}>{clue.name}</h3>
            <p className={`text-xs mt-1 flex items-center space-x-1.5 ${
              isDark ? 'text-[#AFA49A]' : 'text-[#786B60]'
            }`}>
              <span>提取地点：</span>
              <span className={`font-semibold ${isDark ? 'text-[#D8CFC5]' : 'text-[#1C1917]'}`}>{room?.name || '画廊现场'}</span>
            </p>

            {/* Description */}
            <div className={`mt-3.5 p-3.5 rounded-2xl border text-xs leading-relaxed ${
              isDark
                ? 'bg-[#120E0B] border-[#3B3027] text-[#D8CFC5]'
                : 'bg-white border-[#E0D5C7] text-[#44382F]'
            }`}>
              {clue.detail}
            </div>

            {/* Forensic Note */}
            <div className={`mt-3 p-3.5 rounded-2xl border text-xs leading-relaxed ${
              isDark
                ? 'bg-[#201813] border-[#3B3027] text-[#F3EFEA]'
                : 'bg-[#F5EFE6] border-[#E0D5C7] text-[#1C1917]'
            }`}>
              <div className={`font-bold flex items-center space-x-1.5 mb-1 ${
                isDark ? 'text-[#C9942D]' : 'text-[#8B3A2B]'
              }`}>
                <Search className="w-3.5 h-3.5" />
                <span>法医鉴识与痕迹结论</span>
              </div>
              <p className={isDark ? 'text-[#E0D7CD]' : 'text-[#5C4F44]'}>{clue.forensicNote}</p>
            </div>

            {/* UV Mode Deep Secret (Revealed in UV mode) */}
            {isUVMode && (
              <div className="mt-3 p-3.5 bg-purple-950/70 rounded-2xl border border-purple-800 text-xs text-purple-200 leading-relaxed animate-fade-in shadow-[0_0_15px_rgba(168,85,247,0.2)]">
                <div className="font-bold flex items-center space-x-1.5 text-purple-300 mb-1">
                  <Zap className="w-3.5 h-3.5 text-purple-400" />
                  <span>紫外荧光鉴识增益结论：</span>
                </div>
                {clue.modelType === 'pigment_cloth' &&
                  '紫外光谱反应：抹布浸透的「镉红 302 号」与林岚专属油画调色盘完全一致；但布角处检测到微量修复室专用的甘油护手霜（许宁常用款），且抹布折痕边缘平整，存在明显人为栽赃嫁祸伪造痕迹！'}
                {clue.modelType === 'champagne_flute' &&
                  '紫外光谱清晰显映出高脚杯外壁上的完整螺旋形指纹，经比对与投资人周衡右手食指指纹吻合率达 99.8%！'}
                {clue.modelType === 'pocket_watch' &&
                  '怀表表壳凹坑边缘检测到剧烈钝击时飞溅的微量青铜金属粉末与齿轮卡合挤压碎屑，精准佐证 22:15 头部致命钝击！'}
                {clue.modelType === 'window_latch' &&
                  '暗锁转轴铜柱凹槽内检测到高强度尼龙钓鱼线高速勒拽留下的微热熔塑料荧光残痕！'}
                {clue.modelType === 'keycard' &&
                  '卡片读取芯片接触端沾染微量未挥发的清洁剂溶剂，证实于 22:12 开启修复室门禁！'}
                {clue.modelType !== 'pigment_cloth' &&
                  clue.modelType !== 'champagne_flute' &&
                  clue.modelType !== 'pocket_watch' &&
                  clue.modelType !== 'window_latch' &&
                  clue.modelType !== 'keycard' &&
                  '荧光反应显现物证表面新鲜无二次覆盖的生物油层与细微划痕。'}
              </div>
            )}

            {/* Clue Tags */}
            <div className="mt-3.5 flex flex-wrap gap-1.5">
              {clue.tags.map((tag) => (
                <span
                  key={tag}
                  className={`text-[11px] px-2.5 py-0.5 rounded-md border font-medium ${
                    isDark
                      ? 'bg-[#120E0B] text-[#AFA49A] border-[#3B3027]'
                      : 'bg-white text-[#786B60] border-[#E0D5C7]'
                  }`}
                >
                  #{tag}
                </span>
              ))}
            </div>
          </div>

          {/* Suspect Linkage Grid with Avatars & Feedback */}
          <div className={`mt-5 pt-3.5 border-t ${
            isDark ? 'border-[#3B3027]' : 'border-[#E8DFD5]'
          }`}>
            <div className="flex items-center justify-between mb-2">
              <span className={`text-xs font-bold flex items-center space-x-1.5 ${
                isDark ? 'text-[#F3EFEA]' : 'text-[#1C1917]'
              }`}>
                <Link2 className={`w-3.5 h-3.5 ${isDark ? 'text-[#C9942D]' : 'text-[#8B3A2B]'}`} />
                <span>建立推理关联（关联网中嫌疑人）：</span>
              </span>
              <span className={`text-[10px] ${isDark ? 'text-[#AFA49A]' : 'text-[#786B60]'}`}>点击钉上案板</span>
            </div>

            <div className="grid grid-cols-2 gap-2">
              {SUSPECTS.map((s) => {
                const isTargetSuspect = clue.connectedSuspects.includes(s.id);
                const isLinked = linkedSuspectId === s.id;

                return (
                  <button
                    key={s.id}
                    onClick={() => handleLink(s.id)}
                    className={`text-xs py-1.5 px-2.5 rounded-xl border transition-all duration-200 text-left flex items-center space-x-2.5 cursor-pointer ${
                      isLinked
                        ? isDark
                          ? 'border-[#C9942D] bg-[#2E2012] text-[#F3EFEA] shadow-[0_0_10px_rgba(201,148,45,0.4)]'
                          : 'border-[#8B3A2B] bg-[#F7EFE9] text-[#1C1917] shadow-xs'
                        : isTargetSuspect
                        ? isDark
                          ? 'border-[#3B3027] hover:border-[#C9942D]/80 bg-[#14100E] hover:bg-[#251D17] text-[#D8CFC5]'
                          : 'border-[#E0D5C7] hover:border-[#8B3A2B] bg-white hover:bg-[#FAF7F2] text-[#1C1917]'
                        : isDark
                        ? 'border-[#3B3027]/70 bg-[#120E0B] hover:bg-[#1C1613] text-[#AFA49A] opacity-75 hover:opacity-100'
                        : 'border-[#E0D5C7]/70 bg-[#F5EFE6] hover:bg-white text-[#786B60] opacity-80 hover:opacity-100'
                    }`}
                  >
                    {/* Portrait Avatar */}
                    <img
                      src={s.avatarImage || `/assets/portraits/${s.id}.jpg`}
                      alt={s.name}
                      referrerPolicy="no-referrer"
                      className={`w-7 h-7 rounded-full object-cover shrink-0 ring-1 ${
                        isDark ? 'ring-[#3B3027]' : 'ring-[#E0D5C7]'
                      }`}
                    />

                    <div className="flex flex-col min-w-0 flex-1">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-xs truncate">{s.name}</span>
                        {isLinked ? (
                          <CheckCircle2 className={`w-3 h-3 shrink-0 ${isDark ? 'text-[#C9942D]' : 'text-[#8B3A2B]'}`} />
                        ) : isTargetSuspect ? (
                          <span className={`text-[9px] font-mono shrink-0 ${
                            isDark ? 'text-[#C9942D]' : 'text-[#8B3A2B]'
                          }`}>
                            重点
                          </span>
                        ) : null}
                      </div>
                      <span className={`text-[10px] truncate ${isDark ? 'text-[#73675E]' : 'text-[#8C7E72]'}`}>
                        {s.title.slice(0, 6)}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
