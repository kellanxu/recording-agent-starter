# Recording Agent Starter Flow

```mermaid
flowchart LR
  A["同一个飞书应用"] --> B["同一条 Bridge 长连接"]
  B --> C0["Minutes Hook<br/>事件触发"]
  C0 --> B0["事件登记<br/>event_id + minute_token"]
  B0 --> C{"Transcript 就绪？"}
  C -- "否" --> D["只重试当前 token<br/>指数退避"]
  D --> C
  C -- "是" --> E["Codex + 个人录音 Skill"]
  E --> F["唯一 Markdown 主记录<br/>R-XXXX"]
  F --> G["一次纯文本确认单"]
  G --> H{"本人回复"}
  H -- "确认" --> I["更新同一记录为 confirmed"]
  H -- "修改" --> J["保留原输出 + 记录意见"]
  H -- "改分类" --> K["移动原文件 + 更新审计"]
  I --> L["本地状态与审计保留"]
  J --> L
  K --> L
```

控制面的去重、退避、路径、状态、文件名和移动均由确定性程序处理。Codex 只负责在给定
Transcript 与分类边界内整理结构化内容；本人负责确认、纠正、分类与最终责任。

`sample` 使用 bundled safe fixture，走同一 Markdown 输出契约，但不经过飞书、真实
Codex 或消息发送，因此不能替代真实 E2E。
