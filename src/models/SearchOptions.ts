export interface SearchFilters {
  [key: string]: undefined | number | string | string[]; // Dynamic filters based on channel options
}

interface BaseSearchOptions {
  query?: string;
  page: number;
}

export interface SearchOptions extends BaseSearchOptions, SearchFilters {}
