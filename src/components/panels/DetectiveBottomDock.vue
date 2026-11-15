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
  <footer class="panel-dossier-header w-full border-t backdrop-blur-md px-3 sm:px-4 py-2 flex items-center justify-between gap-3 text-xs font-serif select-none z-30 shrink-0 transition-colors duration-300">
    <!-- 1. Left: 4 Suspect Profile Seats -->
    <div class="flex items-center space-x-3 shrink-0">
      <span class="text-[10px] font-mono tracking-wider uppercase hidden sm:inline text-theme-muted">
        现场人员 · 4
      </span>
      <div class="flex items-center space-x-2 sm:space-x-3">
        <button
          v-for="suspect in SUSPECTS"
          :key="suspect.id"
          type="button"
          @click="emit('selectSuspect', suspect.id)"
          class="group flex items-center space-x-2 py-1 px-1.5 rounded-lg transition-all duration-200 cursor-pointer bg-transparent border-0 outline-none"
          :class="selectedSuspectId === suspect.id ? 'opacity-100' : 'opacity-60 hover:opacity-95'"
          :title="`${suspect.name} · ${suspect.title}`"
        >
          <!-- Circular Illustrated Avatar with Glowing Border on Selection -->
          <div class="relative shrink-0">
            <img
              :src="suspect.avatarImage || `/assets/portraits/${suspect.id}.jpg`"
              :alt="suspect.name"
              class="w-7 h-7 rounded-full object-cover object-top transition-all duration-200"
              :class="
                selectedSuspectId === suspect.id
                  ? 'ring-2 ring-theme-accent ring-offset-2 ring-offset-theme-desk shadow-sm'
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
              class="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-emerald-400 ring-1 ring-theme-desk"
              title="在此房间"
            />
          </div>

          <!-- Name, Role & Status Inline -->
          <div class="flex flex-col text-left leading-tight">
            <div class="flex items-center space-x-1.5">
              <span
                class="text-xs transition-colors duration-150"
                :class="selectedSuspectId === suspect.id ? 'font-bold text-theme-ink' : 'text-theme-secondary group-hover:text-theme-ink'"
              >
                {{ suspect.name }}
              </span>
              <span
                class="text-[9px] font-mono transition-colors"
                :class="selectedSuspectId === suspect.id ? 'text-theme-accent font-bold' : 'text-theme-muted group-hover:text-theme-ink'"
              >
                {{
                  selectedSuspectId === suspect.id
                    ? '交谈中'
                    : interrogatedSuspectIds.includes(suspect.id)
                    ? '已询问'
                    : (
                        (suspect.id === 'lin_lan' && currentSceneId === 'gallery-hall') ||
                        (suspect.id === 'zhou_heng' && currentSceneId === 'office') ||
                        (suspect.id === 'xu_ning' && currentSceneId === 'restoration-room') ||
                        (suspect.id === 'zhao_lei' && currentSceneId === 'security-room')
                      )
                    ? '在场'
                    : '观察中'
                }}
              </span>
            </div>
            <span class="text-[10px] font-serif hidden md:block truncate max-w-[90px] text-theme-muted">
              {{ suspect.title }}
            </span>
          </div>
        </button>
      </div>
    </div>

    <!-- 2. Middle: Discovered Evidence Shelf (Ultra Slim) -->
    <div class="flex items-center space-x-1.5 overflow-x-auto scrollbar-none max-w-xl mx-2">
      <span class="text-[11px] font-mono shrink-0 hidden lg:inline text-theme-muted">
        物证 ({{ discoveredClues.length }}/8):
      </span>
      <span v-if="discoveredClues.length === 0" class="text-[11px] italic text-theme-muted">
        点击现场光标勘验并提取物证...
      </span>
      <template v-else>
        <button
          v-for="clue in discoveredClues"
          :key="clue.id"
          type="button"
          @click="emit('inspectClue', clue)"
          class="flex items-center space-x-1 px-2.5 py-1 rounded border border-theme-border bg-theme-surface hover:bg-theme-card-subtle text-theme-ink hover:text-theme-accent text-[11px] transition shrink-0 cursor-pointer shadow-xs"
          :title="`${clue.name}（点击检视物证相片）`"
        >
          <span class="w-1.5 h-1.5 rounded-full shrink-0 bg-theme-accent" />
          <span class="truncate max-w-[90px] font-medium">{{ clue.name }}</span>
        </button>
      </template>
    </div>

    <!-- 3. Right: Case Board Toggle & Vote Button -->
    <div class="flex items-center space-x-2 shrink-0">
      <button
        type="button"
        @click="emit('toggleCaseBoard')"
        class="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg border text-xs transition cursor-pointer shadow-xs"
        :class="
          isCaseBoardOpen
            ? 'bg-theme-card-subtle border-theme-accent text-theme-accent'
            : 'bg-theme-surface border-theme-border text-theme-secondary hover:text-theme-ink'
        "
        title="展开案件推演板（时间线/关联网/笔录）"
      >
        <Pin class="w-3.5 h-3.5 text-theme-accent" />
        <span class="hidden sm:inline font-bold">推演案板</span>
      </button>

      <button
        type="button"
        @click="emit('startVote')"
        class="flex items-center space-x-1.5 px-3.5 py-1.5 rounded-lg bg-theme-accent hover:bg-theme-accent-hover border border-theme-accent text-white text-xs font-bold transition cursor-pointer shadow-md active:scale-95"
        title="向 AI 主持人指控真凶并复盘"
      >
        <Vote class="w-3.5 h-3.5 text-white" />
        <span>指控真凶</span>
      </button>
    </div>
  </footer>
</template>
