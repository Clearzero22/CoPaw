import { useState, useEffect } from "react";
import { Card, Timeline, Tag, Space, Empty, Button } from "antd";
import { History as HistoryIcon, CheckCircle, XCircle, Clock, Trash2 } from "lucide-react";
import { useTranslation } from "react-i18next";
import styles from "./index.module.less";

interface HistoryItem {
  id: string;
  platform: "dify" | "n8n";
  appName?: string;
  workflowName?: string;
  status: "success" | "failed" | "pending";
  timestamp: string;
}

function History() {
  const { t } = useTranslation();
  const [history, setHistory] = useState<HistoryItem[]>([]);

  useEffect(() => {
    loadHistory();
  }, []);

  const loadHistory = () => {
    const savedHistory = localStorage.getItem("integration_history");
    if (savedHistory) {
      try {
        const parsed = JSON.parse(savedHistory);
        setHistory(parsed.sort((a: HistoryItem, b: HistoryItem) =>
          new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
        ));
      } catch (error) {
        console.error("Failed to parse history:", error);
      }
    }
  };

  const clearHistory = () => {
    localStorage.removeItem("integration_history");
    setHistory([]);
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "success":
        return <CheckCircle size={16} style={{ color: "#52c41a" }} />;
      case "failed":
        return <XCircle size={16} style={{ color: "#ff4d4f" }} />;
      case "pending":
        return <Clock size={16} style={{ color: "#faad14" }} />;
      default:
        return <Clock size={16} />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "success":
        return "success";
      case "failed":
        return "error";
      case "pending":
        return "default";
      default:
        return "default";
    }
  };

  return (
    <div className={styles.history}>
      <Card
        title={
          <Space>
            <HistoryIcon size={20} />
            {t("integration.history.title")}
          </Space>
        }
        extra={
          <Button
            icon={<Trash2 size={14} />}
            onClick={clearHistory}
            disabled={history.length === 0}
          >
            {t("integration.history.clear")}
          </Button>
        }
      >
        {history.length === 0 ? (
          <Empty description={t("integration.history.empty")} />
        ) : (
          <Timeline
            items={history.map((item) => ({
              dot: getStatusIcon(item.status),
              children: (
                <div className={styles.historyItem}>
                  <Space direction="vertical" size="small">
                    <Space>
                      <Tag color={item.platform === "dify" ? "blue" : "orange"}>
                        {item.platform.toUpperCase()}
                      </Tag>
                      <span className={styles.itemName}>
                        {item.appName || item.workflowName}
                      </span>
                      <Tag color={getStatusColor(item.status)}>
                        {item.status}
                      </Tag>
                    </Space>
                    <small className={styles.timestamp}>
                      {new Date(item.timestamp).toLocaleString()}
                    </small>
                  </Space>
                </div>
              ),
            }))}
          />
        )}
      </Card>
    </div>
  );
}

export default History;
