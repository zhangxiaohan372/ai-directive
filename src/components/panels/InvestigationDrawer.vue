<script setup lang="ts">
import { ref, computed, watch, nextTick } from 'vue';
import type { SuspectId, Suspect, ChatMessage } from '../../types/game';
import { SUSPECTS } from '../../data/caseData';
import type { SceneId } from '../../data/sceneData';
import { Send, Sparkles, FileText, MessageSquare } from 'lucide-vue-next';

interface InvestigationDrawerProps {
  suspectId: SuspectId | null;
  chatHistory: ChatMessage[];
  discoveredClueIds: string[];
  isLoading?: boolean;
  currentSceneId?: SceneId;
}

const props = withDefaults(defineProps<InvestigationDrawerProps>(), {
  suspectId: null,
  chatHistory: () => [],
  discoveredClueIds: () => [],
  isLoading: false,
});

const emit = defineEmits<{
  (e: 'selectSuspect', sId: SuspectId): void;
  (e: 'sendMessage', question: string): void;
  (e: 'openDossier', suspect: Suspect): void;
}>();

const inputText = ref('');
const messagesEndRef = ref<HTMLDivElement | null>(null);

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
      label: '中央展厅行踪',
      text: '林馆长，案发时你在中央展厅清点藏品，有没有听到修复室方向传来重物坠地或反锁声响？',
    });
  }

  if (s.id === 'lin_lan' && props.discoveredClueIds.includes('clue_agreement')) {
    questions.push({
      label: '对质：代偿协议',
      text: '我们在办公室吧台的保险柜发现了你签署的艺术品违规抵押担保协议，这就是你急于套现的原因吗？',
    });
  } else if (s.id === 'zhou_heng' && props.discoveredClueIds.includes('clue_glass')) {
    questions.push({
      label: '对质：香槟杯残留',
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
  <div class="panel-dossier-card relative w-full h-full min-h-[480px] lg:min-h-[580px] rounded-2xl overflow-hidden border border-theme-border transition-colors duration-300 flex flex-col font-serif select-none shadow-xl bg-theme-card ring-1 ring-black/20">
    <!-- Notebook Paper Top Edge Texture -->
    <div class="h-1.5 w-full bg-linear-to-r from-theme-accent/30 via-theme-accent/60 to-theme-accent/30 opacity-70" />

    <!-- 1. Header: Notebook Header with Subject Dossier -->
    <header class="panel-dossier-header p-3 border-b flex items-center justify-between transition-colors">
      <div v-if="suspect" class="flex items-center space-x-2.5 overflow-hidden">
        <img
          :src="suspect.avatarImage || `/assets/portraits/${suspect.id}.jpg`"
          :alt="suspect.name"
          class="w-8 h-8 rounded-full object-cover object-top shrink-0 ring-1 ring-theme-accent/60 shadow-xs"
        />
        <div class="overflow-hidden">
          <div class="flex items-center space-x-1.5">
            <span class="font-bold text-xs truncate text-theme-ink">
              {{ suspect.name }}
            </span>
            <span class="text-[11px] truncate text-theme-muted">
              · {{ suspect.title }}
            </span>
          </div>
          <span class="text-[10px] font-serif block truncate text-theme-muted">
            状态: {{ getSuspectStatusText(suspect) }}
          </span>
        </div>
      </div>
      <div v-else class="flex items-center space-x-2">
        <MessageSquare class="w-3.5 h-3.5 text-theme-accent" />
        <span class="text-xs font-bold text-theme-ink">
          现场问讯笔录
        </span>
      </div>

      <button
        v-if="suspect"
        type="button"
        @click="emit('openDossier', suspect)"
        class="text-[11px] px-2.5 py-1 rounded-[10px] transition cursor-pointer flex items-center space-x-1 shrink-0 border border-theme-border text-theme-secondary hover:text-theme-ink hover:bg-theme-card-subtle shadow-xs"
        title="查看完整卷宗"
      >
        <FileText class="w-3 h-3 text-theme-accent" />
        <span>卷宗</span>
      </button>
    </header>

    <!-- 2. Middle: Transcript Dialogue Stream (Ruled Notebook Page Feel) -->
    <main class="flex-1 overflow-y-auto p-3.5 space-y-3.5 scrollbar-thin scrollbar-track-transparent scrollbar-thumb-theme-border">
      <!-- If no suspect selected: suspect directory -->
      <div v-if="!suspect" class="h-full flex flex-col justify-center text-left py-6 px-2">
        <span class="text-xs font-serif mb-2.5 tracking-wider block text-theme-muted font-bold">
          现场涉案人员录
        </span>
        <div class="space-y-2">
          <button
            v-for="s in SUSPECTS"
            :key="s.id"
            type="button"
            @click="emit('selectSuspect', s.id)"
            class="w-full flex items-center justify-between p-2.5 rounded-[10px] border border-theme-border bg-theme-surface hover:bg-theme-card-subtle transition cursor-pointer text-left group shadow-xs"
          >
            <div class="flex items-center space-x-2.5 overflow-hidden">
              <img
                :src="s.avatarImage || `/assets/portraits/${s.id}.jpg`"
                :alt="s.name"
                class="w-7 h-7 rounded-full object-cover object-top shrink-0 ring-1 ring-theme-border group-hover:ring-theme-accent/60"
              />
              <span class="text-xs font-medium truncate text-theme-ink">
                {{ s.name }}
              </span>
            </div>
            <span class="text-[10px] text-theme-muted group-hover:text-theme-ink">
              {{ s.title }}
            </span>
          </button>
        </div>
      </div>

      <!-- If suspect selected but no messages -->
      <div
        v-else-if="relevantMessages.length === 0"
        class="h-full flex flex-col items-center justify-center py-8 text-center px-3 text-theme-muted"
      >
        <span class="text-xs mb-1 text-theme-ink font-medium">
          就案发当晚行踪向【{{ suspect.name }}】展开质询
        </span>
        <span class="text-[10px] text-theme-muted">
          点击下方快捷质询，或出示现场物证破除口供矛盾
        </span>
      </div>

      <!-- Messages list -->
      <template v-else>
        <div v-for="msg in relevantMessages" :key="msg.id">
          <!-- Host narrator announcement: Rubber Stamp Motif (NO // comment prefix) -->
          <div
            v-if="msg.senderRole === 'host'"
            class="border border-theme-border bg-theme-card-subtle/80 rounded-[10px] p-2.5 text-left shadow-xs"
          >
            <div class="mb-1.5">
              <span class="rubber-stamp">
                现场旁白
              </span>
            </div>
            <p class="text-xs leading-relaxed font-serif text-theme-ink">
              {{ msg.text }}
            </p>
          </div>

          <!-- Player or Suspect message -->
          <div
            v-else
            class="flex flex-col space-y-0.5"
            :class="msg.senderRole === 'player' ? 'items-end' : 'items-start'"
          >
            <span class="text-[9px] font-serif px-1 text-theme-muted">
              {{ msg.senderRole === 'player' ? '首席侦探' : suspect.name }} · {{ msg.timestamp }}
            </span>

            <div
              class="p-2.5 rounded-[10px] max-w-[92%] text-xs leading-relaxed border"
              :class="
                msg.senderRole === 'player'
                  ? 'bg-theme-accent text-white border-theme-accent shadow-xs'
                  : 'bg-theme-surface text-theme-ink border-theme-border shadow-xs'
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
        class="flex items-center space-x-1.5 text-[11px] p-2 rounded-[10px] border border-theme-border bg-theme-card-subtle text-theme-muted w-fit"
      >
        <Sparkles class="w-3 h-3 animate-spin text-theme-accent" />
        <span>{{ suspect ? `${suspect.name} 思考中...` : '推理分析中...' }}</span>
      </div>
      <div ref="messagesEndRef" />
    </main>

    <!-- 3. Bottom: Lined Paper Input / 笔记本底边填写线 -->
    <footer
      v-if="suspect"
      class="panel-dossier-header p-3 border-t space-y-2.5 transition-colors"
    >
      <!-- Quick Questions (Pill buttons with 10px rounded) -->
      <div class="flex items-center space-x-1.5 overflow-x-auto scrollbar-none pb-0.5">
        <button
          v-for="(q, idx) in suggestedQuestions"
          :key="idx"
          type="button"
          :disabled="isLoading"
          @click="handleSend(q.text)"
          class="text-[10px] px-2.5 py-1 rounded-[10px] border border-theme-border bg-theme-surface hover:bg-theme-card-subtle text-theme-secondary hover:text-theme-accent transition shrink-0 cursor-pointer disabled:opacity-40 shadow-xs"
          :title="q.text"
        >
          {{ q.label }}
        </button>
      </div>

      <!-- Input Field: Authentic Notebook Fill-in Line (填写线，无边框方盒) -->
      <form @submit.prevent="handleSend()" class="flex items-center space-x-2 pt-1 pb-0.5">
        <div class="flex-1 relative">
          <input
            type="text"
            v-model="inputText"
            :placeholder="`向 ${suspect.name} 质询口供...`"
            :disabled="isLoading"
            class="w-full bg-transparent border-0 border-b-2 border-theme-border focus:border-theme-accent text-theme-ink placeholder-theme-muted px-1 py-1.5 text-xs transition-colors font-serif focus:outline-none focus:ring-0 rounded-none"
          />
        </div>
        <button
          type="submit"
          :disabled="!inputText.trim() || isLoading"
          class="h-8 px-3 rounded-[10px] font-bold text-xs transition-all cursor-pointer disabled:opacity-30 border border-theme-accent bg-theme-accent hover:bg-theme-accent-hover text-white shrink-0 active:scale-95 shadow-xs"
          title="记录口供"
        >
          <Send class="w-3.5 h-3.5 text-white" />
        </button>
      </form>
    </footer>
  </div>
</template>
