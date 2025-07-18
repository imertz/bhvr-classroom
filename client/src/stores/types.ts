// Shared types for stores
export interface ApiState {
  loading: boolean;
  error: string | null;
}

export interface PaginatedData<T> {
  data: T[];
  count: number;
}
