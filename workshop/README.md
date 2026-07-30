# Recording Agent Starter Workshop

这里存放基于真实 Starter 的本地活动材料。它不是公开 Release，也不包含任何私人配置、
录音、Transcript、消息 ID 或飞书资源链接。

## 材料

- `slides.md`：Slidev 演示源文件。
- `MAIN_LECTURE.md`：本地主讲义。
- `STUDENT_HANDBOOK.md`：学员手册。
- `PRE_CLASS_CHECKLIST.md`：课前检查。
- `INSTRUCTOR_CHECKLIST.md`：讲师清单。
- `FEISHU_INDEX.md`：飞书同步使用的本地 Markdown 真源索引。
- `QA.md`：离线构建、浏览器和 PDF 视觉验收记录。

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
