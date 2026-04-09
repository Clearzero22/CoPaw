import { useState, useEffect, useCallback } from "react";
import {
  Table,
  Button,
  Segmented,
  Select,
  Tooltip,
} from "antd";
import type { TableColumnsType } from "antd";
import {
  Search,
  Plus,
  Upload,
  RefreshCw,
  FileText,
  Download,
  Settings2,
  Filter,
  ArrowUpDown,
  Smartphone,
  Trash2,
  TrendingUp,
  TrendingDown,
} from "lucide-react";
import { useTranslation } from "react-i18next";
import { useTheme } from "../../../contexts/ThemeContext";
import { asinData, keywordData as initialKeywordData } from "./types";
import type { KeywordRow } from "./types";
import styles from "./index.module.less";

/* ─── Trend Sparkline (framework-agnostic SVG) ─── */

function TrendSparkline({
  data,
  isDark,
}: {
  data: number[];
  isDark: boolean;
}) {
  const width = 120;
  const height = 30;
  const max = Math.max(...data);
  const min = Math.min(...data);
  const range = max - min || 1;
  const color = isDark ? "#60a5fa" : "#3b82f6";

  const points = data
    .map((val, idx) => {
      const x = (idx / (data.length - 1)) * width;
      const y = height - ((val - min) / range) * (height - 4) - 2;
      return `${x},${y}`;
    })
    .join(" ");

  const circles = data
    .map((val, idx) => {
      const x = (idx / (data.length - 1)) * width;
      const y = height - ((val - min) / range) * (height - 4) - 2;
      return `<circle cx="${x}" cy="${y}" r="2" fill="${color}"/>`;
    })
    .join("");

  return (
    <svg width={width} height={height} style={{ overflow: "visible" }}>
      <polyline
        points={points}
        fill="none"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <g dangerouslySetInnerHTML={{ __html: circles }} />
    </svg>
  );
}

/* ─── Main Component ─── */

