<script setup lang="ts">
import { ref, computed } from 'vue';
import type { Clue, ClueLink, SuspectId } from '../../types/game';
import { CLUES, TIMELINE, SUSPECTS } from '../../data/caseData';
import {
  X,
  ExternalLink,
  Trash2,
  Pin,
  FileText,
  Clock,
  Network,
  FolderArchive,
  Lock,
  Sun,
  Moon,
} from 'lucide-vue-next';

interface CaseBoardDrawerProps {
  isOpen: boolean;
  discoveredClueIds: string[];
  clueLinks: ClueLink[];
  playerNotes: string;
  themeMode?: 'dark' | 'light';
}

const props = withDefaults(defineProps<CaseBoardDrawerProps>(), {
  themeMode: 'dark',
});

const emit = defineEmits<{
  (e: 'toggle'): void;
  (e: 'inspectClue', clue: Clue): void;
  (e: 'removeClueLink', clueId: string, targetId: string): void;
  (e: 'addClueLink', clueId: string, targetId: string, note?: string): void;
  (e: 'saveNotes', notes: string): void;
  (e: 'toggleTheme'): void;
}>();

const boardView = ref<'board' | 'timeline' | 'links' | 'notes'>('board');
const selectedClueForLink = ref<string>('');
const selectedTargetSuspect = ref<SuspectId>('xu_ning');
const linkNote = ref<string>('');
const showUndiscoveredDrawer = ref(false);

const isDark = computed(() => props.themeMode === 'dark');
const discoveredClues = computed(() => CLUES.filter((c) => props.discoveredClueIds.includes(c.id)));
const undiscoveredClues = computed(() => CLUES.filter((c) => !props.discoveredClueIds.includes(c.id)));

const cardRotations = ['-rotate-1', 'rotate-2', '-rotate-2', 'rotate-1', 'rotate-3', '-rotate-1'];

const handleCreateLink = () => {
  if (!selectedClueForLink.value) return;
  emit('addClueLink', selectedClueForLink.value, selectedTargetSuspect.value, linkNote.value);
  linkNote.value = '';
};
</script>

