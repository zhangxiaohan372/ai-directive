<script setup lang="ts">
import { computed } from 'vue';
import type { Suspect, SuspectEmotion } from '../types/game';
import { MessageSquare, Sparkles } from 'lucide-vue-next';

interface SuspectCardProps {
  suspect: Suspect;
  isSelected?: boolean;
  currentEmotion?: SuspectEmotion;
  secretUnlocked?: boolean;
  cluesLinkedCount?: number;
}

const props = withDefaults(defineProps<SuspectCardProps>(), {
  isSelected: false,
  secretUnlocked: false,
  cluesLinkedCount: 0,
});

const emit = defineEmits<{
  (e: 'select', suspectId: Suspect['id']): void;
  (e: 'interrogate', suspectId: Suspect['id']): void;
}>();

const emotion = computed<SuspectEmotion>(() => props.currentEmotion || props.suspect.initialEmotion);

const emotionStyles: Record<SuspectEmotion, { label: string; bg: string; text: string; border: string }> = {
  calm: { label: '镇定自若', bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200' },
  nervous: { label: '神色慌张', bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-200' },
  defensive: { label: '戒备抵赖', bg: 'bg-sky-50', text: 'text-sky-700', border: 'border-sky-200' },
  agitated: { label: '情绪激动', bg: 'bg-coral-50', text: 'text-coral-700', border: 'border-coral-200' },
  broken: { label: '防线动摇', bg: 'bg-purple-50', text: 'text-purple-700', border: 'border-purple-200' },
};

const currentEmotionStyle = computed(() => emotionStyles[emotion.value]);
</script>

<template>
  <div
    @click="emit('select', props.suspect.id)"
    class="group cursor-pointer rounded-2xl p-4 transition-all duration-200 border relative flex flex-col justify-between"
    :class="
      props.isSelected
        ? 'bg-white border-coral-500 shadow-md ring-2 ring-coral-100'
        : 'bg-white/90 border-slate-200/90 hover:border-slate-300 hover:shadow-xs'
    "
  >
    <div>
      <!-- Header with Avatar & Emotion badge -->
      <div class="flex items-start justify-between">
        <div class="flex items-center space-x-3">
          <!-- 3D-styled stylized avatar token -->
          <div
            class="w-12 h-12 rounded-2xl flex items-center justify-center font-bold text-lg text-white shadow-inner transition-transform group-hover:scale-105"
            :style="{ backgroundColor: props.suspect.avatarColor }"
          >
            {{ props.suspect.name.slice(0, 1) }}
          </div>

          <div>
            <div class="flex items-center space-x-1.5">
              <h4 class="font-bold text-slate-800 text-sm">{{ props.suspect.name }}</h4>
              <span class="text-[11px] text-slate-400 font-medium">({{ props.suspect.age }}岁)</span>
            </div>
            <p class="text-xs text-slate-500 font-medium">{{ props.suspect.title }}</p>
          </div>
        </div>

        <span
          class="text-[10px] px-2 py-0.5 rounded-full font-semibold border"
          :class="[currentEmotionStyle.bg, currentEmotionStyle.text, currentEmotionStyle.border]"
        >
          {{ currentEmotionStyle.label }}
        </span>
      </div>

      <!-- Bio preview -->
      <p class="text-xs text-slate-600 mt-3 line-clamp-2 leading-relaxed">
        {{ props.suspect.bio }}
      </p>

      <!-- Alibi statement -->
      <div class="mt-3 p-2.5 rounded-xl bg-slate-50 border border-slate-100 text-[11px] text-slate-600 italic">
        <span class="font-semibold text-slate-700 not-italic block mb-0.5">口供陈述：</span>
        <span class="line-clamp-2">{{ props.suspect.alibi }}</span>
      </div>

      <!-- Secret Status badge -->
      <div
        v-if="props.secretUnlocked"
        class="mt-2.5 p-2 rounded-xl bg-purple-50/70 border border-purple-200/70 text-[11px] text-purple-900 flex items-start space-x-1.5"
      >
        <Sparkles class="w-3.5 h-3.5 text-purple-600 shrink-0 mt-0.5" />
        <span class="line-clamp-2 font-medium">{{ props.suspect.secret }}</span>
      </div>
    </div>

    <!-- Footer action bar -->
    <div class="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
      <span class="text-[11px] text-slate-400">
        已关联物证：<strong class="text-slate-700 font-semibold">{{ props.cluesLinkedCount }}</strong> 件
      </span>

      <button
        @click.stop="emit('interrogate', props.suspect.id)"
        class="text-xs font-semibold text-coral-600 hover:text-coral-700 flex items-center space-x-1 px-2.5 py-1 rounded-lg hover:bg-coral-50 transition"
      >
        <MessageSquare class="w-3.5 h-3.5" />
        <span>质询盘问</span>
      </button>
    </div>
  </div>
</template>
