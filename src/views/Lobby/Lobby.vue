<script setup lang="ts">
import { ref } from 'vue';
import type { Player } from '../../types/game';
import { Users, Plus, LogIn, Play, Bot, UserCheck, ArrowLeft, Copy, Check } from 'lucide-vue-next';

interface LobbyProps {
  roomId: string;
  roomCode: string;
  players: Player[];
  isHost?: boolean;
}

withDefaults(defineProps<LobbyProps>(), {
  isHost: true,
});

const emit = defineEmits<{
  (e: 'startGame'): void;
  (e: 'createRoom', hostName: string, includeBots: boolean): void;
  (e: 'joinRoom', roomCode: string, playerName: string): void;
  (e: 'backToHome'): void;
  (e: 'addBotPlayer'): void;
}>();

const activeTab = ref<'current' | 'create' | 'join'>('current');
const hostNameInput = ref('首席侦探');
const includeBotsCheck = ref(true);
const joinCodeInput = ref('');
const joinNameInput = ref('特邀侦探');
const copied = ref(false);

const handleCopyCode = (code: string) => {
  navigator.clipboard?.writeText(code);
  copied.value = true;
  setTimeout(() => {
    copied.value = false;
  }, 2000);
};

const handleCreate = () => {
  emit('createRoom', hostNameInput.value, includeBotsCheck.value);
  activeTab.value = 'current';
};

const handleJoin = () => {
  if (joinCodeInput.value) {
    emit('joinRoom', joinCodeInput.value, joinNameInput.value);
    activeTab.value = 'current';
  }
};
</script>

