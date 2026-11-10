# 迷雾剧场（MysteryStage）- AI 主持多人互动推理游戏

> **首发案件：《午夜画廊：锁闭之谜》 (The Midnight Gallery)**  
> 体验纯正的 20 分钟多轮次剧本杀：搜查画廊物证、盘问 AI 嫌疑人、拆解密室反锁诡计、指认真凶并生成案件复盘。

---

## 视觉与 3D 风格体系
- **现代艺术画廊美学**：告别压抑黑暗或企业后台，采用奶油白（#FDFBF7）、天空蓝（#38BDF8）、珊瑚橙（#FB7185）、薄荷绿（#34D399）与薰衣草紫（#C084FC），点缀香槟金光泽。
- **Three.js 微缩画廊模型**：
  - 纯几何体（Low-Poly）原创程序化建模，零外部模型依赖。
  - 4 个可交互房间（中央展厅、修复室命案现场、办公室、保安室）。
  - 支持 3D 自由旋转与 2D 平面图平滑降级（兼顾性能与低配设备）。
- **3D 旋转证物检视器**：
  - 破碎古董金怀表、带指纹香槟杯、撕碎协议、高密尼龙线锁扣等物证均支持 360° 拖拽检视与法医微观痕迹辨析。

---

## 系统架构设计

```
[前端 SPA (React 19 + TypeScript + Tailwind 4 + Three.js)]
        │
        ├── HTTP / WebSocket 消息交互
        ▼
[后端服务 (Express + Node.js/tsx)]
        │
        ├── MCP 工具调度器 (Model Context Protocol 8大核心工具)
        │     ├── get_game_state / get_player_inventory
        │     ├── inspect_location / interrogate_npc
        │     ├── reveal_hint / start_vote / submit_vote / advance_story
        │
        ├── RAG 知识检索与防剧透仲裁器 (Spoiler Arbitrator)
        │     ├── 分阶段 / 权限 / 已解锁线索过滤知识切片
        │     └── 剧透风险阈值拦截 (spoilerRisk > 0.4 自动清洗并记录审计)
        │
        ├── AI 模型适配层 (@google/genai TypeScript SDK)
        │     ├── Gemini 2.5 Flash 结构化生成
        │     └── 纯逻辑确定性 Fallback 仿真引擎
        │
        └── 数据持久化与状态层
              ├── PostgreSQL: 房间、玩家、物证、线索图谱、投票持久化
              └── Redis: 实时房间状态、Pub/Sub 事件流、断线重连、分布式并发锁
```

---

## MCP 核心工具规范 (Model Context Protocol)

应用已内置并全量实现了 8 个标准 MCP 工具，由 AI 主持人和玩家行动触发：

1. `get_game_state(roomId)`：拉取当前房间阶段、已调查区域、线索数与玩家列表。
2. `get_player_inventory(roomId, playerId)`：获取玩家背包持有的证物与关联笔记。
3. `inspect_location(roomId, locationId)`：勘验搜查特定画廊区域，发现物理/数字/文档证物。
4. `interrogate_npc(roomId, npcId, question)`：对嫌疑人发起质询，触发情绪变化与结构化台词。
5. `reveal_hint(roomId, level)`：主持人分级（Level 1~3）发放破案推演提示。
6. `start_vote(roomId)`：终结搜查与讨论，强制发起全员指控投票。
7. `submit_vote(roomId, playerId, suspectId)`：记录玩家指认的凶手与推论依据。
8. `advance_story(roomId)`：推进主线故事（简报 -> 搜查 -> 审问 -> 讨论 -> 投票 -> 复盘）。

---

## RAG 检索与防剧透策略 (Anti-Spoiler Arbitration)

1. **多级知识切片（Knowledge Chunks）**：
   - `public_fact`：公开案情（受害人死因、案发时间、画廊地图）。
   - `npc_alibi`：嫌疑人初期伪装供词。
   - `npc_secret`：当且仅当玩家出示关键物证后才向 LLM 注入的隐秘记忆。
   - `truth_top_secret`：**绝密事实**（真凶身份与反锁机关），在复盘阶段前严禁灌入 NPC 上下文。
2. **三位一体输出审查机制**：
   - 每次 AI 回复必须返回结构化 JSON：`{ message, emotion, newClues, gameStateChanges, confidence, spoilerRisk }`。
   - 裁判判定器实时计算 `spoilerRisk`（0.0 ~ 1.0）。
   - 若 `spoilerRisk >= 0.4`，系统自动拦截原文本，降级为符合角色心理防线的挣扎抗拒台词，并将原始泄露记录保存至审计日志以供回溯。

---

## Redis 核心职责

在分布式多人场景中，Redis 承担 5 大关键职能：
1. **实时房间状态（In-Memory Room State）**：利用 Redis Hash 高速读写房间状态，延迟 < 2ms。
2. **Pub/Sub 广播**：多端玩家搜查物证、投票、聊天事件的毫秒级同步。
3. **断线恢复与会话恢复**：玩家刷新页面或网络波动时，依据 Token 秒级还原线索板与草稿。
4. **异步队列与 AI 调度**：审问质询任务排队，防止并发请求冲垮 API 限制。
5. **分布式锁（Redlock）**：防止多名玩家在同一时刻重复消耗线索或触发竞态投票。

*(注：本地开发与单机测试模式下，系统已内置零依赖的内存 Store 自动降级，无需强制启动 Redis 也可丝滑试玩！)*

---

## 启动与运行指南

### 本地快速运行 (推荐)
```bash
# 1. 安装依赖
npm install

# 2. 启动全栈开发服务 (端口 3000)
npm run dev

# 3. 运行纯逻辑单元测试 (内置 node:test)
npx --yes tsx --test src/game/engine.test.ts
```

### Docker Compose 容器化部署
```bash
docker-compose up -d --build
```
启动后访问 `http://localhost:3000`。

---

## 接入 Google Gemini API

在环境变量 `.env` 或运行时注入秘钥即可自动启用真实 Gemini 驱动：
```bash
GEMINI_API_KEY="your-google-ai-studio-api-key"
```
系统启动时将自动识别并在服务端调用 `@google/genai` 的 `gemini-2.5-flash` 模型进行深度上下文推理；若未配置秘钥，系统将无缝切换至内置的确定性高保真 RAG 仿真引擎，保障 100% 可玩性与演示完整度。
