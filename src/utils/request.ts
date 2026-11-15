/**
 * AI Detective 全局网络请求层 (基于 Axios)
 * 具备生产级工业化体验：
 * 1. 统一配置 Axios 实例 (BaseURL、15s 超时熔断)
 * 2. 请求拦截器：自动读取并注入本地 localStorage 侦探凭据 (Bearer Token)
 * 3. 响应拦截器：自动解包 response.data，统一错误模型 ApiError
 * 4. 401 权限失效机制：自动捕获 HTTP 401 并广播 triggerUnauthorized 调起绝密核验弹窗
 * 5. TypeScript 全量泛型支持
 */

import axios, {
  type AxiosInstance,
  type AxiosRequestConfig,
  type AxiosResponse,
  type InternalAxiosRequestConfig,
  AxiosError,
} from 'axios';

// 扩展 Axios 配置参数
export interface RequestConfig<D = any> extends AxiosRequestConfig<D> {
  skipAuth?: boolean;
  skipErrorHandler?: boolean;
}

export interface StandardApiResponse<T = any> {
  success?: boolean;
  code?: number;
  data?: T;
  error?: string;
  message?: string;
  [key: string]: any;
}

// 统一业务错误模型
export class ApiError extends Error {
  public status: number;
  public code?: number | string;
  public details?: any;

  constructor(message: string, status = 500, code?: number | string, details?: any) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.code = code;
    this.details = details;
  }
}

// 全局 401 授权失败侦听器
type UnauthorizedHandler = (reason: string) => void;
const unauthorizedHandlers: Set<UnauthorizedHandler> = new Set();

export function onUnauthorized(handler: UnauthorizedHandler): () => void {
  unauthorizedHandlers.add(handler);
  return () => {
    unauthorizedHandlers.delete(handler);
  };
}

export function triggerUnauthorized(reason = '侦探身份认证签名已过期 (HTTP 401 Unauthorized)'): void {
  unauthorizedHandlers.forEach((handler) => {
    try {
      handler(reason);
    } catch (e) {
      console.error('[Axios Request Layer] 401 联动处理失败:', e);
    }
  });
}

// 获取默认 API BaseURL
const defaultBaseUrl =
  (typeof import.meta !== 'undefined' && (import.meta as any).env?.VITE_API_BASE_URL) || '/api';

// 创建全局底层 Axios 实例
const service: AxiosInstance = axios.create({
  baseURL: defaultBaseUrl,
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// 请求拦截器
service.interceptors.request.use(
  (config: InternalAxiosRequestConfig & { skipAuth?: boolean }) => {
    // 自动挂载侦探 Bearer Token
    if (!config.skipAuth) {
      const token =
        typeof localStorage !== 'undefined'
          ? localStorage.getItem('ai_detective_auth_token')
          : null;
      if (token && config.headers) {
        config.headers.set('Authorization', `Bearer ${token}`);
      }
    }
    return config;
  },
  (error: AxiosError) => {
    return Promise.reject(error);
  }
);

// 响应拦截器
service.interceptors.response.use(
  (response: AxiosResponse) => {
    // 自动解包 response.data，方便调用方直接获取业务数据
    return response.data;
  },
  (error: AxiosError<any>) => {
    const status = error.response?.status || (error.code === 'ECONNABORTED' ? 408 : 500);
    const responseData = error.response?.data;
    const message =
      responseData?.error ||
      responseData?.message ||
      (error.code === 'ECONNABORTED' ? '请求超时 (15000ms)，请检查网络连接' : error.message) ||
      '网络请求异常，无法连接至调查总署服务器';

    // 401 状态自动触发全局身份失效机制
    if (status === 401) {
      triggerUnauthorized(message || '侦探身份核验失效，请重新出示警号凭证');
    }

    const apiError = new ApiError(
      message,
      status,
      responseData?.code || error.code || status,
      responseData
    );

    return Promise.reject(apiError);
  }
);

// 包装具有泛型返回能力的 request 全局函数
export interface HttpRequestFunction {
  <T = any>(config: RequestConfig): Promise<T>;
  <T = any>(url: string, config?: RequestConfig): Promise<T>;
  get<T = any>(url: string, config?: RequestConfig): Promise<T>;
  get<T = any>(url: string, params?: Record<string, any>, config?: RequestConfig): Promise<T>;
  post<T = any>(url: string, data?: any, config?: RequestConfig): Promise<T>;
  put<T = any>(url: string, data?: any, config?: RequestConfig): Promise<T>;
  delete<T = any>(url: string, config?: RequestConfig): Promise<T>;
  patch<T = any>(url: string, data?: any, config?: RequestConfig): Promise<T>;
  getBaseURL(): string;
  setBaseURL(url: string): void;
  interceptors: typeof service.interceptors;
  axiosInstance: AxiosInstance;
}

const requestHandler = function <T = any>(
  urlOrConfig: string | RequestConfig,
  config?: RequestConfig
): Promise<T> {
  if (typeof urlOrConfig === 'string') {
    return service.request<any, T>({ url: urlOrConfig, ...config }) as unknown as Promise<T>;
  }
  return service.request<any, T>(urlOrConfig) as unknown as Promise<T>;
} as HttpRequestFunction;

// 挂载快捷方法
requestHandler.get = function <T = any>(
  url: string,
  paramsOrConfig?: Record<string, any> | RequestConfig,
  customConfig?: RequestConfig
): Promise<T> {
  if (
    paramsOrConfig &&
    ('params' in paramsOrConfig || 'headers' in paramsOrConfig || 'skipAuth' in paramsOrConfig)
  ) {
    return service.get<any, T>(url, paramsOrConfig as AxiosRequestConfig) as unknown as Promise<T>;
  }
  return service.get<any, T>(url, {
    params: paramsOrConfig,
    ...customConfig,
  }) as unknown as Promise<T>;
};

requestHandler.post = function <T = any>(
  url: string,
  data?: any,
  config?: RequestConfig
): Promise<T> {
  return service.post<any, T>(url, data, config) as unknown as Promise<T>;
};

requestHandler.put = function <T = any>(
  url: string,
  data?: any,
  config?: RequestConfig
): Promise<T> {
  return service.put<any, T>(url, data, config) as unknown as Promise<T>;
};

requestHandler.delete = function <T = any>(url: string, config?: RequestConfig): Promise<T> {
  return service.delete<any, T>(url, config) as unknown as Promise<T>;
};

requestHandler.patch = function <T = any>(
  url: string,
  data?: any,
  config?: RequestConfig
): Promise<T> {
  return service.patch<any, T>(url, data, config) as unknown as Promise<T>;
};

requestHandler.getBaseURL = function (): string {
  return (service.defaults.baseURL as string) || '';
};

requestHandler.setBaseURL = function (url: string): void {
  service.defaults.baseURL = url;
};

requestHandler.interceptors = service.interceptors;
requestHandler.axiosInstance = service;

// 导出单例与兼容默认导出
export const request = requestHandler;
export default request;
