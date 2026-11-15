import { ref, computed } from 'vue';
import { sound } from '../utils/audio';
import { onUnauthorized } from '../utils/request';
import { login } from '../api/auth';

export interface DetectiveUser {
  id: string;
  badgeNo: string;
  name: string;
  title: string;
  clearanceLevel: string;
  station: string;
  initials: string;
}

const STORAGE_KEY_AUTH = 'ai_detective_auth_token';
const STORAGE_KEY_USER = 'ai_detective_auth_user';

// 状态单例管理
const token = ref<string | null>(localStorage.getItem(STORAGE_KEY_AUTH));
const storedUserRaw = localStorage.getItem(STORAGE_KEY_USER);

const currentUser = ref<DetectiveUser | null>(
  storedUserRaw ? JSON.parse(storedUserRaw) : null
);

export type AuthStatus = 'authenticated' | 'expired_401' | 'unauthenticated';

const authStatus = ref<AuthStatus>(
  token.value && storedUserRaw ? 'authenticated' : 'unauthenticated'
);

const expiredReason = ref<string>('');
const isLoginModalOpen = ref<boolean>(false);

const trigger401 = (reason?: string) => {
  sound.playHeartbeatTick();
  authStatus.value = 'expired_401';
  expiredReason.value = reason || '侦探身份认证会话签名已过期，调度凭证失效 (HTTP 401 Unauthorized)。';
  token.value = null;
  currentUser.value = null;
  localStorage.removeItem(STORAGE_KEY_AUTH);
  localStorage.removeItem(STORAGE_KEY_USER);
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
    username: string,
    passcode: string
  ): Promise<{ success: boolean; message: string }> => {
    sound.playPaperRustle();

    const cleanUsername = username.trim();
    const cleanPassword = passcode.trim();

    if (!cleanUsername) {
      return { success: false, message: '请输入用户名 / 账号' };
    }
    if (!cleanPassword) {
      return { success: false, message: '请输入登录口令' };
    }

    try {
      const res = await login({ username: cleanUsername, password: cleanPassword });
      if (res && res.code === 200 && res.data) {
        const customUser: DetectiveUser = {
          id: String(res.data.id),
          badgeNo: res.data.username,
          name: res.data.nickname || res.data.username,
          title: res.data.status === 1 ? '高级侦查特派员' : '受限调查员',
          clearanceLevel: res.data.status === 1 ? 'LEVEL-IV [全权调阅]' : 'LEVEL-II [常规案卷查阅]',
          station: res.data.email || '特别侦查总署',
          initials: (res.data.nickname || res.data.username).slice(0, 1),
        };
        const authToken = (res.data as any).token || `jwt_${res.data.username}_${Date.now()}`;
        token.value = authToken;
        currentUser.value = customUser;
        authStatus.value = 'authenticated';
        expiredReason.value = '';
        localStorage.setItem(STORAGE_KEY_AUTH, authToken);
        localStorage.setItem(STORAGE_KEY_USER, JSON.stringify(customUser));
        isLoginModalOpen.value = false;
        sound.playClueFound();
        return { success: true, message: res.msg || '身份核验通过，欢迎登录！' };
      }
      return { success: false, message: res?.msg || '用户名或密码错误' };
    } catch (apiErr: any) {
      return { success: false, message: apiErr.message || '登录请求失败，请检查服务连接' };
    }
  };

  const registerUser = async (
    username: string,
    passcode: string,
    nickname?: string
  ): Promise<{ success: boolean; message: string }> => {
    sound.playPaperRustle();
    const cleanUser = username.trim();
    if (!cleanUser || passcode.trim().length < 4) {
      return { success: false, message: '通行口令长度至少需为 4 位。' };
    }
    return { success: false, message: '注册接口维护中，请联系管理员分配账号。' };
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
    isLoginModalOpen.value = false;
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
  };
}
