import { useState, useRef, useEffect, useCallback } from "react";
import {
  Card,
  Table,
  Tag,
  Button,
  Input,
  Select,
  Checkbox,
  Space,
  Typography,
  Modal,
  Dropdown,
} from "antd";
import type { TableColumnsType } from "antd";
import {
  ChevronDown,
  Plus,
  Search,
  Link,
  Wand2,
  UserPlus,
  Barcode,
  Download,
  Maximize2,
  BarChart2,
  FileText,
  ImageIcon,
} from "lucide-react";
import { useTranslation } from "react-i18next";
import {
  listingRows,
  tagOptions,
  subTabs,
  filterButtons,
} from "./mockData";
import type { TagItem, ListingRow } from "./mockData";
import styles from "./index.module.less";

const { Text } = Typography;

const tagColorMap: Record<string, string> = {
  blue: "blue",
  green: "green",
  red: "red",
  orange: "orange",
  default: "default",
};

function getTagColor(color: string): string {
  return tagColorMap[color] || "default";
}

export default function TagManager() {
  const { t } = useTranslation();
  const [activeSubTab, setActiveSubTab] = useState<string>("字体");
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedTags, setSelectedTags] = useState<TagItem[]>([]);
  const [inputValue, setInputValue] = useState("");
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [selectedRowKeys, setSelectedRowKeys] = useState<string[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown on outside click
  const handleClickOutside = useCallback((e: MouseEvent) => {
    if (
      inputRef.current &&
      dropdownRef.current &&
      !inputRef.current.contains(e.target as Node) &&
      !dropdownRef.current.contains(e.target as Node)
    ) {
      setDropdownOpen(false);
    }
  }, []);

  useEffect(() => {
    document.addEventListener("click", handleClickOutside);
    return () => document.removeEventListener("click", handleClickOutside);
  }, [handleClickOutside]);

  function selectTag(tag: TagItem) {
    if (!selectedTags.find((t) => t.label === tag.label)) {
      setSelectedTags([...selectedTags, tag]);
    }
    setInputValue("");
    setDropdownOpen(false);
  }

  function removeTag(index: number) {
    setSelectedTags(selectedTags.filter((_, i) => i !== index));
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Enter" && inputValue.trim()) {
      selectTag({ label: inputValue.trim(), color: "default" });
    }
  }

  const columns: TableColumnsType<ListingRow> = [
    {
      title: "",
      dataIndex: "id",
      width: 48,
      render: (_: unknown, record: ListingRow) => (
        <Checkbox
          checked={selectedRowKeys.includes(record.id)}
          onChange={(e) => {
            if (e.target.checked) {
              setSelectedRowKeys([...selectedRowKeys, record.id]);
            } else {
              setSelectedRowKeys(
                selectedRowKeys.filter((k) => k !== record.id),
              );
            }
          }}
        />
      ),
    },
    {
      title: t("sellerTools.tagManager.columnImage"),
      dataIndex: "image",
      width: 64,
      render: () => (
        <div className={styles.imagePlaceholder}>
          <ImageIcon size={16} />
        </div>
      ),
    },
    {
      title: t("sellerTools.tagManager.columnMsku"),
      dataIndex: "msku",
      width: 100,
      render: (text: string) => <Text style={{ fontSize: 12 }}>{text}</Text>,
    },
    {
      title: t("sellerTools.tagManager.columnStatus"),
      dataIndex: "statusText",
      width: 70,
      render: (text: string, record: ListingRow) => (
        <Tag
          color={record.status === "active" ? "success" : "default"}
          style={{ fontSize: 12 }}
        >
          {text}
        </Tag>
      ),
    },
    {
      title: t("sellerTools.tagManager.columnAnalysis"),
      dataIndex: "analysis",
      width: 70,
      render: () => (
        <Space size={4}>
          <BarChart2 size={14} style={{ color: "#999" }} />
          <FileText size={14} style={{ color: "#999" }} />
        </Space>
      ),
    },
    {
      title: t("sellerTools.tagManager.columnAsin"),
      dataIndex: "asin",
      width: 100,
      render: (text: string) => (
        <span className={styles.asinLink} style={{ fontSize: 12 }}>
          {text}
        </span>
      ),
    },
    {
      title: t("sellerTools.tagManager.columnTitle"),
      dataIndex: "title",
      ellipsis: true,
      render: (text: string) => (
        <Text style={{ fontSize: 12 }} ellipsis>
          {text}
        </Text>
      ),
    },
    {
      title: t("sellerTools.tagManager.columnPrice"),
      dataIndex: "price",
      width: 90,
      render: (value: number) => (
        <Text style={{ fontSize: 12 }}>
          ${value.toFixed(2)}
        </Text>
      ),
    },
    {
      title: t("sellerTools.tagManager.columnFbaStock"),
      dataIndex: "fbaStock",
      width: 80,
      render: (value: number) => (
        <Text style={{ fontSize: 12 }}>{value}</Text>
      ),
    },
    {
      title: t("sellerTools.tagManager.columnEstimatedFbaFee"),
      dataIndex: "estimatedFbaFee",
      width: 100,
      render: (value: number) => (
        <Text style={{ fontSize: 12 }}>
          ${value.toFixed(2)}
        </Text>
      ),
    },
    {
      title: t("sellerTools.tagManager.columnActions"),
      dataIndex: "actions",
      width: 140,
      render: () => (
        <Space size={8}>
          <button className={styles.actionBtn}>
            {t("sellerTools.tagManager.adCampaign")}
          </button>
          <Dropdown
            menu={{
              items: [
                {
                  key: "edit",
                  label: t("sellerTools.tagManager.actionEdit"),
                },
                {
                  key: "delete",
                  label: t("sellerTools.tagManager.actionDelete"),
                  danger: true,
                },
              ],
            }}
            trigger={["click"]}
          >
            <button className={styles.actionBtnDefault}>
              {t("sellerTools.tagManager.actions")}
              <ChevronDown size={12} />
            </button>
          </Dropdown>
        </Space>
      ),
    },
  ];

  const secondaryToolbar = [
    {
      label: t("sellerTools.tagManager.pair"),
      icon: <Link size={12} />,
    },
    {
      label: t("sellerTools.tagManager.autoPair"),
      icon: <Wand2 size={12} />,
    },
    {
      label: t("sellerTools.tagManager.assignPerson"),
      icon: <UserPlus size={12} />,
    },
    {
      label: t("sellerTools.tagManager.printFnsku"),
      icon: <Barcode size={12} />,
    },
    {
      label: t("sellerTools.tagManager.import"),
      icon: <Download size={12} />,
      hasDropdown: true,
    },
    {
      label: t("sellerTools.tagManager.actions"),
      icon: null,
      hasDropdown: true,
    },
  ];

  return (
    <div className={styles.tagManager}>
      <Card bordered={false} bodyStyle={{ padding: 0 }}>
        {/* Filter bar */}
        <div className={styles.filterBar}>
          <div className={styles.subTabGroup}>
            {subTabs.map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveSubTab(tab)}
                className={`${styles.subTabBtn} ${activeSubTab === tab ? styles.active : ""} ${tab === "SC" && activeSubTab !== tab ? styles.scDefault : ""}`}
              >
                {tab}
              </button>
            ))}
          </div>

          <div className={styles.divider} />

          {filterButtons.map((label) => (
            <Button key={label} size="small" type="text" icon={<ChevronDown size={10} />}>
              {label}
            </Button>
          ))}

          <div style={{ flex: 1 }} />

          <div className={styles.searchField}>
            <Search size={12} style={{ color: "#999", marginRight: 8 }} />
            <input
              type="text"
              placeholder={t("sellerTools.tagManager.preciseSearch")}
              className={styles.searchInput}
            />
            <span className={styles.searchSuffix}>MSKU</span>
            <ChevronDown size={12} style={{ color: "#999" }} />
          </div>

          <button className={styles.expandBtn}>
            <Maximize2 size={14} />
          </button>

          <Button size="small" type="text">
            {t("sellerTools.tagManager.reset")}
          </Button>
        </div>

        {/* Secondary toolbar */}
        <div className={styles.toolbar}>
          {secondaryToolbar.map((btn) =>
            btn.hasDropdown ? (
              <Dropdown
                key={btn.label}
                menu={{
                  items: [
                    { key: "opt1", label: `${btn.label} 选项1` },
                    { key: "opt2", label: `${btn.label} 选项2` },
                  ],
                }}
                trigger={["click"]}
              >
                <Button
                  key={btn.label}
                  size="small"
                  type="text"
                  icon={btn.icon}
                  iconPosition="start"
                >
                  {btn.label}
                </Button>
              </Dropdown>
            ) : (
              <Button
                key={btn.label}
                size="small"
                type="text"
                icon={btn.icon}
                iconPosition="start"
              >
                {btn.label}
              </Button>
            ),
          )}
        </div>

        {/* Data table */}
        <div className={styles.tableWrapper}>
          <Table<ListingRow>
            rowKey="id"
            columns={columns}
            dataSource={listingRows}
            pagination={false}
            size="small"
            rowSelection={{
              selectedRowKeys,
              onChange: (keys) => setSelectedRowKeys(keys as string[]),
            }}
          />

          {/* Pagination */}
          <div className={styles.pagination}>
            <Text style={{ fontSize: 12, color: "#999" }}>
              {t("sellerTools.tagManager.totalItems", { total: 23 })}
            </Text>
            <Space size={4} align="center">
              <Select
                size="small"
                value="50"
                style={{ width: 90 }}
                options={[
                  { value: "10", label: "10条/页" },
                  { value: "20", label: "20条/页" },
                  { value: "50", label: "50条/页" },
                  { value: "100", label: "100条/页" },
                ]}
              />
              <Text style={{ fontSize: 12, color: "#999" }}>
                {t("sellerTools.tagManager.goTo")}
              </Text>
              <Input
                size="small"
                value={String(currentPage)}
                onChange={(e) => setCurrentPage(Number(e.target.value) || 1)}
                style={{ width: 48, textAlign: "center" }}
              />
              <Text style={{ fontSize: 12, color: "#999" }}>
                {t("sellerTools.tagManager.page")}
              </Text>
            </Space>
          </div>
        </div>
      </Card>

      {/* Add Tag Modal */}
      <Modal
        title={t("sellerTools.tagManager.addListingTag")}
        open={modalOpen}
        onCancel={() => setModalOpen(false)}
        width={480}
        footer={null}
        destroyOnClose
      >
        <div style={{ padding: "16px 0" }}>
          {/* Tag input field */}
          <div style={{ position: "relative", marginBottom: 16 }}>
            <div style={{ position: "relative" }}>
              {/* Hint tooltip */}
              <div className={styles.tagHint}>
                <span className={styles.tagHintNumber}>1</span>
                {t("sellerTools.tagManager.selectExistingTag")}
              </div>

              <div style={{ position: "relative" }}>
                <input
                  ref={inputRef}
                  type="text"
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  onKeyDown={handleKeyDown}
                  onFocus={() => setDropdownOpen(true)}
                  placeholder={t("sellerTools.tagManager.selectOrInputTag")}
                  autoComplete="off"
                  style={{
                    width: "100%",
                    padding: "8px 12px",
                    fontSize: 14,
                    borderRadius: 6,
                    border: "1px solid #d9d9d9",
                    background: "#fff",
                    outline: "none",
                  }}
                />
                <button
                  onClick={() => setDropdownOpen(!dropdownOpen)}
                  style={{
                    position: "absolute",
                    right: 12,
                    top: "50%",
                    transform: "translateY(-50%)",
                    background: "none",
                    border: "none",
                    cursor: "pointer",
                    color: "#999",
                    padding: 0,
                    display: "flex",
                    alignItems: "center",
                  }}
                >
                  <ChevronDown size={12} />
                </button>
              </div>

              {/* Dropdown list */}
              {dropdownOpen && (
                <div
                  ref={dropdownRef}
                  style={{
                    position: "absolute",
                    top: "100%",
                    left: 0,
                    right: 0,
                    marginTop: 4,
                    background: "#fff",
                    border: "1px solid #f0f0f0",
                    borderRadius: 6,
                    boxShadow: "0 6px 16px rgba(0, 0, 0, 0.08)",
                    maxHeight: 240,
                    overflow: "auto",
                    zIndex: 30,
                  }}
                >
                  {tagOptions.map((tag) => (
                    <div
                      key={tag.label}
                      className={styles.tagOption}
                      onClick={() => selectTag(tag)}
                    >
                      <span
                        className={styles.tagDot}
                        style={{
                          background:
                            tag.color === "blue"
                              ? "#1677ff"
                              : tag.color === "green"
                                ? "#52c41a"
                                : "#999",
                        }}
                      />
                      <span style={{ fontSize: 14 }}>{tag.label}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Selected tags */}
          <div className={styles.selectedTags}>
            {selectedTags.map((tag, index) => (
              <Tag
                key={tag.label}
                closable
                onClose={() => removeTag(index)}
                color={getTagColor(tag.color)}
              >
                {tag.label}
              </Tag>
            ))}
          </div>
        </div>

        {/* Modal footer */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            borderTop: "1px solid #f0f0f0",
            paddingTop: 16,
          }}
        >
          <div className={styles.createTagBtn}>
            <div className={styles.newTagHint}>
              <span className={styles.tagHintNumber}>2</span>
              {t("sellerTools.tagManager.createNewTagHint")}
            </div>
            <Button
              type="default"
              icon={<Plus size={14} />}
              style={{ fontWeight: 500 }}
            >
              {t("sellerTools.tagManager.createNewTag")}
            </Button>
          </div>

          <Space>
            <Button onClick={() => setModalOpen(false)}>
              {t("sellerTools.tagManager.cancel")}
            </Button>
            <Button
              type="primary"
              disabled={selectedTags.length === 0}
              onClick={() => {
                setModalOpen(false);
                setSelectedTags([]);
              }}
            >
              {t("sellerTools.tagManager.confirm")}
            </Button>
          </Space>
        </div>
      </Modal>
    </div>
  );
}
