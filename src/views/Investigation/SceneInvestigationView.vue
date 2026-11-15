<script setup lang="ts">
import { ref, computed } from 'vue';
import type { SceneId, SceneHotspot } from '../../data/sceneData';
import { SCENE_CONFIGS } from '../../data/sceneData';
import type { Clue, SuspectId } from '../../types/game';
import { CLUES, SUSPECTS } from '../../data/caseData';
import { MapPin, ArrowRight, MessageSquare, Sparkles, Check } from 'lucide-vue-next';

interface SceneInvestigationViewProps {
  currentSceneId: SceneId;
  discoveredClueIds: string[];
}

const props = defineProps<SceneInvestigationViewProps>();

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
  <div class="panel-dossier-card relative w-full h-full min-h-120 lg:min-h-145 backdrop-blur-md rounded-2xl overflow-hidden border border-theme-border transition-colors duration-300 flex flex-col select-none ring-1 ring-black/20">
    <!-- Top Left Location & Map Trigger -->
    <div class="absolute top-3 left-3 z-20 pointer-events-auto">
      <button
        type="button"
        @click="emit('openFloorPlan')"
        class="scene-map-btn"
        title="点击查看画廊建筑平面图"
      >
        <MapPin class="w-3.5 h-3.5 text-theme-accent" />
        <span class="font-bold text-theme-ink">
          {{ sceneConfig.title }}
        </span>
        <span
          v-if="sceneConfig.isCrimeScene"
          class="text-[10px] font-mono ml-1 font-bold text-red-500"
        >
          [案发现场]
        </span>
        <span class="text-[10px] font-sans ml-1 text-theme-muted">
          · 平面图
        </span>
      </button>
    </div>

    <!-- Main Scene Image Canvas -->
    <div class="relative flex-1 w-full h-full overflow-hidden bg-black">
      <img
        :key="sceneConfig.id"
        :src="sceneConfig.image"
        :alt="sceneConfig.title"
        class="w-full h-full object-cover object-center filter brightness-95 contrast-105"
      />

      <!-- Cinematic Vignette -->
      <div class="scene-cinematic-vignette" />

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
          type="button"
          @click="handleHotspotClick(hs)"
          class="scene-hotspot-btn"
          :aria-label="hs.label"
        >
          <!-- Gold pulse ONLY for undiscovered key clues -->
          <span
            v-if="hs.type === 'clue' && !discoveredClueIds.includes(hs.clueId || '')"
            class="absolute w-6 h-6 rounded-full bg-theme-accent/40 animate-ping pointer-events-none"
          />

          <!-- Pin Head -->
          <span
            class="scene-hotspot-pin"
            :class="
              hs.clueId && discoveredClueIds.includes(hs.clueId)
                ? 'bg-theme-surface/90 border-theme-border text-theme-muted hover:scale-110'
                : hs.type === 'clue'
                ? 'bg-theme-accent/25 border-theme-accent text-theme-accent hover:scale-125'
                : hs.type === 'npc'
                ? 'bg-theme-surface/90 border-theme-border text-theme-ink hover:scale-110 hover:border-theme-accent'
                : 'bg-theme-surface/80 border-theme-border text-theme-muted hover:scale-110'
            "
          >
            <Check
              v-if="hs.clueId && discoveredClueIds.includes(hs.clueId)"
              class="w-3 h-3 text-emerald-400"
            />
            <span
              v-else-if="hs.type === 'clue'"
              class="w-1.5 h-1.5 rounded-full bg-theme-accent"
            />
            <MessageSquare
              v-else-if="hs.type === 'npc'"
              class="w-2.5 h-2.5 text-theme-accent"
            />
            <span v-else class="w-1 h-1 rounded-full bg-theme-muted" />
          </span>
        </button>

        <!-- Floating Tag -->
        <div
          class="scene-hotspot-tooltip"
          :class="{
            'opacity-100 translate-y-0 scale-100': hoveredHotspotId === hs.id,
            'opacity-0 translate-y-1 scale-95 pointer-events-none': hoveredHotspotId !== hs.id
          }"
        >
          <div class="flex items-center justify-between mb-0.5">
            <span class="font-bold text-theme-ink text-xs">{{ hs.label }}</span>
            <span class="text-[10px] text-theme-accent font-mono">
              {{
                hs.clueId && discoveredClueIds.includes(hs.clueId)
                  ? '已记录'
                  : hs.type === 'clue'
                  ? '线索'
                  : '现场'
              }}
            </span>
          </div>
          <p class="text-theme-muted text-[11px] leading-snug line-clamp-2">
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
          type="button"
          @click="emit('switchScene', exit.targetSceneId)"
          class="scene-exit-btn group/exit"
        >
          <span class="font-bold">{{ exit.label }}</span>
          <ArrowRight class="w-3 h-3 text-theme-accent group-hover/exit:translate-x-0.5 transition" />
        </button>

        <div
          v-if="exit.description"
          class="absolute top-full left-1/2 -translate-x-1/2 mt-1 w-44 p-2 rounded-lg border border-theme-border bg-theme-card text-theme-muted text-[10px] font-serif shadow-lg pointer-events-none transition-all duration-150 z-30"
          :class="{
            'opacity-100 scale-100': hoveredExitId === exit.id,
            'opacity-0 scale-95 pointer-events-none': hoveredExitId !== exit.id
          }"
        >
          {{ exit.description }}
        </div>
      </div>

      <!-- 3. On-Screen Inspection Pop Toast -->
      <div
        v-if="inspectMessage"
        class="absolute bottom-10 left-1/2 -translate-x-1/2 z-30 max-w-md w-full px-4 animate-fadeIn"
      >
        <div class="p-2.5 rounded-lg border border-theme-border bg-theme-card text-theme-ink text-xs font-serif shadow-2xl backdrop-blur-md flex items-start space-x-2">
          <Sparkles class="w-3.5 h-3.5 shrink-0 mt-0.5 text-theme-accent" />
          <span>{{ inspectMessage }}</span>
        </div>
      </div>
    </div>

    <!-- Bottom Quiet Caption Strip -->
    <footer class="panel-dossier-header backdrop-blur-md px-4 py-2 border-t border-theme-border flex items-center justify-between text-xs font-serif transition-colors">
      <span class="truncate pr-2 font-medium text-theme-ink">
        {{ sceneConfig.ambientDescription }}
      </span>
      <span class="shrink-0 font-mono text-[10px] text-theme-muted">
        点击现场光标勘验
      </span>
    </footer>
  </div>
