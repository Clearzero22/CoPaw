import { useState, useEffect } from "react";
import { Card, Tag, Progress } from "antd";
import {
  Box, Users, Home, Image, FileText, AlertTriangle, Star,
  Lightbulb, Heart, Store, Search, Route, BarChart2, Brain,
} from "lucide-react";
import { useTranslation } from "react-i18next";
import {
  sidebarItems,
  overviewCards,
  coreAdvantages,
  weaknesses,
  copywritingFlow,
  visualFlow,
  trafficAttributions,
  topKeywords,
} from "./types";
import type { KeywordRow } from "./types";
import styles from "./index.module.less";

// ─── Icon map ───────────────────────────────────────────────────────────────

const iconMap: Record<string, React.ElementType> = {
  cube: Box,
  users: Users,
  home: Home,
};

const iconClassMap: Record<string, string> = {
  cube: "iconCube",
  users: "iconUsers",
  home: "iconHome",
};

// ─── Tag color map (Tailwind tag-* to Ant Design) ───────────────────────────

const antTagColor: Record<string, string> = {
  blue: "#2563eb",
  purple: "#9333ea",
  green: "#16a34a",
  gray: "#6b7280",
  orange: "#ea580c",
};

// ─── Sub-components ─────────────────────────────────────────────────────────

function SectionTitle({ children }: { children: React.ReactNode }) {
  return <h2 className={styles.sectionTitle}>{children}</h2>;
}

function FlowNumber({ num }: { num: number }) {
  return <div className={styles.flowNumber}>{num}</div>;
}

// ─── Main Component ─────────────────────────────────────────────────────────

