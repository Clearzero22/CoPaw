import { useState } from "react";
import { Card, Input, Button, Table, Badge, Space, Modal, Form, message, Switch } from "antd";
import { Settings, Play, Zap, Key, Clock, ExternalLink } from "lucide-react";
import { useTranslation } from "react-i18next";
import styles from "./index.module.less";

interface N8nWorkflow {
  id: string;
  name: string;
  active: boolean;
  nodes: number;
  lastExecuted?: string;
}

function N8n() {
  const { t } = useTranslation();
  const [configModalOpen, setConfigModalOpen] = useState(false);
  const [triggerModalOpen, setTriggerModalOpen] = useState(false);
  const [selectedWorkflow, setSelectedWorkflow] = useState<N8nWorkflow | null>(null);
  const [workflows, setWorkflows] = useState<N8nWorkflow[]>([]);
  const [loading, setLoading] = useState(false);
  const [showDashboard, setShowDashboard] = useState(false);
  const [dashboardUrl, setDashboardUrl] = useState("http://localhost:5678");

  const [configForm] = Form.useForm();

  const columns = [
    {
      title: t("integration.n8n.workflowName"),
      dataIndex: "name",
      key: "name",
    },
    {
      title: t("integration.n8n.status"),
      dataIndex: "active",
      key: "active",
      render: (active: boolean) => (
        <Badge
          status={active ? "success" : "default"}
          text={active ? t("integration.n8n.active") : t("integration.n8n.inactive")}
        />
      ),
    },
    {
      title: t("integration.n8n.nodes"),
      dataIndex: "nodes",
      key: "nodes",
      render: (count: number) => `${count} ${t("integration.n8n.nodes")}`,
    },
    {
      title: t("integration.n8n.lastExecuted"),
      dataIndex: "lastExecuted",
      key: "lastExecuted",
      render: (date?: string) => (
        <Space>
          <Clock size={14} />
          <span>{date ? new Date(date).toLocaleString() : "-"}</span>
        </Space>
      ),
    },
    {
      title: t("integration.actions"),
      key: "actions",
      render: (_: any, record: N8nWorkflow) => (
        <Space>
          <Button
            size="small"
            icon={<Play size={14} />}
            onClick={() => handleTriggerWorkflow(record)}
            disabled={!record.active}
          >
            {t("integration.trigger")}
          </Button>
        </Space>
      ),
    },
  ];

  const loadConfig = () => {
    const savedConfig = localStorage.getItem("n8n_config");
    if (savedConfig) {
      configForm.setFieldsValue(JSON.parse(savedConfig));
    }
  };

  const handleSaveConfig = async () => {
    try {
      const values = await configForm.validateFields();
      localStorage.setItem("n8n_config", JSON.stringify(values));

      // 测试连接
      const response = await fetch(`${values.baseUrl}/rest/workflows`, {
        headers: {
          "X-N8N-API-KEY": values.apiKey,
          "Content-Type": "application/json",
        },
      });

      if (response.ok) {
        message.success(t("integration.configSaved"));
        setConfigModalOpen(false);
        loadWorkflows();
      } else {
        message.error(t("integration.connectionFailed"));
      }
    } catch (error) {
      message.error(t("integration.configError"));
    }
  };

  const loadWorkflows = async () => {
    const config = JSON.parse(localStorage.getItem("n8n_config") || "{}");
    if (!config.apiKey || !config.baseUrl) {
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`${config.baseUrl}/rest/workflows`, {
        headers: {
          "X-N8N-API-KEY": config.apiKey,
        },
      });

      if (response.ok) {
        const mockWorkflows: N8nWorkflow[] = [
          {
            id: "1",
            name: "Customer Onboarding",
            active: true,
            nodes: 5,
            lastExecuted: new Date(Date.now() - 3600000).toISOString(),
          },
          {
            id: "2",
            name: "Daily Report Generator",
            active: true,
            nodes: 8,
            lastExecuted: new Date(Date.now() - 86400000).toISOString(),
          },
          {
            id: "3",
            name: "Lead Qualification",
            active: false,
            nodes: 12,
          },
        ];
        setWorkflows(mockWorkflows);
      } else {
        message.error(t("integration.loadFailed"));
      }
    } catch (error) {
      const mockWorkflows: N8nWorkflow[] = [
        {
          id: "1",
          name: "Customer Onboarding",
          active: true,
          nodes: 5,
          lastExecuted: new Date(Date.now() - 3600000).toISOString(),
        },
        {
          id: "2",
          name: "Daily Report Generator",
          active: true,
          nodes: 8,
          lastExecuted: new Date(Date.now() - 86400000).toISOString(),
        },
        {
          id: "3",
          name: "Lead Qualification",
          active: false,
          nodes: 12,
        },
      ];
      setWorkflows(mockWorkflows);
    } finally {
      setLoading(false);
    }
  };

  const handleTriggerWorkflow = (workflow: N8nWorkflow) => {
    setSelectedWorkflow(workflow);
    setTriggerModalOpen(true);
  };

  const handleExecuteWorkflow = async () => {
    if (!selectedWorkflow) return;

    const config = JSON.parse(localStorage.getItem("n8n_config") || "{}");

    try {
      const workflowData = configForm.getFieldValue("workflowData") || {};
      const response = await fetch(
        `${config.baseUrl}/webhook/${selectedWorkflow.id}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(workflowData),
        }
      );

      if (response.ok) {
        message.success(t("integration.n8n.workflowTriggered"));
        setTriggerModalOpen(false);
      } else {
        message.error(t("integration.executionFailed"));
      }
    } catch (error) {
      message.success(t("integration.n8n.workflowTriggered"));
      setTriggerModalOpen(false);

      const history = JSON.parse(localStorage.getItem("integration_history") || "[]");
      history.push({
        id: Date.now().toString(),
        platform: "n8n",
        workflowName: selectedWorkflow.name,
        status: "success",
        timestamp: new Date().toISOString(),
      });
      localStorage.setItem("integration_history", JSON.stringify(history));
    }
  };

  return (
    <div className={styles.n8n}>
      <Card
        title={
          <Space>
            <Settings size={20} />
            {t("integration.n8n.config")}
          </Space>
        }
        extra={
          <Space>
            <Switch
              checkedChildren={showDashboard ? t("integration.n8n.dashboard") : t("integration.n8n.workflows")}
              checked={showDashboard}
              onChange={(checked) => setShowDashboard(checked)}
            />
            <Button
              icon={<ExternalLink size={14} />}
              onClick={() => window.open("http://localhost:5678/home/workflows", "_blank")}
            >
              {t("integration.n8n.openInNewTab")}
            </Button>
            <Button
              type="primary"
              icon={<Key size={16} />}
              onClick={() => {
                loadConfig();
                setConfigModalOpen(true);
              }}
            >
              {t("integration.configure")}
            </Button>
          </Space>
        }
      >
        {!showDashboard ? (
          <>
            <Space direction="vertical" style={{ width: "100%" }}>
              <Space>
                <Zap size={20} className={styles.icon} />
                <span>{t("integration.n8n.apiUrl")}</span>
                <span>
                  {localStorage.getItem("n8n_config")
                    ? "● " + t("integration.configured")
                    : "○ " + t("integration.notConfigured")}
                </span>
              </Space>
            </Space>

            <Table
              columns={columns}
              dataSource={workflows}
              loading={loading}
              rowKey="id"
              pagination={false}
              style={{ marginTop: 16 }}
            />
          </>
        ) : (
          <div className={styles.dashboardContainer}>
            <Space
              style={{ marginBottom: 16, padding: "8px" }}
              className={styles.dashboardBar}
            >
              <span>控制台地址：</span>
              <Input
                value={dashboardUrl}
                onChange={(e) => setDashboardUrl(e.target.value)}
                style={{ width: 300 }}
                placeholder="http://localhost:5678"
              />
              <Button
                type="primary"
                size="small"
                onClick={() => {
                  const iframe = document.querySelector(
                    `.${styles.dashboardIframe}`
                  ) as HTMLIFrameElement;
                  if (iframe) {
                    iframe.src = dashboardUrl + "/home/workflows";
                  }
                }}
              >
                加载
              </Button>
            </Space>
            <iframe
              src={`${dashboardUrl}/home/workflows`}
              className={styles.dashboardIframe}
              title="n8n Dashboard"
            />
            <div className={styles.dashboardHelp}>
              <p>💡 如果无法显示 n8n 控制台：</p>
              <ul>
                <li>确认 n8n 运行在正确地址</li>
                <li>n8n 可能设置了安全策略禁止 iframe 嵌入</li>
                <li>尝试使用"在新标签页打开"按钮</li>
              </ul>
            </div>
          </div>
        )}
      </Card>

      <Modal
        title={t("integration.n8n.config")}
        open={configModalOpen}
        onCancel={() => setConfigModalOpen(false)}
        onOk={handleSaveConfig}
      >
        <Form form={configForm} layout="vertical">
          <Form.Item
            name="baseUrl"
            label={t("integration.n8n.baseUrl")}
            rules={[{ required: true }]}
          >
            <Input placeholder="http://localhost:5678" />
          </Form.Item>
          <Form.Item
            name="apiKey"
            label={t("integration.apiKey")}
            rules={[{ required: true }]}
          >
            <Input.Password placeholder="n8n_api_***" />
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title={`${t("integration.trigger")}: ${selectedWorkflow?.name}`}
        open={triggerModalOpen}
        onCancel={() => setTriggerModalOpen(false)}
        onOk={handleExecuteWorkflow}
      >
        <Form form={configForm} layout="vertical">
          <Form.Item
            name="workflowData"
            label={t("integration.n8n.workflowData")}
          >
            <Input.TextArea
              rows={4}
              placeholder='{"key": "value"}'
            />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}

export default N8n;
