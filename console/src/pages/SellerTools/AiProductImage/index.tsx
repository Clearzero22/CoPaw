import { useState } from "react";
import { useTranslation } from "react-i18next";
import {
  ImageIcon,
  ArrowRight,
  Upload,
  Plus,
  Heart,
  Search,
  Headset,
  HelpCircle,
  X,
  Flame,
} from "lucide-react";
import styles from "./index.module.less";

/* ─── Data ─── */

interface SceneCard {
  labelKey: string;
  hasAction?: "plus-heart" | "plus" | "generate" | "none";
  isDark?: boolean;
  promo?: string;
}

const SCENE_CARDS: SceneCard[] = [
  { labelKey: "sceneDesktop", hasAction: "plus-heart" },
  { labelKey: "sceneBlender", hasAction: "plus" },
  { labelKey: "sceneBlanket", hasAction: "generate" },
  { labelKey: "sceneScale", hasAction: "none" },
  { labelKey: "sceneScale2" },
  { labelKey: "sceneBasket" },
  { labelKey: "sceneCup" },
  { labelKey: "sceneKettle" },
  { labelKey: "sceneBookshelf" },
  { labelKey: "sceneTeaset" },
  { labelKey: "sceneStorageBox" },
  { labelKey: "sceneCandle", isDark: true, promo: "节日特惠" },
];

const CATEGORIES = [
  "categoryDaily",
  "categoryHome",
  "categoryFashion",
  "categoryBeauty",
  "categoryAppliance",
  "categoryToys",
  "categoryKids",
  "categoryDigital",
  "categoryOffice",
  "categorySports",
  "categoryArt",
  "categoryPets",
  "categoryFood",
  "categoryMedical",
  "categoryAuto",
  "categoryOther",
] as const;

const SORT_TABS = ["sortSmart", "sortFavorites", "sortPopularity"] as const;

/* ─── Sub-components ─── */

function PlaceholderImage({
  className = "",
  dark = false,
}: {
  className?: string;
  dark?: boolean;
}) {
  return (
    <div
      className={`${styles.placeholderImg} ${dark ? styles.placeholderDark : ""} ${className}`}
    >
      <ImageIcon size={32} />
    </div>
  );
}

/* ─── Main Component ─── */

