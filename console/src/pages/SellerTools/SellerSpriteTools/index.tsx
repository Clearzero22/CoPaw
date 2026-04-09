import { useState } from "react";
import { Button, Modal, Tabs, Tag } from "antd";
import {
  Sparkles,
  BarChart2,
  PieChart,
  Search,
  FileText,
  Cpu,
  Monitor,
  ChevronDown,
  Star,
  Megaphone,
  Send,
  Crosshair,
  Code,
  Zap,
  ArrowRight,
  ArrowLeftRight,
  Box,
  MonitorSmartphone,
  Wrench,
} from "lucide-react";
import { useTranslation } from "react-i18next";
import { historyItems, toolColumns } from "./types";
import type { ToolLink } from "./types";
import styles from "./index.module.less";

/* ── Sidebar menu config (used as tab labels) ── */
const sidebarMenus = [
  { key: "listing", icon: FileText, labelKey: "listing", color: "#ff7a45" },
  { key: "keepa", icon: BarChart2, labelKey: "keepa", color: "#1677ff" },
  { key: "insight", icon: PieChart, labelKey: "insight", color: "#13c2c2" },
  { key: "competitor", icon: Crosshair, labelKey: "competitor", color: "#eb2f96" },
  { key: "api", icon: Cpu, labelKey: "api", color: "#52c41a" },
  { key: "mcp", icon: Monitor, labelKey: "mcp", color: "#5b5fc7" },
] as const;

/* ── Analysis sub-tabs (only for listing tab) ── */
const analysisTabKeys = [
  "copywriting",
  "visual",
  "traffic",
  "reviews",
  "panorama",
] as const;

/* ── Tag Badge ── */
function TagBadge({ type }: { type: "ai" | "new" | "free" | "auto" }) {
  if (type === "ai") {
    return (
      <Tag color="purple" style={{ fontSize: 10, lineHeight: "16px", padding: "0 4px", marginRight: 0 }}>
        AI
      </Tag>
    );
  }
  if (type === "new") {
    return (
      <Tag color="blue" style={{ fontSize: 10, lineHeight: "16px", padding: "0 4px", marginRight: 0 }}>
        New
      </Tag>
    );
  }
  if (type === "free") {
    return (
      <Tag color="green" style={{ fontSize: 10, lineHeight: "16px", padding: "0 4px", marginRight: 0 }}>
        Free
      </Tag>
    );
  }
  return (
    <Tag color="orange" style={{ fontSize: 10, lineHeight: "16px", padding: "0 4px", marginRight: 0 }}>
      Auto
    </Tag>
  );
}

/* ── Tool Link Item ── */
function ToolLinkItem({ item }: { item: ToolLink }) {
  return (
    <li className={styles.toolLinkItem}>
      <a href="#">
        {item.label}
        {item.tags?.map((tag, i) => (
          <TagBadge key={i} type={tag} />
        ))}
      </a>
    </li>
  );
}

