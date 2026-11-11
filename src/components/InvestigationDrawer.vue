<script setup lang="ts">
import { ref, computed, watch, nextTick } from 'vue';
import type { SuspectId, Suspect, ChatMessage } from '../types/game';
import { SUSPECTS } from '../data/caseData';
import type { SceneId } from '../data/sceneData';
import { Send, Sparkles, FileText, MessageSquare } from 'lucide-vue-next';

interface InvestigationDrawerProps {
  suspectId: SuspectId | null;
  chatHistory: ChatMessage[];
  discoveredClueIds: string[];
  isLoading?: boolean;
  currentSceneId?: SceneId;
  themeMode?: 'dark' | 'light';
}

const props = withDefaults(defineProps<InvestigationDrawerProps>(), {
  isLoading: false,
  themeMode: 'dark',
});

const emit = defineEmits<{
  (e: 'selectSuspect', sId: SuspectId): void;
  (e: 'sendMessage', question: string): void;
  (e: 'openDossier', suspect: Suspect): void;
}>();

const inputText = ref('');
const messagesEndRef = ref<HTMLDivElement | null>(null);

const isDark = computed(() => props.themeMode === 'dark');
const suspect = computed(() => props.suspectId ? SUSPECTS.find((s) => s.id === props.suspectId) : null);

const relevantMessages = computed(() => {
  return props.chatHistory.filter((msg) => {
    if (!suspect.value) return msg.senderRole === 'host';
    return (
      msg.suspectId === suspect.value.id ||
      (msg.senderRole === 'player' && msg.text.includes(suspect.value.name)) ||
      msg.senderRole === 'host'
    );
  });
});

const scrollToBottom = () => {
  nextTick(() => {
    messagesEndRef.value?.scrollIntoView({ behavior: 'smooth' });
  });
};

watch(
  [() => relevantMessages.value.length, () => props.isLoading],
  () => {
    scrollToBottom();
  }
);

const handleSend = (textToSend?: string) => {
  const text = textToSend || inputText.value;
  if (!text.trim() || props.isLoading) return;
  emit('sendMessage', text);
  if (!textToSend) inputText.value = '';
};

const getSuspectStatusText = (s: Suspect) => {
  switch (s.id) {
    case 'lin_lan':
      return '心神不宁 · 防备';
    case 'zhou_heng':
      return '冷峻疏离 · 回避';
    case 'xu_ning':
      return '克制温和 · 镇定';
    case 'zhao_lei':
      return '神情慌乱 · 紧张';
    default:
      return '常规警戒';
  }
};

const suggestedQuestions = computed(() => {
  if (!suspect.value) return [];
  const s = suspect.value;
  const questions: { label: string; text: string }[] = [];

  if (props.currentSceneId === 'restoration-room' && s.id === 'xu_ning') {
    questions.push({
      label: '修复台尼龙线',
      text: '许宁，我们就在修复室内。工作台上的溶剂与高强尼龙线卷平时都是你负责整理的吧？',
    });
  } else if (props.currentSceneId === 'office' && s.id === 'zhou_heng') {
    questions.push({
      label: '办公室会客情景',
      text: '周总，我们正在这间办公室内。你 22:00 和陈默在这里喝香槟时，最后一次见到他是清醒还是昏睡？',
    });
  } else if (props.currentSceneId === 'security-room' && s.id === 'zhao_lei') {
    questions.push({
      label: '监控总台雪花断档',
      text: '赵主管，我们正站在监控总台前。你声称在后院巡逻，为何 2 号走廊监控有被手动分闸断电的痕迹？',
    });
  } else if (props.currentSceneId === 'gallery-hall' && s.id === 'lin_lan') {
    questions.push({
      label: '吧台目击行踪',
      text: '林小姐，你在 22:10 坐在吧台平复情绪时，有没有看到谁走向过最深处的文物修复室？',
    });
  }

  if (s.id === 'lin_lan' && props.discoveredClueIds.includes('clue_cloth')) {
    questions.push({
      label: '出示：法国镉红布条',
      text: '我们在案发现场门后发现了沾有「镉红 302 号」颜料的布条，这正是你的特展配料，怎么解释？',
    });
  } else if (s.id === 'zhou_heng' && props.discoveredClueIds.includes('clue_glass')) {
    questions.push({
      label: '出示：香槟杯镇静剂',
      text: '我们在办公室吧台的香槟杯沿检验出佐匹克隆速效镇静剂，上面有你的食指指纹，你为何要下药？',
    });
  } else if (s.id === 'xu_ning' && props.discoveredClueIds.includes('clue_keycard')) {
    questions.push({
      label: '出示：22:12 备用卡',
      text: '修复室在 22:12 有一次刷卡记录，使用的正是你桌下暗夹里的备用卡！你当时究竟进没进去？！',
    });
  } else if (s.id === 'zhao_lei' && props.discoveredClueIds.includes('clue_log')) {
    questions.push({
      label: '质问：20分钟盲区',
      text: '走廊监控在 22:00 至 22:20 存在关键的 20 分钟录制盲区，你当时在配电箱做了什么手脚？',
    });
  }

  questions.push({
    label: '不在场口供',
    text: `请再次详细阐述你在今晚 22:00 至 22:20 之间的具体行踪与目击者。`,
  });

  return questions.slice(0, 3);
});
</script>

