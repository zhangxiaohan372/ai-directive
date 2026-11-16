import { ref, computed } from 'vue';
import { sound } from '../utils/audio';
import { onUnauthorized } from '../utils/request';
import { login, register } from '../api/auth';

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
      const isSuccess = Boolean(
        res && (res.code === 200 || res.code === 0 || (res as any).success === true)
      );

      if (isSuccess) {
        const rawData = res.data;
        // 支持嵌套用户数据，例如 { user: {...} } 或 { userInfo: {...} }
        const nestedUser =
          rawData && typeof rawData === 'object'
            ? (rawData as any).user || (rawData as any).userInfo || (rawData as any).principal
            : null;

        const userObj: Record<string, any> =
          nestedUser && typeof nestedUser === 'object'
            ? nestedUser
            : rawData && typeof rawData === 'object'
            ? (rawData as Record<string, any>)
            : {};

        const resolvedId = String(
          userObj.id ?? userObj.userId ?? userObj.uid ?? (typeof rawData === 'number' ? rawData : Date.now())
        );

        const resolvedBadgeNo = String(
          userObj.username ||
          userObj.userName ||
          userObj.account ||
          userObj.badgeNo ||
          cleanUsername
        );

        const resolvedName = String(
          userObj.nickname ||
          userObj.nickName ||
          userObj.name ||
          userObj.realName ||
          userObj.username ||
          userObj.userName ||
          cleanUsername
        );

        const resolvedEmail = String(
          userObj.email || userObj.mail || userObj.dept || userObj.department || '特别侦查总署'
        );

        const statusVal = userObj.status;
        const isSenior = statusVal === 1 || statusVal === undefined || statusVal === null;

        // 计算首字母缩写：确保绝对安全，不调用任何 undefined 的方法
        const safeInitials = (resolvedName.trim().charAt(0) || cleanUsername.charAt(0) || '侦').toUpperCase();

        const customUser: DetectiveUser = {
          id: resolvedId,
          badgeNo: resolvedBadgeNo,
          name: resolvedName,
          title: isSenior ? '高级侦查特派员' : '受限调查员',
          clearanceLevel: isSenior ? 'LEVEL-IV [全权调阅]' : 'LEVEL-II [常规案卷查阅]',
          station: resolvedEmail,
          initials: safeInitials,
        };

        // 提取安全 Token（支持 token 字符串、token 属性、accessToken 属性等）
        let authToken = '';
        if (typeof rawData === 'string' && rawData.trim()) {
          authToken = rawData.trim();
        } else if (rawData && typeof rawData === 'object') {
          authToken =
            (rawData as any).token ||
            (rawData as any).accessToken ||
            (rawData as any).jwt ||
            (rawData as any).tokenValue ||
            (nestedUser && ((nestedUser as any).token || (nestedUser as any).accessToken)) ||
            `jwt_${resolvedBadgeNo}_${Date.now()}`;
        } else {
          authToken = `jwt_${resolvedBadgeNo}_${Date.now()}`;
        }

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
    try {
      const res = await register({
        username: cleanUser,
        password: passcode.trim(),
        nickname: nickname?.trim(),
      });
      if (res && (res.code === 200 || res.code === 0 || (res as any).success === true)) {
        return { success: true, message: res.msg || '侦探凭证登记成功，请立即核验登录！' };
      }
      return { success: false, message: res?.msg || '登记失败，请核对输入信息' };
    } catch (e: any) {
      return { success: false, message: e.message || '注册接口维护中，请联系管理员分配账号。' };
    }
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
