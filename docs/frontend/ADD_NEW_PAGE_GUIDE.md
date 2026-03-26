# ✅ CoPaw 前端新增页面完成指南

## 🎉 新增页面完成！

我们成功在 CoPaw 前端添加了一个"系统状态"页面！

---

## 📋 已完成的配置

### 1. 创建的文件

| 文件 | 用途 |
|------|------|
| [`console/src/pages/Status/index.tsx`](console/src/pages/Status/index.tsx) | 系统状态页面组件 |
| [`console/src/pages/Status/index.module.less`](console/src/pages/Status/index.module.less) | 页面样式文件 |

### 2. 修改的文件

| 文件 | 修改内容 |
|------|----------|
| [`console/src/layouts/MainLayout/index.tsx`](console/src/layouts/MainLayout/index.tsx) | 添加路由配置 |
| [`console/src/layouts/Sidebar.tsx`](console/src/layouts/Sidebar.tsx) | 添加导航菜单项 |
| [`console/src/layouts/constants.ts`](console/src/layouts/constants.ts) | 添加路径映射 |
| [`console/src/locales/en.json`](console/src/locales/en.json) | 英文翻译 |
| [`console/src/locales/zh.json`](console/src/locales/zh.json) | 中文翻译 |

---

## 🚀 如何访问新页面

### 开发模式（热加载）

1. **确保前端开发服务器正在运行**：
   ```bash
   cd /home/clearzero22/github_projects/01_ai_project/CoPaw/console
   npm run dev:no-proxy
   ```

2. **访问页面**：
   - 打开浏览器访问 http://localhost:5173/
   - 点击左侧菜单 **Control → System Status**
   - 或直接访问 http://localhost:5173/status

### 生产模式

```bash
# 1. 构建前端
cd console
npm run build

# 2. 复制到后端
mkdir -p ../src/copaw/console
cp -R dist/. ../src/copaw/console/

# 3. 重启后端
cd ..
uv run copaw app

# 4. 访问
http://127.0.0.1:8088/status
```

---

## 📝 新增页面的标准步骤总结

### 步骤 1：创建页面组件

```bash
# 创建页面目录
mkdir -p console/src/pages/YourPage

# 创建页面文件
touch console/src/pages/YourPage/index.tsx
touch console/src/pages/YourPage/index.module.less
```

### 步骤 2：注册路由

在 [`console/src/layouts/MainLayout/index.tsx`](console/src/layouts/MainLayout/index.tsx) 中：

```typescript
// 1. 导入页面组件
import YourPage from "../../pages/YourPage";

// 2. 添加到 pathToKey
const pathToKey: Record<string, string> = {
  // ... existing routes
  "/your-page": "your-page",
};

// 3. 添加路由
<Route path="/your-page" element={<YourPage />} />
```

### 步骤 3：添加导航菜单

在 [`console/src/layouts/Sidebar.tsx`](console/src/layouts/Sidebar.tsx) 中：

```typescript
// 1. 导入图标
import { YourIcon } from "lucide-react";

// 2. 添加到 menuItems
{
  key: "your-page",
  label: t("nav.yourPage"),
  icon: <YourIcon size={16} />,
}
```

### 步骤 4：配置导航常量

在 [`console/src/layouts/constants.ts`](console/src/layouts/constants.ts) 中：

```typescript
export const KEY_TO_PATH: Record<string, string> = {
  // ... existing
  "your-page": "/your-page",
};

export const KEY_TO_LABEL: Record<string, string> = {
  // ... existing
  "your-page": "nav.yourPage",
};
```

### 步骤 5：添加国际化文本

**英文** ([`console/src/locales/en.json`](console/src/locales/en.json))：
```json
{
  "nav": {
    "yourPage": "Your Page"
  },
  "yourPage": {
    "title": "Your Page Title",
    "description": "Your page description"
  }
}
```

**中文** ([`console/src/locales/zh.json`](console/src/locales/zh.json))：
```json
{
  "nav": {
    "yourPage": "您的页面"
  },
  "yourPage": {
    "title": "页面标题",
    "description": "页面描述"
  }
}
```

---

## 🎨 页面组件模板

以下是创建新页面的基础模板：

```typescript
import { useEffect, useState } from "react";
import { Card, message } from "@agentscope-ai/design";
import { useTranslation } from "react-i18next";
import styles from "./index.module.less";

function YourPage() {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState(null);

  useEffect(() => {
    // 获取数据
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      // const result = await api.getData();
      // setData(result);
    } catch (error) {
      message.error(t("yourPage.loadFailed"));
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div>{t("common.loading")}</div>;

  return (
    <div className={styles.yourPage}>
      <Card>
        <h1>{t("yourPage.title")}</h1>
        <p>{t("yourPage.description")}</p>
      </Card>
    </div>
  );
}

export default YourPage;
```

---

## 🔗 连接后端 API（可选）

如果需要连接后端，按照以下步骤：

### 1. 创建后端路由

文件：[`src/copaw/app/routers/your_feature.py`](src/copaw/app/routers/)

```python
from fastapi import APIRouter
from pydantic import BaseModel

router = APIRouter(prefix="/your-feature", tags=["your-feature"])

class YourResponse(BaseModel):
    message: str
    data: dict

@router.get("")
async def get_data() -> YourResponse:
    return YourResponse(message="Success", data={})
```

### 2. 注册后端路由

在 [`src/copaw/app/routers/__init__.py`](src/copaw/app/routers/__init__.py) 中：

```python
from .your_feature import router as your_feature_router

router.include_router(your_feature_router)
```

### 3. 创建前端 API 模块

文件：[`console/src/api/modules/yourFeature.ts`](console/src/api/modules/)

```typescript
import { request } from "../request";
import type { YourResponse } from "../types/yourFeature";

export const yourFeatureApi = {
  getData: () => request<YourResponse>("/your-feature"),
};
```

### 4. 在页面中使用 API

```typescript
import api from "../../api";

const fetchData = async () => {
  const result = await api.getData();
  setData(result);
};
```

---

## 📚 相关资源

- **Vite 配置**: [`console/vite.config.dev.ts`](console/vite.config.dev.ts)
- **热加载指南**: [`console/HOT_RELOAD_GUIDE.md`](console/HOT_RELOAD_GUIDE.md)
- **快速参考**: [`FRONTEND_DEV.md`](FRONTEND_DEV.md)
- **官方文档**: https://copaw.agentscope.io/

---

## 🎯 下一步

现在你可以：

1. **访问新页面**：http://localhost:5173/status
2. **修改页面内容**：编辑 [`console/src/pages/Status/index.tsx`](console/src/pages/Status/index.tsx)
3. **查看热更新**：保存文件后浏览器会自动刷新
4. **创建更多页面**：按照上述步骤重复

---

## 💡 提示

- ✅ 所有前端修改都会实时热更新，无需重启
- ✅ 使用 `t()` 函数实现所有文本的国际化
- ✅ 遵循现有的代码风格和结构
- ✅ 页面组件应该简洁，复杂逻辑提取到自定义 hooks
- ✅ 使用 CSS Modules (`.module.less`) 管理样式

祝开发愉快！🚀
