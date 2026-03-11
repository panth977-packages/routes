import type { F } from '@panth977/functions';

export type ApiRequestConfig<T extends 'json' | 'arraybuffer' | 'text' | 'none' = 'json' | 'arraybuffer' | 'text' | 'none'> = {
  url: string;
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE';
  baseURL?: string;
  headers?: Record<string, string>;
  params?: Record<string, string | string[] | undefined | null | number>;
  data?: any;
  responseType: T;
  validateStatus?: (statusCode: number) => boolean;
};
export type ApiResponse<D = any> = {
  data: D;
  status: number;
  headers: Headers;
};

export async function apiRequest(context: F.Context, config: ApiRequestConfig<'none'>): Promise<ApiResponse<null>>;
export async function apiRequest(context: F.Context, config: ApiRequestConfig<'json'>): Promise<ApiResponse<any>>;
export async function apiRequest(context: F.Context, config: ApiRequestConfig<'arraybuffer'>): Promise<ApiResponse<ArrayBuffer>>;
export async function apiRequest(context: F.Context, config: ApiRequestConfig<'text'>): Promise<ApiResponse<string>>;
export async function apiRequest(context: F.Context, config: ApiRequestConfig): Promise<ApiResponse<any>> {
  const {
    url,
    method = 'GET',
    baseURL,
    headers = {},
    params,
    data,
    responseType = 'json',
    validateStatus,
  } = config;

  // 1. URL Construction
  const fullUrl = new URL(url, baseURL);
  for (const key in params) {
    const val = params[key];
    if (Array.isArray(val)) {
      for (const v of val) {
        fullUrl.searchParams.append(key + '[]', v);
      }
    } else if (typeof val === 'string') {
      fullUrl.searchParams.append(key, val);
    } else if (typeof val === 'number') {
      fullUrl.searchParams.append(key, val.toString());
    } else {
      //
    }
  }

  // 2. Request Body Preparation
  let body = data;
  const finalHeaders = { ...headers };
  if (data && typeof data === 'object' && !(data instanceof ArrayBuffer)) {
    body = JSON.stringify(data);
    finalHeaders['Content-Type'] = 'application/json';
  }
  try {
    context.logDebug('ApiRequest:', {
      url: fullUrl.toString(),
      method,
      headers: finalHeaders,
      body: method !== 'GET' ? body : undefined,
    });
    const response = await fetch(fullUrl.toString(), {
      method,
      headers: finalHeaders,
      body: method !== 'GET' ? body : undefined,
    });

    // 4. Handle non-2xx status codes using our custom error
    if (validateStatus ? validateStatus(response.status) : !response.ok) {
      throw new ApiError(
        `Request failed with status ${response.status}`,
        response,
        await response.text(),
        config,
      );
    }

    // 3. Parse Response based on type
    let responseData;
    if (responseType === 'none') {
      responseData = null;
    } else if (responseType === 'arraybuffer') {
      responseData = await response.arrayBuffer();
    } else if (responseType === 'json') {
      // Check if body exists before parsing to avoid syntax errors on empty responses
      const text = await response.text();
      responseData = text ? JSON.parse(text) : null;
    } else {
      responseData = await response.text();
    }

    return { data: responseData, status: response.status, headers: response.headers };
  } catch (err) {
    if (err instanceof ApiError) throw err;
    context.logError('RequestError:', err);
    if (err instanceof Error) throw new ApiError(err.message, undefined, err.message, config);
    throw new ApiError('Unknown Error', undefined, 'Unknown Error', config);
  }
}

export class ApiError extends Error {
  status: number;
  statusText: string;
  data: string;
  config: any;

  constructor(message: string, response: Response | undefined, data: string, config: any) {
    super(message);
    this.name = 'ApiError';
    this.status = response?.status ?? 0;
    this.statusText = response?.statusText ?? 'Unknown';
    this.data = data;
    this.config = config;
    Object.setPrototypeOf(this, ApiError.prototype);
  }
}
