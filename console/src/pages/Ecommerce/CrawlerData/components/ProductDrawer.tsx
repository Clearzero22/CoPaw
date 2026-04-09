import { Drawer, Button } from "@agentscope-ai/design";
import { Space, Descriptions, Tag } from "antd";
import { useTranslation } from "react-i18next";
import type { CrawlerProduct } from "../../../../api/types";

interface ProductDrawerProps {
  open: boolean;
  product: CrawlerProduct | null;
  onClose: () => void;
  onGenerate: (asin: string) => Promise<boolean | undefined>;
}

export function ProductDrawer({
  open,
  product,
  onClose,
  onGenerate,
}: ProductDrawerProps) {
  const { t } = useTranslation();

  if (!product) return null;

  const images = product.all_images || [];

  return (
    <Drawer
      open={open}
      onClose={onClose}
      width={640}
      destroyOnClose
      title={product.asin}
      footer={
        <Space>
          <Button onClick={onClose}>
            {t("ecommerce.crawlerData.close")}
          </Button>
          <Button
            type="primary"
            onClick={async () => {
              const ok = await onGenerate(product.asin);
              if (ok) onClose();
            }}
          >
            {t("ecommerce.crawlerData.generateBtn")}
          </Button>
        </Space>
      }
    >
      {/* Images */}
      {images.length > 0 && (
        <div style={{ marginBottom: 16 }}>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            {images.slice(0, 6).map((url, i) => (
              <img
                key={i}
                src={url}
                alt={product.title || product.asin}
                style={{
                  width: 80,
                  height: 80,
                  objectFit: "cover",
                  borderRadius: 4,
                  border: i === 0 ? "2px solid #615ced" : "1px solid #eee",
                }}
              />
            ))}
          </div>
        </div>
      )}

      <Descriptions column={1} bordered size="small" title={t("ecommerce.crawlerData.basicInfo")}>
        <Descriptions.Item label="ASIN">{product.asin}</Descriptions.Item>
        <Descriptions.Item label={t("ecommerce.crawlerData.colTitle")}>
          {product.full_title || product.title}
        </Descriptions.Item>
        <Descriptions.Item label={t("ecommerce.crawlerData.colBrand")}>
          {product.brand || "-"}
        </Descriptions.Item>
        <Descriptions.Item label={t("ecommerce.crawlerData.colPrice")}>
          {product.price || "-"}
          {product.original_price && (
            <span style={{ textDecoration: "line-through", color: "#999", marginLeft: 8 }}>
              {product.original_price}
            </span>
          )}
        </Descriptions.Item>
        <Descriptions.Item label={t("ecommerce.crawlerData.colRating")}>
          {product.rating || "-"} / {product.review_count || "0"} reviews
        </Descriptions.Item>
        <Descriptions.Item label={t("ecommerce.crawlerData.colPrime")}>
          <Tag color={product.is_prime === "Yes" ? "green" : "default"}>
            {product.is_prime || "No"}
          </Tag>
        </Descriptions.Item>
        <Descriptions.Item label={t("ecommerce.crawlerData.colDetailStatus")}>
          <Tag color={product.detail_scraped ? "green" : "orange"}>
            {product.detail_scraped
              ? t("ecommerce.crawlerData.statusScraped")
              : t("ecommerce.crawlerData.statusNotScraped")}
          </Tag>
        </Descriptions.Item>
        <Descriptions.Item label={t("ecommerce.crawlerData.colScrapedAt")}>
          {product.scraped_at ? new Date(product.scraped_at).toLocaleString() : "-"}
        </Descriptions.Item>
      </Descriptions>

      {product.detail_scraped && (
        <>
          <Descriptions column={1} bordered size="small" title={t("ecommerce.crawlerData.detailInfo")} style={{ marginTop: 16 }}>
            {product.subtitle && (
              <Descriptions.Item label={t("ecommerce.crawlerData.colSubtitle")}>{product.subtitle}</Descriptions.Item>
            )}
            <Descriptions.Item label={t("ecommerce.crawlerData.colDescription")}>
              <div style={{ maxHeight: 200, overflow: "auto" }}>
                {product.product_description || "-"}
              </div>
            </Descriptions.Item>
            <Descriptions.Item label={t("ecommerce.crawlerData.colBulletPoints")}>
              <ul style={{ margin: 0, paddingLeft: 20 }}>
                {(product.about_this_item || []).map((bp, i) => (
                  <li key={i}>{bp}</li>
                ))}
              </ul>
            </Descriptions.Item>
            <Descriptions.Item label={t("ecommerce.crawlerData.colStock")}>
              {product.stock_status || "-"}
            </Descriptions.Item>
            <Descriptions.Item label={t("ecommerce.crawlerData.colSeller")}>
              {product.sold_by || "-"}
            </Descriptions.Item>
            <Descriptions.Item label={t("ecommerce.crawlerData.colManufacturer")}>
              {product.manufacturer || "-"}
            </Descriptions.Item>
          </Descriptions>

          {product.best_sellers_rank && (
            <Descriptions column={1} bordered size="small" title="BSR" style={{ marginTop: 16 }}>
              <Descriptions.Item label="Rank">
                {JSON.stringify(product.best_sellers_rank)}
              </Descriptions.Item>
            </Descriptions>
          )}
        </>
      )}
    </Drawer>
  );
}
