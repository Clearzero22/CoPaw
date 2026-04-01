import { useState, useEffect, useCallback, useRef } from "react";
import { Dropdown, message, Spin, Checkbox } from "antd";
import {
  DownOutlined,
  LoadingOutlined,
} from "@ant-design/icons";
import { Wrench } from "lucide-react";
import { useTranslation } from "react-i18next";
import { toolsApi } from "../../../api/modules/tools";
import type { ToolInfo } from "../../../api/modules/tools";
import styles from "./index.module.less";

// 工具分类
interface ToolCategory {
  key: string;
  label: string;
  icon: string;
  tools: string[];
}

// 预定义的工具分类
const TOOL_CATEGORIES: ToolCategory[] = [
  {
    key: "network",
    label: "网络工具",
    icon: "🌐",
    tools: ["web_search", "web_fetch", "browse"],
  },
  {
    key: "file",
    label: "文件操作",
    icon: "📁",
    tools: ["read_file", "write_file", "list_files"],
  },
  {
    key: "database",
    label: "数据库查询",
    icon: "🗄️",
    tools: ["sql_query", "database_search"],
  },
  {
    key: "api",
    label: "API 调用",
    icon: "🔌",
    tools: ["http_request", "api_call"],
  },
  {
    key: "code",
    label: "代码执行",
    icon: "💻",
    tools: ["python", "javascript", "shell"],
  },
];

