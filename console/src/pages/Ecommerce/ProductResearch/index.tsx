import { useState } from "react";
import { Card, Input, Button, Table, Tag, Space, message } from "antd";
import { Search, TrendingUp, DollarSign, Package } from "lucide-react";
import { useTranslation } from "react-i18next";
import styles from "./index.module.less";

interface Product {
  key: string;
  asin: string;
  title: string;
  price: number;
  rating: number;
  reviewCount: number;
  rank: number;
  estimatedSales: number;
}

function ProductResearch() {
  const { t } = useTranslation();
  const [searchKeyword, setSearchKeyword] = useState("");
  const [loading, setLoading] = useState(false);
  const [products, setProducts] = useState<Product[]>([]);

  const columns = [
    {
      title: t("ecommerce.productResearch.asin"),
      dataIndex: "asin",
      key: "asin",
      render: (asin: string) => <Tag color="blue">{asin}</Tag>,
    },
    {
      title: t("ecommerce.productResearch.title"),
      dataIndex: "title",
      key: "title",
      ellipsis: true,
    },
    {
      title: t("ecommerce.productResearch.price"),
      dataIndex: "price",
      key: "price",
      render: (price: number) => (
        <Space>
          <DollarSign size={14} />
          {price.toFixed(2)}
        </Space>
      ),
    },
    {
      title: t("ecommerce.productResearch.rating"),
      dataIndex: "rating",
      key: "rating",
      render: (rating: number) => (
        <Tag color={rating >= 4.5 ? "green" : rating >= 4.0 ? "blue" : "orange"}>
          ⭐ {rating}
        </Tag>
      ),
    },
    {
      title: t("ecommerce.productResearch.rank"),
      dataIndex: "rank",
      key: "rank",
      render: (rank: number) => `#${rank.toLocaleString()}`,
    },
    {
      title: t("ecommerce.productResearch.estimatedSales"),
      dataIndex: "estimatedSales",
      key: "estimatedSales",
      render: (sales: number) => (
        <Space>
          <TrendingUp size={14} />
          {sales.toLocaleString()}
        </Space>
      ),
    },
  ];

  const handleSearch = async () => {
    if (!searchKeyword.trim()) {
      message.warning(t("ecommerce.productResearch.pleaseEnterKeyword"));
      return;
    }

    setLoading(true);
    try {
      // TODO: 调用后端 API 进行产品搜索
      // 模拟数据
      const mockProducts: Product[] = [
        {
          key: "1",
          asin: "B08XXXXX1",
          title: "Wireless Gaming Mouse - RGB Backlit",
          price: 29.99,
          rating: 4.5,
          reviewCount: 2547,
          rank: 1234,
          estimatedSales: 8900,
        },
        {
          key: "2",
          asin: "B08XXXXX2",
          title: "Ergonomic Office Chair with Lumbar Support",
          price: 159.99,
          rating: 4.7,
          reviewCount: 5621,
          rank: 567,
          estimatedSales: 12400,
        },
      ];
      setProducts(mockProducts);
    } catch (error) {
      message.error(t("ecommerce.productResearch.searchFailed"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.productResearch}>
      <Card
        title={
          <Space>
            <Package size={20} />
            {t("ecommerce.productResearch.title")}
          </Space>
        }
      >
        <Space direction="vertical" size="large" style={{ width: "100%" }}>
          {/* 搜索区域 */}
          <div className={styles.searchSection}>
            <Space.Compact style={{ width: "100%" }}>
              <Input
                placeholder={t("ecommerce.productResearch.searchPlaceholder")}
                value={searchKeyword}
                onChange={(e) => setSearchKeyword(e.target.value)}
                onPressEnter={handleSearch}
                size="large"
                prefix={<Search size={16} />}
              />
              <Button type="primary" size="large" onClick={handleSearch} loading={loading}>
                {t("ecommerce.productResearch.search")}
              </Button>
            </Space.Compact>
          </div>

          {/* 结果表格 */}
          <Table
            columns={columns}
            dataSource={products}
            loading={loading}
            pagination={{ pageSize: 10 }}
          />
        </Space>
      </Card>
    </div>
  );
}

export default ProductResearch;
