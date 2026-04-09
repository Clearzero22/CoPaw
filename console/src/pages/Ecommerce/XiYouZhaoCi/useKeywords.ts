import { useState, useEffect, useCallback, useRef } from "react";
import api from "../../../api";
import type {
  XiYouKeyword,
  XiYouKeywordListResponse,
} from "../../../api/types";

const SEARCH_DEBOUNCE_MS = 300;

export function useKeywords() {
  const [keywords, setKeywords] = useState<XiYouKeyword[]>(
    [],
  );
  const [loading, setLoading] = useState(false);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize] = useState(20);

  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [asinFilter, setAsinFilter] = useState("");
  const [debouncedAsin, setDebouncedAsin] = useState("");
  const [sortBy, setSortBy] = useState("scraped_at");
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleSearchChange = useCallback(
    (value: string) => {
      setSearch(value);
      if (timerRef.current) clearTimeout(timerRef.current);
      timerRef.current = setTimeout(() => {
        setDebouncedSearch(value);
        setPage(1);
      }, SEARCH_DEBOUNCE_MS);
    },
    [],
  );

  const handleAsinChange = useCallback((value: string) => {
    setAsinFilter(value);
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      setDebouncedAsin(value);
      setPage(1);
    }, SEARCH_DEBOUNCE_MS);
  }, []);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  const fetchKeywords = useCallback(async () => {
    setLoading(true);
    try {
      const data = await api.listKeywords({
        page,
        page_size: pageSize,
        asin: debouncedAsin || undefined,
        search: debouncedSearch || undefined,
        sort_by: sortBy,
        sort_order: "desc" as const,
      });
      const res = data as XiYouKeywordListResponse;
      setKeywords(res.keywords || []);
      setTotal(res.total);
    } catch (error) {
      console.error("Failed to load keywords:", error);
      setKeywords([]);
    } finally {
      setLoading(false);
    }
  }, [
    page, pageSize, debouncedSearch, debouncedAsin, sortBy,
  ]);

  useEffect(() => {
    fetchKeywords();
  }, [fetchKeywords]);

  return {
    keywords,
    loading,
    total,
    page,
    setPage,
    search,
    handleSearchChange,
    asinFilter,
    handleAsinChange,
    sortBy,
    setSortBy,
    fetchKeywords,
  };
}
