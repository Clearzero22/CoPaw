import { useEffect } from "react";
import {
  Drawer,
  Form,
  Input,
  Select,
  Button,
} from "@agentscope-ai/design";
import { Space, message } from "antd";
import { useTranslation } from "react-i18next";
import type {
  PromptTemplate,
  PromptTemplateCreateInput,
} from "../../../../api/types";

interface PromptDrawerProps {
  open: boolean;
  template: PromptTemplate | null;
  onClose: () => void;
  onSave: (
    data: PromptTemplateCreateInput,
    isEditing: boolean,
  ) => Promise<boolean>;
}

const PLATFORMS = ["amazon", "ebay"];
const MARKETPLACES = ["us", "de", "jp", "uk", "fr"];
const CATEGORIES = [
  "electronics",
  "home",
  "clothing",
  "beauty",
  "sports",
  "generic",
];

const PROMPT_TABS = [
  {
    key: "title_prompt",
    label: "Title",
    field: "title_prompt",
  },
  {
    key: "bullet_prompt",
    label: "Bullets",
    field: "bullet_prompt",
  },
  {
    key: "description_prompt",
    label: "Description",
    field: "description_prompt",
  },
  {
    key: "keywords_prompt",
    label: "Keywords",
    field: "keywords_prompt",
  },
];

export function PromptDrawer({
  open,
  template,
  onClose,
  onSave,
}: PromptDrawerProps) {
  const { t } = useTranslation();
  const [form] = Form.useForm();
  const isEditing = !!template;

  useEffect(() => {
    if (open) {
      if (template) {
        form.setFieldsValue(template);
      } else {
        form.resetFields();
        form.setFieldsValue({
          platform: "amazon",
          marketplace: "us",
          category: "generic",
        });
      }
    }
  }, [open, template, form]);

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      const ok = await onSave(values, isEditing);
      if (ok) {
        onClose();
      } else {
        message.error(t("ecommerce.promptTemplates.saveFailed"));
      }
    } catch {
      // validation error shown by form
    }
  };

  return (
    <Drawer
      open={open}
      onClose={onClose}
      width={720}
      title={
        isEditing
          ? t("ecommerce.promptTemplates.editTitle")
          : t("ecommerce.promptTemplates.createTitle")
      }
      destroyOnClose
      footer={
        <Space>
          <Button onClick={onClose}>
            {t("ecommerce.promptTemplates.cancel")}
          </Button>
          <Button type="primary" onClick={handleSubmit}>
            {t("ecommerce.promptTemplates.saveBtn")}
          </Button>
        </Space>
      }
    >
      <Form form={form} layout="vertical">
        <Form.Item
          name="name"
          label={t("ecommerce.promptTemplates.fieldName")}
          rules={[
            { required: true, message: t("ecommerce.promptTemplates.nameRequired") },
          ]}
        >
          <Input
            placeholder={t(
              "ecommerce.promptTemplates.namePlaceholder",
            )}
          />
        </Form.Item>

        <Form.Item
          name="description"
          label={t("ecommerce.promptTemplates.fieldDescription")}
        >
          <Input.TextArea
            rows={2}
            placeholder={t(
              "ecommerce.promptTemplates.descPlaceholder",
            )}
          />
        </Form.Item>

        <Space style={{ display: "flex", gap: 16, width: "100%" }}>
          <Form.Item
            name="category"
            label={t("ecommerce.promptTemplates.fieldCategory")}
            style={{ flex: 1, marginBottom: 0 }}
          >
            <Select
              options={CATEGORIES.map((c) => ({
                label: c,
                value: c,
              }))}
              allowClear
            />
          </Form.Item>

          <Form.Item
            name="platform"
            label={t("ecommerce.promptTemplates.fieldPlatform")}
            style={{ flex: 1, marginBottom: 0 }}
          >
            <Select
              options={PLATFORMS.map((p) => ({
                label: p,
                value: p,
              }))}
            />
          </Form.Item>

          <Form.Item
            name="marketplace"
            label={t("ecommerce.promptTemplates.fieldMarketplace")}
            style={{ flex: 1, marginBottom: 0 }}
          >
            <Select
              options={MARKETPLACES.map((m) => ({
                label: m.toUpperCase(),
                value: m,
              }))}
            />
          </Form.Item>
        </Space>

        {PROMPT_TABS.map((tab) => (
          <Form.Item
            key={tab.key}
            name={tab.field}
            label={t(`ecommerce.promptTemplates.${tab.key}`)}
            style={{ marginTop: 16 }}
          >
            <Input.TextArea
              rows={6}
              placeholder={t(
                `ecommerce.promptTemplates.${tab.key}Placeholder`,
              )}
            />
          </Form.Item>
        ))}

        <div
          style={{
            marginTop: 8,
            marginBottom: 16,
            color: "#666",
            fontSize: 12,
          }}
        >
          {t("ecommerce.promptTemplates.fullPromptLabel")}
        </div>
        <Form.Item name="full_prompt">
          <Input.TextArea
            rows={8}
            placeholder={t(
              "ecommerce.promptTemplates.fullPromptPlaceholder",
            )}
          />
        </Form.Item>
      </Form>
    </Drawer>
  );
}
