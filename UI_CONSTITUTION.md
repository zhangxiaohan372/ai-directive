# UI Style & Development Constitution (界面规范与代码整洁锚点)

> **视觉规范 Skill 路径**：`.agent/skills/mystery-platform-ui-style/SKILL.md` (镜像：`.claude/`、`.github/`)  
> **架构与样式整洁 Skill 路径**：`.agent/skills/project-format-optimization/SKILL.md` (镜像：`.claude/`、`.github/`)  
> **工程自动化校验脚本**：`scripts/check-ui-style.ts` (已挂载至 `npm run lint`)

每次在进行任何前端界面修改、新增页面、调整主题、重构组件或设计组件时，**必须严格遵守**上述两份 Skill 中的规范与核心红线：

1. **【反例 1】绝对禁止在 UI 中使用任何 Emoji**（强制使用 `lucide-vue-next` 矢量线框图标）。
2. **【反例 2】绝对禁止在模板 class 中拼接长串三元表达式硬编码色值**（禁止 `:class="isDark ? '一大长串十六进制' : '另一长串'"`，必须使用 CSS 变量或 Tailwind 语义类驱动双主题）。
3. **【反例 3】绝对禁止单色纯黑死锁与随意滥用 `:style`**（除动态几何定位与 Canvas 外，禁止使用 `:style` 设背景色与文字色）。
4. **【反例 4】绝对禁止 components 目录扁平混杂核心逻辑**（算法引擎放 `src/core/`，整屏页面放 `src/views/`，弹窗抽屉分类归档，禁止单文件超过 450 行）。
5. **【反例 5】绝对禁止摆放无交互逻辑的假按钮**（没用到的按钮直接删除，保留的必须有动作）。
6. **【反例 6】绝对禁止子页面顶栏割裂与浮夸霓虹光晕**（统一品牌顶栏，保持本格古典侦探档案质感）。

任何代码修改后执行 `npm run lint` 将自动运行工程门禁。若违反规范，构建将直接被拦截报错。
