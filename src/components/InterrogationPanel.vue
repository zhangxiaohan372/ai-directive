<script setup lang="ts">
import { ref, computed, watch, nextTick } from 'vue';
import type { SuspectEmotion, SuspectId, ChatMessage } from '../types/game';
import { SUSPECTS } from '../data/caseData';
import { Send, MessageSquare } from 'lucide-vue-next';

interface InterrogationPanelProps {
  suspectId: SuspectId;
  chatHistory: ChatMessage[];
  discoveredClueIds: string[];
  isLoading?: boolean;
  currentEmotion?: SuspectEmotion;
}

const props = withDefaults(defineProps<InterrogationPanelProps>(), {
  isLoading: false,
});

const emit = defineEmits<{
  (e: 'sendMessage', question: string): void;
}>();

const inputText = ref('');
const messagesEndRef = ref<HTMLDivElement | null>(null);

const suspect = computed(() => SUSPECTS.find((s) => s.id === props.suspectId) || SUSPECTS[0]);

const relevantMessages = computed(() => {
  return props.chatHistory.filter(
    (msg) =>
      msg.suspectId === props.suspectId ||
      (msg.senderRole === 'player' && msg.text.includes(suspect.value.name)) ||
      msg.senderRole === 'host'
  );
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

const quickQuestions = computed(() => {
  const questions: { label: string; text: string }[] = [];

  questions.push({
    label: '盘问案发时不在场证明',
    text: `请再次详细阐述你在今晚 22:00 至 22:20 之间的具体行踪与目击者。`,
  });

  if (props.suspectId === 'lin_lan') {
    questions.push({
      label: '理论争执隐情',
      text: '听说你在 22:05 和死者陈默在办公室发生了激烈的争执，究竟是因为什么？',
    });
    if (props.discoveredClueIds.includes('clue_cloth')) {
      questions.push({
        label: '出示：镉红松节油布条',
        text: '我们在案发现场门后发现了沾有法国高级「镉红 302 号」颜料的布条，这正是你的独家颜料，你怎么解释？',
      });
    }
    if (props.discoveredClueIds.includes('clue_journal')) {
      questions.push({
        label: '出示：策展人手记（代笔丑闻）',
        text: '陈默的手记里写明了你这一年来的获奖油画均由助理许宁代笔，你今晚是否因此痛下杀手？',
      });
    }
  } else if (props.suspectId === 'zhou_heng') {
    questions.push({
      label: '质问 500 万投资账目',
      text: '你今晚特意留到闭馆，是否与画廊近期的 500 万资金亏空和假画洗钱纠纷有关？',
    });
    if (props.discoveredClueIds.includes('clue_glass')) {
      questions.push({
        label: '出示：带指纹的香槟高脚杯',
        text: '我们在办公室吧台的香槟杯沿检验出佐匹克隆速效镇静剂，上面有你的完整食指指纹，你为何要下药？',
      });
    }
    if (props.discoveredClueIds.includes('clue_agreement')) {
      questions.push({
        label: '出示：撕碎的清偿协议书',
        text: '垃圾桶里的投资补充条款撕痕新鲜，你离开前陈默到底答应了还款还是彻底谈崩了？',
      });
    }
  } else if (props.suspectId === 'xu_ning') {
    questions.push({
      label: '询问大厅值班细节',
      text: '你声称 22:15 听到修复室有响动，但当时大厅还有其他宾客吗？你为什么没有立刻过去查看？',
    });
    if (props.discoveredClueIds.includes('clue_keycard')) {
      questions.push({
        label: '出示：22:12 备用门禁卡记录',
        text: '修复室在 22:12 有一次刷卡记录，使用的正是你桌下暗夹里的备用卡！你当时究竟进没进去？！',
      });
    }
    if (props.discoveredClueIds.includes('clue_watch')) {
      questions.push({
        label: '出示：22:15 停摆的古董怀表',
        text: '死者后脑遭钝器撞击是在 22:15，正是在你刷卡进入修复室后的 3 分钟内！',
      });
    }
    if (props.discoveredClueIds.includes('clue_thread')) {
      questions.push({
        label: '质问：排风窗尼龙线密室诡计',
        text: '排风窗暗锁上的高强尼龙线纤维，是用装裱画作的手法从外侧拉闭的吧？画廊里还有谁有这种技巧？！',
      });
    }
  } else if (props.suspectId === 'zhao_lei') {
    questions.push({
      label: '质问 22:00-22:20 巡逻空白',
      text: '走廊监控在 22:00 整被人工关闭了 20 分钟，这段时间你在哪里？',
    });
    if (props.discoveredClueIds.includes('clue_log')) {
      questions.push({
        label: '出示：更衣柜 10 万元现金',
        text: '你储物柜里搜出的 10 万元连号现金，带有陈默的名片和你的指纹，你怎么拿到这笔钱的？',
      });
    }
  }

  return questions;
});

const emotionLabels: Record<SuspectEmotion, string> = {
  calm: '镇定自若',
  nervous: '神色慌张',
  defensive: '戒备抵赖',
  agitated: '情绪激动',
  broken: '防线动摇',
};
</script>

<template>
  <div class="bg-white rounded-2xl border border-slate-200/90 shadow-sm flex flex-col h-[520px] overflow-hidden font-serif">
    <!-- Top suspect bar -->
    <div class="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/70">
      <div class="flex items-center space-x-3">
        <div
          class="w-10 h-10 rounded-xl flex items-center justify-center font-bold text-white shadow-xs"
          :style="{ backgroundColor: suspect.avatarColor }"
        >
          {{ suspect.name.slice(0, 1) }}
        </div>
        <div>
          <div class="flex items-center space-x-2">
            <h3 class="font-extrabold text-sm text-slate-800">{{ suspect.name }}</h3>
            <span class="text-xs text-slate-400 font-medium">{{ suspect.title }}</span>
          </div>
          <p class="text-[11px] text-slate-500 line-clamp-1">{{ suspect.bio }}</p>
        </div>
      </div>

      <div class="flex items-center space-x-2">
        <span class="text-[11px] px-2.5 py-1 rounded-full bg-white border border-slate-200 font-semibold text-slate-600 flex items-center space-x-1">
          <span
            class="w-2 h-2 rounded-full inline-block"
            :style="{ backgroundColor: suspect.avatarColor }"
          />
          <span>
            当前心理防线：
            {{ emotionLabels[currentEmotion || suspect.initialEmotion] }}
          </span>
        </span>
      </div>
    </div>

    <!-- Center Dialogue Stream -->
    <div class="flex-1 p-4 overflow-y-auto space-y-3 bg-slate-50/30">
      <div v-if="relevantMessages.length === 0" class="h-full flex flex-col items-center justify-center text-center text-slate-400 p-6">
        <MessageSquare class="w-8 h-8 mb-2 text-slate-300" />
        <p class="text-xs font-medium">尚未对【{{ suspect.name }}】展开正式问话。</p>
        <p class="text-[11px] text-slate-400 mt-1">
          可点击下方根据物证生成的针对性问题，或在输入框自由提问。
        </p>
      </div>
      <template v-else>
        <div
          v-for="msg in relevantMessages"
          :key="msg.id"
          class="flex flex-col"
          :class="msg.senderRole === 'player' ? 'items-end' : 'items-start'"
        >
          <div class="flex items-center space-x-1.5 mb-1 px-1">
            <span class="text-[10px] font-bold text-slate-400">{{ msg.sender }}</span>
            <span class="text-[9px] text-slate-300">{{ msg.timestamp }}</span>
            <span v-if="msg.emotion" class="text-[9px] px-1.5 py-0.2 rounded-full bg-purple-50 text-purple-600 font-medium">
              情绪: {{ msg.emotion }}
            </span>
          </div>

          <div
            class="max-w-[85%] rounded-2xl px-4 py-2.5 text-xs leading-relaxed"
            :class="
              msg.senderRole === 'player'
                ? 'bg-slate-900 text-white rounded-br-xs'
                : msg.senderRole === 'host'
                ? 'bg-amber-50 text-amber-900 border border-amber-200 rounded-bl-xs'
                : 'bg-white text-slate-800 border border-slate-200/90 shadow-xs rounded-bl-xs'
            "
          >
            {{ msg.text }}
          </div>
        </div>
      </template>

      <div v-if="isLoading" class="flex items-center space-x-2 text-xs text-slate-400 py-2">
        <div class="w-2 h-2 rounded-full bg-coral-400 animate-ping" />
        <span>{{ suspect.name }} 正在思索组织语言……</span>
      </div>
      <div ref="messagesEndRef" />
    </div>

    <!-- Quick Prompts Bar -->
    <div class="px-4 py-2 bg-slate-50/80 border-t border-slate-100 flex items-center space-x-2 overflow-x-auto">
      <span class="text-[11px] font-semibold text-slate-400 shrink-0">质询方向：</span>
      <button
        v-for="(q, idx) in quickQuestions"
        :key="idx"
        @click="handleSend(q.text)"
        :disabled="isLoading"
        class="text-[11px] px-2.5 py-1 rounded-lg bg-white border border-slate-200 text-slate-700 hover:border-coral-400 hover:bg-coral-50/30 hover:text-coral-700 transition font-medium shrink-0 disabled:opacity-50 cursor-pointer"
      >
        {{ q.label }}
      </button>
    </div>

    <!-- Input area -->
    <div class="p-3 bg-white border-t border-slate-100 flex items-center space-x-2">
      <input
        type="text"
        v-model="inputText"
        @keydown.enter="handleSend()"
        :placeholder="`对【${suspect.name}】提出质询或出示物证……`"
        :disabled="isLoading"
        class="flex-1 text-xs px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-coral-200 focus:border-coral-400 transition"
      />
      <button
        @click="handleSend()"
        :disabled="isLoading || !inputText.trim()"
        class="px-4 py-2.5 rounded-xl bg-slate-900 text-white text-xs font-semibold hover:bg-slate-800 disabled:opacity-40 transition flex items-center space-x-1 cursor-pointer"
      >
        <span>质询</span>
        <Send class="w-3.5 h-3.5" />
      </button>
    </div>
  </div>
</template>
