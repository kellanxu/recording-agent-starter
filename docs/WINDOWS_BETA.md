# Windows 当前边界

`v0.2.0` 的单连接 Bridge Hook 依赖 macOS LaunchAgent。Windows 当前只支持初始化、
离线诊断和安全 sample，不支持真实事件 `start`。

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

## 暂不可用的部分

`recording-agent start` 会明确返回 unavailable。不要用第二条 `lark-cli event consume`、
第三方后台包装器或高频扫描绕过这一边界。Windows 的原生生命周期与真实 E2E 完成后，
才能重新标记为 beta。
