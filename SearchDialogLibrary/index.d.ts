import { Library } from "botbuilder";

// Exported functions
export function create(libraryId: string, settings: SearchDialogSettings): Library;
export function defaultResultsMapper(itemMap: ItemMapper): SearchResultsMapper;

declare type ItemMapper = (input: any) => SearchHit;
declare type SearchResultsMapper = (providerResults: SearchResults) => SearchResults;

// Entities
export interface SearchDialogSettings {
  search: (query: Query) => PromiseLike<SearchResults>;
  pageSize?: number;
}

export interface Query {
  searchText: string;
  pageSize: number;
  pageNumber: number;
}

export interface SearchResults {
  results: Array<SearchHit>
}

export interface SearchHit {
  key: string;
  title: string;
  description: string;
  result: any;
  imageUrl?: string
}