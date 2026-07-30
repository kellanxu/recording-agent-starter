# Phase 3 Development Tasks

## Stage 0：基线与脚手架

- [x] 确认工作目录与 Git 状态。
- [x] 建立 TypeScript、测试、lint、format 和 build 基线。
- [x] 实现 CLI help 与稳定退出码。
- [x] 建立隐私扫描脚本。
- [x] 记录 Node、Codex、Bridge 与飞书 CLI 的实际兼容版本。

验收：空实现不伪装成功；所有未实现命令返回清晰状态；基线测试可重复运行。

## Stage 1：安全配置与项目办公室

- [ ] 实现 `init` 的安全目录选择与机器配置。
- [ ] 拒绝文件系统根、用户主目录根和临时目录根。
- [ ] 创建 Starter workspace。
- [ ] 创建统一录音 Skill 模板。
- [ ] 逐项询问来源、分类、入库位置和沉淀规则。
- [ ] 实现 `doctor` 的绿/黄/红诊断。

验收：配置可回读且无明文凭证；Skill 语义规则不包含机器私密信息。

## Stage 2：离线样本链路

- [ ] 加入安全 Transcript fixture。
- [ ] 实现 `sample`。
- [ ] 定义 Codex Runner 的结构化输入输出契约。
- [ ] 实现唯一 Markdown 主记录、frontmatter 与固定章节。
- [ ] 测试候选待办缺字段时使用“未明确”，不补造事实。

验收：无需真实飞书即可从安全样本生成一份可审计记录。

## Stage 3：确定性事件控制面

- [ ] 接入 `minutes.minute.generated_v1`。
- [ ] 实现 `event_id` 与 `minute_token` 双重去重。
- [ ] 实现 Transcript 获取。
- [ ] Transcript 未就绪时只登记并退避重试当前 token。
- [ ] 实现原子状态文件与原子锁。
- [ ] 实现每日一次补漏。
- [ ] 实现 `catch-up --days 1`，已有 token 返回 duplicate。

验收：事件重放、补漏和服务重启不会生成重复主记录。

## Stage 4：确认回路

- [ ] 实现飞书确认单。
- [ ] 实现 `确认 R-XXXX`。
- [ ] 实现 `修改 R-XXXX：具体意见`。
- [ ] 实现 `分类 R-XXXX：分类名`。
- [ ] 修改保留原输出与用户意见。
- [ ] 改分类只移动原文件，不复制正文。
- [ ] 对象不唯一、分类不存在或 ID 无效时停止并请求澄清。

验收：三个命令均更新同一记录并追加审计；一次待确认状态只发送一份通知。

## Stage 5：运行生命周期

- [ ] 实现 `start`、`status`、`stop`。
- [ ] macOS 使用 `launchd`，支持重启恢复。
- [ ] Windows beta 提供前台运行和明确停止方式。
- [ ] 状态输出不泄漏 Transcript 或凭证。
- [ ] 停止后无孤儿进程，队列与失败状态保留。

验收：macOS 重启后可恢复；Windows 未真实 E2E 前不写正式支持。

## Stage 6：测试与真实 E2E

- [ ] 单元测试：配置、路径、分类、去重、退避、原子写入、命令解析、状态迁移和日志脱敏。
- [ ] Mock 集成：事件到回写的完整 fixture 链路。
- [ ] 从 ZIP 在隔离 profile 安装。
- [ ] `doctor` 全绿。
- [ ] `sample` 成功。
- [ ] 录制 60 秒安全妙记。
- [ ] 验证唯一主记录、唯一确认单。
- [ ] 分别验证确认、修改和改分类。
- [ ] 验证服务重启与事件重放。

验收：保留真实命令、时间、版本和去敏证据；失败不得改写为成功。

## Stage 7：教程与发布

- [ ] README 与实际命令逐项核对。
- [ ] 完成 macOS 教程和 Windows beta 教程。
- [ ] 生成原创截图和流程图。
- [ ] 运行 dependency license audit。
- [ ] 运行 secret、私人路径、ID、Transcript 和妙记 URL 扫描。
- [ ] 从同一 commit 生成 `v0.1.0` tag、ZIP 和 SHA-256。
- [ ] 真实 E2E 全门通过后才创建公开仓库与 Release。

验收：Release 下载物、tag、校验值和 README 一致；未通过项明确保留。

## Stage 8：活动材料

- [ ] 根据真实 Starter 重写主讲义、学员手册和讲师清单。
- [ ] 使用 Slidev 制作演示 HTML。
- [ ] 断网验证静态构建、资源本地化、键盘翻页和演讲者模式。
- [ ] 导出 PDF 作为只读兜底。
- [ ] 本地 Markdown 定稿后同步飞书云文档。
- [ ] 公开只读权限在具体文档上再次确认并做未登录验收。

验收：活动材料不使用伪造界面，不把观看演示记为已完成搭建。
