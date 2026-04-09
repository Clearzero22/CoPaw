import { useState } from "react";
import {
  Card,
  Table,
  Input,
  Select,
  Button,
  Popconfirm,
  message,
  Upload,
} from "@agentscope-ai/design";
import { Space } from "antd";
import {
  Plus,
  Sparkles,
  Upload as UploadIcon,
  Download,
  Trash2,
  Search,
} from "lucide-react";
import { useTranslation } from "react-i18next";
import { useListings } from "./useListings";
import { createColumns } from "./components/columns";
import { GenerateModal } from "./components/GenerateModal";
import { ListingDrawer } from "./components/ListingDrawer";
import styles from "./index.module.less";
import type { ListingInfo } from "../../../api/types";
import api from "../../../api";

function ListingManagement() {
  const { t } = useTranslation();
  const {
    listings,
    loading,
    search,
    setSearch,
    statusFilter,
    setStatusFilter,
    fetchListings,
    createListing,
    updateListing,
    deleteListing,
    deleteBatch,
  } = useListings();

  const [generateOpen, setGenerateOpen] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editingRecord, setEditingRecord] = useState<ListingInfo | null>(null);
  const [selectedRowKeys, setSelectedRowKeys] = useState<string[]>([]);

  const handleCopy = (record: ListingInfo) => {
    const text = `${record.title}\n${record.bullet_points.join("\n")}\n${record.description}`;
    navigator.clipboard.writeText(text);
    message.success(t("common.copied"));
  };

  const handleEdit = (record: ListingInfo) => {
    setEditingRecord(record);
    setDrawerOpen(true);
  };

  const handleAdd = () => {
    setEditingRecord(null);
    setDrawerOpen(true);
  };

  const handleDrawerClose = () => {
    setDrawerOpen(false);
    setEditingRecord(null);
  };

  const handleDrawerSave = async (
    values: Record<string, unknown>,
  ) => {
    if (editingRecord) {
      return await updateListing(editingRecord.id, values);
    }
    return await createListing(values);
  };

  const handleDelete = async (id: string) => {
    await deleteListing(id);
    setSelectedRowKeys((prev) => prev.filter((k) => k !== id));
  };

  const handleBatchDelete = async () => {
    if (selectedRowKeys.length === 0) return;
    await deleteBatch(selectedRowKeys);
    setSelectedRowKeys([]);
  };

  const handleExport = () => {
    const url = api.getExportUrl({
      search: search || undefined,
      status: statusFilter || undefined,
    });
    window.open(url, "_blank");
  };

  const handleImport = async (file: File) => {
    try {
      const result = await api.importListings(file);
      if (result) {
        message.success(
          t("ecommerce.listingManagement.importSuccess").replace(
            "{imported}",
            String(result.imported),
          ),
        );
        fetchListings();
      }
    } catch (error) {
      message.error("Import failed");
    }
    return false;
  };

  const handleGenerated = () => {
    fetchListings();
  };

  const columns = createColumns({
    onEdit: handleEdit,
    onDelete: handleDelete,
    onCopy: handleCopy,
    t,
  });

  return (
    <div className={styles.listingManagement}>
      <Card>
        <div className={styles.toolbar}>
          <Space>
            <Button
              icon={<Plus size={16} />}
              onClick={handleAdd}
            >
              {t("ecommerce.listingManagement.addListing")}
            </Button>
            <Button
              type="primary"
              icon={<Sparkles size={16} />}
              onClick={() => setGenerateOpen(true)}
            >
              {t("ecommerce.listingManagement.aiGenerate")}
            </Button>
            <Upload
              accept=".csv"
              showUploadList={false}
              beforeUpload={handleImport}
            >
              <Button icon={<UploadIcon size={16} />}>
                {t("ecommerce.listingManagement.importCsv")}
              </Button>
            </Upload>
            <Button
              icon={<Download size={16} />}
              onClick={handleExport}
            >
              {t("ecommerce.listingManagement.exportCsv")}
            </Button>
          </Space>

          <div className={styles.filterGroup}>
            <Input
              placeholder={t(
                "ecommerce.listingManagement.searchPlaceholder",
              )}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              allowClear
              style={{ width: 240 }}
              prefix={<Search size={14} />}
            />
            <Select
              value={statusFilter}
              onChange={setStatusFilter}
              allowClear
              style={{ width: 130 }}
              options={[
                {
                  value: "",
                  label: t("ecommerce.listingManagement.all"),
                },
                {
                  value: "draft",
                  label: t(
                    "ecommerce.listingManagement.statusDraft",
                  ),
                },
                {
                  value: "generated",
                  label: t(
                    "ecommerce.listingManagement.statusGenerated",
                  ),
                },
                {
                  value: "published",
                  label: t(
                    "ecommerce.listingManagement.statusPublished",
                  ),
                },
                {
                  value: "archived",
                  label: t(
                    "ecommerce.listingManagement.statusArchived",
                  ),
                },
              ]}
            />
            {selectedRowKeys.length > 0 && (
              <Popconfirm
                title={t(
                  "ecommerce.listingManagement.deleteBatchConfirm",
                ).replace(
                  "{count}",
                  String(selectedRowKeys.length),
                )}
                onConfirm={handleBatchDelete}
              >
                <Button danger icon={<Trash2 size={16} />}>
                  {t(
                    "ecommerce.listingManagement.deleteSelected",
                  )}{" "}
                  ({selectedRowKeys.length})
                </Button>
              </Popconfirm>
            )}
          </div>
        </div>

        <Table
          rowKey="id"
          columns={columns}
          dataSource={listings}
          loading={loading}
          pagination={{ pageSize: 10, showSizeChanger: true }}
          rowSelection={{
            selectedRowKeys,
            onChange: (keys) =>
              setSelectedRowKeys(keys as string[]),
          }}
          locale={{
            emptyText: t(
              "ecommerce.listingManagement.noData",
            ),
          }}
        />
      </Card>

      <GenerateModal
        open={generateOpen}
        onClose={() => setGenerateOpen(false)}
        onGenerated={handleGenerated}
      />

      <ListingDrawer
        open={drawerOpen}
        listing={editingRecord}
        onClose={handleDrawerClose}
        onSave={handleDrawerSave}
      />
    </div>
  );
}

export default ListingManagement;
