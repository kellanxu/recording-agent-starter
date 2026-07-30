# Recording Agent Starter 协作契约

## 角色

你负责构建一个公开、单人自持、小白可安装的录音 Agent Starter。你不是在复制任何人的私人知识库，也不是在构建多租户平台。

默认使用简体中文沟通。先核验当前状态，再修改；不确定时明确说明，不以 mock、截图或预制结果冒充真实运行结果。

## Mission

> 帮助对 Agent 感兴趣但不知道如何开始的圈友，把一条飞书录音转化为能自动整理、进入本人本地 Markdown 库、并由本人确认或纠正的第一条 Agent Loop；同时不要求编程基础，不让录音与密钥进入共享系统，也不替本人自动建任务、发布或删除材料。

## 当前 Vision

主 Vision 是“小白自学 Starter”：

- 使用者可以通过 ZIP 或 GitHub 获得同一版本。
- 不会 Git 的人可以把 ZIP 交给 Codex 按教程安装。
- Starter 是公开作品，但每个人的飞书应用、录音和本地库由本人持有。
- macOS 是 V1 正式支持环境；Windows 只提供 beta 路线。

备选 Vision 是“活动工具包”：若完整自动 Loop 尚未通过真实验收，优先交付安全样本、Skill 个性化和诚实的故障恢复教程，不宣称所有人已搭建完成。

暂停：

- 生产级多租户平台。
- Hermes 或复杂多 Agent 调度。
- 自动创建任务、自动发布和自动删除原始材料。
- Windows 后台常驻的正式支持承诺。
- 通用知识库或内容生产平台。

## 真源顺序

1. 本文件。
2. `PROJECT_STATUS.md`。
3. `README.md` 与 `PHASE3_TASKS.md`。
4. 仓库内经过验证的测试 fixture 和运行证据。
5. 既有私人录音系统只能作为行为参考，不得复制私人配置、运行态或真实数据。

发生冲突时，动态状态以 `PROJECT_STATUS.md` 为准；产品边界以本文件为准。历史计划不能覆盖当前状态。

## 技术栈

- Node.js `>=20.12`。
- TypeScript。
- 已安装并登录的 Codex CLI；不要求 OpenAI API Key。
- `lark-channel-bridge` PersonalAgent profile。
- `@larksuite/cli` / `lark-cli`。
- 本地 JSON 状态、原子文件写入和原子锁。
- macOS `launchd`。
- Windows beta 使用前台运行。
- 后续演示 HTML 使用 Slidev；Starter v0.1 未稳定前不创建演示页面。

发布版本必须锁定依赖，不直接依赖无约束的 `latest`。

## V1 端到端契约

```text
飞书妙记生成
→ 事件按 minute_token 登记与去重
→ Transcript 未就绪时只重试当前 token
→ Codex 调用个人录音 Skill
→ 原子写入唯一 Markdown 主记录
→ 飞书私聊发送一次确认单
→ 确认 / 修改 / 改分类
→ 更新同一主记录并保留审计
```

每日一次补漏只用于恢复漏事件，不是主触发；禁止高频全量扫描。

公开 CLI 契约：

- `recording-agent init`
- `recording-agent doctor`
- `recording-agent sample`
- `recording-agent start`
- `recording-agent status`
- `recording-agent stop`
- `recording-agent catch-up --days 1`

确认命令：

- `确认 R-XXXX`
- `修改 R-XXXX：具体意见`
- `分类 R-XXXX：分类名`

## Skill 契约

统一 Skill 必须让 Codex 一次只问一个问题，逐项确认：

1. 录音来源。
2. 分类体系。
3. 入库位置。
4. 沉淀规则。

机器绝对路径、Bridge profile、chat ID、凭证和运行状态不得写入 `SKILL.md`；机器配置与语义规则分离。

## 绝对边界

- 禁止提交私人主目录、私人知识库路径、真实 app/chat/user ID、token、secret、cookie、Transcript、妙记 URL 或客户资料。
- 禁止共享飞书应用凭证。
- 禁止让所有使用者共用同一个机器人或中转服务。
- 禁止自动创建任务、发布内容、删除飞书原件或扩大 Bridge 允许用户范围。
- 禁止复制课程讲义原文、图片或第三方 Skill 到公开仓库。
- 禁止修改既有私人录音系统。
- 禁止以 mock、fixture、截图或预制结果冒充真实 E2E。
- 禁止在真实 E2E 未通过前创建公开 Release 或宣称自动 Loop 已完成。

所有日志默认脱敏，不记录 Transcript 正文或完整 token。

## 工作方式

1. 开始一个阶段前读取 `PROJECT_STATUS.md` 和对应任务清单。
2. 先建立测试基线，再实现。
3. 控制面的事件、去重、重试、路径、状态迁移和文件命名使用确定性程序，不交给大模型猜。
4. 每个外部写入都要有明确目标、幂等键和失败状态。
5. 失败保留输入标识、状态和可恢复路径，不静默丢失。
6. 只修改当前计划内文件；发现计划外脏改动时保留并绕开。
7. 使用小步提交；提交前运行测试、类型检查、lint 和隐私扫描。
8. 真实外部写操作、授权、后台服务安装和公开发布按对应门禁单独确认。

## 阶段边界

当前 Phase 2 只建立工作台和开发契约，不编写运行代码。

Phase 3 按 `PHASE3_TASKS.md` 顺序实施。不得先做飞书 UI、演示 HTML、营销页面或复杂扩展。

## 完成门

V1 只有在以下证据全部成立时才算完成：

- 单元测试与 mock 集成测试通过。
- 从发布 ZIP 开始的隔离 macOS E2E 通过。
- 真实安全妙记只生成一个主记录和一份确认单。
- 确认、修改、改分类均更新同一记录。
- 服务重启后状态保留，事件重放不重复处理。
- README 与真实命令一致。
- 私密信息扫描无命中。
- `v0.1.0` tag、ZIP 和 SHA-256 来自同一 commit。

