---
name: vue-tailwind-styling-rules
description: >
  规定 Vue 3 + Tailwind CSS v4 样式工程化规范：彻底杜绝 HTML 模板内联三元表达式色值拼接、杜绝多层无语义遮罩 div 堆砌、规范 Tailwind v4 Canonical 标准类名写法（bg-linear-to-*、h-dvh、标准尺寸）、规范 <style scoped> 与 @reference @apply 抽离机制，以及 VSCode 静态校验警告清零。在编写、修改、重构任何 Vue 组件样式时必须严格遵循。
---

# Vue 3 与 Tailwind CSS v4 样式工程化规范 (Vue & Tailwind Styling Skill)

本规范用于彻底消除 Vue 项目中**内联样式类名失控**、**多重主题三元嵌套地狱**、**Tailwind v4 废弃语法导致的编辑器全屏黄色警告**，以及**无语义空标签遮罩滥用**的问题。

---

## 一、 Tailwind v4 标准规范 (Canonical Classes)

Tailwind CSS v4 引入了现代化 CSS 原生特性并对旧版语法进行了规范化重构，所有组件**必须使用 v4 标准类名，严禁使用旧版或非标类**：

### 1. 线性渐变规范
- ❌ **严禁使用旧版**：`bg-gradient-to-r`、`bg-gradient-to-t`、`bg-gradient-to-br`、`bg-gradient-to-tr`
- ✅ **必须使用 v4 标准**：`bg-linear-to-r`、`bg-linear-to-t`、`bg-linear-to-br`、`bg-linear-to-tr`

### 2. 视口全屏高度规范
- ❌ **严禁使用**：`h-[100dvh]`、`h-[100vh]`、`min-h-[100vh]`
- ✅ **必须使用**：`h-dvh`、`min-h-dvh`、`h-screen`

### 3. 尺寸与间距标准档位
- ❌ **严禁随意写中括号任意像素**：`h-[540px]`、`sm:h-[580px]`、`lg:h-[620px]`、`max-w-[90px]`
- ✅ **必须优先使用 Tailwind 标准步进（4px 进制）**：`h-135`、`sm:h-145`、`lg:h-155`、`max-w-22.5`、`max-w-24`

### 4. 描边与滤镜标准类
- ❌ **严禁写非标或任意值**：`stroke-[2.5]`、`scale-[1.01]`、`contrast-[0.92]`
- ✅ **必须使用标准类**：`stroke-2`、`scale-105`、`contrast-95`

---

## 二、 杜绝模板“三元表达式地狱”与硬编码色值

### 1. 核心原则：样式决策下沉至 CSS 变量
双主题（如暗夜书房 / 白昼手稿）的色彩切换，**严禁由 JavaScript 在 HTML 标签上写三元判断**。
根节点 `html.dark` 会自动切换底层 CSS 变量，模板只需直接使用语义设计 Token。

#### ❌ 严重反例（模板可读性极差，禁止出现）：
```html
<div
  :class="[
    'p-4 rounded-xl border transition-colors',
    isDark
      ? 'bg-[#181411] border-[#3B3027] text-[#F3EFEA]'
      : 'bg-white border-[#E8DFD5] text-[#1C1917]'
  ]"
>
  <span :class="isDark ? 'text-[#A89073]' : 'text-[#8C7E72]'">最后编辑于刚刚</span>
  <button :class="isDark ? 'text-[#C9942D] hover:text-[#E5C384]' : 'text-[#8B3A2B] hover:text-[#783023]'">
    操作
  </button>
</div>
```

#### ✅ 标准范式（语义 Token，零三元）：
```html
<div class="p-4 rounded-xl border border-theme-border bg-theme-card text-theme-ink transition-colors">
  <span class="text-theme-muted">最后编辑于刚刚</span>
  <button class="text-theme-accent hover:opacity-80">
    操作
  </button>
</div>
```

