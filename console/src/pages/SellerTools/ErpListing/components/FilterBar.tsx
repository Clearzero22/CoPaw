import { useState } from "react";
import { Select, Input, Button, Tooltip } from "antd";
import { Search, Filter, X } from "lucide-react";
import { useTranslation } from "react-i18next";
import { subTabs } from "../mockData";
import styles from "../index.module.less";

export default function FilterBar() {
  const { t } = useTranslation();
  const [activeSubTab, setActiveSubTab] = useState("子体");

  return (
    <div className={styles.filterCard}>
      <div className={styles.filterBar}>
        {/* Sub-tabs */}
        <div className={styles.subTabGroup}>
          {subTabs.map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveSubTab(tab)}
              className={`${styles.subTabBtn} ${activeSubTab === tab ? styles.active : ""}`}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* Filter row */}
        <div className={styles.filterRow}>
          <Select
            size="small"
            defaultValue="all"
            style={{ width: 120 }}
            options={[
              { value: "all", label: t("sellerTools.erpListing.allCountries") },
            ]}
          />
          <Select
            size="small"
            defaultValue="all"
            style={{ width: 120 }}
            options={[
              { value: "all", label: t("sellerTools.erpListing.allStores") },
            ]}
          />
          <Select
            size="small"
            defaultValue="active"
            style={{ width: 120 }}
            popupMatchSelectWidth={false}
            options={[
              {
                value: "active",
                label: (
                  <span style={{ color: "#1677ff" }}>
                    {t("sellerTools.erpListing.onSalePlus")}
                  </span>
                ),
              },
            ]}
          />
          <Select
            size="small"
            placeholder={t("sellerTools.erpListing.pairingStatus")}
            style={{ width: 120 }}
            options={[{ value: "", label: t("sellerTools.erpListing.pairingStatus") }]}
          />
          <Select
            size="small"
            placeholder={t("sellerTools.erpListing.deliveryMethod")}
            style={{ width: 120 }}
            options={[{ value: "", label: t("sellerTools.erpListing.deliveryMethod") }]}
          />

          {/* Search field */}
          <Input
            size="small"
            placeholder={t("sellerTools.erpListing.searchPlaceholder")}
            prefix={<Search size={14} style={{ color: "#999" }} />}
            addonBefore={
              <Select
                size="small"
                defaultValue="msku"
                variant="borderless"
                style={{ width: 70 }}
                options={[{ value: "msku", label: "MSKU" }]}
              />
            }
            style={{ width: 220 }}
          />

          <Tooltip title={t("sellerTools.erpListing.filterTooltip")}>
            <Button size="small" icon={<Filter size={14} />} />
          </Tooltip>
          <Button size="small" type="text">
            {t("sellerTools.erpListing.reset")}
          </Button>
        </div>

        {/* Active filter tags */}
        <div className={styles.activeFilterTag}>
          <span>
            {t("sellerTools.erpListing.statusFilter", {
              values: t("sellerTools.erpListing.onSaleStopped"),
            })}
          </span>
          <button className={styles.removeTag}>
            <X size={12} />
          </button>
          <span className={styles.clearAll}>
            {t("sellerTools.erpListing.clearAll")}
          </span>
        </div>
      </div>
    </div>
  );
}
