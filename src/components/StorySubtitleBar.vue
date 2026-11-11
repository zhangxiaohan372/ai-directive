<script setup lang="ts">
import { ref, watch, onUnmounted, computed } from 'vue';
import { Sparkles, X } from 'lucide-vue-next';

interface StorySubtitleBarProps {
  message: string | null;
  type?: 'narrative' | 'clue' | 'hint';
}

const props = withDefaults(defineProps<StorySubtitleBarProps>(), {
  type: 'narrative',
});

const emit = defineEmits<{
  (e: 'dismiss'): void;
}>();

const visible = ref(false);
let timer: ReturnType<typeof setTimeout> | null = null;
let dismissTimer: ReturnType<typeof setTimeout> | null = null;

watch(
  () => props.message,
  (newMessage) => {
    if (timer) clearTimeout(timer);
    if (dismissTimer) clearTimeout(dismissTimer);

    if (newMessage) {
      visible.value = true;
      timer = setTimeout(() => {
        visible.value = false;
        dismissTimer = setTimeout(() => {
          emit('dismiss');
        }, 300);
      }, 4500);
    } else {
      visible.value = false;
    }
  },
  { immediate: true }
);

onUnmounted(() => {
  if (timer) clearTimeout(timer);
  if (dismissTimer) clearTimeout(dismissTimer);
});

const handleClose = () => {
  visible.value = false;
  dismissTimer = setTimeout(() => {
    emit('dismiss');
  }, 200);
};

const bgStyle = computed(() => {
  return props.type === 'clue'
    ? 'bg-[#181411]/95 border-[#C9942D]/60 text-[#F3EFEA]'
    : props.type === 'hint'
    ? 'bg-[#181411]/95 border-[#3B3027] text-[#E0D7CD]'
    : 'bg-[#181411]/95 border-[#3B3027] text-[#F3EFEA]';
});

const iconColor = computed(() => {
  return props.type === 'clue'
    ? 'text-[#C9942D]'
    : props.type === 'hint'
    ? 'text-[#C9942D]'
    : 'text-[#A44A4A]';
});
</script>

<template>
  <div
    v-if="props.message || visible"
    class="fixed top-14 left-1/2 -translate-x-1/2 z-40 w-full max-w-3xl px-4 transition-all duration-300 ease-out pointer-events-none"
    :class="visible ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-3'"
  >
    <div
      class="pointer-events-auto flex items-center justify-between gap-3 px-4 py-2.5 rounded-full border backdrop-blur-md shadow-2xl"
      :class="bgStyle"
    >
      <div class="flex items-center gap-2.5 overflow-hidden">
        <Sparkles class="w-4 h-4 shrink-0 animate-pulse" :class="iconColor" />
        <span class="text-xs md:text-sm font-medium tracking-wide truncate font-serif">
          {{ props.message }}
        </span>
      </div>
      <button
        @click="handleClose"
        class="text-[#AFA49A] hover:text-[#F3EFEA] transition p-1 shrink-0 cursor-pointer"
      >
        <X class="w-3.5 h-3.5" />
      </button>
    </div>
  </div>
</template>