<template>
  <div
    v-if="isOpen"
    class="fixed inset-0 z-50 backdrop-blur-md flex items-center justify-center p-2 sm:p-5 select-none animate-fadeIn font-serif bg-[var(--bg-desk)]/85"
  >
    <!-- Dossier Open Folder on Desk -->
    <div class="panel-dossier-card relative w-full max-w-6xl h-[92vh] max-h-[840px] rounded-2xl border-4 border-theme-border flex flex-col overflow-hidden transition-all duration-300 shadow-2xl bg-theme-card">
      <!-- Metal Corner Brackets -->
      <div class="absolute top-0 left-0 w-8 h-8 border-t-2 border-l-2 pointer-events-none z-30 border-theme-accent/60" />
      <div class="absolute top-0 right-0 w-8 h-8 border-t-2 border-r-2 pointer-events-none z-30 border-theme-accent/60" />
      <div class="absolute bottom-0 left-0 w-8 h-8 border-b-2 border-l-2 pointer-events-none z-30 border-theme-accent/60" />
      <div class="absolute bottom-0 right-0 w-8 h-8 border-b-2 border-r-2 pointer-events-none z-30 border-theme-accent/60" />

      <!-- 1. Header: Dossier Index Tabs (档案夹索引标签) -->
      <header class="panel-dossier-header px-4 pt-2.5 pb-0 flex items-end justify-between border-b z-20 transition-colors duration-300">
        <div class="flex items-center space-x-3 pb-2">
          <span class="font-bold text-sm tracking-wider font-serif text-theme-ink">
            案件卷宗 · 午夜庄园
          </span>
          <span class="text-xs px-2 py-0.5 rounded-[6px] border border-theme-border bg-theme-surface text-theme-accent font-serif">
            已钉物证 {{ discoveredClues.length }}/8
          </span>
        </div>

        <!-- Board Pinned Sub-Tabs as Folder Index Tabs (档案夹索引标签) -->
        <div class="flex items-end space-x-1.5 text-xs">
          <button
            v-for="tab in [
              { key: 'board', label: '实体案板', icon: Pin },
              { key: 'timeline', label: '案发时刻', icon: Clock },
              { key: 'links', label: `红线推演网 (${clueLinks.length})`, icon: Network },
              { key: 'notes', label: '侦探手记', icon: FileText },
            ]"
            :key="tab.key"
            type="button"
            @click="boardView = tab.key as any"
            class="flex items-center gap-1.5 px-3.5 py-2 rounded-t-[10px] border-t-2 border-x-2 transition cursor-pointer font-serif font-bold text-xs"
            :class="
              boardView === tab.key
                ? 'bg-theme-desk border-theme-accent text-theme-accent -mb-[1px] shadow-xs'
                : 'bg-theme-card-subtle/80 border-theme-border text-theme-muted hover:text-theme-ink hover:bg-theme-surface'
            "
          >
            <component :is="tab.icon" class="w-3.5 h-3.5" />
            <span>{{ tab.label }}</span>
          </button>
        </div>

        <!-- Right Controls: Light / Dark Toggle + Close Button -->
        <div class="flex items-center space-x-2 pb-2">
          <div class="flex items-center p-0.5 rounded-full border border-theme-border bg-theme-surface text-theme-muted">
            <button
              type="button"
              @click="emit('toggleTheme')"
              class="flex items-center space-x-1 px-2.5 py-0.5 rounded-full font-serif text-[11px] transition cursor-pointer"
              :class="!isDark ? 'bg-theme-accent text-white font-bold shadow-xs' : 'hover:text-theme-ink'"
              title="切换至白昼明亮模式"
            >
              <Sun class="w-3 h-3" />
              <span>白昼</span>
            </button>
            <button
              type="button"
              @click="emit('toggleTheme')"
              class="flex items-center space-x-1 px-2.5 py-0.5 rounded-full font-serif text-[11px] transition cursor-pointer"
              :class="isDark ? 'bg-theme-accent text-white font-bold shadow-xs' : 'hover:text-theme-ink'"
              title="切换至暗夜破案模式"
            >
              <Moon class="w-3 h-3" />
              <span>暗夜</span>
            </button>
          </div>

          <button
            type="button"
            @click="emit('toggle')"
            class="p-1 rounded-[8px] text-theme-secondary hover:text-theme-ink hover:bg-theme-surface transition cursor-pointer"
            title="关闭卷宗"
          >
            <X class="w-5 h-5" />
          </button>
        </div>
      </header>

      <!-- 2. Detective Corkboard Canvas -->
      <main
        class="relative flex-1 overflow-y-auto p-6 md:p-8 select-text transition-all duration-300"
        :class="boardView === 'board' ? 'corkboard-surface' : 'bg-theme-desk'"
      >
        <!-- Wooden Frame Bevel Inset Shadow for Corkboard -->
        <div v-if="boardView === 'board'" class="absolute inset-0 pointer-events-none shadow-[inset_0_0_80px_rgba(0,0,0,0.55)] border-4 border-theme-border/50" />

        <!-- VIEW 1: SCATTERED PHYSICAL EVIDENCE CORKBOARD -->
        <div v-if="boardView === 'board'" class="relative min-h-[560px]">
          <!-- Connected Red String Layer -->
          <svg v-if="discoveredClues.length > 0" class="absolute inset-0 w-full h-full pointer-events-none z-10 opacity-80">
            <line x1="220" y1="140" x2="500" y2="180" stroke="currentColor" class="stroke-theme-accent" stroke-width="2.5" stroke-dasharray="6 3" />
            <line v-if="discoveredClues.length > 1" x1="500" y1="180" x2="460" y2="360" stroke="currentColor" class="stroke-theme-accent" stroke-width="2" />
          </svg>

          <!-- Empty State: Pinned Blank Paper Memo (No Folder Icon, No Black Card) -->
          <div
            v-if="discoveredClues.length === 0"
            class="flex flex-col items-center justify-center h-80 text-center z-20 relative max-w-sm mx-auto"
          >
            <div class="relative px-8 py-6 rounded-[4px] bg-theme-card/90 border border-theme-border shadow-lg rotate-1">
              <!-- Brass Pushpin -->
              <div class="absolute -top-3 left-1/2 -translate-x-1/2 w-4 h-4 rounded-full bg-linear-to-tr from-theme-accent-700 via-theme-accent-400 to-theme-accent-200 border border-theme-accent/60 shadow-md flex items-center justify-center">
                <div class="w-1 h-1 rounded-full bg-theme-accent/60" />
              </div>
              <p class="text-sm font-serif text-theme-secondary tracking-widest pt-1">
                还没有钉上的物证
              </p>
            </div>
          </div>

          <!-- Scattered Clue Cards Grid: Pinned Paper Memo Cards -->
          <div v-else class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 z-20 relative">
            <div
              v-for="(clue, idx) in discoveredClues"
              :key="clue.id"
              :class="[
                'group relative p-3 rounded-[6px] border transition-all duration-300 hover:scale-105 hover:z-30 cursor-pointer bg-theme-card text-theme-ink border-theme-border shadow-lg',
                cardRotations[idx % cardRotations.length]
              ]"
              @click="emit('inspectClue', clue)"
            >
              <!-- Brass Pushpin Pin Head -->
              <div class="absolute -top-2.5 left-1/2 -translate-x-1/2 w-4 h-4 rounded-full bg-linear-to-tr from-theme-accent-700 via-theme-accent-400 to-theme-accent-200 border border-theme-accent/60 shadow-md z-30 flex items-center justify-center">
                <div class="w-1 h-1 rounded-full bg-theme-accent/60" />
              </div>

              <!-- Clue Photo Frame -->
              <div class="w-full h-32 mb-2.5 rounded-[4px] overflow-hidden bg-black/40 border border-theme-border relative">
                <img
                  v-if="clue.imageUrl"
                  :src="clue.imageUrl"
                  :alt="clue.name"
                  class="w-full h-full object-cover object-center filter contrast-105 brightness-95 group-hover:scale-105 transition-transform duration-300"
                />
                <div v-else class="w-full h-full flex items-center justify-center text-xs text-theme-muted font-serif">
                  现场封存照片
                </div>
              </div>

              <!-- Title & Category -->
              <div class="flex items-center justify-between mb-1">
                <span class="font-bold text-xs truncate text-theme-ink">
                  {{ clue.name }}
                </span>
                <span class="text-[9px] px-1.5 py-0.5 rounded-[4px] font-serif border border-theme-border text-theme-accent bg-theme-surface">
                  {{ clue.category }}
                </span>
              </div>

              <!-- Description -->
              <p class="text-[11px] leading-relaxed line-clamp-2 text-theme-muted mb-2 font-serif">
                {{ clue.shortDesc }}
              </p>

              <!-- Footer tags -->
              <div class="pt-2 border-t border-theme-border flex items-center justify-between text-[10px] text-theme-muted font-serif">
                <span>位置: {{ clue.locationId }}</span>
                <span class="group-hover:text-theme-accent flex items-center gap-0.5">
                  检视 <ExternalLink class="w-2.5 h-2.5" />
                </span>
              </div>
            </div>
          </div>
        </div>

        <!-- VIEW 2: TIMELINE VIEW -->
        <div v-else-if="boardView === 'timeline'" class="max-w-3xl mx-auto space-y-4 py-4">
          <div
            v-for="(item, idx) in TIMELINE"
            :key="idx"
            class="flex items-start space-x-4 p-4 rounded-[10px] border border-theme-border bg-theme-surface shadow-xs transition-colors"
          >
            <div class="px-2.5 py-1 rounded-[6px] bg-theme-card-subtle text-theme-accent font-serif text-xs font-bold shrink-0 border border-theme-border">
              {{ item.time }}
            </div>
            <div class="flex-1">
              <div class="flex items-center space-x-2 mb-1">
                <span class="font-bold text-sm text-theme-ink">
                  {{ item.title }}
                </span>
                <span class="text-xs text-theme-muted">
                  · {{ item.verified ? '已核实' : '待求证' }}
                </span>
              </div>
              <p class="text-xs text-theme-muted leading-relaxed">
                {{ item.desc }}
              </p>
            </div>
          </div>
        </div>

        <!-- VIEW 3: RED STRING DEDUCTION NETWORK -->
        <div v-else-if="boardView === 'links'" class="max-w-3xl mx-auto space-y-5 py-4">
          <!-- Create Link Form -->
          <div class="p-4 rounded-[10px] border border-theme-border bg-theme-surface shadow-sm space-y-3">
            <h5 class="text-xs font-bold text-theme-ink tracking-wide">
              建立证物与嫌疑人指向红线
            </h5>
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div>
                <label class="block text-theme-muted text-[11px] mb-1">选择已发现物证</label>
                <select
                  v-model="selectedClueForLink"
                  class="w-full p-2 rounded-[8px] border border-theme-border bg-theme-card-subtle text-theme-ink focus:outline-none"
                >
                  <option value="" disabled>-- 请选择证物 --</option>
                  <option v-for="c in discoveredClues" :key="c.id" :value="c.id">
                    {{ c.name }}
                  </option>
                </select>
              </div>
              <div>
                <label class="block text-theme-muted text-[11px] mb-1">指向嫌疑人</label>
                <select
                  v-model="selectedTargetSuspect"
                  class="w-full p-2 rounded-[8px] border border-theme-border bg-theme-card-subtle text-theme-ink focus:outline-none"
                >
                  <option v-for="s in SUSPECTS" :key="s.id" :value="s.id">
                    {{ s.name }} ({{ s.title }})
                  </option>
                </select>
              </div>
            </div>
            <div>
              <label class="block text-theme-muted text-[11px] mb-1">推论批注 (可选)</label>
              <input
                v-model="linkNote"
                type="text"
                placeholder="例如：杯沿指纹印证其下药动机..."
                class="w-full p-2 rounded-[8px] border border-theme-border bg-theme-card-subtle text-theme-ink text-xs focus:outline-none"
              />
            </div>
            <button
              type="button"
              @click="handleCreateLink"
              :disabled="!selectedClueForLink"
              class="px-4 py-2 rounded-[10px] font-bold text-xs bg-theme-accent hover:bg-theme-accent-hover text-white transition cursor-pointer disabled:opacity-40 shadow-[0_2px_0_var(--color-accent-hover)] active:translate-y-[2px] active:shadow-none"
            >
              固定红线连结
            </button>
          </div>

          <!-- Existing Links List -->
          <div class="space-y-2">
            <div
              v-for="link in clueLinks"
              :key="`${link.clueId}-${link.targetId}`"
              class="flex items-center justify-between p-3 rounded-[8px] border border-theme-border bg-theme-surface text-xs shadow-xs"
            >
              <div class="flex items-center space-x-2 truncate">
                <span class="font-bold text-theme-ink">
                  {{ CLUES.find((c) => c.id === link.clueId)?.name || link.clueId }}
                </span>
                <span class="text-theme-accent font-bold">───▶</span>
                <span class="font-bold text-theme-accent">
                  {{ SUSPECTS.find((s) => s.id === link.targetId)?.name || link.targetId }}
                </span>
                <span v-if="link.note" class="text-theme-muted text-[11px] ml-2 truncate">
                  ({{ link.note }})
                </span>
              </div>
              <button
                type="button"
                @click="emit('removeClueLink', link.clueId, link.targetId)"
                class="text-theme-muted hover:text-theme-accent p-1 transition cursor-pointer"
                title="剪断红线"
              >
                <Trash2 class="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        <!-- VIEW 4: DETECTIVE NOTES -->
        <div v-else-if="boardView === 'notes'" class="max-w-3xl mx-auto py-4">
          <div class="p-4 rounded-[10px] border border-theme-border bg-theme-surface shadow-sm space-y-3">
            <h5 class="text-xs font-bold text-theme-ink tracking-wide">
              案情备忘手记 (自动本地保存)
            </h5>
            <textarea
              :value="playerNotes"
              @input="emit('saveNotes', ($event.target as HTMLTextAreaElement).value)"
              rows="12"
              placeholder="在此记录推演逻辑、怀疑对象、不在场证明疑点..."
              class="w-full p-3 rounded-[8px] border border-theme-border bg-theme-card-subtle text-theme-ink font-serif text-xs leading-relaxed focus:outline-none resize-none"
            />
          </div>
        </div>
      </main>
    </div>
  </div>
</template>
