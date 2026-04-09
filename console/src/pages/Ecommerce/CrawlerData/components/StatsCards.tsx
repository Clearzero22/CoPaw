import { useState, useEffect } from "react";
import { Card, Statistic } from "@agentscope-ai/design";
import { Spin } from "antd";
import { Package, CheckCircle, Star, Clock } from "lucide-react";
import { useTranslation } from "react-i18next";
import api from "../../../../api";
import type { CrawlerProductStats } from "../../../../api/types";

export function StatsCards() {
  const { t } = useTranslation();
  const [stats, setStats] = useState<CrawlerProductStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.getProductStats().then((data) => {
      setStats(data as CrawlerProductStats);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  if (loading) return <Spin />;
  if (!stats) return null;

  const cards = [
    {
      title: t("ecommerce.crawlerData.statTotal"),
      value: stats.total_products,
      icon: <Package size={20} />,
      color: "#615ced",
    },
    {
      title: t("ecommerce.crawlerData.statDetailScraped"),
      value: stats.detail_scraped,
      suffix: stats.total_products > 0
        ? ` (${Math.round((stats.detail_scraped / stats.total_products) * 100)}%)`
        : "",
      icon: <CheckCircle size={20} />,
      color: "#52c41a",
    },
    {
      title: t("ecommerce.crawlerData.statPrime"),
      value: stats.prime_products,
      icon: <Star size={20} />,
      color: "#faad14",
    },
    {
      title: t("ecommerce.crawlerData.statLastScrape"),
      value: stats.last_scrape_at
        ? new Date(stats.last_scrape_at).toLocaleString()
        : "-",
      icon: <Clock size={20} />,
      color: "#1890ff",
    },
  ];

  return (
    <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 16 }}>
      {cards.map((card, i) => (
        <Card key={i} size="small">
          <Statistic
            title={
              <span style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <span style={{ color: card.color }}>{card.icon}</span>
                {card.title}
              </span>
            }
            value={card.value}
            suffix={card.suffix || undefined}
            valueStyle={{ fontSize: 20 }}
          />
        </Card>
      ))}
    </div>
  );
}
