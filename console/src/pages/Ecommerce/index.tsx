import { Routes, Route, Navigate } from "react-router-dom";
import ProductResearch from "./ProductResearch";
import CompetitorAnalysis from "./CompetitorAnalysis";
import KeywordResearch from "./KeywordResearch";
import SupplierManagement from "./SupplierManagement";

function Ecommerce() {
  return (
    <div style={{ padding: "24px" }}>
      <Routes>
        <Route path="/" element={<Navigate to="product-research" replace />} />
        <Route path="/product-research" element={<ProductResearch />} />
        <Route path="/competitor-analysis" element={<CompetitorAnalysis />} />
        <Route path="/keyword-research" element={<KeywordResearch />} />
        <Route path="/supplier-management" element={<SupplierManagement />} />
      </Routes>
    </div>
  );
}

export default Ecommerce;
