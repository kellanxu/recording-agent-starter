# macOS 安装教程

> 本教程对应 `v0.2.0-beta.2` 单连接架构。它是供自愿测试的 Pre-release，不是稳定版。

## 1. 安装并检查前置条件

课程验证基线：

- Node.js `>=20.12`；
- 官方 `@larksuite/cli` / `lark-cli 1.0.81`；
- `lark-channel-bridge 0.6.4`；
- 已安装并登录的 Codex CLI。

先安装或更新官方飞书 CLI。不要安装 npm 上无 scope 的同名 `lark-cli` 包，它不是本课程
使用的官方 `@larksuite/cli`：

```bash
npx @larksuite/cli@1.0.81 install
```

再安装课程验证过的 Bridge：

```bash
npm install --global lark-channel-bridge@0.6.4
```

若电脑已有更高版本，不要静默降级；先运行下面的版本与能力检查，能力齐全时保留现有版本。

```bash
node --version
npm --version
codex --version
codex login status
lark-channel-bridge --version
lark-channel-bridge profile --help
lark-channel-bridge start --help
lark-channel-bridge status --help
lark-cli --version
lark-cli event --help
lark-cli minutes --help
lark-cli api --help
lark-cli auth status --help
```

版本号只作为线索，以上能力检查才是运行门。每位使用者使用自己的飞书应用、授权和本地
Markdown 库；不要共享密钥或机器人。

## 2. 创建本人持有的 Bridge Profile

推荐为课程单独使用 `RecordingAgentCourse` Profile，避免覆盖电脑上已有的 Bridge：

```bash
lark-channel-bridge profile create RecordingAgentCourse --agent codex
```

首次创建会显示飞书二维码。必须由学员本人扫码并创建或绑定自己的 PersonalAgent；Agent
不得代替扫码，不得要求用户把 app secret、token 或验证码贴进聊天。配置成功后启动后台服务：

```bash
lark-channel-bridge start --profile RecordingAgentCourse
lark-channel-bridge profile list
lark-channel-bridge status --profile RecordingAgentCourse
```

如果已经有本人持有且能力兼容的 Profile，可以在本人确认后复用；不得使用讲师或其他学员的
Profile、飞书应用或凭证。

## 3. 校验并解压 ZIP

```bash
shasum -a 256 -c recording-agent-starter-0.2.0-beta.2.zip.sha256
unzip recording-agent-starter-0.2.0-beta.2.zip
cd recording-agent-starter
```

校验失败就停止，不继续安装。

## 4. 安装本地命令

```bash
npm install --omit=dev
npm install --global .
recording-agent --version
recording-agent --help
```

正式 ZIP 已包含构建后的 `dist/`，不需要 TypeScript 编译器。

## 5. 初始化

```bash
recording-agent init --bridge-profile RecordingAgentCourse
```

它会一次只问一个问题：Starter workspace、录音来源、分类体系、Markdown 入库位置和
沉淀规则。文件系统根、用户主目录根和临时目录会被拒绝。

确认目标是机器配置，不写入 Skill。需要真实 Loop 时重新初始化或使用显式参数配置本人
持有的 chat/user 目标；不要把 ID 发给他人或提交进仓库。

## 6. 先跑离线门

```bash
recording-agent doctor --workspace /absolute/path/to/starter-workspace
recording-agent sample --workspace /absolute/path/to/starter-workspace
```

未做真实授权时，`doctor` 返回 YELLOW 是预期结果。`sample` 应只生成一份 `R-0001`，
并明确说明它不是飞书 E2E。

## 7. 真实启动门

先检查：

```bash
recording-agent doctor --workspace /absolute/path/to/starter-workspace --live
```

首次启动前，身份授权、Bridge profile、Bridge 运行状态和“同一个应用”必须为 GREEN；
Hook 与订阅两项尚未安装时为 RED 是预期结果。启动命令会先展示确认目标和发送身份；
核对无误后才追加：

```bash
recording-agent start \
  --workspace /absolute/path/to/starter-workspace \
  --confirm-external-writes
```

启动后重新运行 `doctor --live`，此时才要求全部 GREEN。然后查看与停止：

```bash
recording-agent status --workspace /absolute/path/to/starter-workspace
recording-agent stop --workspace /absolute/path/to/starter-workspace
```

停止会关闭 Starter 事件派发和重试 worker，但保留 Bridge、本地 Hook、队列、失败状态和
审计。不要手工修改 Bridge plist 或使用 `kill -9`。

## 8. 失败恢复

- Transcript 未就绪：等待当前 token 的退避重试，不做高频全量扫描。
- 漏事件：`catch-up --days 1`，并在核对确认目标后追加
  `--confirm-external-writes`。
- 状态为 failed：保留 workspace 的 `state/` 与脱敏日志，不删除重装。
- 目标、身份或权限不清楚：停止，不扩大飞书应用可见范围。

详见 [E2E 证据](../E2E_EVIDENCE.md) 与 [生命周期](../LIFECYCLE.md)。
