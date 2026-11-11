<script setup lang="ts">
import { computed } from 'vue';
import type { SuspectId, Suspect, Clue } from '../types/game';
import { SUSPECTS, CLUES } from '../data/caseData';
import { Vote, Pin } from 'lucide-vue-next';

interface DetectiveBottomDockProps {
  selectedSuspectId: SuspectId | null;
  discoveredClueIds: string[];
  isCaseBoardOpen: boolean;
  interrogatedSuspectIds?: string[];
  currentSceneId?: string;
  themeMode?: 'dark' | 'light';
}

const props = withDefaults(defineProps<DetectiveBottomDockProps>(), {
  interrogatedSuspectIds: () => [],
  themeMode: 'dark',
});

const emit = defineEmits<{
  (e: 'selectSuspect', sId: SuspectId): void;
  (e: 'openDossier', suspect: Suspect): void;
  (e: 'inspectClue', clue: Clue): void;
  (e: 'toggleCaseBoard'): void;
  (e: 'startVote'): void;
}>();

const isDark = computed(() => props.themeMode === 'dark');
const discoveredClues = computed(() => CLUES.filter((c) => props.discoveredClueIds.includes(c.id)));
</script>

<template>
  <div
    class="w-full border-t backdrop-blur-md px-3 sm:px-4 py-2 flex items-center justify-between gap-3 text-xs font-serif select-none z-30 shrink-0 transition-colors duration-300"
    :class="
      isDark
        ? 'bg-[#0C0A09]/95 border-[#3B3027] shadow-[0_-15px_30px_rgba(0,0,0,0.7)] text-[#F3EFEA]'
        : 'bg-[#FAF7F2]/95 border-[#E8DFD5] shadow-[0_-10px_25px_rgba(0,0,0,0.06)] text-[#1C1917]'
    "
  >
    <!-- 1. Left: 4 Suspect Profile Seats (Borderless, Narrative-Driven) -->
    <div class="flex items-center space-x-3 shrink-0">
      <span
        class="text-[10px] font-mono tracking-wider uppercase hidden sm:inline"
        :class="isDark ? 'text-[#73675E]' : 'text-[#8C7E72]'"
      >
        现场人员 · 4
      </span>
      <div class="flex items-center space-x-2 sm:space-x-3">
        <button
          v-for="suspect in SUSPECTS"
          :key="suspect.id"
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
                  ? isDark
                    ? 'ring-2 ring-[#C9942D] ring-offset-2 ring-offset-[#0C0A09] shadow-[0_0_10px_rgba(201,148,45,0.7)]'
                    : 'ring-2 ring-[#8B3A2B] ring-offset-2 ring-offset-[#FAF7F2] shadow-[0_0_10px_rgba(139,58,43,0.4)]'
                  : isDark
                  ? 'ring-1 ring-[#3B3027] group-hover:ring-[#6E5B4D]'
                  : 'ring-1 ring-[#E0D5C7] group-hover:ring-[#8B3A2B]/50'
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
              class="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-emerald-400 ring-1"
              :class="isDark ? 'ring-[#0C0A09]' : 'ring-[#FAF7F2]'"
              title="在此房间"
            />
          </div>

          <!-- Name, Role & Status Inline -->
          <div class="flex flex-col text-left leading-tight">
            <div class="flex items-center space-x-1.5">
              <span
                class="text-xs transition-colors duration-150"
                :class="
                  selectedSuspectId === suspect.id
                    ? isDark
                      ? 'font-bold text-[#F3EFEA]'
                      : 'font-bold text-[#1C1917]'
                    : isDark
                    ? 'text-[#AFA49A] group-hover:text-[#F3EFEA]'
                    : 'text-[#786B60] group-hover:text-[#1C1917]'
                "
              >
                {{ suspect.name }}
              </span>
              <span
                class="text-[9px] font-mono transition-colors"
                :class="
                  selectedSuspectId === suspect.id
                    ? isDark
                      ? 'text-[#C9942D] font-bold'
                      : 'text-[#8B3A2B] font-bold'
                    : isDark
                    ? 'text-[#73675E] group-hover:text-[#AFA49A]'
                    : 'text-[#8C7E72] group-hover:text-[#1C1917]'
                "
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
            <span
              class="text-[10px] font-serif hidden md:block truncate max-w-[90px]"
              :class="isDark ? 'text-[#73675E]' : 'text-[#8C7E72]'"
            >
              {{ suspect.title }}
            </span>
          </div>
        </button>
      </div>
    </div>

    <!-- 2. Middle: Discovered Evidence Shelf (Ultra Slim) -->
    <div class="flex items-center space-x-1.5 overflow-x-auto scrollbar-none max-w-xl mx-2">
      <span
        class="text-[11px] font-mono shrink-0 hidden lg:inline"
        :class="isDark ? 'text-[#AFA49A]' : 'text-[#8C7E72]'"
      >
        物证 ({{ discoveredClues.length }}/8):
      </span>
      <span
        v-if="discoveredClues.length === 0"
        class="text-[11px] italic"
        :class="isDark ? 'text-[#7A6F65]' : 'text-[#8C7E72]'"
      >
        点击现场光标勘验并提取物证...
      </span>
      <template v-else>
        <button
          v-for="clue in discoveredClues"
          :key="clue.id"
          @click="emit('inspectClue', clue)"
          class="flex items-center space-x-1 px-2.5 py-1 rounded border text-[11px] transition shrink-0 cursor-pointer shadow-xs"
          :class="
            isDark
              ? 'bg-[#181411] hover:bg-[#241B15] border-[#3B3027] hover:border-[#C9942D]/60 text-[#D8CFC5] hover:text-[#F3EFEA]'
              : 'bg-white hover:bg-[#F2ECE4] border-[#E0D5C7] hover:border-[#8B3A2B] text-[#1C1917] hover:text-[#8B3A2B]'
          "
          :title="`${clue.name}（点击检视物证相片）`"
        >
          <span class="w-1.5 h-1.5 rounded-full shrink-0" :class="isDark ? 'bg-[#C9942D]' : 'bg-[#8B3A2B]'" />
          <span class="truncate max-w-[90px] font-medium">{{ clue.name }}</span>
        </button>
      </template>
    </div>

    <!-- 3. Right: Case Board Toggle & Vote Button -->
    <div class="flex items-center space-x-2 shrink-0">
      <button
        @click="emit('toggleCaseBoard')"
        class="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg border text-xs transition cursor-pointer shadow-xs"
        :class="
          isCaseBoardOpen
            ? isDark
              ? 'bg-[#241B15] border-[#C9942D] text-[#C9942D]'
              : 'bg-[#F5E7DF] border-[#8B3A2B] text-[#8B3A2B]'
            : isDark
            ? 'bg-[#181411] border-[#3B3027] text-[#D8CFC5] hover:text-[#F3EFEA] hover:border-[#524135]'
            : 'bg-white border-[#E0D5C7] text-[#5C4F44] hover:text-[#1C1917] hover:border-[#8B3A2B]'
        "
        title="展开案件推演板（时间线/关联网/笔录）"
      >
        <Pin class="w-3.5 h-3.5" :class="isDark ? 'text-[#C9942D]' : 'text-[#8B3A2B]'" />
        <span class="hidden sm:inline font-bold">推演案板</span>
      </button>

      <button
        @click="emit('startVote')"
        class="flex items-center space-x-1.5 px-3.5 py-1.5 rounded-lg bg-[#8B3A2B] hover:bg-[#783023] border border-[#783023] text-white text-xs font-bold transition cursor-pointer shadow-md active:scale-95"
        title="向 AI 主持人指控真凶并复盘"
      >
        <Vote class="w-3.5 h-3.5" />
        <span>指控真凶</span>
      </button>
    </div>
  </div>
</template>
