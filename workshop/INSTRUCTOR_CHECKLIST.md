# Recording Agent Starter 讲师清单

## 开场前

- [ ] 说明目标是完成一条本人持有的最小 Loop，不是观看功能演示。
- [ ] 说明 sample、mock、截图与真实 E2E 的区别。
- [ ] 重申不收集学员凭证、录音、Transcript 或私人路径。
- [ ] 确认每位学员的 workspace 与 Markdown 库相互隔离。
- [ ] 展示本地静态 HTML 和 PDF 兜底均可用。

## 初始化与离线门

- [ ] 引导 `init` 一次只回答一个问题。
- [ ] 检查 Skill 不含机器路径、profile、目标 ID 或凭证。
- [ ] 运行离线 `doctor`，解释 YELLOW 的准确含义。
- [ ] 运行 `sample` 两次，核对只存在一个安全样本。
- [ ] 不把 sample 成功宣布为完整搭建成功。

## 真实外部写入门

- [ ] 运行 `doctor --live` 并确认全绿。
- [ ] 向学员展示具体确认目标与发送身份。
- [ ] 再次确认目标只包含本人或明确私人测试群。
- [ ] 只有确认后才使用 `--confirm-external-writes`。
- [ ] 不临时扩大 Bridge 允许用户范围。
- [ ] 不用 P2P 高频轮询替代现有 Bridge/Codex 回复链。

## 60 秒真实 E2E

- [ ] 使用明确标题的安全测试录音。
- [ ] 不运行 catch-up，观察实时 `minutes.minute.generated_v1`。
- [ ] 核对只新增一个事件、一个主记录和一份确认单。
- [ ] 核对确认单不含 Transcript、机器路径或凭证。
- [ ] 用相同 token 重放并确认 duplicate/no-op。
- [ ] 记录去敏时间、版本和聚合结果。

## 人工确认回路

- [ ] 每条消息只包含一个精确命令。
- [ ] 确认更新同一记录为 `confirmed`。
- [ ] 修改保留 AI 原输出和人工意见。
- [ ] 分类移动原文件并更新注册表，不复制正文。
- [ ] 重复 message ID 不改变 Markdown。
- [ ] 对象、ID 或分类不唯一时接受 `needs_clarification`，不绕过。

## 生命周期与恢复

- [ ] 重启 LaunchAgent，核对新 PID 与消费者 ready。
- [ ] 核对控制状态、记录和审计仍在。
- [ ] 重放事件不重复整理或通知。
- [ ] 不把完整 macOS logout/login 自行升级为发布门。
- [ ] confirmation unknown 时人工检查，不自动重发。

## 收尾

- [ ] 让学员只勾选本人真实完成的验收项。
- [ ] 准确记录未通过项和下一步，不改写为成功。
- [ ] 不自动创建任务、发布内容或删除原录音。
- [ ] 不创建公开 GitHub Release，除非独立发布门全部通过。
- [ ] 不同步飞书文档或修改公开权限，除非已展示具体文档与目标档位并再次确认。
