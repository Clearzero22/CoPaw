import { useTranslation } from "react-i18next";
import { Button } from "antd";
import {
  Zap,
  Plus,
  BarChart3,
  Shield,
  Eye,
  Bell,
  AlertTriangle,
  CheckCircle2,
  CheckCircle,
  Globe,
  Snowflake,
  ShoppingBag,
  Heart,
  ShoppingCart,
  Lock,
  RefreshCcw,
  Search,
} from "lucide-react";
import styles from "./index.module.less";

/* ===================== Types ===================== */

interface AppIcon {
  gradient: string;
  icon: React.ReactNode;
  textColor?: string;
}

interface MatrixCard {
  label: string;
  gridClass: string;
  icons: AppIcon[];
}

/* ===================== Static Data ===================== */

const matrixCards: MatrixCard[] = [
  {
    label: "matrixCardDataSelection",
    gridClass: "gridCols2",
    icons: [
      { gradient: "iconAmber", icon: <Zap size={24} />, textColor: "textBlack" },
      { gradient: "iconYellow", icon: <span style={{ fontWeight: 700, fontSize: 20 }}>S</span>, textColor: "textBlack" },
      { gradient: "iconBlue", icon: <Plus size={24} />, textColor: "textWhite" },
      { gradient: "iconGreen", icon: <BarChart3 size={24} />, textColor: "textWhite" },
    ],
  },
  {
    label: "matrixCardTrendResearch",
    gridClass: "gridCols2",
    icons: [
      { gradient: "iconOrange", icon: <span style={{ fontWeight: 700, fontSize: 20 }}>a</span>, textColor: "textWhite" },
      { gradient: "iconPurple", icon: <span style={{ fontWeight: 700, fontSize: 20 }}>G</span>, textColor: "textWhite" },
      { gradient: "iconWhite", icon: <span style={{ fontWeight: 900, fontSize: 14, color: "#e53238" }}>ebay</span> },
      { gradient: "iconBlueDark", icon: <Snowflake size={24} />, textColor: "textWhite" },
    ],
  },
  {
    label: "matrixCardMonitorRisk",
    gridClass: "gridCols3",
    icons: [
      { gradient: "iconBlue", icon: <Shield size={16} />, textColor: "textWhite" },
      { gradient: "iconCyan", icon: <Eye size={16} />, textColor: "textWhite" },
      { gradient: "iconYellow", icon: <Bell size={16} />, textColor: "textBlack" },
      { gradient: "iconAmber", icon: <AlertTriangle size={16} />, textColor: "textWhite" },
      { gradient: "iconGreen", icon: <Lock size={16} />, textColor: "textWhite" },
      { gradient: "iconLime", icon: <RefreshCcw size={16} />, textColor: "textWhite" },
    ],
  },
  {
    label: "matrixCardEfficiency",
    gridClass: "gridCols2",
    icons: [
      { gradient: "iconBlue", icon: <Globe size={24} />, textColor: "textWhite" },
      { gradient: "iconPink", icon: <span style={{ fontWeight: 700, fontSize: 20, color: "#fff" }}>AI</span> },
      { gradient: "iconOrange", icon: <span style={{ fontWeight: 700, fontSize: 20, color: "#fff" }}>a</span> },
      { gradient: "iconIndigo", icon: <Snowflake size={24} />, textColor: "textWhite" },
    ],
  },
];

const platforms = [
  { icon: <ShoppingBag size={20} />, label: "Shopee", labelKey: "platformShopee" },
  { icon: <span style={{ color: "#fff", fontSize: 14, fontWeight: 700 }}>T</span>, label: "TikTok Shop", labelKey: "platformTiktok" },
  { icon: <Heart size={20} />, label: "Lazada", labelKey: "platformLazada" },
  { icon: <ShoppingCart size={20} />, label: "Shopify", labelKey: "platformShopify" },
  { icon: <span style={{ color: "#fff", fontSize: 18, fontWeight: 700 }}>amazon</span>, label: "", labelKey: "platformAmazon" },
  { icon: <span style={{ color: "#fff", fontSize: 18, fontWeight: 700 }}>TEMU</span>, label: "", labelKey: "platformTemu" },
];

/* ===================== Main Component ===================== */

