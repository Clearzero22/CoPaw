export interface MarketRow {
  rank: number;
  keyword: string;
  translation?: string;
  weekRank: number;
  lastWeekRank: number;
  change: number;
}

export interface Course {
  title: string;
  time: string;
  teacher: string;
  desc: string;
  color: string;
}

export interface QuickAccessItem {
  icon: "package" | "search" | "corner-down-left" | "eye";
  label: string;
}

export const marketData: MarketRow[] = [
  { rank: 1, keyword: "pokopia", weekRank: 683, lastWeekRank: 12051, change: 11368 },
  { rank: 2, keyword: "pokopia switch 2", weekRank: 1087, lastWeekRank: 14067, change: 12980 },
  { rank: 3, keyword: "siren's kiss", weekRank: 1771, lastWeekRank: 78926, change: 77155 },
  { rank: 4, keyword: "in her own league liz tomforde", translation: "liz tomforde 的《她自成一派》", weekRank: 4008, lastWeekRank: 48163, change: 44155 },
  { rank: 5, keyword: "leprechaun trap kit", translation: "妖精陷阱套件", weekRank: 4018, lastWeekRank: 18887, change: 14869 },
  { rank: 6, keyword: "funny st patricks day shirt", translation: "有趣的圣帕特里克节衬衫", weekRank: 4463, lastWeekRank: 14653, change: 10190 },
  { rank: 7, keyword: "scarpetta series on prime video", translation: "Prime Video上的斯卡佩塔系列", weekRank: 5663, lastWeekRank: 21011, change: 15348 },
  { rank: 8, keyword: "st pattys shirt women", translation: "st pattys 衬衫 女士", weekRank: 6992, lastWeekRank: 20124, change: 13132 },
  { rank: 9, keyword: "mens st patricks day shirt", translation: "男士圣帕特里克节衬衫", weekRank: 7131, lastWeekRank: 20525, change: 13394 },
  { rank: 10, keyword: "saint patricks day accessories", translation: "圣帕特里克节配饰", weekRank: 7334, lastWeekRank: 18260, change: 10926 },
];

export const courses: Course[] = [
  {
    title: "【达人课堂】第六期 不同预算下的亚马逊选品模式",
    time: "2026-03-18 15:00",
    teacher: "叶开",
    desc: "1. 叶开学长白皮书; 2. 累计写作亚马逊相关内容超110万字; 3. 日销200单爆...",
    color: "linear-gradient(135deg, #3b82f6, #93c5fd)",
  },
  {
    title: "【大咖课堂】店铺后台数据比对：如何在规则内省钱，在数据里找...",
    time: "2026-03-18 19:30",
    teacher: "Tina",
    desc: "跨境亿级大卖家财务总监 上海财经大学会计学硕士 美国注册管理会计师CMA 操...",
    color: "#1f2937",
  },
  {
    title: "【实战课堂】2026年出海卖家生存趋势变化",
    time: "2026-03-19 19:30",
    teacher: "伟哥",
    desc: "深耕跨境电商多年...",
    color: "#44403c",
  },
];

export const quickAccessItems: QuickAccessItem[] = [
  { icon: "package", label: "选产品" },
  { icon: "search", label: "关键词挖掘" },
  { icon: "corner-down-left", label: "关键词反查" },
  { icon: "eye", label: "产品监控" },
];

export const searchTabs = ["查竞品", "关键词挖掘", "关键词反查", "选市场"];
export const courseTabs = ["全部", "正在直播", "即将开始", "直播结束"];
export const marketplaceOptions = [
  { value: "us", label: "US 美国站" },
  { value: "uk", label: "UK 英国站" },
  { value: "de", label: "DE 德国站" },
  { value: "jp", label: "JP 日本站" },
  { value: "ca", label: "CA 加拿大站" },
  { value: "fr", label: "FR 法国站" },
  { value: "it", label: "IT 意大利站" },
  { value: "es", label: "ES 西班牙站" },
];
export const timeRangeOptions = [
  { value: "7d", label: "最近7天" },
  { value: "30d", label: "最近30天" },
  { value: "90d", label: "最近90天" },
  { value: "180d", label: "最近180天" },
];
export const exampleAsins = ["B0CT9R7WN5", "B08QRFZ6TH", "B07S18RBH2"];
