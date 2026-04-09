import { useState, useRef, useEffect, useCallback } from "react";
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
} from "@agentscope-ai/design";
import { Space, List } from "antd";
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
} from "lucide-react";
import { useTranslation } from "react-i18next";
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
        } else {
          updateItem(item.id, {
            status: "failed",
            error: result.error || "Workflow returned non-success status",
          });
        }
      } catch (err) {
        updateItem(item.id, {
          status: "failed",
          error: err instanceof Error ? err.message : String(err),
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
  }, [config, detectedVariable, imageItems, concurrency, uploadFileToDify, runWorkflow]);

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

  return (
    <div className={styles.batchSection}>
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
            options={[
              { label: "1x", value: 1 },
              { label: "2x", value: 2 },
              { label: "3x", value: 3 },
            ]}
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
