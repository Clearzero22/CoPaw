import { useState, useRef, useEffect } from "react";
import { useTranslation } from "react-i18next";
import {
  MessageSquare,
  Archive,
  Clock,
  Bookmark,
  Zap,
  Settings,
  Image,
  Paperclip,
  Send,
  Package,
  MessageCircle,
  ChevronRight,
  Search,
  Plus,
  Info,
  Heart,
} from "lucide-react";
import { Input, Button } from "antd";
import { useTheme } from "../../../contexts/ThemeContext";
import { toolCategories, promptCards, toolTags } from "./types";
import type { ToolCategory } from "./types";
import styles from "./index.module.less";

const { TextArea } = Input;

const chatPlaceholder =
  "想知道亚马逊爆款商品？试试输入 @卖家精灵-选产品，并输入\u201C蓝牙耳机\u201D。";

const PAGE_TABS: { id: string; icon: React.ElementType; isNew?: boolean }[] = [
  { id: "chat", icon: MessageSquare },
  { id: "prompts", icon: Archive },
  { id: "tasks", icon: Clock },
  { id: "favorites", icon: Bookmark },
  { id: "claw", icon: Zap, isNew: true },
];

/* =================== Sub-components =================== */

function EmptyState({ icon: Icon }: { icon: React.ElementType }) {
  return (
    <div className={styles.emptyState}>
      <div className={styles.emptyStateBox}>
        <Icon size={64} strokeWidth={1.5} />
      </div>
      <p className={styles.emptyStateText}>
        {/* no i18n needed - placeholder */}
      </p>
    </div>
  );
}

function PromptCardComponent({
  desc,
  title,
  tag,
}: {
  desc: string;
  title: string;
  tag: string;
}) {
  return (
    <div className={styles.promptCard}>
      <p className={styles.promptCardDesc}>{desc}</p>
      <hr className={styles.promptCardDivider} />
      <div className={styles.promptCardTitle}>{title}</div>
      <div className={styles.promptCardTag}>{tag}</div>
    </div>
  );
}

function ClawSvg({ size = "small" }: { size?: "small" | "large" }) {
  const className = styles[size === "small" ? "clawHeroSvg" : "clawHeroSvg"];
  if (size === "small") {
    return (
      <svg viewBox="0 0 100 100" className={className}>
        <path
          d="M50 20 C45 15, 40 15, 35 20 C30 25, 30 35, 35 40 C40 45, 45 45, 50 40 C55 45, 60 45, 65 40 C70 35, 70 25, 65 20 C60 15, 55 15, 50 20 Z"
          fill="#DC2626"
        />
        <path
          d="M35 40 Q30 50, 25 60 Q20 70, 25 80 Q30 85, 35 80 Q40 75, 38 65 Q36 55, 35 40"
          fill="#DC2626"
        />
        <path
          d="M65 40 Q70 50, 75 60 Q80 70, 75 80 Q70 85, 65 80 Q60 75, 62 65 Q64 55, 65 40"
          fill="#DC2626"
        />
        <path
          d="M35 40 Q40 45, 45 45 Q50 40, 55 45 Q60 45, 65 40"
          fill="#B91C1C"
        />
        <circle cx="40" cy="25" r="3" fill="#FEE2E2" />
        <circle cx="60" cy="25" r="3" fill="#FEE2E2" />
      </svg>
    );
  }
  return (
    <svg viewBox="0 0 200 200" className={className}>
      <defs>
        <linearGradient
          id="clawGradient"
          x1="0%"
          y1="0%"
          x2="100%"
          y2="100%"
        >
          <stop offset="0%" style={{ stopColor: "#DC2626" }} />
          <stop offset="100%" style={{ stopColor: "#B91C1C" }} />
        </linearGradient>
        <filter
          id="shadow"
          x="-50%"
          y="-50%"
          width="200%"
          height="200%"
        >
          <feDropShadow
            dx="0"
            dy="4"
            stdDeviation="8"
            floodColor="#DC2626"
            floodOpacity="0.3"
          />
        </filter>
      </defs>
      <path
        d="M60 80 Q40 100, 30 130 Q25 150, 35 170 Q45 180, 55 175 Q65 170, 60 150 Q55 130, 65 110 Q70 100, 80 90 Z"
        fill="url(#clawGradient)"
        filter="url(#shadow)"
      />
      <path
        d="M140 80 Q160 100, 170 130 Q175 150, 165 170 Q155 180, 145 175 Q135 170, 140 150 Q145 130, 135 110 Q130 100, 120 90 Z"
        fill="url(#clawGradient)"
        filter="url(#shadow)"
      />
      <ellipse cx="100" cy="90" rx="25" ry="20" fill="#991B1B" />
      <path
        d="M75 70 Q100 50, 125 70 Q130 85, 125 95 Q100 100, 75 95 Q70 85, 75 70"
        fill="#DC2626"
        filter="url(#shadow)"
      />
      <circle cx="90" cy="75" r="4" fill="#FEE2E2" />
      <circle cx="110" cy="75" r="4" fill="#FEE2E2" />
      <circle cx="91" cy="74" r="1.5" fill="#1F2937" />
      <circle cx="111" cy="74" r="1.5" fill="#1F2937" />
      <path
        d="M85 60 Q80 40, 70 30"
        fill="none"
        stroke="#DC2626"
        strokeWidth="2"
        strokeLinecap="round"
      />
      <path
        d="M115 60 Q120 40, 130 30"
        fill="none"
        stroke="#DC2626"
        strokeWidth="2"
        strokeLinecap="round"
      />
      <path d="M30 130 L25 140 L35 145 Z" fill="#991B1B" />
      <path d="M170 130 L175 140 L165 145 Z" fill="#991B1B" />
    </svg>
  );
}

