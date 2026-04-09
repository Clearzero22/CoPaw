import { useState, useEffect, useCallback } from "react";
import { message } from "@agentscope-ai/design";
import api from "../../../api";
import type { ListingInfo, ListingCreateInput } from "../../../api/types";
import { useTranslation } from "react-i18next";
import { useAgentStore } from "../../../stores/agentStore";

export function useListings() {
  const { t } = useTranslation();
  const { selectedAgent } = useAgentStore();
  const [listings, setListings] = useState<ListingInfo[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("");

  const fetchListings = useCallback(async () => {
    setLoading(true);
    try {
      const data = await api.listListings({
        search: search || undefined,
        status: statusFilter || undefined,
      });
      setListings((data as ListingInfo[]) || []);
    } catch (error) {
      console.error("Failed to load listings:", error);
    } finally {
      setLoading(false);
    }
  }, [search, statusFilter]);

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
    setSearch,
    statusFilter,
    setStatusFilter,
    fetchListings,
    createListing,
    updateListing,
    deleteListing,
    deleteBatch,
  };
}
