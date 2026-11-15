import { ref, computed } from 'vue';
import { sound } from '../utils/audio';
import { onUnauthorized } from '../utils/request';

export interface DetectiveUser {
  id: string;
  badgeNo: string;
  name: string;
  title: string;
  clearanceLevel: string;
  station: string;
  initials: string;
}

export const PRESET_ACCOUNTS: Array<{
  badgeNo: string;
  passcode: string;
  user: DetectiveUser;
}> = [
  {
    badgeNo: 'CID-8492',
    passcode: 'detective8492',
    user: {
      id: 'det_chen',
      badgeNo: 'CID-8492',
      name: '陈默 (特聘顾问)',
      title: '首席刑侦推理顾问',
      clearanceLevel: 'LEVEL-IV [绝密案卷全权调阅]',
      station: '市刑侦重案特别调查组 · 督察处',
      initials: '陈',
    },
  },
  {
    badgeNo: 'EXP-3011',
    passcode: 'logic3011',
    user: {
      id: 'det_lin',
      badgeNo: 'EXP-3011',
      name: '林岚 (策展特使)',
      title: '近代艺术史特邀鉴定专家',
      clearanceLevel: 'LEVEL-III [物证关联研析权]',
      station: '省立文保鉴定中心 · 涉案资产评估科',
      initials: '林',
    },
  },
  {
    badgeNo: 'FOR-7720',
    passcode: 'forensic7720',
    user: {
      id: 'det_xu',
      badgeNo: 'FOR-7720',
      name: '许凝 (法医痕检)',
      title: '高级法医微量痕检技术官',
      clearanceLevel: 'LEVEL-III [现场物证采样权]',
      station: '司法物证鉴定所 · 理化毒检实验室',
      initials: '许',
    },
  },
];

const STORAGE_KEY_AUTH = 'ai_detective_auth_token';
const STORAGE_KEY_USER = 'ai_detective_auth_user';

// State Singletons
const token = ref<string | null>(localStorage.getItem(STORAGE_KEY_AUTH));
const storedUserRaw = localStorage.getItem(STORAGE_KEY_USER);

const currentUser = ref<DetectiveUser | null>(
  storedUserRaw ? JSON.parse(storedUserRaw) : PRESET_ACCOUNTS[0].user
);

export type AuthStatus = 'authenticated' | 'expired_401' | 'unauthenticated';

const authStatus = ref<AuthStatus>(
  token.value || storedUserRaw ? 'authenticated' : 'authenticated'
);

const expiredReason = ref<string>('');
const isLoginModalOpen = ref<boolean>(false);

const trigger401 = (reason?: string) => {
  sound.playHeartbeatTick();
  authStatus.value = 'expired_401';
  expiredReason.value = reason || '侦探身份认证会话签名已过期，调度凭证失效 (HTTP 401 Unauthorized)。';
  token.value = null;
  localStorage.removeItem(STORAGE_KEY_AUTH);
  isLoginModalOpen.value = true;
};

// 自动侦听全局 HTTP 请求层 401 拦截器
onUnauthorized((reason) => {
  trigger401(reason);
});

