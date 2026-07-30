# Project Status

Updated: 2026-07-30

## Current phase

`phase3-stage6-real-e2e-60s-session-restart-pending`

Phase 3 Stage 7 的预发布材料已准备。隔离 workspace 的 live doctor、LaunchAgent、
一条既有待确认妙记的真实 Transcript/Codex/唯一主记录/唯一确认单、服务重启与事件重放
已通过。三条独立真实回复的 message ID 幂等、同一记录回写、分类移动和最终确认也已
通过。60 秒新妙记和用户会话重启尚未通过，因此截图、`v0.1.0`、公开仓库、Release
与 Stage 8 活动材料全部保持关闭。

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
- `catch-up --minute-token` 可把真实恢复限定到一个 token；保留的 failed 事件可恢复，
  不会注册第二个事件或重发已预留通知。
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
- 8 个测试文件、46 项测试覆盖 Stage 6 指定矩阵与 mock 端到端链路。
- 候选 ZIP 已校验、解压、隔离安装并成功生成唯一离线样本。
- 第一次 ZIP 验证因错误 cwd 失败、第二次从解压目录成功，均记录在 `E2E_EVIDENCE.md`。
- 182 个锁定依赖条目的许可证均在已审查集合内；正式包仍为零生产依赖。
- 候选 ZIP 的 136 个内部路径/文本条目通过路径穿越、私密路径、ID、凭证、妙记 URL
  与录音文件扫描；相邻 SHA-256 复核通过。
- CLI help、README、macOS 与 Windows beta 教程已按当前实现逐项核对。
- 原创 Mermaid 流程图只呈现已实现链路，不伪造飞书或产品界面。
- 本机只读发现唯一确认目标为正常、内部 P2P；Starter 使用隔离目录且未修改私人录音系统。
- `doctor --live` 全绿，现有 Bridge 是唯一 IM 长连接；通用 reply Skill 与本机配置已绑定。
- 一条既有 `local_review_pending` 妙记真实生成唯一 `R-0002` 主记录和一份确认单。
- LaunchAgent 重启后运行正常；同 token 重放返回 duplicate 且记录/消息计数保持为一。
- 三条独立真实回复分别绑定唯一 message ID；修改、分类、确认作用于同一 `R-0002`。
- 三条 message ID 重放均为 duplicate 且 Markdown digest 不变；最终分类为“学习”、
  状态为 confirmed、旧分类路径消失、用户修改意见仍保留。
- 真实序列发现并修复“最终确认覆盖此前用户意见”的缺陷，完整顺序回归测试已加入。

## Known pre-release risk

- 完整 dev audit 仍有 5 个来自 ESLint 9 glob 依赖链的 high 告警；生产依赖审计为 0。
- npm 建议升级 ESLint 10，但其 Node 下限 `20.19` 高于当前项目契约 `>=20.12`。
- 未使用 `--force` 或不安全 override；`v0.1.0` 前必须解决或由人明确调整兼容契约。
- 其他未实现命令使用稳定退出码 `3`，不会伪装成功。
- 隐私扫描覆盖已跟踪和未忽略的新文件。

## Not yet achieved

- 60 秒新妙记的实时飞书事件 E2E。
- macOS 用户会话或机器重启恢复。
- 单元测试、集成测试与真实 E2E。
- ZIP、SHA-256、GitHub 仓库与 Release。
- 主讲义、演示 HTML 和飞书公开文档。

## Next action

录制一条 60 秒安全妙记，验证实时事件而非既有记录补漏；随后执行 macOS 用户会话重启
并核验 LaunchAgent 恢复。两项通过前不得制作截图、tag、Release 或 Stage 8 活动材料。
