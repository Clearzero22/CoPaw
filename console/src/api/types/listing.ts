export type ListingStatus =
  | "draft"
  | "generated"
  | "published"
  | "archived";

export interface ListingInfo {
  id: string;
  asin: string;
  title: string;
  bullet_points: string[];
  description: string;
  search_terms: string[];
  price: string;
  image_url: string;
  platform: string;
  marketplace: string;
  status: ListingStatus;
  source_url: string;
  created_at: string;
  updated_at: string;
}

export interface ListingCreateInput {
  title?: string;
  asin?: string;
  bullet_points?: string[];
  description?: string;
  search_terms?: string[];
  price?: string;
  image_url?: string;
  platform?: string;
  marketplace?: string;
}

export interface ListingGenerateInput {
  asin?: string;
  keyword?: string;
  platform?: string;
  marketplace?: string;
}

export interface ListingImportResult {
  imported: number;
  skipped: number;
  total: number;
}
