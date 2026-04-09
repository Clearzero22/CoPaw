import { useState } from "react";
import {
  ArrowUp,
  ChevronDown,
  ChevronRight,
  Eye,
  HelpCircle,
  Lightbulb,
  MessageCircle,
  MessageSquare,
  Package,
  Search,
  CornerDownLeft,
  Star,
  UserCircle,
} from "lucide-react";
import { Table, Button, Tooltip, Select } from "antd";
import { useTranslation } from "react-i18next";
import type { ColumnsType } from "antd/es/table";
import styles from "./index.module.less";
import {
  marketData,
  courses,
  quickAccessItems,
  searchTabs,
  courseTabs,
  marketplaceOptions,
  timeRangeOptions,
  exampleAsins,
} from "./mockData";
import type { MarketRow, QuickAccessItem } from "./mockData";

const iconMap: Record<QuickAccessItem["icon"], typeof Package> = {
  package: Package,
  search: Search,
  "corner-down-left": CornerDownLeft,
  eye: Eye,
};

function formatNum(n: number): string {
  return n.toLocaleString();
}

function TabGroup({
  tabs,
  active,
  onChange,
}: {
  tabs: string[];
  active: string;
  onChange: (tab: string) => void;
}) {
  return (
    <div className={styles.tabGroup}>
      {tabs.map((tab) => (
        <span
          key={tab}
          className={`${styles.tabItem} ${active === tab ? styles.active : ""}`}
          onClick={() => onChange(tab)}
        >
          {tab}
        </span>
      ))}
    </div>
  );
}

