<script setup lang="ts">
import { ref, computed } from 'vue';
import loginBgImage from '../assets/images/login_bg_mystery_desk.jpg';
import { useAuth, PRESET_ACCOUNTS, type DetectiveUser } from '../composables/useAuth';
import { sound } from '../utils/audio';
import {
  ShieldAlert,
  ShieldCheck,
  KeyRound,
  Fingerprint,
  Lock,
  Eye,
  EyeOff,
  Sparkles,
  ArrowRight,
  Sun,
  Moon,
  Volume2,
  VolumeX,
  AlertCircle,
  CheckCircle2,
  RotateCcw,
  BadgeCheck,
  FileText,
  X,
} from 'lucide-vue-next';

interface Props {
  themeMode?: 'dark' | 'light';
}

const props = withDefaults(defineProps<Props>(), {
  themeMode: 'dark',
});

const emit = defineEmits<{
  (e: 'toggleTheme'): void;
  (e: 'success', user: DetectiveUser): void;
}>();

const {
  currentUser,
  authStatus,
  is401Expired,
  expiredReason,
  isLoginModalOpen,
  loginWithCredentials,
  trigger401,
  closeLogin,
} = useAuth();

const badgeInput = ref(PRESET_ACCOUNTS[0].badgeNo);
const passcodeInput = ref(PRESET_ACCOUNTS[0].passcode);
const showPassword = ref(false);
const rememberMe = ref(true);
const isLoading = ref(false);
const errorMessage = ref('');
const successMessage = ref('');
const isMuted = ref(sound.getIsMuted());

const handleToggleAudio = () => {
  isMuted.value = sound.toggleMute();
};

const handleSelectPreset = (badgeNo: string, passcode: string) => {
  sound.playPaperRustle();
  badgeInput.value = badgeNo;
  passcodeInput.value = passcode;
  errorMessage.value = '';
};

const handleSubmit = async () => {
  if (!badgeInput.value.trim()) {
    sound.playHeartbeatTick();
    errorMessage.value = '请输入侦探警号或档案通行代号。';
    return;
  }
  if (!passcodeInput.value.trim()) {
    sound.playHeartbeatTick();
    errorMessage.value = '请输入档案调阅绝密印信口令。';
    return;
  }

  isLoading.value = true;
  errorMessage.value = '';
  successMessage.value = '';

  try {
    const result = await loginWithCredentials(badgeInput.value, passcodeInput.value);
    if (result.success) {
      successMessage.value = result.message;
      if (currentUser.value) {
        emit('success', currentUser.value);
      }
    } else {
      sound.playHeartbeatTick();
      errorMessage.value = result.message;
    }
  } catch (err: any) {
    errorMessage.value = err?.message || '身份验证系统服务超时，请重试。';
  } finally {
    isLoading.value = false;
  }
};

const handleSimulate401Trigger = () => {
  trigger401('人工触发 401 模拟测试：会话令牌已在网关处主动废弃，请重新校验侦探身份。');
  errorMessage.value = '';
  successMessage.value = '';
};

const handleQuickBypass = async () => {
  badgeInput.value = PRESET_ACCOUNTS[0].badgeNo;
  passcodeInput.value = PRESET_ACCOUNTS[0].passcode;
  await handleSubmit();
};
</script>

