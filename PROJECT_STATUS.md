# Project Status

Updated: 2026-08-03

## Current phase

`v0.2.0-beta.1-prerelease-real-e2e-pending`

`v0.1.0` 已发布并保留为旧事件消费者架构的历史版本。当前 `v0.2.0-beta.1` 已改为
一个飞书应用、一条现有 Bridge 长连接：Minutes Hook 复用 Bridge 内部 dispatcher，
bot/user 身份隔离，不再启动第二个 `lark-cli event consume`。56 项测试、构建、隐私和
许可证审计、Hook 安装回滚、编译后 Bridge preload 兼容、候选 ZIP 隔离安装及打包后
Hook 子进程链路均已通过。尚缺全新学员式 macOS profile 的真实飞书录音、确认回复与
服务重启 E2E，因此只允许作为 Pre-release 供学员自愿测试，不得称为稳定版。维护者的正式 `codex` Bridge
仍加载 `meeting-context-router` 原有 Hook，未被本轮安装、重启或改写。

`v0.2.0-beta.1` 已于 2026-08-03 发布为 GitHub Pre-release：
`https://github.com/kellanxu/recording-agent-starter/releases/tag/v0.2.0-beta.1`。远端下载
ZIP 已使用相邻 SHA-256 文件复核通过；稳定版 `v0.1.0` 继续保留为 Latest。

以下为 `v0.1.0` 历史完成背景：Phase 3 Stage 6 的真实 E2E 已通过，Stage 7 的
`v0.1.0` 已发布。隔离 workspace 的
live doctor、LaunchAgent、一条全新 60 秒私人妙记的实时事件、真实 Transcript/Codex、
唯一主记录、唯一本人确认单、服务重启与事件重放均已通过。三条独立真实回复的
message ID 幂等、同一记录回写、分类移动和最终确认也已通过。Stage 8 本地活动材料
已完成并通过离线视觉与浏览器验收。根项目与 Slidev 开发依赖漏洞均已归零，公开安全
截图已完成。GitHub 公开仓库、tag、ZIP、SHA-256 与 Release 已完成；五份活动材料已从
本地 Markdown 同步到飞书并回读。飞书公开权限未修改，未登录验收未执行，等待用户对
具体文档与权限档位再次确认。2026-08-01 又根据两份生财官方组局手册完成活动体验修订：
新增内部执行 Runbook、群运营模板、场地与角色门、签到/NPS 门、2 小时现场节奏，并把
作品、两位新连接和 72 小时行动承诺加入主讲义、讲师清单和 18 页 Slidev。该修订已通过
本地测试、构建和视觉验收，尚未重新同步飞书。

## Confirmed decisions

- Mission、主 Vision、备选 Vision和暂停项已写入 `AGENTS.md`。
- 技术栈为 Node.js、TypeScript、Codex CLI、`lark-channel-bridge` 与飞书 CLI。
- 实时事件是主入口；Transcript 未就绪时只重试当前 `minute_token`。
- 每日一次补漏，不做高频全量扫描。
- 每条录音只有一个 Markdown 主记录和一份待确认通知。
- 人工质量门是确认、修改和改分类；V1 不自动创建任务、发布或删除材料。
- `v0.2.0` 单连接架构当前只支持 macOS；Windows 只开放离线 sample。
- 每个 Starter 只使用一个飞书应用和一条 Bridge 长连接。
- 演示 HTML 使用 Slidev，但必须等 Starter v0.1 的真实界面稳定后再做。

## v0.2.0 candidate evidence

- 10 个测试文件、56 项测试通过。
- `v0.2.0-beta.1` ZIP 从隔离 HOME 安装通过，生产依赖为 0。
- 打包后的 Hook 子进程链路完成一次记录和一次确认，事件重放未再次调用 provider。
- Bridge Hook 重启失败时恢复原参数和服务；重复安装不重复重启。
- 候选压缩包 173 个条目通过隐私与路径审计。
- `lark-channel-bridge 0.6.4` 编译后 preload 兼容检查通过。
- 正式 `codex` Bridge 只读核验仍运行原 `meeting-context-router` Hook。
- 新架构真实飞书录音 E2E 尚未执行，不能标记为正式 Release。
- `v0.2.0-beta.1` tag、Pre-release、ZIP 与 SHA-256 已发布并完成下载回读校验。

## v0.1.0 historical evidence

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
- 根项目与工作坊共 987 个锁定依赖条目的许可证均在已审查集合内；两个 lockfile
  缺失字段只按精确包名、版本和随包 MIT LICENSE 证据放行；正式包仍为零生产依赖。
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
- 用户授权的本地 QuickTime/AAC 源文件只读核验后，在系统临时目录生成了恰好 60 秒的
  AAC/M4A 私有测试副本；源文件大小和修改时间保持不变，音频未进入仓库。
