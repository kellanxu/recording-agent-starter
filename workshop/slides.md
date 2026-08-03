---
theme: default
title: Recording Agent Starter
info: |
  用一条飞书录音，完成第一个本人持有、可审计、可纠正的 Agent Loop。
transition: fade-out
mdc: true
fonts:
  sans: system-ui
  mono: ui-monospace
  provider: none
layout: cover
class: text-left
---

<div class="eyebrow">Recording Agent Starter</div>

# 一条录音，变成<br>可纠正的个人 Context

<p class="lede">不共享录音和密钥，不自动替你行动。先完成一条真实、最小、能回看的 Agent Loop。</p>

<!--
开场只回答一个问题：今天不是看功能，而是亲手建立一条属于自己的闭环。

[Sources]
- ../AGENTS.md
- ../README.md
-->

---
layout: default
---

# 今天带走三个真实结果

<div class="evidence-line">
  <span>作品</span><div>在自己的 workspace 完成唯一安全 sample；绿灯后再挑战真实录音 Loop。</div>
</div>
<div class="evidence-line">
  <span>连接</span><div>认识两位值得继续互助的伙伴，并说清下一次连接动作。</div>
</div>
<div class="evidence-line">
  <span>行动</span><div>把未来 72 小时内的一项可检查动作发到活动群。</div>
</div>

<!--
先让参与者知道：今天的价值不只有技术，还包括真实连接和继续行动。

[Sources]
- ./活动执行总控.md
- ./录音Agent现场主讲义.md
-->

---
layout: default
---

# 录音的损耗，不发生在“没录到”

<div class="big-number">3</div>

<div class="evidence-line">
  <span>第一处</span>
  <div>录完以后，没有进入长期可检索的本地 Context。</div>
</div>
<div class="evidence-line">
  <span>第二处</span>
  <div>整理结果没有回到本人确认，AI 的误判悄悄变成“事实”。</div>
</div>
<div class="evidence-line">
  <span>第三处</span>
  <div>自动化只展示成功画面，却没有去重、恢复和失败证据。</div>
</div>

<!--
这里建立问题张力：转写不是闭环，自动生成一篇文档也不是闭环。

[Sources]
- ../AGENTS.md
- ../docs/FLOW.md
-->

---
layout: default
---

# 最小闭环只有七步

<div class="loop">
  <span>妙记</span><i>→</i>
  <span>实时事件</span><i>→</i>
  <span>Codex</span><i>→</i>
  <span>Markdown</span><i>→</i>
  <span>确认单</span><i>→</i>
  <span>本人纠正</span><i>→</i>
  <span>同一记录</span>
</div>

> Agent 的价值不在“步骤多”，而在每一步都能追踪、恢复和纠正。

<p class="footer-note">每日补漏只负责恢复漏事件，不替代实时触发。</p>

<!--
用手指沿着七步走一遍。强调最后一步仍是同一个 Markdown，而不是再生成一份。

[Sources]
- ../AGENTS.md
- ../docs/FLOW.md
-->

---
layout: default
---

# 所有权先于自动化

<div class="two-col">
  <div>
    <h2>始终由本人持有</h2>
    <div class="rule">飞书应用与授权</div>
    <div class="rule">录音与妙记原件</div>
    <div class="rule">本地 Markdown 库</div>
    <div class="rule">确认、纠正与最终责任</div>
  </div>
  <div>
    <h2>Starter 明确不做</h2>
    <div class="rule">共享机器人或中转服务</div>
    <div class="rule">自动建任务、发布内容</div>
    <div class="rule">删除飞书原件</div>
    <div class="rule">扩大 Bridge 允许用户范围</div>
  </div>
</div>

<!--
这页是安全契约，不是免责声明。先把边界说清楚，后面的外部写入才有意义。

[Sources]
- ../AGENTS.md
- ../README.md
-->

---
layout: default
---

# Bridge 只保持一条 IM 长连接

<div class="two-col">
  <div>
    <h2>妙记侧</h2>
    <p><strong>实时事件</strong>进入 Starter。Transcript 未就绪时，只退避重试当前 token。</p>
  </div>
  <div>
    <h2>回复侧</h2>
    <p><strong>现有 Bridge → Codex → reply</strong>。不增加高频聊天扫描，也不创建第二条 IM 长连接。</p>
  </div>
