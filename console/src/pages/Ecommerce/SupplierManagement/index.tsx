import { useState } from "react";
import { Card, Row, Col, Table, Tag, Button, Space, Avatar, Rate } from "antd";
import { Package, MapPin, Mail } from "lucide-react";
import { useTranslation } from "react-i18next";
import styles from "./index.module.less";

interface Supplier {
  key: string;
  name: string;
  location: string;
  moq: number;
  leadTime: number;
  rating: number;
  responseRate: number;
  products: number;
}

function SupplierManagement() {
  const { t } = useTranslation();
  const [suppliers] = useState<Supplier[]>([
    {
      key: "1",
      name: "Shenzhen Tech Electronics",
      location: "China, Guangdong",
      moq: 100,
      leadTime: 7,
      rating: 4.8,
      responseRate: 98,
      products: 156,
    },
    {
      key: "2",
      name: "Global Trade Solutions",
      location: "USA, California",
      moq: 50,
      leadTime: 3,
      rating: 4.5,
      responseRate: 92,
      products: 89,
    },
    {
      key: "3",
      name: "Asia Pacific Manufacturing",
      location: "Vietnam, Ho Chi Minh",
      moq: 200,
      leadTime: 14,
      rating: 4.3,
      responseRate: 85,
      products: 234,
    },
  ]);

  const columns = [
    {
      title: t("ecommerce.supplierManagement.supplier"),
      dataIndex: "name",
      key: "name",
      render: (name: string, record: Supplier) => (
        <Space>
          <Avatar size="large" icon={<Package />} />
          <div>
            <div style={{ fontWeight: 500 }}>{name}</div>
            <Space size="small">
              <MapPin size={12} />
              <small>{record.location}</small>
            </Space>
          </div>
        </Space>
      ),
    },
    {
      title: t("ecommerce.supplierManagement.moq"),
      dataIndex: "moq",
      key: "moq",
      render: (moq: number) => `${moq} units`,
    },
    {
      title: t("ecommerce.supplierManagement.leadTime"),
      dataIndex: "leadTime",
      key: "leadTime",
      render: (days: number) => `${days} days`,
      sorter: (a: Supplier, b: Supplier) => a.leadTime - b.leadTime,
    },
    {
      title: t("ecommerce.supplierManagement.rating"),
      dataIndex: "rating",
      key: "rating",
      render: (rating: number) => (
        <Space>
          <Rate disabled value={rating} allowHalf />
          <small>{rating}</small>
        </Space>
      ),
      sorter: (a: Supplier, b: Supplier) => a.rating - b.rating,
    },
    {
      title: t("ecommerce.supplierManagement.responseRate"),
      dataIndex: "responseRate",
      key: "responseRate",
      render: (rate: number) => (
        <Tag color={rate >= 90 ? "green" : rate >= 80 ? "blue" : "orange"}>
          {rate}%
        </Tag>
      ),
    },
    {
      title: t("ecommerce.supplierManagement.products"),
      dataIndex: "products",
      key: "products",
      render: (count: number) => `${count} products`,
    },
    {
      title: t("ecommerce.supplierManagement.actions"),
      key: "actions",
      render: () => (
        <Space>
          <Button size="small" icon={<Mail size={14} />}>
            {t("ecommerce.supplierManagement.contact")}
          </Button>
        </Space>
      ),
    },
  ];

  return (
    <div className={styles.supplierManagement}>
      <Row gutter={[16, 16]}>
        <Col span={24}>
          <Card
            title={
              <Space>
                <Package size={20} />
                {t("ecommerce.supplierManagement.title")}
              </Space>
            }
            extra={
              <Button type="primary">
                {t("ecommerce.supplierManagement.addSupplier")}
              </Button>
            }
          >
            <Table
              columns={columns}
              dataSource={suppliers}
              pagination={{ pageSize: 10 }}
            />
          </Card>
        </Col>
      </Row>
    </div>
  );
}

export default SupplierManagement;
