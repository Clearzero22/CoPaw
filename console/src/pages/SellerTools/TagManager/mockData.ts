export interface TagItem {
  label: string;
  color: string;
}

export interface ListingRow {
  id: string;
  image: boolean;
  msku: string;
  status: "active" | "inactive";
  statusText: string;
  asin: string;
  title: string;
  price: number;
  fbaStock: number;
  estimatedFbaFee: number;
}

export const tagOptions: TagItem[] = [
  { label: "利润款", color: "blue" },
  { label: "hhh", color: "green" },
  { label: "使用api创建241218", color: "default" },
  { label: "使用api创建241216", color: "default" },
  { label: "未采购", color: "green" },
  { label: "mwj标签", color: "blue" },
  { label: "胡", color: "green" },
  { label: "绿色", color: "green" },
];

export const listingRows: ListingRow[] = [
  {
    id: "1",
    image: true,
    msku: "HOLD...",
    status: "active",
    statusText: "在售",
    asin: "B0BB3...",
    title: "NP Phone Holder",
    price: 5.01,
    fbaStock: 207,
    estimatedFbaFee: 3.22,
  },
  {
    id: "2",
    image: true,
    msku: "QG-W...",
    status: "active",
    statusText: "在售",
    asin: "B07DFK...",
    title: "Xenstar Swim Goggles, No...",
    price: 2.36,
    fbaStock: 0,
    estimatedFbaFee: 3.07,
  },
  {
    id: "3",
    image: true,
    msku: "Hair-Ti...",
    status: "active",
    statusText: "在售",
    asin: "B0B4W...",
    title: "Heart Pearl Black Elastic Hai...",
    price: 11.1,
    fbaStock: 0,
    estimatedFbaFee: 0.0,
  },
  {
    id: "4",
    image: true,
    msku: "Pink_...",
    status: "active",
    statusText: "在售",
    asin: "B09MT...",
    title: "Love Pearl Bottom Hair Circl...",
    price: 2.0,
    fbaStock: 0,
    estimatedFbaFee: 2.47,
  },
  {
    id: "5",
    image: true,
    msku: "G-202...",
    status: "active",
    statusText: "在售",
    asin: "B0D7C...",
    title: "1",
    price: 0.0,
    fbaStock: 0,
    estimatedFbaFee: 0.0,
  },
];

export const subTabs = ["SC", "VC", "字体", "父体"] as const;

export const filterButtons = [
  "全部国家",
  "全部店铺",
  "在售",
  "配对状态",
  "配送方式",
  "Listing标签",
] as const;

