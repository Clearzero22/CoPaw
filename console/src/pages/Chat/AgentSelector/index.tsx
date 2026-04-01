import { useState, useEffect, useCallback } from "react";
import { Dropdown, message, Spin } from "antd";
import {
  DownOutlined,
  CheckOutlined,
  PlusOutlined,
  SettingOutlined,
} from "@ant-design/icons";
import { Bot } from "lucide-react";
import { useTranslation } from "react-i18next";
import { agentsApi } from "../../../api/modules/agents";
import { useAgentStore } from "../../../stores/agentStore";
import styles from "./index.module.less";

export default function AgentSelector() {
  const { t } = useTranslation();
  const { selectedAgent, setSelectedAgent, agents, setAgents } =
    useAgentStore();

  const [loading, setLoading] = useState(false);
  const [switching, setSwitching] = useState(false);
  const [open, setOpen] = useState(false);

  // 获取 Agent 列表
  const fetchAgents = useCallback(async () => {
    setLoading(true);
    try {
      const response = await agentsApi.listAgents();
      if (response?.agents) {
        setAgents(response.agents);
      }
    } catch (err) {
      console.error("AgentSelector: failed to load agents", err);
      message.error(t("agentSelector.loadFailed"));
    } finally {
      setLoading(false);
    }
  }, [setAgents, t]);

  useEffect(() => {
    fetchAgents();
  }, [fetchAgents]);

  // 切换 Agent
  const handleSwitchAgent = async (agentId: string) => {
    if (switching || agentId === selectedAgent) {
      setOpen(false);
      return;
    }

    setSwitching(true);
    try {
      setSelectedAgent(agentId);

      // 发送自定义事件，通知 Chat 页面 Agent 已切换
      window.dispatchEvent(
        new CustomEvent("agent-switched", {
          detail: { agentId },
        })
      );

      const agent = agents.find((a) => a.id === agentId);
      message.success(
        t("agentSelector.agentSwitched", {
          name: agent?.name || agentId,
        })
      );
    } catch (err) {
      message.error(t("agentSelector.switchFailed"));
    } finally {
      setSwitching(false);
      setOpen(false);
    }
  };

  // 获取当前激活的 Agent 名称
  const activeAgentName = (() => {
    const agent = agents.find((a) => a.id === selectedAgent);
    return agent?.name || selectedAgent || t("agentSelector.selectAgent");
  })();

  // 下拉内容
  const dropdownContent = (
    <div className={styles.panel}>
      {/* 标题栏 */}
      <div className={styles.header}>
        <Bot className={styles.headerIcon} size={16} />
        <span className={styles.headerTitle}>
          {t("agentSelector.title")}
        </span>
      </div>

      {/* Agent 列表 */}
      {loading ? (
        <div className={styles.spinWrapper}>
          <Spin size="small" />
        </div>
      ) : agents.length === 0 ? (
        <div className={styles.emptyTip}>
          {t("agentSelector.noAgents")}
        </div>
      ) : (
        <div className={styles.agentsList}>
          {agents.map((agent) => {
            const isActive = agent.id === selectedAgent;
            return (
              <div
                key={agent.id}
                className={[
                  styles.agentItem,
                  isActive ? styles.agentActive : "",
                ].join(" ")}
                onClick={() => handleSwitchAgent(agent.id)}
              >
                <div className={styles.agentHeader}>
                  <div className={styles.agentInfo}>
                    <Bot
                      className={styles.agentIcon}
                      size={16}
                      style={{
                        color: isActive ? "#615ced" : "#999",
                      }}
                    />
                    <span className={styles.agentName}>{agent.name}</span>
                  </div>
                  {isActive && (
                    <CheckOutlined className={styles.checkIcon} />
                  )}
                </div>
                {agent.description && (
                  <div className={styles.agentDescription}>
                    {agent.description}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* 底部：管理 Agent */}
      <div className={styles.footer}>
        <div
          className={styles.footerItem}
          onClick={() => {
            setOpen(false);
            // 导航到 Agent 管理页面
            window.location.hash = "#/agent/management";
          }}
        >
          <SettingOutlined size={14} />
          <span>{t("agentSelector.manageAgents")}</span>
        </div>
        <div
          className={styles.footerItem}
          onClick={() => {
            setOpen(false);
            // 导航到创建 Agent 页面
            window.location.hash = "#/agent/management";
          }}
        >
          <PlusOutlined size={14} />
          <span>{t("agentSelector.createAgent")}</span>
        </div>
      </div>
    </div>
  );

  // 触发按钮
  return (
    <Dropdown
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (next) {
          // 每次打开时重新获取 Agent 列表
          fetchAgents();
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
          switching ? styles.triggerSwitching : "",
        ].join(" ")}
      >
        {switching && (
          <Spin size="small" style={{ fontSize: 11, color: "#615ced" }} />
        )}
        <Bot className={styles.icon} size={16} />
        <span className={styles.triggerLabel}>{activeAgentName}</span>
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
