export interface HistoryItem {
  asin: string;
  title: string;
}

export interface ToolLink {
  label: string;
  tags?: ("ai" | "new" | "free" | "auto")[];
}

export interface ToolGroup {
  title: string;
  items: ToolLink[];
}

export const historyItems: HistoryItem[] = [
  {
    asin: "B00MA2T9BC",
    title:
      "Pet Zone Semi - Self Cleaning Semi Automatic Cat Litter Box - Smart Scoop Cat Litter Box with 6 Bags & Carbon Filter for Up to Two Cats 6-16 Pounds",
  },
  {
    asin: "B0F8VDW638",
    title:
      "Timekettle W4 Pro AI Interpreter Earbuds, Real-Time Bidirectional Voice Translation,40+ Languages, Video and Call Translation,for Global Business, Compatible ...",
  },
  {
    asin: "B0D8HRYWDG",
    title:
      "Men's Wide Brim Solar Fan Outdoor Fishing Hat in Grey - includes 2 Solar Fans, Medium, Black",
  },
];

export const toolColumns: ToolGroup[][] = [
  [
    {
      title: "大数据选品",
      items: [
        { label: "查竞品", tags: ["ai"] },
        { label: "选产品", tags: ["ai"] },
        { label: "选市场", tags: ["ai"] },
        { label: "关键词选品" },
        { label: "ABA数据选品" },
        { label: "外观专利" },
        { label: "全球商标库" },
        { label: "产品库" },
      ],
    },
    {
      title: "关键词优化",
      items: [
        { label: "关键词挖掘" },
        { label: "关键词反查" },
        { label: "流量词对比" },
        { label: "拓展流量词" },
        { label: "关键词转化率", tags: ["new"] },
        { label: "实时查竞价", tags: ["new"] },
        { label: "关键词收录", tags: ["free"] },
        { label: "关键词词库" },
      ],
    },
  ],
  [
    {
      title: "运营推广",
      items: [
        { label: "广告洞察" },
        { label: "查流量来源" },
        { label: "关联流量" },
        { label: "出单词反查" },
        { label: "评论分析" },
        { label: "产品监控" },
        { label: "关键词监控" },
        { label: "店铺上新监控" },
      ],
    },
    {
      title: "免费工具",
      items: [
        { label: "Listing生成器" },
        { label: "销量预测" },
        { label: "利润计算器" },
        { label: "折后价计算器" },
        { label: "Google Trends" },
        { label: "链接生成器" },
        { label: "站外红人推广" },
        { label: "批量下载图片" },
      ],
    },
  ],
  [
    {
      title: "经营助手",
      items: [
        { label: "经营看板" },
        { label: "商品分析" },
        { label: "订单列表" },
        { label: "库存分析" },
        { label: "索赔助手" },
        { label: "跟卖监控" },
        { label: "自动邀评" },
        { label: "广告投放", tags: ["auto"] },
      ],
    },
    {
      title: "3D展示",
      items: [{ label: "3D建模" }, { label: "3D渲染" }],
    },
  ],
  [
    {
      title: "浏览器插件 (v5.0.1)",
      items: [
        { label: "销量查询" },
        { label: "评论分析" },
        { label: "市场分析" },
        { label: "关键词挖掘" },
        { label: "关键词反查" },
        { label: "关键词收录", tags: ["free"] },
        { label: "Keepa插件替代", tags: ["ai", "free"] },
        { label: "快速预览", tags: ["free"] },
        { label: "品牌检测" },
        { label: "批量邀评", tags: ["free"] },
        { label: "评论下载", tags: ["free"] },
      ],
    },
  ],
  [
    {
      title: "手机看店",
      items: [
        { label: "实时销售看板" },
        { label: "广告随时调整" },
        { label: "随时监控产品" },
        { label: "每日业绩通知" },
      ],
    },
  ],
];
