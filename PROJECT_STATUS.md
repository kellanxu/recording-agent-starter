# Project Status

Updated: 2026-07-30

## Current phase

`phase3-stage2-complete`

Phase 3 Stage 2 已实现安全离线 `sample`、Codex Runner 结构化契约和唯一 Markdown
主记录。离线结果明确标注为 fixture evidence，不冒充真实 Codex 或飞书 E2E。尚未进行
飞书授权、后台服务安装、真实 E2E 或公开发布。

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
- 其他未实现命令使用稳定退出码 `3`，不会伪装成功。
- 隐私扫描覆盖已跟踪和未忽略的新文件。

## Not yet achieved

- 真实 Codex Runner 与事件 Loop。
- 单元测试、集成测试与真实 E2E。
- ZIP、SHA-256、GitHub 仓库与 Release。
- 主讲义、演示 HTML 和飞书公开文档。

## Next action

按 `PHASE3_TASKS.md` 进入 Stage 3；实现事件适配器、双重去重、单 token 退避、
Transcript 获取接口、原子状态/锁与每日补漏。真实飞书读取仍由后续授权门控制。
