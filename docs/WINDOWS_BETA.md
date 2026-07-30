# Windows Beta 教程

Windows 路线目前只支持前台运行，不承诺后台常驻或机器重启恢复。真实 Windows E2E
尚未执行。

## 安装与离线验证

在 PowerShell 中：

```powershell
node --version
npm --version
codex --version
lark-cli --version

npm install --omit=dev
npm install --global .
recording-agent init
recording-agent doctor --workspace C:\absolute\path\to\starter-workspace
recording-agent sample --workspace C:\absolute\path\to\starter-workspace
```

不要把 workspace 或 Markdown 库设置为磁盘根、用户主目录根或临时目录。

## 前台运行

完成本人飞书配置、确认目标核对和 live doctor 后：

```powershell
recording-agent start `
  --workspace C:\absolute\path\to\starter-workspace `
  --foreground `
  --confirm-external-writes
```

保持窗口开启。停止方式是该窗口按 `Ctrl+C`。队列、失败状态和审计会保留。

Windows 未完成真实 E2E 前，不要把它描述为正式支持，也不要设置第三方后台服务包装器。
