export interface PromptTemplate {
  id: string;
  name: string;
  content: string;
  category?: "system" | "user" | "custom";
  description?: string;
  tags?: string[];
}
