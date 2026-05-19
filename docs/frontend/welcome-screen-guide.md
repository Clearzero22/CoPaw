# CoPaw 欢迎界面代码分析

## 📍 代码位置

欢迎界面的代码位于 `console/src/pages/Welcome/` 目录下：

```
console/src/pages/Welcome/
├── index.tsx                    # 主组件
├── index.module.less            # 样式文件
├── components/                  # 子组件
│   ├── UniverseBackground.tsx  # 3D 宇宙背景
│   ├── HeroContent.tsx         # 主要内容
│   ├── ScrambleText.tsx        # 文字特效
│   ├── GameTelemetry.tsx       # 游戏遥测面板
│   ├── FeatureCards.tsx        # 特性卡片
│   └── ... (其他组件)
└── hooks/                       # 自定义 Hooks
```

## 🏗️ 组件架构

### 主组件 (`index.tsx`)

**位置**: `console/src/pages/Welcome/index.tsx`

```typescript
export default function WelcomePage({ onComplete }: WelcomePageProps) {
  // 状态管理
  const [blackSwanActive, setBlackSwanActive] = useState(false);
  
  // 核心功能:
  // 1. 处理 "开始使用" 按钮
  const handleGetStarted = useCallback(() => {
    onComplete?.();
    navigate("/chat");
  }, [navigate, onComplete]);
  
  // 2. 处理 "跳过" 按钮
  const handleSkip = useCallback(() => {
    onComplete?.();
    navigate("/chat");
  }, [navigate, onComplete]);
  
  // 3. 处理 "黑天鹅" 事件 (点击特效)
  const handleBlackSwanTriggered = useCallback(() => {
    setBlackSwanActive(true);
    setTimeout(() => setBlackSwanActive(false), 2500);
  }, []);
  
  // 4. 键盘事件 (ESC 跳过)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        handleSkip();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleSkip]);
  
  // 5. 全局点击事件 (触发粒子效果)
  useEffect(() => {
    const handleGlobalClick = (e: MouseEvent) => {
      // 排除按钮和链接
      if (target.closest('button') || target.closest('a')) {
        return;
      }
      handleBlackSwanTriggered();
    };
    window.addEventListener("click", handleGlobalClick);
    return () => window.removeEventListener("click", handleGlobalClick);
  }, [handleBlackSwanTriggered]);
  
  return (
    <div className={styles.welcomeContainer}>
      <UniverseBackground />  {/* 3D 背景 */}
      
      <div className={styles.content}>
        <HeroContent />  {/* 主要内容 */}
        
        {/* 按钮 */}
        <motion.button onClick={handleGetStarted}>
          {t("welcome.getStarted")}
        </motion.button>
        <motion.button onClick={handleSkip}>
          {t("welcome.skip")}
        </motion.button>
      </div>
      
      <GameTelemetry />  {/* 游戏遥测面板 */}
    </div>
  );
}
```

### 路由集成 (`App.tsx`)

**位置**: `console/src/App.tsx`

```typescript
// 欢迎页面持久化配置
const WELCOME_SHOWN_KEY = "copaw_welcome_shown";
const WELCOME_VERSION_KEY = "copaw_welcome_version";
const CURRENT_VERSION = "1.0.0";

// 判断是否显示欢迎页面
function shouldShowWelcome(): boolean {
  // ⚠️ 当前配置: 每次刷新都显示 (测试模式)
  return true;
  
  // 生产环境配置: 只显示一次
  // const shown = localStorage.getItem(WELCOME_SHOWN_KEY);
  // const version = localStorage.getItem(WELCOME_VERSION_KEY);
  // return !shown || version !== CURRENT_VERSION;
}

// 标记欢迎页面已显示
function markWelcomeShown(): void {
  localStorage.setItem(WELCOME_SHOWN_KEY, "true");
  localStorage.setItem(WELCOME_VERSION_KEY, CURRENT_VERSION);
}

// 路由配置
function AppInner() {
  const [showWelcome, setShowWelcome] = useState(false);
  
  // 检查是否需要显示欢迎页面
  useEffect(() => {
    if (shouldShowWelcome()) {
      setShowWelcome(true);
    }
  }, []);
  
  const handleWelcomeComplete = () => {
    markWelcomeShown();
    setShowWelcome(false);
  };
  
  // 显示欢迎页面
  if (showWelcome) {
    return (
      <BrowserRouter basename={basename}>
        <WelcomePage onComplete={handleWelcomeComplete} />
      </BrowserRouter>
    );
  }
  
  // 显示主应用
  return (
    <BrowserRouter basename={basename}>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/*" element={<MainLayout />} />
      </Routes>
    </BrowserRouter>
  );
}
```