export default function KeywordMonitorKimi() {
  const { t } = useTranslation();
  const { isDark } = useTheme();
  const [activeAsin, setActiveAsin] = useState("B01N22CM3F");
  const [asinFilter, setAsinFilter] = useState<string>("all");
  const [rankFilter, setRankFilter] = useState<string>("all");
  const [keywords, setKeywords] = useState<KeywordRow[]>(initialKeywordData);
  const [loading, setLoading] = useState(false);

  const handleAsinClick = useCallback((asinId: string) => {
    setActiveAsin(asinId);
    setLoading(true);
    setTimeout(() => setLoading(false), 300);
  }, []);

  // Simulated real-time trend update every 5s
  useEffect(() => {
    const timer = setInterval(() => {
      setKeywords((prev) =>
        prev.map((kw) => {
          const trend = [...kw.trend];
          const last = trend[trend.length - 1];
          const change = Math.floor(Math.random() * 3) - 1;
          let newVal = last + change;
          if (newVal < 1) newVal = 1;
          if (newVal > 10) newVal = 10;
          trend.shift();
          trend.push(newVal);
          return { ...kw, trend };
        }),
      );
    }, 5000);
    return () => clearInterval(timer);
  }, []);

  // Filter keywords by rank change direction
  const filteredKeywords =
    rankFilter === "all"
      ? keywords
      : rankFilter === "up"
        ? keywords.filter((kw) => kw.naturalChange > 0)
        : rankFilter === "down"
          ? keywords.filter((kw) => kw.naturalChange < 0)
          : keywords;

  // Table columns
  const columns: TableColumnsType<KeywordRow> = [
    {
      title: t("sellerTools.keywordKimi.colKeyword"),
      dataIndex: "word",
      key: "word",
      width: 200,
      render: (text: string) => (
        <span style={{ fontWeight: 500 }}>{text}</span>
      ),
    },
    {
      title: t("sellerTools.keywordKimi.colType"),
      dataIndex: "type",
      key: "type",
      width: 80,
      align: "center",
      render: (text: string) =>
        text ? <span className={styles.typeTag}>{text}</span> : "-",
    },
    {
      title: t("sellerTools.keywordKimi.colZip"),
      dataIndex: "zip",
      key: "zip",
      width: 100,
    },
    {
      title: t("sellerTools.keywordKimi.colNaturalRank"),
      dataIndex: "naturalRank",
      key: "naturalRank",
      width: 120,
      align: "center",
      render: (_: number, record: KeywordRow) => (
        <div className={styles.naturalRankCell}>
          <span className={styles.naturalRankValue}>
            {t("sellerTools.keywordKimi.rankPrefix")}
            {record.naturalRank}
          </span>
          {record.naturalChange !== 0 ? (
            <span
              className={`${styles.naturalRankChange} ${
                record.naturalChange < 0
                  ? styles.down
                  : styles.up
              }`}
            >
              {record.naturalChange < 0 ? (
                <TrendingDown size={12} />
              ) : (
                <TrendingUp size={12} />
              )}
              {Math.abs(record.naturalChange)}
            </span>
          ) : (
            <span className={`${styles.naturalRankChange} ${styles.neutral}`}>
              -
            </span>
          )}
        </div>
      ),
    },
    {
      title: t("sellerTools.keywordKimi.colAdRank"),
      dataIndex: "adRank",
      key: "adRank",
      width: 120,
      align: "center",
      render: (text: string) => (
        <span className={styles.rankText}>{text}</span>
      ),
    },
    {
      title: t("sellerTools.keywordKimi.colSpRank"),
      dataIndex: "spRank",
      key: "spRank",
      width: 120,
      align: "center",
      render: (text: string) => (
        <span className={styles.rankText}>{text}</span>
      ),
    },
    {
      title: t("sellerTools.keywordKimi.colTrend"),
      dataIndex: "trend",
      key: "trend",
      width: 160,
      render: (data: number[]) => (
        <TrendSparkline data={data} isDark={isDark} />
      ),
    },
    {
      title: t("sellerTools.keywordKimi.colActions"),
      key: "actions",
      width: 80,
      align: "right",
      render: () => (
        <div className={styles.actionCell}>
          <Tooltip title={t("sellerTools.keywordKimi.detail")}>
            <button className={`${styles.tableActionBtn} ${styles.detailBtn}`}>
              <FileText size={14} />
            </button>
          </Tooltip>
          <Tooltip title={t("sellerTools.keywordKimi.delete")}>
            <button className={`${styles.tableActionBtn} ${styles.deleteBtn}`}>
              <Trash2 size={14} />
            </button>
          </Tooltip>
        </div>
      ),
    },
  ];

  return (
    <div className={styles.pageWrapper}>
      <div style={{ display: "flex", height: "100%", overflow: "hidden" }}>
        {/* ─── ASIN Sidebar Panel ─── */}
        <aside className={styles.asinPanel}>
          {/* Header with search */}
          <div className={styles.asinPanelHeader}>
            <div className={styles.asinPanelTitle}>
              <span className={styles.asinPanelTitleText}>
                {t("sellerTools.keywordKimi.asinList")}
              </span>
              <span className={styles.asinPanelBadge}>
                {t("sellerTools.keywordKimi.totalItems", { count: 127 })}
              </span>
            </div>
            <div className={styles.asinSearchWrapper}>
              <input
                className={styles.asinSearchInput}
                placeholder={t("sellerTools.keywordKimi.asinSearchPlaceholder")}
              />
              <Search
                size={14}
                className={styles.asinSearchIcon}
              />
              <button className={styles.asinAddBtn}>
                <Plus size={14} />
              </button>
            </div>
          </div>

          {/* Filter tabs */}
          <div className={styles.asinFilterTabs}>
            {(["all", "follow", "alert"] as const).map((f) => (
              <button
                key={f}
                className={`${styles.asinFilterTab} ${
                  asinFilter === f ? styles.active : ""
                }`}
                onClick={() => setAsinFilter(f)}
              >
                {t(`sellerTools.keywordKimi.filter.${f}`)}
              </button>
            ))}
          </div>

          {/* ASIN list */}
          <div className={styles.asinList}>
            {asinData.map((asin) => (
              <div
                key={asin.id}
                className={`${styles.asinItem} ${
                  activeAsin === asin.id ? styles.active : ""
                }`}
                onClick={() => handleAsinClick(asin.id)}
              >
                <div className={styles.asinItemHeader}>
                  <span className={styles.asinItemId}>{asin.id}</span>
                  {asin.status === "warning" && (
                    <span className={styles.asinWarningDot} />
                  )}
                </div>
                <div className={styles.asinItemName}>{asin.name}</div>
                <div className={styles.asinItemMeta}>
                  <span>
                    {asin.keywordCount}{" "}
                    {t("sellerTools.keywordKimi.keywords")}
                  </span>
                  <span>AC</span>
                </div>
              </div>
            ))}
          </div>

          {/* Footer */}
          <div className={styles.asinPanelFooter}>
            {t("sellerTools.keywordKimi.totalProducts", { count: 127 })}
          </div>
        </aside>

        {/* ─── Main Content ─── */}
        <main className={styles.mainContent}>
          {/* Detail header */}
          <div className={styles.detailHeader}>
            <div className={styles.detailHeaderTop}>
              <div>
                <div className={styles.detailTitleTags}>
                  <span className={styles.detailTitle}>
                    ASIN: {activeAsin}
                  </span>
                  <span className={styles.detailTagUs}>
                    {t("sellerTools.keywordKimi.us")}
                  </span>
                  <span className={styles.detailTagActive}>
                    {t("sellerTools.keywordKimi.onSale")}
                  </span>
                </div>
                <div className={styles.detailMeta}>
                  <span>
                    {t("sellerTools.keywordKimi.createdAt")}: 2025-03-20 17:16
                  </span>
                  <span>
                    {t("sellerTools.keywordKimi.creator")}: Admin
                  </span>
                </div>
              </div>
              <div className={styles.detailActions}>
                <Tooltip title={t("sellerTools.keywordKimi.note")}>
                  <button className={styles.detailActionBtn}>
                    <FileText size={18} />
                  </button>
                </Tooltip>
                <Tooltip title={t("sellerTools.keywordKimi.refresh")}>
                  <button className={styles.detailActionBtn}>
                    <RefreshCw size={18} />
                  </button>
                </Tooltip>
              </div>
            </div>

            {/* Action buttons */}
            <div className={styles.detailActionBar}>
              <div className={styles.detailActionButtons}>
                <Button type="primary" icon={<Plus size={14} />}>
                  {t("sellerTools.keywordKimi.addKeyword")}
                </Button>
                <Button icon={<Upload size={14} />}>
                  {t("sellerTools.keywordKimi.import")}
                </Button>
                <Button icon={<Smartphone size={14} />}>
                  {t("sellerTools.keywordKimi.enableMobileMonitor")}
                </Button>
              </div>
              <div className={styles.detailFreqGroup}>
                <span className={styles.detailFreqLabel}>
                  {t("sellerTools.keywordKimi.monitorFreq")}:
                </span>
                <Select
                  size="small"
                  defaultValue="2h"
                  style={{ width: 120 }}
                  options={[
                    { value: "2h", label: t("sellerTools.keywordKimi.freq.2h") },
                    { value: "6h", label: t("sellerTools.keywordKimi.freq.6h") },
                    { value: "12h", label: t("sellerTools.keywordKimi.freq.12h") },
                    { value: "1d", label: t("sellerTools.keywordKimi.freq.1d") },
                  ]}
                />
              </div>
            </div>
          </div>

          {/* Filter bar */}
          <div className={styles.filterBar}>
            <div className={styles.filterBarLeft}>
              <div className={styles.rankChangeGroup}>
                <span className={styles.rankChangeLabel}>
                  {t("sellerTools.keywordKimi.rankChange")}:
                </span>
                <Segmented
                  size="small"
                  value={rankFilter}
                  onChange={(val) => setRankFilter(val as string)}
                  options={[
                    {
                      value: "all",
                      label: t("sellerTools.keywordKimi.filter.all"),
                    },
                    {
                      value: "up",
                      label: t("sellerTools.keywordKimi.rankUp"),
                    },
                    {
                      value: "down",
                      label: t("sellerTools.keywordKimi.rankDown"),
                    },
                  ]}
                />
              </div>
              <div className={styles.filterDivider} />
              <Button
                size="small"
                variant="outlined"
                icon={<Filter size={14} />}
                style={{ color: "#666" }}
              >
                {t("sellerTools.keywordKimi.filterBtn")}
              </Button>
              <Button
                size="small"
                variant="outlined"
                icon={<ArrowUpDown size={14} />}
                style={{ color: "#666" }}
              >
                {t("sellerTools.keywordKimi.sortBtn")}
              </Button>
            </div>
            <div className={styles.filterBarRight}>
              <div className={styles.keywordSearchWrapper}>
                <input
                  className={styles.keywordSearchInput}
                  placeholder={t("sellerTools.keywordKimi.keywordSearchPlaceholder")}
                />
                <Search
                  size={14}
                  className={styles.keywordSearchIcon}
                />
              </div>
              <Tooltip title={t("sellerTools.keywordKimi.export")}>
                <button className={styles.iconBtn}>
                  <Download size={16} />
                </button>
              </Tooltip>
              <Tooltip title={t("sellerTools.keywordKimi.settings")}>
                <button className={styles.iconBtn}>
                  <Settings2 size={16} />
                </button>
              </Tooltip>
            </div>
          </div>

          {/* Data table */}
          <div className={styles.tableArea}>
            <Table<KeywordRow>
              columns={columns}
              dataSource={filteredKeywords}
              loading={loading}
              rowKey="key"
              pagination={false}
              size="middle"
              style={{ background: "transparent" }}
            />
          </div>

          {/* Pagination bar */}
          <div className={styles.paginationBar}>
            <div className={styles.paginationInfo}>
              <span>
                {t("sellerTools.keywordKimi.totalRows", { total: 103 })}
              </span>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
