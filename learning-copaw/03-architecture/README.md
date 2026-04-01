# 系统架构

本目录通过可视化图表展示 CoPaw 的系统设计和组件关系。

## 📄 文档列表

### [架构图与系统设计](./architecture-diagrams.md)
**完整的系统架构文档** - 6 大类图表，全面展示系统设计

**内容概要**：
- 🏗️ 系统架构图（整体架构、分层架构）
- 🔗 组件关系图（核心组件、渠道、工具）
- 📊 数据流图（消息处理、Agent 推理、工具调用）
- 📐 类图（核心类、渠道、工具）
- 🔄 序列图（用户交互、工具调用、多 Agent 协作）
- 🚀 部署架构（本地、Docker、云平台）

---

## 🎯 架构视图

### 1. 整体架构
```
用户界面层 (Console / CLI / Desktop)
           ↓
API 网关层 (FastAPI + 认证)
           ↓
业务逻辑层 (MultiAgentManager + Workspace)
           ↓
服务层 (ModelProvider + Tools + Memory)
           ↓
基础设施层 (Config + Storage + Logging)
```

### 2. 核心组件
- **MultiAgentManager**: 多代理管理器
- **Workspace**: Agent 工作空间
- **CoPawAgent**: 核心代理实现
- **BaseChannel**: 渠道抽象基类
- **Toolkit**: 工具注册表

### 3. 数据流
```
用户消息 → Channel → AgentRequest →
MultiAgentManager → Workspace → Agent →
Tools/Memory → AgentResponse → Channel → 用户
```

---

## 📖 图表导航

### 按视图类型查看
- **[系统架构图](./architecture-diagrams.md#系统架构图)** - 整体和分层架构
- **[组件关系图](./architecture-diagrams.md#组件关系图)** - 核心组件关系
- **[数据流图](./architecture-diagrams.md#数据流图)** - 完整处理流程
- **[类图](./architecture-diagrams.md#类图)** - 面向对象设计
- **[序列图](./architecture-diagrams.md#序列图)** - 交互时序
- **[部署架构](./architecture-diagrams.md#部署架构)** - 部署方案

### 按层级查看
- **[表现层](./architecture-diagrams.md#整体架构)** - Console/CLI/Desktop
- **[API 层](./architecture-diagrams.md#分层架构)** - FastAPI + Routers
- **[业务层](./architecture-diagrams.md#分层架构)** - Agent + Workspace
- **[服务层](./architecture-diagrams.md#分层架构)** - Model + Tools + Memory
- **[基础设施层](./architecture-diagrams.md#分层架构)** - Config + Storage

---

## 🔍 关键设计模式

### 1. 抽象模式
- **BaseChannel**: 统一渠道接口
- **Provider**: 统一模型提供商接口
- **Tool**: 统一工具接口

### 2. 工厂模式
- **ModelFactory**: 创建模型实例
- **ChannelFactory**: 创建渠道实例

### 3. 策略模式
- **不同渠道采用不同消息处理策略**
- **不同模型提供商采用不同调用策略**

### 4. 观察者模式
- **事件驱动的消息处理**
- **Agent 状态变化通知**

### 5. 单例模式
- **MultiAgentManager**: 全局唯一的管理器
- **ProviderManager**: 全局唯一的提供商管理器

---

## 🔗 相关文档

- **[功能详解](../02-features/)** - 了解功能
- **[代码示例](../05-reference/code-examples.md)** - 学习实现
- **[开发指南](../04-development/)** - 参与开发

---

**深入理解 CoPaw 的架构设计！** 🏗️
