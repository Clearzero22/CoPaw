import { useState, useEffect, useCallback, useRef } from "react";
import api from "../../../api";
import type { XiYouScrapeTask } from "../../../api/types";

const POLL_INTERVAL_MS = 3000;

export function useScrape() {
  const [taskId, setTaskId] = useState<string | null>(null);
  const [status, setStatus] = useState<string>("idle");
  const [progress, setProgress] = useState("");
  const [currentAsin, setCurrentAsin] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [polling, setPolling] = useState(false);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const triggerScrape = useCallback(
    async (asins: string[]) => {
      if (asins.length === 0) return false;
      try {
        const result = await api.triggerScrape(asins);
        const res = result as { task_id: string; status: string };
        setTaskId(res.task_id);
        setStatus("running");
        setProgress("starting...");
        setError(null);
        setPolling(true);
        return true;
      } catch (err) {
        console.error("Trigger scrape failed:", err);
        setError(String(err));
        return false;
      }
    },
    [],
  );

  const fetchStatus = useCallback(async () => {
    try {
      const data = await api.getScrapeStatus();
      const res = data as {
        running: XiYouScrapeTask[];
        recent: XiYouScrapeTask[];
      };
      const running = res.running?.[0];
      if (running) {
        setStatus(running.status);
        setProgress(running.progress);
        setCurrentAsin(running.current_asin);
        setError(running.error);
        if (
          running.status === "completed" ||
          running.status === "failed"
        ) {
          setPolling(false);
        }
      } else {
        setPolling(false);
        if (status === "running") {
          setStatus("completed");
          setProgress("done");
        }
      }
    } catch (err) {
      console.error("Fetch scrape status failed:", err);
    }
  }, [status]);

  useEffect(() => {
    if (polling) {
      pollRef.current = setInterval(fetchStatus, POLL_INTERVAL_MS);
    } else {
      if (pollRef.current) {
        clearInterval(pollRef.current);
        pollRef.current = null;
      }
    }
    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, [polling, fetchStatus]);

  // Check status on mount in case a task is already running
  useEffect(() => {
    fetchStatus();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const reset = useCallback(() => {
    setTaskId(null);
    setStatus("idle");
    setProgress("");
    setCurrentAsin(null);
    setError(null);
    setPolling(false);
  }, []);

  return {
    taskId,
    status,
    progress,
    currentAsin,
    error,
    isRunning: polling,
    triggerScrape,
    fetchStatus,
    reset,
  };
}
