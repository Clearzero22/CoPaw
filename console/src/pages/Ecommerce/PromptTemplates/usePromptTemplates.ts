import { useState, useEffect, useCallback, useRef } from "react";
import api from "../../../api";
import type { PromptTemplate } from "../../../api/types";

export function usePromptTemplates() {
  const [templates, setTemplates] = useState<PromptTemplate[]>([]);
  const [loading, setLoading] = useState(false);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [platformFilter, setPlatformFilter] = useState("");
  const [marketplaceFilter, setMarketplaceFilter] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const timerRef = useRef<ReturnType<typeof setTimeout>>();

  // Debounce search
  useEffect(() => {
    clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      setDebouncedSearch(search);
    }, 300);
    return () => clearTimeout(timerRef.current);
  }, [search]);

  const fetchTemplates = useCallback(async () => {
    setLoading(true);
    try {
      const data = await api.listTemplates({
        page,
        page_size: 20,
        search: debouncedSearch || undefined,
        category: categoryFilter || undefined,
        platform: platformFilter || undefined,
        marketplace: marketplaceFilter || undefined,
      });
      const res = data as {
        templates: PromptTemplate[];
        total: number;
      };
      setTemplates(res.templates || []);
      setTotal(res.total);
    } catch (error) {
      console.error("Failed to load templates:", error);
    } finally {
      setLoading(false);
    }
  }, [page, debouncedSearch, categoryFilter, platformFilter, marketplaceFilter]);

  useEffect(() => {
    fetchTemplates();
  }, [fetchTemplates]);

  const createTemplate = async (
    data: Parameters<typeof api.createTemplate>[0],
  ) => {
    try {
      const result = await api.createTemplate(data);
      setTemplates((prev) => [
        result as PromptTemplate,
        ...prev,
      ]);
      setTotal((prev) => prev + 1);
      return true;
    } catch (error) {
      console.error("Create failed:", error);
      return false;
    }
  };

  const updateTemplate = async (
    id: number,
    data: Parameters<typeof api.updateTemplate>[1],
  ) => {
    const original = templates.find((t) => t.id === id);
    try {
      const result = await api.updateTemplate(id, data);
      setTemplates((prev) =>
        prev.map((t) =>
          t.id === id ? (result as PromptTemplate) : t,
        ),
      );
      return true;
    } catch (error) {
      console.error("Update failed:", error);
      if (original) {
        setTemplates((prev) =>
          prev.map((t) =>
            t.id === id ? original : t,
          ),
        );
      }
      return false;
    }
  };

  const deleteTemplate = async (id: number) => {
    try {
      await api.deleteTemplate(id);
      setTemplates((prev) => prev.filter((t) => t.id !== id));
      setTotal((prev) => prev - 1);
      return true;
    } catch (error) {
      console.error("Delete failed:", error);
      return false;
    }
  };

  const setDefault = async (id: number) => {
    try {
      await api.setDefault(id);
      setTemplates((prev) =>
        prev.map((t) => ({
          ...t,
          is_default:
            t.id === id
              ? true
              : t.category ===
                  (prev.find((p) => p.id === id)?.category ||
                    "")
                  && t.platform ===
                    (prev.find((p) => p.id === id)?.platform ||
                      "")
                  && t.marketplace ===
                    (prev.find((p) => p.id === id)?.marketplace ||
                      "")
              ? false
              : t.is_default,
        })),
      );
      return true;
    } catch (error) {
      console.error("Set default failed:", error);
      return false;
    }
  };

  const batchDelete = async (ids: number[]) => {
    const originals = templates.filter((t) => ids.includes(t.id));
    try {
      await api.batchDelete(ids);
      setTemplates((prev) => prev.filter((t) => !ids.includes(t.id)));
      setTotal((prev) => prev - originals.length);
      return true;
    } catch (error) {
      console.error("Batch delete failed:", error);
      setTemplates(originals);
      return false;
    }
  };

  return {
    templates,
    loading,
    total,
    page,
    setPage,
    search,
    setSearch,
    categoryFilter,
    setCategoryFilter,
    platformFilter,
    setPlatformFilter,
    marketplaceFilter,
    setMarketplaceFilter,
    fetchTemplates,
    createTemplate,
    updateTemplate,
    deleteTemplate,
    setDefault,
    batchDelete,
  };
}
