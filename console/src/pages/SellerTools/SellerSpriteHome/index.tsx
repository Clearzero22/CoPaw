import { useState } from "react";
import { Card } from "antd";
import {
  ChevronDown,
  ChevronRight,
  Star,
  MessageCircle,
  HelpCircle,
  ArrowUp,
  Package,
  Search,
  CornerDownLeft,
  Eye,
  UserCircle,
  Lightbulb,
} from "lucide-react";
import { useTranslation } from "react-i18next";
import { marketData, courses, quickAccessItems, searchTabs, courseTabs } from "./types";
import styles from "./index.module.less";

const iconMap: Record<string, React.ElementType> = {
  package: Package,
  search: Search,
  cornerDownLeft: CornerDownLeft,
  eye: Eye,
};

function NavTabGroup({
  tabs,
  active,
  onChange,
}: {
  tabs: string[];
  active: string;
  onChange: (t: string) => void;
}) {
  return (
    <div className={styles.navTabGroup}>
      {tabs.map((tab) => (
        <button
          key={tab}
          onClick={() => onChange(tab)}
          className={`${styles.navTab} ${active === tab ? styles.active : ""}`}
        >
          {tab}
        </button>
      ))}
    </div>
  );
}

function formatNum(n: number) {
  return n.toLocaleString();
}