</template>

<style scoped>
@reference "../../index.css";

.scene-cinematic-vignette {
  @apply absolute inset-0 pointer-events-none;
  background:
    radial-gradient(ellipse at center, transparent 40%, rgba(0, 0, 0, 0.85) 100%),
    linear-gradient(to top, rgba(0, 0, 0, 0.8) 0%, transparent 50%, rgba(0, 0, 0, 0.35) 100%);
}

.scene-map-btn {
  @apply flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-theme-border bg-theme-surface/90 hover:bg-theme-card-subtle text-theme-ink backdrop-blur-md text-xs font-serif transition cursor-pointer shadow-md;
}

.scene-hotspot-btn {
  @apply relative flex items-center justify-center cursor-pointer p-1.5 focus:outline-none;
}

.scene-hotspot-pin {
  @apply w-5 h-5 rounded-full flex items-center justify-center border transition-all duration-200 shadow-md backdrop-blur-xs;
}

.scene-hotspot-tooltip {
  @apply absolute bottom-full left-1/2 -translate-x-1/2 mb-1.5 w-52 p-2 rounded-lg bg-theme-card/95 border border-theme-border shadow-xl backdrop-blur-md text-xs font-serif transition-all duration-150 pointer-events-none z-30;
}

.scene-exit-btn {
  @apply flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-theme-border bg-theme-surface/90 hover:bg-theme-card-subtle text-theme-ink shadow-lg backdrop-blur-md transition-all duration-150 cursor-pointer text-xs font-serif;
}
</style>
