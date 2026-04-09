import { Card, Statistic } from "@agentscope-ai/design";
import { Row, Col } from "antd";
import { Hash, Target, TrendingUp, Clock } from "lucide-react";
import { useTranslation } from "react-i18next";
import type { XiYouKeywordStats } from "../../../../api/types";

interface StatsCardsProps {
  stats: XiYouKeywordStats | null;
  loading: boolean;
}

export function StatsCards({ stats, loading }: StatsCardsProps) {
  const { t } = useTranslation();

  if (loading || !stats) {
    return (
      <Row gutter={16}>
        {[1, 2, 3, 4].map((i) => (
          <Col span={6} key={i}>
            <Card loading />
          </Col>
        ))}
      </Row>
    );
  }

  const cards = [
    {
      title: t("ecommerce.xiyouzhaoci.statTotalKeywords"),
      value: stats.total_keywords,
      icon: <Hash size={20} />,
    },
    {
      title: t("ecommerce.xiyouzhaoci.statUniqueAsins"),
      value: stats.unique_asins,
      icon: <Target size={20} />,
    },
    {
      title: t("ecommerce.xiyouzhaoci.statTopKeyword"),
      value:
        stats.top_keywords?.[0]?.keyword?.slice(0, 20) ||
        "-",
      icon: <TrendingUp size={20} />,
    },
    {
      title: t("ecommerce.xiyouzhaoci.statLastScrape"),
      value: stats.last_scrape_at
        ? new Date(stats.last_scrape_at).toLocaleDateString()
        : "-",
      icon: <Clock size={20} />,
    },
  ];

  return (
    <Row gutter={16}>
      {cards.map((card) => (
        <Col span={6} key={card.title}>
          <Card size="small">
            <Statistic
              title={card.title}
              value={card.value}
              prefix={card.icon}
            />
          </Card>
        </Col>
      ))}
    </Row>
  );
}