export default function SellerSpriteHome() {
  const { t } = useTranslation();
  const [activeSearchTab, setActiveSearchTab] = useState(searchTabs[0]);
  const [activeCourseTab, setActiveCourseTab] = useState(courseTabs[0]);

  return (
    <div className={styles.pageContainer}>
      {/* ─── Welcome Card ─── */}
      <Card bordered={false} className={styles.welcomeCard}>
        <div className={styles.welcomeHeader}>
          <h1 className={styles.welcomeTitle}>
            {t("sellerTools.sellerSpriteHome.welcomeTitle")}
          </h1>
          <button className={styles.welcomeAction}>
            <MessageCircle size={16} />
            {t("sellerTools.sellerSpriteHome.assistantBtn")}
          </button>
        </div>
        <div className={styles.welcomeBanner}>
          <div className={styles.bannerLeft}>
            <div className={styles.brandCircle}>S</div>
            <span className={styles.bannerPlus}>+</span>
            <div className={styles.brandCircleOrange}>
              <Star size={16} style={{ fill: "currentColor" }} />
            </div>
            <span className={styles.bannerPlus}>+</span>
            <div className={styles.brandCircleIndigo}>U</div>
            <span className={styles.bannerSlogan}>
              {t("sellerTools.sellerSpriteHome.bannerSlogan")}
            </span>
          </div>
          <div className={styles.bannerButtons}>
            <button className={`${styles.bannerBtn} ${styles.btnBrand}`}>
              {t("sellerTools.sellerSpriteHome.webTutorial")}
            </button>
            <button className={`${styles.bannerBtn} ${styles.btnOrange}`}>
              {t("sellerTools.sellerSpriteHome.storyGuide")}
            </button>
            <button className={`${styles.bannerBtn} ${styles.btnIndigo}`}>
              {t("sellerTools.sellerSpriteHome.installPlugin")}
            </button>
          </div>
        </div>
      </Card>

      {/* ─── Main Grid ─── */}
      <div className={styles.mainGrid}>
        {/* ─── Left Column ─── */}
        <div className={styles.leftCol}>
          {/* Quick Search */}
          <Card bordered={false} className={styles.sectionCard}>
            <h2 className={styles.sectionTitle}>
              {t("sellerTools.sellerSpriteHome.quickSearchTitle")}
            </h2>
            <NavTabGroup
              tabs={searchTabs}
              active={activeSearchTab}
              onChange={setActiveSearchTab}
            />
            <div className={styles.searchRow}>
              <button className={styles.searchSiteBtn}>
                <span>US</span>
                <ChevronDown size={16} style={{ color: "#9ca3af" }} />
              </button>
              <button className={styles.searchTimeBtn}>
                <span>{t("sellerTools.sellerSpriteHome.last30Days")}</span>
                <ChevronDown size={16} />
              </button>
              <input
                type="text"
                className={styles.searchInput}
                placeholder={t("sellerTools.sellerSpriteHome.searchPlaceholder")}
              />
              <button className={styles.searchSubmitBtn}>
                {t("sellerTools.sellerSpriteHome.searchBtn")}
              </button>
            </div>
            <div className={styles.searchExamples}>
              <span>{t("sellerTools.sellerSpriteHome.example")}</span>
              {["B0CT9R7WN5", "B08QRFZ6TH", "B07S18RBH2"].map((asin) => (
                <span key={asin} className={styles.searchExampleAsin}>
                  {asin}
                </span>
              ))}
            </div>
          </Card>

          {/* Growing Markets */}
          <Card bordered={false} className={styles.sectionCard}>
            <div className={styles.sectionHeader}>
              <div className={styles.sectionTitle}>
                {t("sellerTools.sellerSpriteHome.growingMarketsTitle")}
                <HelpCircle
                  size={16}
                  style={{ color: "#9ca3af", cursor: "pointer" }}
                />
              </div>
              <a className={styles.sectionLink}>
                {t("sellerTools.sellerSpriteHome.viewMore")}
                <ChevronRight size={16} />
              </a>
            </div>
            <p className={styles.marketsSubtitle}>
              {t("sellerTools.sellerSpriteHome.growingMarketsDesc")}
            </p>
            <div style={{ overflowX: "auto" }}>
              <table className={styles.marketsTable}>
                <thead>
                  <tr>
                    <th className={styles.center}>
                      {t("sellerTools.sellerSpriteHome.colRank")}
                    </th>
                    <th>{t("sellerTools.sellerSpriteHome.colKeyword")}</th>
                    <th className={styles.right}>
                      {t("sellerTools.sellerSpriteHome.colWeekRank")}
                    </th>
                    <th className={styles.right}>
                      {t("sellerTools.sellerSpriteHome.colLastWeekRank")}
                    </th>
                    <th className={styles.right}>
                      {t("sellerTools.sellerSpriteHome.colChange")}
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {marketData.map((row) => (
                    <tr key={row.rank}>
                      <td className={styles.center}>{row.rank}</td>
                      <td className={styles.keywordCell}>
                        {row.translation ? (
                          <div>
                            <a href="#">{row.keyword}</a>
                            <div className={styles.keywordTranslation}>
                              {row.translation}
                            </div>
                          </div>
                        ) : (
                          <a href="#">{row.keyword}</a>
                        )}
                      </td>
                      <td className={styles.right}>{formatNum(row.weekRank)}</td>
                      <td className={styles.right}>
                        {formatNum(row.lastWeekRank)}
                      </td>
                      <td className={styles.right}>
                        <span className={styles.changeUp}>
                          {formatNum(row.change)}
                          <ArrowUp size={12} />
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </div>

        {/* ─── Right Column ─── */}
        <div className={styles.rightCol}>
          {/* Quick Access */}
          <Card bordered={false} className={styles.sectionCard}>
            <h2 className={styles.sectionTitle}>
              {t("sellerTools.sellerSpriteHome.quickAccessTitle")}
            </h2>
            <div className={styles.quickAccessGrid}>
              {quickAccessItems.map((item) => {
                const Icon = iconMap[item.icon];
                return (
                  <button key={item.icon} className={styles.quickAccessItem}>
                    <div className={styles.quickAccessIcon}>
                      <Icon size={20} />
                    </div>
                    <span className={styles.quickAccessLabel}>
                      {t(`sellerTools.sellerSpriteHome.${item.labelKey}`)}
                    </span>
                  </button>
                );
              })}
            </div>
          </Card>

          {/* Live Courses */}
          <Card bordered={false} className={styles.sectionCard}>
            <div className={styles.sectionHeader}>
              <h2 className={styles.sectionTitle}>
                {t("sellerTools.sellerSpriteHome.liveCoursesTitle")}
              </h2>
              <a className={styles.sectionLink}>
                {t("sellerTools.sellerSpriteHome.historyReplay")}
              </a>
            </div>
            <NavTabGroup
              tabs={courseTabs}
              active={activeCourseTab}
              onChange={setActiveCourseTab}
            />
            <div className={styles.courseList}>
              {courses.map((course, idx) => (
                <div key={idx} className={styles.courseItem}>
                  <div
                    className={styles.courseThumbnail}
                    style={{
                      background: `linear-gradient(135deg, ${course.gradientFrom}, ${course.gradientTo})`,
                    }}
                  >
                    <div className={styles.courseThumbnailIcon}>
                      <UserCircle size={24} />
                    </div>
                    <span className={styles.courseBadge}>
                      {t("sellerTools.sellerSpriteHome.startingSoon")}
                    </span>
                  </div>
                  <div className={styles.courseInfo}>
                    <div>
                      <div className={styles.courseTitle}>{course.title}</div>
                      <div className={styles.courseMeta}>
                        {t("sellerTools.sellerSpriteHome.liveTime")}:{" "}
                        {course.time}
                      </div>
                      <div className={styles.courseMeta}>
                        {t("sellerTools.sellerSpriteHome.instructor")}:{" "}
                        {course.teacher}
                      </div>
                    </div>
                    <div className={styles.courseBottomRow}>
                      <span className={styles.courseDesc}>{course.desc}</span>
                      <button className={styles.courseReserveBtn}>
                        {t("sellerTools.sellerSpriteHome.reserveBtn")}
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </Card>

          {/* Usage Tips */}
          <Card bordered={false} className={styles.sectionCard}>
            <div className={styles.sectionHeader}>
              <h2 className={styles.sectionTitle}>
                {t("sellerTools.sellerSpriteHome.usageTipsTitle")}
              </h2>
              <a className={styles.sectionLink}>
                {t("sellerTools.sellerSpriteHome.viewMore")}
                <ChevronRight size={16} />
              </a>
            </div>
            <div className={styles.tipLink}>
              <div className={styles.tipThumbnail}>
                <div className={styles.tipThumbnailBg} />
                <Lightbulb size={32} className={styles.tipThumbnailIcon} />
              </div>
              <div className={styles.tipContent}>
                <div className={styles.tipTitle}>
                  {t("sellerTools.sellerSpriteHome.tipTitle")}
                </div>
                <div className={styles.tipDate}>
                  {t("sellerTools.sellerSpriteHome.tipDate")}
                </div>
                <div className={styles.tipDesc}>
                  {t("sellerTools.sellerSpriteHome.tipDesc")}
                </div>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
