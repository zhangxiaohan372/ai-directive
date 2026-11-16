/**
 * 用户认证与系统 API
 * 对接 Java 后端 UserController (/user/login)
 */

import { request } from '../utils/request';

/**
 * 登录请求体入参 DTO
 */
export interface LoginParams {
  username: string;
  password: string;
}

/**
 * 登录成功脱敏用户信息 VO
 */
export interface UserData {
  id?: number | string;
  username?: string;
  userName?: string;
  password?: null | string;
  nickname?: string;
  nickName?: string;
  name?: string;
  email?: string;
  status?: number;
  token?: string;
  accessToken?: string;
  createTime?: string;
  updateTime?: string;
  [key: string]: any;
}

/**
 * 登录统一响应结果
 */
export interface LoginResponse {
  code: number;
  msg?: string;
  data: UserData | string | null;
  [key: string]: any;
}

/**
 * 服务端探案服务健康状态检查结果
 */
export interface HealthCheckResult {
  status: string;
  geminiConfigured: boolean;
  roomsCount: number;
  timestamp: string;
}

/**
 * 用户登录接口
 * POST http://localhost:8080/user/login
 *
 * @param params 登录凭证（用户名与密码）
 * @returns 统一返回结果（含脱敏用户信息与操作状态）
 */
export function login(params: LoginParams): Promise<LoginResponse> {
  return request.post<LoginResponse>('/user/login', params, { skipAuth: true });
}

/**
 * 用户注册接口
 * POST http://localhost:8080/user/register
 */
export function register(params: { username: string; password: string; nickname?: string }): Promise<LoginResponse> {
  return request.post<LoginResponse>('/user/register', params, { skipAuth: true });
}

/**
 * 兼容别名导出
 */
export const loginApi = login;
export const registerApi = register;

/**
 * 触发 401 Unauthorized 测试接口（验证自动拦截与弹窗流程）
 */
export function test401Api(): Promise<any> {
  return request.get('/api/auth/test-401');
}

/**
 * 服务端探案服务健康状态检查
 */
export function checkHealthApi(): Promise<HealthCheckResult> {
  return request.get<HealthCheckResult>('/api/health', undefined, { skipAuth: true });
}
