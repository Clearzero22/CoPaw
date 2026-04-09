import { Table, Tag, Dropdown, Tooltip, Typography } from "antd";
import type { TableColumnsType } from "antd";
import {
  ChevronsUpDown,
  HelpCircle,
  Copy,
  ChevronDown,
  BarChart2,
} from "lucide-react";
import { useTranslation } from "react-i18next";
import { listingData } from "../mockData";
import type { ListingItem } from "../types";
import styles from "../index.module.less";

const { Text } = Typography;

interface ListingTableProps {
  onOpenStats: () => void;
}

function ProductImage({ color, variant }: { color: string; variant: string }) {
  return (
    <div className={styles.imagePlaceholder}>
      {variant === "layers" && (
        <svg viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" style={{ width: "100%", height: "100%" }}>
          <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
        </svg>
      )}
      {variant === "grid" && (
        <svg viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" style={{ width: "100%", height: "100%" }}>
          <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
          <line x1="3" y1="9" x2="21" y2="9" />
          <line x1="9" y1="21" x2="9" y2="9" />
        </svg>
      )}
      {variant === "circle" && (
        <svg viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" style={{ width: "100%", height: "100%" }}>
          <circle cx="12" cy="12" r="10" />
          <line x1="12" y1="8" x2="12" y2="12" />
          <line x1="12" y1="16" x2="12.01" y2="16" />
        </svg>
      )}
    </div>
  );
}

const tagColorMap: Record<string, string> = {
  green: "success",
  blue: "processing",
  purple: "purple",
  default: "default",
};

function getTagAntColor(color: string): string {
  return tagColorMap[color] || "default";
}

export default function ListingTable({ onOpenStats }: ListingTableProps) {
  const { t } = useTranslation();

  const columns: TableColumnsType<ListingItem> = [
    {
      title: "",
      dataIndex: "id",
      width: 48,
      render: () => null, // Selection handled by rowSelection
    },
    {
      title: t("sellerTools.erpListing.columnImage"),
      dataIndex: "image",
      width: 64,
      render: (_: unknown, record: ListingItem) => (
        <ProductImage color={record.imageColor} variant={record.imageSvg} />
      ),
    },
    {
      title: (
        <span>
          {t("sellerTools.erpListing.columnMskuFnsku")}{" "}
          <ChevronsUpDown size={12} style={{ color: "#bfbfbf", verticalAlign: "middle" }} />
        </span>
      ),
      dataIndex: "msku",
      width: 160,
      render: (msku: string, record: ListingItem) => (
        <div>
          <span className={styles.mskuLink}>{msku}</span>
          <div className={styles.fnskuText}>
            <Copy size={12} className={styles.copyIcon} />
            {record.fnsku}
          </div>
        </div>
      ),
    },
    {
      title: t("sellerTools.erpListing.columnStatus"),
      dataIndex: "status",
      width: 72,
      render: (status: string) => (
        <span className={status === "在售" ? styles.statusActive : styles.statusInactive}>
          {status}
        </span>
      ),
    },
    {
      title: t("sellerTools.erpListing.columnAnalysis"),
      dataIndex: "analysis",
      width: 72,
      align: "center",
      render: () => (
        <button className={styles.analysisBtn} onClick={onOpenStats}>
          <BarChart2 size={16} className={styles.icon} />
        </button>
      ),
    },
    {
      title: (
        <span>
          {t("sellerTools.erpListing.columnAsin")}{" "}
          <ChevronsUpDown size={12} style={{ color: "#bfbfbf", verticalAlign: "middle" }} />
        </span>
      ),
      dataIndex: "asin",
      width: 120,
      render: (asin: string) => (
        <span className={styles.mskuLink}>{asin}</span>
      ),
    },
    {
      title: t("sellerTools.erpListing.columnTitle"),
      dataIndex: "title",
      width: 256,
      render: (title: string) => (
        <Tooltip title={title}>
          <Text style={{ fontSize: 13 }} ellipsis>
            {title}
          </Text>
        </Tooltip>
      ),
    },
    {
      title: t("sellerTools.erpListing.columnTags"),
      dataIndex: "tags",
      width: 160,
      render: (tags: ListingItem["tags"]) => (
        <div className={styles.tagsCell}>
          {tags.slice(0, 2).map((tag) => (
            <Tag key={tag.label} color={getTagAntColor(tag.color)} style={{ fontSize: 12 }}>
              {tag.label}
            </Tag>
          ))}
          {tags.length > 1 && (
            <>
              <span className={styles.tagCount}>
                {t("sellerTools.erpListing.tagTotal", { count: tags.length + 3 })}
              </span>
            </>
          )}
        </div>
      ),
    },
    {
      title: t("sellerTools.erpListing.columnStore"),
      dataIndex: "store",
      width: 100,
    },
    {
      title: t("sellerTools.erpListing.columnCountry"),
      dataIndex: "country",
      width: 72,
    },
    {
      title: (
        <span>
          {t("sellerTools.erpListing.columnPrice")}{" "}
          <Tooltip title={t("sellerTools.erpListing.priceTooltip")}>
            <HelpCircle size={12} style={{ color: "#bfbfbf", verticalAlign: "middle" }} />
          </Tooltip>
        </span>
      ),
      dataIndex: "price",
      width: 110,
      align: "right",
      render: (price: number, record: ListingItem) => (
        <div className={styles.priceCell}>
          <div className={styles.mainPrice}>
            ${price.toFixed(2)} <ChevronDown size={12} style={{ color: "#bfbfbf" }} />
          </div>
          {record.adjustingPrice != null && (
            <div className={styles.adjustingPrice}>
              ${record.adjustingPrice.toFixed(2)} ({t("sellerTools.erpListing.adjusting")})
            </div>
          )}
        </div>
      ),
    },
    {
      title: (
        <span>
          {t("sellerTools.erpListing.columnFbaStock")}{" "}
          <Tooltip title={t("sellerTools.erpListing.fbaTooltip")}>
            <HelpCircle size={12} style={{ color: "#bfbfbf", verticalAlign: "middle" }} />
          </Tooltip>
        </span>
      ),
      dataIndex: "fbaStock",
      width: 100,
      align: "right",
      render: (stock: number) => (
        <span className={styles.stockCell}>
          {stock} <ChevronDown size={12} style={{ color: "#bfbfbf" }} />
        </span>
      ),
    },
    {
      title: t("sellerTools.erpListing.columnActions"),
      dataIndex: "actions",
      width: 140,
      align: "center",
      fixed: "right",
      render: () => (
        <div className={styles.operationsCell}>
          <button className={styles.actionBtn}>
            {t("sellerTools.erpListing.adCampaign")}
          </button>
          <Dropdown
            menu={{
              items: [
                { key: "edit", label: t("sellerTools.erpListing.actionEdit") },
                { key: "delete", label: t("sellerTools.erpListing.actionDelete"), danger: true },
              ],
            }}
            trigger={["click"]}
          >
            <button className={styles.actionBtnDefault}>
              {t("sellerTools.erpListing.actions")}
              <ChevronDown size={12} />
            </button>
          </Dropdown>
        </div>
      ),
    },
  ];

  return (
    <div className={styles.tableWrapper}>
      <Table<ListingItem>
        rowKey="id"
        columns={columns}
        dataSource={listingData}
        pagination={false}
        size="small"
        scroll={{ x: 1400 }}
        rowSelection={{
          columnWidth: 48,
        }}
        // Fill empty rows by adding placeholder data
        locale={{ emptyText: " " }}
      />
    </div>
  );
}
