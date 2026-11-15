<script setup lang="ts">
import { ref, computed } from 'vue';
import type { SceneId } from '../../data/sceneData';
import { SCENE_CONFIGS } from '../../data/sceneData';
import { CLUES } from '../../data/caseData';
import { X, Compass, ArrowRight } from 'lucide-vue-next';

interface FloorPlanModalProps {
  isOpen: boolean;
  currentSceneId: SceneId;
  discoveredClueIds: string[];
  unlockedScenes: Record<SceneId, boolean>;
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

const props = defineProps<FloorPlanModalProps>();

const emit = defineEmits<{
  (e: 'close'): void;
  (e: 'selectScene', sceneId: SceneId): void;
}>();

const hoveredRoomId = ref<SceneId | null>(null);

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
    clueHint: '内含 3 处物证潜伏点',
  },
  {
    id: 'gallery-hall',
    title: '中央主展厅',
    english: 'MAIN EXHIBITION HALL',
    coords: {
      left: '34%',
      top: '7%',
      width: '60.5%',
      height: '46%',
    },
    npcName: '林岚',
    npcRole: '副馆长',
    avatarColor: '#b45309',
    desc: '悬挂《向日葵之死》真迹，案发当晚吊灯坠毁，地面满是红酒与碎屑。',
    clueHint: '内含 3 处关键痕迹与散落证物',
  },
  {
    id: 'restoration-room',
    title: '古画修复室（第一现场）',
    english: 'RESTORATION LAB (CRIME SCENE)',
    coords: {
      left: '5.5%',
      top: '56%',
      width: '43.5%',
      height: '38%',
    },
    isCrimeScene: true,
    npcName: '许宁',
    npcRole: '修复师',
    avatarColor: '#047857',
    desc: '陈默被害案发中心，从内反锁的密室，工作台上遗留溶剂、尼龙丝线。',
    clueHint: '凶案第一密室 · 核心解密锁钥',
  },
  {
    id: 'security-room',
    title: '中央安防总控室',
    english: 'SECURITY CONTROL HUB',
    coords: {
      left: '51%',
      top: '56%',
      width: '43.5%',
      height: '38%',
    },
    npcName: '赵雷',
    npcRole: '安保主管',
    avatarColor: '#4338ca',
    desc: '监控闭路电视总台与配电电闸，案发时段存在 20 分钟录制黑屏盲区。',
    clueHint: '内含走廊巡更日志与断电电闸',
  },
];

const selectedRoom = computed(() => {
  const targetId = hoveredRoomId.value || props.currentSceneId;
  return rooms.find((r) => r.id === targetId) || rooms[0];
});

const getDiscoveredCountInRoom = (sceneId: SceneId) => {
  const sceneHotspotClueIds = (SCENE_CONFIGS[sceneId]?.hotspots || [])
    .map((h) => h.clueId)
    .filter(Boolean);
  return sceneHotspotClueIds.filter((cid) => props.discoveredClueIds.includes(cid!)).length;
};

const getTotalCountInRoom = (sceneId: SceneId) => {
  return (SCENE_CONFIGS[sceneId]?.hotspots || []).filter((h) => h.clueId).length;
};

const handleRoomClick = (room: RoomSpatialData) => {
  if (room.id === props.currentSceneId) {
    emit('close');
    return;
  }
  emit('selectScene', room.id);
  emit('close');
};
</script>

