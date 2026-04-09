import { Tag, Button } from "@agentscope-ai/design";
import { Space } from "antd";
import { Edit, Star, Trash2 } from "lucide-react";
import type { PromptTemplate } from "../../../../api/types";

interface ColumnHandlers {
  onEdit: (record: PromptTemplate) => void;
  onDelete: (id: number) => void;
  onSetDefault: (id: number) => void;
  t: (key: string) => string;
}

const PLATFORM_COLORS: Record<string, string> = {
  amazon: "blue",
  ebay: "orange",
};

const CATEGORY_OPTIONS = [
  "electronics",
  "home",
  "clothing",
  "beauty",
  "sports",
  "generic",
];

export function createColumns({
  onEdit,
  onDelete,
  onSetDefault,
  t,
}: ColumnHandlers) {
  return [
    {
      title: t("ecommerce.promptTemplates.colName"),
      dataIndex: "name",
      key: "name",
      ellipsis: true,
      width: 200,
    },
    {
      title: t("ecommerce.promptTemplates.colCategory"),
      dataIndex: "category",
      key: "category",
      width: 120,
      render: (v: string) => {
        const color = CATEGORY_OPTIONS.includes(v)
          ? "blue"
          : "default";
        return <Tag color={color}>{v || "-"}</Tag>;
      },
    },
    {
      title: t("ecommerce.promptTemplates.colPlatform"),
      dataIndex: "platform",
      key: "platform",
      width: 90,
      render: (v: string) => (
        <Tag color={PLATFORM_COLORS[v] || "default"}>
          {v || "-"}
        </Tag>
      ),
    },
    {
      title: t("ecommerce.promptTemplates.colMarketplace"),
      dataIndex: "marketplace",
      key: "marketplace",
      width: 80,
      render: (v: string) => (
        <Tag>{v?.toUpperCase() || "-"}</Tag>
      ),
    },
    {
      title: t("ecommerce.promptTemplates.colDefault"),
      dataIndex: "is_default",
      key: "is_default",
      width: 80,
      render: (v: boolean) =>
        v ? (
          <Tag color="gold">Default</Tag>
        ) : null,
    },
    {
      title: t("ecommerce.promptTemplates.colUpdated"),
      dataIndex: "updated_at",
      key: "updated_at",
      width: 150,
      render: (v: string | null) =>
        v ? new Date(v).toLocaleString() : "-",
    },
    {
      title: t("ecommerce.promptTemplates.colActions"),
      key: "actions",
      width: 150,
      render: (_: unknown, record: PromptTemplate) => (
        <Space size="small">
          <Button
            type="link"
            size="small"
            icon={<Edit size={14} />}
            onClick={() => onEdit(record)}
          >
            {t("ecommerce.promptTemplates.editBtn")}
          </Button>
          <Button
            type="link"
            size="small"
            icon={<Star size={14} />}
            onClick={() => onSetDefault(record.id)}
          >
            {t("ecommerce.promptTemplates.defaultBtn")}
          </Button>
          <Button
            type="link"
            size="small"
            danger
            icon={<Trash2 size={14} />}
            onClick={async () => {
              await onDelete(record.id);
            }}
          >
            {t("ecommerce.promptTemplates.deleteBtn")}
          </Button>
        </Space>
      ),
    },
  ];
}
