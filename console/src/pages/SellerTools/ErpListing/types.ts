export interface ListingItem {
  id: string;
  imageColor: string;
  imageSvg: "layers" | "grid" | "circle";
  msku: string;
  fnsku: string;
  status: "在售" | "停售" | "调价中";
  asin: string;
  title: string;
  tags: { label: string; color: string }[];
  store: string;
  country: string;
  price: number;
  adjustingPrice?: number;
  fbaStock: number;
}

export interface TabItem {
  label: string;
  active?: boolean;
}
