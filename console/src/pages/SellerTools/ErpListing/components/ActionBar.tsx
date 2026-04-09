import { Button, Dropdown, Tooltip } from "antd";
import {
  ChevronDown,
  RefreshCw,
  Info,
  Download,
  LayoutGrid,
} from "lucide-react";
import { useTranslation } from "react-i18next";
import styles from "../index.module.less";

const secondaryButtons = [
  { key: "upload", icon: null },
  { key: "pair", icon: null },
  { key: "assignPerson", icon: null },
  { key: "batchPrint", icon: null },
] as const;

export default function ActionBar() {
  const { t } = useTranslation();

  return (
    <div className={styles.actionBar}>
      <div className={styles.leftActions}>
        <Button type="primary" size="small">
          {t("sellerTools.erpListing.addProduct")}
        </Button>

        {secondaryButtons.map((btn) => (
          <Dropdown
            key={btn.key}
            menu={{
              items: [
                { key: "opt1", label: `${btn.key} 选项1` },
                { key: "opt2", label: `${btn.key} 选项2` },
              ],
            }}
            trigger={["click"]}
          >
            <Button size="small" icon={<ChevronDown size={12} />} iconPosition="end">
              {t(`sellerTools.erpListing.${btn.key}`)}
            </Button>
          </Dropdown>
        ))}

        {/* Sync products with tooltip */}
        <Tooltip
          title={
            <div>
              <div style={{ fontWeight: 500, marginBottom: 4, display: "flex", alignItems: "center", gap: 4 }}>
                <Info size={12} style={{ color: "#1677ff" }} />
                {t("sellerTools.erpListing.clickToSync")}
              </div>
              <div style={{ color: "#999" }}>
                {t("sellerTools.erpListing.syncEstimate")}
              </div>
            </div>
          }
        >
          <Button size="small" danger ghost>
            {t("sellerTools.erpListing.syncProducts")}
          </Button>
        </Tooltip>

        <Dropdown
          menu={{
            items: [
              { key: "opt1", label: `${t("sellerTools.erpListing.batchAction")} 1` },
              { key: "opt2", label: `${t("sellerTools.erpListing.batchAction")} 2` },
            ],
          }}
          trigger={["click"]}
        >
          <Button size="small" icon={<ChevronDown size={12} />} iconPosition="end">
            {t("sellerTools.erpListing.batchAction")}
          </Button>
        </Dropdown>
      </div>

      <div className={styles.rightActions}>
        <Tooltip title={t("sellerTools.erpListing.refresh")}>
          <Button size="small" icon={<RefreshCw size={14} />} />
        </Tooltip>
        <Tooltip title={t("sellerTools.erpListing.info")}>
          <Button size="small" icon={<Info size={14} />} />
        </Tooltip>
        <Tooltip title={t("sellerTools.erpListing.download")}>
          <Button size="small" icon={<Download size={14} />} />
        </Tooltip>
        <Button
          size="small"
          icon={<LayoutGrid size={14} />}
          iconPosition="start"
        >
          {t("sellerTools.erpListing.columnConfig")}
        </Button>
      </div>
    </div>
  );
}