export default function SellerSpriteHome() {
  const { t } = useTranslation();
  const [activeSearchTab, setActiveSearchTab] = useState(searchTabs[0]);
  const [activeCourseTab, setActiveCourseTab] = useState(courseTabs[0]);
  const [searchValue, setSearchValue] = useState("");
  const [marketplace, setMarketplace] = useState("us");
  const [timeRange, setTimeRange] = useState("30d");

  const marketColumns: ColumnsType<MarketRow> = [
    {
      title: t("sellerTools.sellerSpriteHome.tableRank", "序号"),
      dataIndex: "rank",
      key: "rank",
      width: 60,
      align: "center",
      render: (rank: number) => (
        <span className={styles.rankCell}>{rank}</span>
      ),
    },
    {
      title: t("sellerTools.sellerSpriteHome.tableKeyword", "关键词"),
      dataIndex: "keyword",
      key: "keyword",
      render: (keyword: string, record: MarketRow) => (
        <div className={styles.keywordCell}>
          <span className={styles.keywordMain}>{keyword}</span>
          {record.translation && (
            <div className={styles.keywordTranslation}>
              {record.translation}
            </div>
          )}
        </div>
      ),
    },
    {
      title: t("sellerTools.sellerSpriteHome.tableWeekRank", "本周排名"),
      dataIndex: "weekRank",
      key: "weekRank",
      align: "right",
      render: (val: number) => formatNum(val),
    },
    {
      title: t("sellerTools.sellerSpriteHome.tableLastWeekRank", "上周排名"),
      dataIndex: "lastWeekRank",
      key: "lastWeekRank",
      align: "right",
      render: (val: number) => formatNum(val),
    },
    {
      title: t("sellerTools.sellerSpriteHome.tableChange", "排名变化"),
      dataIndex: "change",
      key: "change",
      align: "right",
      render: (change: number) => (
        <span className={styles.changeCell}>
          {formatNum(change)}
          <ArrowUp size={14} />
        </span>
      ),
    },
  ];

  return (
    <div className={styles.pageContainer}>
      {/* Orange Brand Header */}
      <header className={styles.brandHeader}>
        <div className={styles.headerInner}>
          <div className={styles.headerLeft}>
            <a className={styles.logoLink} href="#">
              <span className={styles.logoIcon}>S</span>
              <span>{t("sellerTools.sellerSpriteHome.brandName", "卖家精灵")}</span>
            </a>
            <nav className={styles.headerNav}>
              <a className={styles.navLink} href="#">
                <span style={{ fontSize: 14 }}>CN</span> <span>{t("sellerTools.sellerSpriteHome.chinese", "中文")}</span>
              </a>
              <a className={`${styles.navLink} ${styles.active}`} href="#">
                {t("sellerTools.sellerSpriteHome.home", "首页")}
              </a>
              {["后台", "AI解读", "工具", "知识库"].map((item) => (
                <span key={item} className={styles.navDropdown}>
                  {item} <ChevronDown size={12} />
                </span>
              ))}
              {["插件", "API接口", "MCP服务", "优麦云"].map((item) => (
                <a key={item} className={styles.navLink} href="#">
                  {item}
                </a>
              ))}
            </nav>
          </div>
          <div className={styles.headerRight}>
            <a className={styles.navLink} href="#">
              {t("sellerTools.sellerSpriteHome.purchase", "购买")}
            </a>
            <a className={styles.navLink} href="#">
              {t("sellerTools.sellerSpriteHome.community", "社区")}
            </a>
            <div className={styles.userBadge}>
              <span style={{ fontSize: 12 }}>{t("sellerTools.sellerSpriteHome.notLoggedIn", "未登录")}</span>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className={styles.mainContent}>
        {/* Welcome Card */}
        <section className={styles.welcomeSection}>
          <div className={styles.welcomeHeader}>
            <h1 className={styles.welcomeTitle}>
              {t("sellerTools.sellerSpriteHome.welcomeTitle", "欢迎来到卖家精灵！开启爆单之旅，就差你的加入 ~")}
            </h1>
            <Button
              className={styles.assistantBtn}
              icon={<MessageCircle size={14} />}
              type="text"
            >
              {t("sellerTools.sellerSpriteHome.assistant", "1V1专属小助手")}
            </Button>
          </div>
          <div className={styles.welcomeBanner}>
            <div className={styles.bannerLeft}>
              <span className={`${styles.bannerAvatar} ${styles.orange}`}>S</span>
              <span className={styles.bannerPlus}>+</span>
              <span className={`${styles.bannerAvatar} ${styles.lightOrange}`}>
                <Star size={14} fill="currentColor" />
              </span>
              <span className={styles.bannerPlus}>+</span>
              <span className={`${styles.bannerAvatar} ${styles.indigo}`}>U</span>
              <span className={styles.bannerText}>
                {t("sellerTools.sellerSpriteHome.bannerText", "选品用网页，运营用插件，推广用优麦云")}
              </span>
            </div>
            <div className={styles.bannerActions}>
              <Button className={`${styles.bannerActionBtn} ${styles.orange}`} type="text">
                {t("sellerTools.sellerSpriteHome.webTutorial", "网页版讲解")}
              </Button>
              <Button className={`${styles.bannerActionBtn} ${styles.lightOrange}`} type="text">
                {t("sellerTools.sellerSpriteHome.operationStory", "操作故事版")}
              </Button>
              <Button className={`${styles.bannerActionBtn} ${styles.indigo}`} type="text">
                {t("sellerTools.sellerSpriteHome.installPlugin", "安装浏览器插件")}
              </Button>
            </div>
          </div>
        </section>

        {/* Two-column layout */}
        <div className={styles.contentGrid}>
          {/* Left Column (7/12) */}
          <div className={styles.leftColumn}>
            {/* Quick Search */}
            <section className={styles.sectionCard}>
              <h2 className={styles.sectionTitle}>
                {t("sellerTools.sellerSpriteHome.quickSearch", "快捷搜索")}
              </h2>
              <TabGroup
                tabs={searchTabs}
                active={activeSearchTab}
                onChange={setActiveSearchTab}
              />
              <div className={styles.searchRow}>
                <Select
                  className={styles.searchMarketplace}
                  value={marketplace}
                  onChange={setMarketplace}
                  variant="borderless"
                  popupMatchSelectWidth={false}
                  options={marketplaceOptions}
                  suffixIcon={<ChevronDown size={14} />}
                />
                <Select
                  className={styles.searchTimeRange}
                  value={timeRange}
                  onChange={setTimeRange}
                  variant="borderless"
                  popupMatchSelectWidth={false}
                  options={timeRangeOptions}
                  suffixIcon={<ChevronDown size={14} />}
                />
                <div className={styles.searchInputWrapper}>
                  <input
                    type="text"
                    placeholder={t(
                      "sellerTools.sellerSpriteHome.searchPlaceholder",
                      "请输入ASIN查竞品"
                    )}
                    value={searchValue}
                    onChange={(e) => setSearchValue(e.target.value)}
                    style={{
                      width: "100%",
                      padding: "8px 16px",
                      border: "none",
                      outline: "none",
                      fontSize: 13,
                      background: "transparent",
                      color: "inherit",
                    }}
                  />
                </div>
                <Button className={styles.searchBtn} type="primary">
                  {t("sellerTools.sellerSpriteHome.searchBtn", "查 询")}
                </Button>
              </div>
              <div className={styles.searchExamples}>
                <span>{t("sellerTools.sellerSpriteHome.example", "示例")}：</span>
                {exampleAsins.map((asin) => (
                  <span
                    key={asin}
                    className={styles.exampleAsin}
                    onClick={() => setSearchValue(asin)}
                  >
                    {asin}
                  </span>
                ))}
              </div>
            </section>

            {/* Growing Markets Table */}
            <section className={styles.sectionCard} style={{ flex: 1 }}>
              <div className={styles.sectionHeader}>
                <h2 className={styles.sectionTitle}>
                  {t("sellerTools.sellerSpriteHome.growingMarkets", "持续增长市场")}
                  <Tooltip
                    title={t(
                      "sellerTools.sellerSpriteHome.growingMarketsTooltip",
                      "搜索频率排名连续4周增长超过1W名的关键词"
                    )}
                  >
                    <HelpCircle size={14} style={{ color: "#bfbfbf", cursor: "pointer" }} />
                  </Tooltip>
                </h2>
                <a className={styles.sectionMoreLink} href="#">
                  {t("sellerTools.sellerSpriteHome.viewMore", "查看更多")} <ChevronRight size={14} />
                </a>
              </div>
              <p className={styles.marketDesc}>
                {t(
                  "sellerTools.sellerSpriteHome.marketDesc",
                  "搜索频率排名连续4周增长超过1W名，并且连续4周增长率都在10%的关键词"
                )}
              </p>
              <Table<MarketRow>
                className={styles.marketTable}
                dataSource={marketData}
                columns={marketColumns}
                rowKey="rank"
                pagination={false}
                size="small"
                bordered={false}
              />
            </section>
          </div>

          {/* Right Column (5/12) */}
          <div className={styles.rightColumn}>
            {/* Quick Access */}
            <section className={styles.sectionCard}>
              <h2 className={styles.sectionTitle}>
                {t("sellerTools.sellerSpriteHome.quickAccess", "快捷访问")}
              </h2>
              <div className={styles.quickAccessGrid}>
                {quickAccessItems.map((item) => {
                  const Icon = iconMap[item.icon];
                  return (
                    <a key={item.label} href="#" className={styles.quickAccessItem}>
                      <div className={styles.quickAccessIconBox}>
                        <Icon size={20} />
                      </div>
                      <span className={styles.quickAccessLabel}>{item.label}</span>
                    </a>
                  );
                })}
              </div>
            </section>

            {/* Live Courses */}
            <section className={styles.sectionCard}>
              <div className={styles.sectionHeader}>
                <h2 className={styles.sectionTitle}>
                  {t("sellerTools.sellerSpriteHome.liveCourses", "直播课程")}
                </h2>
                <a className={styles.historyLink} href="#">
                  {t("sellerTools.sellerSpriteHome.historyReplay", "历史回放")}
                </a>
              </div>
              <TabGroup
                tabs={courseTabs}
                active={activeCourseTab}
                onChange={setActiveCourseTab}
              />
              <div className={styles.courseList}>
                {courses.map((course, idx) => (
                  <div key={idx} className={styles.courseCard}>
                    <div
                      className={styles.courseThumbnail}
                      style={{ background: course.color }}
                    >
                      <div className={styles.courseThumbnailInner}>
                        <UserCircle size={24} />
                      </div>
                      <span className={styles.courseBadge}>
                        {t("sellerTools.sellerSpriteHome.startingSoon", "即将开始")}
                      </span>
                    </div>
                    <div className={styles.courseInfo}>
                      <div>
                        <p className={styles.courseTitle}>{course.title}</p>
                        <p className={styles.courseMeta}>
                          {t("sellerTools.sellerSpriteHome.liveTime", "直播时间")}：{course.time}
                        </p>
                        <p className={styles.courseMeta}>
                          {t("sellerTools.sellerSpriteHome.teacher", "主讲老师")}：{course.teacher}
                        </p>
                      </div>
                      <div className={styles.courseBottom}>
                        <span className={styles.courseDesc}>{course.desc}</span>
                        <button className={styles.courseBookBtn}>
                          {t("sellerTools.sellerSpriteHome.bookLive", "预约直播")}
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </section>

            {/* Usage Tips */}
            <section className={styles.sectionCard}>
              <div className={styles.sectionHeader}>
                <h2 className={styles.sectionTitle}>
                  {t("sellerTools.sellerSpriteHome.usageTips", "使用技巧")}
                </h2>
                <a className={styles.sectionMoreLink} href="#">
                  {t("sellerTools.sellerSpriteHome.viewMore", "查看更多")} <ChevronRight size={14} />
                </a>
              </div>
              <a className={styles.tipsCard} href="#">
                <div className={styles.tipsThumbnail}>
                  <div className={styles.tipsThumbnailDecor} />
                  <Lightbulb size={32} className={styles.tipsThumbnailIcon} />
                </div>
                <div className={styles.tipsInfo}>
                  <h3 className={styles.tipsTitle}>
                    {t(
                      "sellerTools.sellerSpriteHome.tipsTitle",
                      "一文搞懂大数据选品 (约实操，20+种选品)"
                    )}
                  </h3>
                  <p className={styles.tipsDate}>
                    {t("sellerTools.sellerSpriteHome.publishTime", "发布时间")}：2025-01-21 19:30
                  </p>
                  <p className={styles.tipsDesc}>
                    {t(
                      "sellerTools.sellerSpriteHome.tipsDesc",
                      "看视频，来了解卖家精灵亚马逊大数据分析工具选品实操，总结了 20 + 选品思路，分关键词、产品、类目大数据选品三类！快来看看吧"
                    )}
                  </p>
                </div>
              </a>
            </section>
          </div>
        </div>
      </main>

      {/* Floating Sidebar */}
      <div className={styles.floatSidebar}>
        <div className={`${styles.floatAvatar} ${styles.pink}`}>EA</div>
        <div className={`${styles.floatAvatar} ${styles.gray}`}>U</div>
      </div>

      {/* Customer Service */}
      <div className={styles.customerService}>
        <button className={styles.csButton}>
          <MessageSquare size={20} />
          <span className={styles.csText}>
            {t("sellerTools.sellerSpriteHome.onlineService", "在线客服")}
          </span>
        </button>
      </div>
    </div>
  );
}
