import { useState, useEffect, useCallback } from "react";
import { Table, Input, Button } from "@agentscope-ai/design";
import { Modal, Space, message } from "antd";
import { Search } from "lucide-react";
import { useTranslation } from "react-i18next";
import api from "../../../../api";
import type { CrawlerProduct } from "../../../../api/types";

interface AsinPickerProps {
  open: boolean;
  onClose: () => void;
  onSelect: (asins: string[]) => void;
}

export function AsinPicker({
  open,
  onClose,
  onSelect,
}: AsinPickerProps) {
  const { t } = useTranslation();
  const [products, setProducts] = useState<CrawlerProduct[]>([]);
  const [loading, setLoading] = useState(false);
  const [selected, setSelected] = useState<Set<string>>(
    new Set(),
  );
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");

  const fetchProducts = useCallback(async () => {
    setLoading(true);
    try {
      const data = await api.listProducts({
        page: 1,
        page_size: 50,
        search: debouncedSearch || undefined,
      });
      const res = data as {
        products: CrawlerProduct[];
        total: number;
      };
      setProducts(res.products || []);
    } catch (error) {
      console.error("Failed to load products:", error);
    } finally {
      setLoading(false);
    }
  }, [debouncedSearch]);

  useEffect(() => {
    if (!open) return;
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
    }, 300);
    return () => clearTimeout(timer);
  }, [search, open]);

  useEffect(() => {
    if (open) fetchProducts();
  }, [open, fetchProducts]);

  const handleConfirm = () => {
    if (selected.size === 0) {
      message.warning(
        t("ecommerce.xiyouzhaoci.selectAtLeastOne"),
      );
      return;
    }
    onSelect(Array.from(selected));
    setSelected(new Set());
    setSearch("");
    onClose();
  };

  const columns = [
    {
      title: "ASIN",
      dataIndex: "asin",
      key: "asin",
      width: 120,
    },
    {
      title: t("ecommerce.xiyouzhaoci.colTitle"),
      dataIndex: "title",
      key: "title",
      ellipsis: true,
    },
    {
      title: t("ecommerce.xiyouzhaoci.colBrand"),
      dataIndex: "brand",
      key: "brand",
      width: 120,
      ellipsis: true,
    },
    {
      title: t("ecommerce.xiyouzhaoci.colPrice"),
      dataIndex: "price",
      key: "price",
      width: 80,
    },
  ];

  return (
    <Modal
      open={open}
      onCancel={onClose}
      width={800}
      title={t("ecommerce.xiyouzhaoci.pickAsins")}
      footer={
        <Space>
          <Button onClick={onClose}>
            {t("ecommerce.xiyouzhaoci.cancel")}
          </Button>
          <Button type="primary" onClick={handleConfirm}>
            {t("ecommerce.xiyouzhaoci.confirmSelect", {
              count: selected.size,
            })}
          </Button>
        </Space>
      }
    >
      <Input
        placeholder={t("ecommerce.xiyouzhaoci.searchProducts")}
        prefix={<Search size={14} />}
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        style={{ marginBottom: 12 }}
      />
      <Table
        rowSelection={{
          selectedRowKeys: Array.from(selected),
          onChange: (keys: React.Key[]) => {
            setSelected(new Set(keys.map(String)));
          },
        }}
        columns={columns}
        dataSource={products}
        rowKey="asin"
        loading={loading}
        size="small"
        pagination={{ pageSize: 10 }}
        scroll={{ y: 400 }}
      />
    </Modal>
  );
}
