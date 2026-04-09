export interface AsinItem {
  asin: string;
  country: string;
  count: number;
  flag: string;
  ac?: boolean;
}

export interface TableRow {
  keyword: string;
  zip: string;
  zipCity: string;
  rank1: string;
  rank1Sub: string;
  adRank: string;
  sbv: string;
  trend: "flat" | "down-up" | "down-flat";
  mRank: string;
  mRankSub: string;
  mAdRank: string;
  mTrend?: "flat" | "down-up" | "down-flat";
}

export const asinListData: AsinItem[] = [
  { asin: "B0D2HZGFHB", country: "波兰", count: 1, flag: "pl" },
  { asin: "B0BP2JKK4", country: "法国", count: 1, flag: "fr" },
  { asin: "B0DRCWXQ7Y", country: "西班牙", count: 2, flag: "es" },
  { asin: "B0D5C2DTV2", country: "加拿大", count: 2, flag: "ca" },
  { asin: "B0DW3V2WC7", country: "阿联酋", count: 2, flag: "ae" },
  { asin: "B0CR82VNX4", country: "德国", count: 2, flag: "de" },
  { asin: "B0006IFHD", country: "英国", count: 2, flag: "gb", ac: true },
  { asin: "B0006IFI3", country: "美国", count: 2, flag: "us" },
  { asin: "B01N22CM3F", country: "美国", count: 1, flag: "us", ac: true },
];

export const tableData: TableRow[] = [
  {
    keyword: "easter basket",
    zip: "89030",
    zipCity: "North Las Vegas",
    rank1: "1",
    rank1Sub: "第1页第1名",
    adRank: "-",
    sbv: "未进前5页",
    trend: "flat",
    mRank: "1",
    mRankSub: "第1页第1名",
    mAdRank: "-",
  },
  {
    keyword: "easter basket",
    zip: "89408",
    zipCity: "Fernley",
    rank1: "2",
    rank1Sub: "第1页第2名",
    adRank: "-",
    sbv: "未进前5页",
    trend: "flat",
    mRank: "2",
    mRankSub: "第1页第2名",
    mAdRank: "-",
  },
  {
    keyword: "easter basket",
    zip: "29303",
    zipCity: "Spartanburg",
    rank1: "2",
    rank1Sub: "第1页第2名",
    adRank: "-",
    sbv: "未进前5页",
    trend: "flat",
    mRank: "2",
    mRankSub: "第1页第2名",
    mAdRank: "-",
  },
  {
    keyword: "easter basket",
    zip: "29172",
    zipCity: "West Columbia",
    rank1: "2",
    rank1Sub: "第1页第2名",
    adRank: "-",
    sbv: "未进前5页",
    trend: "down-up",
    mRank: "2",
    mRankSub: "第1页第2名",
    mAdRank: "-",
    mTrend: "down-up",
  },
  {
    keyword: "easter basket",
    zip: "77038",
    zipCity: "Houston",
    rank1: "1",
    rank1Sub: "第1页第1名",
    adRank: "-",
    sbv: "未进前5页",
    trend: "down-flat",
    mRank: "1",
    mRankSub: "第1页第1名",
    mAdRank: "-",
  },
  {
    keyword: "easter basket",
    zip: "77003",
    zipCity: "Houston",
    rank1: "1",
    rank1Sub: "第1页第1名",
    adRank: "-",
    sbv: "未进前5页",
    trend: "down-flat",
    mRank: "1",
    mRankSub: "第1页第1名",
    mAdRank: "-",
  },
  {
    keyword: "easter basket",
    zip: "77001",
    zipCity: "Houston",
    rank1: "1",
    rank1Sub: "第1页第1名",
    adRank: "-",
    sbv: "未进前5页",
    trend: "flat",
    mRank: "1",
    mRankSub: "第1页第1名",
    mAdRank: "-",
  },
  {
    keyword: "easter basket",
    zip: "75241",
    zipCity: "Dallas",
    rank1: "1",
    rank1Sub: "第1页第1名",
    adRank: "-",
    sbv: "未进前5页",
    trend: "down-flat",
    mRank: "1",
    mRankSub: "第1页第1名",
    mAdRank: "-",
  },
  {
    keyword: "easter basket",
    zip: "76155",
    zipCity: "Fort Worth",
    rank1: "1",
    rank1Sub: "第1页第1名",
    adRank: "-",
    sbv: "未进前5页",
    trend: "flat",
    mRank: "1",
    mRankSub: "第1页第1名",
    mAdRank: "-",
  },
];
