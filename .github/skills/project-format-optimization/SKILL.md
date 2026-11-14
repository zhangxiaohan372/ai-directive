---
name: project-format-optimization
description: >
  规定 AI Detective 项目与前端工程的目录解构分层、Vue SFC 单文件组件架构、杜绝内联样式与三元表达式类名污染、CSS 变量语义化主题体系，以及代码整洁与可读性重构规范。在重构代码、新增模块、创建页面、组织组件或编写样式时必须遵循。
---

# 项目解构与样式代码整洁规范 (Project Architecture & Styling Cleanliness Skill)

本规范专为解决前端工程中**目录扁平混乱**、**巨石组件失控**、**内联样式与超长三元 class 污染模板**等严重损耗代码可读性的问题而制定。

---

## 一、 核心架构分层标准 (Directory Structure Standard)

严禁在 `src/components/` 下无序平铺堆叠所有组件，必须严格遵循职责单一与层次分明原则。

### 1. 标准工程目录树
```text
src/
├── assets/                  # 经打包流水线处理的静态资源（图片/音效）
│   ├── audio/               # 游戏音效与背景声景
│   └── images/              # 语义化命名的图像（禁止携带随机毫秒时间戳）
├── core/                    # 【核心领域逻辑】纯 TS/JS，禁止包含 Vue 渲染逻辑
│   ├── engine/              # 案情推演引擎、状态机、阶段调度 (engine.ts)
│   ├── studio/              # LangGraph 创作流、逻辑校验器 (langgraphEngine.ts)
│   ├── mcp/                 # MCP 协议通信与工具注册 (mcp.ts)
│   └── rag/                 # 问答检索与线索向量匹配 (rag.ts)
├── views/                   # 【页面级视图】由路由或核心状态调度的大屏视图
│   ├── Home/                # 首页玄关、案卷封面入口 (HomeHero, HomePortal)
│   ├── Investigation/       # 3D 搜证主场景视图 (SceneInvestigationView)
│   ├── CaseStudio/          # 案件创作工作台完整界面
│   └── Lobby/               # 多人联机大厅视图
├── components/              # 【可复用 UI 组件】仅负责展示与用户交互
│   ├── common/              # 基础原子组件（DeskButton, DossierBadge, AppHeader 等）
│   ├── modals/              # 独立弹窗模态框（FloorPlanModal, EvidenceModal3D 等）
│   └── panels/              # 抽屉与浮动面板（InvestigationDrawer, CaseBoardDrawer 等）
├── composables/             # 组合式函数（useAuth, useTheme, useAudio, useGameState）
├── data/                    # 静态案件配置与场景数据 (caseData, sceneData)
├── types/                   # 全局 TypeScript 类型契约
├── utils/                   # 通用无状态工具函数
├── router/                  # 页面路由配置
├── App.vue                  # 根容器（仅做 Provider 挂载与顶层路由容器，禁止做巨石调度）
└── index.css                # 全局样式与 CSS 变量语义系统
```

### 2. 目录解耦三大红线
1. **禁止在 `components/` 混杂核心领域业务**：
   `CaseStudio` 中的 `langgraphEngine.ts`、`logicValidator.ts`、`evidenceLogicEngine.ts` 必须归入 `src/core/studio/`，组件目录只保留 `.vue` 视图文件。
2. **禁止将“整屏页面”混作“普通组件”**：
   全屏切换的内容（如首页、3D 搜证场、联机大厅、工坊）必须放入 `src/views/`。
3. **禁止将静态资源多处分散**：
   统一静态资源分类。开发中引用的图片放入 `src/assets/images/`，禁止出现 `xxx_1793514263967.jpg` 这种毫无语义的时间戳命名，必须重命名为 `midnight_gallery_cover.jpg` 等直观小写下划线或短横线格式。

---

## 二、 样式整洁与内联消除规范 (Zero-Inline & Style Cleanliness)

任何组件必须保证 **HTML 模板骨架一目了然**，坚决杜绝样式字符串淹没 DOM 结构。

### 1. 【反例一】严禁在模板 class 中书写超长三元表达式拼接色值
#### ❌ 错误反例（可读性灾难）：
```html
<!-- 错误：将主题判断塞进每个标签，充斥硬编码色值，模板膨胀数倍 -->
<div
  class="relative w-full border transition-colors select-none"
  :class="
    isDark
      ? 'bg-[#181411]/85 border-[#3B3027] text-[#F3EFEA] shadow-[0_25px_60px_-15px_rgba(0,0,0,0.95)]'
      : 'bg-white/95 border-[#EBE4DC] text-[#1C1917] shadow-[0_20px_50px_-10px_rgba(0,0,0,0.08)]'
  "
>
  <span :class="isDark ? 'text-[#A89073]' : 'text-[#8C7E72]'">线索名称</span>
</div>
```

#### ✅ 正确规范（CSS 语义变量法）：
所有主题色在 `src/index.css` 的 `:root` 与 `.dark` 中集中定义，模板中直接引用语义化变量或 Tailwind 语义类：

