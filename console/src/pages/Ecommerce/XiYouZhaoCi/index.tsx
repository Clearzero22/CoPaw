import { useState, useEffect, useCallback } from "react";
import {
  Card,
  Table,
  Input,
  Button,
  Tabs,
} from "@agentscope-ai/design";
import { Space, Popconfirm, message } from "antd";
import {
  Search,
  Play,
  Plus,
  Trash2,
} from "lucide-react";
import { useTranslation } from "react-i18next";
import api from "../../../api";
import { useKeywords } from "./useKeywords";
import { useScrape } from "./useScrape";
import { createKeywordColumns } from "./components/KeywordColumns";
import { KeywordDrawer } from "./components/KeywordDrawer";
import { StatsCards } from "./components/StatsCards";
import { AsinPicker } from "./components/AsinPicker";
import type {
  XiYouKeyword,
  XiYouKeywordStats,
} from "../../../api/types";
import styles from "./index.module.less";

export default function XiYouZhaoCi() {
  const { t } = useTranslation();

  // Keywords data
  const kw = useKeywords();

  // Scrape control
  const scrape = useScrape();

  // Detail drawer
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [detailItem, setDetailItem] =
    useState<XiYouKeyword | null>(null);

  // Stats
  const [stats, setStats] = useState<XiYouKeywordStats | null>(null);
  const [statsLoading, setStatsLoading] = useState(false);

  // ASIN input
  const [asinInput, setAsinInput] = useState("");
  const [pickerOpen, setPickerOpen] = useState(false);

  // Batch selection
  const [selectedRowKeys, setSelectedRowKeys] = useState<
    React.Key[]
  >([]);
  const [batchDeleting, setBatchDeleting] = useState(false);

  const fetchStats = useCallback(async () => {
    setStatsLoading(true);
    try {
      const data = await api.getKeywordStats();
      setStats(data as XiYouKeywordStats);
    } catch (error) {
      console.error("Failed to load stats:", error);
    } finally {
      setStatsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  const handleViewDetail = (record: XiYouKeyword) => {
    setDetailItem(record);
    setDrawerOpen(true);
  };

  const handleDelete = async (asin: string) => {
    try {
      await api.deleteKeywords(asin);
      kw.fetchKeywords();
      fetchStats();
    } catch (error) {
      console.error("Delete failed:", error);
      message.error(
        t("ecommerce.xiyouzhaoci.deleteFailed"),
      );
    }
  };

  const handleBatchDelete = async () => {
    if (selectedRowKeys.length === 0) return;
    setBatchDeleting(true);
    try {
      // Extract unique ASINs from selected rows
      const asins = [
        ...new Set(
          kw.keywords
            .filter((k) =>
              selectedRowKeys.includes(k.id),
            )
            .map((k) => k.asin),
        ),
      ];
      await api.batchDeleteKeywords(asins);
      setSelectedRowKeys([]);
      kw.fetchKeywords();
      fetchStats();
      message.success(
        t("ecommerce.xiyouzhaoci.batchDeleteSuccess"),
      );
    } catch (error) {
      console.error("Batch delete failed:", error);
      message.error(
        t("ecommerce.xiyouzhaoci.batchDeleteFailed"),
      );
    } finally {
      setBatchDeleting(false);
    }
  };

  const handleScrape = async (asins: string[]) => {
    const ok = await scrape.triggerScrape(asins);
    if (ok) {
      message.success(
        t("ecommerce.xiyouzhaoci.scrapeStarted"),
      );
    } else {
      message.error(
        t("ecommerce.xiyouzhaoci.scrapeFailed"),
      );
    }
  };

  const handleManualScrape = () => {
    const asins = asinInput
      .split(/[,\n\s]+/)
      .map((a) => a.trim().toUpperCase())
      .filter(Boolean);
    if (asins.length === 0) {
      message.warning(
        t("ecommerce.xiyouzhaoci.enterAsin"),
      );
      return;
    }
    handleScrape(asins);
    setAsinInput("");
  };

  const handlePickerSelect = (asins: string[]) => {
    handleScrape(asins);
  };

  // Refresh data when scrape completes
  useEffect(() => {
    if (
      !scrape.isRunning &&
      scrape.status === "completed"
    ) {
      kw.fetchKeywords();
      fetchStats();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [scrape.isRunning, scrape.status]);

  const columns = createKeywordColumns({
    onDelete: handleDelete,
    onViewDetail: handleViewDetail,
    t,
  });

  const tabItems = [
    {
      key: "keywords",
      label: t("ecommerce.xiyouzhaoci.tabKeywords"),
      children: (
        <div>
          <Space style={{ marginBottom: 16 }}>
            <Input
              placeholder={t(
                "ecommerce.xiyouzhaoci.searchKeyword",
              )}
              prefix={<Search size={14} />}
              value={kw.search}
              onChange={(e) =>
                kw.handleSearchChange(e.target.value)
              }
              style={{ width: 250 }}
            />
            <Input
              placeholder={t(
                "ecommerce.xiyouzhaoci.filterAsin",
              )}
              value={kw.asinFilter}
              onChange={(e) =>
                kw.handleAsinChange(e.target.value)
              }
              style={{ width: 200 }}
            />
            {selectedRowKeys.length > 0 && (
              <Popconfirm
                title={t(
                  "ecommerce.xiyouzhaoci.batchDeleteConfirm",
                  { count: selectedRowKeys.length },
                )}
                onConfirm={handleBatchDelete}
                okText={t(
                  "ecommerce.xiyouzhaoci.confirm",
                )}
                cancelText={t(
                  "ecommerce.xiyouzhaoci.cancel",
                )}
              >
                <Button
                  danger
                  icon={<Trash2 size={14} />}
                  loading={batchDeleting}
                >
                  {t(
                    "ecommerce.xiyouzhaoci.batchDeleteBtn",
                    {
                      count: selectedRowKeys.length,
                    },
                  )}
                </Button>
              </Popconfirm>
            )}
          </Space>
          <Table
            columns={columns}
            dataSource={kw.keywords}
            rowKey="id"
            loading={kw.loading}
            size="small"
            scroll={{ x: 1200 }}
            rowSelection={{
              selectedRowKeys,
              onChange: (keys: React.Key[]) =>
                setSelectedRowKeys(keys),
            }}
            pagination={{
              current: kw.page,
              total: kw.total,
              pageSize: 20,
              onChange: kw.setPage,
              showTotal: (total) =>
                `${total} ${t("ecommerce.xiyouzhaoci.totalItems")}`,
            }}
          />
        </div>
      ),
    },
    {
      key: "scrape",
      label: t("ecommerce.xiyouzhaoci.tabScrape"),
      children: (
        <div>
          {scrape.isRunning && (
            <Card size="small" style={{ marginBottom: 16 }}>
              <div className={styles.scrapeStatus}>
                <Play size={16} />
                <span>{scrape.progress}</span>
                {scrape.currentAsin && (
                  <span className={styles.asinTag}>
                    {scrape.currentAsin}
                  </span>
                )}
              </div>
            </Card>
          )}
          {scrape.error && (
            <Card
              size="small"
              style={{
                marginBottom: 16,
                borderColor: "#ff4d4f",
              }}
            >
              <span style={{ color: "#ff4d4f" }}>
                {scrape.error}
              </span>
            </Card>
          )}

          <Card
            size="small"
            title={t("ecommerce.xiyouzhaoci.manualInput")}
          >
            <Input.TextArea
              rows={4}
              placeholder={t(
                "ecommerce.xiyouzhaoci.asinPlaceholder",
              )}
              value={asinInput}
              onChange={(e) => setAsinInput(e.target.value)}
            />
            <Space style={{ marginTop: 12 }}>
              <Button
                type="primary"
                icon={<Play size={14} />}
                onClick={handleManualScrape}
                disabled={scrape.isRunning}
              >
                {t("ecommerce.xiyouzhaoci.startScrape")}
              </Button>
            </Space>
          </Card>

          <Card
            size="small"
            title={t("ecommerce.xiyouzhaoci.fromCrawlerData")}
            style={{ marginTop: 16 }}
          >
            <Button
              icon={<Plus size={14} />}
              onClick={() => setPickerOpen(true)}
              disabled={scrape.isRunning}
            >
              {t("ecommerce.xiyouzhaoci.pickAsins")}
            </Button>
          </Card>

          <AsinPicker
            open={pickerOpen}
            onClose={() => setPickerOpen(false)}
            onSelect={handlePickerSelect}
          />
        </div>
      ),
    },
    {
      key: "stats",
      label: t("ecommerce.xiyouzhaoci.tabStats"),
      children: <StatsCards stats={stats} loading={statsLoading} />,
    },
  ];

  return (
    <div>
      <Tabs items={tabItems} defaultActiveKey="keywords" />
      <KeywordDrawer
        open={drawerOpen}
        keyword={detailItem}
        onClose={() => {
          setDrawerOpen(false);
          setDetailItem(null);
        }}
      />
    </div>
  );
}
