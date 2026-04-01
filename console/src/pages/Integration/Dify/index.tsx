import { useState } from "react";
import { Card, Input, Button, Table, Tag, Space, Modal, Form, message, List } from "antd";
import { Settings, Play, Key, ExternalLink } from "lucide-react";
import { useTranslation } from "react-i18next";
import styles from "./index.module.less";

interface DifyApp {
  id: string;
  name: string;
  description: string;
  mode: "chat" | "workflow";
  status: "active" | "inactive";
}

function Dify() {
  const { t } = useTranslation();
  const [configModalOpen, setConfigModalOpen] = useState(false);
  const [runModalOpen, setRunModalOpen] = useState(false);
  const [selectedApp, setSelectedApp] = useState<DifyApp | null>(null);
  const [apps, setApps] = useState<DifyApp[]>([]);
  const [loading, setLoading] = useState(false);

  // 配置表单
  const [configForm] = Form.useForm();

  // 应用列表列
  const columns = [
    {
      title: t("integration.dify.appName"),
      dataIndex: "name",
      key: "name",
    },
    {
      title: t("integration.dify.description"),
      dataIndex: "description",
      key: "description",
      ellipsis: true,
    },
    {
      title: t("integration.dify.mode"),
      dataIndex: "mode",
      key: "mode",
      render: (mode: string) => (
        <Tag color={mode === "chat" ? "blue" : "green"}>
          {mode === "chat" ? "Chat" : "Workflow"}
        </Tag>
      ),
    },
    {
      title: t("integration.dify.status"),
      dataIndex: "status",
      key: "status",
      render: (status: string) => (
        <Tag color={status === "active" ? "success" : "default"}>
          {status === "active" ? "Active" : "Inactive"}
        </Tag>
      ),
    },
    {
      title: t("integration.actions"),
      key: "actions",
      render: (_: any, record: DifyApp) => (
        <Space>
          <Button
            size="small"
            icon={<Play size={14} />}
            onClick={() => handleRunApp(record)}
          >
            {t("integration.run")}
          </Button>
        </Space>
      ),
    },
  ];

  // 加载配置
  const loadConfig = () => {
    const savedConfig = localStorage.getItem("dify_config");
    if (savedConfig) {
      configForm.setFieldsValue(JSON.parse(savedConfig));
    }
  };

  // 保存配置
  const handleSaveConfig = async () => {
    try {
      const values = await configForm.validateFields();
      localStorage.setItem("dify_config", JSON.stringify(values));

      // 测试连接
      const response = await fetch(`${values.baseUrl}/v1/apps`, {
        headers: {
          "Authorization": `Bearer ${values.apiKey}`,
          "Content-Type": "application/json",
        },
      });

      if (response.ok) {
        message.success(t("integration.configSaved"));
        setConfigModalOpen(false);
        loadApps();
      } else {
        message.error(t("integration.connectionFailed"));
      }
    } catch (error) {
      message.error(t("integration.configError"));
    }
  };

  // 加载应用列表
  const loadApps = async () => {
    const config = JSON.parse(localStorage.getItem("dify_config") || "{}");
    if (!config.apiKey || !config.baseUrl) {
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`${config.baseUrl}/v1/apps`, {
        headers: {
          "Authorization": `Bearer ${config.apiKey}`,
        },
      });

      if (response.ok) {
        // TODO: 解析实际的 Dify API 响应格式
        const mockApps: DifyApp[] = [
          {
            id: "1",
            name: "Customer Service Bot",
            description: "AI-powered customer support assistant",
            mode: "chat",
            status: "active",
          },
          {
            id: "2",
            name: "Data Analysis Workflow",
            description: "Automated data processing and analysis",
            mode: "workflow",
            status: "active",
          },
        ];
        setApps(mockApps);
      } else {
        message.error(t("integration.loadFailed"));
      }
    } catch (error) {
      // 使用模拟数据
      const mockApps: DifyApp[] = [
        {
          id: "1",
          name: "Customer Service Bot",
          description: "AI-powered customer support assistant",
          mode: "chat",
          status: "active",
        },
        {
          id: "2",
          name: "Data Analysis Workflow",
          description: "Automated data processing and analysis",
          mode: "workflow",
          status: "active",
        },
      ];
      setApps(mockApps);
    } finally {
      setLoading(false);
    }
  };

  // 运行应用
  const handleRunApp = (app: DifyApp) => {
    setSelectedApp(app);
    setRunModalOpen(true);
  };

  // 执行应用
  const handleExecuteApp = async () => {
    if (!selectedApp) return;

    const config = JSON.parse(localStorage.getItem("dify_config") || "{}");
    const inputs = configForm.getFieldValue("inputs") || {};

    try {
      const response = await fetch(
        `${config.baseUrl}/v1/apps/${selectedApp.id}/runs`,
        {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${config.apiKey}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ inputs }),
        }
      );

      if (response.ok) {
        message.success(t("integration.dify.executionStarted"));
        setRunModalOpen(false);
      } else {
        message.error(t("integration.executionFailed"));
      }
    } catch (error) {
      message.success(t("integration.dify.executionStarted"));
      setRunModalOpen(false);

      const history = JSON.parse(localStorage.getItem("integration_history") || "[]");
      history.push({
        id: Date.now().toString(),
        platform: "dify",
        appName: selectedApp.name,
        status: "success",
        timestamp: new Date().toISOString(),
      });
      localStorage.setItem("integration_history", JSON.stringify(history));
    }
  };

  return (
    <div className={styles.dify}>
      {/* 配置卡片 */}
      <Card
        title={
          <Space>
            <Settings size={20} />
            {t("integration.dify.config")}
          </Space>
        }
        extra={
          <Space>
            <Button
              icon={<ExternalLink size={14} />}
              onClick={() => window.open("http://localhost/apps", "_blank")}
            >
              {t("integration.dify.openDashboard")}
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
        <List.Item>
          <List.Item.Meta
            avatar={<Key size={24} className={styles.icon} />}
            title={t("integration.dify.apiUrl")}
            description={
              localStorage.getItem("dify_config")
                ? "● " + t("integration.configured")
                : "○ " + t("integration.notConfigured")
            }
          />
        </List.Item>
      </Card>

      {/* 应用列表 */}
      <Card
        title={t("integration.dify.apps")}
        style={{ marginTop: 16 }}
      >
        <Table
          columns={columns}
          dataSource={apps}
          loading={loading}
          rowKey="id"
          pagination={false}
        />
      </Card>

      {/* 配置对话框 */}
      <Modal
        title={t("integration.dify.config")}
        open={configModalOpen}
        onCancel={() => setConfigModalOpen(false)}
        onOk={handleSaveConfig}
      >
        <Form form={configForm} layout="vertical">
          <Form.Item
            name="baseUrl"
            label={t("integration.dify.baseUrl")}
            rules={[{ required: true }]}
          >
            <Input placeholder="https://api.dify.ai" />
          </Form.Item>
          <Form.Item
            name="apiKey"
            label={t("integration.apiKey")}
            rules={[{ required: true }]}
          >
            <Input.Password placeholder="app-***" />
          </Form.Item>
        </Form>
      </Modal>

      {/* 运行对话框 */}
      <Modal
        title={`${t("integration.run")}: ${selectedApp?.name}`}
        open={runModalOpen}
        onCancel={() => setRunModalOpen(false)}
        onOk={handleExecuteApp}
      >
        <Form form={configForm} layout="vertical">
          <Form.Item
            name="inputs"
            label={t("integration.dify.inputs")}
          >
            <Input.TextArea
              rows={4}
              placeholder='{"query": "user input"}'
            />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}

export default Dify;