- 私人 Drive 上传与妙记创建成功；`minutes.minute.generated_v1` 实时事件自动进入
  Starter，来源为 `event`，生成唯一 `R-0003` 和一份 sent 状态的本人 P2P 确认单。
- 同 token 使用新 event ID 重放返回 `duplicate_token`；Transcript provider 与
  processor 均未调用，事件、记录、Markdown 和通知计数均未增加。
- 项目完成门要求的是服务重启后状态保留与事件重放去重。LaunchAgent 新 PID、ready、
  状态恢复和同 token no-op 已满足该门，不把完整 logout/login 另立为发布门。
- Stage 8 已完成 16 页 Slidev、本地主讲义、学员手册、课前检查和讲师清单；没有制作
  PPT，也没有使用伪造产品界面。
- 三张原创产品截图来自构建后的 `v0.1.0` CLI 与 bundled public fixture；临时机器路径
  已替换为占位符，视觉检查无裁切、遮挡或动态私密数据。
- Slidev 静态构建在阻断全部外网请求时完成 `/1` 到 `/16` 键盘翻页，演讲者模式加载
  speaker notes 与 Sources；外部请求和本地资源失败均为零。
- 16 页 PDF 兜底已导出并逐页检查，无裁切、重叠、中文缺字或破损代码块。
- 首轮 Stage 8 验收发现并修复默认 Google Fonts 外链和相对 base 导致 presenter
  资源 404 两个问题；完整去敏 QA 记录在 `workshop/QA.md`。
- Release commit 为 `5d7106485035253456f7eb826e07251f427b67f9`；注释 tag
  `v0.1.0`、正式 ZIP 和 SHA-256 均指向该 commit。
- 正式 ZIP SHA-256 为
  `84b7030b10ce9ba37dd2c2ab5148de7245f23867677bec7fc71df4332102d22e`；
  GitHub Release 资产 digest 回读一致。
- GitHub 公开仓库与 Release 已创建：
  `https://github.com/kellanxu/recording-agent-starter/releases/tag/v0.1.0`。
- 五份飞书活动文档均按本地 Markdown 标题与模块顺序回读；索引中的表格、代码块、
  三张公开安全截图和四个公开链接均存在。私密 doc URL/token 只保存在 repo-ignored
  本地同步 manifest，没有写入仓库。
- 五份飞书文档当前均为组织内链接可读，并允许对外分享；未开启互联网公开链接，
  未修改任何公共访问与协作设置。
- 生财官方手册要求的人员添加与建群由用户回填为已完成；是否全部实际进群、鱼丸管理员、
  群聊邀请确认、人员 Excel、群公告、课前绿灯接龙、场地与四个轻量角色仍待现场核对。
- `workshop/EVENT_RUNBOOK.md` 已把活动体验压缩为作品、连接、行动三类结果，并给出
  13:30 签到到 16:00 收尾的 2 小时执行表。
- Slidev 已从 16 页更新为 18 页；新增“今天带走三个真实结果”和“离场前，闭合四件事”。
- 本轮 `npm run check`、构建、Slidev 离线构建和 PDF 导出通过；46 项测试通过，隐私扫描
  覆盖 91 个仓库文件。18 页 PDF 总览及新增两页按原始分辨率检查无裁切、重叠或中文缺字。

## Resolved release risks

- ESLint 已升级为 `10.8.0`，`typescript-eslint` peer 范围明确支持 ESLint 10。
- ESLint 的开发 Node 下限由 `devEngines` 单独执行，不改变正式 CLI `>=20.12` 的运行契约。
- Slidev 的 DOMPurify 链通过精确 `3.4.12` override 修复；根项目、生产依赖和工作坊
  `npm audit` 均为 0。
- 未使用 `--force`、忽略 peer dependency 或宽泛不安全 override。
- 其他未实现命令使用稳定退出码 `3`，不会伪装成功。
- 隐私扫描覆盖已跟踪和未忽略的新文件。

## Permission gate still open

- 飞书索引以 Wiki 节点呈现；当前 CLI schema 不支持直接把 Wiki 链接设为
  `anyone_readable`，只能由用户选择保留组织内访问，或改用底层 docx 链接作为公开入口。
- 任何 `link_share_entity=anyone_readable` 修改仍需用户对具体文档逐项确认。
- 只有权限变更完成后才可执行未登录访问验收。

## Next action

在一台不承载维护者正式录音系统的 macOS 上，使用该学员自己的一个飞书应用和一个
Bridge profile，从候选 ZIP 完成：真实安全妙记录音、唯一 Markdown、唯一确认单、本人
回复、retry worker 重启和事件重放。全门通过后再从干净 commit 构建并发布 `v0.2.0`。
