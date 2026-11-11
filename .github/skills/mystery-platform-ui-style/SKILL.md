---
name: mystery-platform-ui-style
description: >
  规定 AI Detective 智能探案平台的界面视觉美学、色彩规范、排版层级、反例红线与组件一致性准则。在构建、重构前端界面、设计案件卡片、调整主题或编写页面交互时必须遵循。
---

# 平台 UI 视觉风格与反例红线规范 (UI Style Constitution)

本规范确立了本平台（AI Detective · 智能探案平台）的界面视觉哲学、双主题色彩系统、排版层级，并基于历史开发实践明确列出必须杜绝的**五大负面反例（Anti-Patterns）**。

---

## 1. 核心设计哲学 (Design Philosophy)

- **智性探案质感 (Analytical Detective Aesthetics)**：界面应传递严谨、理性、古典与沉浸的侦探书房质感，呈现如手工案卷、法医检验单、复古手稿一般的精致度。
- **克制与信息密度**：拒绝空洞的浮夸动画，重视信息排布的条理性、数据可视化的严密性与物理案卷的触感反馈。

---

## 2. 双主题色彩规范 (Dual Theme Palette)

平台全站支持且必须无缝联动 **白昼手稿 (Light Manuscript)** 与 **暗夜书房 (Dark Study)**：

### 白昼手稿 (Light Manuscript)
- **主背景基底**：`#F5EFE6`（老式羊皮纸暖灰白）/ `#FAF7F2`（卡片白底）
- **主要文字**：`#2C241E`（墨水炭黑，高对比度可读性）
- **次要辅助文字**：`#6E5F52` / `#8C7E72`（铅笔灰褐色）
- **核心品牌强调色**：`#8B3A2B`（火漆印章深朱红）/ `#783023`（悬停深红）
- **边框与分割线**：`#E8DFD5` / `#E0D5C7`（纸张压痕细线）

### 暗夜书房 (Dark Study)
- **主背景基底**：`#0C0A09`（黑曜石深木色）/ `#120F0D`（书桌深木卡片底）
- **主要文字**：`#E5DCD0` / `#F3EFEA`（古籍微黄象牙白）
- **次要辅助文字**：`#8C765E` / `#A89073`（黄铜氧化灰金）
- **核心品牌强调色**：`#C9942D` / `#DFB36C`（古董金、琥珀黄铜）
- **边框与分割线**：`#2C2117` / `#3E2D1E`（深胡桃木边框）

---

## 3. 五大负面反例红线 (Negative Anti-Patterns & Prohibitions)

以下 5 项是用户明确要求修改并杜绝的反例，任何 UI 代码中**严禁出现**：

### 反例 1：严禁在 UI 中使用任何 Emoji 字符 (Strict Zero-Emoji Rule)
- **错误反例**：
  ```tsx
  // 错误：使用 Emoji 破坏严肃侦探质感与跨端一致性
  <button>🔍 搜索案件</button>
  <span className="badge">🔥 热门案卷</span>
  <div>✅ 校验通过</div>
  <p>⚠️ 检测到逻辑冲突</p>
  ```
- **正确规范**：
  必须统一采用精细矢量线框图标（如 `lucide-react`），图标线宽推荐 1.5 - 1.8px：
  ```tsx
  // 正确：使用精致矢量线框图标
  <button className="flex items-center gap-1.5">
    <Search className="w-3.5 h-3.5 text-stone-500" />
    <span>搜索案件</span>
  </button>
  <span className="badge flex items-center gap-1">
    <Flame className="w-3.5 h-3.5 text-amber-500" />
    <span>热门案卷</span>
  </span>
  <div className="flex items-center gap-1.5 text-emerald-500">
    <CheckCircle2 className="w-3.5 h-3.5" />
    <span>校验通过</span>
  </div>
  ```

---

### 反例 2：严禁全屏死板纯黑 / 单色死锁 (No Monochrome Pure-Black Lock)
- **错误反例**：
  进入案件游玩、试玩或编辑页后，强行写死 `className="bg-black text-white min-h-screen"`，导致用户点击顶部切换白昼主题时界面没有任何反应。
- **正确规范**：
  所有页面容器与组件必须联动响应全局 `themeMode` 或 `isDark`：
  ```tsx
  <div className={`min-h-screen transition-colors duration-300 ${
    isDark ? 'bg-[#0C0A09] text-[#E5DCD0]' : 'bg-[#F5EFE6] text-[#2C241E]'
  }`}>
  ```

---

### 反例 3：严禁摆设无实际交互的悬空废弃按钮 (No Redundant Dummy Buttons)
- **错误反例**：
  页面上摆放了“导出 PDF”、“社交分享”、“高级过滤器”、“AI 诊断”，但点击后无任何 `onClick` 处理函数、无任何交互反馈，沦为摆设。
- **正确规范**：
  - 没用到的冗余按钮**坚决删除**，保持界面精简克制。
  - 保留的每一个按钮都必须有明确的功能挂载、即时音效（`sound.playPaperRustle()`）与视觉状态反馈。

---

### 反例 4：严禁各级子页面顶部栏割裂不一致 (Unified Header Standard)
- **错误反例**：
  主页顶栏是一种设计，进入案件创作台后换成了另外一套完全不同的顶部栏，缺失了返回主页、全局主题切换、全局静音和品牌标志。
- **正确规范**：
  全站所有模块（首页、创作工作台、游戏试玩）的顶栏必须保持完全一致的品牌头结构：
  1. 左侧：品牌 Logo + `AI DETECTIVE · 智能探案平台` + 返回首页链接。
  2. 中间：案卷名称切换或当前模块面包屑。
  3. 右侧：白昼/暗夜分段切换开关 + 音效静音按钮 + 侦探头像印章 + 主行动按钮（如“进入试玩”）。

---

### 反例 5：严禁浮夸的 AI 科技感霓虹光晕 (No Neon AI Slop)
- **错误反例**：
  滥用高饱和度荧光紫、荧光青光晕、发光大药丸圆角胶囊（Pill）、旋转渐变彩虹边框等带有明显“AI 模版垃圾感”的设计。
- **正确规范**：
  采用典雅的微边框（`border border-[#E8DFD5]` / `border-[#2C2117]`）、书卷圆角（`rounded-xl` / `rounded-2xl`）、复古衬线排版（`font-serif`）与真实的按压微阴影。

---

## 4. 排版与字体规范 (Typography Hierarchy)

- **主标题与品牌字**：优先采用 `font-serif font-black` 或 `font-serif font-bold`，字距微展（`tracking-wide`）。
- **正文与辅助描述**：采用无衬线可读字体 `font-sans`，行距舒适（`leading-relaxed`），字号控制在 `text-xs` (12px) 到 `text-sm` (14px)。
- **时间戳、案卷编号与统计数据**：必须使用等宽字体 `font-mono`，突出侦探档案的严谨精确。