</div>

> 同一个入口负责接收回复，同一个确定性命令负责回写。

<!--
解释为什么没有轮询聊天：实时妙记事件和现有 Bridge 分工清楚，避免重复消费者。

[Sources]
- ../IM_CONTRACT.md
- ../LIFECYCLE.md
-->

---
layout: default
---

# 让程序守边界，让 Codex 做整理

<div class="two-col">
  <div>
    <h2>确定性程序</h2>
    <ul>
      <li>event ID 与 token 去重</li>
      <li>退避、原子写入、文件命名</li>
      <li>状态迁移、分类移动、消息幂等</li>
    </ul>
  </div>
  <div>
    <h2>Codex + 个人 Skill</h2>
    <ul>
      <li>在给定 Transcript 内整理</li>
      <li>输出固定结构</li>
      <li>不替本人做最终判断</li>
    </ul>
  </div>
</div>

<!--
这是架构的底层逻辑：不能把去重、状态迁移和文件名交给模型猜。

[Sources]
- ../AGENTS.md
- ../schemas/codex-output.schema.json
-->

---
layout: default
---

# 先过五个课前门，再碰真实录音

1. macOS 与 Node.js `>=20.12`
2. Codex CLI 已登录
3. 自己的飞书应用与用户授权
4. 只发给本人或明确私人测试群的确认目标
5. 一条不含敏感内容的 60 秒测试录音

<p class="danger">任何目标、身份或权限不清楚，都先停止。</p>

<!--
现场逐项确认，不让学员把真实客户会议当第一条测试数据。

[Sources]
- ../docs/MACOS.md
- ./组织方课前检查清单.md
-->

---
layout: default
---

# 初始化一次只问一个问题

```bash
recording-agent init
```

<div class="evidence-line">
  <span>1</span><div>录音来自哪里？</div>
</div>
<div class="evidence-line">
  <span>2</span><div>你用什么分类体系？</div>
</div>
<div class="evidence-line">
  <span>3</span><div>Markdown 进入哪个本地目录？</div>
</div>
<div class="evidence-line">
  <span>4</span><div>哪些内容值得沉淀？</div>
</div>

<!--
Machine config 与语义规则分离。绝对路径、profile、chat ID 和凭证不会写进 Skill。

[Sources]
- ../AGENTS.md
- ../README.md
-->

---
layout: default
---

# `doctor` 先证明环境，`sample` 再证明契约

```bash
recording-agent doctor --workspace /absolute/path/to/workspace --live
recording-agent sample --workspace /absolute/path/to/workspace
```

<div class="two-col">
  <div>
    <h2>doctor 全绿</h2>
    <p>证明 Codex、Bridge、飞书身份、确认目标与本地目录都已就绪。</p>
  </div>
  <div>
    <h2>sample 唯一</h2>
    <p>证明安全 fixture 只生成一个主记录，但<strong>不等于</strong>真实飞书 E2E。</p>
  </div>
</div>

<!--
不要把 sample 的成功截图当作真实搭建完成。它只验证离线契约。

[Sources]
- ../README.md
- ../E2E_EVIDENCE.md
-->

---
layout: default
---

# 真实启动前，再看一次外部写目标

```bash
recording-agent start \
  --workspace /absolute/path/to/workspace \
  --confirm-external-writes
```

> Starter 会先展示确认目标和发送身份；只有核对后，才允许启动真实通知。

<p class="quiet">macOS 使用用户级 LaunchAgent。停止服务不会删除队列、失败状态或审计。</p>

<!--
外部写入的授权必须具体到目标与身份。现场不扩大范围，不临时改成群发。

[Sources]
- ../LIFECYCLE.md
- ../docs/MACOS.md
-->

---
layout: default
---

# 一条真实录音，只允许一个结果

<div class="big-number">1</div>

<div class="evidence-line">
  <span>主记录</span><div>唯一的 `R-XXXX.md`，包含原始证据、AI 整理、人工确认与审计。</div>
</div>
<div class="evidence-line">
  <span>确认单</span><div>只发给已核对的本人目标，不含 Transcript、机器路径或凭证。</div>
</div>
<div class="evidence-line">
  <span>token</span><div>同 token 重放返回 duplicate，不再次整理、不再次通知。</div>
</div>

