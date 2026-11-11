<script setup lang="ts">
import { ref, computed } from 'vue';
import type { SuspectId } from '../types/game';
import { SUSPECTS } from '../data/caseData';
import { ShieldCheck, Check, AlertOctagon } from 'lucide-vue-next';

interface VoteModalProps {
  isOpen: boolean;
  themeMode?: 'dark' | 'light';
}

const props = withDefaults(defineProps<VoteModalProps>(), {
  themeMode: 'dark',
});

const emit = defineEmits<{
  (e: 'close'): void;
  (e: 'submitVote', suspectId: SuspectId, reason: string): void;
}>();

const selectedSuspect = ref<SuspectId>('xu_ning');
const method = ref<string>('blunt_force_locked_room');
const reason = ref<string>('');

const isDark = computed(() => props.themeMode === 'dark');

const methodsList = [
  {
    id: 'blunt_force_locked_room',
    title: '青铜镇纸后脑重击 + 排风窗尼龙线反锁机关',
    desc: '22:15 钝击致死，反锁房门后从通风窗拉线抽拉窗栓逃脱。',
  },
  {
    id: 'poison',
    title: '香槟酒杯投放佐匹克隆镇静剂直接毒杀',
    desc: '利用酒会下毒，被害人由于药物过量暴毙于修复室内。',
  },
  {
    id: 'robbery_strangle',
    title: '入室盗窃公款被撞破后的冲动行凶',
    desc: '因十万元欠款纠纷引发推搡，趁乱反锁逃窜。',
  },
];

const handleSubmit = () => {
  const fullReason = `${reason.value.trim() || '依据 22:15 怀表时间差与修复室高强尼龙线反锁机制'} [行凶手段: ${
    method.value === 'blunt_force_locked_room'
      ? '青铜镇纸钝击+排风窗密室'
      : method.value === 'poison'
      ? '香槟镇静剂毒杀'
      : '盗窃搏斗勒毙'
  }]`;
  emit('submitVote', selectedSuspect.value, fullReason);
  emit('close');
};
</script>

