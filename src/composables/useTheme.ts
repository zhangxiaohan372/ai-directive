import { ref, watch } from 'vue';
import { sound } from '../utils/audio';

export type ThemeMode = 'dark' | 'light';

const savedTheme = typeof localStorage !== 'undefined' ? localStorage.getItem('ai_detective_theme') : null;
const themeMode = ref<ThemeMode>(
  savedTheme === 'light' || savedTheme === 'dark' ? savedTheme : 'dark'
);

if (typeof document !== 'undefined') {
  watch(
    themeMode,
    (newMode) => {
      document.documentElement.classList.toggle('dark', newMode === 'dark');
      document.documentElement.setAttribute('data-theme', newMode);
      localStorage.setItem('ai_detective_theme', newMode);
    },
    { immediate: true }
  );
}

export function useTheme() {
  const toggleTheme = () => {
    sound.playPaperRustle();
    themeMode.value = themeMode.value === 'dark' ? 'light' : 'dark';
  };

  return {
    themeMode,
    toggleTheme,
  };
}