export default function ProductLanding() {
  const { t } = useTranslation();

  const painPoints = [
    t("sellerTools.productLanding.pain1"),
    t("sellerTools.productLanding.pain2"),
    t("sellerTools.productLanding.pain3"),
  ];

  const solutions = [
    t("sellerTools.productLanding.solution1"),
    t("sellerTools.productLanding.solution2"),
    t("sellerTools.productLanding.solution3"),
  ];

  return (
    <div className={styles.page}>
      <div className={styles.bgGrid} />
      <div className={styles.bgOverlay} />

      {/* Hero Section */}
      <section className={styles.heroSection}>
        <div className={styles.heroLayout}>
          {/* Left: text content */}
          <div className={styles.heroLeft}>
            <div className={styles.badgePill}>
              <span className={styles.badgeDot} />
              <span>{t("sellerTools.productLanding.badgeLabel")}</span>
            </div>
            <div className={styles.heroTitleGroup}>
              <h1 className={styles.heroTitle}>
                {t("sellerTools.productLanding.heroTitle")}
              </h1>
              <h2 className={styles.heroSubtitle}>
                {t("sellerTools.productLanding.heroSubtitle")}
              </h2>
            </div>
            <p className={styles.heroDescription}>
              {t("sellerTools.productLanding.heroDescription")}
            </p>
            <div className={styles.heroCtas}>
              <Button
                type="primary"
                size="large"
                className={styles.ctaPrimary}
              >
                {t("sellerTools.productLanding.ctaStart")}
              </Button>
              <Button
                size="large"
                className={styles.ctaSecondary}
              >
                {t("sellerTools.productLanding.ctaCases")}
              </Button>
            </div>
          </div>

          {/* Right: capability matrix */}
          <div className={styles.heroRight}>
            <div className={styles.matrixGrid}>
              {matrixCards.map((card) => (
                <div key={card.label} className={styles.matrixCard}>
                  <span className={styles.matrixCardLabel}>
                    {t(`sellerTools.productLanding.${card.label}`)}
                  </span>
                  <div className={styles[card.gridClass]}>
                    {card.icons.map((app, i) => (
                      <div key={i} className={`${styles.matrixIcon} ${styles[app.gradient]}`}>
                        <span className={styles[app.textColor ?? "textWhite"]}>
                          {app.icon}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Platform logos */}
        <div className={styles.platformBar}>
          <span className={styles.platformLabel}>
            {t("sellerTools.productLanding.platformSupport")}
          </span>
          <div className={styles.platformList}>
            {platforms.map((p) => (
              <div key={p.labelKey} className={styles.platformItem}>
                {p.icon}
                {p.label && <span>{p.label}</span>}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pain Points Section */}
      <section className={styles.painSection}>
        <div className={styles.painHeader}>
          <div className={styles.painBadge}>
            <span className={styles.painBadgeDot} />
            <span>{t("sellerTools.productLanding.painBadgeLabel")}</span>
          </div>
          <h2 className={styles.painTitle}>
            {t("sellerTools.productLanding.painTitlePrefix")}
            <span className={styles.painTitleHighlight}>
              {t("sellerTools.productLanding.painTitleHighlight")}
            </span>
          </h2>
          <p className={styles.painDescription}>
            {t("sellerTools.productLanding.painDescription")}
          </p>
        </div>

        <div className={styles.painCards}>
          {/* Red: pain points */}
          <div className={`${styles.animatedBorderCard} ${styles.borderGlowRed}`}>
            <div className={styles.animatedBorderInner}>
              <div>
                <div className={styles.painCardTitle}>
                  <AlertTriangle size={20} />
                  <span>{t("sellerTools.productLanding.realityLabel")}</span>
                </div>
                <div className={styles.painCardContent}>
                  <div className={styles.painCardGlow} />
                  <h3 className={`${styles.painCardHeading} ${styles.glowTextRed}`}>
                    {t("sellerTools.productLanding.realityHeading")}
                  </h3>
                  <p className={styles.painCardText}>
                    {t("sellerTools.productLanding.realityDesc")}
                  </p>
                </div>
              </div>
              <ul className={styles.painList}>
                {painPoints.map((text, i) => (
                  <li key={i} className={styles.painListItem}>
                    <span className={styles.painDotRed} />
                    <span className={styles.painListItemText}>{text}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Green: solutions */}
          <div className={`${styles.animatedBorderCard} ${styles.borderGlowGreen}`}>
            <div className={styles.animatedBorderInner}>
              <div>
                <div className={styles.solutionCardTitle}>
                  <CheckCircle2 size={20} />
                  <span>{t("sellerTools.productLanding.solutionLabel")}</span>
                </div>
                <div className={styles.solutionCardContent}>
                  <div className={styles.solutionCardGlow} />
                  <h3 className={`${styles.solutionCardHeading} ${styles.glowTextGreen}`}>
                    {t("sellerTools.productLanding.solutionHeading")}
                  </h3>
                  <p className={styles.solutionCardText}>
                    {t("sellerTools.productLanding.solutionDesc")}
                  </p>
                </div>
              </div>
              <ul className={styles.solutionList}>
                {solutions.map((text, i) => (
                  <li key={i} className={styles.solutionListItem}>
                    <CheckCircle size={16} className={styles.solutionIcon} />
                    <span className={styles.solutionListItemText}>{text}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>

        {/* Bottom CTA */}
        <div className={styles.bottomCta}>
          <h2 className={styles.bottomCtaTitle}>
            {t("sellerTools.productLanding.bottomCtaTitle")}
          </h2>
          <p className={styles.bottomCtaText}>
            {t("sellerTools.productLanding.bottomCtaText")}
          </p>
        </div>
      </section>

      {/* Floating sidebar widgets */}
      <div className={styles.floatSidebar}>
        <div className={styles.floatWidgetEA}>
          <span>EA</span>
        </div>
        <div className={styles.floatWidgetGradient} />
      </div>

      {/* Bottom-right search button */}
      <div className={styles.floatSearch}>
        <Button
          icon={<Search size={16} />}
          className={styles.searchBtn}
        >
          {t("sellerTools.productLanding.imageSearch")}
        </Button>
      </div>
    </div>
  );
}
