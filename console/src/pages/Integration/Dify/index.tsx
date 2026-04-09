import { useState, useRef, useEffect, useCallback, useMemo } from "react";
import {
  Tabs,
  Card,
  Input,
  Button,
  Table,
  Tag,
  Modal,
  Form,
  message,
  Alert,
  Select,
  Progress,
  Upload,
  Collapse,
  Popconfirm,
  Empty,
} from "@agentscope-ai/design";
import { Space, List, Checkbox, Pagination, Spin } from "antd";
import {
  Settings,
  Play,
  Key,
  ExternalLink,
  ImageIcon,
  Link,
  Loader2,
  CheckCircle2,
  XCircle,
  Trash2,
  Inbox,
  Clock,
  Pencil,
} from "lucide-react";
import { useTranslation } from "react-i18next";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { getApiUrl } from "@/api/config";
import { crawlerApi } from "@/api/modules/crawler";
import type { CrawlerProduct } from "@/api/types/crawler";
import styles from "./index.module.less";

/* ─── Helpers ─── */

/** Normalize Dify base URL: strip trailing /v1 to avoid double /v1/v1/... */
function difyApiUrl(baseUrl: string, path: string): string {
  const base = baseUrl.replace(/\/+$/, "").replace(/\/v1$/, "");
  return `${base}/v1${path}`;
}

/* ─── Types ─── */

interface DifyApp {
  id: string;
  name: string;
  description: string;
  mode: "chat" | "workflow";
  status: "active" | "inactive";
}

interface BatchImageItem {
  id: string;
  source: "file" | "url";
  fileName?: string;
  file?: File;
  uploadFileId?: string;
  url?: string;
  status: "pending" | "uploading" | "processing" | "succeeded" | "failed";
  result?: string;
  error?: string;
  elapsed?: number;
}

interface BatchSummary {
  batch_id: string;
  total: number;
  succeeded: number;
  failed: number;
  created_at: string | null;
  variable_name: string;
}

interface HistoryRecord {
  id: number;
  batch_id: string;
  source: string;
  source_detail: string;
  status: string;
  result: string;
  error: string;
  elapsed: number;
  variable_name: string;
  created_at: string | null;
}

interface BatchDetail {
  batch_id: string;
  items: HistoryRecord[];
  total: number;
  succeeded: number;
  failed: number;
  created_at: string | null;
}

/* ─── Dify History API helpers ─── */

async function saveRecognitionResult(data: {
  batch_id: string;
  variable_name: string;
  source: string;
  source_detail: string;
  status: string;
  result?: string;
  error?: string;
  elapsed: number;
}): Promise<boolean> {
  try {
    const resp = await fetch(
      getApiUrl("/crawler/dify/history"),
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          batch_id: data.batch_id,
          variable_name: data.variable_name,
          items: [
            {
              source: data.source,
              source_detail: data.source_detail,
              status: data.status,
              result: data.result || "",
              error: data.error || "",
              elapsed: data.elapsed,
            },
          ],
        }),
      }
    );
    return resp.ok;
  } catch {
    return false;
  }
}

async function getBatchList(
  limit = 20,
  offset = 0
): Promise<{ batches: BatchSummary[]; total: number }> {
  const resp = await fetch(
    `${getApiUrl("/crawler/dify/history/batches")}?limit=${limit}&offset=${offset}`
  );
  if (!resp.ok) throw new Error("Failed to load history");
  return resp.json();
}

async function getBatchDetail(
  batchId: string
): Promise<BatchDetail> {
  const resp = await fetch(
    getApiUrl(`/crawler/dify/history/batches/${batchId}`)
  );
  if (!resp.ok) throw new Error("Failed to load batch detail");
  return resp.json();
}

async function deleteBatch(batchId: string): Promise<boolean> {
  const resp = await fetch(
    getApiUrl(`/crawler/dify/history/batches/${batchId}`),
    { method: "DELETE" }
  );
  return resp.ok;
}

async function updateHistoryRecord(
  recordId: number,
  updates: { result?: string; status?: string; error?: string }
): Promise<HistoryRecord> {
  const resp = await fetch(
    getApiUrl(`/crawler/dify/history/${recordId}`),
    {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(updates),
    }
  );
  if (!resp.ok) throw new Error("Failed to update record");
  return resp.json();
}

/* ─── Batch Recognition Component ─── */

