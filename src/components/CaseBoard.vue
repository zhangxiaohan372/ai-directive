<script setup lang="ts">
import { ref, computed } from 'vue';
import type { Clue, ClueLink, SuspectId } from '../types/game';
import { CLUES, TIMELINE, SUSPECTS } from '../data/caseData';
import {
  FileText,
  Clock,
  Network,
  Edit3,
  Search,
  ExternalLink,
  CheckCircle2,
  Trash2,
  Plus,
} from 'lucide-vue-next';

interface CaseBoardProps {
  discoveredClueIds: string[];
  clueLinks: ClueLink[];
  playerNotes: string;
}

const props = defineProps<CaseBoardProps>();

const emit = defineEmits<{
  (e: 'inspectClue', clue: Clue): void;
  (e: 'removeClueLink', clueId: string, targetId: string): void;
  (e: 'addClueLink', clueId: string, targetId: string, note?: string): void;
  (e: 'saveNotes', notes: string): void;
}>();

const activeTab = ref<'clues' | 'timeline' | 'links' | 'notes'>('clues');
const selectedClueForLink = ref<string>('');
const selectedTargetSuspect = ref<SuspectId>('xu_ning');
const linkNote = ref<string>('');

const discoveredClues = computed(() => CLUES.filter((c) => props.discoveredClueIds.includes(c.id)));

const handleCreateLink = () => {
  if (!selectedClueForLink.value) return;
  emit('addClueLink', selectedClueForLink.value, selectedTargetSuspect.value, linkNote.value);
  linkNote.value = '';
};
</script>

