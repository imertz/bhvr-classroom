// shared/src/types/common.ts

/**
 * Generic response for a list of items
 */
export interface ListResponse<T> {
  data: T[];
  count: number;
}

/**
 * Generic response for a single item
 */
export interface ItemResponse<T> {
  data: T;
}

/**
 * Generic error response
 */
export interface ErrorResponse {
  error: string | object;
}
