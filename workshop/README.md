# Recording Agent Starter Workshop

这里存放基于真实 Starter 的本地活动材料。它不是公开 Release，也不包含任何私人配置、
录音、Transcript、消息 ID 或飞书资源链接。

## 材料

- `slides.md`：Slidev 演示源文件。
- `录音Agent现场主讲义.md`：现场使用的学员主讲义。
- `课前预习手册.md`：学员通过提示词让 Agent 完成课前准备与基础就绪验收。
- `学员实操手册.md`：学员按提示完成安装、样本和真实 Loop。
- `组织方课前检查清单.md`：组织方课前准备与权限核对。
- `讲师现场执行清单.md`：讲师现场验收与失败恢复。
- `活动执行总控.md`：群运营、场地、角色、签到反馈、现场节奏与活动后复盘总控。
- `飞书材料索引.md`：飞书同步使用的本地 Markdown 真源索引。
- `演示验收记录.md`：离线构建、浏览器和 PDF 视觉验收记录。

## 构建

要求 Node.js `>=20.12`：

```bash
cd workshop
npm ci
npm run build
npm run export:pdf
```

静态 HTML 输出到仓库忽略的 `release/workshop-html/`；PDF 输出到
`output/pdf/recording-agent-starter-workshop.pdf`。HTML 的播放、键盘翻页和演讲者模式
全部使用本地构建资源，不依赖 CDN。请用本地静态服务器从站点根目录打开，不要直接双击
`file://`：

```bash
cd workshop
npx vite preview --outDir ../release/workshop-html
```

开发预览：

```bash
npm run dev
```

## 验收边界

- 看到演示不等于完成搭建。
- `sample` 通过不等于真实飞书 E2E 通过。
- 现场真实外部写入只能发给使用者本人或明确的私人测试群。
- 不共享飞书应用凭证，不自动创建任务、发布内容或删除原录音。
- 飞书文档公开权限必须在展示具体文档和目标档位后再次确认。
