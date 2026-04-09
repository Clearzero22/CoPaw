import { useState } from "react";
import { Select, Input } from "antd";
import { useTranslation } from "react-i18next";
import styles from "../index.module.less";

export default function Pagination() {
  const { t } = useTranslation();
  const [currentPage, setCurrentPage] = useState(1);

  return (
    <div className={styles.paginationRow}>
      <span>{t("sellerTools.erpListing.totalItems", { total: 23 })}</span>

      <Select
        size="small"
        value="50"
        style={{ width: 100 }}
        options={[
          { value: "10", label: t("sellerTools.erpListing.itemsPerPage", { count: 10 }) },
          { value: "20", label: t("sellerTools.erpListing.itemsPerPage", { count: 20 }) },
          { value: "50", label: t("sellerTools.erpListing.itemsPerPage", { count: 50 }) },
          { value: "100", label: t("sellerTools.erpListing.itemsPerPage", { count: 100 }) },
        ]}
      />

      <span>{t("sellerTools.erpListing.goTo")}</span>
      <Input
        size="small"
        value={String(currentPage)}
        onChange={(e) => setCurrentPage(Number(e.target.value) || 1)}
        style={{ width: 48, textAlign: "center" }}
      />
      <span>{t("sellerTools.erpListing.page")}</span>
    </div>
  );
}
