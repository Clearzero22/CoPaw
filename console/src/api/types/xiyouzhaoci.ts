// -*- XiYouZhaoCi (西柚找词) Keyword Research types -*-

export interface XiYouKeyword {
  id: number;
  asin: string;
  keyword: string;
  rank: number | null;
  search_volume: string | null;
  search_volume_trend: string | null;
  traffic_share: string | null;
  difficulty: string | null;
  ranking_position: string | null;
  click_rate: string | null;
  conversion_rate: string | null;
  organic_rank: string | null;
  sponsored_rank: string | null;
  extra_data: Record<string, unknown> | null;
  scraped_at: string | null;
}

export interface XiYouKeywordListResponse {
  keywords: XiYouKeyword[];
  total: number;
  page: number;
  page_size: number;
  total_pages: number;
}

export interface XiYouKeywordStats {
  total_keywords: number;
  unique_asins: number;
  last_scrape_at: string | null;
  top_keywords: XiYouKeyword[];
}

export interface XiYouScrapeStatus {
  running: XiYouScrapeTask[];
  recent: XiYouScrapeTask[];
}

export interface XiYouScrapeTask {
  task_id: string | null;
  status: string;
  asins: string[];
  current_asin: string | null;
  progress: string;
  started_at: string | null;
  completed_at: string | null;
  error: string | null;
}
