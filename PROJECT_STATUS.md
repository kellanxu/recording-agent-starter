# Project Status

Updated: 2026-07-30

## Current phase

`phase2-workspace-ready`

Phase 2 已建立独立项目工作台、协作契约和 Phase 3 任务清单。当前没有产品运行代码、依赖安装、飞书授权、后台服务或公开仓库。

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
- `AGENTS.md`、README、`.gitignore`、MIT License 与 Phase 3 清单存在。
- 本地 Git 已初始化；`git log -1` 可回读 Phase 2 基线 commit。

## Not yet achieved

- CLI 脚手架。
- `doctor`、`sample` 和事件 Loop。
- 单元测试、集成测试与真实 E2E。
- ZIP、SHA-256、GitHub 仓库与 Release。
- 主讲义、演示 HTML 和飞书公开文档。

## Next action

在新的 Codex 项目线程中按 `PHASE3_TASKS.md` 从 Stage 0 开始；先建立基线、测试框架与 CLI help，不提前接真实飞书。
