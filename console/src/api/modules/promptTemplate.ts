import { request } from "../index";
import type {
  PromptTemplateListResponse,
  PromptTemplateCreateInput,
  PromptTemplate,
} from "../types";

export const promptTemplateApi = {
  listTemplates: (params?: {
    page?: number;
    page_size?: number;
    search?: string;
    category?: string;
    platform?: string;
    marketplace?: string;
  }) => {
    const query = new URLSearchParams();
    if (params?.page) query.set("page", String(params.page));
    if (params?.page_size)
      query.set("page_size", String(params.page_size));
    if (params?.search) query.set("search", params.search);
    if (params?.category)
      query.set("category", params.category);
    if (params?.platform)
      query.set("platform", params.platform);
    if (params?.marketplace)
      query.set("marketplace", params.marketplace);
    const qs = query.toString();
    return request<PromptTemplateListResponse>(
      `/prompt-templates/list${qs ? `?${qs}` : ""}`,
    );
  },

  getTemplate: (id: number) =>
    request<PromptTemplate>(`/prompt-templates/item/${id}`),

  createTemplate: (data: PromptTemplateCreateInput) =>
    request<PromptTemplate>("/prompt-templates/create", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  updateTemplate: (
    id: number,
    data: PromptTemplateCreateInput,
  ) =>
    request<PromptTemplate>(`/prompt-templates/update/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    }),

  deleteTemplate: (id: number) =>
    request<unknown>(`/prompt-templates/delete/${id}`, {
      method: "DELETE",
    }),

  setDefault: (id: number) =>
    request<PromptTemplate>(
      `/prompt-templates/set-default/${id}`,
      { method: "POST" },
    ),

  batchDelete: (ids: number[]) =>
    request<unknown>("/prompt-templates/batch-delete", {
      method: "POST",
      body: JSON.stringify({ ids }),
    }),
};
