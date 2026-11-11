<script setup lang="ts">
import { ref, computed } from 'vue';
import type { SceneId, SceneHotspot } from '../data/sceneData';
import { SCENE_CONFIGS } from '../data/sceneData';
import type { Clue, SuspectId } from '../types/game';
import { CLUES, SUSPECTS } from '../data/caseData';
import { MapPin, ArrowRight, MessageSquare, Sparkles, Check } from 'lucide-vue-next';

interface SceneInvestigationViewProps {
  currentSceneId: SceneId;
  discoveredClueIds: string[];
  themeMode?: 'dark' | 'light';
}

const props = withDefaults(defineProps<SceneInvestigationViewProps>(), {
  themeMode: 'dark',
});

const emit = defineEmits<{
  (e: 'switchScene', targetSceneId: SceneId): void;
  (e: 'inspectClue', clue: Clue): void;
  (e: 'discoveredClue', clueId: string): void;
  (e: 'openFloorPlan'): void;
  (e: 'selectSuspect', suspectId: SuspectId): void;
}>();

const hoveredHotspotId = ref<string | null>(null);
const hoveredExitId = ref<string | null>(null);
const inspectMessage = ref<string | null>(null);
let inspectTimer: ReturnType<typeof setTimeout> | null = null;

const isDark = computed(() => props.themeMode === 'dark');
const sceneConfig = computed(() => SCENE_CONFIGS[props.currentSceneId] || SCENE_CONFIGS['gallery-hall']);

const handleHotspotClick = (hs: SceneHotspot) => {
  if (hs.type === 'clue' && hs.clueId) {
    emit('discoveredClue', hs.clueId);
    const clue = CLUES.find((c) => c.id === hs.clueId);
    if (clue) {
      emit('inspectClue', clue);
    }
  } else if (hs.type === 'exit' && hs.targetSceneId) {
    emit('switchScene', hs.targetSceneId);
  } else if (hs.type === 'npc' && hs.npcId) {
    emit('selectSuspect', hs.npcId);
    if (inspectTimer) clearTimeout(inspectTimer);
    inspectMessage.value = `已将提问焦点对准【${SUSPECTS.find((s) => s.id === hs.npcId)?.name}】`;
    inspectTimer = setTimeout(() => {
      inspectMessage.value = null;
    }, 3000);
  } else if (hs.type === 'inspect') {
    if (inspectTimer) clearTimeout(inspectTimer);
    inspectMessage.value = `【现场物证】${hs.description}${hs.detail ? ' ' + hs.detail : ''}`;
    inspectTimer = setTimeout(() => {
      inspectMessage.value = null;
    }, 4000);
  }
};
</script>

