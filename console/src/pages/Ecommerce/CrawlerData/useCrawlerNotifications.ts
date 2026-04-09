import { useState, useEffect, useCallback } from "react";
import api from "../../../api";
import type { CrawlerNotification, CrawlerNotificationListResponse } from "../../../api/types";

export function useCrawlerNotifications() {
  const [notifications, setNotifications] = useState<CrawlerNotification[]>([]);
  const [total, setTotal] = useState(0);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);

  const fetchNotifications = useCallback(async () => {
    setLoading(true);
    try {
      const [data, countData] = await Promise.all([
        api.listNotifications({ page: 1, page_size: 50 }),
        api.getUnreadCount(),
      ]);
      const res = data as CrawlerNotificationListResponse;
      const count = countData as { unread_count: number };
      setNotifications(res.notifications || []);
      setTotal(res.total);
      setUnreadCount(count.unread_count || 0);
    } catch (error) {
      console.error("Failed to load notifications:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  const markRead = async (id: number) => {
    try {
      await api.markRead(id);
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, is_read: true } : n)),
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
    } catch (error) {
      console.error("Mark read failed:", error);
    }
  };

  const markAllRead = async () => {
    try {
      await api.markAllRead();
      setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
      setUnreadCount(0);
    } catch (error) {
      console.error("Mark all read failed:", error);
    }
  };

  const deleteNotification = async (id: number) => {
    try {
      await api.deleteNotification(id);
      setNotifications((prev) => prev.filter((n) => n.id !== id));
      setTotal((prev) => prev - 1);
    } catch (error) {
      console.error("Delete notification failed:", error);
    }
  };

  return {
    notifications,
    total,
    unreadCount,
    loading,
    fetchNotifications,
    markRead,
    markAllRead,
    deleteNotification,
  };
}
