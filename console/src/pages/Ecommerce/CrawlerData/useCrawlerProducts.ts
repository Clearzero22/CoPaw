import { useState, useEffect, useCallback, useRef } from "react";
import api from "../../../api";
import type { CrawlerProduct, CrawlerProductListResponse } from "../../../api/types";

const SEARCH_DEBOUNCE_MS = 300;

export function useCrawlerProducts() {
  const [products, setProducts] = useState<CrawlerProduct[]>([]);
  const [loading, setLoading] = useState(false);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize] = useState(20);

  // Filters
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [primeOnly, setPrimeOnly] = useState(false);
  const [detailScraped, setDetailScraped] = useState<boolean | undefined>(undefined);
  const [sortBy, setSortBy] = useState("scraped_at");
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleSearchChange = useCallback((value: string) => {
    setSearch(value);
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      setDebouncedSearch(value);
      setPage(1);
    }, SEARCH_DEBOUNCE_MS);
  }, []);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  const fetchProducts = useCallback(async () => {
    setLoading(true);
    try {
      const data = await api.listProducts({
        page,
        page_size: pageSize,
        search: debouncedSearch || undefined,
        prime_only: primeOnly || undefined,
        detail_scraped: detailScraped,
        sort_by: sortBy,
        sort_order: "desc" as const,
      });
      const res = data as CrawlerProductListResponse;
      setProducts(res.products || []);
      setTotal(res.total);
    } catch (error) {
      console.error("Failed to load crawler products:", error);
      setProducts([]);
    } finally {
      setLoading(false);
    }
  }, [page, pageSize, debouncedSearch, primeOnly, detailScraped, sortBy]);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  const generateListing = async (asin: string) => {
    try {
      const result = await api.generateListings([asin]);
      const res = result as { generated: number };
      return res.generated > 0;
    } catch (error) {
      console.error("Generate failed:", error);
      return false;
    }
  };

  return {
    products,
    loading,
    total,
    page,
    setPage,
    search,
    handleSearchChange,
    primeOnly,
    setPrimeOnly,
    detailScraped,
    setDetailScraped,
    sortBy,
    setSortBy,
    generateListing,
    fetchProducts,
  };
}