export default function ToolSelector() {
  const { t } = useTranslation();
  const [tools, setTools] = useState<ToolInfo[]>([]);
  const [enabledTools, setEnabledTools] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(false);
  const [toggling, setToggling] = useState<Set<string>>(new Set());
  const [open, setOpen] = useState(false);
  const togglingRef = useRef(false);

  // 获取工具列表
  const fetchTools = useCallback(async () => {
    setLoading(true);
    try {
      const toolsData = await toolsApi.listTools();
      if (Array.isArray(toolsData)) {
        setTools(toolsData);
        const enabled = new Set(toolsData.filter((t) => t.enabled).map((t) => t.name));
        setEnabledTools(enabled);
      }
    } catch (err) {
      console.error("ToolSelector: failed to load tools", err);
      message.error(t("toolSelector.loadFailed"));
    } finally {
      setLoading(false);
    }
  }, [t]);

  useEffect(() => {
    fetchTools();
  }, [fetchTools]);

  // 切换工具启用状态
  const handleToggleTool = async (toolName: string, currentState: boolean) => {
    if (togglingRef.current) return;

    togglingRef.current = true;
    setToggling((prev) => new Set(prev).add(toolName));

    try {
      if (currentState) {
        // 禁用工具
        await toolsApi.toggleTool(toolName);
        setEnabledTools((prev) => {
          const next = new Set(prev);
          next.delete(toolName);
          return next;
        });
        message.success(t("toolSelector.toolDisabled", { name: toolName }));
      } else {
        // 启用工具
        await toolsApi.toggleTool(toolName);
        setEnabledTools((prev) => new Set(prev).add(toolName));
        message.success(t("toolSelector.toolEnabled", { name: toolName }));
      }

      // 通知 Chat 页面工具状态已改变
      window.dispatchEvent(
        new CustomEvent("tools-changed", {
          detail: { enabledTools: Array.from(enabledTools) },
        })
      );
    } catch (err) {
      message.error(t("toolSelector.toggleFailed"));
    } finally {
      setToggling((prev) => {
        const next = new Set(prev);
        next.delete(toolName);
        return next;
      });
      togglingRef.current = false;
    }
  };

  // 按分类切换工具
  const handleToggleCategory = async (
    category: ToolCategory,
    currentEnabledCount: number
  ) => {
    const allToolsInCategory = category.tools.filter((toolName) =>
      tools.some((t) => t.name === toolName)
    );

    if (allToolsInCategory.length === 0) return;

    // 如果分类中的所有工具都已启用，则禁用所有；否则启用所有
    const enableAll = currentEnabledCount < allToolsInCategory.length;

    // 批量切换
    for (const toolName of allToolsInCategory) {
      const isCurrentlyEnabled = enabledTools.has(toolName);
      if ((enableAll && !isCurrentlyEnabled) || (!enableAll && isCurrentlyEnabled)) {
        try {
          await toolsApi.toggleTool(toolName);
        } catch (err) {
          console.error(`Failed to toggle tool: ${toolName}`, err);
        }
      }
    }

    // 重新获取工具列表
    await fetchTools();

    message.success(
      enableAll
        ? t("toolSelector.categoryEnabled", { category: category.label })
        : t("toolSelector.categoryDisabled", { category: category.label })
    );
  };

  // 检查工具是否正在切换中
  const isToolToggling = (toolName: string) => toggling.has(toolName);

  // 获取分类中的已启用工具数量
  const getCategoryEnabledCount = (category: ToolCategory) => {
    return category.tools.filter((toolName) => enabledTools.has(toolName))
      .length;
  };

  // 获取分类中的可用工具数量
  const getCategoryAvailableCount = (category: ToolCategory) => {
    return category.tools.filter((toolName) =>
      tools.some((t) => t.name === toolName)
    ).length;
  };

  // 获取触发按钮标签
  const enabledCount = enabledTools.size;
  const triggerLabel = (() => {
    if (loading) return t("toolSelector.loading");
    if (enabledCount === 0) return t("toolSelector.selectTools");
    return t("toolSelector.toolCount", { count: enabledCount });
  })();

  // 下拉内容
  const dropdownContent = (
    <div className={styles.panel}>
      {/* 标题栏 */}
      <div className={styles.header}>
        <Wrench className={styles.headerIcon} />
        <span className={styles.headerTitle}>{t("toolSelector.title")}</span>
      </div>

      {/* 工具列表 */}
      {loading ? (
        <div className={styles.spinWrapper}>
          <Spin size="small" />
        </div>
      ) : tools.length === 0 ? (
        <div className={styles.emptyTip}>{t("toolSelector.noTools")}</div>
      ) : (
        <div className={styles.categoriesList}>
          {TOOL_CATEGORIES.map((category) => {
            const enabledCount = getCategoryEnabledCount(category);
            const availableCount = getCategoryAvailableCount(category);
            const isAllEnabled = availableCount > 0 && enabledCount === availableCount;

            return (
              <div key={category.key} className={styles.categorySection}>
                {/* 分类标题 */}
                <div
                  className={styles.categoryHeader}
                  onClick={() => handleToggleCategory(category, enabledCount)}
                >
                  <div className={styles.categoryInfo}>
                    <span className={styles.categoryIcon}>{category.icon}</span>
                    <span className={styles.categoryLabel}>{category.label}</span>
                    <span className={styles.categoryCount}>
                      {enabledCount}/{availableCount}
                    </span>
                  </div>
                  <Checkbox
                    checked={isAllEnabled && availableCount > 0}
                    indeterminate={
                      enabledCount > 0 && enabledCount < availableCount
                    }
                    onChange={() => {}}
                  />
                </div>

                {/* 分类下的工具列表 */}
                <div className={styles.toolsList}>
                  {category.tools
                    .filter((toolName) =>
                      tools.some((t) => t.name === toolName)
                    )
                    .map((toolName) => {
                      const tool = tools.find((t) => t.name === toolName);
                      if (!tool) return null;

                      const isEnabled = enabledTools.has(toolName);
                      const isToggling = isToolToggling(toolName);

                      return (
                        <div
                          key={toolName}
                          className={[
                            styles.toolItem,
                            isEnabled ? styles.toolEnabled : "",
                          ].join(" ")}
                          onClick={(e) => {
                            e.stopPropagation();
                            handleToggleTool(toolName, isEnabled);
                          }}
                        >
                          <Checkbox
                            checked={isEnabled}
                            disabled={isToggling}
                            onChange={() => {}}
                          >
                            <span className={styles.toolName}>{toolName}</span>
                          </Checkbox>
                          {isToggling && (
                            <LoadingOutlined
                              className={styles.loadingIcon}
                              spin
                            />
                          )}
                        </div>
                      );
                    })}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );

  return (
    <Dropdown
      open={open}
      onOpenChange={setOpen}
      dropdownRender={() => dropdownContent}
      trigger={["click"]}
      placement="bottomLeft"
    >
      <div
        className={[
          styles.trigger,
          open ? styles.triggerActive : "",
        ].join(" ")}
      >
        <Wrench className={styles.icon} />
        {togglingRef.current && (
          <LoadingOutlined style={{ fontSize: 11, color: "#615ced" }} />
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
