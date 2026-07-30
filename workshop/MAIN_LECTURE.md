# Recording Agent Starter 主讲义

## 讲授目标

面向对 Agent 感兴趣、但还没有独立搭建经验的学习者。结束时，学习者应能解释并实际
验证一条本人持有、可审计、可纠正的录音 Agent Loop；不会把看过演示、跑过 mock 或
生成过 sample 误认为真实 E2E。

## 核心判断

Agent 的最小价值不是“自动生成更多内容”，而是把输入、处理、人工纠正和状态证据闭合
在一条可恢复的链路中。确定性的安全边界由程序执行，语义整理由 Codex 与个人 Skill
完成，最终判断与责任留给本人。

## 建议讲授顺序

### 1. 先讲损耗，不先讲功能

录音常见的三个损耗点：

1. 录完后没有进入长期可检索的本地 Context。
2. AI 整理没有回到本人确认，误判可能被当成事实。
3. 自动化缺少去重、恢复和失败证据，只能展示一次性成功。

讲到这里应停下来确认：学员理解“转写完成”与“闭环完成”不是同一件事。

### 2. 画出最小 Loop

按顺序解释：

```text
飞书妙记
→ 实时事件
→ Codex + 个人 Skill
→ 唯一 Markdown
→ 本人 P2P 确认单
→ 确认 / 修改 / 分类
→ 回写同一记录
```

强调两点：

- 每日 catch-up 只恢复漏事件，不是主触发。
- 三种回复都更新同一个 `R-XXXX`，不会再复制一份正文。

### 3. 把所有权和边界说清楚

每个使用者持有自己的飞书应用、录音、本地库和确认目标。Starter 不提供共享机器人，
不把密钥交给公共服务，也不自动创建任务、发布内容或删除原录音。

真实外部写入前，必须展示并核对发送身份与目标。目标含第三方、候选不唯一或无法证明
是本人/私人测试群时，停止。

### 4. 解释人机分工

确定性程序负责：

- event ID 与 minute token 双重去重；
- Transcript 未就绪时只退避当前 token；
- 原子写入、路径、文件名、状态迁移和分类移动；
- message ID 幂等与一次通知预留。

Codex 与个人 Skill 负责：

- 在给定 Transcript 和分类边界内整理；
- 输出固定结构；
- 保留原始证据、AI 输出和人工意见之间的边界。

本人负责确认、纠正、分类与最终责任。

### 5. 先跑离线门

依次执行：

```bash
recording-agent init
recording-agent doctor --workspace /absolute/path/to/workspace
recording-agent sample --workspace /absolute/path/to/workspace
```

说明：

- `init` 一次只问一个问题。
- 离线 `doctor` 在未验证真实授权时可以是 YELLOW。
- `sample` 只使用安全 fixture；唯一 sample 不代表真实飞书 E2E。

### 6. 再跑真实门

只有 `doctor --live` 全绿，且确认目标与发送身份已经核对，才执行：

```bash
recording-agent start \
  --workspace /absolute/path/to/workspace \
  --confirm-external-writes
```

使用一条不含客户、课程或隐私内容的约 60 秒测试录音。现场观察：

1. 实时事件进入，不运行 catch-up。
2. 只生成一个新 `R-XXXX.md`。
3. 只向本人或明确私人测试群发送一份确认单。
4. 同 token 重放不增加事件、记录或通知。

### 7. 完成人工质量门

每条回复使用一条独立、精确命令：

```text
确认 R-XXXX
修改 R-XXXX：具体意见
分类 R-XXXX：分类名
```

解释：

- 重复 message ID 不重复写入。
- 修改保留 AI 原输出和人工意见。
- 分类只移动原文件并更新注册表。
- 对象、ID 或分类不唯一时返回 `needs_clarification`。

### 8. 演示恢复，不演示“永不失败”

重点演示或讲解：

- Transcript pending 会退避；
- LaunchAgent 后台重启后状态仍在；
- 同 token 重放返回 duplicate；
- 目标或身份不明时必须停止；
- confirmation unknown 时不自动重发。

## 现场完成门

只有以下证据都来自学员自己的隔离 workspace，才可以说“完成第一条 Loop”：

- `doctor --live` 全绿；
- 安全 sample 唯一；
- 新安全妙记通过实时事件生成唯一主记录和确认单；
- 本人回复更新同一记录；
- 服务重启后状态保留，事件重放不重复。

任何一步没有证据，就保持未完成并记录准确阻塞。

## 讲师不可越过的边界

- 不代学员共享或收集应用凭证。
- 不使用真实客户录音做首次测试。
- 不把 fixture、截图或预制结果冒充真实 E2E。
- 不临时扩大 Bridge 允许用户范围。
- 不自动创建任务、发布内容或删除原录音。
- 不在未再次确认具体文档与权限档位前修改飞书公开权限。
