/**
 * 侦探身份认证与系统健康检查 API
 */

import { request } from '../utils/request';
import type { DetectiveUser } from '../composables/useAuth';

export interface LoginParams {
  badgeNo: string;
  passcode: string;
}

export interface LoginResult {
  success: boolean;
  token?: string;
  user?: DetectiveUser;
  error?: string;
}

export interface HealthCheckResult {
  status: string;
  geminiConfigured: boolean;
  roomsCount: number;
  timestamp: string;
}

/**
 * 侦探警号口令核验登录
 */
export function loginApi(params: LoginParams): Promise<LoginResult> {
  return request.post<LoginResult>('/auth/login', params, { skipAuth: true });
}

/**
 * 触发 401 Unauthorized 测试接口（验证自动拦截与弹窗流程）
 */
export function test401Api(): Promise<any> {
  return request.get('/auth/test-401');
}

/**
 * 服务端探案服务健康状态检查
 */
export function checkHealthApi(): Promise<HealthCheckResult> {
  return request.get<HealthCheckResult>('/health', undefined, { skipAuth: true });
}
