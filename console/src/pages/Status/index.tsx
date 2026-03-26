import { useEffect, useState } from "react";
import { Card, Descriptions, Button, message, Tag } from "@agentscope-ai/design";
import { useTranslation } from "react-i18next";
import { Cpu, HardDrive, Activity, Wifi } from "lucide-react";
import styles from "./index.module.less";

interface SystemStatus {
  uptime: string;
  cpu_usage: number;
  memory_usage: number;
  disk_usage: number;
  agents_running: number;
  active_channels: number;
  api_status: "online" | "offline";
}

function StatusPage() {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState<SystemStatus | null>(null);

  const fetchStatus = async () => {
    setLoading(true);
    try {
      // 这里可以调用真实的 API
      // const data = await api.getStatus();
      // 临时使用模拟数据
      const mockData: SystemStatus = {
        uptime: "2小时 15分钟",
        cpu_usage: 25.5,
        memory_usage: 45.2,
        disk_usage: 62.8,
        agents_running: 3,
        active_channels: 5,
        api_status: "online",
      };
      setStatus(mockData);
    } catch (error) {
      message.error(t("status.loadFailed"));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStatus();
    // 每30秒自动刷新
    const interval = setInterval(fetchStatus, 30000);
    return () => clearInterval(interval);
  }, []);

  if (loading || !status) {
    return <div className={styles.loading}>{t("common.loading")}</div>;
  }

  return (
    <div className={styles.statusPage}>
      <Card className={styles.headerCard}>
        <div className={styles.header}>
          <Activity className={styles.icon} size={24} />
          <div>
            <h1>{t("status.title")}</h1>
            <p className={styles.description}>{t("status.description")}</p>
          </div>
          <Button
            type="primary"
            onClick={fetchStatus}
            loading={loading}
            className={styles.refreshBtn}
          >
            {t("status.refresh")}
          </Button>
        </div>
      </Card>

      <div className={styles.statusGrid}>
        <Card className={styles.statusCard}>
          <div className={styles.cardHeader}>
            <Cpu size={20} className={styles.cardIcon} />
            <span>{t("status.cpu")}</span>
          </div>
          <div className={styles.cardValue}>{status.cpu_usage.toFixed(1)}%</div>
          <div className={styles.progressBar}>
            <div
              className={styles.progress}
              style={{ width: `${status.cpu_usage}%` }}
            />
          </div>
        </Card>

        <Card className={styles.statusCard}>
          <div className={styles.cardHeader}>
            <HardDrive size={20} className={styles.cardIcon} />
            <span>{t("status.memory")}</span>
          </div>
          <div className={styles.cardValue}>{status.memory_usage.toFixed(1)}%</div>
          <div className={styles.progressBar}>
            <div
              className={styles.progress}
              style={{ width: `${status.memory_usage}%` }}
            />
          </div>
        </Card>

        <Card className={styles.statusCard}>
          <div className={styles.cardHeader}>
            <Wifi size={20} className={styles.cardIcon} />
            <span>{t("status.api")}</span>
          </div>
          <Tag color={status.api_status === "online" ? "success" : "error"}>
            {t(`status.${status.api_status}`)}
          </Tag>
        </Card>

        <Card className={styles.statusCard}>
          <div className={styles.cardHeader}>
            <Activity size={20} className={styles.cardIcon} />
            <span>{t("status.agents")}</span>
          </div>
          <div className={styles.cardValue}>{status.agents_running}</div>
        </Card>
      </div>

      <Card className={styles.detailsCard}>
        <Descriptions title={t("status.details")} bordered>
          <Descriptions.Item label={t("status.uptime")}>
            {status.uptime}
          </Descriptions.Item>
          <Descriptions.Item label={t("status.disk")}>
            {status.disk_usage.toFixed(1)}%
          </Descriptions.Item>
          <Descriptions.Item label={t("status.channels")}>
            {status.active_channels}
          </Descriptions.Item>
        </Descriptions>
      </Card>
    </div>
  );
}

export default StatusPage;