export default function CopywritingAnalysis() {
  const { t } = useTranslation();
  const [activeSection, setActiveSection] = useState("overview");

  // Scroll-spy
  useEffect(() => {
    const handleScroll = () => {
      const sections = sidebarItems.map((s) => s.id);
      let current = sections[0];
      for (const id of sections) {
        const el = document.getElementById(id);
        if (el && el.getBoundingClientRect().top <= 120) {
          current = id;
        }
      }
      setActiveSection(current);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  function scrollTo(id: string) {
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
    setActiveSection(id);
  }

  // Traffic attribution background class mapping
  const trafficBgClasses = ["bgBlue", "bgPurple", "bgGreen", "bgGray", "bgOrange", "bgYellow"];

  return (
    <div className={styles.pageContainer}>
      {/* ─── Sidebar ─── */}
      <aside className={styles.sidebar}>
        <Card className={styles.sidebarCard} bordered={false} size="small">
          <div className={styles.sidebarLabel}>
            US(B00MA2T9BC) | {t("sellerTools.copywriting.panorama", "全景分析")}
          </div>
          <nav>
            {sidebarItems.map((item) => (
              <a
                key={item.id}
                href={`#${item.id}`}
                onClick={(e) => {
                  e.preventDefault();
                  scrollTo(item.id);
                }}
                className={`${styles.sidebarLink} ${activeSection === item.id ? styles.active : ""}`}
              >
                {item.label}
              </a>
            ))}
          </nav>
        </Card>
      </aside>

      {/* ─── Main Content ─── */}
      <main className={styles.mainContent}>
        {/* Header */}
        <div className={styles.reportHeader}>
          <div className={styles.headerRow}>
            <div>
              <h1>US(B00MA2T9BC) | {t("sellerTools.copywriting.panorama", "全景分析")} | {t("sellerTools.copywriting.reportTitle", "Listing数据深度解析报告")}</h1>
              <p className={styles.headerSubtitle}>{t("sellerTools.copywriting.reportSubtitle", "竞品分析报告 - 半自动自清洁猫砂盆")}</p>
            </div>
            <div className={styles.headerMeta}>
              <div>{t("sellerTools.copywriting.analyst", "分析师")}：{t("sellerTools.copywriting.toolName", "卖家精灵")}</div>
              <div>{t("sellerTools.copywriting.dataSource", "数据来源")}：{t("sellerTools.copywriting.toolName", "卖家精灵")}</div>
            </div>
          </div>
        </div>

        {/* Product Info */}
        <Card className={styles.cardSpacing} bordered={false}>
          <div className={styles.productInfo}>
            <div className={styles.productImagePlaceholder}>
              <Image size={32} />
            </div>
            <div className={styles.productInfoGrid}>
              {[
                t("sellerTools.copywriting.seller", "卖家"),
                t("sellerTools.copywriting.brand", "品牌"),
                t("sellerTools.copywriting.sales", "销量(父)"),
                t("sellerTools.copywriting.childSales", "子体销量"),
                t("sellerTools.copywriting.revenue", "销售额"),
                t("sellerTools.copywriting.variants", "变体数"),
              ].map((label) => (
                <div key={label} className={styles.productInfoItem}>
                  <div className={styles.productInfoLabel}>{label}：</div>
                  <div className={styles.productInfoValue}>--</div>
                </div>
              ))}
            </div>
          </div>
        </Card>

        {/* ─── Section 1: Overview ─── */}
        <section id="overview" className={styles.sectionSpacing}>
          <SectionTitle>{t("sellerTools.copywriting.overviewTitle", "三句话看懂这个产品")}</SectionTitle>
          <div className={styles.overviewGrid}>
            {overviewCards.map((card) => {
              const Icon = iconMap[card.icon] ?? Box;
              const iconClass = iconClassMap[card.icon] ?? "iconCube";
              return (
                <Card key={card.title} className={styles.overviewCard} bordered={false}>
                  <div className={`${styles.overviewIconWrapper} ${styles[iconClass]}`}>
                    <Icon size={20} />
                  </div>
                  <div className={styles.overviewCardTitle}>{card.title}</div>
                  <p className={styles.overviewCardDesc}>{card.desc}</p>
                </Card>
              );
            })}
          </div>

          <Card className={styles.summarySection} bordered={false}>
            <div className={styles.summaryIconTitle}>
              <FileText size={20} className={styles.iconOrange} />
              {t("sellerTools.copywriting.coreSummary", "核心摘要")}
            </div>
            <p className={styles.summaryText}>
              {t("sellerTools.copywriting.coreSummaryText", "这款自动猫砂盆最大的卖点是\"不用铲屎\"，这抓住了所有猫主人的痛点。但问题是，它宣传的\"自清洁\"和\"易清洁\"根本不靠谱，很多人买了以后发现机器老是坏。它卖的是一个美好的想象，但产品质量没跟上。")}
            </p>

            <div className={styles.summaryIconTitle}>
              <Star size={18} className={styles.iconYellow} />
              {t("sellerTools.copywriting.coreAdvantages", "核心优势")}
            </div>
            <div className={styles.advantagesGrid}>
              {coreAdvantages.map((a) => (
                <div key={a.title} className={styles.advantageItem}>
                  <div className={styles.advantageTitle}>{a.title}</div>
                  <p className={styles.advantageDesc}>{a.desc}</p>
                </div>
              ))}
            </div>

            <div className={styles.weaknessBox}>
              <div className={styles.summaryIconTitle}>
                <AlertTriangle size={18} className={styles.iconRed} />
                {t("sellerTools.copywriting.weaknesses", "弱点与风险")}
              </div>
              <div className={styles.weaknessGrid}>
                {weaknesses.map((w) => (
                  <div key={w.title}>
                    <div className={styles.weaknessTitle}>{w.title}</div>
                    <p className={styles.weaknessDesc}>{w.desc}</p>
                  </div>
                ))}
              </div>
            </div>
          </Card>
        </section>

        {/* ─── Section 2: Copywriting ─── */}
        <section id="copywriting" className={styles.sectionSpacing}>
          <SectionTitle>{t("sellerTools.copywriting.copywritingTitle", "文案质量分析")}</SectionTitle>

          <Card className={styles.cardSpacing} bordered={false}>
            <div className={styles.summaryIconTitle}>
              {t("sellerTools.copywriting.titleAnalysis", "标题分析")}
            </div>
            <div className={styles.titleAnalysisBox}>
              <div className={styles.titleLabel}>Decomposed Title:</div>
              <div className={styles.tagRow}>
                <Tag color="blue">Pet Zone ({t("sellerTools.copywriting.tagBrand", "品牌")})</Tag>
                <Tag color="purple">Self Cleaning Semi Automatic Cat Litter Box ({t("sellerTools.copywriting.tagProduct", "自清洁半自动猫砂盆")})</Tag>
                <Tag color="blue">Smart Scoop Cat Litter Box ({t("sellerTools.copywriting.tagModel", "产品型号/系列")})</Tag>
                <Tag color="green">with 6 Bags & Carbon Filter ({t("sellerTools.copywriting.tagAccessory", "附带垃圾袋和碳滤芯")})</Tag>
                <Tag color="default">{t("sellerTools.copywriting.tagScenario", "for Up to Two Cats 6-16 Pounds (适用2只6-16磅的猫)")}</Tag>
              </div>
            </div>
            <div className={styles.strategyBox}>
              <p>
                <span className={styles.strategyLabel}>{t("sellerTools.copywriting.strategySummary", "策略总结")}：</span>
                <span className={styles.strategyText}>
                  {t("sellerTools.copywriting.titleStrategy", "这个标题用了\"品牌+核心功能+型号+赠品/配件+适用场景/用户限制\"的组合拳，核心是突出产品的\"自清洁\"和\"半自动\"卖点。")}
                </span>
              </p>
            </div>
          </Card>

          <Card bordered={false}>
            <div className={styles.summaryIconTitle}>
              {t("sellerTools.copywriting.narrativeFlow", "文案叙事流")}
            </div>
            <div className={styles.flowContainer}>
              <div className={styles.flowList}>
                {copywritingFlow.map((step, i) => (
                  <div key={i} className={styles.flowItem}>
                    <FlowNumber num={i + 1} />
                    <div>
                      <div className={styles.flowTitle}>{step.title}</div>
                      <p className={styles.flowDesc}>{step.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div className={styles.insightList}>
              <div className={styles.insightItem}>
                <Lightbulb size={16} className={`${styles.insightIcon} ${styles.insightIconYellow}`} />
                <div>
                  <span className={styles.insightBold}>{t("sellerTools.copywriting.strategySummary", "策略总结")}：</span>
                  <span className={styles.insightText}>
                    {t("sellerTools.copywriting.copywritingStrategyText", "这五点描述从解决核心痛点开始，逐步深入到解决常见的次要痛点，再到提升用户体验，最后明确适用场景，形成了完整的说服路径。")}
                  </span>
                </div>
              </div>
              <div className={styles.insightItem}>
                <Heart size={16} className={`${styles.insightIcon} ${styles.insightIconRed}`} />
                <div>
                  <span className={styles.insightBold}>{t("sellerTools.copywriting.buyerFeeling", "买家感受")}：</span>
                  <span className={styles.insightText}>
                    {t("sellerTools.copywriting.buyerFeelingText", "全部读完，买家会觉得这款产品功能全面，考虑周到，给人一种靠谱、值得信赖的感觉。")}
                  </span>
                </div>
              </div>
              <div className={styles.insightItem}>
                <Store size={16} className={`${styles.insightIcon} ${styles.insightIconBlue}`} />
                <div>
                  <span className={styles.insightBold}>{t("sellerTools.copywriting.sellerStoryline", "卖家的故事线")}：</span>
                  <span className={styles.insightText}>
                    {t("sellerTools.copywriting.sellerStorylineText", "卖家想通过这五点，在买家心里建立一个\"解放双手、保持家庭整洁、提升养猫幸福感\"的智能家居产品形象。")}
                  </span>
                </div>
              </div>
            </div>
          </Card>
        </section>

        {/* ─── Section 3: Visual ─── */}
        <section id="visual" className={styles.sectionSpacing}>
          <SectionTitle>{t("sellerTools.copywriting.visualTitle", "视觉图片分析")}</SectionTitle>

          <Card className={styles.cardSpacing} bordered={false}>
            <div className={styles.summaryIconTitle}>
              <Image size={20} className={styles.iconBlue} />
              {t("sellerTools.copywriting.imageNarrative", "图片叙事流")}
            </div>
            <div className={styles.flowList}>
              {visualFlow.map((step, i) => (
                <div key={i} className={styles.flowItem}>
                  <FlowNumber num={i + 1} />
                  <div>
                    <div className={styles.flowTitle}>{step.title}</div>
                    <p className={styles.flowDesc}>{step.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </Card>

          <Card bordered={false}>
            <div className={styles.summaryIconTitle}>
              {t("sellerTools.copywriting.visualStrategy", "整体视觉策略")}
            </div>
            <div className={styles.insightList}>
              <div className={styles.insightItem}>
                <Route size={16} className={`${styles.insightIcon} ${styles.insightIconOrange}`} />
                <div>
                  <span className={styles.insightBold}>{t("sellerTools.copywriting.narrativeSummary", "叙事线总结")}：</span>
                  <span className={styles.insightText}>
                    {t("sellerTools.copywriting.visualNarrativeText", "典型的\"功能展示-解决痛点-细节强化-场景拓展\"的叙事。首先通过主图吸引眼球，然后层层递进地展示产品功能。")}
                  </span>
                </div>
              </div>
              <div className={styles.insightItem}>
                <Search size={16} className={`${styles.insightIcon} ${styles.insightIconGreen}`} />
                <div>
                  <span className={styles.insightBold}>{t("sellerTools.copywriting.opportunityInsight", "机会洞察")}：</span>
                  <span className={styles.insightText}>
                    {t("sellerTools.copywriting.visualOpportunityText", "1. 图片中缺少产品材质的特写 2. 可以增加产品清洁过程的更详细展示 3. 可以考虑增加与其他猫砂盆的对比图 4. 缺少关于猫砂类型的兼容性说明")}
                  </span>
                </div>
              </div>
            </div>
          </Card>
        </section>

        {/* ─── Section 4: Keywords ─── */}
        <section id="keywords" className={styles.sectionSpacing}>
          <SectionTitle>{t("sellerTools.copywriting.keywordsTitle", "关键词与流量分析")}</SectionTitle>

          <div className={styles.cognitionGrid}>
            <Card className={styles.cognitionCard} bordered={false}>
              <div className={styles.cognitionTitle}>
                <Brain size={20} className={styles.iconPurple} />
                {t("sellerTools.copywriting.marketCognition", "市场核心认知")}
              </div>
              <p className={styles.cognitionText}>
                {t("sellerTools.copywriting.marketCognitionText", "在亚马逊和大部分用户眼里，这产品就是个\"自动/自清洁猫砂盆\"，核心功能和品类属性非常明确。")}
              </p>
            </Card>
            <Card className={styles.cognitionCard} bordered={false}>
              <div className={styles.cognitionTitle}>
                <BarChart2 size={20} className={styles.iconBlue} />
                {t("sellerTools.copywriting.trafficStory", "整体流量故事")}
              </div>
              <p className={styles.cognitionText}>
                {t("sellerTools.copywriting.trafficStoryText", "这个产品基本上是\"守着老本行，偶尔被竞品带流量\"的打法。核心词自然流量占比极高，但需警惕那些转化率低的\"无效\"自动清洁词。")}
              </p>
            </Card>
          </div>

          {/* Traffic Attribution */}
          <Card className={styles.cardSpacing} bordered={false}>
            <div className={styles.summaryIconTitle}>
              {t("sellerTools.copywriting.trafficAttribution", "流量归因")}
            </div>
            <div className={styles.trafficGrid}>
              {trafficAttributions.map((item, i) => (
                <div key={i} className={`${styles.trafficCard} ${styles[trafficBgClasses[i] ?? "bgGray"]}`}>
                  <div className={styles.trafficHeader}>
                    <div className={styles.trafficIcon} style={{ background: item.iconBg }}>
                      <Box size={16} />
                    </div>
                    <div className={styles.trafficCategoryMeta}>
                      <div className={styles.trafficCategory}>{item.category}</div>
                      <div className={styles.trafficSub}>{item.sub}</div>
                    </div>
                  </div>
                  <div className={styles.trafficPercentage}>{item.percentage}</div>
                  <div className={styles.trafficDetail}>
                    {t("sellerTools.copywriting.totalTraffic", "总流量占比")} ({item.traffic})
                    <br />
                    {item.organicPercent}% {t("sellerTools.copywriting.avgOrganicTraffic", "平均自然流量")}
                  </div>
                  <Progress
                    percent={parseFloat(item.organicPercent)}
                    showInfo={false}
                    strokeColor={{
                      "0%": item.gradientFrom,
                      "100%": item.gradientTo,
                    }}
                    trailColor="#e5e7eb"
                    size="small"
                  />
                  <p className={styles.trafficInsight}>{item.insight}</p>
                </div>
              ))}
            </div>
          </Card>

          {/* Top Keywords Table */}
          <Card bordered={false} bodyStyle={{ padding: 0 }}>
            <div className={styles.tableHeaderBar}>
              {t("sellerTools.copywriting.topKeywords", "Top关键词分析")}
            </div>
            <div style={{ overflowX: "auto" }}>
              <table className={styles.keywordsTable}>
                <thead>
                  <tr>
                    <th>{t("sellerTools.copywriting.colKeyword", "关键词")}</th>
                    <th>{t("sellerTools.copywriting.colWeeklyExposure", "周曝光量")}</th>
                    <th>{t("sellerTools.copywriting.colMonthlySearch", "月搜索量")}</th>
                    <th>{t("sellerTools.copywriting.colOrganicTraffic", "自然流量占比")}</th>
                    <th>{t("sellerTools.copywriting.colConvRate", "转化率")}</th>
                    <th>PPC ($)</th>
                    <th>{t("sellerTools.copywriting.colTags", "标签")}</th>
                    <th>{t("sellerTools.copywriting.colInsight", "洞察")}</th>
                  </tr>
                </thead>
                <tbody>
                  {topKeywords.map((row: KeywordRow, i) => (
                    <tr key={i}>
                      <td className={styles.keywordCell}>{row.keyword}</td>
                      <td>{row.weeklyExposure}</td>
                      <td>{row.monthlySearch}</td>
                      <td>{row.organicTraffic}%</td>
                      <td>{row.convRate}</td>
                      <td>{row.ppc}</td>
                      <td>
                        <div className={styles.tagCell}>
                          {row.tags.map((tg, j) => (
                            <Tag
                              key={j}
                              color={antTagColor[tg.color] ?? "default"}
                            >
                              {tg.label}
                            </Tag>
                          ))}
                        </div>
                      </td>
                      <td className={styles.insightCell}>{row.insight}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </section>
      </main>
    </div>
  );
}
