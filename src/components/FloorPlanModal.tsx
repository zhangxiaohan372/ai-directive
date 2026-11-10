import React, { useState } from 'react';
import { SceneId, SCENE_CONFIGS } from '../data/sceneData';
import { CLUES } from '../data/caseData';
import { MapPin, X, Navigation, Compass, Sparkles, User, AlertCircle, ArrowRight } from 'lucide-react';

interface FloorPlanModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentSceneId: SceneId;
  onSelectScene: (sceneId: SceneId) => void;
  discoveredClueIds: string[];
  unlockedScenes: Record<SceneId, boolean>;
  themeMode?: 'dark' | 'light';
}

interface RoomSpatialData {
  id: SceneId;
  title: string;
  english: string;
  coords: {
    left: string;
    top: string;
    width: string;
    height: string;
  };
  isCrimeScene?: boolean;
  npcName: string;
  npcRole: string;
  avatarColor: string;
  desc: string;
  clueHint: string;
}

export const FloorPlanModal: React.FC<FloorPlanModalProps> = ({
  isOpen,
  onClose,
  currentSceneId,
  onSelectScene,
  discoveredClueIds,
  unlockedScenes,
  themeMode = 'dark',
}) => {
  const [hoveredRoomId, setHoveredRoomId] = useState<SceneId | null>(null);
  const isDark = themeMode === 'dark';

  if (!isOpen) return null;

  // Real spatial bounds matching the generated architectural floor plan image
  const rooms: RoomSpatialData[] = [
    {
      id: 'office',
      title: '策展人办公室',
      english: 'CURATOR OFFICE',
      coords: {
        left: '5.5%',
        top: '7%',
        width: '26%',
        height: '46%',
      },
      npcName: '周衡',
      npcRole: '投资人',
      avatarColor: '#1d4ed8',
      desc: '陈默机要书斋，藏有刷卡备用卡、代笔协议与开封的香槟酒杯。',
      clueHint: '内含 2 份重要文书与痕迹证物',
    },
    {
      id: 'gallery-hall',
      title: '中央艺术展厅',
      english: 'MAIN EXHIBITION HALL',
      coords: {
        left: '32%',
        top: '7%',
        width: '35.5%',
        height: '57%',
      },
      npcName: '林岚',
      npcRole: '知名画家',
      avatarColor: '#e11d48',
      desc: '开幕酒会枢纽中枢，人流往来频繁，通往修复室、办公室与安保室。',
      clueHint: '内含 2 份酒会遗落证物',
    },
    {
      id: 'restoration-room',
      title: '文物修复室',
      english: 'RESTORATION LAB',
      coords: {
        left: '68%',
        top: '7%',
        width: '26.5%',
        height: '46%',
      },
      isCrimeScene: true,
      npcName: '许宁',
      npcRole: '画廊助理',
      avatarColor: '#7c3aed',
      desc: '【命案第一现场】受害者陈默遇害地，现场门窗反锁，案发时间定格在 22:15。',
      clueHint: '核心现场，藏有 3 份决定性反锁与凶器物证',
    },
    {
      id: 'security-room',
      title: '安保监控室',
      english: 'SECURITY & CCTV',
      coords: {
        left: '44.5%',
        top: '64.5%',
        width: '23.5%',
        height: '29%',
      },
      npcName: '赵磊',
      npcRole: '当班保安',
      avatarColor: '#059669',
      desc: '全馆监控与电力控制枢纽，22:00-22:20 存在关键录像雪花断档。',
      clueHint: '内含 1 份监控断电与值班日志证物',
    },
  ];

  const getRoomClueProgress = (sceneId: SceneId) => {
    const config = SCENE_CONFIGS[sceneId];
    const roomClues = CLUES.filter((c) => c.locationId === config.legacyLocationId);
    const foundCount = roomClues.filter((c) => discoveredClueIds.includes(c.id)).length;
    return { found: foundCount, total: roomClues.length };
  };

  const activeFocusRoom =
    rooms.find((r) => r.id === (hoveredRoomId || currentSceneId)) || rooms[0];
  const activeFocusProgress = getRoomClueProgress(activeFocusRoom.id);

  return (
    <div className={`fixed inset-0 z-50 backdrop-blur-md flex items-center justify-center p-3 sm:p-5 animate-fadeIn font-serif select-none ${
      isDark ? 'bg-black/85' : 'bg-stone-900/60'
    }`}>
      <div className={`relative w-full max-w-5xl rounded-2xl shadow-2xl flex flex-col overflow-hidden border transition-colors duration-300 ${
        isDark
          ? 'bg-[#0C0A09] border-[#3B3027] shadow-[0_30px_70px_rgba(0,0,0,0.95)] text-[#F3EFEA]'
          : 'bg-[#FAF7F2] border-[#E0D5C7] shadow-[0_20px_50px_rgba(0,0,0,0.15)] text-[#1C1917]'
      }`}>
        {/* 1. Header: Sleek Architectural Header */}
        <div className={`px-5 py-3 border-b flex items-center justify-between ${
          isDark
            ? 'border-[#3B3027] bg-[#130F0D]/95'
            : 'border-[#E8DFD5] bg-[#F5EFE6]/95'
        }`}>
          <div className="flex items-center space-x-3">
            <div className={`w-8 h-8 rounded-lg border flex items-center justify-center ${
              isDark
                ? 'bg-[#181411] border-[#3B3027] text-[#C9942D]'
                : 'bg-white border-[#E0D5C7] text-[#8B3A2B]'
            }`}>
              <Compass className="w-4 h-4 animate-spin-slow" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h3 className={`font-bold text-sm tracking-wide ${
                  isDark ? 'text-[#F3EFEA]' : 'text-[#1C1917]'
                }`}>
                  画廊建筑户型导览图
                </h3>
                <span className={`text-[10px] font-mono px-2 py-0.5 rounded border ${
                  isDark
                    ? 'text-[#C9942D] bg-[#181411] border-[#3B3027]'
                    : 'text-[#8B3A2B] bg-white border-[#E0D5C7]'
                }`}>
                  LEVEL 1 ARCHITECTURAL PLAN
                </span>
              </div>
              <p className={`text-[11px] ${isDark ? 'text-[#AFA49A]' : 'text-[#786B60]'}`}>
                点击户型图内任意房间区域，即可穿梭进入该现场
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className={`p-1.5 rounded-lg transition cursor-pointer ${
              isDark
                ? 'text-[#AFA49A] hover:text-[#F3EFEA] hover:bg-[#181411]'
                : 'text-[#786B60] hover:text-[#1C1917] hover:bg-stone-200/60'
            }`}
            title="关闭平面导览图"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* 2. Central Interactive Architectural Floor Plan Canvas */}
        <div className={`p-4 sm:p-6 flex flex-col items-center ${
          isDark ? 'bg-[#0E0B09]' : 'bg-[#EFE9DF]'
        }`}>
          <div className={`relative w-full aspect-[16/9] max-h-[520px] rounded-xl overflow-hidden border shadow-2xl ${
            isDark ? 'border-[#3B3027] bg-[#0A0807]' : 'border-[#D9CFC4] bg-[#E5DDD2]'
          }`}>
            {/* The Generated Architectural 2D Floor Plan Base Image */}
            <img
              src="/assets/scenes/gallery_floor_plan.jpg"
              alt="画廊建筑平面户型图"
              className="w-full h-full object-cover object-center filter brightness-95 contrast-105 pointer-events-none"
            />

            {/* Subtle Vignette Depth */}
            <div className="absolute inset-0 shadow-[inset_0_0_80px_rgba(0,0,0,0.85)] pointer-events-none" />

            {/* Interactive Room Zones mapped to exact physical room layout */}
            {rooms.map((room) => {
              const isCurrent = currentSceneId === room.id;
              const isHovered = hoveredRoomId === room.id;
              const isUnlocked = unlockedScenes[room.id] ?? true;
              const progress = getRoomClueProgress(room.id);

              return (
                <div
                  key={room.id}
                  style={{
                    left: room.coords.left,
                    top: room.coords.top,
                    width: room.coords.width,
                    height: room.coords.height,
                  }}
                  onMouseEnter={() => setHoveredRoomId(room.id)}
                  onMouseLeave={() => setHoveredRoomId(null)}
                  onClick={() => {
                    if (isUnlocked) {
                      onSelectScene(room.id);
                      onClose();
                    }
                  }}
                  className={`absolute rounded-lg transition-all duration-200 cursor-pointer flex flex-col items-center justify-center p-2 text-center group ${
                    isCurrent
                      ? 'bg-[#C9942D]/15 border-2 border-[#C9942D] shadow-[0_0_30px_rgba(201,148,45,0.35)] ring-1 ring-[#C9942D]/40'
                      : isHovered
                      ? 'bg-[#C9942D]/10 border border-[#C9942D]/70 shadow-[0_0_20px_rgba(201,148,45,0.2)]'
                      : 'hover:bg-[#181411]/40 border border-transparent hover:border-[#3B3027]'
                  }`}
                >
                  {/* Floating Architectural Badge */}
                  <div
                    className={`px-2.5 py-1.5 rounded-lg border backdrop-blur-md transition-all duration-200 shadow-xl max-w-[92%] ${
                      isCurrent
                        ? isDark
                          ? 'bg-[#181411]/95 border-[#C9942D] text-[#F3EFEA]'
                          : 'bg-white border-[#8B3A2B] text-[#1C1917]'
                        : isHovered
                        ? isDark
                          ? 'bg-[#181411]/90 border-[#C9942D]/70 text-[#F3EFEA] scale-105'
                          : 'bg-white/95 border-[#8B3A2B]/70 text-[#1C1917] scale-105'
                        : isDark
                        ? 'bg-[#120E0C]/85 border-[#3B3027] text-[#D8CFD4]'
                        : 'bg-white/85 border-[#E0D5C7] text-[#5C4F44]'
                    }`}
                  >
                    {/* Header Tag: Status / Crime Scene */}
                    <div className="flex items-center justify-center space-x-1.5 mb-0.5">
                      {isCurrent ? (
                        <span className={`flex items-center space-x-1 text-[10px] font-bold font-mono ${
                          isDark ? 'text-[#C9942D]' : 'text-[#8B3A2B]'
                        }`}>
                          <span className={`w-1.5 h-1.5 rounded-full animate-ping ${
                            isDark ? 'bg-[#C9942D]' : 'bg-[#8B3A2B]'
                          }`} />
                          <span>当前位置</span>
                        </span>
                      ) : room.isCrimeScene ? (
                        <span className={`text-[9px] px-1.5 py-0.2 rounded font-mono font-bold ${
                          isDark
                            ? 'bg-[#331313] text-[#E58888] border border-[#A44A4A]/60'
                            : 'bg-rose-50 text-rose-700 border border-rose-300'
                        }`}>
                          命案第一现场
                        </span>
                      ) : (
                        <span className={`text-[9px] font-mono ${isDark ? 'text-[#8E8378]' : 'text-[#8C7E72]'}`}>
                          {room.english}
                        </span>
                      )}
                    </div>

                    {/* Room Title */}
                    <div className={`font-bold text-xs sm:text-sm transition ${
                      isDark ? 'text-[#F3EFEA] group-hover:text-[#C9942D]' : 'text-[#1C1917] group-hover:text-[#8B3A2B]'
                    }`}>
                      {room.title}
                    </div>

                    {/* Bottom Status: NPC presence & Clue count */}
                    <div className={`mt-1 pt-1 border-t flex items-center justify-center space-x-2 text-[10px] ${
                      isDark ? 'border-[#3B3027]' : 'border-[#E8DFD5]'
                    }`}>
                      <span className={`flex items-center space-x-1 ${isDark ? 'text-[#AFA49A]' : 'text-[#786B60]'}`}>
                        <span
                          className="w-2 h-2 rounded-full inline-block"
                          style={{ backgroundColor: room.avatarColor }}
                        />
                        <span>{room.npcName}</span>
                      </span>
                      <span className={isDark ? 'text-[#3B3027]' : 'text-[#D8CFC5]'}>·</span>
                      <span
                        className={`font-mono font-bold ${
                          progress.found === progress.total && progress.total > 0
                            ? isDark ? 'text-emerald-400' : 'text-emerald-600'
                            : isDark ? 'text-[#C9942D]' : 'text-[#8B3A2B]'
                        }`}
                      >
                        物证 {progress.found}/{progress.total}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* 3. Bottom Detail Panel: Currently Focused Room Overview & Teleport CTA */}
        <div className={`px-5 py-3 border-t flex flex-col sm:flex-row items-center justify-between gap-3 text-xs ${
          isDark
            ? 'border-[#3B3027] bg-[#130F0D]/95'
            : 'border-[#E8DFD5] bg-[#F5EFE6]/95'
        }`}>
          <div className="flex items-center space-x-3 overflow-hidden w-full sm:w-auto">
            <img
              src={`/assets/portraits/${activeFocusRoom.id === 'office' ? 'zhou_heng' : activeFocusRoom.id === 'restoration-room' ? 'xu_ning' : activeFocusRoom.id === 'security-room' ? 'zhao_lei' : 'lin_lan'}.jpg`}
              alt={activeFocusRoom.npcName}
              className={`w-9 h-9 rounded-lg object-cover object-top shrink-0 border shadow-xs ${
                isDark ? 'border-[#3B3027]' : 'border-[#E0D5C7]'
              }`}
            />
            <div className="overflow-hidden">
              <div className="flex items-center space-x-2">
                <span className={`font-bold text-sm ${isDark ? 'text-[#F3EFEA]' : 'text-[#1C1917]'}`}>
                  {activeFocusRoom.title}
                </span>
                {activeFocusRoom.isCrimeScene && (
                  <span className={`text-[10px] px-1.5 py-0.2 rounded font-mono ${
                    isDark
                      ? 'bg-[#331313] text-[#E58888] border border-[#A44A4A]/60'
                      : 'bg-rose-50 text-rose-700 border border-rose-300'
                  }`}>
                    案发现场
                  </span>
                )}
                <span className={`text-[11px] ${isDark ? 'text-[#AFA49A]' : 'text-[#786B60]'}`}>
                  滞留人员: {activeFocusRoom.npcName}（{activeFocusRoom.npcRole}）
                </span>
              </div>
              <p className={`text-[11px] truncate mt-0.5 max-w-xl ${
                isDark ? 'text-[#AFA49A]' : 'text-[#786B60]'
              }`}>
                {activeFocusRoom.desc}
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2 shrink-0 w-full sm:w-auto justify-end">
            <button
              onClick={() => {
                onSelectScene(activeFocusRoom.id);
                onClose();
              }}
              className={`flex items-center space-x-1.5 px-4 py-2 rounded-lg font-bold text-xs transition cursor-pointer shadow-md ${
                isDark
                  ? 'bg-[#C9942D] hover:bg-[#B38325] text-[#0C0A09]'
                  : 'bg-[#8B3A2B] hover:bg-[#722F22] text-white'
              }`}
            >
              <span>
                {currentSceneId === activeFocusRoom.id ? '继续勘验此房间' : '前往此房间'}
              </span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={onClose}
              className={`px-3 py-2 rounded-lg border text-xs transition cursor-pointer ${
                isDark
                  ? 'bg-[#181411] hover:bg-[#251D17] border-[#3B3027] text-[#AFA49A] hover:text-[#F3EFEA]'
                  : 'bg-white hover:bg-[#FAF7F2] border-[#E0D5C7] text-[#786B60] hover:text-[#1C1917]'
              }`}
            >
              关闭
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