export function useAuth() {
  const isAuthenticated = computed(() => authStatus.value === 'authenticated' && !!currentUser.value);
  const is401Expired = computed(() => authStatus.value === 'expired_401');

  const loginWithCredentials = async (
    badgeNo: string,
    passcode: string
  ): Promise<{ success: boolean; message: string }> => {
    sound.playPaperRustle();
    
    // Simulate brief network latency for Scotland Yard dossier authentication
    await new Promise((resolve) => setTimeout(resolve, 600));

    const matched = PRESET_ACCOUNTS.find(
      (acc) => acc.badgeNo.toUpperCase() === badgeNo.trim().toUpperCase()
    );

    if (!matched) {
      // Allow custom badge number if password is provided
      if (passcode.trim().length >= 4) {
        const customUser: DetectiveUser = {
          id: `det_${Date.now().toString(36)}`,
          badgeNo: badgeNo.trim().toUpperCase(),
          name: `警员 ${badgeNo.trim().toUpperCase()}`,
          title: '现场巡查侦探',
          clearanceLevel: 'LEVEL-II [常规案卷查阅]',
          station: '第一联合巡防分局 · 侦查大队',
          initials: '巡',
        };
        const mockToken = `mock_jwt_${Date.now()}_${Math.random().toString(36).substring(2)}`;
        token.value = mockToken;
        currentUser.value = customUser;
        authStatus.value = 'authenticated';
        expiredReason.value = '';
        localStorage.setItem(STORAGE_KEY_AUTH, mockToken);
        localStorage.setItem(STORAGE_KEY_USER, JSON.stringify(customUser));
        isLoginModalOpen.value = false;
        sound.playClueFound();
        return { success: true, message: '身份核验通过，已颁发临时侦探特许状。' };
      }
      return { success: false, message: '未查找到该侦探警号档案，或通行口令错误。' };
    }

    if (matched.passcode !== passcode.trim()) {
      return { success: false, message: '绝密印信口令不匹配，已记录安全审计日志。' };
    }

    const mockToken = `jwt_${matched.user.badgeNo}_${Date.now()}`;
    token.value = mockToken;
    currentUser.value = matched.user;
    authStatus.value = 'authenticated';
    expiredReason.value = '';
    localStorage.setItem(STORAGE_KEY_AUTH, mockToken);
    localStorage.setItem(STORAGE_KEY_USER, JSON.stringify(matched.user));
    isLoginModalOpen.value = false;
    sound.playClueFound();

    return { success: true, message: '侦探身份全权认证通过，已重新激活现场调度授权。' };
  };

  const registerUser = async (
    badgeNo: string,
    passcode: string,
    nickname?: string
  ): Promise<{ success: boolean; message: string }> => {
    sound.playPaperRustle();
    await new Promise((resolve) => setTimeout(resolve, 500));

    const cleanBadge = badgeNo.trim().toUpperCase();
    if (!cleanBadge || passcode.trim().length < 4) {
      return { success: false, message: '通行口令长度至少需为 4 位。' };
    }

    const matched = PRESET_ACCOUNTS.find(
      (acc) => acc.badgeNo.toUpperCase() === cleanBadge
    );
    if (matched) {
      return { success: false, message: '该警号/代号已存在，请直接登录或更换代号。' };
    }

    const nameStr = nickname?.trim() || `侦探 ${cleanBadge}`;
    const newUser: DetectiveUser = {
      id: `det_${Date.now().toString(36)}`,
      badgeNo: cleanBadge,
      name: nameStr,
      title: '特邀探案创作家',
      clearanceLevel: 'LEVEL-III [探案与工坊全权权限]',
      station: '特别侦查创作联合体 · 总署',
      initials: nameStr.slice(0, 1),
    };

    const mockToken = `jwt_${cleanBadge}_${Date.now()}`;
    token.value = mockToken;
    currentUser.value = newUser;
    authStatus.value = 'authenticated';
    expiredReason.value = '';
    localStorage.setItem(STORAGE_KEY_AUTH, mockToken);
    localStorage.setItem(STORAGE_KEY_USER, JSON.stringify(newUser));
    isLoginModalOpen.value = false;
    sound.playClueFound();

    return { success: true, message: '新侦探通行档案注册成功，已颁发探案与创作双重特许！' };
  };

  const logout = () => {
    sound.playPaperRustle();
    token.value = null;
    currentUser.value = null;
    authStatus.value = 'unauthenticated';
    expiredReason.value = '您已安全交回物证档案与侦探勋章并主动注销会话。';
    localStorage.removeItem(STORAGE_KEY_AUTH);
    localStorage.removeItem(STORAGE_KEY_USER);
    isLoginModalOpen.value = true;
  };

  const openLogin = () => {
    sound.playPaperRustle();
    isLoginModalOpen.value = true;
  };

  const closeLogin = () => {
    // If not authenticated or in 401 state, require login or fallback
    if (!isAuthenticated.value) {
      // auto fallback to guest/preset for smooth demo
      loginWithCredentials('CID-8492', 'detective8492');
    }
    isLoginModalOpen.value = false;
  };

  // Mock API fetch wrapper that intercepts 401
  const mockApiRequest = async (endpoint: string, options?: { simulate401?: boolean }) => {
    if (options?.simulate401 || !token.value) {
      trigger401(`请求接口 [${endpoint}] 时服务器返回 401 认证失败：Token 凭证已过期。`);
      throw new Error('HTTP 401 Unauthorized');
    }
    return { status: 200, data: { ok: true, timestamp: Date.now() } };
  };

  return {
    currentUser,
    token,
    authStatus,
    isAuthenticated,
    is401Expired,
    expiredReason,
    isLoginModalOpen,
    trigger401,
    loginWithCredentials,
    registerUser,
    logout,
    openLogin,
    closeLogin,
    mockApiRequest,
  };
}
