# Troubleshooting

| 现象                   | 含义                                                     | 下一步                                   |
| ---------------------- | -------------------------------------------------------- | ---------------------------------------- |
| `doctor` 为 YELLOW     | 离线配置可用，但未验证真实授权或确认目标                 | 先补机器配置，再显式运行 `doctor --live` |
| `doctor --live` 为 RED | Codex 登录、Bridge profile 或飞书 user auth 至少一项失败 | 只修复报红项，不扩大无关权限             |
| `sample` 已存在        | `R-0001` 已生成                                          | 这是成功去重，不要手工复制               |
| Transcript pending     | 妙记文字记录尚未就绪                                     | 等待当前 token 的指数退避                |
| confirmation `unknown` | 发送结果有歧义                                           | 人工检查目标会话，不自动重发             |
| 分类不存在             | 命令目标不在初始化分类体系                               | 纠正分类名，不临时创造新分类             |
| `needs_clarification`  | ID、对象或命令格式不安全                                 | 使用精确的三种命令之一                   |
| 服务停止后仍有状态     | 队列和失败信息被保留                                     | 这是设计行为，不要删除 `state/`          |
| Windows 无后台服务     | beta 仅支持前台                                          | 保持终端开启，用 Ctrl+C 停止             |

所有故障日志必须脱敏。不要粘贴 Transcript、token、chat/user ID、凭证、妙记 URL 或
私人知识库路径到公开 issue。
