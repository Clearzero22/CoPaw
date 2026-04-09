import { useState, useEffect, useCallback, useRef } from "react";
import { message } from "@agentscope-ai/design";
import api from "../../../api";
import type { ListingInfo, ListingCreateInput } from "../../../api/types";
import { useTranslation } from "react-i18next";
import { useAgentStore } from "../../../stores/agentStore";

/** Debounce delay for search input (ms). */
const SEARCH_DEBOUNCE_MS = 300;

export function useListings() {
  const { t } = useTranslation();
  const { selectedAgent } = useAgentStore();
  const [listings, setListings] = useState<ListingInfo[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("");
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Debounced search value — updates 300ms after user stops typing
  const [debouncedSearch, setDebouncedSearch] = useState("");

  const handleSearchChange = useCallback((value: string) => {
    setSearch(value);
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      setDebouncedSearch(value);
    }, SEARCH_DEBOUNCE_MS);
  }, []);

  // Clean up timer on unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  const fetchListings = useCallback(async () => {
    setLoading(true);
    try {
      const data = await api.listListings({
        search: debouncedSearch || undefined,
        status: statusFilter || undefined,
      });
      setListings((data as ListingInfo[]) || []);
    } catch (error) {
      console.error("Failed to load listings:", error);
    } finally {
      setLoading(false);
    }
  }, [debouncedSearch, statusFilter]);

  useEffect(() => {
    fetchListings();
  }, [fetchListings, selectedAgent]);

  const createListing = async (data: ListingCreateInput) => {
    try {
      const created = await api.createListing(data);
      setListings((prev) => [(created as ListingInfo), ...prev]);
      message.success(
        t("ecommerce.listingManagement.createSuccess"),
      );
      return true;
    } catch (error) {
      message.error("Create failed");
      return false;
    }
  };

  const updateListing = async (
    id: string,
    data: Partial<ListingCreateInput> & { status?: string },
  ) => {
    const original = listings.find((l) => l.id === id);
    setListings((prev) =>
      prev.map((l) =>
        l.id === id
          ? ({ ...l, ...data } as ListingInfo)
          : l,
      ),
    );
    try {
      const updated = await api.updateListing(id, data);
      setListings((prev) =>
        prev.map((l) => (l.id === id ? (updated as ListingInfo) : l)),
      );
      message.success(
        t("ecommerce.listingManagement.updateSuccess"),
      );
      return true;
    } catch (error) {
      if (original) {
        setListings((prev) =>
          prev.map((l) => (l.id === id ? original : l)),
        );
      }
      message.error("Update failed");
      return false;
    }
  };

  const deleteListing = async (id: string) => {
    const original = listings.find((l) => l.id === id);
    setListings((prev) => prev.filter((l) => l.id !== id));
    try {
      await api.deleteListing(id);
      message.success(
        t("ecommerce.listingManagement.deleteSuccess"),
      );
      return true;
    } catch (error) {
      if (original) {
        setListings((prev) => [...prev, original]);
      }
      message.error("Delete failed");
      return false;
    }
  };

  const deleteBatch = async (ids: string[]) => {
    const originals = listings.filter((l) => ids.includes(l.id));
    setListings((prev) => prev.filter((l) => !ids.includes(l.id)));
    try {
      await Promise.all(ids.map((id) => api.deleteListing(id)));
      message.success(
        t("ecommerce.listingManagement.deleteSuccess"),
      );
      return true;
    } catch (error) {
      setListings((prev) => [...prev, ...originals]);
      message.error("Delete failed");
      return false;
    }
  };

  return {
    listings,
    loading,
    search,
    handleSearchChange,
    statusFilter,
    setStatusFilter,
    fetchListings,
    createListing,
    updateListing,
    deleteListing,
    deleteBatch,
  };
}