/* ── Main Component ── */
export default function SellerSpriteTools() {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState("listing");
  const [activeAnalysisTab, setActiveAnalysisTab] = useState<string>(analysisTabKeys[0]);
  const [asinInput, setAsinInput] = useState("");
  const [toolsModalOpen, setToolsModalOpen] = useState(false);

  const menuItems = sidebarMenus.map((menu) => ({
    key: menu.key,
    label: (
      <span style={{ display: "flex", alignItems: "center", gap: 6 }}>
        <menu.icon size={16} style={{ color: menu.color }} />
        {t(`sellerTools.sellerSpriteTools.menu.${menu.labelKey}`)}
      </span>
    ),
  }));

  /* ── Listing Panel ── */
  function renderListingPanel() {
    return (
      <div className={styles.listingPanel}>
        <div className={styles.brandRow}>
          <div className={styles.brandIcon}>S</div>
          <h1 className={styles.heroTitle}>
            <span className={styles.heroTitleHighlight}>
              {t("sellerTools.sellerSpriteTools.listing.heroFrom")}
            </span>
            {t("sellerTools.sellerSpriteTools.listing.heroTo")}
            <span className={styles.heroTitleSeparator}> |</span>
          </h1>
        </div>

        <div className={styles.analysisContainer}>
          {/* Sub-tabs */}
          <div className={styles.analysisTabs}>
            {analysisTabKeys.map((key) => (
              <button
                key={key}
                className={`${styles.analysisTab} ${activeAnalysisTab === key ? styles.active : ""}`}
                onClick={() => setActiveAnalysisTab(key)}
              >
                {key === analysisTabKeys[0] && (
                  <Sparkles size={16} className={styles.tabSparkle} />
                )}
                {t(`sellerTools.sellerSpriteTools.listing.tab.${key}`)}
              </button>
            ))}
          </div>

          {/* Input bar */}
          <div className={styles.inputBar}>
            <div className={styles.marketSelector}>
              <span className={styles.marketFlag}>US</span>
              <span className={styles.marketLabel}>
                {t("sellerTools.sellerSpriteTools.usMarket")}
              </span>
              <ChevronDown size={12} style={{ color: "#bfbfbf" }} />
            </div>
            <input
              type="text"
              className={styles.inputField}
              placeholder={t(
                "sellerTools.sellerSpriteTools.listing.asinPlaceholder",
              )}
              value={asinInput}
              onChange={(e) => setAsinInput(e.target.value)}
            />
            <button className={styles.submitBtn}>
              <Send size={16} style={{ marginLeft: 2 }} />
            </button>
          </div>

          {/* History */}
          <div className={styles.historyList}>
            {historyItems.map((item) => (
              <div key={item.asin} className={styles.historyItem}>
                <div className={styles.historyImage}>
                  <Box size={24} />
                </div>
                <div className={styles.historyInfo}>
                  <div className={styles.historyAsin}>{item.asin}</div>
                  <div className={styles.historyTitle}>{item.title}</div>
                </div>
              </div>
            ))}
          </div>

          <div className={styles.helpText}>
            {t("sellerTools.sellerSpriteTools.listing.helpPrefix")}{" "}
            <a href="#">
              {t("sellerTools.sellerSpriteTools.listing.helpLink")}
            </a>
          </div>
        </div>
      </div>
    );
  }

  /* ── Keepa Panel ── */
  function renderKeepaPanel() {
    return (
      <div className={styles.genericPanel}>
        <div className={styles.genericIconWrap}>
          <BarChart2 size={32} style={{ color: "#1677ff" }} />
        </div>
        <h1 className={styles.genericTitle}>
          {t("sellerTools.sellerSpriteTools.keepa.title")}
        </h1>
        <p className={styles.genericDesc}>
          {t("sellerTools.sellerSpriteTools.keepa.desc")}
        </p>
        <div className={styles.genericInputBar}>
          <div className={styles.marketSelector}>
            <span className={styles.marketFlag}>US</span>
            <span className={styles.marketLabel}>
              {t("sellerTools.sellerSpriteTools.usMarket")}
            </span>
          </div>
          <input
            type="text"
            className={styles.genericInputField}
            placeholder={t(
              "sellerTools.sellerSpriteTools.keepa.placeholder",
            )}
          />
          <button className={`${styles.genericActionBtn} ${styles.blue}`}>
            <Sparkles size={16} />
            {t("sellerTools.sellerSpriteTools.keepa.action")}
          </button>
        </div>
      </div>
    );
  }

  /* ── Insight Panel ── */
  function renderInsightPanel() {
    return (
      <div className={styles.genericPanel}>
        <div className={styles.genericIconWrap}>
          <PieChart size={32} style={{ color: "#13c2c2" }} />
        </div>
        <h1 className={styles.genericTitle}>
          {t("sellerTools.sellerSpriteTools.insight.title")}
        </h1>
        <p className={styles.genericDesc}>
          {t("sellerTools.sellerSpriteTools.insight.desc")}
        </p>
        <div className={styles.genericInputBar}>
          <Search size={20} style={{ color: "#bfbfbf", marginLeft: 16 }} />
          <input
            type="text"
            className={styles.genericInputField}
            placeholder={t(
              "sellerTools.sellerSpriteTools.insight.placeholder",
            )}
          />
          <button className={`${styles.genericActionBtn} ${styles.teal}`}>
            <Zap size={16} />
            {t("sellerTools.sellerSpriteTools.insight.action")}
          </button>
        </div>
      </div>
    );
  }

  /* ── Competitor Panel ── */
  function renderCompetitorPanel() {
    return (
      <div className={styles.genericPanel}>
        <div className={styles.genericIconWrap}>
          <Crosshair size={32} style={{ color: "#eb2f96" }} />
        </div>
        <h1 className={styles.genericTitle}>
          {t("sellerTools.sellerSpriteTools.competitor.title")}
        </h1>
        <p className={styles.genericDesc}>
          {t("sellerTools.sellerSpriteTools.competitor.desc")}
        </p>
        <div className={styles.genericInputBar}>
          <div className={styles.competitorInputWrap}>
            <span className={styles.competitorLabel}>
              {t("sellerTools.sellerSpriteTools.competitor.myAsinLabel")}
            </span>
            <input
              type="text"
              className={styles.genericInputField}
              placeholder={t(
                "sellerTools.sellerSpriteTools.competitor.placeholder",
              )}
              style={{ padding: 0 }}
            />
          </div>
          <button className={`${styles.genericActionBtn} ${styles.pink}`}>
            {t("sellerTools.sellerSpriteTools.competitor.action")}
          </button>
        </div>
      </div>
    );
  }

  /* ── API Panel ── */
  function renderApiPanel() {
    return (
      <div className={styles.genericPanel}>
        <div className={styles.genericIconWrap}>
          <Code size={64} style={{ color: "#52c41a" }} />
        </div>
        <h1 className={styles.genericTitle}>
          {t("sellerTools.sellerSpriteTools.api.title")}
        </h1>
        <p className={styles.genericDesc}>
          {t("sellerTools.sellerSpriteTools.api.desc")}
        </p>
        <Button
          className={`${styles.genericActionBtn} ${styles.green}`}
          style={{ marginTop: 24 }}
        >
          {t("sellerTools.sellerSpriteTools.api.action")}
        </Button>
      </div>
    );
  }

  /* ── MCP Panel ── */
  function renderMcpPanel() {
    return (
      <div className={styles.genericPanel}>
        <div className={styles.genericIconWrap}>
          <MonitorSmartphone size={64} style={{ color: "#5b5fc7" }} />
        </div>
        <h1 className={styles.genericTitle}>
          {t("sellerTools.sellerSpriteTools.mcp.title")}
        </h1>
        <p className={styles.genericDesc}>
          {t("sellerTools.sellerSpriteTools.mcp.desc")}
        </p>
        <Button
          className={`${styles.genericActionBtn} ${styles.indigo}`}
          style={{ marginTop: 24 }}
        >
          {t("sellerTools.sellerSpriteTools.mcp.action")}
        </Button>
      </div>
    );
  }

  /* ── Tools Modal ── */
  function renderToolsModal() {
    return (
      <Modal
        open={toolsModalOpen}
        onCancel={() => setToolsModalOpen(false)}
        footer={null}
        width={1150}
        closable
        title={t("sellerTools.sellerSpriteTools.toolsModal.title")}
        styles={{ body: { padding: 0, display: "flex", height: 650 } }}
        destroyOnClose
      >
        {/* Favorites panel */}
        <div className={styles.favoritesPanel}>
          <div className={styles.favoritesHeader}>
            <Star size={16} style={{ fill: "currentColor" }} />
            {t("sellerTools.sellerSpriteTools.toolsModal.favorites")}
          </div>
          <div className={styles.favoritesDivider} />
          <div className={styles.favoritesEmpty}>
            {t("sellerTools.sellerSpriteTools.toolsModal.favoritesEmpty")}
          </div>
        </div>

        {/* Tools grid */}
        <div className={styles.toolsGridContainer}>
          <div className={styles.promoBanner}>
            <Megaphone size={16} style={{ color: "#1677ff", marginRight: 8 }} />
            <span className={styles.promoText1}>
              {t("sellerTools.sellerSpriteTools.toolsModal.promoPrefix")}
            </span>
            <span className={styles.promoText2}>
              {t("sellerTools.sellerSpriteTools.toolsModal.promoHighlight")}
            </span>
          </div>

          <div className={styles.toolsGrid}>
            {toolColumns.map((col, colIdx) => (
              <div
                key={colIdx}
                className={`${styles.toolsColumn} ${
                  colIdx >= 3 ? styles.withBorderLeft : ""
                } ${colIdx === 4 ? styles.lastColumn : ""}`}
              >
                {col.map((group) => (
                  <div key={group.title}>
                    <div className={styles.toolGroupTitle}>
                      {group.title}
                    </div>
                    <ul className={styles.toolList}>
                      {group.items.map((item) => (
                        <ToolLinkItem key={item.label} item={item} />
                      ))}
                    </ul>
                  </div>
                ))}

                {colIdx === 3 && (
                  <a href="#" className={styles.exploreMore}>
                    {t(
                      "sellerTools.sellerSpriteTools.toolsModal.exploreMore",
                    )}{" "}
                    <ArrowRight size={12} />
                  </a>
                )}

                {colIdx === 4 && (
                  <>
                    <a href="#" className={styles.exploreMore} style={{ marginBottom: 24 }}>
                      {t(
                        "sellerTools.sellerSpriteTools.toolsModal.exploreMore",
                      )}{" "}
                      <ArrowRight size={12} />
                    </a>
                    <div className={styles.qrSection}>
                      <div className={styles.qrItem}>
                        <div className={styles.qrPlaceholder}>
                          <Box size={48} />
                          <div className={`${styles.qrBadge} ${styles.qrBadgeGreen}`}>
                            U
                          </div>
                        </div>
                        <span className={styles.qrCaption}>
                          {t(
                            "sellerTools.sellerSpriteTools.toolsModal.qrMiniApp",
                          )}
                        </span>
                      </div>
                      <div className={styles.qrItem}>
                        <div className={styles.qrPlaceholder}>
                          <Box size={48} />
                          <div className={`${styles.qrBadge} ${styles.qrBadgeBrand}`}>
                            S
                          </div>
                        </div>
                        <span className={styles.qrCaption}>
                          {t(
                            "sellerTools.sellerSpriteTools.toolsModal.qrManager",
                          )}
                        </span>
                      </div>
                    </div>
                  </>
                )}
              </div>
            ))}
          </div>
        </div>
      </Modal>
    );
  }

  /* ── Render content by active tab ── */
  function renderContent() {
    switch (activeTab) {
      case "listing":
        return renderListingPanel();
      case "keepa":
        return renderKeepaPanel();
      case "insight":
        return renderInsightPanel();
      case "competitor":
        return renderCompetitorPanel();
      case "api":
        return renderApiPanel();
      case "mcp":
        return renderMcpPanel();
      default:
        return null;
    }
  }

  return (
    <div className={styles.sellerSpriteTools}>
      {/* Tab navigation + tools button */}
      <Tabs
        activeKey={activeTab}
        onChange={setActiveTab}
        items={menuItems}
        style={{ marginBottom: 0, flexShrink: 0 }}
        tabBarExtraContent={
          <div className={styles.toolsTriggerBtn}>
            <Button
              icon={<Wrench size={16} />}
              onClick={() => setToolsModalOpen(true)}
            >
              {t("sellerTools.sellerSpriteTools.tools")}
            </Button>
          </div>
        }
      />

      {/* Content area */}
      <div className={styles.contentArea}>{renderContent()}</div>

      {/* Floating side button */}
      <div className={styles.floatingSideBtn}>
        <div className={styles.floatingSideInner}>
          <button className={`${styles.floatingIconBtn} ${styles.pinkBg}`}>
            <ArrowLeftRight size={16} />
          </button>
        </div>
      </div>

      {/* Tools modal */}
      {renderToolsModal()}
    </div>
  );
}
