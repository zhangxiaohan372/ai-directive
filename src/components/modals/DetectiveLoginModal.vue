<script setup lang="ts">
import { ref, computed } from 'vue';
import loginBgImage from '../../assets/images/login_bg_mystery_desk.jpg';
import loginPaperBg from '../../assets/images/login_paper_dossier_bg.png';
import { useAuth, PRESET_ACCOUNTS, type DetectiveUser } from '../../composables/useAuth';
import { sound } from '../../utils/audio';
import {
  Eye,
  EyeOff,
  Sun,
  Moon,
  Volume2,
  VolumeX,
  X,
  ShieldAlert,
  ArrowRight,
  AlertCircle,
  CheckCircle2,
  Compass,
  PenTool,
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
  is401Expired,
  expiredReason,
  isLoginModalOpen,
  loginWithCredentials,
  registerUser,
  closeLogin,
} = useAuth();

// 表单模式：登录 (login) | 注册 (register)
const authMode = ref<'login' | 'register'>('login');

const badgeInput = ref(PRESET_ACCOUNTS[0].badgeNo);
const passcodeInput = ref(PRESET_ACCOUNTS[0].passcode);
const nicknameInput = ref('');
const showPassword = ref(false);
const rememberMe = ref(true);
const isLoading = ref(false);
const errorMessage = ref('');
const successMessage = ref('');
const isMuted = ref(sound.getIsMuted());

const isDark = computed(() => props.themeMode === 'dark');

// ─────────────────────────────────────────────────
// 计算样式：严格遵循 SKILL.md 双主题与纸面 Token 规范
// ─────────────────────────────────────────────────

/** 全屏侦探书桌背景 */
const deskBgStyle = computed(() => ({
  backgroundImage: 'url(' + loginBgImage + ')',
}));

/** 真实对开牛皮纸底图图层样式 */
const paperImageStyle = computed(() => ({
  backgroundImage: 'url(' + loginPaperBg + ')',
  backgroundSize: '100% 100%',
  backgroundRepeat: 'no-repeat',
  backgroundPosition: 'center',
  filter: isDark.value
    ? 'brightness(0.78) contrast(1.12) sepia(0.2)'
    : 'brightness(1) contrast(1)',
  transition: 'filter 0.3s ease',
}));

/** 撕边毛边投影（使用 drop-shadow 沿透明撕边边缘自然扩散） */
const cardContainerStyle = computed(() => ({
  filter: isDark.value
    ? 'drop-shadow(0 28px 45px rgba(0,0,0,0.88)) drop-shadow(0 8px 16px rgba(0,0,0,0.65))'
    : 'drop-shadow(0 24px 38px rgba(35,20,10,0.55)) drop-shadow(0 6px 14px rgba(35,20,10,0.35))',
}));

/** 顶部固定胶带 */
const tapeStyle = computed(() => ({
  background: isDark.value ? 'rgba(215,190,130,0.22)' : 'rgba(235,215,165,0.72)',
  border: isDark.value ? '1px solid rgba(215,190,130,0.18)' : '1px solid rgba(185,155,105,0.48)',
  boxShadow: '0 2px 6px rgba(0,0,0,0.25)',
  backdropFilter: 'blur(1.5px)',
}));

/** 橡皮图章（双线框小标签） */
const rubberStampStyle = computed(() => ({
  borderColor: isDark.value ? '#9E3A28' : '#7E2F22',
  color: isDark.value ? '#B84530' : '#7E2F22',
  letterSpacing: '0.12em',
}));

/** 火漆印章样式 */
const waxSealStyle = computed(() => ({
  border: '2px dashed ' + (is401Expired.value
    ? 'rgba(180,45,28,0.85)'
    : (isDark.value ? 'rgba(175,60,40,0.7)' : 'rgba(138,36,22,0.65)')),
  color: is401Expired.value ? '#FFF' : (isDark.value ? '#C44E38' : '#7E2F22'),
  background: is401Expired.value
    ? 'linear-gradient(135deg,#A82816,#841E10,#5C1208)'
    : 'transparent',
}));

// ── 纸面墨水字迹色彩（严格对应 SKILL.md 纸面 Token，对比度 ≥ 4.5:1） ──

const inkText = computed(() => (isDark.value ? '#EADFCB' : '#2B2016'));
const inkMuted = computed(() => (isDark.value ? '#CDB38C' : '#4A3822'));
const inkFaint = computed(() => (isDark.value ? '#A58B66' : '#5E4A2E'));
const inkLine = computed(() => (isDark.value ? 'rgba(224, 178, 90, 0.45)' : 'rgba(50, 30, 12, 0.45)'));