<template>
  <div
    v-if="isOpen"
    class="fixed inset-0 z-50 backdrop-blur-sm flex items-center justify-center p-4"
    :class="isDark ? 'bg-black/80' : 'bg-stone-900/60'"
  >
    <div
      class="rounded-3xl max-w-xl w-full shadow-2xl border overflow-hidden font-serif transition-colors duration-300"
      :class="
        isDark
          ? 'bg-[#181411] border-[#3B3027] text-[#F3EFEA]'
          : 'bg-[#FAF7F2] border-[#E0D5C7] text-[#1C1917]'
      "
    >
      <!-- Header -->
      <div
        class="p-6 border-b flex items-center justify-between"
        :class="
          isDark
            ? 'border-[#3B3027] bg-[#130F0D]'
            : 'border-[#E8DFD5] bg-[#F5EFE6]'
        "
      >
        <div class="flex items-center space-x-2.5">
          <div
            class="w-9 h-9 rounded-xl text-white flex items-center justify-center shadow-xs"
            :class="isDark ? 'bg-[#A44A4A]' : 'bg-[#8B3A2B]'"
          >
            <AlertOctagon class="w-5 h-5" />
          </div>
          <div>
            <h3 class="font-extrabold text-base" :class="isDark ? 'text-[#F3EFEA]' : 'text-[#1C1917]'">
              全员指控投票 · 终极指认
            </h3>
            <p class="text-xs" :class="isDark ? 'text-[#AFA49A]' : 'text-[#786B60]'">
              请根据已掌握的全部物证与时间线矛盾，投出你认定的真凶！
            </p>
          </div>
        </div>
      </div>

      <form @submit.prevent="handleSubmit" class="p-6 space-y-5">
        <!-- 1. Pick Suspect -->
        <div>
          <label class="text-xs font-bold block mb-2" :class="isDark ? 'text-[#F3EFEA]' : 'text-[#1C1917]'">
            1. 指认谁是杀害策展人陈默的真凶？
          </label>
          <div class="grid grid-cols-2 gap-2.5">
            <button
              v-for="s in SUSPECTS"
              :key="s.id"
              type="button"
              @click="selectedSuspect = s.id"
              class="p-3 rounded-2xl border transition text-left flex items-center space-x-3 cursor-pointer"
              :class="
                selectedSuspect === s.id
                  ? isDark
                    ? 'border-[#C9942D] bg-[#241B15] ring-1 ring-[#C9942D]/40 shadow-xs'
                    : 'border-[#8B3A2B] bg-[#F7EFE9] ring-1 ring-[#8B3A2B]/40 shadow-xs'
                  : isDark
                  ? 'border-[#3B3027] bg-[#14100E] hover:border-[#524135]'
                  : 'border-[#E0D5C7] bg-white hover:border-[#8B3A2B]/60'
              "
            >
              <img
                :src="s.avatarImage || `/assets/portraits/${s.id}.jpg`"
                :alt="s.name"
                class="w-10 h-10 rounded-xl object-cover object-top shrink-0 shadow-xs border"
                :class="isDark ? 'border-[#3B3027]' : 'border-[#E0D5C7]'"
              />
              <div class="flex-1">
                <div class="text-xs font-bold" :class="isDark ? 'text-[#F3EFEA]' : 'text-[#1C1917]'">
                  {{ s.name }}
                </div>
                <div class="text-[11px]" :class="isDark ? 'text-[#AFA49A]' : 'text-[#786B60]'">
                  {{ s.title.slice(0, 6) }}
                </div>
              </div>
              <Check
                v-if="selectedSuspect === s.id"
                class="w-4 h-4 shrink-0"
                :class="isDark ? 'text-[#C9942D]' : 'text-[#8B3A2B]'"
              />
            </button>
          </div>
        </div>

        <!-- 2. Pick Modus Operandi -->
        <div>
          <label class="text-xs font-bold block mb-2" :class="isDark ? 'text-[#F3EFEA]' : 'text-[#1C1917]'">
            2. 判定其行凶手段与诡计：
          </label>
          <div class="space-y-1.5 text-xs">
            <label
              v-for="opt in methodsList"
              :key="opt.id"
              class="p-3 rounded-xl border flex items-start space-x-2.5 cursor-pointer transition"
              :class="
                method === opt.id
                  ? isDark
                    ? 'border-[#C9942D] bg-[#241B15]'
                    : 'border-[#8B3A2B] bg-[#F7EFE9]'
                  : isDark
                  ? 'border-[#3B3027] bg-[#14100E] hover:border-[#524135]'
                  : 'border-[#E0D5C7] bg-white hover:border-[#8B3A2B]/60'
              "
            >
              <input
                type="radio"
                name="method"
                :value="opt.id"
                v-model="method"
                class="mt-0.5"
                :class="isDark ? 'accent-[#C9942D]' : 'accent-[#8B3A2B]'"
              />
              <div>
                <div class="font-bold" :class="isDark ? 'text-[#F3EFEA]' : 'text-[#1C1917]'">
                  {{ opt.title }}
                </div>
                <div class="text-[11px] mt-0.5" :class="isDark ? 'text-[#AFA49A]' : 'text-[#786B60]'">
                  {{ opt.desc }}
                </div>
              </div>
            </label>
          </div>
        </div>

        <!-- 3. Reason & deduction logic -->
        <div>
          <label class="text-xs font-bold block mb-1" :class="isDark ? 'text-[#F3EFEA]' : 'text-[#1C1917]'">
            3. 核心证据链与推论陈述：
          </label>
          <textarea
            v-model="reason"
            placeholder="列出你定罪的证据链（如：怀表22:15、备用钥匙卡22:12、尼龙线痕迹与替身画师动机）……"
            class="w-full text-xs p-3 rounded-xl border focus:outline-none h-20 resize-none font-serif"
            :class="
              isDark
                ? 'bg-[#0F0C0A] border-[#3B3027] focus:border-[#C9942D]/70 text-[#F3EFEA] placeholder-[#73675E]'
                : 'bg-white border-[#E0D5C7] focus:border-[#8B3A2B] text-[#1C1917] placeholder-stone-400'
            "
          />
        </div>

        <!-- Submit buttons -->
        <div
          class="flex items-center justify-end space-x-3 pt-3 border-t"
          :class="isDark ? 'border-[#3B3027]' : 'border-[#E8DFD5]'"
        >
          <button
            type="button"
            @click="emit('close')"
            class="px-4 py-2 text-xs font-semibold transition cursor-pointer"
            :class="isDark ? 'text-[#AFA49A] hover:text-[#F3EFEA]' : 'text-[#786B60] hover:text-[#1C1917]'"
          >
            稍后投票
          </button>
          <button
            type="submit"
            class="px-6 py-2.5 text-xs font-bold rounded-xl transition shadow-md flex items-center space-x-1.5 cursor-pointer border"
            :class="
              isDark
                ? 'bg-[#A44A4A] text-[#F8F6F0] hover:bg-[#8F3D3D] border-[#B85656]'
                : 'bg-[#8B3A2B] text-white hover:bg-[#722F22] border-[#8B3A2B]'
            "
          >
            <ShieldCheck class="w-4 h-4" :class="isDark ? 'text-[#C9942D]' : 'text-amber-200'" />
            <span>确认提交指控投票</span>
          </button>
        </div>
      </form>
    </div>
  </div>
</template>
