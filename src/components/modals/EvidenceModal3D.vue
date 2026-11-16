<script setup lang="ts">
import { ref, computed } from 'vue';
import type { Clue, SuspectId } from '../../types/game';
import { SUSPECTS, GALLERY_ROOMS } from '../../data/caseData';
import { sound } from '../../utils/audio';
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
} from 'lucide-vue-next';

interface EvidenceModal3DProps {
  clue: Clue | null;
}

const props = defineProps<EvidenceModal3DProps>();

const emit = defineEmits<{
  (e: 'close'): void;
  (e: 'linkSuspect', clueId: string, suspectId: SuspectId): void;
}>();

const isUVMode = ref(false);
const isZoomed = ref(false);
const zoomPos = ref({ x: 50, y: 50 });
const linkedSuspectId = ref<SuspectId | null>(null);
const imageContainerRef = ref<HTMLDivElement | null>(null);

const room = computed(() => props.clue ? GALLERY_ROOMS.find((r) => r.id === props.clue!.locationId) : null);
const evidenceImageSrc = computed(() => props.clue ? (props.clue.imageUrl || `/assets/evidence/${props.clue.id}.jpg`) : '');

const toggleUVScanner = () => {
  sound.playUVScannerBeep();
  isUVMode.value = !isUVMode.value;
};

const handleLink = (suspectId: SuspectId) => {
  if (!props.clue) return;
  sound.playClueFound();
  linkedSuspectId.value = suspectId;
  emit('linkSuspect', props.clue.id, suspectId);
};

const handleMouseMove = (e: MouseEvent) => {
  if (!isZoomed.value || !imageContainerRef.value) return;
  const rect = imageContainerRef.value.getBoundingClientRect();
  const x = ((e.clientX - rect.left) / rect.width) * 100;
  const y = ((e.clientY - rect.top) / rect.height) * 100;
  zoomPos.value = {
    x: Math.max(0, Math.min(100, x)),
    y: Math.max(0, Math.min(100, y)),
  };
};

const toggleZoom = (e: MouseEvent) => {
  if (!isZoomed.value && imageContainerRef.value) {
    const rect = imageContainerRef.value.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    zoomPos.value = { x, y };
  }
  isZoomed.value = !isZoomed.value;
};
</script>

