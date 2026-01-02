/**
 * 统一的 API 客户端
 * 处理认证失败、错误响应等通用逻辑
 */

/**
 * API 响应类型
 */
export interface ApiResponse<T = any> {
  data?: T;
  error?: string | string[] | any;
}

/**
 * API 客户端配置
 */
interface ApiClientConfig {
  baseUrl?: string;
  onUnauthorized?: () => void;
}

/**
 * 创建 API 客户端
 */
class ApiClient {
  private baseUrl: string;
  private onUnauthorized: () => void;

  constructor(config: ApiClientConfig = {}) {
    this.baseUrl = config.baseUrl || '/api';
    this.onUnauthorized = config.onUnauthorized || (() => {
      // 默认行为：跳转到登录页
      if (typeof window !== 'undefined') {
        const currentPath = window.location.pathname;
        window.location.href = `/auth/signin?callbackUrl=${encodeURIComponent(currentPath)}`;
      }
    });
  }

  /**
   * 处理响应
   */
  private async handleResponse<T>(response: Response): Promise<ApiResponse<T>> {
    // 处理 401 未授权
    if (response.status === 401) {
      this.onUnauthorized();
      throw new Error('Unauthorized');
    }

    const data = await response.json();

    if (!response.ok) {
      return {
        error: data.error || '请求失败',
      };
    }

    return {
      data: data as T,
    };
  }

  /**
   * 发送请求
   */
  async request<T = any>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    const url = endpoint.startsWith('http') 
      ? endpoint 
      : `${this.baseUrl}${endpoint}`;

    const defaultOptions: RequestInit = {
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
    };

    try {
      const response = await fetch(url, {
        ...defaultOptions,
        ...options,
        headers: {
          ...defaultOptions.headers,
          ...options.headers,
        },
      });

      return await this.handleResponse<T>(response);
    } catch (error: any) {
      // 网络错误或其他错误
      if (error.message === 'Unauthorized') {
        throw error; // 让调用者知道是认证错误
      }
      return {
        error: error.message || '网络错误',
      };
    }
  }

  /**
   * GET 请求
   */
  async get<T = any>(endpoint: string, options?: RequestInit): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      ...options,
      method: 'GET',
    });
  }

  /**
   * POST 请求
   */
  async post<T = any>(
    endpoint: string,
    body?: any,
    options?: RequestInit
  ): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      ...options,
      method: 'POST',
      body: body ? JSON.stringify(body) : undefined,
    });
  }

  /**
   * PUT 请求
   */
  async put<T = any>(
    endpoint: string,
    body?: any,
    options?: RequestInit
  ): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      ...options,
      method: 'PUT',
      body: body ? JSON.stringify(body) : undefined,
    });
  }

  /**
   * PATCH 请求
   */
  async patch<T = any>(
    endpoint: string,
    body?: any,
    options?: RequestInit
  ): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      ...options,
      method: 'PATCH',
      body: body ? JSON.stringify(body) : undefined,
    });
  }

  /**
   * DELETE 请求
   */
  async delete<T = any>(endpoint: string, options?: RequestInit): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      ...options,
      method: 'DELETE',
    });
  }
}

// 导出默认实例
export const apiClient = new ApiClient();

// 导出类，允许创建自定义实例
export { ApiClient };