### 2. 全局通用设计 Token 速查表
| 语义分类 | Tailwind 类名 | 底层 CSS 变量 | 对应含义 |
| :--- | :--- | :--- | :--- |
| **底板背景** | `bg-theme-desk` | `--bg-desk` | 全屏工作台桌面底色 |
| **卡片背景** | `bg-theme-card` | `--bg-card` | 案卷卡片、主要容器 |
| **微弱背景** | `bg-theme-card-subtle` | `--bg-card-subtle` | 卡片头部、内嵌凹槽 |
| **控件表面** | `bg-theme-surface` | `--bg-surface` | 按钮、输入框、下拉框背景 |
| **主标题字** | `text-theme-ink` | `--text-primary` | 极高对比度正文与标题墨色 |
| **次级文本** | `text-theme-secondary` | `--text-secondary` | 正文说明、副标题 |
| **弱化注释** | `text-theme-muted` | `--text-muted` | 时间戳、标签、辅助提示 |
| **细边框线** | `border-theme-border` | `--border-subtle` | 默认案卷分割细线 |
| **强边框线** | `border-theme-border-strong` | `--border-strong` | 选中高亮、焦点轮廓 |
| **平台主题色** | `text-theme-accent` / `bg-theme-accent` | `--color-accent` | 印章朱红（白昼） / 复古琥珀金（暗夜） |

---

## 三、 杜绝模板“多层空 div 遮罩”堆砌

### 1. 核心原则：复合遮罩收归 CSS
当需要为背景图制作“渐变暗角”、“边缘弱化”、“内阴影”时，**严禁在 HTML 模板中连续写 3 个空的 `div`**。必须在 `<style scoped>` 中使用复合背景声明收归为单层语义节点。

#### ❌ 严重反例（模板结构污染）：
```html
<!-- 错误：3 个空 div 堆砌，每个挂满长串内联渐变类 -->
<div class="absolute inset-0 bg-gradient-to-t from-black/90 via-black/45 to-transparent pointer-events-none" />
<div class="absolute inset-0 bg-gradient-to-tr from-black/85 via-black/40 to-transparent w-full md:w-3/4 pointer-events-none" />
<div class="absolute inset-0 shadow-[inset_0_0_120px_rgba(0,0,0,0.85)] pointer-events-none" />
```

#### ✅ 标准范式（单层语义遮罩）：
```html
<!-- 模板：清爽利落 -->
<div class="hero-ambient-mask" />
```
```css
/* scoped CSS：使用复合背景与径向渐变 */
.hero-ambient-mask {
  @apply absolute inset-0 pointer-events-none;
  background:
    radial-gradient(ellipse at center, transparent 35%, rgba(0, 0, 0, 0.85) 100%),
    linear-gradient(to top, rgba(0, 0, 0, 0.9) 0%, rgba(0, 0, 0, 0.45) 50%, transparent 100%),
    linear-gradient(to top right, rgba(0, 0, 0, 0.85) 0%, rgba(0, 0, 0, 0.35) 60%, transparent 100%);
}
```

---

## 四、 `<style scoped>` 与 `@apply` 规范

### 1. 必须引入 `@reference`
在 Vue SFC 单文件组件的 `<style scoped>` 中使用 `@apply` 时，**首行必须引入全局样式索引**，否则 Tailwind v4 会在打包时抛出 `Cannot apply unknown utility class` 错误：
```css
<style scoped>
@reference "../../index.css";

.custom-btn {
  @apply px-4 py-2 rounded-xl bg-theme-accent text-white;
}
</style>
```

### 2. 严禁在 `@apply` 中使用伪类标记
- ❌ **严禁**：`@apply group`、`@apply peer`（这些是 CSS 选择器标记，不是样式属性）
- ✅ **正确**：将 `group` 或 `peer` 直接写在 HTML 模板的 `class` 上：`class="my-card group"`

### 3. 组件样式抽取阈值
- 凡是在模板中**重复出现 2 次以上**的复合控件（如操作按钮、卡片、标签徽章），必须抽取为 scoped 语义类（如 `.nav-icon-btn`、`.case-card`、`.tag-pill`），杜绝 HTML 节点上挂载超过 12 个类名。

---

## 五、 VSCode 编辑器校验与警告清零

为了避免 VSCode 原生 CSS 校验器误把 Tailwind 特有的 `@apply`、`@theme`、`@reference` 判定为 `Unknown at rule`，工程根目录下**必须固化 `.vscode/settings.json`**：

```json
{
  "css.lint.unknownAtRules": "ignore",
  "scss.lint.unknownAtRules": "ignore",
  "less.lint.unknownAtRules": "ignore"
}
```

任何重构修改完成后，必须执行：
1. `npm run lint`（TypeScript 与 UI Guardrail 门禁）
2. `npm run build`（Vite 生产打包验证）
必须保证 0 报错、0 警告。
