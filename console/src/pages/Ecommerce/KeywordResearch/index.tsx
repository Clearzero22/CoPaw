import { useState } from "react";
import { Card, Input, Button, Table, Tag, Space, Progress, message } from "@agentscope-ai/design";
import { Search, TrendingUp, Eye, DollarSign } from "lucide-react";
import { useTranslation } from "react-i18next";
import styles from "./index.module.less";

interface Keyword {
  key: string;
  keyword: string;
  searchVolume: number;
  competition: "Low" | "Medium" | "High";
  cpc: number;
  trend: number;
}

function KeywordResearch() {
  const { t } = useTranslation();
  const [searchKeyword, setSearchKeyword] = useState("");
  const [loading, setLoading] = useState(false);
  const [keywords, setKeywords] = useState<Keyword[]>([]);

  const columns = [
    {
      title: t("ecommerce.keywordResearch.keyword"),
      dataIndex: "keyword",
      key: "keyword",
      render: (keyword: string) => <Tag color="blue">{keyword}</Tag>,
    },
    {
      title: t("ecommerce.keywordResearch.searchVolume"),
      dataIndex: "searchVolume",
      key: "searchVolume",
      render: (volume: number) => (
        <Space>
          <Eye size={14} />
          {volume.toLocaleString()}
        </Space>
      ),
      sorter: (a: Keyword, b: Keyword) => a.searchVolume - b.searchVolume,
    },
    {
      title: t("ecommerce.keywordResearch.competition"),
      dataIndex: "competition",
      key: "competition",
      render: (competition: string) => {
        const color = competition === "Low" ? "green" : competition === "Medium" ? "orange" : "red";
        const percent = competition === "Low" ? 33 : competition === "Medium" ? 66 : 90;
        return <Progress percent={percent} size="small" status={color === "green" ? "success" : color === "orange" ? "normal" : "exception"} />;
      },
    },
    {
      title: t("ecommerce.keywordResearch.cpc"),
      dataIndex: "cpc",
      key: "cpc",
      render: (cpc: number) => (
        <Space>
          <DollarSign size={14} />
          {cpc.toFixed(2)}
        </Space>
      ),
      sorter: (a: Keyword, b: Keyword) => a.cpc - b.cpc,
    },
    {
      title: t("ecommerce.keywordResearch.trend"),
      dataIndex: "trend",
      key: "trend",
      render: (trend: number) => (
        <Space>
          <TrendingUp size={14} />
          <Tag color={trend > 0 ? "green" : "red"}>
            {trend > 0 ? "+" : ""}{trend}%
          </Tag>
        </Space>
      ),
      sorter: (a: Keyword, b: Keyword) => a.trend - b.trend,
    },
  ];

  const handleSearch = async () => {
    if (!searchKeyword.trim()) {
      message.warning(t("ecommerce.keywordResearch.pleaseEnterKeyword"));
      return;
    }

    setLoading(true);
    try {
      // TODO: 调用后端 API 进行关键词研究
      const mockKeywords: Keyword[] = [
        {
          key: "1",
          keyword: "wireless gaming mouse",
          searchVolume: 74000,
          competition: "High",
          cpc: 1.85,
          trend: 15,
        },
        {
          key: "2",
          keyword: "ergonomic mouse",
          searchVolume: 49500,
          competition: "Medium",
          cpc: 1.42,
          trend: 23,
        },
        {
          key: "3",
          keyword: "rgb gaming mouse",
          searchVolume: 33100,
          competition: "Medium",
          cpc: 1.25,
          trend: -5,
        },
        {
          key: "4",
          keyword: "lightweight mouse",
          searchVolume: 22200,
          competition: "Low",
          cpc: 0.95,
          trend: 45,
        },
      ];
      setKeywords(mockKeywords);
    } catch (error) {
      message.error(t("ecommerce.keywordResearch.searchFailed"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.keywordResearch}>
      <Card title={t("ecommerce.keywordResearch.title")}>
        <Space direction="vertical" size="large" style={{ width: "100%" }}>
          <div className={styles.searchSection}>
            <Space.Compact style={{ width: "100%" }}>
              <Input
                placeholder={t("ecommerce.keywordResearch.searchPlaceholder")}
                value={searchKeyword}
                onChange={(e) => setSearchKeyword(e.target.value)}
                onPressEnter={handleSearch}
                size="large"
                prefix={<Search size={16} />}
              />
              <Button type="primary" size="large" onClick={handleSearch} loading={loading}>
                {t("ecommerce.keywordResearch.analyze")}
              </Button>
            </Space.Compact>
          </div>

          <Table
            columns={columns}
            dataSource={keywords}
            loading={loading}
            pagination={{ pageSize: 10 }}
          />
        </Space>
      </Card>
    </div>
  );
}

export default KeywordResearch;
