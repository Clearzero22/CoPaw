import { useState } from "react";
import { Card } from "antd";
import FilterBar from "./components/FilterBar";
import ActionBar from "./components/ActionBar";
import ListingTable from "./components/ListingTable";
import Pagination from "./components/Pagination";
import StatsModal from "./components/StatsModal";
import styles from "./index.module.less";

export default function ErpListing() {
  const [statsOpen, setStatsOpen] = useState(false);

  return (
    <div className={styles.erpListing}>
      <FilterBar />

      <Card className={styles.contentCard} bordered={false} bodyStyle={{ padding: 0, display: "flex", flexDirection: "column", flex: 1, overflow: "hidden" }}>
        <ActionBar />
        <ListingTable onOpenStats={() => setStatsOpen(true)} />
        <Pagination />
      </Card>

      <StatsModal open={statsOpen} onClose={() => setStatsOpen(false)} />
    </div>
  );
}
