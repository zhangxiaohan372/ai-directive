<script setup lang="ts">
import type { Suspect } from '../../types/game';
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
  <div
    v-if="suspect"
    class="fixed inset-0 z-50 backdrop-blur-md flex items-center justify-center p-4 bg-black/75"
    @click.self="emit('close')"
  >
    <!-- Dossier Envelope Container -->
    <div class="panel-dossier-card relative max-w-lg w-full shadow-2xl border-2 border-theme-border rounded-2xl p-6 md:p-8 font-serif overflow-hidden">
      <!-- Top Confidential Stamp Watermark -->
      <div class="absolute top-4 right-14 select-none pointer-events-none rotate-12 border-2 border-red-500/50 text-red-500/70 px-3 py-1 font-mono text-xs font-bold tracking-widest uppercase rounded">
        CONFIDENTIAL · 内部卷宗
      </div>

      <!-- Close Button -->
      <button
        type="button"
        @click="emit('close')"
        class="absolute top-4 right-4 p-1.5 rounded-full text-theme-secondary hover:text-theme-ink hover:bg-theme-card-subtle transition cursor-pointer"
        title="关闭卷宗"
      >
        <X class="w-5 h-5" />
      </button>

      <!-- Header - Police File No. -->
      <header class="border-b-2 border-dashed border-theme-border pb-4 mb-5">
        <div class="flex items-center space-x-2 text-[11px] font-mono text-theme-muted uppercase tracking-wider">
          <FileText class="w-3.5 h-3.5 text-theme-accent" />
          <span>CASE FILE #2026-MG01 · 重点嫌疑人调查卷宗</span>
        </div>
        <div class="flex items-end justify-between mt-2">
          <div>
            <h2 class="text-2xl font-black tracking-tight text-theme-ink font-sans">
              {{ suspect.name }}
            </h2>
            <p class="text-xs text-theme-muted font-mono mt-0.5">
              {{ suspect.title }} · {{ suspect.age }}岁
            </p>
          </div>
          <!-- Ink Stamp -->
          <div class="inline-flex items-center space-x-1 px-2.5 py-1 rounded border border-theme-accent/60 text-theme-accent text-[10px] font-mono font-bold bg-theme-surface">
            <Fingerprint class="w-3.5 h-3.5" />
            <span>现场滞留人员</span>
          </div>
        </div>
      </header>

      <!-- Content Body -->
      <main class="space-y-4 text-xs leading-relaxed">
        <!-- Portrait & Basic Info -->
        <div class="flex items-start space-x-4">
          <img
            :src="suspect.avatarImage || `/assets/portraits/${suspect.id}.jpg`"
            :alt="suspect.name"
            class="w-16 h-20 rounded-lg object-cover object-top shadow-md shrink-0 border border-theme-border"
          />
          <div class="flex-1 bg-theme-surface p-3 rounded-xl border border-theme-border">
            <span class="font-bold text-theme-ink block mb-1 font-mono text-[11px]">
              【背景履历摘要】
            </span>
            <p class="text-theme-secondary text-[11px] leading-relaxed">{{ suspect.bio }}</p>
          </div>
        </div>

        <!-- Preliminary Statement -->
        <div class="p-3.5 bg-theme-card-subtle rounded-xl border border-theme-border">
          <span class="font-bold text-theme-accent block mb-1 font-mono text-[11px]">
            【事发当晚口供纪要】
          </span>
          <p class="text-theme-ink italic text-[11px] leading-relaxed">
            {{ suspect.alibi }}
          </p>
        </div>

        <!-- Motive & Suspicion -->
        <div class="p-3 bg-red-950/20 rounded-xl border border-red-500/30">
          <span class="font-bold text-red-400 block mb-0.5 font-mono text-[11px]">
            【警方初步动机推断】
          </span>
          <p class="text-red-300 text-[11px] leading-relaxed">
            {{ suspect.motiveSummary }}
          </p>
        </div>
      </main>

      <!-- Footer Actions -->
      <footer class="mt-6 pt-4 border-t-2 border-dashed border-theme-border flex items-center justify-between">
        <span class="text-[11px] font-mono text-theme-muted flex items-center space-x-1">
          <Lock class="w-3 h-3" />
          <span>深度秘密需在审问阶段出示对应物证解锁</span>
        </span>
        <button
          type="button"
          @click="emit('selectForInvestigation', suspect.id)"
          class="px-5 py-2 rounded-xl bg-theme-accent hover:bg-theme-accent-hover text-white font-sans font-bold text-xs transition shadow-sm cursor-pointer"
        >
          以该嫌疑人为重点立案
        </button>
      </footer>
    </div>
  </div>
</template>