<template>
  <div
    class="relative w-full h-full min-h-[480px] lg:min-h-[580px] backdrop-blur-md rounded-2xl overflow-hidden border transition-colors duration-300 flex flex-col font-serif select-none ring-1"
    :class="
      isDark
        ? 'bg-[#181411]/85 border-[#3B3027] shadow-[0_25px_60px_-15px_rgba(0,0,0,0.95),0_12px_28px_-6px_rgba(0,0,0,0.8)] ring-black/40 text-[#F3EFEA]'
        : 'bg-white/95 border-[#EBE4DC] shadow-[0_20px_50px_-10px_rgba(0,0,0,0.08)] ring-stone-200/50 text-[#1C1917]'
    "
  >
    <!-- 1. Header: Sleek Transcript Dossier Header -->
    <div
      class="p-3 border-b flex items-center justify-between transition-colors"
      :class="
        isDark
          ? 'border-[#3B3027] bg-[#130F0D]/90 text-[#F3EFEA]'
          : 'border-[#E8DFD5] bg-[#FAF7F2]/95 text-[#1C1917]'
      "
    >
      <div v-if="suspect" class="flex items-center space-x-2.5 overflow-hidden">
        <img
          :src="suspect.avatarImage || `/assets/portraits/${suspect.id}.jpg`"
          :alt="suspect.name"
          class="w-8 h-8 rounded-full object-cover object-top shrink-0 ring-1 shadow-xs"
          :class="isDark ? 'ring-[#C9942D]/60' : 'ring-[#8B3A2B]/60'"
        />
        <div class="overflow-hidden">
          <div class="flex items-center space-x-1.5">
            <span class="font-bold text-xs truncate" :class="isDark ? 'text-[#F3EFEA]' : 'text-[#1C1917]'">
              {{ suspect.name }}
            </span>
            <span class="text-[11px] truncate" :class="isDark ? 'text-[#AFA49A]' : 'text-[#786B60]'">
              · {{ suspect.title }}
            </span>
          </div>
          <span class="text-[10px] font-mono block truncate" :class="isDark ? 'text-[#AFA49A]' : 'text-[#8C7E72]'">
            状态: {{ getSuspectStatusText(suspect) }}
          </span>
        </div>
      </div>
      <div v-else class="flex items-center space-x-2">
        <MessageSquare class="w-3.5 h-3.5" :class="isDark ? 'text-[#C9942D]' : 'text-[#8B3A2B]'" />
        <span class="text-xs font-bold" :class="isDark ? 'text-[#F3EFEA]' : 'text-[#1C1917]'">
          现场问讯笔录
        </span>
      </div>

      <button
        v-if="suspect"
        @click="emit('openDossier', suspect)"
        class="text-[11px] px-2 py-1 rounded transition cursor-pointer flex items-center space-x-1 shrink-0 border"
        :class="
          isDark
            ? 'text-[#AFA49A] hover:text-[#F3EFEA] hover:bg-[#251D17] border-transparent hover:border-[#3B3027]'
            : 'text-[#6E5F52] hover:text-[#1C1917] hover:bg-[#F2ECE4] border-[#E0D5C7]'
        "
        title="查看完整卷宗"
      >
        <FileText class="w-3 h-3" :class="isDark ? 'text-[#C9942D]' : 'text-[#8B3A2B]'" />
        <span>卷宗</span>
      </button>
    </div>

    <!-- 2. Middle: Transcript Dialogue Stream -->
    <div
      class="flex-1 overflow-y-auto p-3.5 space-y-3 scrollbar-thin scrollbar-track-transparent"
      :class="isDark ? 'scrollbar-thumb-[#3B3027]' : 'scrollbar-thumb-[#D8CFC5]'"
    >
      <!-- If no suspect selected: suspect directory -->
      <div v-if="!suspect" class="h-full flex flex-col justify-center text-left py-6 px-2">
        <span
          class="text-xs font-mono mb-2 uppercase tracking-wider block"
          :class="isDark ? 'text-[#AFA49A]' : 'text-[#8C7E72]'"
        >
          // 现场涉案人员目录
        </span>
        <div class="space-y-1.5">
          <button
            v-for="s in SUSPECTS"
            :key="s.id"
            @click="emit('selectSuspect', s.id)"
            class="w-full flex items-center justify-between p-2 rounded-lg border transition cursor-pointer text-left group shadow-xs"
            :class="
              isDark
                ? 'bg-[#181411]/90 hover:bg-[#251D17] border-[#3B3027] hover:border-[#C9942D]/60'
                : 'bg-[#FAF7F2] hover:bg-white border-[#E8DFD5] hover:border-[#8B3A2B]/40'
            "
          >
            <div class="flex items-center space-x-2.5 overflow-hidden">
              <img
                :src="s.avatarImage || `/assets/portraits/${s.id}.jpg`"
                :alt="s.name"
                class="w-6 h-6 rounded-full object-cover object-top shrink-0 ring-1"
                :class="isDark ? 'ring-[#3B3027] group-hover:ring-[#C9942D]/60' : 'ring-[#E0D5C7] group-hover:ring-[#8B3A2B]/60'"
              />
              <span class="text-xs font-medium truncate" :class="isDark ? 'text-[#F3EFEA]' : 'text-[#1C1917]'">
                {{ s.name }}
              </span>
            </div>
            <span
              class="text-[10px]"
              :class="isDark ? 'text-[#AFA49A] group-hover:text-[#DCD4CA]' : 'text-[#8C7E72] group-hover:text-[#1C1917]'"
            >
              {{ s.title }}
            </span>
          </button>
        </div>
      </div>

      <!-- If suspect selected but no messages -->
      <div
        v-else-if="relevantMessages.length === 0"
        class="h-full flex flex-col items-center justify-center py-8 text-center px-3"
        :class="isDark ? 'text-[#AFA49A]' : 'text-[#786B60]'"
      >
        <span class="text-xs mb-1" :class="isDark ? 'text-[#DCD4CA]' : 'text-[#1C1917]'">
          就案发当晚行踪向【{{ suspect.name }}】展开提问
        </span>
        <span class="text-[10px]" :class="isDark ? 'text-[#8E8378]' : 'text-[#8C7E72]'">
          点击下方快捷质询，或出示现场物证破除口供矛盾
        </span>
      </div>

      <!-- Messages list -->
      <template v-else>
        <div v-for="msg in relevantMessages" :key="msg.id">
          <!-- Host narrator announcement -->
          <div
            v-if="msg.senderRole === 'host'"
            class="border rounded p-2 text-left"
            :class="isDark ? 'bg-[#14100D]/85 border-[#3B3027]' : 'bg-[#F5EFE6] border-[#E0D5C7]'"
          >
            <span class="text-[9px] font-mono block mb-0.5" :class="isDark ? 'text-[#C9942D]' : 'text-[#8B3A2B]'">
              // 现场旁白观察
            </span>
            <p class="text-xs leading-relaxed font-serif" :class="isDark ? 'text-[#DCD4CA]' : 'text-[#44382F]'">
              {{ msg.text }}
            </p>
          </div>

          <!-- Player or Suspect message -->
          <div
            v-else
            class="flex flex-col space-y-0.5"
            :class="msg.senderRole === 'player' ? 'items-end' : 'items-start'"
          >
            <span class="text-[9px] font-mono px-1" :class="isDark ? 'text-[#8E8378]' : 'text-[#8C7E72]'">
              {{ msg.senderRole === 'player' ? '首席侦探' : suspect.name }} · {{ msg.timestamp }}
            </span>

            <div
              class="p-2.5 rounded-lg max-w-[92%] text-xs leading-relaxed"
              :class="
                msg.senderRole === 'player'
                  ? isDark
                    ? 'bg-[#251D17] text-[#F3EFEA] border border-[#48372A] shadow-xs'
                    : 'bg-[#8B3A2B] text-white shadow-xs'
                  : isDark
                  ? 'bg-[#181411] text-[#DCD4CA] border border-[#332820]'
                  : 'bg-[#FAF7F2] text-[#2C241E] border border-[#E8DFD5]'
              "
            >
              <p class="font-serif tracking-normal">{{ msg.text }}</p>
            </div>
          </div>
        </div>
      </template>

      <!-- Loading indicator -->
      <div
        v-if="isLoading"
        class="flex items-center space-x-1.5 text-[11px] p-2 rounded border w-fit"
        :class="isDark ? 'text-[#AFA49A] bg-[#14100D] border-[#3B3027]' : 'text-[#5C4F44] bg-[#FAF7F2] border-[#E0D5C7]'"
      >
        <Sparkles class="w-3 h-3 animate-spin" :class="isDark ? 'text-[#C9942D]' : 'text-[#8B3A2B]'" />
        <span>{{ suspect ? `${suspect.name} 思考中...` : '推理分析中...' }}</span>
      </div>
      <div ref="messagesEndRef" />
    </div>

    <!-- 3. Bottom: Questions & Input -->
    <div
      v-if="suspect"
      class="p-2.5 border-t space-y-2 transition-colors"
      :class="
        isDark
          ? 'border-[#3B3027] bg-[#130F0D]/95'
          : 'border-[#E8DFD5] bg-[#FAF7F2]/95'
      "
    >
      <!-- Quick Questions -->
      <div class="flex items-center space-x-1 overflow-x-auto scrollbar-none pb-0.5">
        <button
          v-for="(q, idx) in suggestedQuestions"
          :key="idx"
          :disabled="isLoading"
          @click="handleSend(q.text)"
          class="text-[10px] px-2 py-0.5 rounded border transition shrink-0 cursor-pointer disabled:opacity-40"
          :class="
            isDark
              ? 'bg-[#181411] hover:bg-[#251D17] text-[#AFA49A] hover:text-[#F3EFEA] border-[#3B3027] hover:border-[#C9942D]/60'
              : 'bg-white hover:bg-[#F2ECE4] text-[#5C4F44] hover:text-[#8B3A2B] border-[#E0D5C7] hover:border-[#8B3A2B]'
          "
          :title="q.text"
        >
          {{ q.label }}
        </button>
      </div>

      <!-- Input field -->
      <form @submit.prevent="handleSend()" class="flex items-center space-x-1.5">
        <input
          type="text"
          v-model="inputText"
          :placeholder="`向 ${suspect.name} 质询口供...`"
          :disabled="isLoading"
          class="flex-1 border rounded-md px-2.5 py-1.5 text-xs transition font-serif focus:outline-none"
          :class="
            isDark
              ? 'bg-[#0F0C0A] border-[#3B3027] focus:border-[#C9942D]/70 text-[#F3EFEA] placeholder-[#73675E]'
              : 'bg-white border-[#E0D5C7] focus:border-[#8B3A2B] text-[#1C1917] placeholder-[#8C7E72]'
          "
        />
        <button
          type="submit"
          :disabled="!inputText.trim() || isLoading"
          class="px-2.5 py-1.5 rounded-md font-bold text-xs transition cursor-pointer disabled:opacity-30 border shrink-0"
          :class="
            isDark
              ? 'bg-[#251D17] hover:bg-[#34271E] text-[#F3EFEA] border-[#48372A]'
              : 'bg-[#8B3A2B] hover:bg-[#783023] text-white border-[#783023]'
          "
        >
          <Send class="w-3 h-3" :class="isDark ? 'text-[#C9942D]' : 'text-white'" />
        </button>
      </form>
    </div>
  </div>
</template>