<template>
  <div
    v-if="isLoginModalOpen"
    class="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 overflow-y-auto animate-fade-in font-serif"
  >
    <!-- Background Texture with Cinematic Noir Glow -->
    <div
      class="fixed inset-0 bg-cover bg-center transition-all duration-700 transform scale-105"
      :style="{
        backgroundImage: `url(${loginBgImage})`,
      }"
    />

    <!-- Theme-aware Vignette & Scrim Backdrop -->
    <div
      :class="[
        'fixed inset-0 transition-colors duration-500 backdrop-blur-sm',
        themeMode === 'dark'
          ? 'bg-gradient-to-t from-[#0C0A09]/95 via-[#0C0A09]/85 to-[#0C0A09]/90'
          : 'bg-gradient-to-t from-[#2C241E]/85 via-[#F5EFE6]/75 to-[#FAF7F2]/80'
      ]"
    />

    <!-- Ambient Subtle Noise Overlay -->
    <div class="fixed inset-0 pointer-events-none opacity-20 bg-[radial-gradient(#C9942D_1px,transparent_1px)] [background-size:24px_24px]" />

    <!-- Top Right Controls Floating Island -->
    <div class="fixed top-4 right-4 z-50 flex items-center gap-2">
      <!-- Theme Switcher -->
      <button
        @click="emit('toggleTheme')"
        :class="[
          'px-2.5 py-1.5 rounded-full border flex items-center gap-1.5 text-xs font-serif font-bold transition shadow-lg cursor-pointer backdrop-blur-md active:scale-95',
          themeMode === 'dark'
            ? 'bg-[#18130E]/90 border-[#3E2D1E] text-[#E5DCD0] hover:border-[#C9942D]/50 hover:text-[#C9942D]'
            : 'bg-[#FAF7F2]/90 border-[#E8DFD5] text-[#2C241E] hover:border-[#8B3A2B]/50 hover:text-[#8B3A2B]'
        ]"
        :title="themeMode === 'dark' ? '切换为白昼手稿' : '切换为暗夜书房'"
      >
        <Sun v-if="themeMode === 'dark'" class="w-3.5 h-3.5 text-[#C9942D]" />
        <Moon v-else class="w-3.5 h-3.5 text-[#8B3A2B]" />
        <span class="text-[11px]">{{ themeMode === 'dark' ? '白昼手稿' : '暗夜书房' }}</span>
      </button>

      <!-- Sound Mute Toggle -->
      <button
        @click="handleToggleAudio"
        :class="[
          'p-2 rounded-full border transition shadow-lg cursor-pointer backdrop-blur-md active:scale-95',
          themeMode === 'dark'
            ? 'bg-[#18130E]/90 border-[#3E2D1E] text-[#AFA49A] hover:text-[#C9942D]'
            : 'bg-[#FAF7F2]/90 border-[#E8DFD5] text-[#6E5F52] hover:text-[#8B3A2B]'
        ]"
        :title="isMuted ? '开启音效' : '静音'"
      >
        <VolumeX v-if="isMuted" class="w-3.5 h-3.5 opacity-60" />
        <Volume2 v-else class="w-3.5 h-3.5" />
      </button>

      <!-- Dismiss Button if normal modal state -->
      <button
        v-if="!is401Expired"
        @click="closeLogin"
        :class="[
          'p-2 rounded-full border transition shadow-lg cursor-pointer backdrop-blur-md active:scale-95',
          themeMode === 'dark'
            ? 'bg-[#18130E]/90 border-[#3E2D1E] text-[#AFA49A] hover:text-[#F3EFEA]'
            : 'bg-[#FAF7F2]/90 border-[#E8DFD5] text-[#6E5F52] hover:text-[#2C241E]'
        ]"
        title="关闭窗口"
      >
        <X class="w-3.5 h-3.5" />
      </button>
    </div>

    <!-- Login Slate / Detective Dossier Credential Card -->
    <div
      :class="[
        'relative w-full max-w-lg rounded-2xl border shadow-2xl p-6 sm:p-8 backdrop-blur-xl transition-all duration-300 z-10',
        themeMode === 'dark'
          ? 'bg-[#120F0D]/95 border-[#3E2D1E] text-[#E5DCD0] shadow-[0_25px_60px_-15px_rgba(0,0,0,0.9)]'
          : 'bg-[#FAF7F2]/96 border-[#E0D5C7] text-[#2C241E] shadow-[0_20px_50px_rgba(44,36,30,0.2)]'
      ]"
    >
      <!-- Top Archival Ribbon & Badge Header -->
      <div class="flex items-start justify-between border-b pb-5 mb-5"
        :class="themeMode === 'dark' ? 'border-[#2C2117]' : 'border-[#E8DFD5]'"
      >
        <div class="flex items-center gap-3">
          <div
            :class="[
              'w-11 h-11 rounded-xl flex items-center justify-center border shadow-inner transition-transform duration-300 group-hover:scale-105',
              is401Expired
                ? themeMode === 'dark'
                  ? 'bg-[#2A100C] border-[#681E15] text-[#DF5343]'
                  : 'bg-[#FDF0EE] border-[#E8B4AD] text-[#8B3A2B]'
                : themeMode === 'dark'
                  ? 'bg-[#241B15] border-[#3E2D1E] text-[#C9942D]'
                  : 'bg-[#F2ECE4] border-[#E0D5C7] text-[#8B3A2B]'
            ]"
          >
            <ShieldAlert v-if="is401Expired" class="w-6 h-6 animate-pulse" />
            <BadgeCheck v-else class="w-6 h-6" />
          </div>
          <div>
            <div class="flex items-center gap-2">
              <span class="text-xs uppercase tracking-widest font-mono font-bold"
                :class="is401Expired ? (themeMode === 'dark' ? 'text-[#DF5343]' : 'text-[#8B3A2B]') : (themeMode === 'dark' ? 'text-[#C9942D]' : 'text-[#8B3A2B]')"
              >
                {{ is401Expired ? 'STATUS: 401 UNAUTHORIZED' : 'CID DOSSIER CLEARANCE' }}
              </span>
              <span
                :class="[
                  'text-[10px] px-1.5 py-0.2 rounded font-mono',
                  themeMode === 'dark' ? 'bg-[#1C1712] text-[#8C765E]' : 'bg-[#EAE2D8] text-[#6E5F52]'
                ]"
              >
                v2.6·STRICT
              </span>
            </div>
            <h2 class="text-xl sm:text-2xl font-bold tracking-tight mt-0.5 font-serif">
              {{ is401Expired ? '侦探会话签名已失效' : '侦探档案通行验证' }}
            </h2>
          </div>
        </div>

        <!-- Archival Code Stamp -->
        <div class="text-right font-mono text-[11px] leading-tight"
          :class="themeMode === 'dark' ? 'text-[#8C765E]' : 'text-[#8C7E72]'"
        >
          <div>FILE: SEC-8492</div>
          <div>AUTH-GATEWAY</div>
        </div>
      </div>

      <!-- 401 Expiration Warning Notice Banner -->
      <div
        v-if="is401Expired"
        :class="[
          'mb-5 p-3.5 rounded-xl border flex items-start gap-3 text-xs leading-relaxed transition-all shadow-inner',
          themeMode === 'dark'
            ? 'bg-[#1E0F0C]/90 border-[#681E15]/80 text-[#F1A299]'
            : 'bg-[#FCEDEB] border-[#F2C1BA] text-[#7A1F14]'
        ]"
      >
        <AlertCircle class="w-4 h-4 shrink-0 mt-0.5 text-[#DF5343]" />
        <div class="space-y-1">
          <div class="font-bold flex items-center gap-1.5 font-serif">
            <span>【401 权限失效提示】调度会话凭证过期</span>
          </div>
          <p class="font-sans text-[11px] opacity-90">
            {{ expiredReason || '您上次登录的授权签名已失效，现场证据链调阅已被临时切断。请重新签署印信口令以续展调查权限。' }}
          </p>
        </div>
      </div>

      <!-- Preset Quick Selection Chips -->
      <div class="mb-5">
        <div class="flex items-center justify-between text-xs mb-2"
          :class="themeMode === 'dark' ? 'text-[#8C765E]' : 'text-[#6E5F52]'"
        >
          <span class="flex items-center gap-1">
            <Fingerprint class="w-3.5 h-3.5" />
            <span>快速载入测试警务档案：</span>
          </span>
          <span class="text-[10px] font-mono">1-CLICK DEMO</span>
        </div>
        <div class="grid grid-cols-3 gap-2">
          <button
            v-for="acc in PRESET_ACCOUNTS"
            :key="acc.badgeNo"
            type="button"
            @click="handleSelectPreset(acc.badgeNo, acc.passcode)"
            :class="[
              'p-2 rounded-lg border text-left transition-all cursor-pointer text-xs font-serif active:scale-95',
              badgeInput === acc.badgeNo
                ? themeMode === 'dark'
                  ? 'bg-[#241B15] border-[#C9942D] text-[#DFB36C] shadow-sm'
                  : 'bg-[#F2ECE4] border-[#8B3A2B] text-[#8B3A2B] shadow-sm'
                : themeMode === 'dark'
                  ? 'bg-[#18130E] border-[#2C2117] text-[#A89073] hover:border-[#3E2D1E] hover:text-[#E5DCD0]'
                  : 'bg-white border-[#E8DFD5] text-[#6E5F52] hover:border-[#D8CFC5] hover:text-[#2C241E]'
            ]"
          >
            <div class="font-bold truncate">{{ acc.user.name }}</div>
            <div class="font-mono text-[10px] opacity-75 mt-0.5">{{ acc.badgeNo }}</div>
          </button>
        </div>
      </div>

      <!-- Login Form -->
      <form @submit.prevent="handleSubmit" class="space-y-4">
        <!-- Badge Number Field -->
        <div>
          <label
            class="block text-xs font-bold mb-1.5 flex items-center justify-between"
            :class="themeMode === 'dark' ? 'text-[#E5DCD0]' : 'text-[#2C241E]'"
          >
            <span class="flex items-center gap-1.5">
              <BadgeCheck class="w-3.5 h-3.5 text-[#C9942D]" />
              <span>侦探警号 / 通行代号</span>
            </span>
            <span class="font-mono text-[11px] opacity-60">Badge ID</span>
          </label>
          <div class="relative">
            <input
              v-model="badgeInput"
              type="text"
              autocomplete="username"
              placeholder="请输入侦探警号 (如: CID-8492)"
              :class="[
                'w-full px-3.5 py-2.5 rounded-xl border font-mono text-sm tracking-wider transition-all outline-none',
                themeMode === 'dark'
                  ? 'bg-[#18130E] border-[#3E2D1E] text-[#F3EFEA] placeholder-[#6E5F52] focus:border-[#C9942D] focus:ring-1 focus:ring-[#C9942D]/30'
                  : 'bg-white border-[#E0D5C7] text-[#2C241E] placeholder-[#A89D91] focus:border-[#8B3A2B] focus:ring-1 focus:ring-[#8B3A2B]/20'
              ]"
            />
          </div>
        </div>

        <!-- Passcode Field -->
        <div>
          <label
            class="block text-xs font-bold mb-1.5 flex items-center justify-between"
            :class="themeMode === 'dark' ? 'text-[#E5DCD0]' : 'text-[#2C241E]'"
          >
            <span class="flex items-center gap-1.5">
              <KeyRound class="w-3.5 h-3.5 text-[#C9942D]" />
              <span>绝密印信口令</span>
            </span>
            <span class="font-mono text-[11px] opacity-60">Passcode</span>
          </label>
          <div class="relative">
            <input
              v-model="passcodeInput"
              :type="showPassword ? 'text' : 'password'"
              autocomplete="current-password"
              placeholder="请输入调阅授权口令"
              :class="[
                'w-full pl-3.5 pr-10 py-2.5 rounded-xl border font-mono text-sm tracking-wider transition-all outline-none',
                themeMode === 'dark'
                  ? 'bg-[#18130E] border-[#3E2D1E] text-[#F3EFEA] placeholder-[#6E5F52] focus:border-[#C9942D] focus:ring-1 focus:ring-[#C9942D]/30'
                  : 'bg-white border-[#E0D5C7] text-[#2C241E] placeholder-[#A89D91] focus:border-[#8B3A2B] focus:ring-1 focus:ring-[#8B3A2B]/20'
              ]"
            />
            <button
              type="button"
              @click="showPassword = !showPassword"
              class="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-stone-400 hover:text-stone-200 transition cursor-pointer"
              :title="showPassword ? '隐藏口令' : '显示口令'"
            >
              <EyeOff v-if="showPassword" class="w-4 h-4" />
              <Eye v-else class="w-4 h-4" />
            </button>
          </div>
        </div>

        <!-- Options: Remember Me & 401 Re-test -->
        <div class="flex items-center justify-between text-xs pt-1">
          <label class="flex items-center gap-2 cursor-pointer select-none">
            <input
              v-model="rememberMe"
              type="checkbox"
              class="rounded border-stone-600 accent-[#C9942D] cursor-pointer"
            />
            <span :class="themeMode === 'dark' ? 'text-[#A89073]' : 'text-[#6E5F52]'">
              保持警务会话在线 (30天免密调阅)
            </span>
          </label>

          <button
            type="button"
            @click="handleSimulate401Trigger"
            :class="[
              'text-[11px] font-mono hover:underline cursor-pointer flex items-center gap-1',
              themeMode === 'dark' ? 'text-[#DF5343]' : 'text-[#8B3A2B]'
            ]"
            title="测试 401 模拟响应机制"
          >
            <RotateCcw class="w-3 h-3" />
            <span>模拟 401 失效</span>
          </button>
        </div>

        <!-- Status & Error Alert -->
        <div
          v-if="errorMessage"
          class="p-3 rounded-lg border bg-red-950/40 border-red-800/60 text-red-300 text-xs flex items-center gap-2 animate-shake"
        >
          <AlertCircle class="w-4 h-4 shrink-0 text-red-400" />
          <span>{{ errorMessage }}</span>
        </div>

        <div
          v-if="successMessage"
          class="p-3 rounded-lg border bg-emerald-950/40 border-emerald-800/60 text-emerald-300 text-xs flex items-center gap-2"
        >
          <CheckCircle2 class="w-4 h-4 shrink-0 text-emerald-400" />
          <span>{{ successMessage }}</span>
        </div>

        <!-- Primary Action Button -->
        <button
          type="submit"
          :disabled="isLoading"
          :class="[
            'w-full py-3 px-4 rounded-xl font-bold font-serif text-sm tracking-wide transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer active:scale-[0.99] disabled:opacity-50 disabled:cursor-not-allowed',
            is401Expired
              ? themeMode === 'dark'
                ? 'bg-gradient-to-r from-[#DF5343] to-[#8B3A2B] hover:brightness-110 text-white shadow-red-950/50'
                : 'bg-[#8B3A2B] hover:bg-[#783023] text-white shadow-amber-900/20'
              : themeMode === 'dark'
                ? 'bg-gradient-to-r from-[#DFB36C] via-[#C9942D] to-[#DFB36C] text-[#140E07] hover:brightness-105 shadow-amber-950/40'
                : 'bg-[#8B3A2B] hover:bg-[#783023] text-white shadow-amber-900/20'
          ]"
        >
          <span v-if="isLoading" class="flex items-center gap-2">
            <span class="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
            <span>向苏格兰场绝密档案局核验中...</span>
          </span>
          <span v-else class="flex items-center gap-2">
            <ShieldCheck class="w-4 h-4" />
            <span>{{ is401Expired ? '重新验证并续展探案权限' : '核验侦探身份并调阅案卷' }}</span>
            <ArrowRight class="w-4 h-4 ml-1" />
          </span>
        </button>

        <!-- Fast Track Demo Button -->
        <div class="text-center pt-1">
          <button
            type="button"
            @click="handleQuickBypass"
            :class="[
              'text-[11px] transition cursor-pointer hover:underline',
              themeMode === 'dark' ? 'text-[#8C765E] hover:text-[#C9942D]' : 'text-[#8C7E72] hover:text-[#8B3A2B]'
            ]"
          >
            极速试用：以「首席刑侦顾问」免密一键签署
          </button>
        </div>
      </form>

      <!-- Bottom Security Clearance Footer -->
      <div
        class="mt-6 pt-4 border-t flex items-center justify-between text-[11px] font-mono"
        :class="themeMode === 'dark' ? 'border-[#2C2117] text-[#6E5F52]' : 'border-[#E8DFD5] text-[#A89D91]'"
      >
        <span class="flex items-center gap-1">
          <Lock class="w-3 h-3" />
          <span>SCOTLAND-YARD ENCRYPTION</span>
        </span>
        <span>SHA-256·VERIFIED</span>
      </div>
    </div>
  </div>
</template>

<style scoped>
@keyframes shake {
  0%, 100% { transform: translateX(0); }
  20%, 60% { transform: translateX(-4px); }
  40%, 80% { transform: translateX(4px); }
}

.animate-shake {
  animation: shake 0.4s ease-in-out;
}

@keyframes fadeIn {
  from { opacity: 0; transform: scale(0.98); }
  to { opacity: 1; transform: scale(1); }
}

.animate-fade-in {
  animation: fadeIn 0.25s cubic-bezier(0.16, 1, 0.3, 1);
}
</style>
