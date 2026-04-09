import { Button, Tag } from "@agentscope-ai/design";
import { Copy, Edit, Trash2 } from "lucide-react";
import type { TFunction } from "i18next";
import type { ColumnsType } from "antd/es/table";
import type { ListingInfo } from "../../../../api/types";

const STATUS_COLORS: Record<string, string> = {
  draft: "default",
  generated: "blue",
  published: "green",
  archived: "orange",
};

interface ColumnHandlers {
  onEdit: (record: ListingInfo) => void;
  onDelete: (id: string) => void;
  onCopy: (record: ListingInfo) => void;
  t: TFunction;
}

export const createColumns = (
  handlers: ColumnHandlers,
): ColumnsType<ListingInfo> => {
  const { t } = handlers;

  return [
    {
      title: t("ecommerce.listingManagement.title"),
      dataIndex: "title",
      key: "title",
      width: 300,
      ellipsis: true,
    },
    {
      title: t("ecommerce.listingManagement.asin"),
      dataIndex: "asin",
      key: "asin",
      width: 130,
      render: (asin: string) =>
        asin ? <Tag color="blue">{asin}</Tag> : "-",
    },
    {
      title: t("ecommerce.listingManagement.platform"),
      dataIndex: "platform",
      key: "platform",
      width: 100,
      render: (platform: string) => (
        <Tag>{platform?.toUpperCase() || "-"}</Tag>
      ),
    },
    {
      title: t("ecommerce.listingManagement.status"),
      dataIndex: "status",
      key: "status",
      width: 110,
      render: (status: string) => {
        const key = `status${status.charAt(0).toUpperCase()}${status.slice(1)}`;
        return (
          <Tag color={STATUS_COLORS[status] || "default"}>
            {t(`ecommerce.listingManagement.${key}`)}
          </Tag>
        );
      },
    },
    {
      title: t("ecommerce.listingManagement.price"),
      dataIndex: "price",
      key: "price",
      width: 100,
      render: (price: string) => (price ? `$${price}` : "-"),
    },
    {
      title: t("ecommerce.listingManagement.createdAt"),
      dataIndex: "created_at",
      key: "created_at",
      width: 160,
      render: (val: string) =>
        val ? new Date(val).toLocaleString() : "-",
      sorter: (a: ListingInfo, b: ListingInfo) =>
        new Date(a.created_at).getTime() -
        new Date(b.created_at).getTime(),
    },
    {
      title: t("ecommerce.listingManagement.actions"),
      key: "action",
      width: 160,
      fixed: "right",
      render: (_: unknown, record: ListingInfo) => (
        <div style={{ display: "flex", gap: 4 }}>
          <Button
            type="text"
            size="small"
            icon={<Edit size={14} />}
            onClick={() => handlers.onEdit(record)}
          />
          <Button
            type="text"
            size="small"
            icon={<Copy size={14} />}
            onClick={() => handlers.onCopy(record)}
          />
          <Button
            type="text"
            size="small"
            danger
            icon={<Trash2 size={14} />}
            onClick={() => handlers.onDelete(record.id)}
          />
        </div>
      ),
    },
  ];
};
