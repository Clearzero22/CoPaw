import { Tag, Button } from "@agentscope-ai/design";
import { Space, message } from "antd";
import { Eye, Trash2 } from "lucide-react";
import type { XiYouKeyword } from "../../../../api/types";

interface KeywordColumnsProps {
  onDelete: (asin: string) => Promise<void>;
  onViewDetail: (record: XiYouKeyword) => void;
  t: (key: string) => string;
}

function getDifficultyColor(
  difficulty: string | null,
): string {
  if (!difficulty) return "default";
  const d = difficulty.toLowerCase();
  if (d.includes("low") || d.includes("低") || d.includes("easy"))
    return "green";
  if (
    d.includes("high") || d.includes("高") || d.includes("hard")
  )
    return "red";
  if (
    d.includes("medium") || d.includes("中")
  )
    return "orange";
  return "blue";
}

export function createKeywordColumns({
  onDelete,
  onViewDetail,
  t,
}: KeywordColumnsProps) {
  return [
    {
      title: t("ecommerce.xiyouzhaoci.colAsin"),
      dataIndex: "asin",
      key: "asin",
      width: 120,
      render: (asin: string) => (
        <a
          href={`https://www.amazon.com/dp/${asin}`}
          target="_blank"
          rel="noopener noreferrer"
        >
          {asin}
        </a>
      ),
    },
    {
      title: t("ecommerce.xiyouzhaoci.colKeyword"),
      dataIndex: "keyword",
      key: "keyword",
      ellipsis: true,
    },
    {
      title: t("ecommerce.xiyouzhaoci.colRank"),
      dataIndex: "rank",
      key: "rank",
      width: 70,
    },
    {
      title: t("ecommerce.xiyouzhaoci.colSearchVolume"),
      dataIndex: "search_volume",
      key: "search_volume",
      width: 120,
    },
    {
      title: t("ecommerce.xiyouzhaoci.colTrafficShare"),
      dataIndex: "traffic_share",
      key: "traffic_share",
      width: 90,
    },
    {
      title: t("ecommerce.xiyouzhaoci.colDifficulty"),
      dataIndex: "difficulty",
      key: "difficulty",
      width: 80,
      render: (v: string | null) => (
        <Tag color={getDifficultyColor(v)}>
          {v || "-"}
        </Tag>
      ),
    },
    {
      title: t("ecommerce.xiyouzhaoci.colRankingPos"),
      dataIndex: "ranking_position",
      key: "ranking_position",
      width: 100,
    },
    {
      title: t("ecommerce.xiyouzhaoci.colClickRate"),
      dataIndex: "click_rate",
      key: "click_rate",
      width: 80,
    },
    {
      title: t("ecommerce.xiyouzhaoci.colConversionRate"),
      dataIndex: "conversion_rate",
      key: "conversion_rate",
      width: 80,
    },
    {
      title: t("ecommerce.xiyouzhaoci.colScrapedAt"),
      dataIndex: "scraped_at",
      key: "scraped_at",
      width: 150,
      render: (v: string | null) =>
        v ? new Date(v).toLocaleString() : "-",
    },
    {
      title: t("ecommerce.xiyouzhaoci.colActions"),
      key: "actions",
      width: 120,
      render: (_: unknown, record: XiYouKeyword) => (
        <Space size="small">
          <Button
            type="link"
            size="small"
            icon={<Eye size={14} />}
            onClick={() => onViewDetail(record)}
          >
            {t("ecommerce.xiyouzhaoci.viewDetail")}
          </Button>
          <Button
            type="link"
            size="small"
            danger
            icon={<Trash2 size={14} />}
            onClick={async () => {
              await onDelete(record.asin);
              message.success(
                t(
                  "ecommerce.xiyouzhaoci.deleteSuccess",
                ),
              );
            }}
          >
            {t("ecommerce.xiyouzhaoci.deleteBtn")}
          </Button>
        </Space>
      ),
    },
  ];
}
