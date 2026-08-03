# Recording Agent Starter

用飞书妙记、Codex 和个人 Skill，把一条录音转化为本人持有、可追溯、可纠正的 Markdown Context。

> 当前测试版本：`v0.2.0-beta.1`。它把录音事件合并进现有 Bridge 长连接，不再启动
> 第二个飞书事件监听器。自动化门、隔离 ZIP 安装和打包后子进程链路已经通过；全新环境
> 的真实飞书录音 E2E 尚待完成，因此它是供学员测试的 Pre-release，不是稳定版。

## 计划完成的 Loop

```text
同一个飞书应用
→ 同一条 Bridge 长连接接收消息与妙记完成事件
→ Codex 调用个人录音 Skill
→ 本地 Markdown 入库
→ 飞书确认
→ 确认 / 修改 / 改分类
→ 回写同一记录
```

## CLI 命令

```text
recording-agent init
recording-agent doctor
recording-agent sample
recording-agent bridge-link
recording-agent reply
recording-agent start
recording-agent status
recording-agent stop
recording-agent catch-up --days 1
```

以上命令均已实现。`v0.2.0-beta.1` 已通过隔离 workspace 和打包后进程级测试；初始化默认逐项询问
Starter workspace、录音来源、分类体系、Markdown 入库位置和沉淀规则；也可显式传入
参数：

```bash
recording-agent init \
  --workspace /absolute/path/to/starter-workspace \
  --source "本人飞书妙记" \
  --categories "工作,学习" \
  --library /absolute/path/to/markdown-library \
  --retention "保留原始证据、结论和人工意见" \
  --confirmation-chat-id "<target-chat-id>" \
  --confirmation-identity bot

recording-agent doctor --workspace /absolute/path/to/starter-workspace
recording-agent doctor --workspace /absolute/path/to/starter-workspace --live
recording-agent sample --workspace /absolute/path/to/starter-workspace
recording-agent bridge-link --workspace /absolute/path/to/starter-workspace
recording-agent reply \
  --workspace /absolute/path/to/starter-workspace \
  --message-id "<incoming-message-id>" \
  --text "确认 R-0002"
recording-agent catch-up \
  --workspace /absolute/path/to/starter-workspace \
  --days 1 \
  --minute-token OPTIONAL_EXACT_MINUTE_TOKEN \
  --confirm-external-writes

recording-agent start \
  --workspace /absolute/path/to/starter-workspace \
  --confirm-external-writes
recording-agent status --workspace /absolute/path/to/starter-workspace
recording-agent stop --workspace /absolute/path/to/starter-workspace
```

`sample` 只处理仓库自带的安全 fixture，输出会明确声明不是真实飞书或 Codex E2E。
重复执行不会创建第二份 `R-0001`。`catch-up` 只有在使用者已完成 user 授权后才会
读取妙记；新主记录会向配置目标发送一份确认单，因此必须显式追加
`--confirm-external-writes`。需要严格限制为一条既有妙记时，追加
`--minute-token`；找不到时会停止，不会退化为处理整天。它不修改妙记本身。macOS 的 `start` 安装用户级
LaunchAgent。当前单连接 Hook 只支持 macOS，Windows 暂不提供真实事件启动。
同一 token 若保留在 `failed` 状态，后续 `catch-up` 会重试该事件而不是注册第二条；
已预留或发送状态的确认单不会自动重发。

`bridge-link` 把通用回复路由 Skill 安装到本机 Codex，并把 active Starter workspace
写入独立 machine config；不会发送飞书消息。`start` 会把通用 Minutes Hook 挂到现有
Bridge 的同一条连接，并用同一个应用下相互隔离的 bot/user 身份分别负责回复和妙记读取。收到
回复后，Bridge/Codex 使用消息 ID 调用本地 `reply`；重复消息不会重复改记录。Starter
不以高频 P2P 扫描替代这条主链。

## V1 边界

- `v0.2.0-beta.1` 当前仅支持 macOS；Windows 暂停在离线 sample。
- 一个飞书应用、一条 Bridge 长连接；不创建第二个事件消费者。
- 每位使用者持有自己的飞书应用、录音和本地知识库。
- 不要求 OpenAI API Key，但要求已安装并登录 Codex CLI。
- 不自动创建任务、发布内容或删除原始录音。
- 不提供共享机器人、多租户托管或 Hermes 调度。
- 不收集或上传使用者的录音、密钥与本地知识库。

## 当前文档

- [飞书事件契约](EVENT_CONTRACT.md)
- [飞书确认契约](IM_CONTRACT.md)
- [运行生命周期](LIFECYCLE.md)
- [E2E 证据与未通过门](E2E_EVIDENCE.md)
- [macOS 安装教程](docs/MACOS.md)
- [Windows 当前边界](docs/WINDOWS_BETA.md)
- [故障恢复](docs/TROUBLESHOOTING.md)
- [原创流程图](docs/FLOW.md)
- [公开安全样本截图](docs/SCREENSHOTS.md)
- [依赖许可证审计](DEPENDENCY_LICENSES.md)
- [v0.2.0 发布决策](RELEASE_DECISION.md)

## License

MIT
