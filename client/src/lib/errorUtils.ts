/**
 * Utility function to extract error message from API errors
 */
export type ApiErrorLike = Error | {
  message?: string;
  response?: {
    data?: {
      message?: string;
    };
  };
} | null | undefined;

export const getErrorMessage = (error: ApiErrorLike, defaultMessage: string): string => {
  if (error && 'response' in error && error.response?.data?.message) {
    return String(error.response.data.message);
  }

  if (error instanceof Error && error.message) {
    return error.message;
  }

  return defaultMessage;
};

