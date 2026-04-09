import { request } from "../index";
import type {
  XiYouKeywordListResponse,
  XiYouKeywordStats,
  XiYouScrapeStatus,
} from "../types";

export const xiyouzhaociApi = {
  // Keywords
  listKeywords: (params?: {
    page?: number;
    page_size?: number;
    asin?: string;
    search?: string;
    difficulty?: string;
    sort_by?: string;
    sort_order?: string;
  }) => {
    const query = new URLSearchParams();
    if (params?.page) query.set("page", String(params.page));
    if (params?.page_size)
      query.set("page_size", String(params.page_size));
    if (params?.asin) query.set("asin", params.asin);
    if (params?.search) query.set("search", params.search);
    if (params?.difficulty)
      query.set("difficulty", params.difficulty);
    if (params?.sort_by)
      query.set("sort_by", params.sort_by);
    if (params?.sort_order)
      query.set("sort_order", params.sort_order);
    const qs = query.toString();
    return request<XiYouKeywordListResponse>(
      `/xiyouzhaoci/keywords${qs ? `?${qs}` : ""}`,
    );
  },

  getKeywordStats: () =>
    request<XiYouKeywordStats>(
      "/xiyouzhaoci/keywords/stats",
    ),

  deleteKeywords: (asin: string) =>
    request<unknown>(
      `/xiyouzhaoci/keywords/${encodeURIComponent(asin)}`,
      { method: "DELETE" },
    ),

  batchDeleteKeywords: (asins: string[]) =>
    request<unknown>("/xiyouzhaoci/keywords/batch-delete", {
      method: "POST",
      body: JSON.stringify({ asins }),
    }),

  // Scrape
  triggerScrape: (asins: string[]) =>
    request<{ task_id: string; status: string }>(
      "/xiyouzhaoci/scrape",
      {
        method: "POST",
        body: JSON.stringify({ asins }),
      },
    ),

  getScrapeStatus: () =>
    request<XiYouScrapeStatus>(
      "/xiyouzhaoci/scrape/status",
    ),
};