## 🎨 主要组件详解

### 1. UniverseBackground (3D 宇宙背景)

**位置**: `console/src/pages/Welcome/components/UniverseBackground.tsx`

**技术栈**: Three.js

**核心特性**:
```typescript
// 1. 粒子系统
const PARTICLES_COUNT = 2000;  // 2000 个粒子

// 2. 四季系统
const SEASONS = [
  { name: '🌸 SPRING', darkBg: [5, 20, 15], speedMult: 1.0 },
  { name: '☀️ SUMMER', darkBg: [25, 5, 5], speedMult: 1.8 },
  { name: '🍁 AUTUMN', darkBg: [20, 15, 0], speedMult: 0.7 },
  { name: '❄️ WINTER', darkBg: [5, 10, 30], speedMult: 0.3 }
];

// 3. 冲击波系统 (鼠标交互)
const shockwaveRef = useRef({ x: 0, y: 0, intensity: 0 });

// 4. 双阵营粒子 (对抗效果)
factionsArray[i] = i % 2;  // Team A or Team B
```

**视觉效果**:
- 球形分布的 2000 个粒子
- 四季变换的背景颜色
- 鼠标点击产生冲击波
- 粒子之间的对抗动画

### 2. HeroContent (主要内容)

**位置**: `console/src/pages/Welcome/components/HeroContent.tsx`

**内容结构**:
```typescript
<div className={styles.heroContent}>
  {/* 状态徽章 */}
  <div className={styles.statusBadge}>
    <span className={styles.statusDot} />
    {t("welcome.statusBadge")}  // "AI Personal Assistant v0.2"
  </div>
  
  {/* 标题 */}
  <h1 className={styles.mainTitle}>
    {t("welcome.title")}  // "Welcome to"
    <ScrambleText text={keyword} />  // "Xing Chenxin AI"
    <br />
    {t("welcome.subtitle")}  // "Understanding your needs..."
  </h1>
  
  {/* 描述 */}
  <p className={styles.description}>
    {t("welcome.description")}
  </p>
  
  {/* 提示 */}
  <p className={styles.blackSwanHint}>
    [ {t("welcome.particleHint")} ]  // "Click anywhere..."
  </p>
</div>
```

### 3. ScrambleText (文字特效)

**位置**: `console/src/pages/Welcome/components/ScrambleText.tsx`

**效果**: 文字随机字符变换动画

```typescript
// 当黑天鹅事件触发时，文字会随机变换后恢复
<ScrambleText 
  text={keyword}  // "Xing Chenxin AI"
  trigger={scrambleTrigger}  // true/false
/>
```

### 4. GameTelemetry (游戏遥测面板)

**位置**: `console/src/pages/Welcome/components/GameTelemetry.tsx`

**功能**: 显示系统状态和模拟的遥测数据

```typescript
// 显示内容:
// - 帧率 (FPS)
// - 粒子数量
// - 季节状态
// - 团队对抗状态
```

## 🎨 样式系统

### 主要样式 (`index.module.less`)

```less
// 容器
.welcomeContainer {
  position: fixed;
  width: 100vw;
  height: 100vh;
  background: rgb(5, 20, 15);  // 默认春季背景
  z-index: 9999;
}

// 按钮样式
.primaryButton {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-radius: 8px;
  padding: 12px 32px;
  font-size: 16px;
  font-weight: 600;
  color: white;
  cursor: pointer;
  transition: all 0.3s ease;
}

.secondaryButton {
  background: transparent;
  border: 2px solid rgba(255, 255, 255, 0.3);
  border-radius: 8px;
  padding: 12px 32px;
  color: white;
  cursor: pointer;
}
```

## 🌐 国际化配置

### 英文翻译 (`console/src/locales/en.json`)

```json
{
  "welcome": {
    "title": "Welcome to",
    "keyword": "Xing Chenxin AI",
    "subtitle": "Understanding your needs, always by your side",
    "statusBadge": "AI Personal Assistant v0.2",
    "description": "From social media to productivity tools, one CoPaw connects all channels. Supporting multi-platform intelligent assistants for DingTalk, Feishu, QQ, Discord, and more.",
    "particleHint": "Click anywhere to trigger particle effects",
    "blackSwanEvent": "BLACK SWAN EVENT",
    "getStarted": "Get Started",
    "skip": "Skip"
  }
}
```