/** 主核验按钮：48px 实体按压质感 */
const submitBtnStyle = computed(() => ({
  background: isDark.value
    ? 'linear-gradient(135deg,#9C2F1E 0%,#802012 100%)'
    : 'linear-gradient(135deg,#7E2F22 0%,#692419 100%)',
  color: isDark.value ? '#1E140B' : '#F6EAD6',
  boxShadow: '0 3px 0 ' + (isDark.value ? '#4F1208' : '#42140D'),
}));

const dashedBorderStyle = computed(() => ({
  borderTopStyle: 'dashed' as const,
  borderTopColor: inkLine.value,
  borderTopWidth: '1.5px',
}));

// ── 交互方法 ──

const handleToggleAudio = () => {
  isMuted.value = sound.toggleMute();
};

const handleSelectPreset = (badgeNo: string, passcode: string) => {
  sound.playPaperRustle();
  authMode.value = 'login';
  badgeInput.value = badgeNo;
  passcodeInput.value = passcode;
  errorMessage.value = '';
};

const switchMode = (mode: 'login' | 'register') => {
  sound.playPaperRustle();
  authMode.value = mode;
  errorMessage.value = '';
  successMessage.value = '';
};

const handleSubmit = async () => {
  if (!badgeInput.value.trim()) {
    sound.playHeartbeatTick();
    errorMessage.value = authMode.value === 'login' ? '请输入侦探警号/通行代号。' : '请设置侦探警号/通行代号。';
    return;
  }
  if (!passcodeInput.value.trim()) {
    sound.playHeartbeatTick();
    errorMessage.value = '请输入通行口令。';
    return;
  }

  isLoading.value = true;
  errorMessage.value = '';
  successMessage.value = '';

  try {
    if (authMode.value === 'login') {
      const result = await loginWithCredentials(badgeInput.value, passcodeInput.value);
      if (result.success) {
        successMessage.value = result.message;
        if (currentUser.value) emit('success', currentUser.value);
      } else {
        sound.playHeartbeatTick();
        errorMessage.value = result.message;
      }
    } else {
      const result = await registerUser(badgeInput.value, passcodeInput.value, nicknameInput.value);
      if (result.success) {
        successMessage.value = result.message;
        if (currentUser.value) emit('success', currentUser.value);
      } else {
        sound.playHeartbeatTick();
        errorMessage.value = result.message;
      }
    }
  } catch (err: any) {
    errorMessage.value = err?.message || '通行认证响应异常，请重试。';
  } finally {
    isLoading.value = false;
  }
};
</script>

