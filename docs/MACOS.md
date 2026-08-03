# macOS 安装教程

> 本教程对应 `v0.2.0-beta.1` 单连接架构。它是供自愿测试的 Pre-release，不是稳定版。

## 1. 检查前置条件

```bash
node --version
npm --version
codex --version
codex login status
lark-channel-bridge --version
lark-cli --version
```

要求 Node.js `>=20.12`，Codex CLI 已登录。每位使用者使用自己的飞书应用、授权和本地
Markdown 库；不要共享密钥或机器人。

## 2. 校验并解压 ZIP

```bash
shasum -a 256 -c recording-agent-starter-0.2.0-beta.1.zip.sha256
unzip recording-agent-starter-0.2.0-beta.1.zip
cd recording-agent-starter
```

校验失败就停止，不继续安装。

## 3. 安装本地命令

```bash
npm install --omit=dev
npm install --global .
recording-agent --version
recording-agent --help
```

正式 ZIP 已包含构建后的 `dist/`，不需要 TypeScript 编译器。

## 4. 初始化

```bash
recording-agent init
```

它会一次只问一个问题：Starter workspace、录音来源、分类体系、Markdown 入库位置和
沉淀规则。文件系统根、用户主目录根和临时目录会被拒绝。

确认目标是机器配置，不写入 Skill。需要真实 Loop 时重新初始化或使用显式参数配置本人
持有的 chat/user 目标；不要把 ID 发给他人或提交进仓库。

## 5. 先跑离线门

```bash
recording-agent doctor --workspace /absolute/path/to/starter-workspace
recording-agent sample --workspace /absolute/path/to/starter-workspace
```

未做真实授权时，`doctor` 返回 YELLOW 是预期结果。`sample` 应只生成一份 `R-0001`，
并明确说明它不是飞书 E2E。

## 6. 真实启动门

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

## 7. 失败恢复

- Transcript 未就绪：等待当前 token 的退避重试，不做高频全量扫描。
- 漏事件：`catch-up --days 1`，并在核对确认目标后追加
  `--confirm-external-writes`。
- 状态为 failed：保留 workspace 的 `state/` 与脱敏日志，不删除重装。
- 目标、身份或权限不清楚：停止，不扩大飞书应用可见范围。

详见 [E2E 证据](../E2E_EVIDENCE.md) 与 [生命周期](../LIFECYCLE.md)。
