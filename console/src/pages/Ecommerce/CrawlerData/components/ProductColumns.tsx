import { Tag, Button } from "@agentscope-ai/design";
import { Space, message } from "antd";
import { Eye, Sparkles, Image as ImageIcon } from "lucide-react";
import type { CrawlerProduct } from "../../../../api/types";

interface ProductColumnsProps {
  onGenerate: (asin: string) => Promise<boolean | undefined>;
  onViewDetail: (record: CrawlerProduct) => void;
  t: (key: string) => string;
}

export function createProductColumns({
  onGenerate,
  onViewDetail,
  t,
}: ProductColumnsProps) {
  return [
    {
      title: t("ecommerce.crawlerData.colAsin"),
      dataIndex: "asin",
      key: "asin",
      width: 120,
      render: (asin: string, record: CrawlerProduct) => (
        <a
          href={record.product_url || `https://www.amazon.com/dp/${asin}`}
          target="_blank"
          rel="noopener noreferrer"
        >
          {asin}
        </a>
      ),
    },
    {
      title: t("ecommerce.crawlerData.colImage"),
      dataIndex: "image_url",
      key: "image_url",
      width: 60,
      render: (url: string | null, record: CrawlerProduct) =>
        url ? (
          <img
            src={url}
            alt={record.title || record.asin || ""}
            style={{ width: 40, height: 40, objectFit: "cover", borderRadius: 4 }}
          />
        ) : (
          <ImageIcon size={20} style={{ color: "#ccc" }} />
        ),
    },
    {
      title: t("ecommerce.crawlerData.colTitle"),
      dataIndex: "full_title",
      key: "full_title",
      ellipsis: true,
      render: (fullTitle: string | null, record: CrawlerProduct) =>
        fullTitle || record.title || "",
    },
    {
      title: t("ecommerce.crawlerData.colBrand"),
      dataIndex: "brand",
      key: "brand",
      width: 100,
      ellipsis: true,
    },
    {
      title: t("ecommerce.crawlerData.colPrice"),
      dataIndex: "price",
      key: "price",
      width: 80,
    },
    {
      title: t("ecommerce.crawlerData.colRating"),
      dataIndex: "rating",
      key: "rating",
      width: 80,
    },
    {
      title: t("ecommerce.crawlerData.colReviews"),
      dataIndex: "review_count",
      key: "review_count",
      width: 80,
    },
    {
      title: t("ecommerce.crawlerData.colPrime"),
      dataIndex: "is_prime",
      key: "is_prime",
      width: 60,
      render: (v: string | null) => (
        <Tag color={v === "Yes" ? "green" : "default"}>
          {v || "No"}
        </Tag>
      ),
    },
    {
      title: t("ecommerce.crawlerData.colDetailStatus"),
      dataIndex: "detail_scraped",
      key: "detail_scraped",
      width: 80,
      render: (v: boolean | null) => (
        <Tag color={v ? "green" : "orange"}>
          {v
            ? t("ecommerce.crawlerData.statusScraped")
            : t("ecommerce.crawlerData.statusNotScraped")}
        </Tag>
      ),
    },
    {
      title: t("ecommerce.crawlerData.colScrapedAt"),
      dataIndex: "scraped_at",
      key: "scraped_at",
      width: 150,
      render: (v: string | null) =>
        v ? new Date(v).toLocaleString() : "-",
    },
    {
      title: t("ecommerce.crawlerData.colActions"),
      key: "actions",
      width: 120,
      render: (_: unknown, record: CrawlerProduct) => (
        <Space size="small">
          <Button
            type="link"
            size="small"
            icon={<Eye size={14} />}
            onClick={() => onViewDetail(record)}
          >
            {t("ecommerce.crawlerData.viewDetail")}
          </Button>
          <Button
            type="link"
            size="small"
            icon={<Sparkles size={14} />}
            onClick={async () => {
              const ok = await onGenerate(record.asin);
              if (ok) {
                message.success(t("ecommerce.crawlerData.generateSuccess"));
              } else {
                message.error(t("ecommerce.crawlerData.generateFailed"));
              }
            }}
          >
            {t("ecommerce.crawlerData.generateBtn")}
          </Button>
        </Space>
      ),
    },
  ];
}
