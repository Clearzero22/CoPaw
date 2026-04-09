import { useState } from "react";
import {
  Package,
  ChevronRight,
  Plus,
  RefreshCw,
  Download,
  Funnel,
  ArrowUpDown,
  Copy,
  Pencil,
  Search,
} from "lucide-react";
import { useTranslation } from "react-i18next";
import { useTheme } from "../../../contexts/ThemeContext";
import { asinListData, tableData } from "./types";
import type { AsinItem, TableRow } from "./types";
import styles from "./index.module.less";

const PRIMARY_TABS = ["ASIN", "父ASIN", "关键词"] as const;
const SECONDARY_TABS = ["全部", "关注"] as const;

function TrendLine({
  type,
  isDark,
}: {
  type: "flat" | "down-up" | "down-flat";
  isDark: boolean;
}) {
  const strokeColor = isDark ? "#60a5fa" : "#3b82f6";
  const fillColor = isDark
    ? "rgba(59,130,246,0.15)"
    : "rgba(59,130,246,0.1)";

  if (type === "flat") {
    return (
      <div className={styles.trendLineFlat}>
        <svg
          width="64"
          height="16"
          viewBox="0 0 60 20"
          fill="none"
        >
          <path
            d="M0,10 L60,10"
            fill="none"
            stroke={strokeColor}
            strokeWidth="1.5"
          />
        </svg>
      </div>
    );
  }

  if (type === "down-up") {
    return (
      <div className={styles.trendLine}>
        <svg
          className={styles.trendLineLayer}
          viewBox="0 0 60 24"
          preserveAspectRatio="none"
        >
          <path
            d="M0,12 L10,12 L15,20 L25,20 L30,5 L35,20 L45,20 L50,12 L60,12 L60,24 L0,24 Z"
            fill={fillColor}
          />
        </svg>
        <svg
          className={styles.trendLineStrokeLayer}
          viewBox="0 0 60 24"
          preserveAspectRatio="none"
        >
          <path
            d="M0,12 L10,12 L15,20 L25,20 L30,5 L35,20 L45,20 L50,12 L60,12"
            fill="none"
            stroke={strokeColor}
            strokeWidth="1.5"
            strokeLinejoin="round"
          />
        </svg>
      </div>
    );
  }

  // down-flat
  return (
    <div className={styles.trendLine}>
      <svg
        className={styles.trendLineLayer}
        viewBox="0 0 60 24"
        preserveAspectRatio="none"
      >
        <path
          d="M0,12 L25,12 L30,20 L35,12 L60,12 L60,24 L0,24 Z"
          fill={fillColor}
        />
      </svg>
      <svg
        className={styles.trendLineStrokeLayer}
        viewBox="0 0 60 24"
        preserveAspectRatio="none"
      >
        <path
          d="M0,12 L25,12 L30,20 L35,12 L60,12"
          fill="none"
          stroke={strokeColor}
          strokeWidth="1.5"
          strokeLinejoin="round"
        />
      </svg>
    </div>
  );
}

