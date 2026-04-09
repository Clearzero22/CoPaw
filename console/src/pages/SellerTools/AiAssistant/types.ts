export interface ToolItem {
  title: string;
  desc: string;
  icon: string;
}

export interface ToolCategory {
  name: string;
  icon: string;
  colorClass: string;
  colorDarkClass: string;
  items: ToolItem[];
}

export interface PromptCard {
  desc: string;
  title: string;
  tag: string;
}

export interface ToolTag {
  label: string;
  short: string;
  colorClass: string;
  colorDarkClass: string;
}

export const toolCategories: ToolCategory[] = [
  {
    name: "Keepa",
    icon: "K",
    colorClass: "toolCatKeepa",
    colorDarkClass: "toolCatKeepaDark",
    items: [
      { title: "Keepa-亚马逊-商品搜索", desc: "选品筛选、条件过滤", icon: "K" },
      { title: "Keepa-亚马逊-商品详情", desc: "商品详情，一键获取", icon: "K" },
      { title: "Keepa-亚马逊价格历史", desc: "定价策略、价格历史记录", icon: "K" },
    ],
  },
  {
    name: "亚马逊前台",
    icon: "亚",
    colorClass: "toolCatAmazon",
    colorDarkClass: "toolCatAmazonDark",
    items: [
      { title: "亚马逊前端搜索模拟", desc: "全链覆盖、极速获取", icon: "亚" },
      { title: "亚马逊前端-商品详情", desc: "获取五点 附图 A+", icon: "亚" },
      { title: "亚马逊-商品评论", desc: "获取评论、洞察优缺", icon: "亚" },
    ],
  },
  {
    name: "Sif数据分析工具",
    icon: "S",
    colorClass: "toolCatSif",
    colorDarkClass: "toolCatSifDark",
    items: [
      { title: "Sif-流量词挖掘", desc: "反查流量词、精准定位", icon: "S" },
      { title: "Sif-关键词排名", desc: "实时监控、排名追踪", icon: "S" },
    ],
  },
  {
    name: "卖家精灵",
    icon: "卖",
    colorClass: "toolCatSellerSprite",
    colorDarkClass: "toolCatSellerSpriteDark",
    items: [
      { title: "卖家精灵-选产品", desc: "大数据选品、精准筛选", icon: "卖" },
      { title: "卖家精灵-选市场", desc: "市场分析、竞争度评估", icon: "卖" },
    ],
  },
  {
    name: "极目系列",
    icon: "极",
    colorClass: "toolCatJimu",
    colorDarkClass: "toolCatJimuDark",
    items: [
      { title: "极目-关键词挖掘", desc: "深度挖掘、流量分析", icon: "极" },
    ],
  },
  {
    name: "谷歌趋势",
    icon: "谷",
    colorClass: "toolCatGoogle",
    colorDarkClass: "toolCatGoogleDark",
    items: [
      { title: "谷歌趋势分析", desc: "趋势洞察、热度对比", icon: "谷" },
    ],
  },
  {
    name: "店雷达(1688)",
    icon: "店",
    colorClass: "toolCatStoreRadar",
    colorDarkClass: "toolCatStoreRadarDark",
    items: [
      { title: "店雷达-货源分析", desc: "1688货源、价格监控", icon: "店" },
    ],
  },
  {
    name: "实时与全网检索",
    icon: "实",
    colorClass: "toolCatRealtime",
    colorDarkClass: "toolCatRealtimeDark",
    items: [
      { title: "全网实时检索", desc: "实时信息、全网覆盖", icon: "实" },
    ],
  },
];

export const promptCards: PromptCard[] = [
  {
    desc: "给一组竞品ASIN，一句话描述，AI给你一个符合Cosmo算法和BAF法则的高质量的商品标题与五点描述。",
    title: "一键生成数据驱动的高质量Listing",
    tag: "亚马逊运营-商品详情；SIF-查询ASIN的关键词",
  },
  {
    desc: '模拟美国站前台搜索，通过类目经理视角对TOP商品进行"模型/版型/工艺"三维打标，可视化呈现不同属性的销量占比，精准锁定市场主流爆款的产品形态组合。',
    title: "属性标签化分析与市场画像",
    tag: "@亚马逊前台搜索模拟",
  },
  {
    desc: '批量扫描多个热门品类首页数据，通过"高销量、少评论、高评分、FBA配送"等严苛过滤算法，快速定位竞争压力小、市场认可度高的潜质商品，实现高效测品与选品决策。',
    title: '多品类"高销低评"蓝海商品自动化检索',
    tag: "@亚马逊前台搜索模拟",
  },
  {
    desc: "结合ABA数据挖掘能力，精确锁定特定关键词（如crochet bag）的搜索频次排名变化。通过近16周的流量波动曲线，研判类目的季节性爆发规律与市场热度走向，辅助提前布局库存与广告策略。",
    title: "ABA关键词流量周期分析",
    tag: "@ABA-数据挖掘",
  },
];

export const toolTags: ToolTag[] = [
  { label: "应用场景", short: "应", colorClass: "tagBlue", colorDarkClass: "tagBlueDark" },
  { label: "Keepa", short: "K", colorClass: "tagOrange", colorDarkClass: "tagOrangeDark" },
  { label: "亚马逊前台", short: "亚", colorClass: "tagYellow", colorDarkClass: "tagYellowDark" },
  { label: "Sif数据分析工具", short: "S", colorClass: "tagGreen", colorDarkClass: "tagGreenDark" },
  { label: "卖家精灵", short: "卖", colorClass: "tagYellow", colorDarkClass: "tagYellowDark" },
  { label: "实时与全网检索", short: "实", colorClass: "tagBlue", colorDarkClass: "tagBlueDark" },
  { label: "谷歌趋势", short: "谷", colorClass: "tagRed", colorDarkClass: "tagRedDark" },
  { label: "店雷达(1688)", short: "店", colorClass: "tagGreen", colorDarkClass: "tagGreenDark" },
  { label: "TikTok电商数据助手", short: "T", colorClass: "tagGray", colorDarkClass: "tagGrayDark" },
  { label: "极目系列", short: "极", colorClass: "tagYellow", colorDarkClass: "tagYellowDark" },
  { label: "Walmart前台", short: "W", colorClass: "tagBlue", colorDarkClass: "tagBlueDark" },
  { label: "eBay前台", short: "e", colorClass: "tagDark", colorDarkClass: "tagDarkDark" },
  { label: "专利检索", short: "专", colorClass: "tagBlue", colorDarkClass: "tagBlueDark" },
];
