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
  gradientFrom: string;
  gradientTo: string;
}

export const marketData: MarketRow[] = [
  { rank: 1, keyword: "pokopia", weekRank: 683, lastWeekRank: 12051, change: 11368 },
  { rank: 2, keyword: "pokopia switch 2", weekRank: 1087, lastWeekRank: 14067, change: 12980 },
  { rank: 3, keyword: "siren's kiss", weekRank: 1771, lastWeekRank: 78926, change: 77155 },
  { rank: 4, keyword: "in her own league liz tomforde", weekRank: 4008, lastWeekRank: 48163, change: 44155 },
  { rank: 5, keyword: "leprechaun trap kit", weekRank: 4018, lastWeekRank: 18887, change: 14869 },
  { rank: 6, keyword: "funny st patricks day shirt", weekRank: 4463, lastWeekRank: 14653, change: 10190 },
  { rank: 7, keyword: "scarpetta series on prime video", weekRank: 5663, lastWeekRank: 21011, change: 15348 },
  { rank: 8, keyword: "st pattys shirt women", weekRank: 6992, lastWeekRank: 20124, change: 13132 },
  { rank: 9, keyword: "mens st patricks day shirt", weekRank: 7131, lastWeekRank: 20525, change: 13394 },
  { rank: 10, keyword: "saint patricks day accessories", weekRank: 7334, lastWeekRank: 18260, change: 10926 },
];

export const courses: Course[] = [
  { title: "\u3010\u8FBE\u4EBA\u8BFE\u5802\u3011\u7B2C\u516D\u671F \u4E0D\u540C\u9884\u7B97\u4E0B\u7684\u4E9A\u9A6C\u900A\u9009\u54C1\u6A21\u5F0F", time: "2026-03-18 15:00", teacher: "\u53F6\u5F00", desc: "1. \u53F6\u5F00\u5B66\u957F\u767D\u76AE\u4E66; 2. \u7D2F\u8BA1\u5199\u4F5C\u4E9A\u9A6C\u900A\u76F8\u5173\u5185\u5BB9\u8D85110\u4E07\u5B57; 3. \u65E5\u9500200\u5355\u7206...", gradientFrom: "#3b82f6", gradientTo: "#93c5fd" },
  { title: "\u3010\u5927\u5496\u8BFE\u5802\u3011\u5E97\u94FA\u540E\u53F0\u6570\u636E\u6BD4\u5BF9\uFF1A\u5982\u4F55\u5728\u89C4\u5219\u5185\u7701\u94B1\uFF0C\u5728\u6570\u636E\u91CC\u627E...", time: "2026-03-18 19:30", teacher: "Tina", desc: "\u8DE8\u5883\u4EBF\u7EA7\u5927\u5356\u5BB6\u8D22\u52A1\u603B\u76D1 \u4E0A\u6D77\u8D22\u7ECF\u5927\u5B66\u4F1A\u8BA1\u5B66\u7855\u58EB \u7F8E\u56FD\u6CE8\u518C\u7BA1\u7406\u4F1A\u8BA1\u5E08CMA \u64CD...", gradientFrom: "#1f2937", gradientTo: "#374151" },
  { title: "\u3010\u5B9E\u6218\u8BFE\u5802\u30112026\u5E74\u51FA\u6D77\u5356\u5BB6\u751F\u5B58\u8D8B\u52BF\u53D8\u5316", time: "2026-03-19 19:30", teacher: "\u4F1F\u54E5", desc: "\u6DF1\u8015\u8DE8\u5883\u7535\u5546\u591A\u5E74...", gradientFrom: "#44403c", gradientTo: "#57534e" },
];

export const quickAccessItems = [
  { icon: "package" as const, labelKey: "quickAccessProductSelection" },
  { icon: "search" as const, labelKey: "quickAccessKeywordMining" },
  { icon: "cornerDownLeft" as const, labelKey: "quickAccessKeywordReverse" },
  { icon: "eye" as const, labelKey: "quickAccessProductMonitor" },
];

export const searchTabs = ["查竞品", "关键词挖掘", "关键词反查", "选市场"];
export const courseTabs = ["全部", "正在直播", "即将开始", "直播结束"];
