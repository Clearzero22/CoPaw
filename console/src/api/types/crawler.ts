// -*- Crawler Data types -*-

export interface CrawlerProduct {
  asin: string;
  title: string;
  brand: string | null;
  price: string | null;
  original_price: string | null;
  rating: string | null;
  review_count: string | null;
  product_url: string | null;
  image_url: string | null;
  is_prime: string | null;
  deal_badge: string | null;
  full_title: string | null;
  subtitle: string | null;
  discount_percentage: string | null;
  avg_rating: string | null;
  total_ratings: string | null;
  total_reviews: string | null;
  all_images: string[] | null;
  about_this_item: string[] | null;
  product_description: string | null;
  product_details: Record<string, string> | null;
  stock_status: string | null;
  sold_by: string | null;
  delivery_info: string | null;
  manufacturer: string | null;
  variants: Record<string, unknown> | null;
  return_policy: string | null;
  date_first_available: string | null;
  best_sellers_rank: unknown;
  technical_details: Record<string, unknown> | null;
  scraped_at: string | null;
  updated_at: string | null;
  detail_scraped: boolean | null;
}

export interface CrawlerProductListResponse {
  products: CrawlerProduct[];
  total: number;
  page: number;
  page_size: number;
  total_pages: number;
}

export interface CrawlerProductStats {
  total_products: number;
  detail_scraped: number;
  prime_products: number;
  with_price: number;
  with_rating: number;
  with_images: number;
  last_scrape_at: string | null;
}

export interface ScrapingJob {
  id: number;
  job_id: string;
  job_type: string;
  keyword: string | null;
  target_asin: string | null;
  status: string;
  total_products: number;
  successful_products: number;
  failed_products: number;
  error_message: string | null;
  started_at: string | null;
  completed_at: string | null;
  duration_seconds: number | null;
}

export interface ScrapingStatusResponse {
  running_jobs: ScrapingJob[];
  recent_jobs: ScrapingJob[];
  total_products: number;
  last_scrape_at: string | null;
}

export interface CrawlerNotification {
  id: number;
  notification_type: string;
  title: string;
  message: string | null;
  job_id: string | null;
  keyword: string | null;
  is_read: boolean;
  created_at: string | null;
}

export interface CrawlerNotificationListResponse {
  notifications: CrawlerNotification[];
  total: number;
  page: number;
  page_size: number;
  unread_count: number;
}

export interface CrawlerGenerateResult {
  generated: number;
  skipped: number;
  listings: unknown[];
  skipped_details: { asin: string; reason: string }[];
}