### 中文翻译 (`console/src/locales/zh.json`)

```json
{
  "welcome": {
    "title": "欢迎使用",
    "keyword": "星辰心 AI",
    "subtitle": "懂你所需，始终相伴",
    "statusBadge": "AI 个人助手 v0.2",
    "description": "从社交媒体到生产力工具，一个 CoPaw 连接所有渠道。支持钉钉、飞书、QQ、Discord 等多平台智能助手。",
    "particleHint": "点击任意位置触发粒子效果",
    "blackSwanEvent": "黑天鹅事件",
    "getStarted": "开始使用",
    "skip": "跳过"
  }
}
```

## 🎬 动画效果

### Framer Motion 动画

```typescript
// 1. 淡入效果
<motion.div
  initial={{ opacity: 0 }}
  animate={{ opacity: 1 }}
  transition={{ duration: 1 }}
>

// 2. 按钮悬停效果
<motion.button
  whileHover={{ scale: 1.05 }}  // 放大 5%
  whileTap={{ scale: 0.95 }}     // 点击缩小 5%
>

// 3. 黑天鹅遮罩动画
<AnimatePresence>
  {blackSwanActive && (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      BLACK SWAN EVENT
    </motion.div>
  )}
</AnimatePresence>
```

## 🔧 自定义配置

### 修改欢迎页面显示频率

**文件**: `console/src/App.tsx`

```typescript
// 当前: 每次刷新都显示 (测试模式)
function shouldShowWelcome(): boolean {
  return true;
}

// 改为: 只显示一次 (生产模式)
function shouldShowWelcome(): boolean {
  const shown = localStorage.getItem(WELCOME_SHOWN_KEY);
  const version = localStorage.getItem(WELCOME_VERSION_KEY);
  return !shown || version !== CURRENT_VERSION;
}
```

### 修改粒子数量

**文件**: `console/src/pages/Welcome/components/UniverseBackground.tsx`

```typescript
// 当前: 2000 个粒子
const PARTICLES_COUNT = 2000;

// 减少: 提高性能
const PARTICLES_COUNT = 1000;

// 增加: 更炫酷 (可能影响性能)
const PARTICLES_COUNT = 5000;
```

### 修改四季持续时间

**文件**: `console/src/pages/Welcome/components/UniverseBackground.tsx`

```typescript
// 当前: 20 秒换季
const SEASON_DURATION = 20;

// 改为: 10 秒换季 (更快)
const SEASON_DURATION = 10;
```

## 🎯 修改欢迎页面文字

### 方法 1: 修改国际化文件

**英文**: `console/src/locales/en.json`
**中文**: `console/src/locales/zh.json`

```json
{
  "welcome": {
    "title": "你的标题",
    "keyword": "你的关键词",
    "subtitle": "你的副标题"
  }
}
```

### 方法 2: 直接修改组件

**文件**: `console/src/pages/Welcome/components/HeroContent.tsx`

```typescript
<h1 className={styles.mainTitle}>
  欢迎使用<br />
  <span className={styles.keyword}>CoPaw AI</span>
  <br />
  <span className={styles.subtitle}>你的智能助手</span>
</h1>
```

## 📦 依赖库

```json
{
  "dependencies": {
    "react": "^18.x",
    "react-router-dom": "^7.x",
    "three": "^3.x",           // 3D 图形库
    "framer-motion": "^11.x",  // 动画库
    "react-i18next": "^13.x",  // 国际化
    "@agentscope-ai/design": "latest"  // UI 组件库
  }
}
```

## 🚀 快速修改指南

### 修改标题文字

1. 打开 `console/src/locales/zh.json`
2. 找到 `welcome.title`
3. 修改为你的文字

### 修改背景颜色

1. 打开 `console/src/pages/Welcome/components/UniverseBackground.tsx`
2. 找到 `SEASONS` 配置
3. 修改 `darkBg` 和 `lightBg` 颜色值

### 移除欢迎页面

1. 打开 `console/src/App.tsx`
2. 修改 `shouldShowWelcome()` 函数
3. 返回 `false` 而不是 `true`

### 添加新功能

1. 在 `console/src/pages/Welcome/components/` 创建新组件
2. 在 `index.tsx` 中引入并使用
3. 添加相应的样式到 `index.module.less`

---

**总结**: CoPaw 的欢迎界面是一个功能丰富的单页应用，使用了 Three.js 构建 3D 粒子系统，Framer Motion 处理动画，React Router 处理路由，i18next 处理国际化。整个界面采用组件化设计，易于扩展和定制。
