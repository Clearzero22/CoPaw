import { request, getApiUrl } from "../index";
import type {
  ListingCreateInput,
  ListingInfo,
  ListingImportResult,
} from "../types";

export const listingApi = {
  listListings: (params?: {
    search?: string;
    status?: string;
    platform?: string;
  }) => {
    const query = new URLSearchParams();
    if (params?.search) query.set("search", params.search);
    if (params?.status) query.set("status", params.status);
    if (params?.platform) query.set("platform", params.platform);
    const qs = query.toString();
    return request<ListingInfo[]>(`/listings${qs ? `?${qs}` : ""}`);
  },

  getListing: (id: string) =>
    request<ListingInfo>(`/listings/${encodeURIComponent(id)}`),

  createListing: (data: ListingCreateInput) =>
    request<ListingInfo>("/listings", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  updateListing: (
    id: string,
    data: Partial<ListingCreateInput> & { status?: string },
  ) =>
    request<ListingInfo>(`/listings/${encodeURIComponent(id)}`, {
      method: "PUT",
      body: JSON.stringify(data),
    }),

  deleteListing: (id: string) =>
    request<void>(`/listings/${encodeURIComponent(id)}`, {
      method: "DELETE",
    }),

  getExportUrl: (params?: {
    search?: string;
    status?: string;
    platform?: string;
  }) => {
    const query = new URLSearchParams();
    if (params?.search) query.set("search", params.search);
    if (params?.status) query.set("status", params.status);
    if (params?.platform) query.set("platform", params.platform);
    const qs = query.toString();
    return getApiUrl(`/listings/export${qs ? `?${qs}` : ""}`);
  },

  importListings: (file: File, skipExisting = true) => {
    const formData = new FormData();
    formData.append("file", file);
    const query = skipExisting ? "?skip_existing=true" : "";
    // Don't use request() — it sets Content-Type to application/json
    // which breaks multipart/form-data uploads
    return fetch(getApiUrl(`/listings/import${query}`), {
      method: "POST",
      body: formData,
    }).then(async (res) => {
      if (!res.ok) throw new Error(`Import failed: ${res.status}`);
      return (await res.json()) as ListingImportResult;
    });
  },
};
