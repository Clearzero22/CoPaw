import { Routes, Route, Navigate } from "react-router-dom";

import Dify from "./Dify";
import N8n from "./N8n";
import History from "./History";

function Integration() {
  return (
    <div style={{ padding: "24px" }}>
      <Routes>
        <Route path="/" element={<Navigate to="dify" replace />} />
        <Route path="/dify" element={<Dify />} />
        <Route path="/n8n" element={<N8n />} />
        <Route path="/history" element={<History />} />
      </Routes>
    </div>
  );
}

export default Integration;
