import { AxiosError } from 'axios';

export interface NestErrorPayload {
  statusCode?: number;
  message?: string | string[];
  error?: string;
}

export class AppApiError extends Error {
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
        'Không thể kết nối tới máy chủ backend (Port 7000). Vui lòng kiểm tra lại dịch vụ.',
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

    return new AppApiError(formattedMessage, statusCode, errorType, message);
  }

  if (error instanceof Error) {
    return new AppApiError(error.message, 500);
  }

  return new AppApiError('Đã có lỗi không xác định xảy ra.', 500);
}