export default function AiProductImage() {
  const { t } = useTranslation();
  const [activeCategory, setActiveCategory] = useState(0);
  const [activeSort, setActiveSort] = useState(0);
  const [showPromo, setShowPromo] = useState(true);

  return (
    <div className={styles.page}>
      <div className={styles.scrollArea}>
        <div className={styles.content}>
          {/* Upload area */}
          <div className={styles.uploadCard}>
            {/* Left: upload dropzone */}
            <div className={styles.uploadLeft}>
              <div className={styles.dropzone}>
                <button className={styles.uploadBtn}>
                  <Upload size={20} />
                  {t("sellerTools.aiProductImage.uploadImage")}
                </button>
                <p className={styles.dropzoneHint}>
                  {t("sellerTools.aiProductImage.dragHint")}
                </p>

                <div className={styles.sampleDivider}>
                  <span className={styles.sampleDividerLine} />
                  <span className={styles.sampleDividerText}>
                    {t("sellerTools.aiProductImage.orTry")}
                  </span>
                  <span className={styles.sampleDividerLine} />
                </div>

                <div className={styles.sampleGrid}>
                  {Array.from({ length: 6 }).map((_, i) => (
                    <div key={i} className={styles.sampleThumb} />
                  ))}
                </div>
              </div>
            </div>

            {/* Right: before/after panel */}
            <div className={styles.uploadRight}>
              <div className={styles.examplePanel}>
                <div className={styles.exampleBefore}>
                  <span className={styles.exampleLabel}>
                    {t("sellerTools.aiProductImage.myProduct")}
                  </span>
                  <PlaceholderImage className={styles.exampleImg} />
                </div>

                <div className={styles.exampleArrow}>
                  <ArrowRight size={20} />
                </div>

                <div className={styles.exampleAfter}>
                  <span className={styles.exampleBadge}>
                    {t("sellerTools.aiProductImage.afterGenerate")}
                  </span>
                  <PlaceholderImage className={styles.exampleImg} />
                </div>
              </div>
            </div>
          </div>

          {/* Scene reference images section */}
          <div className={styles.sceneSection}>
            {/* Section header */}
            <div className={styles.sceneHeader}>
              <h2 className={styles.sceneTitle}>
                {t("sellerTools.aiProductImage.sceneTitle")}
              </h2>
              <div className={styles.sceneTools}>
                <div className={styles.searchBox}>
                  <Search size={14} className={styles.searchIcon} />
                  <input
                    type="text"
                    placeholder={t(
                      "sellerTools.aiProductImage.searchPlaceholder"
                    )}
                    className={styles.searchInput}
                  />
                </div>
                <div className={styles.sortTabs}>
                  {SORT_TABS.map((key, i) => (
                    <button
                      key={key}
                      onClick={() => setActiveSort(i)}
                      className={`${styles.sortTab} ${i === activeSort ? styles.sortTabActive : ""}`}
                    >
                      {t(`sellerTools.aiProductImage.${key}`)}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Category tabs */}
            <div className={styles.categoryBar}>
              {CATEGORIES.map((key, i) => (
                <button
                  key={key}
                  onClick={() => setActiveCategory(i)}
                  className={`${styles.categoryTab} ${i === activeCategory ? styles.categoryTabActive : ""}`}
                >
                  {t(`sellerTools.aiProductImage.${key}`)}
                </button>
              ))}
              <div className={styles.categoryMore}>
                {t("sellerTools.aiProductImage.more")}
                <ArrowRight size={12} />
              </div>
            </div>

            {/* Image grid */}
            <div className={styles.sceneGrid}>
              {SCENE_CARDS.map((card, i) => (
                <div key={i} className={styles.sceneCard}>
                  {card.promo && (
                    <div className={styles.promoBadge}>
                      <Flame size={12} className={styles.promoFlame} />
                      {card.promo}
                    </div>
                  )}
                  <div
                    className={`${styles.sceneCardThumb} ${card.isDark ? styles.sceneCardDark : ""}`}
                  >
                    <PlaceholderImage
                      className={`${styles.sceneCardImg} ${card.isDark ? styles.sceneCardImgDark : ""}`}
                      dark={card.isDark}
                    />

                    {/* Hover action layer */}
                    {card.hasAction === "plus-heart" && (
                      <div className={styles.hoverOverlay}>
                        <button className={styles.hoverBtn}>
                          <Plus size={16} />
                        </button>
                        <button className={styles.hoverBtn}>
                          <Heart size={16} />
                        </button>
                      </div>
                    )}
                    {card.hasAction === "generate" && (
                      <div className={styles.hoverOverlay}>
                        <button className={styles.hoverGenerateBtn}>
                          {t("sellerTools.aiProductImage.generateSimilar")}
                        </button>
                      </div>
                    )}

                    {/* Thumbnail overlay */}
                    <div className={styles.cardThumbnail}>
                      <PlaceholderImage className={styles.cardThumbnailImg} />
                    </div>
                  </div>
                  <p className={styles.sceneCardLabel}>
                    {t(`sellerTools.aiProductImage.${card.labelKey}`)}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Floating buttons */}
      <div className={styles.floatActions}>
        <button className={styles.floatBtn}>
          <Headset size={24} />
          <div className={styles.floatTooltip}>
            {t("sellerTools.aiProductImage.contactSupport")}
          </div>
        </button>
        <button className={styles.floatBtn}>
          <HelpCircle size={24} />
          <div className={styles.floatTooltip}>
            {t("sellerTools.aiProductImage.helpCenter")}
          </div>
        </button>
      </div>

      {/* Promo card */}
      {showPromo && (
        <div className={styles.promoCard}>
          <button
            className={styles.promoClose}
            onClick={() => setShowPromo(false)}
          >
            <X size={10} />
          </button>
          <PlaceholderImage className={styles.promoCardImg} />
          <div className={styles.promoCardOverlay}>
            <p className={styles.promoCardText}>
              {t("sellerTools.aiProductImage.joinNow")}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
