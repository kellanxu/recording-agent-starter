# Recording Agent Starter v0.1.0｜活动材料索引

## 1. 学习结果

帮助对 Agent 感兴趣但不知道如何开始的圈友，把一条本人持有的飞书录音转化为唯一、
可审计、可纠正的本地 Markdown 主记录，并通过本人确认完成第一条 Agent Loop。

## 2. 不可越过的边界

- 每位使用者持有自己的飞书应用、授权、录音和本地 Markdown 库。
- `sample` 是公开 fixture 证据，不是真实飞书 E2E。
- 不自动创建任务、发布内容或删除原录音。
- 确认单只发给本人或明确的私人测试群。
- 飞书文档公开权限必须在展示具体文档和目标档位后再次确认。

## 3. 材料与顺序

| 顺序 | 本地 Markdown 真源        | 用途                        |
| ---: | ------------------------- | --------------------------- |
|    1 | `MAIN_LECTURE.md`         | 讲清 Mission、Loop 与安全门 |
|    2 | `STUDENT_HANDBOOK.md`     | 学员按真实命令完成闭环      |
|    3 | `PRE_CLASS_CHECKLIST.md`  | 课前准备与权限核对          |
|    4 | `INSTRUCTOR_CHECKLIST.md` | 讲师现场验收与失败恢复      |
|    5 | `slides.md`               | 18 页 Slidev 演示源         |

`EVENT_RUNBOOK.md` 是组局官内部执行总控，包含群运营、场地、角色、签到反馈与活动后复盘，
不作为学员公开材料自动同步；若后续需要同步，必须先删除未填写占位符并单独确认范围。

## 4. 最小验证命令

```bash
recording-agent init
recording-agent doctor --workspace /absolute/path/to/workspace
recording-agent sample --workspace /absolute/path/to/workspace
```

`doctor --live` 只有全部为 GREEN，且使用者已核对本人确认目标和发送身份，才进入真实
外部写入。

## 5. 公开安全截图

以下图片由构建后的 CLI 和仓库自带公开 fixture 生成，机器路径已替换为占位符。

![CLI help](https://raw.githubusercontent.com/kellanxu/recording-agent-starter/v0.1.0/docs/assets/cli-help.png)

![Offline doctor](https://raw.githubusercontent.com/kellanxu/recording-agent-starter/v0.1.0/docs/assets/doctor-offline.png)

![Offline sample](https://raw.githubusercontent.com/kellanxu/recording-agent-starter/v0.1.0/docs/assets/sample-offline.png)

## 6. 公开链接

- [GitHub 仓库](https://github.com/kellanxu/recording-agent-starter)
- [v0.1.0 Release](https://github.com/kellanxu/recording-agent-starter/releases/tag/v0.1.0)
- [macOS 安装教程](https://github.com/kellanxu/recording-agent-starter/blob/v0.1.0/docs/MACOS.md)
- [真实 E2E 去敏证据](https://github.com/kellanxu/recording-agent-starter/blob/v0.1.0/E2E_EVIDENCE.md)
