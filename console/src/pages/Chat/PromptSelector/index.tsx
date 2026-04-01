import { useState, useEffect, useCallback } from "react";
import { Dropdown, message, Spin, Tag } from "antd";
import {
  DownOutlined,
  CheckOutlined,
  PlusOutlined,
} from "@ant-design/icons";
import { FileText } from "lucide-react";
import { useTranslation } from "react-i18next";
import styles from "./index.module.less";

export interface PromptTemplate {
  id: string;
  name: string;
  content: string;
  category?: string;
  description?: string;
  tags?: string[];
}

type PromptCategory = "all" | "system" | "user" | "custom";

export default function PromptSelector() {
  const { t } = useTranslation();
  const [prompts, setPrompts] = useState<PromptTemplate[]>([]);
  const [selectedPromptId, setSelectedPromptId] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const [activeCategory, setActiveCategory] =
    useState<PromptCategory>("all");

  // 获取预制 Prompt 列表
  const fetchPrompts = useCallback(async () => {
    setLoading(true);
    try {
      // 从 localStorage 获取用户保存的 prompts
      const savedPrompts = localStorage.getItem("user_prompts");
      const userPrompts: PromptTemplate[] = savedPrompts
        ? JSON.parse(savedPrompts)
        : [];

      // 预制系统 Prompts
      const systemPrompts: PromptTemplate[] = [
        {
          id: "code-review",
          name: "代码审查",
          category: "system",
          content:
            "请对以下代码进行审查，重点关注：\n1. 代码质量和可读性\n2. 潜在的 bug 和边界情况\n3. 性能优化建议\n4. 安全性问题",
          description: "专业的代码审查助手",
          tags: ["开发", "代码"],
        },
        {
          id: "translation",
          name: "翻译助手",
          category: "system",
          content:
            "请将以下内容翻译成{{target_lang}}，保持原意的同时使表达更自然、流畅。",
          description: "多语言翻译工具",
          tags: ["工具", "语言"],
        },
        {
          id: "summarization",
          name: "内容总结",
          category: "system",
          content:
            "请对以下内容进行总结，提取关键信息点，使其简洁明了。",
          description: "快速提取内容要点",
          tags: ["工具", "总结"],
        },
        {
          id: "creative-writing",
          name: "创意写作",
          category: "system",
          content:
            "作为一个创意写作助手，请根据以下主题创作一个引人入胜的故事，包含生动的描写和有趣的情节。",
          description: "激发创作灵感",
          tags: ["创作", "写作"],
        },
        {
          id: "data-analysis",
          name: "数据分析",
          category: "system",
          content:
            "请分析以下数据，提供：\n1. 数据趋势分析\n2. 关键洞察\n3. 可视化建议\n4. 后续行动建议",
          description: "专业的数据分析顾问",
          tags: ["分析", "数据"],
        },
        {
          id: "email-draft",
          name: "邮件草稿",
          category: "system",
          content:
            "请帮我起草一封{{tone}}的邮件，主题是{{subject}}，收件人是{{recipient}}，内容要点如下：",
          description: "快速撰写各类邮件",
          tags: ["办公", "写作"],
        },
      ];

      setPrompts([...systemPrompts, ...userPrompts]);
    } catch (err) {
      console.error("PromptSelector: failed to load prompts", err);
      message.error(t("promptSelector.loadFailed"));
    } finally {
      setLoading(false);
    }
  }, [t]);

  useEffect(() => {
    fetchPrompts();
  }, [fetchPrompts]);

  // 选择 Prompt
  const handleSelectPrompt = (prompt: PromptTemplate) => {
    setSelectedPromptId(prompt.id);
    setOpen(false);

    // 发送自定义事件，通知 Chat 页面插入 Prompt 内容
    window.dispatchEvent(
      new CustomEvent("prompt-selected", {
        detail: {
          id: prompt.id,
          name: prompt.name,
          content: prompt.content,
        },
      })
    );

    message.success(
      t("promptSelector.promptApplied", { name: prompt.name })
    );
  };

  // 过滤 Prompts
  const filteredPrompts = prompts.filter((prompt) => {
    if (activeCategory === "all") return true;
    if (activeCategory === "custom") return prompt.category === "custom";
    return prompt.category === activeCategory;
  });

  // 分类统计
  const categoryCount = {
    all: prompts.length,
    system: prompts.filter((p) => p.category === "system").length,
    user: prompts.filter((p) => p.category === "user").length,
    custom: prompts.filter((p) => p.category === "custom").length,
  };

  // 下拉内容
  const dropdownContent = (
    <div className={styles.panel}>
      {/* 分类标签栏 */}
      <div className={styles.categories}>
        {[
          { key: "all", label: t("promptSelector.category.all") },
          { key: "system", label: t("promptSelector.category.system") },
          { key: "user", label: t("promptSelector.category.user") },
          { key: "custom", label: t("promptSelector.category.custom") },
        ].map((cat) => (
          <div
            key={cat.key}
            className={[
              styles.categoryItem,
              activeCategory === cat.key ? styles.categoryActive : "",
            ].join(" ")}
            onClick={() => setActiveCategory(cat.key as PromptCategory)}
          >
            <span>{cat.label}</span>
            <span className={styles.categoryCount}>
              {categoryCount[cat.key as PromptCategory]}
            </span>
          </div>
        ))}
      </div>

      {/* Prompt 列表 */}
      {loading ? (
        <div className={styles.spinWrapper}>
          <Spin size="small" />
        </div>
      ) : filteredPrompts.length === 0 ? (
        <div className={styles.emptyTip}>
          {t("promptSelector.noPrompts")}
        </div>
      ) : (
        <div className={styles.promptsList}>
          {filteredPrompts.map((prompt) => (
            <div
              key={prompt.id}
              className={[
                styles.promptItem,
                prompt.id === selectedPromptId ? styles.promptSelected : "",
              ].join(" ")}
              onClick={() => handleSelectPrompt(prompt)}
            >
              <div className={styles.promptHeader}>
                <FileText className={styles.promptIcon} size={14} />
                <span className={styles.promptName}>{prompt.name}</span>
                {prompt.id === selectedPromptId && (
                  <CheckOutlined className={styles.checkIcon} />
                )}
              </div>
              {prompt.description && (
                <div className={styles.promptDescription}>
                  {prompt.description}
                </div>
              )}
              {prompt.tags && prompt.tags.length > 0 && (
                <div className={styles.promptTags}>
                  {prompt.tags.map((tag) => (
                    <Tag key={tag}>
                      {tag}
                    </Tag>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* 底部：添加自定义 Prompt */}
      <div className={styles.footer}>
        <div
          className={styles.addPromptBtn}
          onClick={() => {
            setOpen(false);
            // 打开添加 Prompt 的对话框（可扩展）
            message.info(t("promptSelector.addPromptHint"));
          }}
        >
          <PlusOutlined size={12} />
          <span>{t("promptSelector.addCustom")}</span>
        </div>
      </div>
    </div>
  );

  // 触发按钮
  const triggerLabel = loading
    ? t("promptSelector.loading")
    : t("promptSelector.selectPrompt");

  return (
    <Dropdown
      open={open}
      onOpenChange={setOpen}
      dropdownRender={() => dropdownContent}
      trigger={["click"]}
      placement="bottomLeft"
    >
      <div
        className={[styles.trigger, open ? styles.triggerActive : ""].join(" ")}
      >
        <FileText className={styles.icon} size={16} />
        <span className={styles.triggerLabel}>{triggerLabel}</span>
        <DownOutlined
          className={[
            styles.triggerArrow,
            open ? styles.triggerArrowOpen : "",
          ].join(" ")}
        />
      </div>
    </Dropdown>
  );
}
