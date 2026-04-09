import { useState } from "react";
import {
  Menu,
  Plus,
  Zap,
  Share2,
  CircleHelp,
  ArrowUp,
  ChevronDown,
  RefreshCw,
  ThumbsUp,
  ThumbsDown,
  Copy,
  Smartphone,
} from "lucide-react";
import { Tooltip } from "antd";
import { useTranslation } from "react-i18next";
import styles from "./index.module.less";
import {
  mainNav,
  toolsNav,
  historyItems,
  allChatsNav,
  altNames,
  whiteModeNames,
  EMOJI_TAG,
  EMOJI_LIGHT,
  type NavItem,
} from "./mockData";

function KimiChat() {
  const { t } = useTranslation();
  const [collapsed, setCollapsed] = useState(false);

  return (
    <div className={styles.pageWrapper}>
      <div className={styles.innerContainer}>
        {/* ─── Sidebar ─── */}
        <aside
          className={`${styles.sidebar} ${collapsed ? styles.collapsed : ""}`}
        >
          {/* Logo + Collapse */}
          <div className={styles.sidebarHeader}>
            <button
              className={styles.sidebarCollapseBtn}
              onClick={() => setCollapsed(!collapsed)}
            >
              <Menu size={16} />
            </button>
            {!collapsed && (
              <div className={styles.sidebarLogo}>
                <div className={styles.sidebarLogoIcon}>
                  <Zap size={12} />
                </div>
                <span>Kimi</span>
              </div>
            )}
          </div>

          {/* New Chat */}
          {!collapsed && (
            <div className={styles.newChatSection}>
              <button className={styles.newChatBtn}>
                <Plus size={16} />
                <span>{t("sellerTools.kimiChat.newChat")}</span>
                <span className={styles.newChatShortcut}>Ctrl K</span>
              </button>
            </div>
          )}

          {/* Navigation */}
          <nav className={styles.sidebarNav}>
            {mainNav.map((item) => (
              <SidebarItem
                key={item.labelKey}
                item={item}
                collapsed={collapsed}
                t={t}
              />
            ))}

            {/* Tools */}
            {!collapsed && (
              <div className={styles.sidebarSectionTitle}>
                {t("sellerTools.kimiChat.tools")}
              </div>
            )}
            {toolsNav.map((item) => (
              <SidebarItem
                key={item.labelKey}
                item={item}
                collapsed={collapsed}
                t={t}
              />
            ))}

            {/* History */}
            {!collapsed && (
              <div className={styles.sidebarSectionTitle}>
                {t("sellerTools.kimiChat.history")}
              </div>
            )}
            {historyItems.map((item, i) => (
              <SidebarItem
                key={item.labelKey}
                item={item}
                collapsed={collapsed}
                t={t}
                active={i === 0}
              />
            ))}
            <SidebarItem
              item={allChatsNav}
              collapsed={collapsed}
              t={t}
            />
          </nav>

          {/* User Profile */}
          {!collapsed && (
            <div className={styles.sidebarFooter}>
              <div className={styles.userProfile}>
                <div className={styles.userAvatar} />
                <div className={styles.userInfo}>
                  <div className={styles.userName}>Clearzero 2</div>
                  <div className={styles.userPlan}>
                    <span className={styles.userStatusDot} />
                    <span>Andante</span>
                  </div>
                </div>
                <ChevronDown size={12} color="#aaa" />
              </div>
              <div className={styles.mobileAppLink}>
                <Smartphone size={14} />
                <span>{t("sellerTools.kimiChat.mobileApp")}</span>
              </div>
            </div>
          )}
        </aside>

        {/* ─── Main Content ─── */}
        <main className={styles.mainContent}>
          {/* Header */}
          <header className={styles.mainHeader}>
            <div className={styles.mainHeaderTitle}>
              <span>{t("sellerTools.kimiChat.history1")}</span>
              <ChevronDown
                size={12}
                color="#aaa"
                style={{ cursor: "pointer" }}
              />
            </div>
            <div className={styles.mainHeaderActions}>
              <Tooltip title={t("sellerTools.kimiChat.share")}>
                <button className={styles.headerActionBtn}>
                  <Share2 size={16} />
                </button>
              </Tooltip>
              <Tooltip title={t("sellerTools.kimiChat.help")}>
                <button className={styles.headerActionBtn}>
                  <CircleHelp size={16} />
                </button>
              </Tooltip>
            </div>
          </header>

          {/* Scrollable Content */}
          <div className={styles.contentArea}>
            <div className={styles.chatContent}>
              <h1 className={styles.markdownTitle}>
                {t("sellerTools.kimiChat.brandTitle")}
              </h1>

              <div className={styles.markdownParagraph}>
                <strong>{t("sellerTools.kimiChat.meaningLabel")}</strong>{" "}
                {t("sellerTools.kimiChat.meaning")}
              </div>
              <div className={styles.markdownParagraph}>
                <strong>{t("sellerTools.kimiChat.featuresLabel")}</strong>{" "}
                {t("sellerTools.kimiChat.features")}
              </div>
              <div className={styles.markdownParagraph}>
                <strong>{t("sellerTools.kimiChat.sloganLabel")}</strong>{" "}
                <em>{t("sellerTools.kimiChat.slogan")}</em>
              </div>

              <h2 className={styles.markdownSectionTitle}>
                <span style={{ fontSize: 18, marginRight: 4 }}>
                  {EMOJI_TAG}
                </span>{" "}
                {t("sellerTools.kimiChat.alternativesTitle")}
              </h2>

              {/* Table */}
              <div className={styles.tableContainer}>
                <div className={styles.tableHeaderRow}>
                  <div className={styles.tableColName}>
                    {t("sellerTools.kimiChat.colName")}
                  </div>
                  <div className={styles.tableColStyle}>
                    {t("sellerTools.kimiChat.colStyle")}
                  </div>
                  <div className={styles.tableColDesc}>
                    {t("sellerTools.kimiChat.colMeaning")}
                  </div>
                </div>
                {altNames.map((row) => (
                  <div key={row.name} className={styles.tableRow}>
                    <div className={styles.tableRowName}>{row.name}</div>
                    <div className={styles.tableRowStyle}>{row.style}</div>
                    <div className={styles.tableRowDesc}>{row.desc}</div>
                  </div>
                ))}
                <div className={styles.tableFooter}>
                  <span>Table</span>
                  <div className={styles.tableFooterActions}>
                    <button>
                      <Copy size={12} />
                    </button>
                    <button>
                      <ArrowUp size={12} style={{ transform: "rotate(180deg)" }} />
                    </button>
                  </div>
                </div>
              </div>

              <h2 className={styles.markdownSectionTitle}>
                <span style={{ fontSize: 18, marginRight: 4 }}>
                  {EMOJI_LIGHT}
                </span>{" "}
                {t("sellerTools.kimiChat.whiteModeTitle")}
              </h2>

              <div className={styles.markdownParagraph}>
                {t("sellerTools.kimiChat.whiteModeIntro")}
              </div>
              <ul className={styles.markdownList}>
                {whiteModeNames.map((n) => (
                  <li key={n}>
                    <strong>{n}</strong>
                  </li>
                ))}
              </ul>

              <div className={styles.codeBlock}>
                <strong>{t("sellerTools.kimiChat.recommendLabel")}</strong>{" "}
                <code className={styles.codeInline}>haochacha-dashboard.html</code>
                {" "}{t("sellerTools.kimiChat.or")}{" "}
                <code className={styles.codeInline}>whitepomelo-asin.html</code>
              </div>

              <div className={styles.markdownParagraph}>
                {t("sellerTools.kimiChat.closingQuestion")}
              </div>

              {/* Bottom Actions */}
              <div className={styles.contentActions}>
                <button className={styles.contentActionBtn}>
                  <Copy size={16} />
                </button>
                <button className={styles.contentActionBtn}>
                  <RefreshCw size={16} />
                </button>
                <button className={styles.contentActionBtn}>
                  <Share2 size={16} />
                </button>
                <button className={`${styles.contentActionBtn} ${styles.likeBtn}`}>
                  <ThumbsUp size={16} />
                </button>
                <button className={styles.contentActionBtn}>
                  <ThumbsDown size={16} />
                </button>
              </div>
            </div>
          </div>

          {/* Input Area */}
          <div className={styles.inputArea}>
            <div className={styles.inputContainer}>
              <div className={styles.inputBox}>
                <div className={styles.inputRow}>
                  <button className={styles.inputPlusBtn}>
                    <Plus size={16} />
                  </button>
                  <textarea
                    className={styles.inputTextarea}
                    placeholder={t("sellerTools.kimiChat.inputPlaceholder")}
                    rows={1}
                  />
                  <div className={styles.modelSelector}>
                    <span>K2.5 Thinking</span>
                    <ChevronDown size={10} />
                  </div>
                  <button className={styles.sendBtn}>
                    <ArrowUp size={16} />
                  </button>
                </div>
              </div>
              <div className={styles.inputDisclaimer}>
                {t("sellerTools.kimiChat.disclaimer")}
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}

/* ─── Sidebar Item Sub-component ─── */

function SidebarItem({
  item,
  collapsed,
  t,
  active = false,
}: {
  item: NavItem;
  collapsed: boolean;
  t: (key: string) => string;
  active?: boolean;
}) {
  const label = t(`sellerTools.kimiChat.${item.labelKey}`);

  if (collapsed) {
    return (
      <Tooltip title={label} placement="right">
        <div
          className={`${styles.sidebarItem} ${styles.collapsed} ${
            active ? styles.active : ""
          }`}
        >
          <span className={styles.sidebarItemIcon}>{item.icon}</span>
        </div>
      </Tooltip>
    );
  }

  return (
    <div
      className={`${styles.sidebarItem} ${active ? styles.active : ""}`}
    >
      <span className={styles.sidebarItemIcon}>{item.icon}</span>
      <span className={styles.sidebarItemLabel}>{label}</span>
      {item.badge && (
        <span className={styles.sidebarItemBadge}>{item.badge}</span>
      )}
    </div>
  );
}

export default KimiChat;
