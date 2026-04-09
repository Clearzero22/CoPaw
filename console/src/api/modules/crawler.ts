import { request } from "../index";
import type {
  CrawlerProductListResponse,
  CrawlerProductStats,
  CrawlerNotificationListResponse,
  ScrapingStatusResponse,
  CrawlerGenerateResult,
} from "../types";

export const crawlerApi = {
  // Products
  listProducts: (params?: {
    page?: number;
    page_size?: number;
    search?: string;
    min_price?: number;
    max_price?: number;
    prime_only?: boolean;
    detail_scraped?: boolean;
    sort_by?: string;
    sort_order?: string;
  }) => {
    const query = new URLSearchParams();
    if (params?.page) query.set("page", String(params.page));
    if (params?.page_size)
      query.set("page_size", String(params.page_size));
    if (params?.search) query.set("search", params.search);
    if (params?.min_price != null)
      query.set("min_price", String(params.min_price));
    if (params?.max_price != null)
      query.set("max_price", String(params.max_price));
    if (params?.prime_only) query.set("prime_only", "true");
    if (params?.detail_scraped != null)
      query.set("detail_scraped", String(params.detail_scraped));
    if (params?.sort_by) query.set("sort_by", params.sort_by);
    if (params?.sort_order) query.set("sort_order", params.sort_order);
    const qs = query.toString();
    return request<CrawlerProductListResponse>(
      `/crawler/products${qs ? `?${qs}` : ""}`,
    );
  },

  getProduct: (asin: string) =>
    request<unknown>(
      `/crawler/products/${encodeURIComponent(asin)}`,
    ),

  getProductStats: () =>
    request<CrawlerProductStats>("/crawler/products/stats"),

  // Jobs
  getJobsStatus: () =>
    request<ScrapingStatusResponse>("/crawler/jobs"),

  getJob: (jobId: string) =>
    request<unknown>(`/crawler/jobs/${encodeURIComponent(jobId)}`),

  triggerSearch: (keyword: string, maxPages?: number) =>
    request<unknown>("/crawler/jobs/search", {
      method: "POST",
      body: JSON.stringify({
        keyword,
        max_pages: maxPages ?? 1,
      }),
    }),

  triggerDetail: (asin: string) =>
    request<unknown>("/crawler/jobs/detail", {
      method: "POST",
      body: JSON.stringify({ asin }),
    }),

  triggerBatchDetail: (limit?: number) =>
    request<unknown>("/crawler/jobs/batch-detail", {
      method: "POST",
      body: JSON.stringify({ limit }),
    }),

  cancelJob: (jobId: string) =>
    request<unknown>(`/crawler/jobs/${encodeURIComponent(jobId)}`, {
      method: "DELETE",
    }),

  // Notifications
  listNotifications: (params?: {
    page?: number;
    page_size?: number;
    is_read?: boolean;
  }) => {
    const query = new URLSearchParams();
    if (params?.page) query.set("page", String(params.page));
    if (params?.page_size)
      query.set("page_size", String(params.page_size));
    if (params?.is_read != null)
      query.set("is_read", String(params.is_read));
    const qs = query.toString();
    return request<CrawlerNotificationListResponse>(
      `/crawler/notifications${qs ? `?${qs}` : ""}`,
    );
  },

  getUnreadCount: () =>
    request<{ unread_count: number }>(
      "/crawler/notifications/unread-count",
    ),

  markRead: (id: number) =>
    request<unknown>(
      `/crawler/notifications/${id}/read`,
      { method: "PATCH" },
    ),

  markAllRead: () =>
    request<unknown>("/crawler/notifications/mark-all-read", {
      method: "POST",
    }),

  deleteNotification: (id: number) =>
    request<unknown>(`/crawler/notifications/${id}`, {
      method: "DELETE",
    }),

  // Generate Listings
  generateListings: (asins: string[]) =>
    request<CrawlerGenerateResult>("/crawler/generate", {
      method: "POST",
      body: JSON.stringify({ asins }),
    }),
};