<template>
  <div class="bg-white rounded-2xl border border-slate-200/90 shadow-sm flex flex-col h-full min-h-[520px] overflow-hidden font-serif">
    <!-- Tab Navigation -->
    <div class="flex items-center justify-between px-3 pt-3 pb-2 border-b border-slate-100 bg-slate-50/60">
      <div class="flex items-center space-x-1">
        <button
          @click="activeTab = 'clues'"
          class="flex items-center space-x-1 text-xs px-3 py-1.5 rounded-xl font-bold transition cursor-pointer"
          :class="
            activeTab === 'clues'
              ? 'bg-white text-slate-800 shadow-xs border border-slate-200'
              : 'text-slate-500 hover:text-slate-800'
          "
        >
          <FileText class="w-3.5 h-3.5 text-coral-500" />
          <span>物证 ({{ discoveredClues.length }}/8)</span>
        </button>

        <button
          @click="activeTab = 'timeline'"
          class="flex items-center space-x-1 text-xs px-3 py-1.5 rounded-xl font-bold transition cursor-pointer"
          :class="
            activeTab === 'timeline'
              ? 'bg-white text-slate-800 shadow-xs border border-slate-200'
              : 'text-slate-500 hover:text-slate-800'
          "
        >
          <Clock class="w-3.5 h-3.5 text-sky-500" />
          <span>时间线</span>
        </button>

        <button
          @click="activeTab = 'links'"
          class="flex items-center space-x-1 text-xs px-3 py-1.5 rounded-xl font-bold transition cursor-pointer"
          :class="
            activeTab === 'links'
              ? 'bg-white text-slate-800 shadow-xs border border-slate-200'
              : 'text-slate-500 hover:text-slate-800'
          "
        >
          <Network class="w-3.5 h-3.5 text-purple-500" />
          <span>关联网 ({{ clueLinks.length }})</span>
        </button>

        <button
          @click="activeTab = 'notes'"
          class="flex items-center space-x-1 text-xs px-3 py-1.5 rounded-xl font-bold transition cursor-pointer"
          :class="
            activeTab === 'notes'
              ? 'bg-white text-slate-800 shadow-xs border border-slate-200'
              : 'text-slate-500 hover:text-slate-800'
          "
        >
          <Edit3 class="w-3.5 h-3.5 text-emerald-500" />
          <span>备忘录</span>
        </button>
      </div>
    </div>

    <!-- Content Area -->
    <div class="flex-1 p-4 overflow-y-auto bg-slate-50/20">
      <!-- Tab 1: Clues List -->
      <div v-if="activeTab === 'clues'" class="space-y-2.5">
        <div v-if="discoveredClues.length === 0" class="h-64 flex flex-col items-center justify-center text-center text-slate-400">
          <Search class="w-8 h-8 mb-2 text-slate-300" />
          <p className="text-xs font-semibold text-slate-600">暂未发现任何现场物证</p>
          <p className="text-[11px] text-slate-400 mt-1">
            前往现场或地点导览图，点击房间进行深度勘验搜查！
          </p>
        </div>
        <div
          v-else
          v-for="clue in discoveredClues"
          :key="clue.id"
          @click="emit('inspectClue', clue)"
          class="group bg-white p-3.5 rounded-xl border border-slate-200/80 hover:border-coral-400 hover:shadow-xs transition cursor-pointer flex items-start justify-between"
        >
          <div class="flex-1">
            <div class="flex items-center space-x-2">
              <span class="text-xs font-bold text-slate-800 group-hover:text-coral-600 transition">
                {{ clue.name }}
              </span>
              <span v-if="clue.isCrucial" class="text-[9px] px-1.5 py-0.2 rounded-full font-bold bg-amber-100 text-amber-800 font-mono">
                关键铁证
              </span>
            </div>
            <p class="text-xs text-slate-500 mt-1 line-clamp-2">{{ clue.shortDesc }}</p>
            <div class="mt-2 flex items-center space-x-2">
              <span class="text-[10px] text-slate-400">
                类别: {{ clue.category }}
              </span>
              <span class="text-[10px] text-coral-600 font-medium flex items-center space-x-0.5">
                <span>点击检视物证相片</span>
                <ExternalLink class="w-2.5 h-2.5" />
              </span>
            </div>
          </div>
        </div>
      </div>

      <!-- Tab 2: Timeline -->
      <div v-if="activeTab === 'timeline'" class="relative pl-6 space-y-4 before:content-[''] before:absolute before:left-2 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200">
        <div
          v-for="(item, idx) in TIMELINE"
          :key="idx"
          class="relative group"
        >
          <!-- Timeline dot -->
          <div
            class="absolute -left-[22px] top-1.5 w-3 h-3 rounded-full border-2 border-white shadow-xs"
            :class="
              item.time === '22:15' || item.time === '22:12'
                ? 'bg-coral-500 ring-2 ring-coral-200'
                : 'bg-slate-400'
            "
          />

          <div
            class="p-3 rounded-xl border transition"
            :class="
              item.time === '22:15' || item.time === '22:12'
                ? 'bg-coral-50/40 border-coral-200'
                : 'bg-white border-slate-200/80'
            "
          >
            <div class="flex items-center justify-between">
              <span
                class="text-xs font-extrabold"
                :class="item.time === '22:15' || item.time === '22:12' ? 'text-coral-600' : 'text-slate-800'"
              >
                {{ item.time }} · {{ item.title }}
              </span>
              <CheckCircle2 v-if="item.verified" class="w-3.5 h-3.5 text-emerald-500 shrink-0" />
            </div>
            <p class="text-xs text-slate-600 mt-1 leading-relaxed">{{ item.desc }}</p>
          </div>
        </div>
      </div>

      <!-- Tab 3: Relationship Graph / Clue Links -->
      <div v-if="activeTab === 'links'" class="space-y-4">
        <!-- Create new link widget -->
        <div class="p-3.5 bg-white rounded-xl border border-slate-200 shadow-xs">
          <span class="text-xs font-bold text-slate-700 block mb-2 flex items-center space-x-1">
            <Plus class="w-3.5 h-3.5 text-purple-600" />
            <span>建立推论关联（物证 -&gt; 嫌疑人）：</span>
          </span>
          <div class="grid grid-cols-2 gap-2 mb-2">
            <select
              v-model="selectedClueForLink"
              class="text-xs p-2 rounded-lg border border-slate-200 focus:outline-none focus:ring-1 focus:ring-purple-400"
            >
              <option value="">-- 选择已获物证 --</option>
              <option v-for="c in discoveredClues" :key="c.id" :value="c.id">
                {{ c.name }}
              </option>
            </select>

            <select
              v-model="selectedTargetSuspect"
              class="text-xs p-2 rounded-lg border border-slate-200 focus:outline-none focus:ring-1 focus:ring-purple-400"
            >
              <option v-for="s in SUSPECTS" :key="s.id" :value="s.id">
                {{ s.name }} ({{ s.title.slice(0, 4) }})
              </option>
            </select>
          </div>

          <input
            type="text"
            v-model="linkNote"
            placeholder="推论批注（例：22:12备用卡开门排除周衡，直指许宁）"
            class="w-full text-xs p-2 rounded-lg border border-slate-200 mb-2 focus:outline-none focus:ring-1 focus:ring-purple-400"
          />

          <button
            @click="handleCreateLink"
            :disabled="!selectedClueForLink"
            class="w-full py-1.5 rounded-lg bg-purple-600 text-white text-xs font-semibold hover:bg-purple-700 disabled:opacity-40 transition cursor-pointer"
          >
            绑定至推论关系网
          </button>
        </div>

        <!-- List of active links -->
        <div class="space-y-2">
          <p v-if="clueLinks.length === 0" class="text-xs text-center text-slate-400 py-6">
            暂无物证与嫌疑人的关联推论。出示证物或点击上方快速关联。
          </p>
          <div
            v-else
            v-for="(link, idx) in clueLinks"
            :key="idx"
            class="p-3 bg-white rounded-xl border border-slate-200 flex items-start justify-between"
          >
            <div>
              <div class="flex items-center space-x-1.5 text-xs">
                <span class="font-bold text-slate-800">
                  {{ CLUES.find((c) => c.id === link.clueId)?.name || link.clueId }}
                </span>
                <span class="text-slate-400">-&gt;</span>
                <span
                  class="font-bold px-1.5 py-0.2 rounded-md text-white text-[11px]"
                  :style="{ backgroundColor: SUSPECTS.find((s) => s.id === link.targetId)?.avatarColor || '#64748b' }"
                >
                  {{ SUSPECTS.find((s) => s.id === link.targetId)?.name || link.targetId }}
                </span>
              </div>
              <p v-if="link.note" class="text-xs text-slate-600 mt-1.5 italic bg-slate-50 p-1.5 rounded-lg">
                “{{ link.note }}”
              </p>
            </div>
            <button
              @click="emit('removeClueLink', link.clueId, link.targetId)"
              class="text-slate-400 hover:text-red-500 p-1 transition cursor-pointer"
            >
              <Trash2 class="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      <!-- Tab 4: Detective Notes -->
      <div v-if="activeTab === 'notes'" class="h-full flex flex-col">
        <textarea
          :value="playerNotes"
          @input="emit('saveNotes', ($event.target as HTMLTextAreaElement).value)"
          placeholder="在此记录你的破案推演笔记、各人不在场证明疑点与密室手法猜想……（实时自动保存）"
          class="flex-1 w-full text-xs p-3.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-200 resize-none font-mono leading-relaxed bg-white text-slate-800"
        />
        <div class="mt-2 text-[10px] text-slate-400 text-right">
          已启用客户端实时自动暂存
        </div>
      </div>
    </div>
  </div>
</template>
