# Project Status

Updated: 2026-07-30

## Current phase

`phase3-stage6-offline-gates-complete-live-e2e-pending`

Phase 3 Stage 6 的单元、mock 集成、候选 ZIP 隔离安装与 `sample` 已通过。隔离
`doctor` 如实为 YELLOW；真实授权、60 秒安全妙记、确认消息、服务/机器重启仍未执行，
因此真实 E2E 与 V1 完成门均未通过。

## Confirmed decisions

- Mission、主 Vision、备选 Vision和暂停项已写入 `AGENTS.md`。
- 技术栈为 Node.js、TypeScript、Codex CLI、`lark-channel-bridge` 与飞书 CLI。
- 实时事件是主入口；Transcript 未就绪时只重试当前 `minute_token`。
- 每日一次补漏，不做高频全量扫描。
- 每条录音只有一个 Markdown 主记录和一份待确认通知。
- 人工质量门是确认、修改和改分类；V1 不自动创建任务、发布或删除材料。
- macOS 正式支持，Windows beta。
- 演示 HTML 使用 Slidev，但必须等 Starter v0.1 的真实界面稳定后再做。

## Evidence currently available

- 项目根目录独立于私人知识库。
- Phase 2 基线 commit 为 `696d62918dcfb69e537fd8dc3e5a2de8b716658a`。
- 依赖已锁定在 `package-lock.json`；兼容性判断记录在 `COMPATIBILITY.md`。
- `npm run check` 与 `npm run build` 可重复通过。
- `init` 可逐项询问并创建 workspace；危险目录会被拒绝。
- `doctor` 可输出绿/黄/红诊断；本机离线检查结果为黄，仅因未触碰真实授权。
- `sample` 可从 bundled safe fixture 生成唯一 `R-0001` 主记录；重复运行不复制文件。
- 主记录包含 frontmatter、原始证据、AI 整理、候选待办、人工确认与审计。
- 候选待办缺少对象、时间或验收标准时固定写“未明确”。
- `minutes.minute.generated_v1` 的 flat NDJSON schema 与 ready marker 已记录在
  `EVENT_CONTRACT.md`。
- event ID 和 minute token 在进入 Transcript/Codex 前双重去重；并发重放只处理一次。
- Transcript 未就绪时只重试当前 token，指数退避上限为一小时。
- 控制状态、记录注册表与锁均在 Starter workspace 内原子持久化；重启后继续去重。
- `catch-up --days 1` 使用 owner/participant 两次只读搜索后按 token 合并。
- 确认单不含 Transcript、机器路径或凭证；通知发送前先持久化幂等预留。
- `确认`、`修改`、`分类` 均按 message ID 幂等；修改保留 AI 原输出和用户意见。
- 改分类使用文件移动并更新同一注册表项，不复制第二份正文。
- 无效 ID、未知分类、无效格式和非唯一对象统一停止为 `needs_clarification`。
- IM flat NDJSON schema、发送身份与外部写门记录在 `IM_CONTRACT.md`。
- macOS plist 使用 `RunAtLoad`、`KeepAlive` 和 workspace-local 日志。
- Windows beta 只支持 `--foreground`，以 Ctrl+C 或已验证 PID 的 SIGTERM 停止。
- `status` 只输出生命周期、消费者 readiness 与聚合计数，不输出 token、Transcript、
  chat/user ID 或凭证。
- 停止只关闭消费者并保留控制状态、重试队列、记录注册表与失败状态。
- 8 个测试文件、36 项测试覆盖 Stage 6 指定矩阵与 mock 端到端链路。
- 候选 ZIP 已校验、解压、隔离安装并成功生成唯一离线样本。
- 第一次 ZIP 验证因错误 cwd 失败、第二次从解压目录成功，均记录在 `E2E_EVIDENCE.md`。
- 其他未实现命令使用稳定退出码 `3`，不会伪装成功。
- 隐私扫描覆盖已跟踪和未忽略的新文件。

## Not yet achieved

- 真实飞书事件、Transcript 与 Codex Runner E2E。
- 真实飞书确认消息与回复命令 E2E。
- 真实 macOS LaunchAgent 安装、进程重启与机器重启恢复。
- 单元测试、集成测试与真实 E2E。
- ZIP、SHA-256、GitHub 仓库与 Release。
- 主讲义、演示 HTML 和飞书公开文档。

## Next action

在不越过真实外部操作门的前提下继续 Stage 7 教程、审计和发布准备；保留所有 Release、
tag、真实 E2E 与 Stage 8 活动材料门，等待用户确认真实授权、消息与后台安装。
