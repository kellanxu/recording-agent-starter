# Recording Agent Starter

用飞书妙记、Codex 和个人 Skill，把一条录音转化为本人持有、可追溯、可纠正的 Markdown Context。

> 当前状态：Phase 3 Stage 0 脚手架已建立，但产品命令尚未实现，也尚未发布。
> 不要把本仓库当作已经可安装的产品。

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

以上是 V1 命令契约。当前只有 help 与稳定退出码；产品命令会明确返回 unavailable，
不代表已经实现。

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

## License

MIT