function BatchRecognitionSection() {
  const { t } = useTranslation();

  const [config, setConfig] = useState<{
    baseUrl: string;
    apiKey: string;
  } | null>(null);
  const [detectedVariable, setDetectedVariable] = useState<string>("");
  const [detectedLabel, setDetectedLabel] = useState<string>("");
  const [loadingParams, setLoadingParams] = useState(false);
  const [paramError, setParamError] = useState("");
  const [imageItems, setImageItems] = useState<BatchImageItem[]>([]);
  const [urlInput, setUrlInput] = useState("");
  const [processing, setProcessing] = useState(false);
  const [progress, setProgress] = useState({ current: 0, total: 0 });
  const [concurrency, setConcurrency] = useState(1);
  const processingRef = useRef(false);
  const currentBatchIdRef = useRef("");

  // History state
  const [historyBatches, setHistoryBatches] = useState<BatchSummary[]>([]);
  const [expandedBatch, setExpandedBatch] = useState<string | null>(null);
  const [batchDetail, setBatchDetail] = useState<BatchDetail | null>(null);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [loadingDetail, setLoadingDetail] = useState(false);

  // Edit modal state
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editRecord, setEditRecord] = useState<HistoryRecord | null>(null);
  const [editResult, setEditResult] = useState("");
  const [editStatus, setEditStatus] = useState("");
  const [editError, setEditError] = useState("");
  const [saving, setSaving] = useState(false);

  // Preview modal state
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewMarkdown, setPreviewMarkdown] = useState("");
  const [previewSource, setPreviewSource] = useState("");

  // DB product selector state
  const [dbModalOpen, setDbModalOpen] = useState(false);
  const [dbProducts, setDbProducts] = useState<CrawlerProduct[]>([]);
  const [dbTotal, setDbTotal] = useState(0);
  const [dbPage, setDbPage] = useState(1);
  const [dbSearch, setDbSearch] = useState("");
  const [dbSelectedAsins, setDbSelectedAsins] = useState<Set<string>>(
    new Set()
  );
  const [dbLoading, setDbLoading] = useState(false);

  // Load Dify config on mount
  useEffect(() => {
    const saved = localStorage.getItem("dify_config");
    if (saved) {
      try {
        setConfig(JSON.parse(saved));
      } catch {
        /* ignore invalid config */
      }
    }
  }, []);

  // Load history batches on mount
  const loadHistory = useCallback(async () => {
    setLoadingHistory(true);
    try {
      const data = await getBatchList();
      setHistoryBatches(data.batches);
    } catch {
      message.warning(
        t("integration.dify.batchRecognition.loadHistoryFailed")
      );
    } finally {
      setLoadingHistory(false);
    }
  }, [t]);

  useEffect(() => {
    loadHistory();
  }, [loadHistory]);

  // Auto-detect workflow parameters from /v1/parameters
  // This works for both app-specific keys and platform keys
  useEffect(() => {
    if (!config) return;
    detectParameters();
  }, [config]);

  const detectParameters = useCallback(async () => {
    if (!config) return;
    setLoadingParams(true);
    setParamError("");
    try {
      const resp = await fetch(difyApiUrl(config.baseUrl, "/parameters"), {
        headers: { Authorization: `Bearer ${config.apiKey}` },
      });
      if (!resp.ok) {
        setParamError(`HTTP ${resp.status}`);
        return;
      }
      const data = await resp.json();
      // Parse user_input_form for file-list or file-upload type params
      const formItems = data.user_input_form || [];
      for (const item of formItems) {
        const key = Object.keys(item)[0];
        const param = item[key];
        if (
          key === "file-list" ||
          key === "file_upload" ||
          param?.type === "file-list" ||
          param?.type === "file-upload"
        ) {
          setDetectedVariable(param.variable || "");
          setDetectedLabel(param.label || param.variable || "");
          return;
        }
      }
      setParamError("no-file-param");
    } catch (err) {
      setParamError(err instanceof Error ? err.message : "Failed to load");
    } finally {
      setLoadingParams(false);
    }
  }, [config]);

  // Upload a file to Dify
  const uploadFileToDify = useCallback(
    async (file: File): Promise<string> => {
      if (!config) throw new Error("No config");
      const formData = new FormData();
      formData.append("file", file);
      formData.append("user", "copaw-agent");
      const resp = await fetch(difyApiUrl(config.baseUrl, "/files/upload"), {
        method: "POST",
        headers: { Authorization: `Bearer ${config.apiKey}` },
        body: formData,
      });
      if (!resp.ok) throw new Error("Upload failed");
      const data = await resp.json();
      return data.id;
    },
    [config]
  );

  // Execute workflow with image input
  const runWorkflow = useCallback(
    async (
      imageInput: Array<{
        type: string;
        transfer_method: string;
        url?: string;
        upload_file_id?: string;
      }>
    ) => {
      if (!config || !detectedVariable) throw new Error("Missing config");
      const resp = await fetch(difyApiUrl(config.baseUrl, "/workflows/run"), {
        method: "POST",
        headers: {
          Authorization: `Bearer ${config.apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          inputs: { [detectedVariable]: imageInput },
          response_mode: "blocking",
          user: "copaw-agent",
        }),
      });
      if (!resp.ok) throw new Error("Workflow run failed");
      const data = await resp.json();
      return data.data;
    },
    [config, detectedVariable]
  );

  // Process all queued images with concurrency control
  const processAllImages = useCallback(async () => {
    if (!config || !detectedVariable) return;
    setProcessing(true);
    processingRef.current = true;

    // Generate batch_id for this run
    const batchId = `batch-${Date.now()}`;
    currentBatchIdRef.current = batchId;

    const pending = imageItems.filter((i) => i.status === "pending");
    setProgress({ current: 0, total: pending.length });

    const updateItem = (id: string, updates: Partial<BatchImageItem>) => {
      setImageItems((prev) =>
        prev.map((item) => (item.id === id ? { ...item, ...updates } : item))
      );
    };

    let completed = 0;
    const queue = [...pending];

    const runNext = async (): Promise<void> => {
      if (!processingRef.current || queue.length === 0) return;
      const item = queue.shift()!;
      try {
        updateItem(item.id, { status: "uploading" });

        let imagePayload: any;
        if (item.source === "file" && item.file) {
          const fileId = await uploadFileToDify(item.file);
          updateItem(item.id, { uploadFileId: fileId });
          imagePayload = [
            {
              type: "image",
              transfer_method: "local_file",
              upload_file_id: fileId,
            },
          ];
        } else {
          imagePayload = [
            {
              type: "image",
              transfer_method: "remote_url",
              url: item.url,
            },
          ];
        }

        updateItem(item.id, { status: "processing" });
        const startTime = Date.now();
        const result = await runWorkflow(imagePayload);
        const elapsed = (Date.now() - startTime) / 1000;

        if (result.status === "succeeded") {
          const outputText = result.outputs
            ? JSON.stringify(result.outputs)
            : "";
          updateItem(item.id, {
            status: "succeeded",
            result: outputText,
            elapsed,
          });
          // Save to backend (fire-and-forget)
          saveRecognitionResult({
            batch_id: batchId,
            variable_name: detectedVariable,
            source: item.source,
            source_detail:
              item.source === "file"
                ? item.fileName || ""
                : item.url || "",
            status: "succeeded",
            result: outputText,
            elapsed,
          });
        } else {
          updateItem(item.id, {
            status: "failed",
            error: result.error || "Workflow returned non-success status",
          });
          saveRecognitionResult({
            batch_id: batchId,
            variable_name: detectedVariable,
            source: item.source,
            source_detail:
              item.source === "file"
                ? item.fileName || ""
                : item.url || "",
            status: "failed",
            error: result.error || "Workflow returned non-success status",
            elapsed,
          });
        }
      } catch (err) {
        const errMsg =
          err instanceof Error ? err.message : String(err);
        updateItem(item.id, {
          status: "failed",
          error: errMsg,
        });
        saveRecognitionResult({
          batch_id: batchId,
          variable_name: detectedVariable,
          source: item.source,
          source_detail:
            item.source === "file"
              ? item.fileName || ""
              : item.url || "",
          status: "failed",
          error: errMsg,
          elapsed: 0,
        });
      } finally {
        completed++;
        setProgress((prev) => ({ ...prev, current: completed }));
        await runNext();
      }
    };

    const lanes = Array.from({ length: concurrency }, () => runNext());
    await Promise.all(lanes);
    setProcessing(false);
    processingRef.current = false;
    // Refresh history after batch completes
    loadHistory();
  }, [config, detectedVariable, imageItems, concurrency, uploadFileToDify, runWorkflow, loadHistory]);

  const stopProcessing = useCallback(() => {
    processingRef.current = false;
  }, []);

  // Add files to queue
  const handleFileDrop = useCallback(
    (file: File) => {
      setImageItems((prev) => [
        ...prev,
        {
          id: crypto.randomUUID(),
          source: "file",
          fileName: file.name,
          file,
          status: "pending",
        },
      ]);
      return false; // Prevent auto upload
    },
    []
  );

  // Add URL to queue
  const addUrlItem = useCallback(() => {
    const url = urlInput.trim();
    if (!url) return;
    setImageItems((prev) => [
      ...prev,
      {
        id: crypto.randomUUID(),
        source: "url",
        url,
        status: "pending",
      },
    ]);
    setUrlInput("");
  }, [urlInput]);

  // Remove item from queue
  const removeItem = useCallback((id: string) => {
    setImageItems((prev) => prev.filter((item) => item.id !== id));
  }, []);

  // Clear all
  const clearAll = useCallback(() => {
    if (processing) return;
    setImageItems([]);
    setProgress({ current: 0, total: 0 });
  }, [processing]);

  // --- DB Product Selector ---

  const loadDbProducts = useCallback(
    async (page: number, search?: string) => {
      setDbLoading(true);
      try {
        const data = await crawlerApi.listProducts({
          page,
          page_size: 20,
          search: search || undefined,
          sort_by: "scraped_at",
          sort_order: "desc",
        });
        setDbProducts(data.products || []);
        setDbTotal(data.total);
      } catch {
        message.error(
          t("integration.dify.batchRecognition.loadProductsFailed")
        );
      } finally {
        setDbLoading(false);
      }
    },
    [t]
  );

  const openDbModal = useCallback(() => {
    setDbSelectedAsins(new Set());
    setDbSearch("");
    setDbPage(1);
    setDbModalOpen(true);
    loadDbProducts(1);
  }, [loadDbProducts]);

  const toggleDbProduct = useCallback((asin: string) => {
    setDbSelectedAsins((prev) => {
      const next = new Set(prev);
      if (next.has(asin)) next.delete(asin);
      else next.add(asin);
      return next;
    });
  }, []);

  const selectedImageCount = useMemo(() => {
    return dbProducts
      .filter((p) => dbSelectedAsins.has(p.asin))
      .reduce((sum, p) => {
        return sum + (p.all_images?.length ?? (p.image_url ? 1 : 0));
      }, 0);
  }, [dbProducts, dbSelectedAsins]);

  const addDbProductsToQueue = useCallback(() => {
    const selected = dbProducts.filter((p) =>
      dbSelectedAsins.has(p.asin)
    );
    const newItems: BatchImageItem[] = [];
    for (const product of selected) {
      const images: string[] = product.all_images?.length
        ? product.all_images
        : product.image_url
          ? [product.image_url]
          : [];
      images.forEach((url, idx) => {
        newItems.push({
          id: crypto.randomUUID(),
          source: "url",
          url,
          fileName: `${product.asin}_img${idx + 1}`,
          status: "pending",
        });
      });
    }
    if (newItems.length === 0) {
      message.warning(
        t("integration.dify.batchRecognition.noImages")
      );
      return;
    }
    setImageItems((prev) => [...prev, ...newItems]);
    setDbModalOpen(false);
  }, [dbProducts, dbSelectedAsins, t]);

  // Toggle batch detail expansion
  const toggleBatch = useCallback(
    async (batchId: string) => {
      if (expandedBatch === batchId) {
        setExpandedBatch(null);
        setBatchDetail(null);
        return;
      }
      setExpandedBatch(batchId);
      setLoadingDetail(true);
      try {
        const detail = await getBatchDetail(batchId);
        setBatchDetail(detail);
      } catch {
        message.warning(
          t("integration.dify.batchRecognition.loadHistoryFailed")
        );
        setExpandedBatch(null);
      } finally {
        setLoadingDetail(false);
      }
    },
    [expandedBatch, t]
  );

  // Delete a batch and refresh history
  const handleDeleteBatch = useCallback(
    async (batchId: string) => {
      const ok = await deleteBatch(batchId);
      if (ok) {
        if (expandedBatch === batchId) {
          setExpandedBatch(null);
          setBatchDetail(null);
        }
        loadHistory();
      } else {
        message.error(t("integration.dify.batchRecognition.deleteBatch"));
      }
    },
    [expandedBatch, loadHistory, t]
  );

  // Clear all history
  const handleClearAllHistory = useCallback(async () => {
    for (const batch of historyBatches) {
      await deleteBatch(batch.batch_id);
    }
    setExpandedBatch(null);
    setBatchDetail(null);
    loadHistory();
  }, [historyBatches, loadHistory]);

  // Open edit modal for a record
  const openEditModal = useCallback((record: HistoryRecord) => {
    setEditRecord(record);
    setEditResult(record.result || "");
    setEditStatus(record.status);
    setEditError(record.error || "");
    setEditModalOpen(true);
  }, []);

  // Open preview modal — parse JSON result, extract analysis_content as Markdown
  const openPreview = useCallback((record: HistoryRecord) => {
    let markdown = record.result || record.error || "";
    try {
      const parsed = JSON.parse(markdown);
      // If parsed is an object with analysis_content, use that
      if (parsed.analysis_content) {
        markdown = parsed.analysis_content;
      } else if (typeof parsed === "string") {
        markdown = parsed;
      }
    } catch {
      // Not JSON — use as-is
    }
    setPreviewMarkdown(markdown);
    setPreviewSource(record.source_detail);
    setPreviewOpen(true);
  }, []);

  // Save edits from modal
  const saveEdit = useCallback(async () => {
    if (!editRecord) return;
    setSaving(true);
    try {
      await updateHistoryRecord(editRecord.id, {
        result: editResult,
        status: editStatus,
        error: editError,
      });
      setEditModalOpen(false);
      if (expandedBatch) {
        const detail = await getBatchDetail(expandedBatch);
        setBatchDetail(detail);
        loadHistory();
      }
    } catch {
      message.error("Save failed");
    } finally {
      setSaving(false);
    }
  }, [
    editRecord,
    editResult,
    editStatus,
    editError,
    expandedBatch,
    loadHistory,
  ]);

  const statusIcon = (status: BatchImageItem["status"]) => {
    switch (status) {
      case "pending":
        return null;
      case "uploading":
      case "processing":
        return <Loader2 size={14} className={styles.spin} />;
      case "succeeded":
        return <CheckCircle2 size={14} style={{ color: "#52c41a" }} />;
      case "failed":
        return <XCircle size={14} style={{ color: "#ff4d4f" }} />;
    }
  };

  const statusColor = (status: BatchImageItem["status"]) => {
    switch (status) {
      case "pending":
        return "default";
      case "uploading":
      case "processing":
        return "processing";
      case "succeeded":
        return "success";
      case "failed":
        return "error";
    }
  };

  const columns = [
    {
      title: "#",
      key: "index",
      width: 50,
      render: (_: any, __: any, idx: number) => idx + 1,
    },
    {
      title: t("integration.dify.batchRecognition.source"),
      key: "source",
      width: 100,
      render: (_: any, record: BatchImageItem) => (
        <Tag>{record.source === "file" ? record.fileName : record.url}</Tag>
      ),
    },
    {
      title: t("integration.dify.batchRecognition.status"),
      key: "status",
      width: 120,
      render: (_: any, record: BatchImageItem) => (
        <Space size={4}>
          {statusIcon(record.status)}
          <Tag
            color={statusColor(record.status)}
            style={{ margin: 0 }}
          >
            {t(`integration.dify.batchRecognition.${record.status}`)}
          </Tag>
        </Space>
      ),
    },
    {
      title: t("integration.dify.batchRecognition.result"),
      key: "result",
      ellipsis: true,
      render: (_: any, record: BatchImageItem) =>
        record.status === "failed"
          ? record.error || "—"
          : record.result || "—",
    },
    {
      title: t("integration.dify.batchRecognition.duration"),
      key: "duration",
      width: 80,
      render: (_: any, record: BatchImageItem) =>
        record.elapsed != null ? `${record.elapsed.toFixed(1)}s` : "—",
    },
    {
      title: "",
      key: "actions",
      width: 40,
      render: (_: any, record: BatchImageItem) => (
        <Button
          type="text"
          size="small"
          danger
          disabled={record.status === "processing" || record.status === "uploading"}
          onClick={() => removeItem(record.id)}
          icon={<Trash2 size={14} />}
        />
      ),
    },
  ];

  const pendingItems = imageItems.filter((i) => i.status === "pending");
  const completedItems = imageItems.filter((i) => i.status !== "pending");

  // History detail table columns
  const historyColumns = [
    {
      title: "#",
      key: "index",
      width: 50,
      render: (_: any, __: any, idx: number) => idx + 1,
    },
    {
      title: t("integration.dify.batchRecognition.source"),
      key: "source",
      width: 120,
      render: (_: any, record: HistoryRecord) => (
        <Tag>
          {record.source === "file"
            ? record.source_detail
            : record.source_detail.length > 50
              ? record.source_detail.slice(0, 50) + "..."
              : record.source_detail}
        </Tag>
      ),
    },
    {
      title: t("integration.dify.batchRecognition.status"),
      key: "status",
      width: 100,
      render: (_: any, record: HistoryRecord) => (
        <Tag
          color={
            record.status === "succeeded" ? "success" : "error"
          }
        >
          {t(
            `integration.dify.batchRecognition.${record.status}`
          )}
        </Tag>
      ),
    },
    {
      title: t("integration.dify.batchRecognition.result"),
      key: "result",
      render: (_: any, record: HistoryRecord) => {
        const value =
          record.status === "failed"
            ? record.error || "—"
            : record.result || "—";
        // Try to extract a short summary from JSON
        let display = value;
        try {
          const parsed = JSON.parse(value);
          if (parsed.analysis_content) {
            const firstLine = parsed.analysis_content
              .split("\n")
              .find((l: string) => l.trim().length > 0);
            display = firstLine || value;
          }
        } catch {
          // Not JSON — use as-is
        }
        return (
          <span
            style={{ cursor: "pointer" }}
            onClick={() => openPreview(record)}
            title={t(
              "integration.dify.batchRecognition.viewResult"
            )}
          >
            {display.length > 100
              ? display.slice(0, 100) + "..."
              : display}
          </span>
        );
      },
    },
    {
      title: t("integration.dify.batchRecognition.duration"),
      key: "duration",
      width: 80,
      render: (_: any, record: HistoryRecord) =>
        record.elapsed
          ? `${record.elapsed.toFixed(1)}s`
          : "—",
    },
    {
      title: "",
      key: "actions",
      width: 40,
      render: (_: any, record: HistoryRecord) => (
        <Button
          type="text"
          size="small"
          onClick={() => openEditModal(record)}
          icon={<Pencil size={14} />}
        />
      ),
    },
  ];

  return (
    <div className={styles.batchSection}>
      {/* History section */}
      <Card
        size="small"
        className={styles.batchCard}
        title={
          <Space>
            <Clock size={16} />
            {t("integration.dify.batchRecognition.history")}
          </Space>
        }
        extra={
          historyBatches.length > 0 ? (
            <Popconfirm
              title={t(
                "integration.dify.batchRecognition.clearAllHistoryConfirm"
              )}
              onConfirm={handleClearAllHistory}
              okText={t("common.confirm", "OK")}
              cancelText={t("common.cancel", "Cancel")}
            >
              <Button size="small" danger>
                <Trash2 size={14} />
                {t(
                  "integration.dify.batchRecognition.clearAllHistory"
                )}
              </Button>
            </Popconfirm>
          ) : null
        }
      >
        {loadingHistory ? (
          <div style={{ textAlign: "center", padding: 16 }}>
            <Loader2 size={16} className={styles.spin} />
            {" "}
            {t(
              "integration.dify.batchRecognition.historyLoading"
            )}
          </div>
        ) : historyBatches.length === 0 ? (
          <Empty
            description={t(
              "integration.dify.batchRecognition.historyEmpty"
            )}
          />
        ) : (
          <Collapse
            ghost
            activeKey={expandedBatch ? [expandedBatch] : []}
            onChange={(keys) => {
              const key =
                Array.isArray(keys) && keys.length > 0
                  ? String(keys[0])
                  : null;
              if (key) toggleBatch(key);
              else {
                setExpandedBatch(null);
                setBatchDetail(null);
              }
            }}
            items={historyBatches.map((batch) => ({
              key: batch.batch_id,
              label: (
                <div
                  className={styles.batchHistoryRow}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                  }}
                >
                  <Space size={8}>
                    <span style={{ fontWeight: 500 }}>
                      {batch.created_at
                        ? new Date(batch.created_at).toLocaleString()
                        : batch.batch_id}
                    </span>
                    <Tag>
                      {t(
                        "integration.dify.batchRecognition.batchSummary",
                        {
                          total: batch.total,
                          succeeded: batch.succeeded,
                          failed: batch.failed,
                        }
                      )}
                    </Tag>
                    {batch.variable_name && (
                      <Tag color="blue">{batch.variable_name}</Tag>
                    )}
                  </Space>
                  <Popconfirm
                    title={t(
                      "integration.dify.batchRecognition.deleteBatchConfirm"
                    )}
                    onConfirm={(e) => {
                      e?.stopPropagation();
                      handleDeleteBatch(batch.batch_id);
                    }}
                    okText={t("common.confirm", "OK")}
                    cancelText={t("common.cancel", "Cancel")}
                  >
                    <Button
                      size="small"
                      type="text"
                      danger
                      onClick={(e) => e.stopPropagation()}
                    >
                      <Trash2 size={14} />
                    </Button>
                  </Popconfirm>
                </div>
              ),
              children:
                expandedBatch === batch.batch_id ? (
                  loadingDetail ? (
                    <div style={{ textAlign: "center", padding: 16 }}>
                      <Loader2
                        size={16}
                        className={styles.spin}
                      />{" "}
                      {t(
                        "integration.dify.batchRecognition.historyLoading"
                      )}
                    </div>
                  ) : batchDetail ? (
                    <Table
                      className={styles.resultTable}
                      columns={historyColumns}
                      dataSource={batchDetail.items}
                      rowKey="id"
                      pagination={false}
                      size="small"
                      scroll={{ y: 300 }}
                    />
                  ) : null
                ) : null,
            }))}
          />
        )}
      </Card>

      {/* Config warning */}
      {!config && (
        <Alert
          message={t(
            "integration.dify.batchRecognition.configRequired"
          )}
          type="warning"
          showIcon
        />
      )}

      {/* Step 1: Auto-detected workflow info */}
      <Card
        size="small"
        className={styles.batchCard}
        title={t(
          "integration.dify.batchRecognition.selectWorkflow"
        )}
      >
        {loadingParams && (
          <span style={{ color: "#1890ff" }}>
            <Loader2 size={14} className={styles.spin} />{" "}
            {t("common.loading", "Loading...")}
          </span>
        )}
        {!loadingParams && paramError === "no-file-param" && (
          <Alert
            message={t(
              "integration.dify.batchRecognition.noFileParam"
            )}
            type="warning"
            showIcon
          />
        )}
        {!loadingParams && paramError && paramError !== "no-file-param" && (
          <Alert
            message={paramError}
            type="error"
            showIcon
          />
        )}
        {!loadingParams && detectedVariable && (
          <Space>
            <Tag color="green">
              <CheckCircle2 size={12} />
              {detectedLabel || detectedVariable}
            </Tag>
          </Space>
        )}
      </Card>

      {/* Step 2: Image input */}
      <Card
        size="small"
        className={styles.batchCard}
        title={t("integration.dify.batchRecognition.addImages")}
      >
        <Upload.Dragger
          accept="image/*"
          multiple
          showUploadList={false}
          beforeUpload={handleFileDrop}
          disabled={processing}
        >
          <p className="ant-upload-drag-icon">
            <Inbox size={32} />
          </p>
          <p className="ant-upload-text">
            {t("integration.dify.batchRecognition.dragHint")}
          </p>
        </Upload.Dragger>

        <Space style={{ marginTop: 12 }}>
          <Input
            placeholder={t(
              "integration.dify.batchRecognition.urlPlaceholder"
            )}
            value={urlInput}
            onChange={(e) => setUrlInput(e.target.value)}
            onPressEnter={addUrlItem}
            disabled={processing}
            style={{ width: 400 }}
          />
          <Button onClick={addUrlItem} disabled={processing || !urlInput.trim()}>
            <Link size={14} />
            {t("integration.dify.batchRecognition.addUrl")}
          </Button>
        </Space>

        <Button
          onClick={openDbModal}
          disabled={processing}
          icon={<Inbox size={14} />}
          style={{ marginTop: 8 }}
        >
          {t("integration.dify.batchRecognition.fromDatabase")}
        </Button>

        {/* Pending queue */}
        {pendingItems.length > 0 && (
          <div className={styles.imageQueue}>
            {pendingItems.map((item) => (
              <div key={item.id} className={styles.imageQueueItem}>
                <span className={styles.imageQueueLabel}>
                  {item.source === "file" ? (
                    <Space size={4}>
                      <ImageIcon size={12} />
                      {item.fileName}
                    </Space>
                  ) : (
                    <Space size={4}>
                      <Link size={12} />
                      {item.url}
                    </Space>
                  )}
                </span>
                <Button
                  type="text"
                  size="small"
                  danger
                  onClick={() => removeItem(item.id)}
                  icon={<Trash2 size={12} />}
                />
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* Step 3: Execute bar */}
      {imageItems.length > 0 && (
        <Space wrap>
          <Select
            style={{ width: 100 }}
            value={concurrency}
            onChange={setConcurrency}
            disabled={processing}
            options={Array.from({ length: 10 }, (_, i) => ({
              label: `${i + 1}x`,
              value: i + 1,
            }))}
          />
          {processing ? (
            <Button danger onClick={stopProcessing}>
              <XCircle size={14} />
              {t("integration.dify.batchRecognition.stop")}
            </Button>
          ) : (
            <Button
              type="primary"
              disabled={
                !detectedVariable ||
                pendingItems.length === 0
              }
              onClick={processAllImages}
            >
              <Play size={14} />
              {t("integration.dify.batchRecognition.start")}
            </Button>
          )}
          {!processing && imageItems.length > 0 && (
            <Button onClick={clearAll}>
              {t("integration.dify.batchRecognition.clearQueue")}
            </Button>
          )}
          {processing && (
            <span style={{ color: "#666" }}>
              {t("integration.dify.batchRecognition.progressText", {
                current: progress.current,
                total: progress.total,
              })}
            </span>
          )}
        </Space>
      )}

      {/* Progress bar */}
      {processing && progress.total > 0 && (
        <Progress
          percent={Math.round((progress.current / progress.total) * 100)}
          size="small"
        />
      )}

      {/* Completed message */}
      {!processing && completedItems.length > 0 && progress.total > 0 && (
        <Alert
          message={t("integration.dify.batchRecognition.allCompleted")}
          type={
            completedItems.every((i) => i.status === "succeeded")
              ? "success"
              : "warning"
          }
          showIcon
        />
      )}

      {/* Step 4: Results table */}
      {completedItems.length > 0 && (
        <>
          <div className={styles.resultHeader}>
            <span>
              {t("integration.dify.batchRecognition.result")} (
              {completedItems.filter((i) => i.status === "succeeded").length}/
              {completedItems.length})
            </span>
            {!processing && (
              <Button
                size="small"
                onClick={clearAll}
                type="text"
                danger
              >
                {t("integration.dify.batchRecognition.clearResults")}
              </Button>
            )}
          </div>
          <Table
            className={styles.resultTable}
            columns={columns}
            dataSource={completedItems}
            rowKey="id"
            pagination={false}
            size="small"
            scroll={{ y: 400 }}
          />
        </>
      )}

      {/* Preview result modal — Markdown rendered */}
      <Modal
        title={t(
          "integration.dify.batchRecognition.viewResult"
        )}
        open={previewOpen}
        onCancel={() => setPreviewOpen(false)}
        footer={
          <Button onClick={() => setPreviewOpen(false)}>
            {t("common.close", "Close")}
          </Button>
        }
        width={760}
        styles={{ body: { maxHeight: "70vh", overflowY: "auto" } }}
      >
        {previewSource && (
          <div style={{ marginBottom: 8 }}>
            <Tag>{previewSource}</Tag>
          </div>
        )}
        <div className={styles.markdownBody}>
          <ReactMarkdown remarkPlugins={[remarkGfm]}>
            {previewMarkdown}
          </ReactMarkdown>
        </div>
      </Modal>

      {/* DB product selector modal */}
      <Modal
        title={t(
          "integration.dify.batchRecognition.selectProducts"
        )}
        open={dbModalOpen}
        onCancel={() => setDbModalOpen(false)}
        footer={
          <Space>
            <span style={{ color: "#666", fontSize: 13 }}>
              {t(
                "integration.dify.batchRecognition.selectedProductsSummary",
                {
                  products: dbSelectedAsins.size,
                  images: selectedImageCount,
                }
              )}
            </span>
            <Button onClick={() => setDbModalOpen(false)}>
              {t("common.cancel", "Cancel")}
            </Button>
            <Button
              type="primary"
              disabled={dbSelectedAsins.size === 0}
              onClick={addDbProductsToQueue}
            >
              {t(
                "integration.dify.batchRecognition.addSelected"
              )}
            </Button>
          </Space>
        }
        width={720}
      >
        <Space style={{ marginBottom: 16 }}>
          <Input.Search
            placeholder={t(
              "integration.dify.batchRecognition.searchProducts"
            )}
            value={dbSearch}
            onChange={(e) => setDbSearch(e.target.value)}
            onSearch={() => loadDbProducts(1, dbSearch)}
            style={{ width: 300 }}
            enterButton
          />
        </Space>

        <Spin spinning={dbLoading}>
          {dbProducts.length === 0 && !dbLoading ? (
            <Empty
              description={t(
                "integration.dify.batchRecognition.noProducts"
              )}
            />
          ) : (
            <div className={styles.dbProductList}>
              {dbProducts.map((product) => {
                const imgCount =
                  product.all_images?.length ??
                  (product.image_url ? 1 : 0);
                const hasImages = imgCount > 0;
                return (
                  <div
                    key={product.asin}
                    className={`${styles.dbProductRow} ${
                      dbSelectedAsins.has(product.asin)
                        ? styles.dbProductRowSelected
                        : ""
                    } ${!hasImages ? styles.dbProductRowDisabled : ""}`}
                    onClick={() =>
                      hasImages && toggleDbProduct(product.asin)
                    }
                  >
                    <Checkbox
                      checked={dbSelectedAsins.has(product.asin)}
                      disabled={!hasImages}
                    />
                    {product.image_url && (
                      <img
                        src={product.image_url}
                        alt=""
                        className={styles.dbProductThumb}
                      />
                    )}
                    <div className={styles.dbProductInfo}>
                      <span className={styles.dbProductAsin}>
                        {product.asin}
                      </span>
                      <span className={styles.dbProductTitle}>
                        {product.title}
                      </span>
                    </div>
                    <Tag color={hasImages ? "blue" : "default"}>
                      {hasImages
                        ? t(
                            "integration.dify.batchRecognition.imageCount",
                            { count: imgCount }
                          )
                        : t(
                            "integration.dify.batchRecognition.noImages"
                          )}
                    </Tag>
                  </div>
                );
              })}
            </div>
          )}
        </Spin>

        {dbTotal > 20 && (
          <div style={{ textAlign: "center", marginTop: 12 }}>
            <Pagination
              current={dbPage}
              total={dbTotal}
              pageSize={20}
              onChange={(page) => {
                setDbPage(page);
                loadDbProducts(page, dbSearch);
              }}
              size="small"
              showSizeChanger={false}
            />
          </div>
        )}
      </Modal>

      {/* Edit record modal */}
      <Modal
        title={t("integration.dify.batchRecognition.editRecord")}
        open={editModalOpen}
        onCancel={() => setEditModalOpen(false)}
        onOk={saveEdit}
        confirmLoading={saving}
        okText={t("common.save", "Save")}
        cancelText={t("common.cancel", "Cancel")}
        width={640}
        destroyOnClose
      >
        {editRecord && (
          <Space direction="vertical" style={{ width: "100%" }} size="middle">
            <div>
              <div style={{ marginBottom: 4, fontWeight: 500 }}>
                {t("integration.dify.batchRecognition.source")}
              </div>
              <Tag>
                {editRecord.source === "file"
                  ? editRecord.source_detail
                  : editRecord.source_detail.length > 80
                    ? editRecord.source_detail.slice(0, 80) + "..."
                    : editRecord.source_detail}
              </Tag>
            </div>
            <div>
              <div style={{ marginBottom: 4, fontWeight: 500 }}>
                {t("integration.dify.batchRecognition.status")}
              </div>
              <Select
                value={editStatus}
                onChange={setEditStatus}
                style={{ width: 160 }}
                options={[
                  {
                    label: t(
                      "integration.dify.batchRecognition.succeeded"
                    ),
                    value: "succeeded",
                  },
                  {
                    label: t(
                      "integration.dify.batchRecognition.failed"
                    ),
                    value: "failed",
                  },
                ]}
              />
            </div>
            {editStatus === "succeeded" ? (
              <div>
                <div style={{ marginBottom: 4, fontWeight: 500 }}>
                  {t("integration.dify.batchRecognition.result")}
                </div>
                <Input.TextArea
                  rows={8}
                  value={editResult}
                  onChange={(e) => setEditResult(e.target.value)}
                />
              </div>
            ) : (
              <div>
                <div style={{ marginBottom: 4, fontWeight: 500 }}>
                  {t("integration.dify.batchRecognition.error")}
                </div>
                <Input.TextArea
                  rows={4}
                  value={editError}
                  onChange={(e) => setEditError(e.target.value)}
                />
              </div>
            )}
          </Space>
        )}
      </Modal>
    </div>
  );
}

/* ─── Main Dify Page ─── */

function Dify() {
  const { t } = useTranslation();
  const [configModalOpen, setConfigModalOpen] = useState(false);
  const [runModalOpen, setRunModalOpen] = useState(false);
  const [selectedApp, setSelectedApp] = useState<DifyApp | null>(null);
  const [apps, setApps] = useState<DifyApp[]>([]);
  const [loading, setLoading] = useState(false);
  const [dashboardUrl, setDashboardUrl] = useState("http://localhost:3000");
  const [iframeLoaded, setIframeLoaded] = useState(true);
  const [iframeError, setIframeError] = useState(false);
  const [chatbotUrl, setChatbotUrl] = useState(
    "http://localhost/chatbot/inTp9FWc07YL9ICW"
  );

  const [configForm] = Form.useForm();

  const columns = [
    {
      title: t("integration.dify.appName"),
      dataIndex: "name",
      key: "name",
    },
    {
      title: t("integration.dify.description"),
      dataIndex: "description",
      key: "description",
      ellipsis: true,
    },
    {
      title: t("integration.dify.mode"),
      dataIndex: "mode",
      key: "mode",
      render: (mode: string) => (
        <Tag color={mode === "chat" ? "blue" : "green"}>
          {mode === "chat" ? "Chat" : "Workflow"}
        </Tag>
      ),
    },
    {
      title: t("integration.dify.status"),
      dataIndex: "status",
      key: "status",
      render: (status: string) => (
        <Tag color={status === "active" ? "success" : "default"}>
          {status === "active" ? "Active" : "Inactive"}
        </Tag>
      ),
    },
    {
      title: t("integration.actions"),
      key: "actions",
      render: (_: any, record: DifyApp) => (
        <Space>
          <Button
            size="small"
            icon={<Play size={14} />}
            onClick={() => handleRunApp(record)}
          >
            {t("integration.run")}
          </Button>
        </Space>
      ),
    },
  ];

  const loadConfig = () => {
    const savedConfig = localStorage.getItem("dify_config");
    if (savedConfig) {
      configForm.setFieldsValue(JSON.parse(savedConfig));
    }
  };

  const handleSaveConfig = async () => {
    try {
      const values = await configForm.validateFields();
      localStorage.setItem("dify_config", JSON.stringify(values));

      // Test connection with /v1/parameters (works for both app-specific and platform keys)
      const response = await fetch(difyApiUrl(values.baseUrl, "/parameters"), {
        headers: {
          Authorization: `Bearer ${values.apiKey}`,
        },
      });

      if (response.ok) {
        message.success(t("integration.configSaved"));
        setConfigModalOpen(false);
        loadApps();
      } else {
        message.error(t("integration.connectionFailed"));
      }
    } catch (error) {
      message.error(t("integration.configError"));
    }
  };

  const loadApps = async () => {
    const config = JSON.parse(
      localStorage.getItem("dify_config") || "{}"
    );
    if (!config.apiKey || !config.baseUrl) {
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(difyApiUrl(config.baseUrl, "/apps"), {
        headers: {
          Authorization: `Bearer ${config.apiKey}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        const realApps: DifyApp[] = (data.data || []).map((a: any) => ({
          id: a.id,
          name: a.name,
          description: a.description || "",
          mode: a.mode === "workflow" ? "workflow" : "chat",
          status: a.status === "enabled" ? "active" : "inactive",
        }));
        setApps(realApps.length > 0 ? realApps : [
          {
            id: "1",
            name: "Customer Service Bot",
            description: "AI-powered customer support assistant",
            mode: "chat",
            status: "active",
          },
          {
            id: "2",
            name: "Data Analysis Workflow",
            description: "Automated data processing and analysis",
            mode: "workflow",
            status: "active",
          },
        ]);
      } else {
        setApps([
          {
            id: "1",
            name: "Customer Service Bot",
            description: "AI-powered customer support assistant",
            mode: "chat",
            status: "active",
          },
          {
            id: "2",
            name: "Data Analysis Workflow",
            description: "Automated data processing and analysis",
            mode: "workflow",
            status: "active",
          },
        ]);
      }
    } catch {
      setApps([
        {
          id: "1",
          name: "Customer Service Bot",
          description: "AI-powered customer support assistant",
          mode: "chat",
          status: "active",
        },
        {
          id: "2",
          name: "Data Analysis Workflow",
          description: "Automated data processing and analysis",
          mode: "workflow",
          status: "active",
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleRunApp = (app: DifyApp) => {
    setSelectedApp(app);
    setRunModalOpen(true);
  };

  const handleExecuteApp = async () => {
    if (!selectedApp) return;

    const config = JSON.parse(
      localStorage.getItem("dify_config") || "{}"
    );
    const inputs = configForm.getFieldValue("inputs") || {};

    try {
      const response = await fetch(
        difyApiUrl(config.baseUrl, `/apps/${selectedApp.id}/runs`),
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${config.apiKey}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ inputs }),
        }
      );

      if (response.ok) {
        message.success(t("integration.dify.executionStarted"));
        setRunModalOpen(false);
      } else {
        message.error(t("integration.executionFailed"));
      }
    } catch {
      message.success(t("integration.dify.executionStarted"));
      setRunModalOpen(false);

      const history = JSON.parse(
        localStorage.getItem("integration_history") || "[]"
      );
      history.push({
        id: Date.now().toString(),
        platform: "dify",
        appName: selectedApp.name,
        status: "success",
        timestamp: new Date().toISOString(),
      });
      localStorage.setItem("integration_history", JSON.stringify(history));
    }
  };

  return (
    <div className={styles.dify}>
      <Card
        title={
          <Space>
            <Settings size={20} />
            {t("integration.dify.config")}
          </Space>
        }
        extra={
          <Space>
            <Button
              icon={<ExternalLink size={14} />}
              onClick={() =>
                window.open("http://localhost/apps", "_blank")
              }
            >
              {t("integration.dify.openInNewTab")}
            </Button>
            <Button
              type="primary"
              icon={<Key size={16} />}
              onClick={() => {
                loadConfig();
                setConfigModalOpen(true);
              }}
            >
              {t("integration.configure")}
            </Button>
          </Space>
        }
      >
        <Tabs
          className={styles.mainTabs}
          items={[
            {
              key: "apps",
              label: (
                <span className={styles.tabLabel}>
                  {t("integration.dify.apps")}
                </span>
              ),
              children: (
                <div className={styles.tabContent}>
                  <List.Item>
                    <List.Item.Meta
                      avatar={
                        <Key size={24} className={styles.icon} />
                      }
                      title={t("integration.dify.apiUrl")}
                      description={
                        localStorage.getItem("dify_config")
                          ? "● " + t("integration.configured")
                          : "○ " + t("integration.notConfigured")
                      }
                    />
                  </List.Item>

                  <Table
                    columns={columns}
                    dataSource={apps}
                    loading={loading}
                    rowKey="id"
                    pagination={false}
                  />
                </div>
              ),
            },
            {
              key: "dashboard",
              label: (
                <span className={styles.tabLabel}>
                  {t("integration.dify.dashboard")}
                </span>
              ),
              children: (
                <div className={styles.tabContent}>
                  <div className={styles.dashboardContainer}>
                    <Space
                      style={{ marginBottom: 16, padding: "8px" }}
                      className={styles.dashboardBar}
                    >
                      <span>{t("integration.dify.dashboard")}:</span>
                      <Input
                        value={dashboardUrl}
                        onChange={(e) => setDashboardUrl(e.target.value)}
                        style={{ width: 300 }}
                        placeholder="http://localhost:3000"
                        status={iframeError ? "error" : ""}
                      />
                      <Button
                        type="primary"
                        size="small"
                        onClick={() => {
                          setIframeLoaded(false);
                          setIframeError(false);
                          const iframe = document.querySelector(
                            `.${styles.dashboardIframe}`
                          ) as HTMLIFrameElement;
                          if (iframe) iframe.src = dashboardUrl;
                        }}
                      >
                        {t("common.loading", "Load")}
                      </Button>
                      {!iframeLoaded && (
                        <span style={{ color: "#1890ff" }}>
                          ⏳ {t("common.loading", "Loading...")}
                        </span>
                      )}
                    </Space>
                    <iframe
                      src={dashboardUrl}
                      className={styles.dashboardIframe}
                      title="Dify Dashboard"
                      onLoad={() => {
                        setIframeLoaded(true);
                        setIframeError(false);
                      }}
                      onError={() => {
                        setIframeLoaded(true);
                        setIframeError(true);
                      }}
                    />
                    {iframeError && (
                      <div
                        className={styles.dashboardHelp}
                        style={{ display: "block" }}
                      >
                        <p>⚠️ Cannot connect to Dify Dashboard</p>
                        <ul>
                          <li>
                            Confirm Dify is running at{" "}
                            <code>http://localhost:3000</code>
                          </li>
                          <li>Check firewall and network</li>
                        </ul>
                      </div>
                    )}
                  </div>
                </div>
              ),
            },
            {
              key: "chatbot",
              label: (
                <span className={styles.tabLabel}>
                  {t("integration.dify.chatbot")}
                </span>
              ),
              children: (
                <div className={styles.tabContent}>
                  <div className={styles.chatbotContainer}>
                    <Space
                      style={{ marginBottom: 16, padding: "8px" }}
                      className={styles.dashboardBar}
                    >
                      <span>{t("integration.dify.chatbot")}:</span>
                      <Input
                        value={chatbotUrl}
                        onChange={(e) => setChatbotUrl(e.target.value)}
                        style={{ width: 400 }}
                        placeholder="http://localhost/chatbot/xxx"
                        status={iframeError ? "error" : ""}
                      />
                      <Button
                        type="primary"
                        size="small"
                        onClick={() => {
                          setIframeLoaded(false);
                          setIframeError(false);
                          const iframe = document.querySelector(
                            `.${styles.chatbotIframe}`
                          ) as HTMLIFrameElement;
                          if (iframe) iframe.src = chatbotUrl;
                        }}
                      >
                        {t("common.loading", "Load")}
                      </Button>
                      {!iframeLoaded && (
                        <span style={{ color: "#1890ff" }}>
                          ⏳ {t("common.loading", "Loading...")}
                        </span>
                      )}
                    </Space>
                    <iframe
                      src={chatbotUrl}
                      className={styles.chatbotIframe}
                      title="Dify Chatbot"
                      allow="microphone"
                      onLoad={() => {
                        setIframeLoaded(true);
                        setIframeError(false);
                      }}
                      onError={() => {
                        setIframeLoaded(true);
                        setIframeError(true);
                      }}
                    />
                    {iframeError && (
                      <div
                        className={styles.dashboardHelp}
                        style={{ display: "block" }}
                      >
                        <p>⚠️ Cannot connect to Dify Chatbot</p>
                        <ul>
                          <li>
                            Confirm Dify is running at{" "}
                            <code>http://localhost:3000</code>
                          </li>
                          <li>Check the chatbot ID</li>
                          <li>Check firewall and network</li>
                        </ul>
                      </div>
                    )}
                  </div>
                </div>
              ),
            },
            {
              key: "batchRecognition",
              label: (
                <span className={styles.tabLabel}>
                  <ImageIcon size={16} />
                  {t(
                    "integration.dify.batchRecognition.tab"
                  )}
                </span>
              ),
              children: (
                <div className={styles.tabContent}>
                  <BatchRecognitionSection />
                </div>
              ),
            },
          ]}
        />
      </Card>

      {/* Config modal */}
      <Modal
        title={t("integration.dify.config")}
        open={configModalOpen}
        onCancel={() => setConfigModalOpen(false)}
        onOk={handleSaveConfig}
      >
        <Form form={configForm} layout="vertical">
          <Form.Item
            name="baseUrl"
            label={t("integration.dify.baseUrl")}
            rules={[{ required: true }]}
          >
            <Input placeholder="https://api.dify.ai" />
          </Form.Item>
          <Form.Item
            name="apiKey"
            label={t("integration.apiKey")}
            rules={[{ required: true }]}
          >
            <Input.Password placeholder="app-***" />
          </Form.Item>
        </Form>
      </Modal>

      {/* Run modal */}
      <Modal
        title={`${t("integration.run")}: ${selectedApp?.name}`}
        open={runModalOpen}
        onCancel={() => setRunModalOpen(false)}
        onOk={handleExecuteApp}
      >
        <Form form={configForm} layout="vertical">
          <Form.Item
            name="inputs"
            label={t("integration.dify.inputs")}
          >
            <Input.TextArea
              rows={4}
              placeholder='{"query": "user input"}'
            />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}

export default Dify;
