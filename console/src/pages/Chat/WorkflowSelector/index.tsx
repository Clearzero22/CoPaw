import { useState, useEffect, useCallback } from "react";
import { Dropdown, message, Spin, Badge } from "antd";
import {
  DownOutlined,
  PlayCircleOutlined,
  ThunderboltOutlined,
  CheckOutlined,
  SettingOutlined,
} from "@ant-design/icons";
import { useTranslation } from "react-i18next";
import { GitBranch, Workflow } from "lucide-react";
import styles from "./index.module.less";

// 工作流来源
type WorkflowSource = "dify" | "n8n" | "custom";

// 工作流接口
interface Workflow {
  id: string;
  name: string;
  description?: string;
  source: WorkflowSource;
  active?: boolean;
  nodes?: number;
  category?: string;
  icon?: string;
}

// 工作流分类
interface WorkflowCategory {
  key: string;
  label: string;
  icon: string;
  color: string;
}

// 预定义工作流分类
const WORKFLOW_CATEGORIES: WorkflowCategory[] = [
  { key: "automation", label: "自动化", icon: "⚡", color: "#615ced" },
  { key: "data", label: "数据处理", icon: "📊", color: "#10b981" },
  { key: "integration", label: "系统集成", icon: "🔗", color: "#f59e0b" },
  { key: "ai", label: "AI 应用", icon: "🤖", color: "#8b5cf6" },
  { key: "custom", label: "自定义", icon: "⚙️", color: "#6b7280" },
];

