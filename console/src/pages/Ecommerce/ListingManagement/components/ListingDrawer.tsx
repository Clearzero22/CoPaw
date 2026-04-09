import { useEffect } from "react";
import { Drawer, Form, Input, Select, Button } from "@agentscope-ai/design";
import { Space } from "antd";
import { useTranslation } from "react-i18next";
import type { ListingInfo } from "../../../../api/types";

interface ListingDrawerProps {
  open: boolean;
  listing: ListingInfo | null;
  onClose: () => void;
  onSave: (values: Record<string, unknown>) => Promise<boolean>;
}

const PLATFORM_OPTIONS = [
  { value: "amazon", label: "Amazon" },
  { value: "ebay", label: "eBay" },
  { value: "shopify", label: "Shopify" },
];

const MARKETPLACE_OPTIONS = [
  { value: "us", label: "US" },
  { value: "de", label: "DE" },
  { value: "jp", label: "JP" },
  { value: "uk", label: "UK" },
  { value: "fr", label: "FR" },
  { value: "it", label: "IT" },
  { value: "es", label: "ES" },
  { value: "ca", label: "CA" },
];

const STATUS_OPTIONS = [
  { value: "draft", labelKey: "statusDraft" },
  { value: "generated", labelKey: "statusGenerated" },
  { value: "published", labelKey: "statusPublished" },
  { value: "archived", labelKey: "statusArchived" },
];

export function ListingDrawer({
  open,
  listing,
  onClose,
  onSave,
}: ListingDrawerProps) {
  const { t } = useTranslation();
  const [form] = Form.useForm();
  const isEditing = !!listing;

  useEffect(() => {
    if (open) {
      if (listing) {
        form.setFieldsValue(listing);
      } else {
        form.resetFields();
        form.setFieldsValue({
          platform: "amazon",
          status: "draft",
          bullet_points: [],
          search_terms: [],
        });
      }
    }
  }, [open, listing, form]);

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      const ok = await onSave(values);
      if (ok) {
        onClose();
      }
    } catch {
      // validation failed, form shows errors automatically
    }
  };

  return (
    <Drawer
      open={open}
      onClose={onClose}
      width={600}
      title={
        isEditing
          ? t("ecommerce.listingManagement.editTitle")
          : t("ecommerce.listingManagement.createTitle")
      }
      destroyOnClose
      footer={
        <Space>
          <Button onClick={onClose}>
            {t("ecommerce.listingManagement.cancel")}
          </Button>
          <Button type="primary" onClick={handleSubmit}>
            {t("ecommerce.listingManagement.save")}
          </Button>
        </Space>
      }
    >
      <Form form={form} layout="vertical">
        <Form.Item
          name="title"
          label={t("ecommerce.listingManagement.formTitle")}
          rules={[{ required: true }]}
        >
          <Input placeholder={t("ecommerce.listingManagement.formTitle")} />
        </Form.Item>

        <Form.Item
          name="asin"
          label={t("ecommerce.listingManagement.formAsin")}
        >
          <Input placeholder="B0XXXXXXXXX" />
        </Form.Item>

        <Form.Item
          name="price"
          label={t("ecommerce.listingManagement.formPrice")}
        >
          <Input placeholder="29.99" />
        </Form.Item>

        <Form.Item
          name="platform"
          label={t("ecommerce.listingManagement.formPlatform")}
        >
          <Select options={PLATFORM_OPTIONS} />
        </Form.Item>

        <Form.Item
          name="marketplace"
          label={t("ecommerce.listingManagement.formMarketplace")}
        >
          <Select options={MARKETPLACE_OPTIONS} />
        </Form.Item>

        <Form.Item
          name="status"
          label={t("ecommerce.listingManagement.formStatus")}
        >
          <Select
            options={STATUS_OPTIONS.map((opt) => ({
              value: opt.value,
              label: t(`ecommerce.listingManagement.${opt.labelKey}`),
            }))}
          />
        </Form.Item>

        <Form.Item
          name="bullet_points"
          label={t("ecommerce.listingManagement.formBulletPoints")}
        >
          <Select
            mode="tags"
            placeholder={t(
              "ecommerce.listingManagement.formBulletPointsPlaceholder",
            )}
            tokenSeparators={[","]}
          />
        </Form.Item>

        <Form.Item
          name="search_terms"
          label={t("ecommerce.listingManagement.formSearchTerms")}
        >
          <Select
            mode="tags"
            placeholder={t(
              "ecommerce.listingManagement.formSearchTermsPlaceholder",
            )}
            tokenSeparators={[","]}
          />
        </Form.Item>

        <Form.Item
          name="description"
          label={t("ecommerce.listingManagement.formDescription")}
        >
          <Input.TextArea rows={4} />
        </Form.Item>

        <Form.Item
          name="image_url"
          label={t("ecommerce.listingManagement.formImageUrl")}
        >
          <Input placeholder="https://..." />
        </Form.Item>
      </Form>
    </Drawer>
  );
}
