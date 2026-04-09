import { useState } from "react";
import {
  Table,
  Input,
  Button,
  Select,
} from "@agentscope-ai/design";
import { Space, Popconfirm, message } from "antd";
import {
  Search,
  Plus,
  Trash2,
} from "lucide-react";
import { useTranslation } from "react-i18next";
import { usePromptTemplates } from "./usePromptTemplates";
import { createColumns } from "./components/columns";
import { PromptDrawer } from "./components/PromptDrawer";
import type {
  PromptTemplate,
  PromptTemplateCreateInput,
} from "../../../api/types";

export default function PromptTemplates() {
  const { t } = useTranslation();
  const pt = usePromptTemplates();

  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editingTemplate, setEditingTemplate] =
    useState<PromptTemplate | null>(null);

  const [selectedRowKeys, setSelectedRowKeys] = useState<
    React.Key[]
  >([]);
  const [batchDeleting, setBatchDeleting] = useState(false);

  const handleEdit = (record: PromptTemplate) => {
    setEditingTemplate(record);
    setDrawerOpen(true);
  };

  const handleAdd = () => {
    setEditingTemplate(null);
    setDrawerOpen(true);
  };

  const handleDelete = async (id: number) => {
    const ok = await pt.deleteTemplate(id);
    if (ok) {
      message.success(
        t("ecommerce.promptTemplates.deleteSuccess"),
      );
    } else {
      message.error(
        t("ecommerce.promptTemplates.deleteFailed"),
      );
    }
  };

  const handleSetDefault = async (id: number) => {
    const ok = await pt.setDefault(id);
    if (ok) {
      message.success(
        t("ecommerce.promptTemplates.setDefaultSuccess"),
      );
    } else {
      message.error(
        t("ecommerce.promptTemplates.setDefaultFailed"),
      );
    }
  };

  const handleBatchDelete = async () => {
    if (selectedRowKeys.length === 0) return;
    setBatchDeleting(true);
    const ok = await pt.batchDelete(
      selectedRowKeys.map(Number),
    );
    if (ok) {
      setSelectedRowKeys([]);
      message.success(
        t("ecommerce.promptTemplates.batchDeleteSuccess"),
      );
    } else {
      message.error(
        t("ecommerce.promptTemplates.batchDeleteFailed"),
      );
    }
    setBatchDeleting(false);
  };

  const handleDrawerSave = async (
    values: PromptTemplateCreateInput,
    isEditing: boolean,
  ): Promise<boolean> => {
    try {
      if (isEditing && editingTemplate) {
        return await pt.updateTemplate(
          editingTemplate.id,
          values,
        );
      }
      return await pt.createTemplate(values);
    } catch (error) {
      console.error("Save failed:", error);
      message.error(
        t("ecommerce.promptTemplates.saveFailed"),
      );
      return false;
    }
  };

  const columns = createColumns({
    onEdit: handleEdit,
    onDelete: handleDelete,
    onSetDefault: handleSetDefault,
    t,
  });

  return (
    <div>
      <Space style={{ marginBottom: 16 }}>
        <Input
          placeholder={t(
            "ecommerce.promptTemplates.searchPlaceholder",
          )}
          prefix={<Search size={14} />}
          value={pt.search}
          onChange={(e) => pt.setSearch(e.target.value)}
          style={{ width: 250 }}
        />
        <Select
          placeholder={t(
            "ecommerce.promptTemplates.filterCategory",
          )}
          value={pt.categoryFilter || undefined}
          onChange={(val) => pt.setCategoryFilter(val || "")}
          allowClear
          style={{ width: 150 }}
          options={[
            { label: t("ecommerce.promptTemplates.allCategories"), value: "" },
            { label: "Electronics", value: "electronics" },
            { label: "Home", value: "home" },
            { label: "Clothing", value: "clothing" },
            { label: "Beauty", value: "beauty" },
            { label: "Sports", value: "sports" },
            { label: "Generic", value: "generic" },
          ]}
        />
        <Select
          placeholder={t(
            "ecommerce.promptTemplates.filterPlatform",
          )}
          value={pt.platformFilter || undefined}
          onChange={(val) => pt.setPlatformFilter(val || "")}
          allowClear
          style={{ width: 130 }}
          options={[
            { label: t("ecommerce.promptTemplates.allPlatforms"), value: "" },
            { label: "Amazon", value: "amazon" },
            { label: "eBay", value: "ebay" },
          ]}
        />
        <Select
          placeholder={t(
            "ecommerce.promptTemplates.filterMarketplace",
          )}
          value={pt.marketplaceFilter || undefined}
          onChange={(val) => pt.setMarketplaceFilter(val || "")}
          allowClear
          style={{ width: 110 }}
          options={[
            {
              label: t(
                "ecommerce.promptTemplates.allMarketplaces",
              ),
              value: "",
            },
            { label: "US", value: "us" },
            { label: "DE", value: "de" },
            { label: "JP", value: "jp" },
            { label: "UK", value: "uk" },
            { label: "FR", value: "fr" },
          ]}
        />
        <Button
          type="primary"
          icon={<Plus size={14} />}
          onClick={handleAdd}
        >
          {t("ecommerce.promptTemplates.createBtn")}
        </Button>
        {selectedRowKeys.length > 0 && (
          <Popconfirm
            title={t(
              "ecommerce.promptTemplates.batchDeleteConfirm",
              { count: selectedRowKeys.length },
            )}
            onConfirm={handleBatchDelete}
            okText={t("ecommerce.promptTemplates.confirm")}
            cancelText={t("ecommerce.promptTemplates.cancel")}
          >
            <Button
              danger
              icon={<Trash2 size={14} />}
              loading={batchDeleting}
            >
              {t("ecommerce.promptTemplates.batchDeleteBtn", {
                count: selectedRowKeys.length,
              })}
            </Button>
          </Popconfirm>
        )}
      </Space>
      <Table
        columns={columns}
        dataSource={pt.templates}
        rowKey="id"
        loading={pt.loading}
        size="small"
        scroll={{ x: 1000 }}
        rowSelection={{
          selectedRowKeys,
          onChange: (keys: React.Key[]) =>
            setSelectedRowKeys(keys),
        }}
        pagination={{
          current: pt.page,
          total: pt.total,
          pageSize: 20,
          onChange: pt.setPage,
          showTotal: (total) =>
            `${total} ${t("ecommerce.promptTemplates.totalItems")}`,
        }}
      />
      <PromptDrawer
        open={drawerOpen}
        template={editingTemplate}
        onClose={() => {
          setDrawerOpen(false);
          setEditingTemplate(null);
        }}
        onSave={handleDrawerSave}
      />
    </div>
  );
}
