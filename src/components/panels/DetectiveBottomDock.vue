<script setup lang="ts">
import { computed } from 'vue';
import type { SuspectId, Suspect, Clue } from '../../types/game';
import { SUSPECTS, CLUES } from '../../data/caseData';
import { Vote, Pin } from 'lucide-vue-next';

interface DetectiveBottomDockProps {
  selectedSuspectId: SuspectId | null;
  discoveredClueIds: string[];
  isCaseBoardOpen: boolean;
  interrogatedSuspectIds?: string[];
  currentSceneId?: string;
}

const props = withDefaults(defineProps<DetectiveBottomDockProps>(), {
  interrogatedSuspectIds: () => [],
});

const emit = defineEmits<{
  (e: 'selectSuspect', sId: SuspectId): void;
  (e: 'openDossier', suspect: Suspect): void;
  (e: 'inspectClue', clue: Clue): void;
  (e: 'toggleCaseBoard'): void;
  (e: 'startVote'): void;
}>();

const discoveredClues = computed(() => CLUES.filter((c) => props.discoveredClueIds.includes(c.id)));
</script>

<template>
  <footer class="panel-dossier-header w-full border-t backdrop-blur-md px-3 sm:px-4 py-1.5 flex items-center justify-between gap-3 text-xs font-serif select-none z-30 shrink-0 transition-colors duration-300">
    <!-- 1. Left: Suspect Dossier Index Tabs (档案标签栏，当前选中探出一截) -->
    <div class="flex items-center space-x-2 shrink-0">
      <span class="text-[10px] font-serif tracking-wider hidden sm:inline text-theme-muted font-bold">
        涉案档案
      </span>
      <div class="flex items-end space-x-1.5 sm:space-x-2 pt-1.5">
        <button
          v-for="suspect in SUSPECTS"
          :key="suspect.id"
          type="button"
          @click="emit('selectSuspect', suspect.id)"
          class="group flex items-center space-x-1.5 px-2 py-1.5 rounded-t-[8px] border-t border-x transition-all duration-200 cursor-pointer"
          :class="
            selectedSuspectId === suspect.id
              ? '-translate-y-2 bg-theme-surface border-theme-accent shadow-md z-10 text-theme-ink ring-1 ring-theme-accent/30'
              : 'translate-y-0 bg-theme-card-subtle/70 border-theme-border text-theme-muted hover:text-theme-ink hover:-translate-y-0.5'
          "
          :title="`${suspect.name} · ${suspect.title}`"
        >
          <!-- Portrait Avatar -->
          <div class="relative shrink-0">
            <img
              :src="suspect.avatarImage || `/assets/portraits/${suspect.id}.jpg`"
              :alt="suspect.name"
              class="w-6 h-6 rounded-full object-cover object-top transition-all duration-200"
              :class="
                selectedSuspectId === suspect.id
                  ? 'ring-1.5 ring-theme-accent shadow-xs'
                  : 'ring-1 ring-theme-border group-hover:ring-theme-accent/60'
              "
            />
            <span
              v-if="
                ((suspect.id === 'lin_lan' && currentSceneId === 'gallery-hall') ||
                 (suspect.id === 'zhou_heng' && currentSceneId === 'office') ||
                 (suspect.id === 'xu_ning' && currentSceneId === 'restoration-room') ||
                 (suspect.id === 'zhao_lei' && currentSceneId === 'security-room')) &&
                selectedSuspectId !== suspect.id
              "
              class="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-theme-accent ring-1 ring-theme-desk"
              title="在此房间"
            />
          </div>

          <!-- Name & Tab Status -->
          <div class="flex flex-col text-left leading-tight">
            <div class="flex items-center space-x-1">
              <span
                class="text-xs transition-colors"
                :class="selectedSuspectId === suspect.id ? 'font-bold text-theme-ink' : 'text-theme-secondary group-hover:text-theme-ink'"
              >
                {{ suspect.name }}
              </span>
              <span
                class="text-[9px] font-serif transition-colors"
                :class="selectedSuspectId === suspect.id ? 'text-theme-accent font-bold' : 'text-theme-muted'"
              >
                {{
                  selectedSuspectId === suspect.id
                    ? '交谈中'
                    : interrogatedSuspectIds.includes(suspect.id)
                    ? '已质询'
                    : (
                        (suspect.id === 'lin_lan' && currentSceneId === 'gallery-hall') ||
                        (suspect.id === 'zhou_heng' && currentSceneId === 'office') ||
                        (suspect.id === 'xu_ning' && currentSceneId === 'restoration-room') ||
                        (suspect.id === 'zhao_lei' && currentSceneId === 'security-room')
                      )
                    ? '在场'
                    : '待查'
                }}
              </span>
            </div>
          </div>
        </button>
      </div>
    </div>

    <!-- 2. Middle: Discovered Evidence Shelf (Serif typography, NO monospace) -->
    <div class="flex items-center space-x-1.5 overflow-x-auto scrollbar-none max-w-xl mx-2">
      <span class="text-[11px] font-serif shrink-0 hidden lg:inline text-theme-muted">
        已提取物证 ({{ discoveredClues.length }}/8):
      </span>
      <span v-if="discoveredClues.length === 0" class="text-[11px] italic text-theme-muted font-serif">
        勘验现场光标提取关键物证...
      </span>
      <template v-else>
        <button
          v-for="clue in discoveredClues"
          :key="clue.id"
          type="button"
          @click="emit('inspectClue', clue)"
          class="flex items-center space-x-1 px-2.5 py-1 rounded-[10px] border border-theme-border bg-theme-surface hover:bg-theme-card-subtle text-theme-ink hover:text-theme-accent text-[11px] font-serif transition shrink-0 cursor-pointer shadow-xs"
          :title="`${clue.name}（点击检视物证相片）`"
        >
          <span class="w-1.5 h-1.5 rounded-full shrink-0 bg-theme-accent" />
          <span class="truncate max-w-[90px] font-medium">{{ clue.name }}</span>
        </button>
      </template>
    </div>

    <!-- 3. Right: Case Board Toggle (Outline) & Accuse Button (Sole Tactile Primary Button) -->
    <div class="flex items-center space-x-2 shrink-0">
      <!-- Outline Secondary Button -->
      <button
        type="button"
        @click="emit('toggleCaseBoard')"
        class="flex items-center space-x-1.5 px-3 h-10 rounded-[10px] border text-xs font-serif transition cursor-pointer shadow-xs active:translate-y-[1px]"
        :class="
          isCaseBoardOpen
            ? 'bg-theme-card-subtle border-theme-accent text-theme-accent font-bold'
            : 'bg-theme-surface border-theme-border text-theme-secondary hover:text-theme-ink'
        "
        title="展开案件推演板（时间线/关联网/笔录）"
      >
        <Pin class="w-3.5 h-3.5 text-theme-accent" />
        <span class="hidden sm:inline font-medium">推演案板</span>
      </button>

      <!-- Sole Tactile Solid Primary Button with 3px Physical Press Depth -->
      <button
        type="button"
        @click="emit('startVote')"
        class="flex items-center space-x-1.5 px-4 h-10 rounded-[10px] bg-theme-accent hover:bg-theme-accent-hover text-white text-xs font-serif font-bold tracking-wider shadow-[0_3px_0_var(--color-accent-hover)] active:translate-y-[3px] active:shadow-none transition-all cursor-pointer"
        title="向 AI 主持人指控真凶并复盘"
      >
        <Vote class="w-3.5 h-3.5 text-white" />
        <span>指控真凶</span>
      </button>
    </div>
  </footer>
</template>