<template>
  <div
    v-if="isLoginModalOpen"
    class="fixed inset-0 z-50 flex flex-col font-serif overflow-hidden animate-fade-in"
  >
    <!-- ── 全屏背景：侦探书桌 + 暗角 ── -->
    <div class="fixed inset-0 bg-cover bg-center pointer-events-none" :style="deskBgStyle">
      <div
        class="absolute inset-0"
        :class="isDark
          ? 'bg-gradient-to-br from-[#0C0A09]/95 via-[#0C0A09]/85 to-[#120F0D]/95'
          : 'bg-gradient-to-br from-[#2C1A0E]/80 via-[#1C1208]/65 to-[#2C1A0E]/85'"
      />
      <div class="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_30%,#000_100%)] opacity-70" />
    </div>

    <!-- ── 全站统一品牌顶栏 ── -->
    <header
      class="relative z-30 h-14 px-6 sm:px-10 border-b flex items-center justify-between shrink-0 backdrop-blur-md transition-colors duration-300"
      :class="isDark ? 'bg-[#120F0D]/95 border-[#2C2117]' : 'bg-[#2C1A0E]/90 border-[#4A2E14]'"
    >
      <div class="flex items-center gap-3">
        <div
          class="w-8 h-8 rounded-lg border flex items-center justify-center shrink-0"
          :class="isDark
            ? 'bg-gradient-to-br from-[#2D2117] to-[#0D0906] border-[#543F2A] text-[#E5C384]'
            : 'bg-[#8B3A2B] border-[#6A2718] text-[#FAF0E0]'"
        >
          <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor"
            stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
            <circle cx="11" cy="11" r="8" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
        </div>
        <div>
          <span class="font-serif font-black text-sm tracking-wide"
            :class="isDark ? 'text-[#F3EFEA]' : 'text-[#FAF0E0]'">AI Detective</span>
          <span class="ml-2 text-xs font-serif"
            :class="isDark ? 'text-[#8C765E]' : 'text-[#C9A06C]'">· 通行与创作者枢纽</span>
        </div>
      </div>

      <div class="flex items-center gap-2">
        <div class="p-0.5 rounded-full border flex items-center gap-0.5"
          :class="isDark ? 'bg-[#18130E] border-[#3E2D1E]' : 'bg-[#3A2210] border-[#5A3418]'">
          <button
            @click="isDark && emit('toggleTheme')"
            class="px-2.5 py-1 rounded-full flex items-center gap-1 text-xs font-serif font-bold cursor-pointer transition"
            :class="!isDark ? 'bg-[#8B3A2B] text-[#FAF0E0] shadow-xs' : 'text-[#8C765E] hover:text-[#E5C384]'"
          >
            <Sun class="w-3 h-3" /><span>白昼</span>
          </button>
          <button
            @click="!isDark && emit('toggleTheme')"
            class="px-2.5 py-1 rounded-full flex items-center gap-1 text-xs font-serif font-bold cursor-pointer transition"
            :class="isDark ? 'bg-gradient-to-r from-[#DFB36C] via-[#C9942D] to-[#DFB36C] text-[#140E07] shadow-xs' : 'text-[#C9A06C] hover:text-[#FAF0E0]'"
          >
            <Moon class="w-3 h-3" /><span>暗夜</span>
          </button>
        </div>

        <button @click="handleToggleAudio"
          class="p-1.5 rounded-lg border transition cursor-pointer"
          :class="isDark
            ? 'bg-[#18130E] border-[#3A2B1D] text-[#A89073] hover:text-[#E5C384]'
            : 'bg-[#3A2210] border-[#5A3418] text-[#C9A06C] hover:text-[#FAF0E0]'"
          :title="isMuted ? '开启音效' : '静音'">
          <VolumeX v-if="isMuted" class="w-3.5 h-3.5 opacity-60" />
          <Volume2 v-else class="w-3.5 h-3.5" />
        </button>

        <button v-if="!is401Expired" @click="closeLogin"
          class="p-1.5 rounded-lg border transition cursor-pointer"
          :class="isDark
            ? 'bg-[#18130E] border-[#3A2B1D] text-[#A89073] hover:text-[#F3EFEA]'
            : 'bg-[#3A2210] border-[#5A3418] text-[#C9A06C] hover:text-[#FAF0E0]'"
          title="关闭返回现场">
          <X class="w-3.5 h-3.5" />
        </button>
      </div>
    </header>

    <!-- ── 主体舞台 ── -->
    <main class="relative z-10 flex-1 flex items-center justify-center p-4 sm:p-8 overflow-y-auto">

      <!--
        ══════════════════════════════════════════
        真实对开牛皮纸卡片 (.sheet)
        左页：开放平台（探案 + 创作）封面
        右页：通用开放平台（登录 / 注册）通行证
        两页内容在垂直方向严格对齐同一基线！
        ══════════════════════════════════════════
      -->
      <div
        class="relative w-full max-w-[960px] transition-all"
        :style="cardContainerStyle"
      >
        <!-- 真实对开牛皮纸底图 -->
        <div class="absolute inset-0 pointer-events-none select-none z-0" :style="paperImageStyle" />

        <!-- 顶部固定胶带：左上 & 右上 -->
        <div
          class="absolute -top-3 left-16 sm:left-24 w-18 h-7 -rotate-2 z-30 pointer-events-none rounded-xs"
          :style="tapeStyle"
        />
        <div
          class="absolute -top-3 right-16 sm:right-28 w-16 h-7 rotate-3 z-30 pointer-events-none rounded-xs"
          :style="tapeStyle"
        />

        <!-- 对开版心内容区 -->
        <div class="relative z-10 w-full flex flex-col lg:flex-row px-8 sm:px-14 py-8 sm:py-12">

          <!-- ══════════════════════════════════════════════
               左页：开放平台封面（探案 + 创作）
               ══════════════════════════════════════════════ -->
          <div class="lg:w-[46%] flex flex-col justify-between pr-4 lg:pr-8 pb-8 lg:pb-0">

            <div>
              <!-- 【顶栏基线行】：与右页 Tab 严格对齐 -->
              <div class="h-7 flex items-center justify-between mb-4">
                <div
                  class="inline-flex items-center px-2 py-0.5 border-2 text-xs font-serif font-bold select-none -rotate-1"
                  :style="rubberStampStyle"
                >
                  探案与创作工坊
                </div>
                <div class="text-xs font-serif tracking-widest opacity-80" :style="{ color: inkFaint }">
                  开放探案平台
                </div>
              </div>

              <!-- 【标题基线行】：与右页大标题垂直高度与基线严格对齐 -->
              <div class="min-h-[76px] flex flex-col justify-end mb-6">
                <h1
                  class="text-2xl sm:text-3xl font-serif font-black leading-tight tracking-wide"
                  :style="{ color: inkText }"
                >
                  智能探案平台
                </h1>
                <p class="mt-1 text-xs sm:text-sm font-sans" :style="{ color: inkMuted }">
                  基于确定性逻辑图谱的推理实证与案件创作枢纽。
                </p>
              </div>

              <!-- 【中部核心介绍】：致探案家与创作者（充实饱满，贴合开放平台） -->
              <div class="space-y-4 my-5 pt-1">
                <!-- 探案支柱 -->
                <div class="p-3 rounded border" :style="{ borderColor: inkLine, background: 'rgba(0,0,0,0.02)' }">
                  <div class="flex items-center gap-2 mb-1">
                    <Compass class="w-4 h-4 shrink-0" :style="{ color: isDark ? '#DFB36C' : '#7E2F22' }" />
                    <span class="text-xs font-serif font-bold" :style="{ color: inkText }">沉浸探案推演</span>
                  </div>
                  <p class="text-xs font-sans leading-relaxed" :style="{ color: inkMuted }">
                    深入密室与嫌疑人问询博弈，采集微观物证化验，链式推演破除不在场伪证。
                  </p>
                </div>

                <!-- 创作支柱 -->
                <div class="p-3 rounded border" :style="{ borderColor: inkLine, background: 'rgba(0,0,0,0.02)' }">
                  <div class="flex items-center gap-2 mb-1">
                    <PenTool class="w-4 h-4 shrink-0" :style="{ color: isDark ? '#DFB36C' : '#7E2F22' }" />
                    <span class="text-xs font-serif font-bold" :style="{ color: inkText }">案卷创作工坊</span>
                  </div>
                  <p class="text-xs font-sans leading-relaxed" :style="{ color: inkMuted }">
                    人人皆可设计本格推理案卷。内置状态机图谱与矛盾校验，保障物证链 100% 确定性。
                  </p>
                </div>
              </div>

              <!-- 手稿按语 -->
              <div
                class="text-xs font-serif italic leading-relaxed pt-1 opacity-85"
                :style="{ color: inkMuted }"
              >
                「无论是破译谜局的侦探，还是构筑迷局的创作者，皆在此启程。」
              </div>
            </div>

            <!-- 【底栏基线行】：与右页“体验账号”水平对齐 -->
            <div class="pt-5 mt-4 flex items-center justify-between" :style="dashedBorderStyle">
              <div class="text-xs font-serif" :style="{ color: inkMuted }">
                探索 · 创作 · 验证 · 归档
              </div>
              <!-- 火漆印章 -->
              <div
                class="w-12 h-12 rounded-full flex items-center justify-center rotate-12 select-none shrink-0"
                :style="waxSealStyle"
                title="侦探特许签印"
              >
                <span class="font-serif font-black text-lg">{{ is401Expired ? '封' : '探' }}</span>
              </div>
            </div>

          </div>

          <!-- 中央书脊折痕缓冲区域 -->
          <div class="hidden lg:block lg:w-[8%]" />

          <!-- ══════════════════════════════════════════════
               右页：开放平台通行证（支持 登录 / 注册）
               ══════════════════════════════════════════════ -->
          <div class="lg:w-[46%] flex flex-col justify-between pl-4 lg:pl-4 pt-6 lg:pt-0">

            <div>
              <!-- 【顶栏基线行】：登录 / 注册 Tab 切换，与左页标签严格对齐 -->
              <div class="h-7 flex items-center justify-between mb-4">
                <div class="flex items-center gap-4 text-xs font-serif">
                  <button
                    type="button"
                    @click="switchMode('login')"
                    class="cursor-pointer pb-0.5 transition font-bold"
                    :class="authMode === 'login' ? 'border-b-2' : 'opacity-60 hover:opacity-100'"
                    :style="{
                      color: authMode === 'login' ? inkText : inkMuted,
                      borderColor: '#7E2F22',
                    }"
                  >
                    侦探登录
                  </button>
                  <button
                    type="button"
                    @click="switchMode('register')"
                    class="cursor-pointer pb-0.5 transition font-bold"
                    :class="authMode === 'register' ? 'border-b-2' : 'opacity-60 hover:opacity-100'"
                    :style="{
                      color: authMode === 'register' ? inkText : inkMuted,
                      borderColor: '#7E2F22',
                    }"
                  >
                    注册新侦探
                  </button>
                </div>
                <div class="text-xs font-mono tracking-wider opacity-75" :style="{ color: inkFaint }">
                  {{ authMode === 'login' ? 'ACCESS CLEARANCE' : 'NEW DOSSIER' }}
                </div>
              </div>

              <!-- 【标题基线行】：视觉重心放大，与左页大标题对齐 -->
              <div class="min-h-[76px] flex flex-col justify-end mb-6">
                <h2
                  class="text-2xl sm:text-3xl font-serif font-black leading-tight tracking-wide"
                  :style="{ color: inkText }"
                >
                  {{ is401Expired ? '重新签发通行凭证' : authMode === 'login' ? '侦探档案通行验证' : '注册新侦探身份' }}
                </h2>
                <p class="mt-1 text-xs sm:text-sm font-sans" :style="{ color: inkMuted }">
                  {{ authMode === 'login'
                    ? '核验警号与口令，进入探案大厅与创作工坊。'
                    : '创建你的专属代号，自由开启探案与案卷创作之旅。' }}
                </p>
              </div>

              <!-- 401 会话失效提示 -->
              <div
                v-if="is401Expired"
                class="mb-3 p-2 rounded border text-xs flex items-center gap-2"
                :style="{
                  background: 'rgba(168,40,22,0.12)',
                  borderColor: 'rgba(168,40,22,0.4)',
                  color: '#8A2416',
                }"
              >
                <ShieldAlert class="w-4 h-4 shrink-0" />
                <span class="truncate">{{ expiredReason || '会话凭证已过期（401），请重新验证登录。' }}</span>
              </div>

              <!-- 表单输入区：填写线形式 -->
              <form @submit.prevent="handleSubmit" class="space-y-3.5">
                <!-- 警号 / 通行代号 -->
                <div>
                  <label class="block text-xs font-serif font-bold mb-1" :style="{ color: inkText }">
                    {{ authMode === 'login' ? '侦探警号 / 通行代号' : '设置警号 / 通行代号' }}
                  </label>
                  <div class="relative pb-1 border-b" :style="{ borderColor: inkLine }">
                    <input
                      v-model="badgeInput"
                      type="text"
                      autocomplete="username"
                      :placeholder="authMode === 'login' ? '例如 CID-8492 或自定义账号' : '例如 DET-9901'"
                      class="w-full bg-transparent outline-none font-mono text-sm tracking-wider"
                      :style="{ color: inkText, caretColor: '#7E2F22' }"
                    />
                  </div>
                </div>

                <!-- 昵称/姓名（仅注册时显示） -->
                <div v-if="authMode === 'register'">
                  <label class="block text-xs font-serif font-bold mb-1" :style="{ color: inkText }">
                    侦探名号 / 创作者头衔 (可选)
                  </label>
                  <div class="relative pb-1 border-b" :style="{ borderColor: inkLine }">
                    <input
                      v-model="nicknameInput"
                      type="text"
                      placeholder="例如 夏洛克 · 咨询侦探"
                      class="w-full bg-transparent outline-none font-sans text-sm"
                      :style="{ color: inkText, caretColor: '#7E2F22' }"
                    />
                  </div>
                </div>

                <!-- 通行口令 -->
                <div>
                  <label class="block text-xs font-serif font-bold mb-1" :style="{ color: inkText }">
                    {{ authMode === 'login' ? '通行口令' : '设置通行口令 (至少 4 位)' }}
                  </label>
                  <div class="relative pb-1 border-b" :style="{ borderColor: inkLine }">
                    <input
                      v-model="passcodeInput"
                      :type="showPassword ? 'text' : 'password'"
                      autocomplete="current-password"
                      placeholder="输入口令"
                      class="w-full bg-transparent outline-none font-mono text-sm tracking-wider pr-8"
                      :style="{ color: inkText, caretColor: '#7E2F22' }"
                    />
                    <button
                      type="button"
                      @click="showPassword = !showPassword"
                      class="absolute right-0 top-0 p-1 cursor-pointer transition-opacity hover:opacity-100 opacity-60"
                      :style="{ color: inkText }"
                    >
                      <EyeOff v-if="showPassword" class="w-4 h-4" />
                      <Eye v-else class="w-4 h-4" />
                    </button>
                  </div>
                </div>

                <!-- 保持登录 / 模式快速切换链接 -->
                <div class="flex items-center justify-between text-xs font-serif pt-1">
                  <label class="flex items-center gap-1.5 cursor-pointer">
                    <input
                      v-model="rememberMe"
                      type="checkbox"
                      class="rounded cursor-pointer"
                      style="accent-color: #7E2F22;"
                    />
                    <span :style="{ color: inkMuted }">30 天内保持登录</span>
                  </label>

                  <button
                    type="button"
                    @click="switchMode(authMode === 'login' ? 'register' : 'login')"
                    class="cursor-pointer hover:underline"
                    :style="{ color: isDark ? '#DFB36C' : '#7E2F22' }"
                  >
                    {{ authMode === 'login' ? '没有通行证？注册新侦探' : '已有代号？直接登录' }}
                  </button>
                </div>

                <!-- 状态单行提示 -->
                <div class="h-5 flex items-center">
                  <div
                    v-if="errorMessage"
                    class="text-xs flex items-center gap-1.5 animate-shake"
                    :style="{ color: '#8F2414' }"
                  >
                    <AlertCircle class="w-3.5 h-3.5 shrink-0" />
                    <span>{{ errorMessage }}</span>
                  </div>
                  <div
                    v-else-if="successMessage"
                    class="text-xs flex items-center gap-1.5"
                    :style="{ color: '#2F5A3A' }"
                  >
                    <CheckCircle2 class="w-3.5 h-3.5 shrink-0" />
                    <span>{{ successMessage }}</span>
                  </div>
                </div>

                <!-- 48px 实体朱红按压按钮 -->
                <button
                  type="submit"
                  :disabled="isLoading"
                  class="w-full h-12 rounded-[10px] flex items-center justify-center gap-2 font-serif font-bold text-sm tracking-[0.2em] cursor-pointer transition-transform active:translate-y-[3px] active:shadow-none disabled:opacity-50 disabled:cursor-not-allowed"
                  :style="submitBtnStyle"
                >
                  <span v-if="isLoading" class="flex items-center gap-2">
                    <span class="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                    <span>{{ authMode === 'login' ? '核验中...' : '注册中...' }}</span>
                  </span>
                  <span v-else class="flex items-center gap-2">
                    <span>{{ authMode === 'login' ? '核验并进入平台' : '注册并激活通行证' }}</span>
                    <ArrowRight class="w-4 h-4" />
                  </span>
                </button>
              </form>
            </div>

            <!-- 【底栏基线行】：体验账号，与左页同一水平基线对齐 -->
            <div class="pt-5 mt-4" :style="dashedBorderStyle">
              <div
                class="flex items-center gap-3 text-xs font-serif flex-wrap h-12 items-center"
                :style="{ color: inkMuted }"
              >
                <span>体验账号</span>
                <button
                  v-for="acc in PRESET_ACCOUNTS"
                  :key="acc.badgeNo"
                  type="button"
                  @click="handleSelectPreset(acc.badgeNo, acc.passcode)"
                  class="cursor-pointer transition underline-offset-2 hover:underline"
                  :style="{
                    color: badgeInput === acc.badgeNo && authMode === 'login' ? '#7E2F22' : inkMuted,
                    fontWeight: badgeInput === acc.badgeNo && authMode === 'login' ? '700' : '400',
                  }"
                >
                  {{ acc.user.name.split('（')[0].split('(')[0] }}
                </button>
              </div>
            </div>

          </div>

        </div>
      </div>
    </main>
  </div>
</template>

<style scoped>
input::placeholder {
  color: rgba(74, 56, 34, 0.55);
}

@keyframes shake {
  0%, 100% { transform: translateX(0); }
  20%, 60%  { transform: translateX(-4px); }
  40%, 80%  { transform: translateX(4px); }
}
.animate-shake { animation: shake 0.4s ease-in-out; }

@keyframes fadeIn {
  from { opacity: 0; transform: scale(0.98) translateY(8px); }
  to   { opacity: 1; transform: scale(1) translateY(0); }
}
.animate-fade-in { animation: fadeIn 0.35s cubic-bezier(0.16, 1, 0.3, 1); }
</style>
