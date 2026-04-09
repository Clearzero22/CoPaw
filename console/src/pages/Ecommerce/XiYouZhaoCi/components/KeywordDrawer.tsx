import { Drawer } from "@agentscope-ai/design";
import { Descriptions, Tag } from "antd";
import { useTranslation } from "react-i18next";
import type { XiYouKeyword } from "../../../../api/types";

interface KeywordDrawerProps {
  open: boolean;
  keyword: XiYouKeyword | null;
  onClose: () => void;
}

export function KeywordDrawer({
  open,
  keyword,
  onClose,
}: KeywordDrawerProps) {
  const { t } = useTranslation();

  if (!keyword) return null;

  return (
    <Drawer
      open={open}
      onClose={onClose}
      width={500}
      destroyOnClose
      title={keyword.keyword}
    >
      <Descriptions
        column={1}
        bordered
        size="small"
        title={t("ecommerce.xiyouzhaoci.basicInfo")}
      >
        <Descriptions.Item label="ASIN">
          <a
            href={`https://www.amazon.com/dp/${keyword.asin}`}
            target="_blank"
            rel="noopener noreferrer"
          >
            {keyword.asin}
          </a>
        </Descriptions.Item>
        <Descriptions.Item
          label={t("ecommerce.xiyouzhaoci.colKeyword")}
        >
          {keyword.keyword}
        </Descriptions.Item>
        <Descriptions.Item
          label={t("ecommerce.xiyouzhaoci.colRank")}
        >
          {keyword.rank ?? "-"}
        </Descriptions.Item>
        <Descriptions.Item
          label={t("ecommerce.xiyouzhaoci.colSearchVolume")}
        >
          {keyword.search_volume || "-"}
        </Descriptions.Item>
        <Descriptions.Item
          label={t("ecommerce.xiyouzhaoci.colTrafficShare")}
        >
          {keyword.traffic_share || "-"}
        </Descriptions.Item>
        <Descriptions.Item
          label={t("ecommerce.xiyouzhaoci.colDifficulty")}
        >
          <Tag>{keyword.difficulty || "-"}</Tag>
        </Descriptions.Item>
        <Descriptions.Item
          label={t("ecommerce.xiyouzhaoci.colRankingPos")}
        >
          {keyword.ranking_position || "-"}
        </Descriptions.Item>
        <Descriptions.Item
          label={t("ecommerce.xiyouzhaoci.colClickRate")}
        >
          {keyword.click_rate || "-"}
        </Descriptions.Item>
        <Descriptions.Item
          label={t("ecommerce.xiyouzhaoci.colConversionRate")}
        >
          {keyword.conversion_rate || "-"}
        </Descriptions.Item>
        <Descriptions.Item
          label={t("ecommerce.xiyouzhaoci.colOrganicRank")}
        >
          {keyword.organic_rank || "-"}
        </Descriptions.Item>
        <Descriptions.Item
          label={t("ecommerce.xiyouzhaoci.colSponsoredRank")}
        >
          {keyword.sponsored_rank || "-"}
        </Descriptions.Item>
        <Descriptions.Item
          label={t("ecommerce.xiyouzhaoci.colScrapedAt")}
        >
          {keyword.scraped_at
            ? new Date(keyword.scraped_at).toLocaleString()
            : "-"}
        </Descriptions.Item>
      </Descriptions>
    </Drawer>
  );
}
