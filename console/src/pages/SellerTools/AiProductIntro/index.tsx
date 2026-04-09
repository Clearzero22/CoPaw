import { useTranslation } from "react-i18next";
import { Button, Input } from "antd";
import {
  Search,
  BarChart3,
  Crosshair,
  Zap,
  Globe,
  Sparkles,
  List,
  Bell,
  Shield,
  RotateCcw,
  ShoppingBag,
  Play,
  Plus,
  Send,
  ArrowRight,
  Package,
  TrendingUp,
  Heart,
} from "lucide-react";
import styles from "./index.module.less";

/* ─── Types ─── */

interface AppBlock {
  gradientClass: string;
  icon: React.ReactNode;
  isPlaceholder?: boolean;
}

interface MatrixCard {
  labelKey: string;
  floatClass: string;
  delayClass: string;
  offsetClass: string;
  apps: AppBlock[];
}

/* ─── Matrix data ─── */

const ICON_SIZE = 28;
const sw = { strokeWidth: 2.5 };

const matrixCards: MatrixCard[] = [
  {
    labelKey: "bigDataSelection",
    floatClass: styles.float1,
    delayClass: styles.delay300,
    offsetClass: "",
    apps: [
      { gradientClass: styles.gradientFfToFs, icon: <Search size={ICON_SIZE} color="#fff" {...sw} /> },
      { gradientClass: styles.gradientOrEa, icon: <span className={styles.appBlockIcon}>S</span> },
      { gradientClass: styles.gradientGToDr, icon: <BarChart3 size={ICON_SIZE} color="#fff" {...sw} /> },
      { gradientClass: styles.gradientSbToSl, icon: <Crosshair size={ICON_SIZE} color="#fff" {...sw} /> },
      { gradientClass: styles.gradientEmToPs, icon: <Zap size={ICON_SIZE} color="#fff" {...sw} /> },
      { gradientClass: styles.gradientPuToPd, icon: <span className={styles.appBlockIcon}>E</span> },
    ],
  },
  {
    labelKey: "trendsAndResearch",
    floatClass: styles.float2,
    delayClass: styles.delay400,
    offsetClass: styles.cardOffset1,
    apps: [
      { gradientClass: styles.gradientAmToDo, icon: <Package size={ICON_SIZE} color="#fff" {...sw} /> },
      { gradientClass: styles.gradientWh, icon: <span className={styles.appBlockIcon} style={{ color: "#ea4335", fontWeight: 700 }}>G</span> },
      { gradientClass: styles.gradientBlToBl, icon: <span className={styles.appBlockIcon}>E</span> },
      { gradientClass: styles.gradientWh, icon: <span className={`${styles.appBlockIcon} ${styles.brandText}`} style={{ color: "#e53238" }}>ebay</span> },
      { gradientClass: styles.gradientSbToSa, icon: <Sparkles size={ICON_SIZE} color="#fff" {...sw} /> },
      { gradientClass: "", isPlaceholder: true, icon: null },
    ],
  },
  {
    labelKey: "monitoringAndRisk",
    floatClass: styles.float3,
    delayClass: styles.delay500,
    offsetClass: styles.cardOffset2,
    apps: [
      { gradientClass: styles.gradientBlToBl, icon: <span className={styles.appBlockIcon}>P</span> },
      { gradientClass: styles.gradientSbToSl, icon: <TrendingUp size={ICON_SIZE} color="#fff" {...sw} /> },
      { gradientClass: styles.gradientYeToYo, icon: <Bell size={ICON_SIZE} color="#fff" {...sw} /> },
      { gradientClass: styles.gradientOrEa, icon: <span className={styles.appBlockIcon}>S</span> },
      { gradientClass: styles.gradientCyToCt, icon: <Shield size={ICON_SIZE} color="#fff" {...sw} /> },
      { gradientClass: styles.gradientLmToGd, icon: <RotateCcw size={ICON_SIZE} color="#fff" {...sw} /> },
    ],
  },
  {
    labelKey: "efficiencyAndAssist",
    floatClass: styles.float4,
    delayClass: styles.delay600,
    offsetClass: styles.cardOffset3,
    apps: [
      { gradientClass: styles.gradientBlToBl, icon: <Globe size={ICON_SIZE} color="#fff" {...sw} /> },
      { gradientClass: styles.gradientAmToDo, icon: <Sparkles size={ICON_SIZE} color="#fff" {...sw} /> },
      { gradientClass: styles.gradientEmToPs, icon: <List size={ICON_SIZE} color="#fff" {...sw} /> },
      { gradientClass: styles.gradientAmToDo, icon: <Package size={ICON_SIZE} color="#fff" {...sw} /> },
      { gradientClass: styles.gradientPuToPd, icon: <Sparkles size={ICON_SIZE} color="#fff" {...sw} /> },
      { gradientClass: "", isPlaceholder: true, icon: null },
    ],
  },
];

/* ─── Component ─── */

