import { Routes, Route, Navigate } from "react-router-dom";
import ErpListing from "./ErpListing";
import TagManager from "./TagManager";
import KeywordMonitorKimi from "./KeywordMonitorKimi";
import KeywordMonitorGemini from "./KeywordMonitorGemini";
import SellerSpriteTools from "./SellerSpriteTools";
import SellerSpriteHome from "./SellerSpriteHome";
import CopywritingAnalysis from "./CopywritingAnalysis";
import AiAssistant from "./AiAssistant";
import AiProductIntro from "./AiProductIntro";
import AiProductImage from "./AiProductImage";
import CalendarPage from "./Calendar";
import ProductLanding from "./ProductLanding";
import KimiChat from "./KimiChat";

function SellerTools() {
  return (
    <div style={{ padding: 24 }}>
      <Routes>
        <Route path="/" element={<Navigate to="erp-listing" replace />} />
        <Route path="/erp-listing" element={<ErpListing />} />
        <Route path="/tag-manager" element={<TagManager />} />
        <Route path="/keyword-kimi" element={<KeywordMonitorKimi />} />
        <Route path="/keyword-gemini" element={<KeywordMonitorGemini />} />
        <Route path="/seller-sprite-tools" element={<SellerSpriteTools />} />
        <Route path="/seller-sprite-home" element={<SellerSpriteHome />} />
        <Route path="/copywriting" element={<CopywritingAnalysis />} />
        <Route path="/ai-assistant" element={<AiAssistant />} />
        <Route path="/ai-product-intro" element={<AiProductIntro />} />
        <Route path="/ai-product-image" element={<AiProductImage />} />
        <Route path="/calendar" element={<CalendarPage />} />
        <Route path="/product-landing" element={<ProductLanding />} />
        <Route path="/kimi-chat" element={<KimiChat />} />
      </Routes>
    </div>
  );
}

export default SellerTools;