<template>
  <div
    class="relative w-full h-full min-h-[480px] lg:min-h-[580px] backdrop-blur-md rounded-2xl overflow-hidden border transition-colors duration-300 flex flex-col select-none ring-1"
    :class="
      isDark
        ? 'bg-[#181411]/85 border-[#3B3027] shadow-[0_25px_60px_-15px_rgba(0,0,0,0.95),0_12px_28px_-6px_rgba(0,0,0,0.8)] ring-black/40 text-[#F3EFEA]'
        : 'bg-white/95 border-[#EBE4DC] shadow-[0_20px_50px_-10px_rgba(0,0,0,0.08)] ring-stone-200/50 text-[#1C1917]'
    "
  >
    <!-- Top Left Location & Map Trigger (Minimalist, quiet) -->
    <div class="absolute top-3 left-3 z-20 pointer-events-auto">
      <button
        @click="emit('openFloorPlan')"
        class="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg border backdrop-blur-md text-xs font-serif transition cursor-pointer shadow-md"
        :class="
          isDark
            ? 'bg-[#0C0A09]/85 hover:bg-[#181411] border-[#3B3027] hover:border-[#C9942D]/60 text-[#AFA49A] hover:text-[#F3EFEA]'
            : 'bg-white/95 hover:bg-[#FAF7F2] border-[#E0D5C7] hover:border-[#8B3A2B] text-[#5C4F44] hover:text-[#1C1917]'
        "
        title="点击查看画廊建筑平面图"
      >
        <MapPin class="w-3.5 h-3.5" :class="isDark ? 'text-[#C9942D]' : 'text-[#8B3A2B]'" />
        <span class="font-bold" :class="isDark ? 'text-[#F3EFEA]' : 'text-[#1C1917]'">
          {{ sceneConfig.title }}
        </span>
        <span
          v-if="sceneConfig.isCrimeScene"
          class="text-[10px] font-mono ml-1 font-bold"
          :class="isDark ? 'text-[#A44A4A]' : 'text-[#8B3A2B]'"
        >
          [案发现场]
        </span>
        <span class="text-[10px] font-sans ml-1" :class="isDark ? 'text-[#8E8378]' : 'text-[#8C7E72]'">
          · 平面图
        </span>
      </button>
    </div>

    <!-- Main Scene Image Canvas -->
    <div class="relative flex-1 w-full h-full overflow-hidden bg-[#0C0A09]">
      <img
        :key="sceneConfig.id"
        :src="sceneConfig.image"
        :alt="sceneConfig.title"
        class="w-full h-full object-cover object-center filter brightness-95 contrast-105"
      />

      <!-- Cinematic Vignette -->
      <div class="absolute inset-0 bg-gradient-to-t from-[#0C0A09]/90 via-transparent to-[#0C0A09]/40 pointer-events-none" />
      <div class="absolute inset-0 shadow-[inset_0_0_100px_rgba(12,10,9,0.85)] pointer-events-none" />

      <!-- 1. Hotspots: Refined, restrained, high-fidelity pins -->
      <div
        v-for="hs in sceneConfig.hotspots"
        :key="hs.id"
        :style="{ left: `${hs.x}%`, top: `${hs.y}%` }"
        class="absolute -translate-x-1/2 -translate-y-1/2 z-20 group"
        @mouseenter="hoveredHotspotId = hs.id"
        @mouseleave="hoveredHotspotId = null"
      >
        <button
          @click="handleHotspotClick(hs)"
          class="relative flex items-center justify-center cursor-pointer p-1.5 focus:outline-none"
          :aria-label="hs.label"
        >
          <!-- Gold pulse ONLY for undiscovered key clues -->
          <span
            v-if="hs.type === 'clue' && !discoveredClueIds.includes(hs.clueId || '')"
            class="absolute w-6 h-6 rounded-full bg-[#C9942D]/35 animate-ping pointer-events-none"
          />

          <!-- Pin Head -->
          <span
            class="w-5 h-5 rounded-full flex items-center justify-center border transition-all duration-200 shadow-md backdrop-blur-xs"
            :class="
              hs.clueId && discoveredClueIds.includes(hs.clueId)
                ? 'bg-[#181411]/90 border-[#3B3027] text-[#AFA49A] hover:scale-110'
                : hs.type === 'clue'
                ? 'bg-[#C9942D]/20 border-[#C9942D] text-[#C9942D] hover:scale-125 hover:bg-[#C9942D]/40'
                : hs.type === 'npc'
                ? 'bg-[#181411]/90 border-[#3B3027] text-[#F3EFEA] hover:scale-110 hover:border-[#C9942D]/70'
                : 'bg-[#181411]/80 border-[#3B3027] text-[#AFA49A] hover:scale-110 hover:border-[#524135]'
            "
          >
            <Check
              v-if="hs.clueId && discoveredClueIds.includes(hs.clueId)"
              class="w-3 h-3 text-emerald-400"
            />
            <span
              v-else-if="hs.type === 'clue'"
              class="w-1.5 h-1.5 rounded-full bg-[#C9942D]"
            />
            <MessageSquare
              v-else-if="hs.type === 'npc'"
              class="w-2.5 h-2.5 text-[#C9942D]"
            />
            <span v-else class="w-1 h-1 rounded-full bg-[#AFA49A]" />
          </span>
        </button>

        <!-- Quiet, sharp warm charcoal floating tag -->
        <div
          class="absolute bottom-full left-1/2 -translate-x-1/2 mb-1.5 w-52 p-2 rounded-lg bg-[#181411]/95 border border-[#3B3027] shadow-xl backdrop-blur-md text-xs font-serif transition-all duration-150 pointer-events-none z-30"
          :class="
            hoveredHotspotId === hs.id
              ? 'opacity-100 translate-y-0 scale-100'
              : 'opacity-0 translate-y-1 scale-95 pointer-events-none'
          "
        >
          <div class="flex items-center justify-between mb-0.5">
            <span class="font-bold text-[#F3EFEA] text-xs">{{ hs.label }}</span>
            <span class="text-[10px] text-[#C9942D] font-mono">
              {{
                hs.clueId && discoveredClueIds.includes(hs.clueId)
                  ? '已记录'
                  : hs.type === 'clue'
                  ? '线索'
                  : '现场'
              }}
            </span>
          </div>
          <p class="text-[#AFA49A] text-[11px] leading-snug line-clamp-2">
            {{ hs.description }}
          </p>
        </div>
      </div>

      <!-- 2. Scene Exits -->
      <div
        v-for="exit in sceneConfig.exits"
        :key="exit.id"
        :style="{ left: `${exit.x}%`, top: `${exit.y}%` }"
        class="absolute -translate-x-1/2 -translate-y-1/2 z-20 group"
        @mouseenter="hoveredExitId = exit.id"
        @mouseleave="hoveredExitId = null"
      >
        <button
          @click="emit('switchScene', exit.targetSceneId)"
          class="group/exit flex items-center space-x-1.5 px-3 py-1.5 rounded-lg border shadow-lg backdrop-blur-md transition-all duration-150 cursor-pointer text-xs font-serif"
          :class="
            isDark
              ? 'bg-[#130F0D]/90 hover:bg-[#251D17] border-[#3B3027] hover:border-[#C9942D]/70 text-[#DCD4CA] hover:text-[#F3EFEA]'
              : 'bg-white/95 hover:bg-[#FAF7F2] border-[#E0D5C7] hover:border-[#8B3A2B] text-[#1C1917]'
          "
        >
          <span class="font-bold">{{ exit.label }}</span>
          <ArrowRight
            class="w-3 h-3 group-hover/exit:translate-x-0.5 transition"
            :class="isDark ? 'text-[#C9942D]' : 'text-[#8B3A2B]'"
          />
        </button>

        <div
          v-if="exit.description"
          class="absolute top-full left-1/2 -translate-x-1/2 mt-1 w-44 p-2 rounded-lg border text-[10px] font-serif shadow-lg pointer-events-none transition-all duration-150 z-30"
          :class="[
            isDark
              ? 'bg-[#181411]/95 border-[#3B3027] text-[#AFA49A]'
              : 'bg-white/95 border-[#E0D5C7] text-[#5C4F44]',
            hoveredExitId === exit.id
              ? 'opacity-100 scale-100'
              : 'opacity-0 scale-95 pointer-events-none'
          ]"
        >
          {{ exit.description }}
        </div>
      </div>

      <!-- 3. On-Screen Inspection Pop Toast -->
      <div
        v-if="inspectMessage"
        class="absolute bottom-10 left-1/2 -translate-x-1/2 z-30 max-w-md w-full px-4 animate-fadeIn"
      >
        <div
          class="p-2.5 rounded-lg border text-xs font-serif shadow-2xl backdrop-blur-md flex items-start space-x-2"
          :class="
            isDark
              ? 'bg-[#181411]/95 border-[#3B3027] text-[#F3EFEA]'
              : 'bg-white/95 border-[#E0D5C7] text-[#1C1917]'
          "
        >
          <Sparkles class="w-3.5 h-3.5 shrink-0 mt-0.5" :class="isDark ? 'text-[#C9942D]' : 'text-[#8B3A2B]'" />
          <span>{{ inspectMessage }}</span>
        </div>
      </div>
    </div>

    <!-- Bottom Quiet Caption Strip -->
    <div
      class="backdrop-blur-md px-4 py-2 border-t flex items-center justify-between text-xs font-serif transition-colors"
      :class="
        isDark
          ? 'bg-[#130F0D]/90 border-[#3B3027] text-[#AFA49A]'
          : 'bg-[#FAF7F2]/95 border-[#E8DFD5] text-[#5C4F44]'
      "
    >
      <span class="truncate pr-2 font-medium">
        {{ sceneConfig.ambientDescription }}
      </span>
      <span class="shrink-0 font-mono text-[10px]" :class="isDark ? 'text-[#8E8378]' : 'text-[#8C7E72]'">
        点击现场光标勘验
      </span>
    </div>
  </div>
</template>
