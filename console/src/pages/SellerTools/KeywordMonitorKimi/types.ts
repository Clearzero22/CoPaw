export interface AsinItem {
  id: string;
  name: string;
  keywordCount: number;
  status: "active" | "warning";
}

export interface KeywordRow {
  key: string;
  word: string;
  type: string;
  zip: string;
  city: string;
  naturalRank: number;
  naturalChange: number;
  adRank: string;
  spRank: string;
  trend: number[];
}

export const asinData: AsinItem[] = [
  { id: "B0DZH2GFHB", name: "Keyword: Easter Basket", keywordCount: 1, status: "active" },
  { id: "B0CP2JKIK4", name: "Keyword: Easter Basket", keywordCount: 1, status: "active" },
  { id: "B0DRCWXQ7Y", name: "Keyword: Easter Basket", keywordCount: 2, status: "warning" },
  { id: "B0D5C2DTV2", name: "Keyword: Easter Basket", keywordCount: 2, status: "active" },
  { id: "B0DW3V2WC7", name: "Keyword: Easter Basket", keywordCount: 2, status: "active" },
  { id: "B0C92VNKX4", name: "Keyword: Easter Basket", keywordCount: 2, status: "active" },
  { id: "B0D00BHFD", name: "Keyword: Easter Basket", keywordCount: 2, status: "active" },
  { id: "B01N22CM3F", name: "Keyword: Easter Basket", keywordCount: 2, status: "active" },
];

export const keywordData: KeywordRow[] = [
  { key: "1", word: "easter basket", type: "AC", zip: "89030", city: "North Las Vegas", naturalRank: 1, naturalChange: 0, adRank: "-", spRank: "Not in top 50", trend: [1, 1, 2, 1, 1, 1, 1] },
  { key: "2", word: "easter basket", type: "AC", zip: "89109", city: "Paradise", naturalRank: 2, naturalChange: -1, adRank: "-", spRank: "Not in top 50", trend: [1, 2, 2, 3, 2, 2, 2] },
  { key: "3", word: "easter basket", type: "", zip: "20303", city: "Spartanburg", naturalRank: 2, naturalChange: 0, adRank: "-", spRank: "Not in top 50", trend: [2, 2, 2, 2, 2, 2, 2] },
  { key: "4", word: "easter basket", type: "", zip: "29172", city: "West Columbia", naturalRank: 2, naturalChange: 0, adRank: "-", spRank: "Not in top 50", trend: [3, 2, 2, 2, 2, 2, 2] },
  { key: "5", word: "easter basket", type: "AC", zip: "77038", city: "Houston", naturalRank: 1, naturalChange: 0, adRank: "-", spRank: "Not in top 50", trend: [1, 1, 1, 1, 1, 1, 1] },
  { key: "6", word: "easter basket", type: "AC", zip: "77003", city: "Houston", naturalRank: 1, naturalChange: 0, adRank: "-", spRank: "Not in top 50", trend: [1, 1, 1, 2, 1, 1, 1] },
  { key: "7", word: "easter basket", type: "AC", zip: "77001", city: "Houston", naturalRank: 1, naturalChange: 0, adRank: "Not in top 5", spRank: "Not in top 50", trend: [1, 1, 1, 1, 1, 1, 1] },
  { key: "8", word: "easter basket", type: "AC", zip: "75241", city: "Dallas", naturalRank: 1, naturalChange: 0, adRank: "-", spRank: "Not in top 50", trend: [1, 1, 2, 1, 1, 1, 1] },
  { key: "9", word: "easter basket", type: "AC", zip: "76132", city: "Fort Worth", naturalRank: 1, naturalChange: 0, adRank: "-", spRank: "Not in top 50", trend: [1, 1, 1, 1, 2, 1, 1] },
];
