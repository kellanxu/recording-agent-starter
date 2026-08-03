# Phase 3 Development Tasks

## Stage 0：基线与脚手架

- [x] 确认工作目录与 Git 状态。
- [x] 建立 TypeScript、测试、lint、format 和 build 基线。
- [x] 实现 CLI help 与稳定退出码。
- [x] 建立隐私扫描脚本。
- [x] 记录 Node、Codex、Bridge 与飞书 CLI 的实际兼容版本。

验收：空实现不伪装成功；所有未实现命令返回清晰状态；基线测试可重复运行。

## Stage 1：安全配置与项目办公室

- [x] 实现 `init` 的安全目录选择与机器配置。
- [x] 拒绝文件系统根、用户主目录根和临时目录根。
- [x] 创建 Starter workspace。
- [x] 创建统一录音 Skill 模板。
- [x] 逐项询问来源、分类、入库位置和沉淀规则。
- [x] 实现 `doctor` 的绿/黄/红诊断。

验收：配置可回读且无明文凭证；Skill 语义规则不包含机器私密信息。

## Stage 2：离线样本链路

- [x] 加入安全 Transcript fixture。
- [x] 实现 `sample`。
- [x] 定义 Codex Runner 的结构化输入输出契约。
- [x] 实现唯一 Markdown 主记录、frontmatter 与固定章节。
- [x] 测试候选待办缺字段时使用“未明确”，不补造事实。

验收：无需真实飞书即可从安全样本生成一份可审计记录。

## Stage 3：确定性事件控制面

- [x] 接入 `minutes.minute.generated_v1`。
- [x] 实现 `event_id` 与 `minute_token` 双重去重。
- [x] 实现 Transcript 获取。
- [x] Transcript 未就绪时只登记并退避重试当前 token。
- [x] 实现原子状态文件与原子锁。
- [x] 实现每日一次补漏。
- [x] 实现 `catch-up --days 1`，已有 token 返回 duplicate。

验收：事件重放、补漏和服务重启不会生成重复主记录。

## Stage 4：确认回路

- [x] 实现飞书确认单。
- [x] 实现 `确认 R-XXXX`。
- [x] 实现 `修改 R-XXXX：具体意见`。
- [x] 实现 `分类 R-XXXX：分类名`。
- [x] 修改保留原输出与用户意见。
- [x] 改分类只移动原文件，不复制正文。
- [x] 对象不唯一、分类不存在或 ID 无效时停止并请求澄清。

验收：三个命令均更新同一记录并追加审计；一次待确认状态只发送一份通知。

## Stage 5：运行生命周期

- [x] 实现 `start`、`status`、`stop`。
- [x] macOS 使用 `launchd`，支持重启恢复。
- [x] Windows beta 提供前台运行和明确停止方式。
- [x] 状态输出不泄漏 Transcript 或凭证。
- [x] 停止后无孤儿进程，队列与失败状态保留。

验收：macOS LaunchAgent 后台进程重启后状态恢复；Windows 未真实 E2E 前不写正式支持。

## Stage 6：测试与真实 E2E

- [x] 单元测试：配置、路径、分类、去重、退避、原子写入、命令解析、状态迁移和日志脱敏。
- [x] Mock 集成：事件到回写的完整 fixture 链路。
- [x] 从 ZIP 在隔离 profile 安装。
- [x] `doctor` 全绿。
- [x] `sample` 成功。
- [x] 录制并上传 60 秒安全妙记，验证实时事件而非 catch-up。
- [x] 用一条既有待确认妙记验证唯一主记录、唯一确认单。
- [x] 分别验证确认、修改和改分类。
- [x] 验证服务重启与事件重放。

验收：保留真实命令、时间、版本和去敏证据；失败不得改写为成功。

## Stage 7：教程与发布

- [x] README 与实际命令逐项核对。
- [x] 完成 macOS 教程和 Windows beta 教程。
- [x] 生成原创截图和流程图。
- [x] 运行 dependency license audit。
- [x] 运行 secret、私人路径、ID、Transcript 和妙记 URL 扫描。
- [x] 从同一 commit 生成 `v0.1.0` tag、ZIP 和 SHA-256。
- [x] 真实 E2E 全门通过后才创建公开仓库与 Release。

验收：Release 下载物、tag、校验值和 README 一致；未通过项明确保留。

## Stage 8：活动材料

- [x] 根据真实 Starter 重写主讲义、学员手册、课前检查和讲师清单。
- [x] 使用 Slidev 制作演示 HTML。
- [x] 断网验证静态构建、资源本地化、键盘翻页和演讲者模式。
- [x] 导出 PDF 作为只读兜底。
- [x] 本地 Markdown 定稿后同步飞书云文档。
- [ ] 公开只读权限在具体文档上再次确认并做未登录验收。

验收：活动材料不使用伪造界面，不把观看演示记为已完成搭建。

## Stage 9：活动体验与现场执行

- [x] 对照生财官方组局手册和 8 月航海实战聚会手册完成缺口审计。
- [x] 新增群运营、场地、角色、签到反馈、2 小时现场节奏和活动后复盘总控。
- [x] 把作品、两位新连接和 72 小时行动承诺加入主讲义、讲师清单与 Slidev。
- [x] 重新通过格式、lint、类型、46 项测试、隐私扫描、构建和 PDF 导出。
- [x] 18 页 PDF 逐页与总览检查，无裁切、重叠或中文缺字。
- [ ] 用户补全地址、交通、停车、费用和现场联系人后发送群公告。
- [ ] 核对每位报名者已进群，邀请鱼丸并设管理员，导出参与人员 Excel。
- [ ] 锁定签到、拍照、录音和第二位开场回应伙伴。
- [ ] 生成签到码；活动开始 3 分钟后生成反馈码并现场核对 NPS。
- [ ] 如需把本轮修订同步到飞书，先回读具体目标文档与权限档位，再单独执行。

验收：活动完成证据同时覆盖作品、连接、行动和反馈；未发生的现场结果保持未完成。

## Stage 10：v0.2.0 单连接架构

- [x] 移除 Starter 的第二个 `lark-cli event consume`。
- [x] 在现有 Bridge dispatcher 注册 Minutes Hook。
- [x] 同一应用下隔离 bot/user 本机身份，并在 live doctor 校验同应用。
- [x] 实现 Hook 安装幂等、启动验证和失败恢复原 Bridge。
- [x] 事件只通过 stdin 进入子进程，Hook 日志不记录 minute token。
- [x] retry worker 与事件监听解耦；每日补漏保留，不做 15 分钟轮询。
- [x] 候选 ZIP 隔离安装和打包后 Hook 子进程链路通过。
- [x] Windows 真实启动改为 unavailable，不保留不真实的前台 beta 承诺。
- [ ] 在全新学员式 macOS profile 完成真实安全妙记 E2E。
- [ ] 验证真实确认回复、服务重启与重放不重复。
- [ ] 从干净 commit 构建、签名并发布 `v0.2.0`。

验收：一个应用、一条 Bridge 长连接完成完整真实 Loop；旧 `v0.1.0` Release 保留为
历史版本，不覆盖 tag 或资产。