```css
/* src/index.css */
:root {
  --bg-desk: #F5EFE6;
  --bg-card: #FAF7F2;
  --text-ink: #2C241E;
  --text-muted: #8C7E72;
  --border-dossier: #E8DFD5;
}

.dark {
  --bg-desk: #0C0A09;
  --bg-card: #130F0D;
  --text-ink: #F3EFEA;
  --text-muted: #A89073;
  --border-dossier: #3B3027;
}
```

```html
<!-- 正确：清爽优雅，模板回归 DOM 语义本身，主题切换由 CSS 引擎自动处理 -->
<div class="relative w-full bg-[var(--bg-card)] text-[var(--text-ink)] border-[var(--border-dossier)] border rounded-xl select-none">
  <span class="text-[var(--text-muted)]">线索名称</span>
</div>
```

---

### 2. 【反例二】严禁随意使用 `:style` 内联样式
#### ❌ 错误反例：
```html
<!-- 错误：用内联 style 绑定背景色、字体颜色、内边距 -->
<div :style="{ backgroundColor: suspect.avatarColor, padding: '12px', color: '#fff' }">
```

#### ✅ 正确规范：
* **`:style` 的唯一合法使用场景**：
  1. **离散几何绝对定位**（如 3D 搜证热区坐标）：`:style="{ left: `${hs.x}%`, top: `${hs.y}%` }"`
  2. **Canvas / WebGL / SVG 动态渲染属性**
* 颜色与状态样式必须通过 CSS 变量或预设类名处理：
  ```html
  <!-- 正确：将动态色值注入为当前元素的局部 CSS 变量，在 class 中解耦调用 -->
  <div class="suspect-tag" :style="{ '--accent-col': suspect.avatarColor }">
  ```

---

### 3. 【反例三】严禁在单个标签上堆积超过 10 个原子类且到处重复
#### ❌ 错误反例：
同一款风格的古董质感按钮，在 5 个组件里各复制一遍以下代码：
```html
<button class="group flex items-center gap-2 px-3.5 py-2 rounded-full bg-stone-950/60 hover:bg-stone-900/80 text-stone-200 border border-stone-600/40 backdrop-blur-md transition-all duration-200 shadow-lg hover:border-amber-400/50 cursor-pointer active:scale-95">
```

#### ✅ 正确规范：
* **方案 A（组件封装）**：封装基础组件 `src/components/common/DeskButton.vue`，外部直接 `<DeskButton variant="secondary">按钮</DeskButton>`。
* **方案 B（Tailwind 样式提取）**：在 `index.css` 或组件 `<style scoped>` 中利用 `@apply` 提取语义类：
  ```css
  .btn-dossier {
    @apply flex items-center gap-2 px-4 py-2 rounded-full backdrop-blur-md border transition-all cursor-pointer active:scale-95;
  }
  ```

---

## 三、 Vue 3 单文件组件 (SFC) 可读性规范

### 1. 结构布局顺序
每个 `.vue` 文件必须严格按以下顺序编写：
```vue
<script setup lang="ts">
// 1. 类型引入 (import type ...)
// 2. 第三方与外部依赖引入
// 3. 内部组件与资产引入
// 4. Props & Emits 明确定义 (使用 TypeScript 泛型字面量)
// 5. 响应式状态 (ref, reactive)
// 6. 计算属性 (computed)
// 7. 侦听器与生命周期 (watch, onMounted)
// 8. 业务处理函数 (handleXxx)
</script>

<template>
  <!-- 语义化标签结构 -->
</template>

<style scoped>
/* 局部样式补充（若无则省略） */
</style>
```

### 2. 规模与复杂度红线
* **行数软上限**：单文件组件控制在 **250 行以内**。
* **行数硬上限**：严禁单文件超过 **450 行**。超过 450 行必须执行重构：
  1. 将内部子弹窗或子模块拆分为独立子组件；
  2. 将复杂的数据计算与逻辑抽离至 `useXxx.ts` 组合式函数；
  3. 将纯数据常量剥离至 `src/data/`。

### 3. 模板格式化对齐准则
当 HTML 标签的属性超过 2 个或 class 较长时，必须换行排版，禁止水平滚屏：
```html
<!-- 推荐的可读格式 -->
<button
  type="button"
  class="btn-dossier text-stone-200"
  :disabled="isLoading"
  @click="handleInvestigate"
>
  <Search class="w-4 h-4 text-amber-400" />
  <span>展开搜查</span>
</button>
```

---

## 四、 重构执行落地清单 (Refactor Checklist)

在对现有文件进行重构时，按如下 4 步走：

1. **检查组件职责**：此文件是否包含页面路由逻辑？若是，迁移至 `src/views/`；是否包含纯计算/状态机？若是，迁移至 `src/core/`。
2. **剔除三元色值**：搜索文件中的 `isDark ? '`，将其替换为 CSS 变量 `var(--...)` 或 Tailwind 语义类，并删除组件内多余的 `isDark` 计算属性。
3. **收敛 `:style`**：清理非几何计算的内联样式，转为样式类。
4. **单文件减肥**：检查总行数，若超过 300 行，拆出内部子弹窗并提取 `composable`。
