import { Routes, Route, Navigate } from "react-router-dom";
import ProductResearch from "./ProductResearch";
import CompetitorAnalysis from "./CompetitorAnalysis";
import KeywordResearch from "./KeywordResearch";
import SupplierManagement from "./SupplierManagement";
import ListingManagement from "./ListingManagement";
import CrawlerData from "./CrawlerData";
import XiYouZhaoCi from "./XiYouZhaoCi";
import PromptTemplates from "./PromptTemplates";

function Ecommerce() {
  return (
    <div style={{ padding: "24px" }}>
      <Routes>
        <Route path="/" element={<Navigate to="product-research" replace />} />
        <Route path="/product-research" element={<ProductResearch />} />
        <Route path="/competitor-analysis" element={<CompetitorAnalysis />} />
        <Route path="/keyword-research" element={<KeywordResearch />} />
        <Route path="/supplier-management" element={<SupplierManagement />} />
        <Route path="/listing-management" element={<ListingManagement />} />
        <Route path="/crawler-data" element={<CrawlerData />} />
        <Route path="/xiyouzhaoci" element={<XiYouZhaoCi />} />
        <Route path="/prompt-templates" element={<PromptTemplates />} />
      </Routes>
    </div>
  );
}

export default Ecommerce;
