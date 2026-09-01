/**
 * Utility function to extract error message from API errors
 */
type ErrorWithResponse = {
  response?: {
    data?: {
      message?: unknown;
    };
  };
};

const hasResponse = (error: unknown): error is ErrorWithResponse => (
  typeof error === 'object' && error !== null
);

export const getErrorMessage = (error: unknown, defaultMessage: string): string => {
  if (hasResponse(error) && typeof error.response?.data?.message === 'string') {
    return error.response.data.message;
  }

  return error instanceof Error && error.message ? error.message : defaultMessage;
};