<template>
  <div
    v-if="clue"
    class="fixed inset-0 z-50 backdrop-blur-md flex items-center justify-center p-3 sm:p-6 select-none animate-fadeIn font-serif bg-black/75"
    @click.self="emit('close')"
  >
    <div class="panel-dossier-card relative w-full max-w-4xl rounded-2xl shadow-2xl flex flex-col md:flex-row overflow-hidden border border-theme-border transition-colors duration-300 max-h-[92vh]">
      <!-- Left: High-Def Microscopic Evidence Photograph Viewer -->
      <div class="md:w-1/2 p-4 sm:p-6 flex flex-col items-center justify-between border-b md:border-b-0 md:border-r border-theme-border relative overflow-hidden bg-theme-desk">
        <!-- Top Controls: UV Luminescence Toggle -->
        <div class="w-full flex items-center justify-between mb-3 z-10">
          <div class="flex items-center space-x-1.5 text-xs text-theme-muted font-mono">
            <Camera class="w-3.5 h-3.5 text-theme-accent" />
            <span>物证编号: #{{ clue.id }}</span>
          </div>

          <button
            type="button"
            @click="toggleUVScanner"
            class="flex items-center space-x-1.5 px-3 py-1 rounded-full text-xs font-bold transition cursor-pointer border"
            :class="
              isUVMode
                ? 'bg-purple-950 text-purple-200 border-purple-500 shadow-[0_0_15px_rgba(168,85,247,0.5)]'
                : 'bg-theme-surface hover:bg-theme-card-subtle text-theme-secondary border-theme-border'
            "
            title="开启 365nm 紫外荧光检视，显现潜在隐蔽残留"
          >
            <Zap class="w-3.5 h-3.5" :class="isUVMode ? 'text-purple-300 animate-pulse' : 'text-purple-500'" />
            <span>{{ isUVMode ? '紫外荧光模式 [开]' : '紫外荧光检视' }}</span>
          </button>
        </div>

        <!-- Center Image Stage with Microscopic Magnifier -->
        <div
          ref="imageContainerRef"
          class="relative w-full aspect-square max-h-[380px] rounded-xl overflow-hidden border border-theme-border shadow-inner cursor-zoom-in my-auto bg-black/40"
          @mousemove="handleMouseMove"
          @click="toggleZoom"
        >
          <img
            :src="evidenceImageSrc"
            :alt="clue.name"
            loading="lazy"
            class="w-full h-full object-cover transition-all duration-300"
            :class="isUVMode ? 'contrast-[160%] hue-rotate-[240deg] saturate-[220%] brightness-95' : 'contrast-105'"
            :style="
              isZoomed
                ? {
                    transform: 'scale(2.2)',
                    transformOrigin: `${zoomPos.x}% ${zoomPos.y}%`,
                  }
                : { transform: 'scale(1)' }
            "
          />

          <!-- Forensic Overlay Vignette -->
          <div class="absolute inset-0 pointer-events-none shadow-[inset_0_0_40px_rgba(0,0,0,0.65)]" />

          <!-- UV Phosphor Glow Overlay in UV mode -->
          <div
            v-if="isUVMode"
            class="absolute inset-0 pointer-events-none bg-purple-900/25 mix-blend-color-dodge transition-opacity duration-300"
          >
            <div class="absolute top-3 right-3 px-2 py-0.5 rounded bg-purple-950/80 border border-purple-400 text-[10px] text-purple-200 font-mono tracking-wider">
              UV FL-365nm
            </div>
          </div>

          <!-- Forensic Watermark Badge -->
          <div class="absolute bottom-2 left-2 px-2 py-0.5 rounded bg-black/60 backdrop-blur-xs border border-white/10 text-[9px] text-stone-300 font-mono tracking-widest uppercase pointer-events-none">
            EXHIBIT REF // #{{ clue.id.replace('clue_', '').toUpperCase() }}
          </div>

          <!-- Magnifier Status Badge -->
          <div class="absolute bottom-2 right-2 px-2 py-0.5 rounded bg-black/60 backdrop-blur-xs border border-white/10 text-[9px] text-theme-accent font-mono pointer-events-none flex items-center space-x-1">
            <Maximize2 class="w-2.5 h-2.5" />
            <span>{{ isZoomed ? '2.2x 微距放大' : '点击放大' }}</span>
          </div>
        </div>

        <!-- Bottom Interaction Guide -->
        <div class="w-full flex items-center justify-between text-[11px] text-theme-muted px-1 z-10">
          <span class="flex items-center space-x-1">
            <template v-if="isZoomed">
              <ZoomOut class="w-3 h-3 text-theme-accent" />
              <span>移动鼠标观察细部 · 点击缩小</span>
            </template>
            <template v-else>
              <ZoomIn class="w-3 h-3 text-theme-accent" />
              <span>点击相片进入 2.2x 微观检视</span>
            </template>
          </span>
          <button
            v-if="isZoomed"
            type="button"
            @click.stop="isZoomed = false"
            class="text-[10px] text-theme-accent hover:underline flex items-center space-x-0.5 cursor-pointer"
          >
            <RotateCcw class="w-2.5 h-2.5" />
            <span>还原</span>
          </button>
        </div>
      </div>

      <!-- Right: Forensic Case File & Suspect Linkage -->
      <div class="md:w-1/2 p-6 flex flex-col justify-between overflow-y-auto bg-theme-card">
        <div>
          <!-- Header Badges & Close Button -->
          <div class="flex items-center justify-between mb-3">
            <div class="flex items-center space-x-2">
              <span class="text-xs px-2.5 py-0.5 rounded-full font-bold uppercase tracking-wider border border-theme-border bg-theme-surface text-theme-accent">
                {{
                  clue.category === 'physical'
                    ? '物理实物'
                    : clue.category === 'forensic'
                    ? '痕迹化验'
                    : clue.category === 'digital'
                    ? '电子数据'
                    : '文书机密'
                }}
              </span>
              <span
                v-if="clue.isCrucial"
                class="text-xs px-2.5 py-0.5 rounded-full font-bold bg-theme-accent text-white shadow-xs flex items-center space-x-1"
              >
                <ShieldAlert class="w-3 h-3" />
                <span>核心物证</span>
              </span>
            </div>

            <button
              type="button"
              @click="emit('close')"
              class="p-1.5 rounded-lg text-theme-secondary hover:text-theme-ink hover:bg-theme-surface transition cursor-pointer"
              title="关闭物证档案"
            >
              <X class="w-5 h-5" />
            </button>
          </div>

          <!-- Clue Title & Location -->
          <h2 class="text-xl font-bold font-serif mb-1 text-theme-ink">
            {{ clue.name }}
          </h2>
          <div class="flex items-center space-x-2 text-xs font-mono mb-4 text-theme-muted">
            <span>发现于: {{ clue.locationId }}</span>
            <span v-if="room">· [{{ room.name }}]</span>
          </div>

          <!-- Forensic Detailed Description -->
          <div class="p-3.5 rounded-xl border border-theme-border bg-theme-surface mb-5 shadow-xs">
            <h4 class="text-[11px] font-mono mb-1.5 uppercase tracking-wider text-theme-accent">
              // 法医与勘验初检报告
            </h4>
            <p class="text-xs leading-relaxed text-theme-ink font-serif">
              {{ clue.shortDesc }}
            </p>
          </div>

          <!-- Forensic Key Insight / Contradiction Tip -->
          <div class="p-3.5 rounded-xl border border-theme-border bg-theme-surface mb-5 shadow-xs">
            <span class="text-[11px] font-bold text-theme-accent block mb-1">
              推演破局点 (Deductive Leverage):
            </span>
            <p class="text-xs text-theme-ink font-serif leading-relaxed">
              {{ clue.detail || '出示此物证可直接击破特定嫌疑人的不在场伪证或隐瞒动机。' }}
            </p>
          </div>
        </div>

        <!-- Bottom: Direct Linkage with Suspect Action -->
        <div class="pt-4 border-t border-theme-border">
          <div class="flex items-center justify-between mb-2">
            <span class="text-xs font-bold flex items-center space-x-1.5 text-theme-ink">
              <Link2 class="w-3.5 h-3.5 text-theme-accent" />
              <span>钉选指向涉案嫌疑人:</span>
            </span>
            <span v-if="linkedSuspectId" class="text-[10px] text-theme-accent font-mono flex items-center space-x-1">
              <CheckCircle2 class="w-3 h-3" />
              <span>已建立推演红线</span>
            </span>
          </div>

          <div class="grid grid-cols-2 gap-2">
            <button
              v-for="suspect in SUSPECTS"
              :key="suspect.id"
              type="button"
              @click="handleLink(suspect.id)"
              class="p-2 rounded-lg border text-left transition flex items-center space-x-2 cursor-pointer shadow-xs"
              :class="
                linkedSuspectId === suspect.id
                  ? 'border-theme-accent bg-theme-card-subtle ring-1 ring-theme-accent'
                  : 'border-theme-border bg-theme-surface hover:bg-theme-card-subtle'
              "
            >
              <img
                :src="suspect.avatarImage || `/assets/portraits/${suspect.id}.jpg`"
                :alt="suspect.name"
                class="w-6 h-6 rounded-full object-cover shrink-0"
              />
              <div class="overflow-hidden">
                <div class="font-bold text-xs truncate text-theme-ink">
                  {{ suspect.name }}
                </div>
                <div class="text-[10px] truncate text-theme-muted">
                  {{ suspect.title }}
                </div>
              </div>
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
