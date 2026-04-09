import { useState, useEffect, useCallback, useRef } from "react";
import api from "../../../api";
import type { ScrapingJob, ScrapingStatusResponse } from "../../../api/types";

export function useCrawlerJobs() {
  const [runningJobs, setRunningJobs] = useState<ScrapingJob[]>([]);
  const [recentJobs, setRecentJobs] = useState<ScrapingJob[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchJobs = useCallback(async () => {
    setLoading(true);
    try {
      const data = await api.getJobsStatus();
      const res = data as ScrapingStatusResponse;
      setRunningJobs(res.running_jobs || []);
      setRecentJobs(res.recent_jobs || []);
    } catch (error) {
      console.error("Failed to load jobs:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchJobs();
  }, [fetchJobs]);

  // Auto-poll when there are running jobs
  const hasRunning = runningJobs.length > 0;
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (hasRunning) {
      intervalRef.current = setInterval(fetchJobs, 5000);
    }
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [hasRunning, fetchJobs]);

  const triggerSearch = async (keyword: string, maxPages?: number) => {
    try {
      await api.triggerSearch(keyword, maxPages);
      await fetchJobs();
      return true;
    } catch (error) {
      console.error("Trigger search failed:", error);
      return false;
    }
  };

  const triggerDetail = async (asin: string) => {
    try {
      await api.triggerDetail(asin);
      await fetchJobs();
      return true;
    } catch (error) {
      console.error("Trigger detail failed:", error);
      return false;
    }
  };

  const triggerBatchDetail = async (limit?: number) => {
    try {
      await api.triggerBatchDetail(limit);
      await fetchJobs();
      return true;
    } catch (error) {
      console.error("Trigger batch detail failed:", error);
      return false;
    }
  };

  const cancelJob = async (jobId: string) => {
    try {
      await api.cancelJob(jobId);
      await fetchJobs();
      return true;
    } catch (error) {
      console.error("Cancel job failed:", error);
      return false;
    }
  };

  return {
    runningJobs,
    recentJobs,
    loading,
    fetchJobs,
    triggerSearch,
    triggerDetail,
    triggerBatchDetail,
    cancelJob,
  };
}
