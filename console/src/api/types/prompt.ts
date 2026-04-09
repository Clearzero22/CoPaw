export interface PromptTemplate {
  id: number;
  name: string;
  description: string | null;
  category: string;
  platform: string;
  marketplace: string;
  title_prompt: string | null;
  bullet_prompt: string | null;
  description_prompt: string | null;
  keywords_prompt: string | null;
  full_prompt: string | null;
  extra_data: Record<string, unknown> | null;
  is_default: boolean;
  created_at: string | null;
  updated_at: string | null;
}

export interface PromptTemplateListResponse {
  templates: PromptTemplate[];
  total: number;
  page: number;
  page_size: number;
  total_pages: number;
}

export interface PromptTemplateCreateInput {
  name: string;
  description?: string;
  category?: string;
  platform?: string;
  marketplace?: string;
  title_prompt?: string;
  bullet_prompt?: string;
  description_prompt?: string;
  keywords_prompt?: string;
  full_prompt?: string;
  extra_data?: Record<string, unknown>;
}