/* =================== Tools Panel =================== */

function ToolsPanel({
  show,
  onClose,
  onSelectTool,
}: {
  show: boolean;
  onClose: () => void;
  onSelectTool: (name: string) => void;
}) {
  const { isDark } = useTheme();
  const [activeCategory, setActiveCategory] =
    useState<ToolCategory>(toolCategories[0]);

  useEffect(() => {
    if (show) setActiveCategory(toolCategories[0]);
  }, [show]);

  if (!show) return null;

  const colorClass = isDark
    ? activeCategory.colorDarkClass
    : activeCategory.colorClass;

  return (
    <div className={styles.toolsOverlay} onClick={onClose}>
      <div
        className={`${styles.toolsPanel} ${show ? styles.visible : ""}`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className={styles.toolsInner}>
          {/* Left: category list */}
          <div className={styles.toolsCategoryList}>
            <div className={styles.toolsCategoryTitle}>
              {/* Tool categories label */}
            </div>
            {toolCategories.map((cat) => (
              <button
                key={cat.name}
                onClick={() => setActiveCategory(cat)}
                className={`${styles.toolsCategoryItem} ${activeCategory.name === cat.name ? styles.active : ""}`}
              >
                <span
                  className={`${styles.toolsCategoryBadge} ${isDark ? cat.colorDarkClass : cat.colorClass}`}
                >
                  {cat.icon}
                </span>
                <span>{cat.name}</span>
              </button>
            ))}
            <div className={styles.toolsCategoryFooter}>
              <span>44+ tools</span>
              <Info size={14} />
            </div>
          </div>

          {/* Right: items grid */}
          <div className={styles.toolsItemList}>
            <div className={styles.toolsItemCategory}>
              <span className={styles.toolsItemDot} />
              <span>{activeCategory.name}</span>
            </div>
            <div className={styles.toolsItemGrid}>
              {activeCategory.items.map((item) => (
                <button
                  key={item.title}
                  onClick={() => onSelectTool(item.title)}
                  className={styles.toolItemCard}
                >
                  <div
                    className={`${styles.toolItemIcon} ${colorClass}`}
                  >
                    {item.icon}
                  </div>
                  <div className={styles.toolItemInfo}>
                    <div className={styles.toolItemTitle}>{item.title}</div>
                    <div className={styles.toolItemDesc}>{item.desc}</div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* =================== Main Component =================== */

export default function AiAssistant() {
  const { t } = useTranslation();
  const { isDark } = useTheme();
  const [activePage, setActivePage] = useState("chat");
  const [showTools, setShowTools] = useState(false);
  const [chatInput, setChatInput] = useState("");
  const inputRef = useRef<HTMLTextAreaElement>(null);

  function handleSelectTool(name: string) {
    setChatInput(`@${name} `);
    setShowTools(false);
    inputRef.current?.focus();
  }

  // Escape to close tools panel
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setShowTools(false);
      }
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, []);

  return (
    <div className={styles.page}>
      {/* Sub-navigation tabs (replaces sidebar) */}
      <div className={styles.subNav}>
        {PAGE_TABS.map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActivePage(tab.id)}
              className={`${styles.subNavBtn} ${activePage === tab.id ? styles.active : ""}`}
            >
              <Icon size={16} style={{ marginRight: 6, verticalAlign: "middle" }} />
              {t(`sellerTools.aiAssistant.${tab.id}`)}
              {tab.isNew && (
                <span className={styles.badgeNew}>NEW</span>
              )}
            </button>
          );
        })}
      </div>

      {/* Content */}
      <div className={styles.content}>
        {/* ===== 1. Chat page ===== */}
        {activePage === "chat" && (
          <div className={styles.chatPage}>
            <div className={styles.chatInner}>
              {/* Deploy badge */}
              <div style={{ display: "flex", justifyContent: "center", marginBottom: 24 }}>
                <button className={styles.deployBadge}>
                  <span>🚀</span>
                  <span>{t("sellerTools.aiAssistant.deployOpenClaw")}</span>
                  <ChevronRight size={16} />
                </button>
              </div>

              {/* Hero */}
              <div className={styles.hero}>
                <h1>{t("sellerTools.aiAssistant.heroTitle")}</h1>
                <p>{t("sellerTools.aiAssistant.heroSubtitle")}</p>
              </div>

              {/* Input area */}
              <div className={styles.inputWrapper}>
                <div className={styles.chatInputBox}>
                  <div style={{ padding: "0 4px" }}>
                    <TextArea
                      ref={inputRef as unknown as React.Ref<any>}
                      value={chatInput}
                      onChange={(e) => setChatInput(e.target.value)}
                      placeholder={chatPlaceholder}
                      className={styles.chatTextarea}
                      autoSize={{ minRows: 4, maxRows: 6 }}
                      variant="borderless"
                    />
                  </div>
                  <div className={styles.chatInputFooter}>
                    <div className={styles.chatInputActions}>
                      <button
                        onClick={() => setShowTools(true)}
                        className={styles.toolBtn}
                      >
                        <Settings size={16} />
                        <span>{t("sellerTools.aiAssistant.tools")}</span>
                      </button>
                      <button className={styles.iconBtn}>
                        <Image size={20} />
                      </button>
                      <button className={styles.iconBtn}>
                        <Paperclip size={20} />
                      </button>
                    </div>
                    <div className={styles.chatInputRight}>
                      <span className={styles.modeLabel}>
                        {t("sellerTools.aiAssistant.fastMode")}
                      </span>
                      <button className={styles.sendBtn}>
                        <Send size={18} style={{ transform: "rotate(180deg)" }} />
                      </button>
                    </div>
                  </div>

                  {/* Tools panel */}
                  <ToolsPanel
                    show={showTools}
                    onClose={() => setShowTools(false)}
                    onSelectTool={handleSelectTool}
                  />
                </div>
              </div>

              {/* Upgrade bar */}
              <div className={styles.upgradeBar}>
                <span>{t("sellerTools.aiAssistant.upgradeTip")}</span>
                <button className={styles.upgradeLink}>
                  <Info size={16} />
                  {t("sellerTools.aiAssistant.upgradeNow")}
                </button>
              </div>

              {/* Tool tag filter bar */}
              <div className={styles.toolTagBar}>
                {toolTags.map((tag) => (
                  <button key={tag.label} className={styles.toolTag}>
                    <span
                      className={`${styles.toolTagBadge} ${isDark ? tag.colorDarkClass : tag.colorClass}`}
                    >
                      {tag.short}
                    </span>
                    {tag.label}
                  </button>
                ))}
              </div>

              {/* Prompt cards */}
              <div className={styles.promptSection}>
                <div className={styles.promptDivider}>
                  <span className={styles.promptDividerLine} />
                  <span>{t("sellerTools.aiAssistant.explorePrompts")}</span>
                  <span className={styles.promptDividerLine} />
                </div>
                <div className={styles.promptGrid}>
                  {promptCards.map((card) => (
                    <PromptCardComponent key={card.title} {...card} />
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ===== 2. Prompts page ===== */}
        {activePage === "prompts" && (
          <div>
            <div className={styles.pageHeader}>
              <h1 className={styles.pageTitle}>
                {t("sellerTools.aiAssistant.myPrompts")}
              </h1>
              <div className={styles.pageActions}>
                <Input
                  placeholder={t("sellerTools.aiAssistant.searchPrompts")}
                  prefix={<Search size={14} />}
                  style={{ width: 256 }}
                  allowClear
                />
                <Button type="primary" icon={<Plus size={14} />}>
                  {t("sellerTools.aiAssistant.createPrompt")}
                </Button>
              </div>
            </div>

            <div className={styles.tabRow}>
              <button className={`${styles.tabBtn} ${styles.active}`}>
                {t("sellerTools.aiAssistant.all")}
              </button>
              <button className={styles.tabBtn}>
                {t("sellerTools.aiAssistant.default")}
              </button>
              <button className={styles.tabPlusBtn}>
                <Plus size={14} />
              </button>
            </div>

            <EmptyState icon={Archive} />
          </div>
        )}

        {/* ===== 3. Tasks page ===== */}
        {activePage === "tasks" && (
          <div>
            <div className={styles.pageHeader}>
              <h1 className={styles.pageTitle}>
                {t("sellerTools.aiAssistant.scheduledTasks")}
              </h1>
              <div className={styles.pageActions}>
                <Input
                  placeholder={t("sellerTools.aiAssistant.searchTasks")}
                  prefix={<Search size={14} />}
                  style={{ width: 256 }}
                  allowClear
                />
                <Button type="primary" icon={<Plus size={14} />}>
                  {t("sellerTools.aiAssistant.createTask")}
                </Button>
              </div>
            </div>

            <div className={styles.tabRow}>
              <button className={`${styles.tabBtn} ${styles.active}`}>
                {t("sellerTools.aiAssistant.scheduled")}
              </button>
              <button className={styles.tabBtn}>
                {t("sellerTools.aiAssistant.runHistory")}
              </button>
            </div>

            <div className={styles.tabFilterRow}>
              <button className={`${styles.filterPill} ${styles.active}`}>
                {t("sellerTools.aiAssistant.all")}
              </button>
              <button className={styles.filterPill}>
                {t("sellerTools.aiAssistant.default")}
              </button>
              <button className={styles.tabPlusBtn}>
                <Plus size={14} />
              </button>
            </div>

            <EmptyState icon={Clock} />
          </div>
        )}

        {/* ===== 4. Claw (marketing) page ===== */}
        {activePage === "claw" && (
          <div className={styles.clawPage}>
            <div className={styles.clawInner}>
              {/* Hero */}
              <div className={styles.clawHero}>
                <div className={styles.clawHeroText}>
                  <h1>
                    <span className={styles.red}>LinkFox</span>{" "}
                    <span className={styles.dark}>Claw</span>
                  </h1>
                  <p>{t("sellerTools.aiAssistant.clawSubtitle")}</p>
                </div>
                <div className={styles.clawHeroSvg}>
                  <ClawSvg size="large" />
                </div>
              </div>

              {/* Features */}
              <div className={styles.clawFeatures}>
                <h2>
                  {t("sellerTools.aiAssistant.whyClaw")}
                </h2>
                <div className={styles.clawFeature}>
                  <div className={styles.clawFeatureHeader}>
                    <div className={styles.clawFeatureIcon}>
                      <Package size={12} />
                    </div>
                    <h3 className={styles.clawFeatureTitle}>
                      {t("sellerTools.aiAssistant.clawFeature1Title")}
                    </h3>
                  </div>
                  <p className={styles.clawFeatureDesc}>
                    {t("sellerTools.aiAssistant.clawFeature1Desc")}
                  </p>
                </div>
                <div className={styles.clawFeature}>
                  <div className={styles.clawFeatureHeader}>
                    <div className={styles.clawFeatureIcon}>
                      <MessageCircle size={12} />
                    </div>
                    <h3 className={styles.clawFeatureTitle}>
                      {t("sellerTools.aiAssistant.clawFeature2Title")}
                    </h3>
                  </div>
                  <p className={styles.clawFeatureDesc}>
                    {t("sellerTools.aiAssistant.clawFeature2Desc")}
                  </p>
                </div>
              </div>

              {/* CTA */}
              <div className={styles.clawCta}>
                <div className={styles.clawCtaText}>
                  <h3>{t("sellerTools.aiAssistant.createClawTitle")}</h3>
                  <p>{t("sellerTools.aiAssistant.createClawDesc")}</p>
                </div>
                <button className={styles.clawCtaBtn}>
                  {t("sellerTools.aiAssistant.createNow")}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ===== 5. Favorites page ===== */}
        {activePage === "favorites" && (
          <div className={styles.favoritesPage}>
            <div className={styles.favoritesInner}>
              <div className={styles.pageHeader} style={{ padding: 0, marginBottom: 24 }}>
                <h1 className={styles.pageTitle}>
                  {t("sellerTools.aiAssistant.favorites")}
                </h1>
              </div>
              <EmptyState icon={Bookmark} />
            </div>
          </div>
        )}
      </div>

      {/* Floating action buttons */}
      <div className={styles.floatActions}>
        <button className={styles.floatBtnOutline}>
          <Heart size={20} />
        </button>
        <button className={styles.floatBtnPrimary}>
          <MessageSquare size={20} />
        </button>
      </div>
    </div>
  );
}
