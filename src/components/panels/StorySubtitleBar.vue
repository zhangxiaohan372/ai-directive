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

const badgeText = computed(() => {
  return props.type === 'clue'
    ? '现场物证浮现'
    : props.type === 'hint'
    ? '推演灵感启示'
    : '案情旁白演进';
});
</script>

<template>
  <transition
    enter-active-class="transition duration-300 ease-out"
    enter-from-class="opacity-0 -translate-y-3"
    enter-to-class="opacity-100 translate-y-0"
    leave-active-class="transition duration-200 ease-in"
    leave-from-class="opacity-100 translate-y-0"
    leave-to-class="opacity-0 -translate-y-2"
  >
    <div
      v-if="visible && message"
      class="fixed top-3 left-1/2 -translate-x-1/2 z-50 max-w-xl w-[92%] sm:w-auto px-4 py-2.5 rounded-full backdrop-blur-md border shadow-lg flex items-center space-x-3 font-serif select-none panel-dossier-card border-theme-border text-theme-ink"
    >
      <div class="flex items-center space-x-1.5 shrink-0">
        <Sparkles class="w-3.5 h-3.5 text-theme-accent animate-pulse" />
        <span class="text-[10px] font-mono tracking-wider text-theme-accent uppercase">
          {{ badgeText }}
        </span>
      </div>

      <p class="text-xs tracking-wide line-clamp-1 truncate max-w-md text-theme-ink font-medium">
        {{ message }}
      </p>

      <button
        type="button"
        @click="handleClose"
        class="text-theme-muted hover:text-theme-ink p-0.5 rounded-full transition cursor-pointer"
        title="关闭提示"
      >
        <X class="w-3.5 h-3.5" />
      </button>
    </div>
  </transition>
</template>
