# Recording Agent Starter 学员手册

## 你要完成什么

把一条本人持有的安全飞书录音转化为唯一的本地 Markdown 主记录，并通过飞书回复确认或
纠正它。完成标准是可验证的闭环，不是看完演示。

## 安全边界

- 使用自己的飞书应用、授权、录音和本地 Markdown 库。
- 第一条真实测试只用不含客户、课程附件或隐私内容的约 60 秒录音。
- 确认单只发给本人或明确的私人测试群。
- 不把 token、chat/user ID、凭证、Transcript、妙记 URL 或私人路径贴到公开 issue。
- Starter 不自动创建任务、发布内容或删除飞书原件。

## 当前发布状态

`v0.2.0-beta.1` 已通过自动化、隔离 ZIP 和打包后进程链路，但还没有通过全新环境的
真实飞书录音 E2E。它作为 GitHub Pre-release 供学员自愿测试，不是稳定版；旧
`v0.1.0` 的真实证据不能挪作新架构证据。

## 安装前检查

```bash
node --version
npm --version
codex --version
codex login status
lark-channel-bridge --version
lark-cli --version
```

Node.js 必须为 `>=20.12`。Codex CLI 必须已登录。

## 初始化

```bash
recording-agent init
```

按顺序回答：

1. Starter workspace 放在哪里？
2. 录音来自哪里？
3. 使用哪些分类？
4. Markdown 库在哪里？
5. 哪些内容值得沉淀？

机器绝对路径、Bridge profile、确认目标和凭证属于本机配置，不要写入个人 Skill 或
公开仓库。

## 离线验证

```bash
recording-agent doctor --workspace /absolute/path/to/workspace
recording-agent sample --workspace /absolute/path/to/workspace
```

你应看到：

- 未做真实授权时，`doctor` 可能是 YELLOW。
- `sample` 只生成一个 `R-0001` 安全样本。
- 再次运行 `sample` 不会复制第二份。

这一步不经过真实飞书、真实 Codex 整理或消息发送，因此不是完整 E2E。

## 真实启动

先运行：

```bash
recording-agent doctor --workspace /absolute/path/to/workspace --live
```

首次启动前，Codex、Bridge、user/bot 身份和“同一应用”必须为 GREEN；Hook 与订阅尚未
安装时为 RED 是正常的。核对确认目标和 bot 身份后才执行：

```bash
recording-agent start \
  --workspace /absolute/path/to/workspace \
  --confirm-external-writes
```

启动后再跑一次 `doctor --live`，此时必须全部 GREEN。状态与停止：

```bash
recording-agent status --workspace /absolute/path/to/workspace
recording-agent stop --workspace /absolute/path/to/workspace
```

停止服务会保留队列、失败状态、注册表和审计。

## 第一条真实录音

1. 准备约 60 秒、不含敏感信息的录音。
2. 在自己的飞书环境生成妙记。
3. 不运行 catch-up，等待实时事件。
4. 核对本地只新增一个 `R-XXXX.md`。
5. 核对本人 P2P 或私人测试群只收到一份确认单。

不要把真实 token、消息 ID、链接或 Transcript 复制进课程记录。

## 三种回复

一次只发送一条命令：

```text
确认 R-XXXX
修改 R-XXXX：具体意见
分类 R-XXXX：分类名
```

预期行为：

- 确认：同一记录变为 `confirmed`。
- 修改：保留原 AI 输出并追加你的意见。
- 分类：移动原文件，不复制正文。
- 重复消息：返回 duplicate，不重复写入。

## 故障恢复

| 现象                  | 正确动作                                         |
| --------------------- | ------------------------------------------------ |
| Transcript pending    | 等待当前 token 的退避重试                        |
| 漏事件                | 人工核对目标后，最多运行一次 `catch-up --days 1` |
| `needs_clarification` | 检查 ID、分类和命令是否唯一精确                  |
| confirmation unknown  | 人工检查目标会话，不自动重发                     |
| 服务重启              | 检查状态是否恢复，再做同 token 重放验证          |
| 目标或身份不明        | 停止，不扩大权限                                 |

## 你的完成证据

- [ ] `doctor --live` 全绿。
- [ ] 安全 sample 唯一。
- [ ] 新安全妙记由实时事件处理。
- [ ] 唯一主记录与唯一确认单。
- [ ] 至少一条本人回复更新同一记录。
- [ ] 服务重启后状态保留。
- [ ] 重放不重复整理或通知。

没有证据的项目不要勾选。
