<script setup lang="ts">
import { ref } from 'vue';
import type { SuspectId } from '../../types/game';
import { SUSPECTS } from '../../data/caseData';
import { ShieldCheck, Check, AlertOctagon } from 'lucide-vue-next';

interface VoteModalProps {
  isOpen: boolean;
}

defineProps<VoteModalProps>();

const emit = defineEmits<{
  (e: 'close'): void;
  (e: 'submitVote', suspectId: SuspectId, reason: string): void;
}>();

const selectedSuspect = ref<SuspectId>('xu_ning');
const method = ref<string>('blunt_force_locked_room');
const reason = ref<string>('');

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
    class="fixed inset-0 z-50 backdrop-blur-sm flex items-center justify-center p-4 bg-black/75"
    @click.self="emit('close')"
  >
    <div class="panel-dossier-card rounded-3xl max-w-xl w-full shadow-2xl border border-theme-border overflow-hidden font-serif transition-colors duration-300">
      <!-- Header -->
      <header class="panel-dossier-header p-6 border-b border-theme-border flex items-center justify-between">
        <div class="flex items-center space-x-2.5">
          <div class="w-9 h-9 rounded-xl bg-theme-accent text-white flex items-center justify-center shadow-xs">
            <AlertOctagon class="w-5 h-5" />
          </div>
          <div>
            <h3 class="font-extrabold text-base text-theme-ink">
              全员指控投票 · 终极指认
            </h3>
            <p class="text-xs text-theme-muted">
              请根据已掌握的全部物证与时间线矛盾，投出你认定的真凶！
            </p>
          </div>
        </div>
      </header>

      <form @submit.prevent="handleSubmit" class="p-6 space-y-5">
        <!-- 1. Pick Suspect -->
        <div>
          <label class="text-xs font-bold block mb-2 text-theme-ink">
            1. 指认谁是杀害策展人陈默的真凶？
          </label>
          <div class="grid grid-cols-2 gap-2.5">
            <button
              v-for="s in SUSPECTS"
              :key="s.id"
              type="button"
              @click="selectedSuspect = s.id"
              class="p-3 rounded-2xl border transition text-left flex items-center space-x-3 cursor-pointer shadow-xs"
              :class="
                selectedSuspect === s.id
                  ? 'border-theme-accent bg-theme-card-subtle ring-1 ring-theme-accent'
                  : 'border-theme-border bg-theme-surface hover:bg-theme-card-subtle'
              "
            >
              <img
                :src="s.avatarImage || `/assets/portraits/${s.id}.jpg`"
                :alt="s.name"
                class="w-10 h-10 rounded-xl object-cover object-top shrink-0 shadow-xs border border-theme-border"
              />
              <div class="flex-1">
                <div class="text-xs font-bold text-theme-ink">
                  {{ s.name }}
                </div>
                <div class="text-[11px] text-theme-muted">
                  {{ s.title.slice(0, 6) }}
                </div>
              </div>
              <Check
                v-if="selectedSuspect === s.id"
                class="w-4 h-4 shrink-0 text-theme-accent"
              />
            </button>
          </div>
        </div>

        <!-- 2. Pick Modus Operandi -->
        <div>
          <label class="text-xs font-bold block mb-2 text-theme-ink">
            2. 判定其行凶手段与诡计：
          </label>
          <div class="space-y-1.5 text-xs">
            <label
              v-for="opt in methodsList"
              :key="opt.id"
              class="p-3 rounded-xl border flex items-start space-x-2.5 cursor-pointer transition shadow-xs"
              :class="
                method === opt.id
                  ? 'border-theme-accent bg-theme-card-subtle'
                  : 'border-theme-border bg-theme-surface hover:bg-theme-card-subtle'
              "
            >
              <input
                type="radio"
                name="method"
                :value="opt.id"
                v-model="method"
                class="mt-0.5 accent-theme-accent"
              />
              <div>
                <span class="font-bold block text-theme-ink">{{ opt.title }}</span>
                <span class="text-theme-muted text-[11px] block mt-0.5">{{ opt.desc }}</span>
              </div>
            </label>
          </div>
        </div>

        <!-- 3. Reasoning -->
        <div>
          <label class="text-xs font-bold block mb-2 text-theme-ink">
            3. 提交你的推理依据（选填）：
          </label>
          <textarea
            v-model="reason"
            rows="2"
            placeholder="例如：怀表时间差、尼龙丝线反锁窗栓与代笔协议经济动机..."
            class="w-full p-3 rounded-xl border border-theme-border bg-theme-surface text-theme-ink text-xs focus:outline-none resize-none font-serif"
          />
        </div>

        <!-- Submit Button -->
        <div class="flex items-center justify-end space-x-3 pt-3 border-t border-theme-border">
          <button
            type="button"
            @click="emit('close')"
            class="px-4 py-2 rounded-xl text-xs font-bold text-theme-secondary hover:text-theme-ink hover:bg-theme-card-subtle transition cursor-pointer"
          >
            返回勘验
          </button>
          <button
            type="submit"
            class="px-6 py-2.5 rounded-xl font-sans font-bold text-xs bg-theme-accent hover:bg-theme-accent-hover text-white transition shadow-lg active:scale-95 cursor-pointer flex items-center space-x-1.5"
          >
            <ShieldCheck class="w-4 h-4" />
            <span>确认指控真凶并锁定结案</span>
          </button>
        </div>
      </form>
    </div>
  </div>
</template>
