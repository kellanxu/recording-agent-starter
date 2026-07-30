# Recording Agent Starter

用飞书妙记、Codex 和个人 Skill，把一条录音转化为本人持有、可追溯、可纠正的 Markdown Context。

> 当前状态：Phase 3 Stage 4 已实现离线样本、事件控制面和确认回路，但尚未通过真实录音 E2E，
> 也尚未发布。不要把本仓库当作已经可安装的产品。

## 计划完成的 Loop

```text
飞书妙记
→ 事件触发
→ Codex 调用个人录音 Skill
→ 本地 Markdown 入库
→ 飞书确认
→ 确认 / 修改 / 改分类
→ 回写同一记录
```

## 计划提供的命令

```text
recording-agent init
recording-agent doctor
recording-agent sample
recording-agent start
recording-agent status
recording-agent stop
recording-agent catch-up --days 1
```

当前已实现 `init`、`doctor` 与 `sample`。初始化默认逐项询问 Starter workspace、录音来源、
分类体系、Markdown 入库位置和沉淀规则；也可显式传入参数：

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
recording-agent sample --workspace /absolute/path/to/starter-workspace
recording-agent catch-up \
  --workspace /absolute/path/to/starter-workspace \
  --days 1 \
  --confirm-external-writes
```

`sample` 只处理仓库自带的安全 fixture，输出会明确声明不是真实飞书或 Codex E2E。
重复执行不会创建第二份 `R-0001`。`catch-up` 只有在使用者已完成 user 授权后才会
读取妙记；新主记录会向配置目标发送一份确认单，因此必须显式追加
`--confirm-external-writes`。它不修改妙记本身。`start`、`status` 与 `stop`
仍会明确返回 unavailable。

## V1 边界

- macOS 正式支持，Windows beta。
- 每位使用者持有自己的飞书应用、录音和本地知识库。
- 不要求 OpenAI API Key，但要求已安装并登录 Codex CLI。
- 不自动创建任务、发布内容或删除原始录音。
- 不提供共享机器人、多租户托管或 Hermes 调度。
- 不收集或上传使用者的录音、密钥与本地知识库。

## 当前文档

- [项目协作契约](AGENTS.md)
- [当前状态](PROJECT_STATUS.md)
- [Phase 3 开发任务](PHASE3_TASKS.md)
- [飞书事件契约](EVENT_CONTRACT.md)
- [飞书确认契约](IM_CONTRACT.md)

## License

MIT
