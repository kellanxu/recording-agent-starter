# Project Status

Updated: 2026-07-30

## Current phase

`phase3-stage0-complete`

Phase 3 Stage 0 已建立可重复的 TypeScript、测试、lint、format、build 与隐私扫描基线。
当前只有 CLI 脚手架；所有产品命令仍明确返回 unavailable。尚未进行飞书授权、后台服务安装、
真实 E2E 或公开发布。

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
- CLI help 可运行；未实现命令使用稳定退出码 `3`，不会伪装成功。
- 隐私扫描覆盖已跟踪和未忽略的新文件。

## Not yet achieved

- `doctor`、`sample` 和事件 Loop。
- 单元测试、集成测试与真实 E2E。
- ZIP、SHA-256、GitHub 仓库与 Release。
- 主讲义、演示 HTML 和飞书公开文档。

## Next action

按 `PHASE3_TASKS.md` 进入 Stage 1；先实现安全配置、Starter workspace、Skill 模板与
`doctor`，不提前接真实飞书。
