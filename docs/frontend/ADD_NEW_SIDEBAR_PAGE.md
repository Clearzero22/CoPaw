# 添加新侧栏和页面指南

本文档详细说明如何在 CoPaw 项目中添加新的侧栏菜单项和对应的页面。

## 📋 目录

- [快速概览](#快速概览)
- [关键文件位置](#关键文件位置)
- [详细步骤](#详细步骤)
- [现有菜单组结构](#现有菜单组结构)
- [完整示例](#完整示例)
- [注意事项](#注意事项)

---

## 🎯 快速概览

要添加新的侧栏菜单项和对应页面，你需要修改 **4 个关键文件**：

1. **constants.ts** - 添加路径映射
2. **Sidebar.tsx** - 添加菜单项
3. **MainLayout/index.tsx** - 添加路由
4. **locales/*.json** - 添加翻译文本

---

## 📁 关键文件位置

```
console/src/
├── layouts/
│   ├── Sidebar.tsx          # 侧栏菜单组件
│   ├── constants.ts         # 导航常量配置
│   └── MainLayout/
│       └── index.tsx        # 主布局和路由配置
├── pages/                   # 页面组件目录
│   └── YourNewPage/         # 新页面目录
│       └── index.tsx
└── locales/
    ├── en.json             # 英文翻译
    ├── zh.json             # 中文翻译
    ├── ja.json             # 日文翻译
    └── ru.json             # 俄文翻译
```

---

## 🛠️ 详细步骤

### 步骤 1: 创建页面组件

首先创建你的新页面组件：

**文件路径**: `console/src/pages/YourNewPage/index.tsx`

```typescript
import { Card, Typography } from "antd";
import { useTranslation } from "react-i18next";

const { Title } = Typography;

export default function YourNewPage() {
  const { t } = useTranslation();

  return (
    <div style={{ padding: "24px" }}>
      <Title level={2}>{t("yourNewPage.title")}</Title>
      <Card>
        <p>{t("yourNewPage.description")}</p>
        {/* 你的页面内容 */}
      </Card>
    </div>
  );
}
```

### 步骤 2: 添加到常量配置

**文件**: `console/src/layouts/constants.ts`

在 `KEY_TO_PATH` 中添加路径映射（约第 20-38 行）：

```typescript
export const KEY_TO_PATH: Record<string, string> = {
  // ... 现有映射
  "chat": "/chat",
  "channels": "/channels",
  // 添加你的新页面
  "your-new-page": "/your-new-page",
};
```

在 `KEY_TO_LABEL` 中添加标签键（约第 40-57 行）：

```typescript
export const KEY_TO_LABEL: Record<string, string> = {
  // ... 现有标签
  "chat": "nav.chat",
  "channels": "nav.channels",
  // 添加你的新页面标签
  "your-new-page": "nav.yourNewPage",
};
```

### 步骤 3: 添加侧栏菜单项

**文件**: `console/src/layouts/Sidebar.tsx`

在 `menuItems` 数组中添加新菜单项（约第 282-372 行）：

**选项 A: 添加到现有组**

```typescript
{
  key: "control-group",  // 或其他现有组
  label: t("nav.control"),
  icon: <Sliders size={16} />,
  children: [
    // ... 现有菜单项
    {
      key: "your-new-page",
      label: t("nav.yourNewPage"),
      icon: <YourIcon size={16} />,
    },
  ],
}
```

**选项 B: 创建新菜单组**

```typescript
{
  key: "your-new-group",
  label: t("nav.yourNewGroup"),
  icon: <YourIcon size={16} />,
  children: [
    {
      key: "your-new-page",
      label: t("nav.yourNewPage"),
      icon: <YourIcon size={16} />,
    },
  ],
}
```

### 步骤 4: 添加路由配置

**文件**: `console/src/layouts/MainLayout/index.tsx`

**4.1 导入页面组件**（约第 8-23 行）：

```typescript
import YourNewPage from "../../pages/YourNewPage";
```

**4.2 添加路径到键的映射**（约第 27-45 行）：

```typescript
const pathToKey: Record<string, string> = {
  // ... 现有映射
  "/your-new-page": "your-new-page",
};
```

**4.3 添加路由**（约第 60-82 行）：

```typescript
<Routes>
  {/* 现有路由 */}
  <Route path="/your-new-page" element={<YourNewPage />} />
</Routes>
```

### 步骤 5: 添加翻译文本

在所有语言文件中添加翻译：

**英文** (`console/src/locales/en.json`)：

```json
{
  "nav": {
    "yourNewGroup": "Your New Group",
    "yourNewPage": "Your New Page"
  },
  "yourNewPage": {
    "title": "Your New Page",
    "description": "This is your new page description"
  }
}
```

**中文** (`console/src/locales/zh.json`)：

```json
{
  "nav": {
    "yourNewGroup": "新分组",
    "yourNewPage": "新页面"
  },
  "yourNewPage": {
    "title": "新页面",
    "description": "这是你的新页面描述"
  }
}
```

**日文** (`console/src/locales/ja.json`)：

```json
{
  "nav": {
    "yourNewGroup": "新しいグループ",
    "yourNewPage": "新しいページ"
  },
  "yourNewPage": {
    "title": "新しいページ",
    "description": "これは新しいページの説明です"
  }
}
```

**俄文** (`console/src/locales/ru.json`)：

```json
{
  "nav": {
    "yourNewGroup": "Новая группа",
    "yourNewPage": "Новая страница"
  },
  "yourNewPage": {
    "title": "Новая страница",
    "description": "Это описание вашей новой страницы"
  }
}
```

---

## 🎨 现有菜单组结构

当前侧栏有 4 个主要组：

| 组名 | 键值 | 包含页面 |
|------|------|----------|
| **Chat** | `chat-group` | Chat |
| **Control** | `control-group` | Channels, Sessions, Cron Jobs, Heartbeat, Status |
| **Agent** | `agent-group` | Workspace, Skills, Tools, MCP, Configuration |
| **Settings** | `settings-group` | Agents, Models, Environments, Security, Token Usage, Voice Transcription |

### 侧栏菜单数据结构

侧栏使用 Ant Design 的 Menu 组件，菜单项结构如下：

```typescript
const menuItems: MenuProps["items"] = [
  {
    key: "chat-group",           // 组的唯一标识
    label: t("nav.chat"),        // 组显示名称
    icon: <MessageSquare size={16} />,  // 组图标
    children: [                  // 子菜单项数组
      {
        key: "chat",             // 页面的唯一标识
        label: t("nav.chat"),    // 页面显示名称
        icon: <MessageCircle size={16} />,  // 页面图标
      },
    ],
  },
  // ... 其他组
];
```

---

## 🔧 图标使用

CoPaw 使用 **lucide-react** 图标库：

```typescript
import { MessageSquare, Settings, Sliders, Star, FileText, Users, Code, Activity } from "lucide-react";

// 使用示例
icon: <Star size={16} />
```

### 常用图标参考

| 图标 | 组件名 | 适用场景 |
|------|--------|----------|
| 💬 | `MessageSquare` | 消息/聊天 |
| ⚙️ | `Settings` | 设置 |
| 🎚️ | `Sliders` | 控制/调节 |
| ⭐ | `Star` | 收藏/推荐 |
| 📄 | `FileText` | 文档/文件 |
| 👥 | `Users` | 用户/团队 |
| 💻 | `Code` | 代码/工具 |
| 💓 | `Activity` | 状态/监控 |
| 🔌 | `Zap` | 快速操作 |
| 📊 | `BarChart` | 数据/统计 |
| 🔒 | `Lock` | 安全/权限 |
| 🌐 | `Globe` | 网络/全局 |

---

## ✅ 完整示例

### 示例：添加"系统状态"页面

假设你要添加一个 "系统状态" 页面，显示系统运行状态信息。

#### 1. 创建页面组件

**文件**: `console/src/pages/SystemStatus/index.tsx`

```typescript
import { Card, Typography, Row, Col, Statistic } from "antd";
import { Activity, Cpu, MemoryStick, HardDrive } from "lucide-react";
import { useTranslation } from "react-i18next";

const { Title } = Typography;

export default function SystemStatus() {
  const { t } = useTranslation();

  return (
    <div style={{ padding: "24px" }}>
      <Title level={2}>{t("systemStatus.title")}</Title>

      <Row gutter={[16, 16]}>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title="CPU"
              value={45.3}
              suffix="%"
              prefix={<Cpu size={16} />}
              valueStyle={{ color: '#3f8600' }}
            />
          </Card>
        </Col>

        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title="Memory"
              value={62.1}
              suffix="%"
              prefix={<MemoryStick size={16} />}
              valueStyle={{ color: '#cf1322' }}
            />
          </Card>
        </Col>

        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title="Disk"
              value={78.5}
              suffix="%"
              prefix={<HardDrive size={16} />}
            />
          </Card>
        </Col>

        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title="Uptime"
              value={15}
              suffix="days"
              prefix={<Activity size={16} />}
            />
          </Card>
        </Col>
      </Row>
    </div>
  );
}
```

#### 2. 修改 constants.ts

**文件**: `console/src/layouts/constants.ts`

```typescript
export const KEY_TO_PATH: Record<string, string> = {
  // ... 现有映射
  "system-status": "/system-status",
};

export const KEY_TO_LABEL: Record<string, string> = {
  // ... 现有标签
  "system-status": "nav.systemStatus",
};
```

#### 3. 修改 Sidebar.tsx

**文件**: `console/src/layouts/Sidebar.tsx`

添加到 `control-group`：

```typescript
{
  key: "control-group",
  label: t("nav.control"),
  icon: <Sliders size={16} />,
  children: [
    // ... 现有菜单项
    {
      key: "channels",
      label: t("nav.channels"),
      icon: <Router size={16} />,
    },
    {
      key: "sessions",
      label: t("nav.sessions"),
      icon: <History size={16} />,
    },
    // 添加新的系统状态菜单项
    {
      key: "system-status",
      label: t("nav.systemStatus"),
      icon: <Activity size={16} />,
    },
    // ... 其他菜单项
  ],
}
```

#### 4. 修改 MainLayout/index.tsx

**文件**: `console/src/layouts/MainLayout/index.tsx`

```typescript
// 1. 导入页面组件
import SystemStatus from "../../pages/SystemStatus";

// 2. 添加路径映射
const pathToKey: Record<string, string> = {
  // ... 现有映射
  "/system-status": "system-status",
};

// 3. 添加路由
<Routes>
  {/* 现有路由 */}
  <Route path="/system-status" element={<SystemStatus />} />
</Routes>
```

#### 5. 添加翻译文本

**英文** (`console/src/locales/en.json`)：

```json
{
  "nav": {
    "systemStatus": "System Status"
  },
  "systemStatus": {
    "title": "System Status",
    "cpu": "CPU",
    "memory": "Memory",
    "disk": "Disk",
    "uptime": "Uptime"
  }
}
```

**中文** (`console/src/locales/zh.json`)：

```json
{
  "nav": {
    "systemStatus": "系统状态"
  },
  "systemStatus": {
    "title": "系统状态",
    "cpu": "CPU",
    "memory": "内存",
    "disk": "磁盘",
    "uptime": "运行时间"
  }
}
```

---

## 📌 注意事项

### 命名规范

1. **路径命名**：使用 kebab-case（如 `/your-new-page`）
2. **键名一致**：确保 `constants.ts`、`Sidebar.tsx`、`MainLayout/index.tsx` 中的键名一致
3. **组件命名**：使用 PascalCase（如 `YourNewPage`）

### 翻译完整性

记得在所有语言文件中添加翻译：
- ✅ `en.json` - 英文
- ✅ `zh.json` - 中文
- ✅ `ja.json` - 日文
- ✅ `ru.json` - 俄文

### UI 一致性

1. **图标大小**：侧栏图标统一使用 `size={16}`
2. **页面布局**：建议使用 Ant Design 的 Card 组件包裹内容
3. **内边距**：页面容器建议添加 `padding: "24px"`

### 路由注意事项

1. **路径唯一性**：确保新路径不与现有路径冲突
2. **默认路由**：根路径 `/` 会重定向到 `/chat`
3. **嵌套路由**：如果页面需要嵌套路由，使用 `/*` 后缀（如 `/chat/*`）

### 性能优化

1. **懒加载**：对于大型页面，考虑使用 React.lazy 进行代码分割

```typescript
import { lazy } from 'react';

const YourNewPage = lazy(() => import("../../pages/YourNewPage"));

// 在路由中使用
<Route path="/your-new-page" element={
  <Suspense fallback={<div>Loading...</div>}>
    <YourNewPage />
  </Suspense>
} />
```

2. **组件拆分**：复杂页面应拆分为多个子组件，放在 `components/` 目录中

### 权限控制

如果页面需要权限控制，参考现有的 `AuthGuard` 实现：

```typescript
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";

export default function YourNewPage() {
  const navigate = useNavigate();

  useEffect(() => {
    // 检查权限
    if (!hasPermission()) {
      navigate("/403");
    }
  }, [navigate]);

  // ... 页面内容
}
```

---

## 🔗 相关文件速查

| 文件 | 用途 | 行号参考 |
|------|------|----------|
| `console/src/layouts/Sidebar.tsx` | 侧栏菜单组件 | 282-372 |
| `console/src/layouts/constants.ts` | 导航常量配置 | 20-57 |
| `console/src/layouts/MainLayout/index.tsx` | 主布局和路由 | 8-82 |
| `console/src/locales/en.json` | 英文翻译 | 全文 |
| `console/src/locales/zh.json` | 中文翻译 | 全文 |

---

## 🚀 快速检查清单

添加新页面后，使用此清单确保所有步骤完成：

- [ ] 创建页面组件文件 `pages/YourNewPage/index.tsx`
- [ ] 在 `constants.ts` 的 `KEY_TO_PATH` 中添加映射
- [ ] 在 `constants.ts` 的 `KEY_TO_LABEL` 中添加标签
- [ ] 在 `Sidebar.tsx` 的 `menuItems` 中添加菜单项
- [ ] 在 `MainLayout/index.tsx` 中导入页面组件
- [ ] 在 `MainLayout/index.tsx` 的 `pathToKey` 中添加映射
- [ ] 在 `MainLayout/index.tsx` 的 `Routes` 中添加路由
- [ ] 在 `en.json` 中添加英文翻译
- [ ] 在 `zh.json` 中添加中文翻译
- [ ] 在 `ja.json` 中添加日文翻译
- [ ] 在 `ru.json` 中添加俄文翻译
- [ ] 测试页面可以正常访问
- [ ] 测试侧栏菜单项可以点击导航
- [ ] 测试页面在不同语言下显示正确

---

## 📚 参考资源

- **React Router**: https://reactrouter.com/
- **Ant Design**: https://ant.design/
- **Lucide Icons**: https://lucide.dev/
- **i18next**: https://www.i18next.com/

---

**文档版本**: v1.0.0
**最后更新**: 2026-03-26
**维护者**: CoPaw 开发团队
