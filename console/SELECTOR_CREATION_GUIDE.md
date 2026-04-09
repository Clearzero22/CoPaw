# CoPaw 项目下拉框创建完整指南

## 目录
1. [架构概览](#架构概览)
2. [现有下拉框分析](#现有下拉框分析)
3. [创建新下拉框步骤](#创建新下拉框步骤)
4. [代码模板](#代码模板)
5. [最佳实践](#最佳实践)

---

## 架构概览

### 项目中的下拉框位置

```
console/src/pages/Chat/
├── index.tsx                    # 主聊天页面（集成点）
├── ModelSelector/               # 模型选择器
│   ├── index.tsx
│   └── index.module.less
└── SkillSelector/               # 技能选择器
    ├── index.tsx
    └── index.module.less
```

### 数据流架构

```
┌─────────────────┐
│  Chat Page      │
│  (rightHeader)  │
└────────┬────────┘
         │
    ┌────┴────┐
    │         │
┌───▼────┐ ┌─▼─────────┐
│ Model  │ │  Skill    │
│Selector│ │ Selector  │
└───┬────┘ └─┬─────────┘
    │         │
    └────┬────┘
         │
    ┌────▼─────────┐
    │  API Module  │
    │ (provider.ts │
    │  skill.ts)   │
    └──────────────┘
```

---

## 现有下拉框分析

### 1. ModelSelector（模型选择器）

**特点**：
- 两级下拉菜单（提供商 → 模型）
- 单选模式（选择即替换）
- 显示当前激活项（带 CheckOutlined 图标）
- 支持远程和本地提供商

**状态管理**：
```typescript
const [providers, setProviders] = useState<ProviderInfo[]>([]);
const [activeModels, setActiveModels] = useState<ActiveModelsInfo | null>(null);
const [loading, setLoading] = useState(false);        // 初始加载
const [saving, setSaving] = useState(false);          // 操作进行中
const [open, setOpen] = useState(false);              // 下拉框开关
const savingRef = useRef(false);                      // 防重复提交
```

**关键功能**：
- `fetchData()` - 获取提供商和激活模型数据
- `handleSelect()` - 选择模型并调用 API
- `handleOpenChange()` - 下拉框打开时重新同步数据
- 路由监听 - 返回 `/chat` 时自动同步激活模型

**事件通信**：
```typescript
window.dispatchEvent(new CustomEvent("model-switched"));
```

### 2. SkillSelector（技能选择器）

**特点**：
- 单级下拉菜单
- 多选模式（Checkbox 复选框）
- 显示已启用数量
- 支持技能描述

**状态管理**：
```typescript
const [skills, setSkills] = useState<SkillSpec[]>([]);
const [enabledSkills, setEnabledSkills] = useState<Set<string>>(new Set());
const [loading, setLoading] = useState(false);
const [toggling, setToggling] = useState<Set<string>>(new Set());  // 多项加载
const [open, setOpen] = useState(false);
const togglingRef = useRef(false);
```

**关键功能**：
- `fetchData()` - 获取技能列表
- `handleToggleSkill()` - 切换技能启用状态
- 动态触发标签（根据数量显示不同文案）

**事件通信**：
```typescript
window.dispatchEvent(new CustomEvent("skills-changed", {
  detail: { enabledSkills: Array.from(enabledSkills) }
}));
```

---

## 创建新下拉框步骤

### 第一步：创建组件目录和文件

```bash
mkdir -p console/src/pages/Chat/NewSelector
touch console/src/pages/Chat/NewSelector/index.tsx
touch console/src/pages/Chat/NewSelector/index.module.less
```

### 第二步：编写组件代码

**核心结构**：
```typescript
import { useState, useEffect, useCallback, useRef } from "react";
import { Dropdown, message, Spin } from "antd";
import { DownOutlined, LoadingOutlined } from "@ant-design/icons";
import { useTranslation } from "react-i18next";
import styles from "./index.module.less";

// 1. 定义类型接口
interface Item {
  id: string;
  name: string;
  description?: string;
}

// 2. 组件函数
export default function NewSelector() {
  const { t } = useTranslation();

  // 3. 状态管理（按需选择）
  const [items, setItems] = useState<Item[]>([]);
  const [selectedId, setSelectedId] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [open, setOpen] = useState(false);
  const savingRef = useRef(false);

  // 4. 数据获取
  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const data = await yourApi.listItems();
      setItems(data);
    } catch (err) {
      console.error("NewSelector: failed to load data", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // 5. 事件处理
  const handleSelect = async (id: string) => {
    if (savingRef.current || id === selectedId) return;

    savingRef.current = true;
    setSaving(true);
    setOpen(false);

    try {
      await yourApi.selectItem(id);
      setSelectedId(id);
      message.success(t("newSelector.selected"));

      // 6. 事件通信（可选）
      window.dispatchEvent(new CustomEvent("new-item-selected", {
        detail: { id }
      }));
    } catch (err) {
      message.error(t("newSelector.selectFailed"));
    } finally {
      setSaving(false);
      savingRef.current = false;
    }
  };

  // 7. 下拉内容渲染
  const dropdownContent = (
    <div className={styles.panel}>
      {loading ? (
        <div className={styles.spinWrapper}>
          <Spin size="small" />
        </div>
      ) : items.length === 0 ? (
        <div className={styles.emptyTip}>
          {t("newSelector.noItems")}
        </div>
      ) : (
        <div className={styles.itemsList}>
          {items.map((item) => (
            <div
              key={item.id}
              className={[
                styles.item,
                item.id === selectedId ? styles.itemSelected : "",
              ].join(" ")}
              onClick={() => handleSelect(item.id)}
            >
              <span className={styles.itemName}>{item.name}</span>
              {item.description && (
                <span className={styles.itemDescription}>
                  {item.description}
                </span>
              )}
              {item.id === selectedId && (
                <CheckOutlined className={styles.checkIcon} />
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );

  // 8. 触发按钮渲染
  const selectedItem = items.find(i => i.id === selectedId);
  const triggerLabel = loading
    ? t("newSelector.loading")
    : selectedItem?.name || t("newSelector.selectItem");

  return (
    <Dropdown
      open={open}
      onOpenChange={setOpen}
      dropdownRender={() => dropdownContent}
      trigger={["click"]}
      placement="bottomLeft"
    >
      <div className={[styles.trigger, open ? styles.triggerActive : ""].join(" ")}>
        {saving && (
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
```

### 第三步：编写样式文件

```less
/* ---- Trigger button ---- */
.trigger {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 4px 10px;
  border-radius: 8px;
  cursor: pointer;
  font-size: 14px;
  font-weight: 500;
  color: #666;
  transition: all 0.15s ease;
  user-select: none;

  &:hover,
  &.triggerActive {
    border-color: #615ced;
    color: #615ced;
    background: rgba(97, 92, 237, 0.06);
  }
}

.triggerLabel {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  max-width: 150px;
}

.triggerArrow {
  flex-shrink: 0;
  font-size: 12px;
  color: #999;
  transition: transform 0.2s;

  &.triggerArrowOpen {
    transform: rotate(180deg);
    color: #615ced;
  }
}

/* ---- Dropdown panel ---- */
.panel {
  min-width: 280px;
  max-width: 400px;
  max-height: 400px;
  border-radius: 12px;
  background: #fff;
  border: 1px solid rgba(0, 0, 0, 0.06);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.1);
  padding: 4px 0;
  overflow-y: auto;
}

.itemsList {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 8px 12px;
  cursor: pointer;
  transition: background 0.12s;
  border-radius: 8px;

  &:hover {
    background: rgba(97, 92, 237, 0.06);
  }

  &.itemSelected {
    background: rgba(97, 92, 237, 0.04);
  }
}

.itemName {
  font-size: 14px;
  font-weight: 500;
  color: #333;
}

.itemDescription {
  font-size: 12px;
  color: #999;
  margin-left: 8px;
}

.checkIcon {
  color: #615ced;
  font-size: 14px;
}

.spinWrapper {
  padding: 20px 16px;
  text-align: center;
}

.emptyTip {
  padding: 20px 16px;
  font-size: 14px;
  color: #999;
  text-align: center;
}

/* ---- Dark mode ---- */
:global(.dark-mode) {
  .trigger {
    color: rgba(255, 255, 255, 0.65);

    &:hover,
    &.triggerActive {
      color: #8b87f0;
      background: rgba(97, 92, 237, 0.15);
    }
  }

  .panel {
    background: #1f1f1f;
    border-color: rgba(255, 255, 255, 0.08);
    box-shadow: 0 8px 24px rgba(0, 0, 0, 0.4);
  }

  .item {
    &:hover {
      background: rgba(97, 92, 237, 0.1);
    }

    &.itemSelected {
      background: rgba(97, 92, 237, 0.15);
    }
  }

  .itemName {
    color: rgba(255, 255, 255, 0.85);
  }

  .itemDescription {
    color: rgba(255, 255, 255, 0.35);
  }

  .emptyTip {
    color: rgba(255, 255, 255, 0.25);
  }
}
```

### 第四步：集成到聊天页面

**修改文件**：`console/src/pages/Chat/index.tsx`

1. **添加导入**（第 20 行附近）：
```typescript
import NewSelector from "./NewSelector";
```

2. **添加到 rightHeader**（第 548-550 行）：
```typescript
rightHeader: (
  <>
    <RuntimeLoadingBridge bridgeRef={runtimeLoadingBridgeRef} />
    <SkillSelector />
    <ModelSelector />
    <NewSelector />  {/* 新增 */}
  </>
)
```

### 第五步：添加 API 模块

**创建文件**：`console/src/api/modules/[yourApi].ts`

```typescript
import { request } from "../request";

export const yourApi = {
  // 列表查询
  listItems: () => request<Item[]>("/api/items"),

  // 选择操作
  selectItem: (id: string) =>
    request<void>(`/api/items/${encodeURIComponent(id)}/select`, {
      method: "POST",
    }),

  // 批量操作（可选）
  batchSelectItems: (ids: string[]) =>
    request<void>("/api/items/batch-select", {
      method: "POST",
      body: JSON.stringify(ids),
    }),
};
```

### 第六步：添加类型定义

**修改文件**：`console/src/api/types/index.ts`（如果需要新类型）

```typescript
export interface Item {
  id: string;
  name: string;
  description?: string;
  enabled?: boolean;
}
```

### 第七步：添加国际化翻译

**修改文件**：`console/src/locales/en.json`

在合适的位置添加（建议在 `modelSelector` 后）：
```json
{
  "newSelector": {
    "selectItem": "Select item",
    "loading": "Loading...",
    "noItems": "No items available",
    "selected": "Item selected",
    "selectFailed": "Failed to select item"
  }
}
```

**修改文件**：`console/src/locales/zh.json`

```json
{
  "newSelector": {
    "selectItem": "选择项目",
    "loading": "加载中...",
    "noItems": "暂无可用项目",
    "selected": "已选择",
    "selectFailed": "选择失败"
  }
}
```

---

## 代码模板

### 单选模式模板（类似 ModelSelector）

```typescript
import { useState, useEffect, useCallback, useRef } from "react";
import { Dropdown, message, Spin } from "antd";
import { DownOutlined, CheckOutlined, LoadingOutlined } from "@ant-design/icons";
import { useTranslation } from "react-i18next";
import styles from "./index.module.less";

export default function SingleSelector() {
  const { t } = useTranslation();
  const [items, setItems] = useState([]);
  const [selectedId, setSelectedId] = useState("");
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [open, setOpen] = useState(false);
  const savingRef = useRef(false);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const data = await api.getItems();
      setItems(data);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleSelect = async (id: string) => {
    if (savingRef.current || id === selectedId) return;
    savingRef.current = true;
    setSaving(true);
    setOpen(false);
    try {
      await api.selectItem(id);
      setSelectedId(id);
      message.success("Selected successfully");
    } catch (err) {
      message.error("Selection failed");
    } finally {
      setSaving(false);
      savingRef.current = false;
    }
  };

  const dropdownContent = (
    <div className={styles.panel}>
      {loading ? <Spin /> : items.map(item => (
        <div
          key={item.id}
          className={[styles.item, item.id === selectedId ? styles.selected : ""].join(" ")}
          onClick={() => handleSelect(item.id)}
        >
          <span>{item.name}</span>
          {item.id === selectedId && <CheckOutlined />}
        </div>
      ))}
    </div>
  );

  return (
    <Dropdown open={open} onOpenChange={setOpen} dropdownRender={() => dropdownContent}>
      <div className={styles.trigger}>
        {saving && <LoadingOutlined />}
        <span>{items.find(i => i.id === selectedId)?.name || "Select"}</span>
        <DownOutlined />
      </div>
    </Dropdown>
  );
}
```

### 多选模式模板（类似 SkillSelector）

```typescript
import { useState, useEffect, useCallback, useRef } from "react";
import { Dropdown, message, Spin, Checkbox } from "antd";
import { DownOutlined, LoadingOutlined } from "@ant-design/icons";
import { useTranslation } from "react-i18next";
import styles from "./index.module.less";

export default function MultiSelector() {
  const { t } = useTranslation();
  const [items, setItems] = useState([]);
  const [selectedIds, setSelectedIds] = useState(new Set());
  const [loading, setLoading] = useState(false);
  const [toggling, setToggling] = useState(new Set());
  const [open, setOpen] = useState(false);
  const togglingRef = useRef(false);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const data = await api.getItems();
      setItems(data);
      const enabled = new Set(data.filter(i => i.enabled).map(i => i.id));
      setSelectedIds(enabled);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleToggle = async (id: string, currentState: boolean) => {
    if (togglingRef.current) return;
    togglingRef.current = true;
    setToggling(prev => new Set(prev).add(id));
    try {
      if (currentState) {
        await api.disableItem(id);
        setSelectedIds(prev => { const next = new Set(prev); next.delete(id); return next; });
      } else {
        await api.enableItem(id);
        setSelectedIds(prev => new Set(prev).add(id));
      }
    } finally {
      setToggling(prev => { const next = new Set(prev); next.delete(id); return next; });
      togglingRef.current = false;
    }
  };

  const dropdownContent = (
    <div className={styles.panel}>
      {loading ? <Spin /> : items.map(item => (
        <div key={item.id} onClick={() => handleToggle(item.id, selectedIds.has(item.id))}>
          <Checkbox checked={selectedIds.has(item.id)}>
            {item.name}
          </Checkbox>
        </div>
      ))}
    </div>
  );

  return (
    <Dropdown open={open} onOpenChange={setOpen} dropdownRender={() => dropdownContent}>
      <div className={styles.trigger}>
        <span>{selectedIds.size > 0 ? `${selectedIds.size} selected` : "Select items"}</span>
        <DownOutlined />
      </div>
    </Dropdown>
  );
}
```

---

## 最佳实践

### 1. 状态管理模式

| 模式 | 适用场景 | 状态组合 |
|------|----------|----------|
| **基础模式** | 简单单选 | `items`, `selectedId`, `loading`, `open` |
| **操作模式** | 需要API调用 | 基础模式 + `saving`, `savingRef` |
| **多选模式** | 复选框列表 | `items`, `selectedIds` (Set), `toggling` (Set) |
| **路由同步** | 需要监听路由 | 操作模式 + `useLocation` 监听 |

### 2. 防抖和防重复提交

```typescript
// 使用 useRef 防止重复提交
const savingRef = useRef(false);

const handleSubmit = async () => {
  if (savingRef.current) return;  // 防重复

  savingRef.current = true;
  setSaving(true);

  try {
    await api.submit();
  } finally {
    setSaving(false);
    savingRef.current = false;
  }
};
```

### 3. 事件通信模式

```typescript
// 发送事件
window.dispatchEvent(new CustomEvent("my-event", {
  detail: { data: "value" }
}));

// 在其他组件监听
useEffect(() => {
  const handler = (e: CustomEvent) => {
    console.log(e.detail);
  };
  window.addEventListener("my-event", handler);
  return () => window.removeEventListener("my-event", handler);
}, []);
```

### 4. 国际化最佳实践

```typescript
// 在组件中使用
const { t } = useTranslation();

// 简单翻译
t("key")

// 带参数翻译
t("key", { count: 5 })  // "5 items"

// 翻译文件结构
{
  "selectorName": {
    "title": "Title",
    "loading": "Loading...",
    "itemCount": "{{count}} items"
  }
}
```

### 5. 样式组织

```less
// 1. 定义 CSS 变量（可选）
:root {
  --selector-primary: #615ced;
  --selector-bg-hover: rgba(97, 92, 237, 0.06);
}

// 2. 使用嵌套结构
.selector {
  &.modifier { }

  &:hover { }

  &.active { }
}

// 3. 暗色模式覆盖
:global(.dark-mode) {
  .selector {
    // 暗色模式样式
  }
}
```

### 6. TypeScript 类型安全

```typescript
// 1. 定义明确的接口
interface SelectorItem {
  id: string;
  name: string;
  description?: string;  // 可选属性
}

// 2. 使用泛型 API 函数
function request<T>(url: string): Promise<T> {
  // ...
}

// 3. 类型守卫
function isValidItem(item: any): item is SelectorItem {
  return typeof item.id === "string" && typeof item.name === "string";
}
```

### 7. 错误处理

```typescript
try {
  await api.call();
} catch (err) {
  // 类型安全的错误处理
  const msg = err instanceof Error ? err.message : t("error.unknown");
  message.error(msg);

  // 记录详细错误
  console.error("ComponentName: operation failed", err);
}
```

### 8. 性能优化

```typescript
// 1. 使用 useCallback 缓存函数
const fetchData = useCallback(async () => {
  // ...
}, [/* 依赖项 */]);

// 2. 条件渲染
{loading && <Spin />}
{!loading && items.length === 0 && <Empty />}

// 3. 防抖搜索（如需要）
import { debounce } from "lodash";

const debouncedSearch = debounce((query: string) => {
  // 搜索逻辑
}, 300);
```

---

## 快速检查清单

创建新下拉框时，确保完成以下步骤：

- [ ] 创建组件目录和文件
- [ ] 实现组件逻辑（状态管理、事件处理）
- [ ] 编写样式文件（包括暗色模式）
- [ ] 集成到 Chat 页面（导入 + 使用）
- [ ] 创建/更新 API 模块
- [ ] 添加 TypeScript 类型定义
- [ ] 添加国际化翻译（en + zh）
- [ ] 测试加载状态
- [ ] 测试选择/切换功能
- [ ] 测试错误处理
- [ ] 测试暗色模式
- [ ] 测试响应式布局
- [ ] 验证事件通信（如需要）

---

## 常见问题

### Q1: 如何添加图标到触发按钮？

```typescript
import { IconName } from "lucide-react";  // 或 @ant-design/icons

<div className={styles.trigger}>
  <IconName className={styles.icon} size={16} />
  <span>{label}</span>
  <DownOutlined />
</div>
```

### Q2: 如何实现两级菜单？

参考 ModelSelector 的实现，使用 CSS 悬停显示子菜单：

```less
.parentItem {
  position: relative;

  &:hover .submenu {
    display: block;
  }
}

.submenu {
  display: none;
  position: absolute;
  left: 100%;
  top: 0;
}
```

### Q3: 如何监听选择变化？

在需要监听的组件中：

```typescript
useEffect(() => {
  const handler = (e: CustomEvent) => {
    console.log("Item selected:", e.detail);
  };
  window.addEventListener("item-selected", handler);
  return () => window.removeEventListener("item-selected", handler);
}, []);
```

---

## 相关文件索引

| 文件路径 | 用途 |
|---------|------|
| `console/src/pages/Chat/index.tsx` | 聊天页面主文件（集成点） |
| `console/src/pages/Chat/ModelSelector/index.tsx` | 模型选择器参考实现 |
| `console/src/pages/Chat/SkillSelector/index.tsx` | 技能选择器参考实现 |
| `console/src/api/modules/provider.ts` | Provider API 参考实现 |
| `console/src/api/modules/skill.ts` | Skill API 参考实现 |
| `console/src/api/request.ts` | 统一请求封装 |
| `console/src/locales/en.json` | 英文翻译 |
| `console/src/locales/zh.json` | 中文翻译 |