export default function WorkflowSelector() {
  const { t } = useTranslation();
  const [workflows, setWorkflows] = useState<Workflow[]>([]);
  const [selectedWorkflowId, setSelectedWorkflowId] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [executing, setExecuting] = useState(false);
  const [open, setOpen] = useState(false);
  const [activeCategory, setActiveCategory] = useState<string>("all");
  const [autoMode, setAutoMode] = useState(false);

  // 获取工作流列表
  const fetchWorkflows = useCallback(async () => {
    setLoading(true);
    try {
      // 从 localStorage 获取 Dify 和 n8n 的配置
      const difyConfig = JSON.parse(
        localStorage.getItem("dify_config") || "{}"
      );
      const n8nConfig = JSON.parse(
        localStorage.getItem("n8n_config") || "{}"
      );

      const fetchedWorkflows: Workflow[] = [];

      // 获取 Dify 工作流（如果已配置）
      if (difyConfig.apiKey && difyConfig.baseUrl) {
        try {
          const response = await fetch(
            `${difyConfig.baseUrl}/v1/workflows`,
            {
              headers: {
                Authorization: `Bearer ${difyConfig.apiKey}`,
              },
            }
          );
          if (response.ok) {
            // 模拟 Dify 工作流数据结构
            const difyWorkflows: Workflow[] = [
              {
                id: "dify-customer-onboarding",
                name: "客户入职流程",
                description: "自动化新客户入职和引导流程",
                source: "dify",
                active: true,
                nodes: 5,
                category: "automation",
                icon: "👥",
              },
              {
                id: "dify-data-analysis",
                name: "数据分析报告",
                description: "自动分析和生成数据报告",
                source: "dify",
                active: true,
                nodes: 8,
                category: "data",
                icon: "📈",
              },
              {
                id: "dify-ai-assistant",
                name: "AI 智能助手",
                description: "基于 LLM 的智能对话助手",
                source: "dify",
                active: true,
                nodes: 4,
                category: "ai",
                icon: "🤖",
              },
            ];
            fetchedWorkflows.push(...difyWorkflows);
          }
        } catch (err) {
          console.error("Failed to fetch Dify workflows:", err);
        }
      }

      // 获取 n8n 工作流（如果已配置）
      if (n8nConfig.apiKey && n8nConfig.baseUrl) {
        try {
          const response = await fetch(`${n8nConfig.baseUrl}/rest/workflows`, {
            headers: {
              "X-N8N-API-KEY": n8nConfig.apiKey,
            },
          });
          if (response.ok) {
            // 模拟 n8n 工作流数据结构
            const n8nWorkflows: Workflow[] = [
              {
                id: "n8n-lead-sync",
                name: "CRM 同步",
                description: "同步销售线索到 CRM 系统",
                source: "n8n",
                active: true,
                nodes: 12,
                category: "integration",
                icon: "🔄",
              },
              {
                id: "n8n-email-campaign",
                name: "邮件营销",
                description: "自动化邮件营销活动",
                source: "n8n",
                active: true,
                nodes: 6,
                category: "automation",
                icon: "📧",
              },
              {
                id: "n8n-api-integration",
                name: "API 集成",
                description: "第三方系统 API 集成",
                source: "n8n",
                active: false,
                nodes: 9,
                category: "integration",
                icon: "🔌",
              },
            ];
            fetchedWorkflows.push(...n8nWorkflows);
          }
        } catch (err) {
          console.error("Failed to fetch n8n workflows:", err);
        }
      }

      // 添加自定义工作流（示例）
      const customWorkflows: Workflow[] = [
        {
          id: "custom-daily-report",
          name: "每日报告",
          description: "自动生成每日工作总结报告",
          source: "custom",
          active: true,
          nodes: 3,
          category: "automation",
          icon: "📋",
        },
      ];

      setWorkflows([...fetchedWorkflows, ...customWorkflows]);
    } catch (err) {
      console.error("WorkflowSelector: failed to load workflows", err);
      message.error(t("workflowSelector.loadFailed"));
    } finally {
      setLoading(false);
    }
  }, [t]);

  useEffect(() => {
    fetchWorkflows();
  }, [fetchWorkflows]);

  // 选择并执行工作流
  const handleSelectWorkflow = async (workflow: Workflow) => {
    if (executing) return;

    setSelectedWorkflowId(workflow.id);

    if (!autoMode) {
      // 手动模式：只选择，不执行
      setOpen(false);
      message.info(
        t("workflowSelector.workflowSelected", {
          name: workflow.name,
        })
      );

      // 发送事件通知 Chat 页面
      window.dispatchEvent(
        new CustomEvent("workflow-selected", {
          detail: {
            id: workflow.id,
            name: workflow.name,
            source: workflow.source,
          },
        })
      );
    } else {
      // 自动模式：选择并立即执行
      setExecuting(true);
      try {
        await executeWorkflow(workflow);
      } finally {
        setExecuting(false);
      }
    }
  };

  // 执行工作流
  const executeWorkflow = async (workflow: Workflow) => {
    try {
      // 根据来源调用不同的 API
      let url = "";
      let headers = {};
      let body = {};

      if (workflow.source === "dify") {
        const difyConfig = JSON.parse(
          localStorage.getItem("dify_config") || "{}"
        );
        url = `${difyConfig.baseUrl}/v1/workflows/${workflow.id}/run`;
        headers = {
          Authorization: `Bearer ${difyConfig.apiKey}`,
          "Content-Type": "application/json",
        };
        body = { inputs: {} };
      } else if (workflow.source === "n8n") {
        const n8nConfig = JSON.parse(
          localStorage.getItem("n8n_config") || "{}"
        );
        url = `${n8nConfig.baseUrl}/webhook/${workflow.id}`;
        headers = {
          "Content-Type": "application/json",
        };
        body = {};
      } else {
        // 自定义工作流
        message.info(t("workflowSelector.customWorkflowHint"));
        return;
      }

      const response = await fetch(url, {
        method: "POST",
        headers,
        body: JSON.stringify(body),
      });

      if (response.ok) {
        message.success(
          t("workflowSelector.workflowExecuted", {
            name: workflow.name,
          })
        );

        // 发送事件
        window.dispatchEvent(
          new CustomEvent("workflow-executed", {
            detail: {
              id: workflow.id,
              name: workflow.name,
              source: workflow.source,
            },
          })
        );
      } else {
        message.error(t("workflowSelector.executionFailed"));
      }
    } catch (err) {
      message.error(t("workflowSelector.executionFailed"));
    }
  };

  // 过滤工作流
  const filteredWorkflows = workflows.filter((workflow) => {
    if (activeCategory === "all") return true;
    return workflow.category === activeCategory;
  });

  // 获取来源标签
  const getSourceTag = (source: WorkflowSource) => {
    const config = {
      dify: { label: "Dify", color: "blue" },
      n8n: { label: "n8n", color: "orange" },
      custom: { label: "自定义", color: "default" },
    };
    return config[source];
  };

  // 触发按钮标签
  const triggerLabel = loading
    ? t("workflowSelector.loading")
    : selectedWorkflowId
    ? workflows.find((w) => w.id === selectedWorkflowId)?.name ||
      t("workflowSelector.selectWorkflow")
    : t("workflowSelector.selectWorkflow");

  // 下拉内容
  const dropdownContent = (
    <div className={styles.panel}>
      {/* 标题栏 */}
      <div className={styles.header}>
        <Workflow className={styles.headerIcon} size={16} />
        <span className={styles.headerTitle}>
          {t("workflowSelector.title")}
        </span>
      </div>

      {/* 分类标签 */}
      <div className={styles.categories}>
        <div
          className={[
            styles.categoryItem,
            activeCategory === "all" ? styles.categoryActive : "",
          ].join(" ")}
          onClick={() => setActiveCategory("all")}
        >
          {t("workflowSelector.category.all")}
        </div>
        {WORKFLOW_CATEGORIES.map((cat) => (
          <div
            key={cat.key}
            className={[
              styles.categoryItem,
              activeCategory === cat.key ? styles.categoryActive : "",
            ].join(" ")}
          onClick={() => setActiveCategory(cat.key)}
          style={{
            borderColor:
              activeCategory === cat.key ? cat.color : "transparent",
          }}
          >
            <span>{cat.icon}</span>
            <span>{cat.label}</span>
          </div>
        ))}
      </div>

      {/* 工作流列表 */}
      {loading ? (
        <div className={styles.spinWrapper}>
          <Spin size="small" />
        </div>
      ) : filteredWorkflows.length === 0 ? (
        <div className={styles.emptyTip}>
          {t("workflowSelector.noWorkflows")}
        </div>
      ) : (
        <div className={styles.workflowsList}>
          {filteredWorkflows.map((workflow) => {
            const isSelected = workflow.id === selectedWorkflowId;
            const sourceTag = getSourceTag(workflow.source);

            return (
              <div
                key={workflow.id}
                className={[
                  styles.workflowItem,
                  isSelected ? styles.workflowSelected : "",
                  !workflow.active ? styles.workflowInactive : "",
                ].join(" ")}
                onClick={() => handleSelectWorkflow(workflow)}
              >
                <div className={styles.workflowHeader}>
                  <div className={styles.workflowInfo}>
                    {workflow.icon && (
                      <span className={styles.workflowIcon}>
                        {workflow.icon}
                      </span>
                    )}
                    <span className={styles.workflowName}>
                      {workflow.name}
                    </span>
                    {!workflow.active && (
                      <Badge
                        status="default"
                        text={t("workflowSelector.inactive")}
                      />
                    )}
                  </div>
                  {isSelected && <CheckOutlined className={styles.checkIcon} />}
                </div>
                {workflow.description && (
                  <div className={styles.workflowDescription}>
                    {workflow.description}
                  </div>
                )}
                <div className={styles.workflowMeta}>
                  <Badge
                    color={sourceTag.color}
                    text={sourceTag.label}
                  />
                  {workflow.nodes && (
                    <span className={styles.workflowNodes}>
                      <GitBranch size={12} />
                      {workflow.nodes} 节点
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* 底部操作栏 */}
      <div className={styles.footer}>
        <div className={styles.footerSection}>
          <span className={styles.footerLabel}>
            {t("workflowSelector.executionMode")}:
          </span>
          <div className={styles.footerAction}>
            <button
              className={[
                styles.modeButton,
                !autoMode ? styles.modeButtonActive : "",
              ].join(" ")}
              onClick={() => setAutoMode(false)}
            >
              {t("workflowSelector.manual")}
            </button>
            <button
              className={[
                styles.modeButton,
                autoMode ? styles.modeButtonActive : "",
              ].join(" ")}
              onClick={() => setAutoMode(true)}
            >
              {t("workflowSelector.auto")}
            </button>
          </div>
        </div>
        <div className={styles.footerDivider} />
        <div
          className={styles.footerAction}
          onClick={() => {
            setOpen(false);
            window.location.hash = "#/integration/n8n";
          }}
        >
          <SettingOutlined size={14} />
          <span>{t("workflowSelector.manageWorkflows")}</span>
        </div>
      </div>
    </div>
  );

  return (
    <Dropdown
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (next) {
          fetchWorkflows();
        }
      }}
      dropdownRender={() => dropdownContent}
      trigger={["click"]}
      placement="bottomLeft"
    >
      <div
        className={[
          styles.trigger,
          open ? styles.triggerActive : "",
          executing ? styles.triggerExecuting : "",
        ].join(" ")}
      >
        {executing && (
          <Spin size="small" style={{ fontSize: 11, color: "#615ced" }} />
        )}
        {autoMode ? (
          <ThunderboltOutlined className={styles.icon} />
        ) : (
          <PlayCircleOutlined className={styles.icon} />
        )}
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