<template>
  <div class="max-w-2xl mx-auto px-4 py-8 font-serif">
    <!-- Top navigation -->
    <button
      type="button"
      @click="emit('backToHome')"
      class="flex items-center space-x-1.5 text-xs font-semibold text-theme-muted hover:text-theme-ink transition mb-6 cursor-pointer"
    >
      <ArrowLeft class="w-4 h-4 text-theme-accent" />
      <span>返回首页</span>
    </button>

    <!-- Main card -->
    <div class="panel-dossier-card rounded-3xl border border-theme-border shadow-xl overflow-hidden font-serif">
      <!-- Header Tabs -->
      <header class="panel-dossier-header flex border-b border-theme-border p-2">
        <button
          type="button"
          @click="activeTab = 'current'"
          class="lobby-tab-btn"
          :class="{ 'is-active': activeTab === 'current' }"
        >
          <Users class="w-4 h-4" />
          <span>当前房间备战室</span>
        </button>
        <button
          type="button"
          @click="activeTab = 'create'"
          class="lobby-tab-btn"
          :class="{ 'is-active': activeTab === 'create' }"
        >
          <Plus class="w-4 h-4" />
          <span>创建新房间</span>
        </button>
        <button
          type="button"
          @click="activeTab = 'join'"
          class="lobby-tab-btn"
          :class="{ 'is-active': activeTab === 'join' }"
        >
          <LogIn class="w-4 h-4" />
          <span>输入房间号加入</span>
        </button>
      </header>

      <!-- Tab 1: Current Room -->
      <div v-if="activeTab === 'current'" class="p-6 md:p-8 space-y-6">
        <!-- Room code banner -->
        <div class="p-4 rounded-2xl bg-theme-card-subtle border border-theme-border flex items-center justify-between">
          <div>
            <span class="text-[11px] font-bold text-theme-accent uppercase tracking-wider block font-mono">
              房间联机口令 (Room Code)
            </span>
            <span class="text-2xl font-black text-theme-ink tracking-wider font-mono">
              {{ roomCode }}
            </span>
          </div>
          <button
            type="button"
            @click="handleCopyCode(roomCode)"
            class="px-3 py-1.5 rounded-xl bg-theme-surface border border-theme-border text-xs font-bold text-theme-accent hover:bg-theme-card transition flex items-center space-x-1 cursor-pointer shadow-xs"
          >
            <Check v-if="copied" class="w-3.5 h-3.5" />
            <Copy v-else class="w-3.5 h-3.5" />
            <span>{{ copied ? '已复制' : '复制口令' }}</span>
          </button>
        </div>

        <!-- Players list -->
        <div>
          <div class="flex items-center justify-between mb-3">
            <h4 class="text-xs font-extrabold text-theme-ink">
              当前入座侦探 ({{ players.length }}/4 人)：
            </h4>
            <button
              v-if="players.length < 4"
              type="button"
              @click="emit('addBotPlayer')"
              class="text-xs font-semibold text-theme-accent hover:underline flex items-center space-x-1 cursor-pointer"
            >
              <Bot class="w-3.5 h-3.5" />
              <span>快速补充 AI 探友</span>
            </button>
          </div>

          <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div
              v-for="p in players"
              :key="p.id"
              class="p-3.5 rounded-2xl border border-theme-border bg-theme-surface flex items-center justify-between shadow-xs"
            >
              <div class="flex items-center space-x-3">
                <div class="w-10 h-10 rounded-xl bg-theme-card-subtle border border-theme-border flex items-center justify-center text-sm font-bold text-theme-accent">
                  {{ p.avatar }}
                </div>
                <div>
                  <div class="text-xs font-bold text-theme-ink flex items-center space-x-1">
                    <span>{{ p.name }}</span>
                    <span v-if="p.isHost" class="text-[9px] px-1.5 py-0.5 rounded-full bg-theme-accent text-white font-bold font-mono">
                      房主
                    </span>
                    <span v-if="p.isBot" class="text-[9px] px-1.5 py-0.5 rounded-full border border-theme-border text-theme-accent font-bold font-mono">
                      AI探友
                    </span>
                  </div>
                  <div class="text-[10px] text-theme-muted mt-0.5">
                    {{ p.isBot ? '智能协作助手' : '真人玩家' }}
                  </div>
                </div>
              </div>

              <span class="text-[10px] px-2 py-0.5 rounded-full font-bold bg-theme-card-subtle text-theme-ink border border-theme-border flex items-center space-x-1">
                <UserCheck class="w-3 h-3" />
                <span>已就绪</span>
              </span>
            </div>
          </div>
        </div>

        <!-- Launch button -->
        <footer class="pt-4 border-t border-theme-border flex items-center justify-between">
          <span class="text-xs text-theme-muted">
            支持 2~4 名侦探开局，全员已就绪！
          </span>

          <button
            type="button"
            @click="emit('startGame')"
            class="px-8 py-3 rounded-2xl bg-theme-accent hover:bg-theme-accent-hover text-white font-extrabold text-sm transition shadow-md flex items-center space-x-2 cursor-pointer active:scale-95"
          >
            <span>正式开始调查</span>
            <Play class="w-4 h-4 fill-white text-white" />
          </button>
        </footer>
      </div>

      <!-- Tab 2: Create Room -->
      <div v-if="activeTab === 'create'" class="p-6 md:p-8 space-y-5">
        <div>
          <label class="text-xs font-bold text-theme-ink block mb-1.5">
            你的侦探昵称：
          </label>
          <input
            type="text"
            v-model="hostNameInput"
            class="w-full text-xs p-3 rounded-xl border border-theme-border bg-theme-surface text-theme-ink focus:outline-none focus:border-theme-accent"
          />
        </div>

        <label class="flex items-center space-x-2.5 text-xs text-theme-secondary cursor-pointer">
          <input
            type="checkbox"
            v-model="includeBotsCheck"
            class="rounded accent-theme-accent"
          />
          <span>自动补充 2 名模拟探友（侦探小林、解密达人阿强）以供测试</span>
        </label>

        <button
          type="button"
          @click="handleCreate"
          class="w-full py-3 rounded-2xl bg-theme-accent hover:bg-theme-accent-hover text-white font-extrabold text-xs transition shadow-sm cursor-pointer"
        >
          创建并进入房间
        </button>
      </div>

      <!-- Tab 3: Join Room -->
      <div v-if="activeTab === 'join'" class="p-6 md:p-8 space-y-5">
        <div>
          <label class="text-xs font-bold text-theme-ink block mb-1.5">
            房间口令代码 (Room Code)：
          </label>
          <input
            type="text"
            :value="joinCodeInput"
            @input="joinCodeInput = (($event.target as HTMLInputElement).value || '').toUpperCase()"
            placeholder="例如: MIST"
            class="w-full text-sm font-mono font-bold p-3 rounded-xl border border-theme-border bg-theme-surface text-theme-ink focus:outline-none focus:border-theme-accent tracking-wider"
          />
        </div>

        <div>
          <label class="text-xs font-bold text-theme-ink block mb-1.5">你的昵称：</label>
          <input
            type="text"
            v-model="joinNameInput"
            class="w-full text-xs p-3 rounded-xl border border-theme-border bg-theme-surface text-theme-ink focus:outline-none focus:border-theme-accent"
          />
        </div>

        <button
          type="button"
          @click="handleJoin"
          :disabled="!joinCodeInput.trim()"
          class="w-full py-3 rounded-2xl bg-theme-accent hover:bg-theme-accent-hover text-white font-extrabold text-xs disabled:opacity-40 transition shadow-sm cursor-pointer"
        >
          加入指定房间
        </button>
      </div>
    </div>
  </div>
</template>

<style scoped>
@reference "../../index.css";

.lobby-tab-btn {
  @apply flex-1 py-2.5 rounded-2xl text-xs font-extrabold transition flex items-center justify-center gap-1.5 cursor-pointer text-theme-secondary hover:text-theme-ink;
}

.lobby-tab-btn.is-active {
  @apply bg-theme-accent text-white shadow-xs;
}
</style>
