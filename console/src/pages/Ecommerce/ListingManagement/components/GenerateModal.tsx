import { useState } from "react";
import {
  Modal,
  Input,
  Select,
  Button,
  Steps,
  Tag,
} from "@agentscope-ai/design";
import { Space, Typography, Descriptions } from "antd";
import { Sparkles } from "lucide-react";
import { useTranslation } from "react-i18next";
import { getApiUrl } from "../../../../api/config";
import type { ListingInfo } from "../../../../api/types";

interface GenerateModalProps {
  open: boolean;
  onClose: () => void;
  onGenerated: (listing: ListingInfo) => void;
}

type Step = "input" | "progress" | "result";

export function GenerateModal({
  open,
  onClose,
  onGenerated,
}: GenerateModalProps) {
  const { t } = useTranslation();

  const [step, setStep] = useState<Step>("input");
  const [asin, setAsin] = useState("");
  const [keyword, setKeyword] = useState("");
  const [platform, setPlatform] = useState("amazon");
  const [marketplace, setMarketplace] = useState("us");
  const [statusText, setStatusText] = useState("");
  const [result, setResult] = useState<ListingInfo | null>(null);

  const handleGenerate = async () => {
    setStep("progress");
    setStatusText(t("ecommerce.listingManagement.generateScraping"));

    try {
      const response = await fetch(
        getApiUrl("/listings/generate"),
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            asin: asin || undefined,
            keyword: keyword || undefined,
            platform,
            marketplace,
          }),
        },
      );

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const reader = response.body?.getReader();
      if (!reader) throw new Error("No response body");

      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() || "";

        for (let i = 0; i < lines.length; i++) {
          const line = lines[i];
          if (line.startsWith("event: ")) {
            const eventType = line.slice(7).trim();
            const nextLine = lines[i + 1];
            if (nextLine?.startsWith("data: ")) {
              const data = nextLine.slice(6);
              if (eventType === "status") {
                setStatusText(
                  data === "scraping"
                    ? t(
                        "ecommerce.listingManagement.generateScraping",
                      )
                    : t(
                        "ecommerce.listingManagement.generateGenerating",
                      ),
                );
              } else if (eventType === "result") {
                const listing = JSON.parse(data);
                setResult(listing);
                setStep("result");
              } else if (eventType === "done") {
                // done
              } else if (eventType === "error") {
                const err = JSON.parse(data);
                throw new Error(err.message);
              }
            }
          }
        }
      }
    } catch (error: unknown) {
      console.error("Generate failed:", error);
      setStatusText(
        t("ecommerce.listingManagement.generateError") +
          ": " +
          (error instanceof Error ? error.message : String(error)),
      );
      setStep("progress");
    }
  };

  const handleClose = () => {
    setStep("input");
    setAsin("");
    setKeyword("");
    setStatusText("");
    setResult(null);
    onClose();
  };

  const handleSave = () => {
    if (result) {
      onGenerated(result);
      handleClose();
    }
  };

  const currentStep =
    step === "input" ? 0 : step === "progress" ? 1 : 2;

  return (
    <Modal
      open={open}
      onCancel={handleClose}
      title={
        <Space>
          <Sparkles size={18} />
          {t("ecommerce.listingManagement.generateTitle")}
        </Space>
      }
      footer={
        step === "result"
          ? [
              <Button key="cancel" onClick={handleClose}>
                {t("ecommerce.listingManagement.close")}
              </Button>,
              <Button key="save" type="primary" onClick={handleSave}>
                {t("ecommerce.listingManagement.save")}
              </Button>,
            ]
          : step === "input"
            ? [
                <Button key="cancel" onClick={handleClose}>
                  {t("ecommerce.listingManagement.cancel")}
                </Button>,
                <Button
                  key="generate"
                  type="primary"
                  onClick={handleGenerate}
                  disabled={!asin && !keyword}
                >
                  {t("ecommerce.listingManagement.generateStart")}
                </Button>,
              ]
            : null
      }
      width={640}
    >
      <Steps
        current={currentStep}
        size="small"
        items={[
          { title: t("ecommerce.listingManagement.generateAsin") },
          { title: "Progress" },
          { title: "Result" },
        ]}
        style={{ marginBottom: 24 }}
      />

      {step === "input" && (
        <Space
          direction="vertical"
          style={{ width: "100%" }}
          size="middle"
        >
          <div>
            <div style={{ marginBottom: 4 }}>
              {t("ecommerce.listingManagement.generatePlatform")}
            </div>
            <Select
              value={platform}
              onChange={setPlatform}
              style={{ width: "100%" }}
              options={[
                { value: "amazon", label: "Amazon" },
                { value: "ebay", label: "eBay" },
                { value: "shopify", label: "Shopify" },
              ]}
            />
          </div>
          <div>
            <div style={{ marginBottom: 4 }}>
              {t(
                "ecommerce.listingManagement.generateMarketplace",
              )}
            </div>
            <Select
              value={marketplace}
              onChange={setMarketplace}
              style={{ width: "100%" }}
              options={[
                { value: "us", label: "US" },
                { value: "de", label: "DE" },
                { value: "jp", label: "JP" },
                { value: "uk", label: "UK" },
                { value: "fr", label: "FR" },
                { value: "it", label: "IT" },
                { value: "es", label: "ES" },
                { value: "ca", label: "CA" },
              ]}
            />
          </div>
          <div>
            <div style={{ marginBottom: 4 }}>
              {t("ecommerce.listingManagement.generateAsin")}
            </div>
            <Input
              placeholder={t(
                "ecommerce.listingManagement.generatePlaceholder",
              )}
              value={asin}
              onChange={(e) => setAsin(e.target.value)}
            />
          </div>
          <div style={{ textAlign: "center", color: "#999" }}>
            — or —
          </div>
          <div>
            <div style={{ marginBottom: 4 }}>
              {t("ecommerce.listingManagement.generateKeyword")}
            </div>
            <Input
              placeholder={t(
                "ecommerce.listingManagement.generatePlaceholder",
              )}
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
            />
          </div>
        </Space>
      )}

      {step === "progress" && (
        <div style={{ textAlign: "center", padding: "40px 0" }}>
          <div
            style={{
              width: 40,
              height: 40,
              border: "3px solid #f0f0f0",
              borderTop: "3px solid #615ced",
              borderRadius: "50%",
              animation: "lm-spin 1s linear infinite",
              margin: "0 auto",
            }}
          />
          <div style={{ marginTop: 16, fontSize: 16 }}>
            {statusText}
          </div>
          <style>{`@keyframes lm-spin { to { transform: rotate(360deg); } }`}</style>
        </div>
      )}

      {step === "result" && result && (
        <Descriptions column={1} bordered size="small">
          <Descriptions.Item label="Title">
            <Typography.Paragraph ellipsis={{ rows: 3 }}>
              {result.title}
            </Typography.Paragraph>
          </Descriptions.Item>
          <Descriptions.Item label="Bullet Points">
            <ul style={{ margin: 0, paddingLeft: 20 }}>
              {result.bullet_points?.map((bp, i) => (
                <li key={i}>{bp}</li>
              ))}
            </ul>
          </Descriptions.Item>
          <Descriptions.Item label="Description">
            <Typography.Paragraph ellipsis={{ rows: 4 }}>
              {result.description}
            </Typography.Paragraph>
          </Descriptions.Item>
          <Descriptions.Item label="Search Terms">
            {result.search_terms?.map((st) => (
              <Tag key={st} style={{ marginBottom: 4 }}>
                {st}
              </Tag>
            ))}
          </Descriptions.Item>
        </Descriptions>
      )}
    </Modal>
  );
}
