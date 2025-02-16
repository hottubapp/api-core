export interface SearchFilters {
  [key: string]: string | string[]; // Dynamic filters based on channel options
}

export interface SearchOptions {
  query?: string;
  filters?: SearchFilters;
  page: number;
}