<!--
这一页是现场 E2E 的验收口径。不是“看见文档”就算成功，而是三个唯一性都成立。

[Sources]
- ../E2E_EVIDENCE.md
- ../EVENT_CONTRACT.md
-->

---
layout: default
---

# 三条命令，始终回到同一记录

<div class="command">确认 R-0003</div>
<div class="command">修改 R-0003：请保留我对这个判断的异议</div>
<div class="command">分类 R-0003：学习</div>

<p class="quiet">每条消息必须是一个独立、精确的命令；重复 message ID 只返回 duplicate。</p>

<!--
不要把三条命令塞进一条消息。修改保留 AI 原输出和用户意见；分类只移动原文件。

[Sources]
- ../IM_CONTRACT.md
- ../E2E_EVIDENCE.md
-->

---
layout: default
---

# 失败时保留状态，比自动重来更安全

<div class="two-col">
  <div>
    <h2>可以自动恢复</h2>
    <ul>
      <li>Transcript 尚未就绪</li>
      <li>服务后台重启</li>
      <li>同事件或同 token 重放</li>
    </ul>
  </div>
  <div>
    <h2>必须人工停下</h2>
    <ul>
      <li>目标或身份不明确</li>
      <li>确认结果未知</li>
      <li>分类、ID 或命令不唯一</li>
    </ul>
  </div>
</div>

<p class="footer-note">catch-up 每日最多一次，只用于漏事件恢复。</p>

<!--
强调失败不应被静默改写为成功。状态和审计是复利资产。

[Sources]
- ../docs/TROUBLESHOOTING.md
- ../LIFECYCLE.md
-->

---
layout: default
---

# 这套 Loop 已经碰过真实世界

<div class="evidence-line">
  <span>46</span><div>自动化测试通过，覆盖安全、状态、确认和 mock 完整链路。</div>
</div>
<div class="evidence-line">
  <span>实时</span><div>全新 60 秒私人妙记由事件自动进入 Starter，不依赖 catch-up。</div>
</div>
<div class="evidence-line">
  <span>唯一</span><div>一个新记录、一份本人确认单；同 token 重放完全 no-op。</div>
</div>
<div class="evidence-line">
  <span>纠正</span><div>三条真实独立命令更新同一记录，并暴露、修复了意见被覆盖的缺陷。</div>
</div>

<!--
只陈述仓库中已留存的去敏证据，不展示真实录音、Transcript、ID 或链接。

[Sources]
- ../E2E_EVIDENCE.md
- ../PROJECT_STATUS.md
-->

---
layout: default
---

# 今天的完成，不是“看懂了”

- [ ] 本机 `doctor --live` 全绿
- [ ] `sample` 只生成一个安全样本
- [ ] 一条安全妙记实时生成唯一主记录与确认单
- [ ] 至少一条本人回复更新同一记录
- [ ] 服务重启后状态仍在，重放不重复

> 没有证据的步骤，保持未完成。

<!--
这页作为现场收口。学员只勾选自己真实跑通的项，不能代替别人宣布完成。

[Sources]
- ../AGENTS.md
- ./学员实操手册.md
-->

---
layout: cover
class: text-left
---

<div class="eyebrow">Before You Leave</div>

# 离场前，闭合四件事

<div class="evidence-line">
  <span>结果</span><div>我真实完成了什么，证据或准确阻塞在哪里。</div>
</div>
<div class="evidence-line">
  <span>两个人</span><div>我认识了谁，活动后准备怎样继续连接。</div>
</div>
<div class="evidence-line">
  <span>72 小时</span><div>我接下来要完成哪一项可检查动作。</div>
</div>
<div class="evidence-line">
  <span>反馈</span><div>我已完成签到与 NPS，知道保证金的处理方式。</div>
</div>

<!--
现场逐项确认，不把自由交流、口头说“回去再弄”和未填写反馈当成闭环。

[Sources]
- ./活动执行总控.md
- ./讲师现场执行清单.md
-->

---
layout: cover
class: text-left
---

<div class="eyebrow">First Agent Loop</div>

# 先让一条录音<br>真正闭环

<p class="lede">一个本人持有的输入，一个可追溯的主记录，一次由本人完成的纠正。</p>

<!--
结束不说“谢谢”，而是回到开场的动作：用一条安全录音完成自己的第一条闭环。

[Sources]
- ../AGENTS.md
-->
