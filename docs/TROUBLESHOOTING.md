# Troubleshooting

| 现象                            | 含义                                                 | 下一步                                                                               |
| ------------------------------- | ---------------------------------------------------- | ------------------------------------------------------------------------------------ |
| Bridge `not available on PATH`  | Bridge 未安装，或安装在 Codex 当前看不到的 Node PATH | 从 `zarazhangrui/feishu-claude-code-bridge` 安装课程验证版；再查 `command -v` 与版本 |
| `lark-cli 1.0.0` 或没有 `event` | 安装的是旧版官方 CLI，尚不具备实时事件能力           | 用官方 `@larksuite/cli` 安装器更新；不要安装无 scope 的同名 npm 包                   |
| Bridge 有命令但没有 Profile     | 只安装了程序，尚未绑定本人飞书 PersonalAgent         | 本人扫码创建 `RecordingAgentCourse` Profile，再启动后台服务                          |
| Bridge Profile 来自他人         | 凭证和应用所有权不属于当前学员                       | 停止；创建本人持有的 Profile，禁止共享讲师配置                                       |
| `doctor` 为 YELLOW              | 离线配置可用，但未验证真实授权或确认目标             | 先补机器配置，再显式运行 `doctor --live`                                             |
| 首次 `doctor --live` 为 RED     | 身份授权错误，或 Hook/订阅尚未安装                   | 先修复身份项；Hook/订阅由 `start` 安装                                               |
| 启动后仍为 RED                  | Hook、订阅、同应用校验或 Bridge 运行状态失败         | 只修复报红项，不扩大无关权限                                                         |
| `sample` 已存在                 | `R-0001` 已生成                                      | 这是成功去重，不要手工复制                                                           |
| Transcript pending              | 妙记文字记录尚未就绪                                 | 等待当前 token 的指数退避                                                            |
| confirmation `unknown`          | 发送结果有歧义                                       | 人工检查目标会话，不自动重发                                                         |
| 分类不存在                      | 命令目标不在初始化分类体系                           | 纠正分类名，不临时创造新分类                                                         |
| `needs_clarification`           | ID、对象或命令格式不安全                             | 使用精确的三种命令之一                                                               |
| 服务停止后仍有状态              | 队列和失败信息被保留                                 | 这是设计行为，不要删除 `state/`                                                      |
| Windows `start` 不可用          | 单连接 Hook 尚无 Windows 生命周期                    | 只做离线 sample，不另开事件消费者                                                    |

所有故障日志必须脱敏。不要粘贴 Transcript、token、chat/user ID、凭证、妙记 URL 或
私人知识库路径到公开 issue。
