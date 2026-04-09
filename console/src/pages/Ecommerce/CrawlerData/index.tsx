import { useState } from "react";
import {
  Card,
  Table,
  Input,
  Select,
  Button,
  Switch,
  Tabs,
  Tag,
  message,
  Empty,
  Alert,
} from "@agentscope-ai/design";
import { Space, Typography, List, Badge } from "antd";
import {
  Search,
  RefreshCw,
  Trash2,
  CheckCheck,
} from "lucide-react";
import { useTranslation } from "react-i18next";
import { useCrawlerProducts } from "./useCrawlerProducts";
import { useCrawlerJobs } from "./useCrawlerJobs";
import { useCrawlerNotifications } from "./useCrawlerNotifications";
import { createProductColumns } from "./components/ProductColumns";
import { ProductDrawer } from "./components/ProductDrawer";
import { StatsCards } from "./components/StatsCards";
import styles from "./index.module.less";
import type { CrawlerProduct, CrawlerNotification } from "../../../api/types";

function CrawlerData() {
  const { t } = useTranslation();
  const {
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
  } = useCrawlerProducts();

  const {
    runningJobs,
    recentJobs,
    loading: jobsLoading,
    triggerSearch,
    triggerDetail,
    triggerBatchDetail,
    cancelJob,
  } = useCrawlerJobs();

  const {
    notifications,
    unreadCount,
    loading: notifLoading,
    markRead,
    markAllRead,
    deleteNotification,
  } = useCrawlerNotifications();

  const [drawerOpen, setDrawerOpen] = useState(false);
  const [drawerProduct, setDrawerProduct] = useState<CrawlerProduct | null>(null);
  const [error, setError] = useState<string | null>(null);

  const withError = async <T,>(fn: () => Promise<T>): Promise<T | undefined> => {
    setError(null);
    try {
      return await fn();
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e);
      setError(msg);
      return undefined;
    }
  };

  const columns = createProductColumns({
    onGenerate: (asin: string) =>
      withError(() => generateListing(asin)) || Promise.resolve(false),
    onViewDetail: (record: CrawlerProduct) => {
      setDrawerProduct(record);
      setDrawerOpen(true);
    },
    t,
  });

  const jobStatusColor = (status: string) => {
    switch (status) {
      case "running": return "processing";
      case "completed": return "success";
      case "failed": return "error";
      default: return "default";
    }
  };

  const tabItems = [
    {
      key: "products",
      label: t("ecommerce.crawlerData.tabProducts"),
      children: (
        <div>
          <div className={styles.toolbar}>
            <Space>
              <Input
                placeholder={t("ecommerce.crawlerData.searchPlaceholder")}
                value={search}
                onChange={(e) => handleSearchChange(e.target.value)}
                allowClear
                style={{ width: 240 }}
                prefix={<Search size={14} />}
              />
              <Select
                value={detailScraped === true ? "true" : detailScraped === false ? "false" : ""}
                onChange={(v: string) =>
                  setDetailScraped(v === "" ? undefined : v === "true")
                }
                style={{ width: 140 }}
                options={[
                  { value: "", label: t("ecommerce.crawlerData.filterAllStatus") },
                  { value: "true", label: t("ecommerce.crawlerData.statusScraped") },
                  { value: "false", label: t("ecommerce.crawlerData.statusNotScraped") },
                ]}
              />
              <Select
                value={sortBy}
                onChange={setSortBy}
                style={{ width: 130 }}
                options={[
                  { value: "scraped_at", label: t("ecommerce.crawlerData.sortScrapedAt") },
                  { value: "price", label: t("ecommerce.crawlerData.sortPrice") },
                  { value: "rating", label: t("ecommerce.crawlerData.sortRating") },
                ]}
              />
              <Space style={{ fontSize: 13 }}>
                <Switch
                  size="small"
                  checked={primeOnly}
                  onChange={setPrimeOnly}
                />
                <span>Prime</span>
              </Space>
            </Space>
            <Button
              icon={<RefreshCw size={14} />}
              onClick={() => withError(() => fetchProducts())}
            >
              {t("ecommerce.crawlerData.refresh")}
            </Button>
          </div>

          <Table
            rowKey="asin"
            columns={columns}
            dataSource={products}
            loading={loading}
            pagination={{
              current: page,
              total,
              pageSize: 20,
              showSizeChanger: false,
              showTotal: (tCount: number) =>
                `${tCount} ${t("ecommerce.crawlerData.totalLabel")}`,
            }}
            onChange={(pagination) => setPage(pagination.current || 1)}
            size="small"
            locale={{
              emptyText: (
                <Empty description={t("ecommerce.crawlerData.noData")} />
              ),
            }}
          />
        </div>
      ),
    },
    {
      key: "jobs",
      label: t("ecommerce.crawlerData.tabJobs"),
      children: (
        <div>
          <div className={styles.triggerCards}>
            <Card size="small" title={t("ecommerce.crawlerData.searchScrape")} className={styles.triggerCard}>
              <Space direction="vertical" style={{ width: "100%" }}>
                <Input.Search
                  placeholder={t("ecommerce.crawlerData.keywordPlaceholder")}
                  onSearch={(kw: string) =>
                    withError(async () => {
                      const ok = await triggerSearch(kw);
                      if (ok) message.success(t("ecommerce.crawlerData.jobStarted"));
                    })
                  }
                  enterButton={t("ecommerce.crawlerData.startBtn")}
                />
              </Space>
            </Card>

            <Card size="small" title={t("ecommerce.crawlerData.detailScrape")} className={styles.triggerCard}>
              <Space direction="vertical" style={{ width: "100%" }}>
                <Input.Search
                  placeholder="B0XXXXXXXXX"
                  onSearch={(asin: string) =>
                    withError(async () => {
                      const ok = await triggerDetail(asin);
                      if (ok) message.success(t("ecommerce.crawlerData.jobStarted"));
                    })
                  }
                  enterButton={t("ecommerce.crawlerData.startBtn")}
                />
              </Space>
            </Card>

            <Card size="small" title={t("ecommerce.crawlerData.batchScrape")} className={styles.triggerCard}>
              <Space>
                <Button
                  type="primary"
                  onClick={() =>
                    withError(async () => {
                      const ok = await triggerBatchDetail();
                      if (ok) message.success(t("ecommerce.crawlerData.jobStarted"));
                    })
                  }
                >
                  {t("ecommerce.crawlerData.startBtn")}
                </Button>
              </Space>
            </Card>
          </div>

          <Table
            rowKey="job_id"
            dataSource={[...runningJobs, ...recentJobs]}
            loading={jobsLoading}
            pagination={false}
            size="small"
            columns={[
              { title: "Job ID", dataIndex: "job_id", width: 120, ellipsis: true },
              { title: t("ecommerce.crawlerData.jobType"), dataIndex: "job_type", width: 100 },
              {
                title: t("ecommerce.crawlerData.keyword"),
                dataIndex: "keyword",
                width: 150,
                ellipsis: true,
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                render: (v: string | null, record: any) =>
                  v || record?.target_asin || "-",
              },
              {
                title: t("ecommerce.crawlerData.colStatus"),
                dataIndex: "status",
                width: 100,
                render: (v: string) => <Tag color={jobStatusColor(v)}>{v}</Tag>,
              },
              {
                title: t("ecommerce.crawlerData.jobProgress"),
                width: 100,
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                render: (_: unknown, record: any) =>
                  `${record.successful_products}/${record.total_products}`,
              },
              {
                title: t("ecommerce.crawlerData.jobDuration"),
                dataIndex: "duration_seconds",
                width: 80,
                render: (v: number | null) =>
                  v != null ? `${v.toFixed(1)}s` : "-",
              },
              {
                title: t("ecommerce.crawlerData.colScrapedAt"),
                dataIndex: "started_at",
                width: 150,
                render: (v: string | null) =>
                  v ? new Date(v).toLocaleString() : "-",
              },
              {
                title: "",
                width: 80,
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                render: (_: unknown, record: any) =>
                  record.status === "running" || record.status === "pending" ? (
                    <Button
                      danger
                      size="small"
                      onClick={() =>
                        withError(async () => {
                          const ok = await cancelJob(record.job_id);
                          if (ok) message.success("Cancelled");
                        })
                      }
                    >
                      Cancel
                    </Button>
                  ) : null,
              },
            ]}
          />
        </div>
      ),
    },
    {
      key: "notifications",
      label: (
        <Badge count={unreadCount} size="small">
          {t("ecommerce.crawlerData.tabNotifications")}
        </Badge>
      ),
      children: (
        <div>
          <div style={{ marginBottom: 12, textAlign: "right" }}>
            <Button
              icon={<CheckCheck size={14} />}
              onClick={() => withError(() => markAllRead())}
              disabled={unreadCount === 0}
            >
              {t("ecommerce.crawlerData.markAllRead")}
            </Button>
          </div>
          <List
            loading={notifLoading}
            dataSource={notifications}
            locale={{
              emptyText: t("ecommerce.crawlerData.noNotifications"),
            }}
            renderItem={(item: CrawlerNotification) => (
              <List.Item
                className={!item.is_read ? styles.unreadItem : ""}
                actions={[
                  <Button
                    type="text"
                    size="small"
                    key="read"
                    onClick={() => markRead(item.id)}
                    disabled={item.is_read}
                  >
                    {item.is_read ? "Read" : "Mark read"}
                  </Button>,
                  <Button
                    type="text"
                    size="small"
                    danger
                    icon={<Trash2 size={12} />}
                    key="delete"
                    onClick={() => deleteNotification(item.id)}
                  />,
                ]}
              >
                <List.Item.Meta
                  title={
                    <span>
                      <Tag
                        color={
                          item.notification_type === "scrape_completed"
                            ? "green"
                            : "red"
                        }
                        style={{ marginRight: 8 }}
                      >
                        {item.notification_type === "scrape_completed" ? "Done" : "Failed"}
                      </Tag>
                      {item.title}
                    </span>
                  }
                  description={item.message || ""}
                />
                <Typography.Text type="secondary" style={{ whiteSpace: "nowrap" }}>
                  {item.created_at
                    ? new Date(item.created_at).toLocaleString()
                    : ""}
                </Typography.Text>
              </List.Item>
            )}
          />
        </div>
      ),
    },
    {
      key: "stats",
      label: t("ecommerce.crawlerData.tabStats"),
      children: <StatsCards />,
    },
  ];

  return (
    <div className={styles.crawlerData}>
      {error && (
        <Alert
          message={t("ecommerce.crawlerData.errorTitle")}
          description={error}
          type="warning"
          closable
          onClose={() => setError(null)}
          style={{ marginBottom: 16 }}
        />
      )}

      <Card>
        <Tabs items={tabItems} />
      </Card>

      <ProductDrawer
        open={drawerOpen}
        product={drawerProduct}
        onClose={() => {
          setDrawerOpen(false);
          setDrawerProduct(null);
        }}
        onGenerate={(asin: string) =>
          withError(() => generateListing(asin)) ?? Promise.resolve(false)}
      />
    </div>
  );
}

export default CrawlerData;