export default function AiProductIntro() {
  const { t } = useTranslation();

  return (
    <div className={styles.darkContainer}>
      {/* Background effects */}
      <div className={styles.techGrid} />
      <div className={styles.ambientGlow} />

      {/* Main content */}
      <main className={styles.mainContent}>
        {/* Left: copy */}
        <div className={`${styles.leftCol} ${styles.revealUp} ${styles.delay100}`}>
          {/* Blink tag */}
          <div className={`${styles.blinkTag} ${styles.revealUp} ${styles.delay100}`}>
            <div className={styles.blinkDot} />
            <span className={styles.blinkTagText}>
              {t("sellerTools.aiProductIntro.blinkTag")}
            </span>
          </div>

          <h1 className={`${styles.heroTitle} ${styles.revealUp} ${styles.delay200}`}>
            {t("sellerTools.aiProductIntro.heroTitle")}
          </h1>

          <h2 className={`${styles.heroSubtitle} ${styles.revealUp} ${styles.delay300}`}>
            {t("sellerTools.aiProductIntro.heroSubtitle")}
          </h2>

          <p className={`${styles.heroBody} ${styles.revealUp} ${styles.delay400}`}>
            {t("sellerTools.aiProductIntro.heroBody")}
          </p>

          <div className={`${styles.ctaGroup} ${styles.revealUp} ${styles.delay500}`}>
            <Button
              type="primary"
              size="large"
              className={styles.primaryBtn}
              icon={<ArrowRight size={20} />}
              iconPosition="end"
            >
              {t("sellerTools.aiProductIntro.ctaPrimary")}
            </Button>

            <Button
              size="large"
              className={styles.secondaryBtn}
              icon={<Play size={22} className={styles.playIcon} />}
            >
              {t("sellerTools.aiProductIntro.ctaSecondary")}
            </Button>
          </div>
        </div>

        {/* Right: capability matrix */}
        <div className={styles.rightCol}>
          <div className={styles.matrixGrid}>
            {matrixCards.map((card) => (
              <div
                key={card.labelKey}
                className={`${styles.techCard} ${card.floatClass} ${card.delayClass} ${styles.revealScale} ${card.offsetClass}`}
              >
                <div className={styles.techCardLabel}>
                  <span className={styles.techCardBadge}>
                    {t(`sellerTools.aiProductIntro.${card.labelKey}`)}
                  </span>
                </div>
                <div className={styles.appGrid}>
                  {card.apps.map((app, i) =>
                    app.isPlaceholder ? (
                      <div key={i} className={styles.appBlockPlaceholder} />
                    ) : (
                      <div
                        key={i}
                        className={`${styles.appBlock} ${app.gradientClass}`}
                      >
                        {app.icon}
                      </div>
                    )
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </main>

      {/* Bottom-left: platform logos */}
      <div className={`${styles.platformSection} ${styles.revealUp} ${styles.delay700}`}>
        <p className={styles.platformLabel}>
          {t("sellerTools.aiProductIntro.platformLabel")}
        </p>
        <div className={styles.platformList}>
          {/* Shopee */}
          <div className={styles.platformItem}>
            <div className={styles.platformIcon}>
              <ShoppingBag size={26} color="#ee4d2d" />
            </div>
            <span className={styles.platformName}>Shopee</span>
          </div>
          {/* TikTok Shop */}
          <div className={styles.platformItem}>
            <div className={styles.platformIcon}>
              <Sparkles size={26} color="#fff" />
            </div>
            <span className={styles.platformName}>TikTok Shop</span>
          </div>
          {/* Lazada */}
          <div className={styles.platformItem}>
            <div className={`${styles.platformIcon} ${styles.platformIconLazada}`}>
              <Heart size={14} color="#fff" />
            </div>
            <span className={styles.platformName}>Lazada</span>
          </div>
          {/* Shopify */}
          <div className={styles.platformItem}>
            <div className={styles.platformIcon}>
              <ShoppingBag size={26} color="#95bf47" />
            </div>
            <span className={styles.platformName}>shopify</span>
          </div>
          {/* Amazon */}
          <div className={styles.platformItem}>
            <div className={styles.platformIcon}>
              <Package size={32} color="#ff9900" />
            </div>
          </div>
          {/* TEMU */}
          <div className={styles.platformItem}>
            <span className={styles.platformName}>TEMU</span>
          </div>
        </div>
      </div>

      {/* Bottom-right: floating interaction bar */}
      <div className={`${styles.floatBar} ${styles.revealUp} ${styles.delay800}`}>
        <div className={styles.floatOrbs}>
          <div className={`${styles.floatOrbSparkle} ${styles.float1}`}>
            <Sparkles size={20} color="#f87171" />
          </div>
          <div className={`${styles.floatOrbGradient} ${styles.float3}`}>
            <div className={styles.orbInner} />
          </div>
        </div>

        {/* Chat input bar */}
        <div className={styles.chatInputBar}>
          <button className={styles.chatInputPlus} type="button">
            <Plus size={20} />
          </button>
          <Input
            variant="borderless"
            placeholder={t("sellerTools.aiProductIntro.chatPlaceholder")}
            className={styles.chatInputField}
          />
          <button className={styles.chatInputSend} type="button">
            <Send size={15} />
          </button>
        </div>
      </div>
    </div>
  );
}
