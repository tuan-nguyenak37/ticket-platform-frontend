import { AxiosError } from 'axios';

export interface NestErrorPayload {
  statusCode?: number;
  message?: string | string[];
  error?: string;
}

export class AppApiError extends Error {
  retryAfterSeconds?: number;
  statusCode: number;
  error?: string;
  rawDetails?: string | string[];

  constructor(message: string, statusCode = 500, error?: string, rawDetails?: string | string[]) {
    super(message);
    this.name = 'AppApiError';
    this.statusCode = statusCode;
    this.error = error;
    this.rawDetails = rawDetails;
  }
}

/**
 * Trích xuất và chuẩn hóa thông báo lỗi từ NestJS / Axios
 */
export function formatHttpError(error: unknown): AppApiError {
  if (error instanceof AppApiError) {
    return error;
  }

  if (error && typeof error === 'object' && 'isAxiosError' in error) {
    const axiosError = error as AxiosError<NestErrorPayload>;
    const response = axiosError.response;

    if (!response) {
      if (axiosError.code === 'ECONNABORTED') {
        return new AppApiError('Hết thời gian chờ phản hồi từ máy chủ (Timeout).', 408);
      }
      return new AppApiError(
        'Chưa thể kết nối đến hệ thống. Vui lòng kiểm tra mạng và thử lại.',
        0
      );
    }

    const { statusCode = response.status, message, error: errorType } = response.data || {};

    let formattedMessage = 'Đã có lỗi xảy ra từ máy chủ.';

    if (Array.isArray(message)) {
      formattedMessage = message.join(', ');
    } else if (typeof message === 'string' && message.trim().length > 0) {
      formattedMessage = message;
    } else if (typeof errorType === 'string' && errorType.trim().length > 0) {
      formattedMessage = errorType;
    } else if (response.statusText) {
      formattedMessage = response.statusText;
    }

    const failure = new AppApiError(formattedMessage, statusCode, errorType, message);
    const retryAfter = response.headers?.['retry-after'];
    if (retryAfter != null) {
      const seconds = Number(retryAfter);
      const delay = Number.isFinite(seconds) ? seconds : (Date.parse(String(retryAfter)) - Date.now()) / 1000;
      if (Number.isFinite(delay)) failure.retryAfterSeconds = Math.max(0, Math.ceil(delay));
    }
    return failure;
  }

  if (error instanceof Error) {
    return new AppApiError(error.message, 500);
  }

  return new AppApiError('Đã có lỗi không xác định xảy ra.', 500);
}
