<script setup lang="ts">
import type { Suspect } from '../types/game';
import { X, FileText, Fingerprint, Lock } from 'lucide-vue-next';

interface SuspectDossierModalProps {
  suspect: Suspect | null;
}

defineProps<SuspectDossierModalProps>();

const emit = defineEmits<{
  (e: 'close'): void;
  (e: 'selectForInvestigation', suspectId: Suspect['id']): void;
}>();
</script>

<template>
  <div v-if="suspect" class="fixed inset-0 z-50 bg-stone-900/60 backdrop-blur-xs flex items-center justify-center p-4">
    <!-- Dossier Envelope Container -->
    <div class="relative bg-[#FAF6EE] text-stone-800 rounded-2xl max-w-lg w-full shadow-2xl border-2 border-stone-300 p-6 md:p-8 font-serif overflow-hidden">
      <!-- Top Confidential Stamp Watermark -->
      <div class="absolute top-4 right-14 select-none pointer-events-none rotate-12 border-2 border-rose-600/40 text-rose-600/50 px-3 py-1 font-mono text-xs font-bold tracking-widest uppercase rounded">
        CONFIDENTIAL · 内部卷宗
      </div>

      <!-- Close Button -->
      <button
        @click="emit('close')"
        class="absolute top-4 right-4 p-1.5 rounded-full text-stone-400 hover:text-stone-700 hover:bg-stone-200 transition cursor-pointer"
      >
        <X class="w-5 h-5" />
      </button>

      <!-- Header - Police File No. -->
      <div class="border-b-2 border-dashed border-stone-300 pb-4 mb-5">
        <div class="flex items-center space-x-2 text-[11px] font-mono text-stone-500 uppercase tracking-wider">
          <FileText class="w-3.5 h-3.5 text-stone-400" />
          <span>CASE FILE #2026-MG01 · 重点嫌疑人调查卷宗</span>
        </div>
        <div class="flex items-end justify-between mt-2">
          <div>
            <h2 class="text-2xl font-black tracking-tight text-stone-900 font-sans">
              {{ suspect.name }}
            </h2>
            <p class="text-xs text-stone-600 font-mono mt-0.5">
              {{ suspect.title }} · {{ suspect.age }}岁
            </p>
          </div>
          <!-- Ink Stamp -->
          <div class="inline-flex items-center space-x-1 px-2.5 py-1 rounded border border-amber-700 text-amber-800 text-[10px] font-mono font-bold bg-amber-50">
            <Fingerprint class="w-3.5 h-3.5" />
            <span>现场滞留人员</span>
          </div>
        </div>
      </div>

      <!-- Content Body -->
      <div class="space-y-4 text-xs leading-relaxed">
        <!-- Portrait & Basic Info -->
        <div class="flex items-start space-x-4">
          <img
            :src="suspect.avatarImage || `/assets/portraits/${suspect.id}.jpg`"
            :alt="suspect.name"
            class="w-16 h-20 rounded-lg object-cover object-top shadow-md shrink-0 border border-stone-400/40"
          />
          <div class="flex-1 bg-stone-100/70 p-3 rounded-xl border border-stone-200/80">
            <span class="font-bold text-stone-700 block mb-1 font-mono text-[11px]">
              【背景履历摘要】
            </span>
            <p class="text-stone-600 text-[11px] leading-relaxed">{{ suspect.bio }}</p>
          </div>
        </div>

        <!-- Preliminary Statement -->
        <div class="p-3.5 bg-amber-50/60 rounded-xl border border-amber-200/80">
          <span class="font-bold text-amber-900 block mb-1 font-mono text-[11px]">
            【事发当晚口供纪要】
          </span>
          <p class="text-stone-700 italic text-[11px] leading-relaxed">
            {{ suspect.alibi }}
          </p>
        </div>

        <!-- Motive & Suspicion -->
        <div class="p-3 bg-rose-50/60 rounded-xl border border-rose-200/60">
          <span class="font-bold text-rose-900 block mb-0.5 font-mono text-[11px]">
            【警方初步动机推断】
          </span>
          <p class="text-rose-800 text-[11px] leading-relaxed">
            {{ suspect.motiveSummary }}
          </p>
        </div>
      </div>

      <!-- Footer Actions -->
      <div class="mt-6 pt-4 border-t-2 border-dashed border-stone-300 flex items-center justify-between">
        <span class="text-[11px] font-mono text-stone-400 flex items-center space-x-1">
          <Lock class="w-3 h-3" />
          <span>深度秘密需在审问阶段出示对应物证解锁</span>
        </span>
        <button
          @click="emit('selectForInvestigation', suspect.id)"
          class="px-5 py-2 rounded-xl bg-stone-900 text-stone-100 font-sans font-bold text-xs hover:bg-stone-800 transition shadow-sm cursor-pointer"
        >
          以该嫌疑人为重点立案
        </button>
      </div>
    </div>
  </div>
</template>
