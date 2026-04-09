import type { ListingItem } from "./types";

export const listingData: ListingItem[] = [
  {
    id: "1",
    imageColor: "#f59e0b",
    imageSvg: "layers",
    msku: "M-6Qifu2L-U",
    fnsku: "X001fuF5-U",
    status: "在售",
    asin: "Bu18fuML-U",
    title: "AsinKing, Amazon management system, to help you...",
    tags: [
      { label: "负责人-王", color: "green" },
      { label: "test111", color: "default" },
    ],
    store: "AK-HY-US",
    country: "美国",
    price: 5.01,
    fbaStock: 207,
  },
  {
    id: "2",
    imageColor: "#ef4444",
    imageSvg: "grid",
    msku: "M-eFhfuVQ-U",
    fnsku: "X001fuJE-U",
    status: "在售",
    asin: "BYRwfu4U...",
    title: "AsinKing测试数据 AK003",
    tags: [
      { label: "XXX品类", color: "blue" },
    ],
    store: "AK-HY-US",
    country: "美国",
    price: 2.36,
    adjustingPrice: 3.0,
    fbaStock: 0,
  },
  {
    id: "3",
    imageColor: "#10b981",
    imageSvg: "circle",
    msku: "M-Yq3fuV1-U",
    fnsku: "X001fuNR-U",
    status: "在售",
    asin: "BgUDfu6K...",
    title: "ZWLING ZL596S 台式宽屏显示器...",
    tags: [
      { label: "高质量产品", color: "purple" },
    ],
    store: "AK-UB-US",
    country: "美国",
    price: 11.1,
    fbaStock: 0,
  },
];

export const subTabs = ["SC", "VC", "子体", "父体"];