<template>
  <div
    v-if="isOpen"
    class="fixed inset-0 z-50 backdrop-blur-md flex items-center justify-center p-3 sm:p-6 select-none animate-fadeIn font-serif bg-black/75"
    @click.self="emit('close')"
  >
    <div class="panel-dossier-card relative w-full max-w-5xl rounded-2xl shadow-2xl flex flex-col overflow-hidden border border-theme-border transition-colors duration-300">
      <!-- 1. Header: Sleek Architectural Header -->
      <header class="panel-dossier-header px-5 py-3 border-b border-theme-border flex items-center justify-between">
        <div class="flex items-center space-x-3">
          <div class="w-8 h-8 rounded-lg border border-theme-border bg-theme-surface text-theme-accent flex items-center justify-center shadow-xs">
            <Compass class="w-4 h-4 animate-spin-slow" />
          </div>
          <div>
            <div class="flex items-center space-x-2">
              <h3 class="font-bold text-sm tracking-wide text-theme-ink">
                画廊建筑户型导览图
              </h3>
              <span class="text-[10px] font-mono px-2 py-0.5 rounded border border-theme-border bg-theme-surface text-theme-accent">
                LEVEL 1 ARCHITECTURAL PLAN
              </span>
            </div>
            <p class="text-[11px] text-theme-muted">
              点击户型图内任意房间区域，即可穿梭进入该现场
            </p>
          </div>
        </div>

        <button
          type="button"
          @click="emit('close')"
          class="p-1.5 rounded-lg text-theme-secondary hover:text-theme-ink hover:bg-theme-surface transition cursor-pointer"
          title="关闭平面导览图"
        >
          <X class="w-5 h-5" />
        </button>
      </header>

      <!-- 2. Central Interactive Architectural Floor Plan Canvas -->
      <main class="p-4 sm:p-6 flex flex-col items-center bg-theme-desk">
        <div class="relative w-full aspect-[16/9] max-h-[520px] rounded-xl overflow-hidden border border-theme-border shadow-2xl bg-black/40">
          <!-- The Generated Architectural 2D Floor Plan Base Image -->
          <img
            src="/assets/scenes/gallery_floor_plan.jpg"
            alt="画廊建筑平面户型图"
            class="w-full h-full object-cover object-center filter brightness-95 contrast-105 pointer-events-none"
          />

          <!-- Blueprint Grid Lines -->
          <div class="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_0%,rgba(0,0,0,0.4)_100%)] pointer-events-none" />

          <!-- Interactive Clickable Hotspot Zones for Each Room -->
          <div
            v-for="room in rooms"
            :key="room.id"
            :style="{
              left: room.coords.left,
              top: room.coords.top,
              width: room.coords.width,
              height: room.coords.height,
            }"
            @mouseenter="hoveredRoomId = room.id"
            @mouseleave="hoveredRoomId = null"
            @click="handleRoomClick(room)"
            class="absolute rounded-lg border-2 transition-all duration-300 cursor-pointer p-3 flex flex-col justify-between group overflow-hidden"
            :class="[
              currentSceneId === room.id
                ? 'border-theme-accent bg-theme-accent/20 ring-2 ring-theme-accent/60 shadow-lg'
                : hoveredRoomId === room.id
                ? 'border-amber-400/90 bg-amber-500/15 ring-2 ring-amber-400/40 shadow-md'
                : 'border-white/20 hover:border-white/50 bg-black/25'
            ]"
          >
            <!-- Room Header & Status Tags -->
            <div class="flex items-start justify-between">
              <div class="flex items-center space-x-1.5">
                <span
                  v-if="currentSceneId === room.id"
                  class="flex items-center space-x-1 px-1.5 py-0.5 rounded text-[9px] font-mono font-bold bg-theme-accent text-white shadow-xs"
                >
                  <span class="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                  <span>当前所在</span>
                </span>
                <span
                  v-if="room.isCrimeScene"
                  class="px-1.5 py-0.5 rounded text-[9px] font-mono font-bold bg-red-900/90 text-red-200 border border-red-500/60 animate-pulse shadow-xs"
                >
                  凶案第一现场
                </span>
              </div>

              <!-- Evidence Discovery Badge -->
              <span class="text-[10px] font-mono px-1.5 py-0.5 rounded bg-black/70 backdrop-blur-xs border border-white/20 text-stone-200">
                物证: {{ getDiscoveredCountInRoom(room.id) }}/{{ getTotalCountInRoom(room.id) }}
              </span>
            </div>

            <!-- Room Center Name & Role Badge -->
            <div class="my-auto text-left drop-shadow-md">
              <h4 class="text-sm sm:text-base font-bold text-white tracking-wide group-hover:text-amber-200 transition-colors">
                {{ room.title }}
              </h4>
              <p class="text-[10px] font-mono text-stone-300 tracking-wider">
                {{ room.english }}
              </p>
            </div>

            <!-- Room Bottom Inhabitant Presence -->
            <div class="flex items-center justify-between pt-1 border-t border-white/10 text-[10px] text-stone-200">
              <div class="flex items-center space-x-1.5">
                <span class="w-2 h-2 rounded-full ring-1 ring-white/40" :style="{ backgroundColor: room.avatarColor }" />
                <span class="font-medium truncate max-w-[80px]">{{ room.npcName }} ({{ room.npcRole }})</span>
              </div>
              <span class="text-amber-300 opacity-0 group-hover:opacity-100 transition-opacity flex items-center font-mono">
                穿梭进入 <ArrowRight class="w-3 h-3 ml-0.5" />
              </span>
            </div>
          </div>
        </div>
      </main>

      <!-- 3. Bottom Preview Bar: Selected Room Context & One-Click Navigation -->
      <footer class="panel-dossier-header px-5 py-3 border-t border-theme-border flex items-center justify-between transition-colors">
        <div class="flex items-center space-x-4 overflow-hidden">
          <div class="w-2 h-8 rounded-full bg-theme-accent shrink-0" />
          <div class="overflow-hidden">
            <div class="flex items-center space-x-2">
              <span class="font-bold text-xs text-theme-ink">
                {{ selectedRoom.title }}
              </span>
              <span class="text-[10px] font-mono text-theme-accent">
                [ 驻留人员: {{ selectedRoom.npcName }} · {{ selectedRoom.npcRole }} ]
              </span>
            </div>
            <p class="text-[11px] truncate text-theme-muted">
              {{ selectedRoom.desc }}
            </p>
          </div>
        </div>

        <button
          type="button"
          @click="handleRoomClick(selectedRoom)"
          class="shrink-0 ml-4 px-4 py-2 rounded-lg font-bold text-xs flex items-center space-x-1.5 transition cursor-pointer shadow-md bg-theme-accent hover:bg-theme-accent-hover text-white active:scale-95"
        >
          <span>{{ selectedRoom.id === currentSceneId ? '留在当前场景' : `穿梭前往 ${selectedRoom.title}` }}</span>
          <ArrowRight class="w-3.5 h-3.5" />
        </button>
      </footer>
    </div>
  </div>
</template>
