import { useState } from "react";
import { Card, Row, Col, Statistic, Progress, List, Tag, Space } from "@agentscope-ai/design";
import { Target, TrendingUp, Users, ShoppingCart } from "lucide-react";
import { useTranslation } from "react-i18next";
import styles from "./index.module.less";

interface Competitor {
  asin: string;
  brand: string;
  marketShare: number;
  monthlySales: number;
  avgPrice: number;
  rating: number;
}

function CompetitorAnalysis() {
  const { t } = useTranslation();
  const [competitors] = useState<Competitor[]>([
    {
      asin: "B08XXXXX1",
      brand: "Competitor A",
      marketShare: 35,
      monthlySales: 15400,
      avgPrice: 24.99,
      rating: 4.3,
    },
    {
      asin: "B08XXXXX2",
      brand: "Competitor B",
      marketShare: 28,
      monthlySales: 12300,
      avgPrice: 32.99,
      rating: 4.6,
    },
    {
      asin: "B08XXXXX3",
      brand: "Competitor C",
      marketShare: 22,
      monthlySales: 9700,
      avgPrice: 19.99,
      rating: 4.1,
    },
  ]);

  return (
    <div className={styles.competitorAnalysis}>
      <Row gutter={[16, 16]}>
        {/* 统计卡片 */}
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title={t("ecommerce.competitorAnalysis.totalCompetitors")}
              value={competitors.length}
              prefix={<Target size={16} />}
              suffix={t("ecommerce.competitorAnalysis.companies")}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title={t("ecommerce.competitorAnalysis.avgMarketShare")}
              value={28.3}
              suffix="%"
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title={t("ecommerce.competitorAnalysis.totalMonthlySales")}
              value={37400}
              prefix={<TrendingUp size={16} />}
              suffix={t("ecommerce.competitorAnalysis.units")}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title={t("ecommerce.competitorAnalysis.avgRating")}
              value={4.33}
              precision={2}
              suffix="⭐"
            />
          </Card>
        </Col>

        {/* 竞争对手列表 */}
        <Col span={24}>
          <Card
            title={
              <Space>
                <Target size={20} />
                {t("ecommerce.competitorAnalysis.competitorList")}
              </Space>
            }
          >
            <List
              dataSource={competitors}
              renderItem={(competitor) => (
                <List.Item key={competitor.asin}>
                  <List.Item.Meta
                    title={
                      <Space>
                        <Tag color="blue">{competitor.asin}</Tag>
                        <span>{competitor.brand}</span>
                        <Tag color="green">⭐ {competitor.rating}</Tag>
                      </Space>
                    }
                    description={
                      <div>
                        <Row gutter={16}>
                          <Col span={6}>
                            <div>
                              <small>{t("ecommerce.competitorAnalysis.marketShare")}</small>
                              <Progress percent={competitor.marketShare} size="small" />
                            </div>
                          </Col>
                          <Col span={6}>
                            <Statistic
                              title={t("ecommerce.competitorAnalysis.monthlySales")}
                              value={competitor.monthlySales}
                              prefix={<ShoppingCart size={14} />}
                              valueStyle={{ fontSize: "14px" }}
                            />
                          </Col>
                          <Col span={6}>
                            <Statistic
                              title={t("ecommerce.competitorAnalysis.avgPrice")}
                              value={competitor.avgPrice}
                              prefix="$"
                              precision={2}
                              valueStyle={{ fontSize: "14px" }}
                            />
                          </Col>
                          <Col span={6}>
                            <Statistic
                              title={t("ecommerce.competitorAnalysis.marketPosition")}
                              value={"#"}
                              valueStyle={{ fontSize: "14px" }}
                            />
                          </Col>
                        </Row>
                      </div>
                    }
                  />
                </List.Item>
              )}
            />
          </Card>
        </Col>
      </Row>
    </div>
  );
}

export default CompetitorAnalysis;