export default function KeywordMonitorGemini() {
  const { t } = useTranslation();
  const { isDark } = useTheme();
  const [activeAsin, setActiveAsin] = useState("B01N22CM3F");
  const [primaryTab, setPrimaryTab] = useState<string>("ASIN");
  const [secondaryTab, setSecondaryTab] = useState<string>("全部");
  const [tableFilterTab, setTableFilterTab] = useState<string>("all");

  const activeAsinData: AsinItem =
    asinListData.find((a) => a.asin === activeAsin) ??
    asinListData[asinListData.length - 1];

  function handleAsinClick(asin: AsinItem) {
    setActiveAsin(asin.asin);
  }

  return (
    <div className={styles.keywordMonitor}>
      {/* ---- Left ASIN Panel ---- */}
      <div className={styles.asinPanel}>
        <div className={styles.asinPanelHeader}>
          {/* Action buttons */}
          <div className={styles.asinActions}>
            <button className={`${styles.asinActionBtn} ${styles.primary}`}>
              <Plus size={12} style={{ marginRight: 4, verticalAlign: "middle" }} />
              {t("sellerTools.keywordGemini.addMonitor")}
            </button>
            <button className={styles.asinActionBtn}>
              {t("sellerTools.keywordGemini.import")}
            </button>
            <button className={styles.asinActionBtnIcon}>
              <RefreshCw size={12} />
            </button>
          </div>

          {/* Primary tabs */}
          <div className={styles.primaryTabs}>
            {PRIMARY_TABS.map((tab) => (
              <div
                key={tab}
                onClick={() => setPrimaryTab(tab)}
                className={`${styles.primaryTabBtn} ${primaryTab === tab ? styles.active : ""}`}
              >
                {tab}
              </div>
            ))}
          </div>

          {/* Secondary tabs */}
          <div className={styles.secondaryTabs}>
            {SECONDARY_TABS.map((tab) => (
              <div
                key={tab}
                onClick={() => setSecondaryTab(tab)}
                className={`${styles.secondaryTabBtn} ${secondaryTab === tab ? styles.active : ""}`}
              >
                {tab}
              </div>
            ))}
          </div>

          {/* Filters */}
          <div className={styles.filterRow}>
            <select className={styles.filterSelect}>
              <option>{t("sellerTools.keywordGemini.allCountries")}</option>
            </select>
            <select className={styles.filterSelect}>
              <option>{t("sellerTools.keywordGemini.monitor")}</option>
            </select>
          </div>

          <div className={styles.searchWrapper}>
            <input
              type="text"
              className={styles.searchInput}
              placeholder={t("sellerTools.keywordGemini.searchPlaceholder")}
            />
            <Search size={14} className={styles.searchIcon} />
          </div>
        </div>

        {/* ASIN list */}
        <div className={styles.asinList}>
          {asinListData.map((item) => {
            const isActive = activeAsin === item.asin;
            return (
              <div
                key={item.asin}
                onClick={() => handleAsinClick(item)}
                className={`${styles.asinItem} ${isActive ? styles.active : ""}`}
              >
                <div className={styles.asinItemContent}>
                  <div className={styles.asinItemIcon}>
                    <Package size={12} />
                  </div>
                  <div className={styles.asinItemInfo}>
                    <div className={styles.asinItemTitle}>
                      <span
                        className={`${styles.asinItemName} ${isActive ? styles.active : ""}`}
                      >
                        {item.asin}
                      </span>
                      {item.ac && <span className={styles.acBadge}>AC</span>}
                      {isActive && (
                        <Copy size={12} className={styles.copyIcon} />
                      )}
                    </div>
                    <div className={styles.asinItemCountry}>{item.country}</div>
                  </div>
                  <div className={styles.asinItemCount}>
                    <div className={styles.asinCountNum}>{item.count}</div>
                    <div className={styles.asinCountLabel}>
                      {t("sellerTools.keywordGemini.keywords")}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* ASIN pagination */}
        <div className={styles.asinPagination}>
          <span>
            {t("sellerTools.keywordGemini.totalItems", { total: 27 })}
          </span>
          <div className={styles.asinPaginationBtns}>
            <button className={styles.asinPageBtn} disabled>
              <ChevronRight
                size={12}
                style={{ transform: "rotate(180deg)" }}
              />
            </button>
            <span className={styles.asinPageCurrent}>1</span>
            <span>/ 1</span>
            <button className={styles.asinPageBtn}>
              <ChevronRight size={12} />
            </button>
          </div>
        </div>
      </div>

      {/* ---- Right Detail Panel ---- */}
      <div className={styles.detailPanel}>
        {/* Basic info card */}
        <div className={styles.infoCard}>
          <div className={styles.infoImage}>
            <Package size={24} />
          </div>
          <div className={styles.infoBody}>
            <div className={styles.infoTitle}>-</div>
            <div className={styles.infoMeta}>
              <div className={styles.infoMetaItem}>
                ASIN:{" "}
                <span className={styles.asinLink}>
                  {activeAsinData.asin}
                </span>
                {activeAsinData.ac && (
                  <span className={styles.infoAcBadge}>AC</span>
                )}
              </div>
              <div className={styles.infoMetaItem}>
                {t("sellerTools.keywordGemini.country")}:{" "}
                {activeAsinData.country}
              </div>
              <div className={styles.infoMetaItem}>
                {t("sellerTools.keywordGemini.monitor")}: -
              </div>
              <div className={styles.infoMetaItem}>
                {t("sellerTools.keywordGemini.creator")}: -
              </div>
              <div className={styles.infoMetaItem}>
                {t("sellerTools.keywordGemini.createdAt")}: 2025-05-20 17:16
              </div>
            </div>
          </div>
        </div>

        {/* Notes row */}
        <div className={styles.notesRow}>
          <span className={styles.notesLabel}>
            {t("sellerTools.keywordGemini.notes")}:
          </span>
          <span className={styles.notesValue}>-</span>
          <Pencil size={12} className={styles.notesEdit} />
        </div>

        {/* Table toolbar */}
        <div className={styles.tableToolbar}>
          <div className={styles.toolbarLeft}>
            <button className={styles.toolbarBtn}>
              {t("sellerTools.keywordGemini.addKeyword")}
            </button>
            <button className={styles.toolbarBtn}>
              {t("sellerTools.keywordGemini.importKeywords")}
            </button>
            <button className={styles.toolbarBtn}>
              {t("sellerTools.keywordGemini.autoMonitor")}
            </button>
            <button className={styles.toolbarBtn}>
              {t("sellerTools.keywordGemini.more")}
              <ChevronRight
                size={12}
                style={{ transform: "rotate(90deg)" }}
              />
            </button>
          </div>
          <div className={styles.toolbarRight}>
            <select className={styles.toolbarSelect}>
              <option>
                {t("sellerTools.keywordGemini.rankChange")}
              </option>
            </select>
            <div className={styles.toolbarToggle}>
              <div
                onClick={() => setTableFilterTab("all")}
                className={`${styles.toolbarToggleBtn} ${tableFilterTab === "all" ? styles.active : ""}`}
              >
                {t("sellerTools.keywordGemini.all")}
              </div>
              <div
                onClick={() => setTableFilterTab("watched")}
                className={`${styles.toolbarToggleBtn} ${tableFilterTab === "watched" ? styles.active : ""}`}
              >
                {t("sellerTools.keywordGemini.watched")}
              </div>
            </div>
            <div className={styles.toolbarSearchWrapper}>
              <input
                type="text"
                className={styles.toolbarSearchInput}
                placeholder={t(
                  "sellerTools.keywordGemini.tableSearchPlaceholder",
                )}
              />
              <Search size={14} className={styles.toolbarSearchIcon} />
            </div>
            <button className={styles.toolbarIconBtn}>
              <RefreshCw size={16} />
            </button>
            <button className={styles.toolbarIconBtn}>
              <Download size={16} />
            </button>
          </div>
        </div>

        {/* Data table */}
        <div className={styles.tableContainer}>
          <table className={styles.dataTable}>
            <thead className={styles.thead}>
              <tr>
                <th
                  className={styles.th}
                  rowSpan={2}
                  style={{ width: 40, textAlign: "center" }}
                >
                  <input type="checkbox" />
                </th>
                <th className={styles.th} rowSpan={2} style={{ minWidth: 150 }}>
                  {t("sellerTools.keywordGemini.keyword")}{" "}
                  <Funnel size={12} className={styles.sortIcon} />
                </th>
                <th className={styles.th} rowSpan={2} style={{ minWidth: 120 }}>
                  {t("sellerTools.keywordGemini.zipCode")}
                </th>
                {/* PC column group */}
                <th
                  className={styles.sectionHeaderCell}
                  colSpan={4}
                >
                  <span
                    className={`${styles.sectionBadge} ${styles.sectionBadgePc}`}
                  >
                    {t("sellerTools.keywordGemini.pc")}
                  </span>
                </th>
                {/* Mobile column group */}
                <th
                  className={styles.sectionHeaderCell}
                  colSpan={3}
                >
                  <span
                    className={`${styles.sectionBadge} ${styles.sectionBadgeMobile}`}
                  >
                    {t("sellerTools.keywordGemini.mobile")}
                  </span>
                </th>
                <th
                  className={`${styles.th} ${styles.thCenter} ${styles.thBorderLeft}`}
                  rowSpan={2}
                  style={{ width: 80 }}
                >
                  {t("sellerTools.keywordGemini.actions")}
                </th>
              </tr>
              <tr className={styles.subHeaderRow}>
                {/* PC sub-columns */}
                <th className={`${styles.subTh} ${styles.subThBorderLeft}`}>
                  {t("sellerTools.keywordGemini.naturalRank")}{" "}
                  <ArrowUpDown size={12} className={styles.sortIcon} />
                </th>
                <th className={styles.subTh}>
                  {t("sellerTools.keywordGemini.adRank")}{" "}
                  <ArrowUpDown size={12} className={styles.sortIcon} />
                </th>
                <th className={styles.subTh}>
                  {t("sellerTools.keywordGemini.sbvRank")}
                </th>
                <th className={styles.subTh}>
                  {t("sellerTools.keywordGemini.trend7d")}
                </th>
                {/* Mobile sub-columns */}
                <th className={`${styles.subTh} ${styles.subThBorderLeft}`}>
                  {t("sellerTools.keywordGemini.naturalRank")}{" "}
                  <ArrowUpDown size={12} className={styles.sortIcon} />
                </th>
                <th className={styles.subTh}>
                  {t("sellerTools.keywordGemini.adRank")}{" "}
                  <ArrowUpDown size={12} className={styles.sortIcon} />
                </th>
                <th className={styles.subTh}>
                  {t("sellerTools.keywordGemini.trend7d")}
                </th>
              </tr>
            </thead>
            <tbody className={styles.tbody}>
              {tableData.map((row: TableRow, idx: number) => (
                <tr key={idx} className={styles.tbodyRow}>
                  <td className={`${styles.tbodyCell} ${styles.tdCheckbox}`}>
                    <input type="checkbox" />
                  </td>
                  <td className={styles.tbodyCell}>
                    <div className={styles.keywordCell}>
                      <div className={styles.keywordName}>
                        <span className={styles.keywordMarker} />
                        {row.keyword}
                      </div>
                      <div className={styles.keywordTranslation}>
                        {t("sellerTools.keywordGemini.translation")}
                      </div>
                    </div>
                  </td>
                  <td className={styles.tbodyCell}>
                    <div className={styles.zipCell}>
                      <div className={styles.zipCode}>{row.zip}</div>
                      <div className={styles.zipCity}>{row.zipCity}</div>
                    </div>
                  </td>
                  {/* PC columns */}
                  <td className={`${styles.tbodyCell} ${styles.tbodyCellBorderLeft}`}>
                    <div className={styles.rankCell}>
                      <div className={styles.rankValue}>{row.rank1}</div>
                      <div className={styles.rankSub}>{row.rank1Sub}</div>
                    </div>
                  </td>
                  <td className={styles.tbodyCell}>
                    <div className={styles.rankDash}>{row.adRank}</div>
                    <div className={styles.rankDashSub}>
                      {t("sellerTools.keywordGemini.notInTop6")}
                    </div>
                  </td>
                  <td className={styles.tbodyCell}>
                    <div className={styles.sbvCell}>{row.sbv}</div>
                  </td>
                  <td className={styles.tbodyCell}>
                    <TrendLine type={row.trend} isDark={isDark} />
                  </td>
                  {/* Mobile columns */}
                  <td className={`${styles.tbodyCell} ${styles.tbodyCellBorderLeft}`}>
                    <div className={styles.rankCell}>
                      <div className={styles.rankValue}>{row.mRank}</div>
                      <div className={styles.rankSub}>{row.mRankSub}</div>
                    </div>
                  </td>
                  <td className={styles.tbodyCell}>
                    <div className={styles.rankDash}>{row.mAdRank}</div>
                    <div className={styles.rankDashSub}>
                      {t("sellerTools.keywordGemini.notInTop6")}
                    </div>
                  </td>
                  <td className={styles.tbodyCell}>
                    <TrendLine type={row.mTrend ?? "flat"} isDark={isDark} />
                  </td>
                  {/* Actions */}
                  <td
                    className={`${styles.tbodyCell} ${styles.tbodyCellBorderLeft} ${styles.actionsCell}`}
                  >
                    <div className={styles.actionLinks}>
                      <span className={styles.actionLink}>
                        {t("sellerTools.keywordGemini.detail")}
                      </span>
                      <span className={styles.actionLinkDelete}>
                        {t("sellerTools.keywordGemini.delete")}
                      </span>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Table pagination */}
          <div className={styles.tablePagination}>
            <span>
              {t("sellerTools.keywordGemini.totalItems", { total: 103 })}
            </span>
            <select className={styles.tablePaginationSelect}>
              <option>20{t("sellerTools.keywordGemini.itemsPerPage")}</option>
            </select>
            <div className={styles.tablePaginationBtns}>
              <button className={styles.tablePageBtn} disabled>
                <ChevronRight
                  size={12}
                  style={{ transform: "rotate(180deg)" }}
                />
              </button>
              <button className={`${styles.tablePageBtn} ${styles.active}`}>
                1
              </button>
              <button className={styles.tablePageBtn}>2</button>
              <button className={styles.tablePageBtn}>3</button>
              <button className={styles.tablePageBtn}>4</button>
              <button className={styles.tablePageBtn}>5</button>
              <span className={styles.tablePageEllipsis}>...</span>
              <button className={styles.tablePageBtn}>
                <ChevronRight size={12} />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
