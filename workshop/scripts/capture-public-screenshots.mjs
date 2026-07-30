import { execFile } from 'node:child_process';
import { mkdtemp, mkdir, readFile, rm } from 'node:fs/promises';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { promisify } from 'node:util';

import { chromium } from 'playwright-chromium';

const execFileAsync = promisify(execFile);
const scriptDirectory = dirname(fileURLToPath(import.meta.url));
const repositoryRoot = resolve(scriptDirectory, '..', '..');
const cliPath = join(repositoryRoot, 'dist', 'cli.js');
const outputDirectory = join(repositoryRoot, 'docs', 'assets');

function escapeHtml(value) {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;');
}

function sanitize(value, demoRoot) {
  return value.replaceAll(demoRoot, '$DEMO_ROOT').replaceAll(repositoryRoot, '$PROJECT_ROOT');
}

async function run(args) {
  const result = await execFileAsync(process.execPath, [cliPath, ...args], {
    cwd: repositoryRoot,
    env: process.env,
  });
  return `${result.stdout}${result.stderr}`.trim();
}

function pageHtml({ eyebrow, title, command, output, secondaryTitle, secondary }) {
  const secondaryMarkup =
    secondary === undefined
      ? ''
      : `<section class="secondary">
          <div class="secondary-title">${escapeHtml(secondaryTitle)}</div>
          <pre>${escapeHtml(secondary)}</pre>
        </section>`;
  return `<!doctype html>
  <html lang="zh-CN">
    <head>
      <meta charset="utf-8" />
      <style>
        * { box-sizing: border-box; }
        html, body { margin: 0; width: 100%; height: 100%; }
        body {
          background:
            radial-gradient(circle at 88% 10%, rgba(40, 199, 111, .12), transparent 30%),
            #0d1512;
          color: #eaf4ef;
          font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
          padding: 62px 72px 54px;
        }
        .eyebrow {
          color: #ff7a45;
          font-family: Inter, system-ui, sans-serif;
          font-size: 17px;
          font-weight: 800;
          letter-spacing: .16em;
          text-transform: uppercase;
        }
        h1 {
          color: #f6fbf8;
          font-family: Inter, system-ui, sans-serif;
          font-size: 48px;
          letter-spacing: -.035em;
          margin: 16px 0 30px;
        }
        .terminal {
          border: 1px solid rgba(234, 244, 239, .16);
          border-radius: 14px;
          box-shadow: 0 26px 80px rgba(0, 0, 0, .32);
          overflow: hidden;
        }
        .bar {
          align-items: center;
          background: #16231e;
          border-bottom: 1px solid rgba(234, 244, 239, .12);
          display: flex;
          gap: 9px;
          height: 48px;
          padding: 0 18px;
        }
        .dot { border-radius: 50%; height: 11px; width: 11px; }
        .dot:nth-child(1) { background: #ff6b5f; }
        .dot:nth-child(2) { background: #f4c34e; }
        .dot:nth-child(3) { background: #28c76f; }
        .body {
          background: rgba(13, 21, 18, .92);
          padding: 28px 32px 30px;
        }
        .command {
          color: #67e8a5;
          font-size: 21px;
          font-weight: 700;
          margin-bottom: 22px;
        }
        .command::before { color: #ff7a45; content: "› "; }
        pre {
          color: #d4e2db;
          font-family: inherit;
          font-size: 17px;
          line-height: 1.58;
          margin: 0;
          white-space: pre-wrap;
        }
        .secondary {
          border-left: 3px solid #28c76f;
          margin-top: 24px;
          padding: 2px 0 2px 24px;
        }
        .secondary-title {
          color: #67e8a5;
          font-family: Inter, system-ui, sans-serif;
          font-size: 18px;
          font-weight: 800;
          margin-bottom: 12px;
        }
        .secondary pre { font-size: 15px; line-height: 1.48; }
        footer {
          color: #71877c;
          font-family: Inter, system-ui, sans-serif;
          font-size: 14px;
          margin-top: 20px;
        }
      </style>
    </head>
    <body>
      <div class="eyebrow">${escapeHtml(eyebrow)}</div>
      <h1>${escapeHtml(title)}</h1>
      <main class="terminal">
        <div class="bar"><i class="dot"></i><i class="dot"></i><i class="dot"></i></div>
        <div class="body">
          <div class="command">${escapeHtml(command)}</div>
          <pre>${escapeHtml(output)}</pre>
          ${secondaryMarkup}
        </div>
      </main>
      <footer>Actual CLI output · bundled public fixture · machine paths sanitized</footer>
    </body>
  </html>`;
}

const localTemporaryRoot = join(repositoryRoot, 'tmp');
await mkdir(localTemporaryRoot, { recursive: true });
const demoRoot = await mkdtemp(join(localTemporaryRoot, 'public-screenshot-'));
const workspace = join(demoRoot, 'workspace');
const library = join(demoRoot, 'markdown-library');
let browser;

try {
  await mkdir(outputDirectory, { recursive: true });
  await run([
    'init',
    '--workspace',
    workspace,
    '--source',
    '本人飞书妙记（公开安全样本）',
    '--categories',
    '工作,学习',
    '--library',
    library,
    '--retention',
    '保留原始证据、结论和人工意见',
  ]);

  const help = await run(['--help']);
  const doctor = await run(['doctor', '--workspace', workspace]);
  const sample = await run(['sample', '--workspace', workspace]);
  const markdown = await readFile(join(library, '工作', 'R-0001-offline-sample.md'), 'utf8');
  const publicExcerpt = markdown
    .slice(markdown.indexOf('# 最小录音整理流程验证'))
    .split('\n## 审计')[0]
    .trim();

  browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  const screenshots = [
    {
      file: 'cli-help.png',
      html: pageHtml({
        eyebrow: 'Recording Agent Starter · Public Sample',
        title: '先看清命令边界',
        command: 'recording-agent --help',
        output: help,
      }),
    },
    {
      file: 'doctor-offline.png',
      html: pageHtml({
        eyebrow: 'Recording Agent Starter · Public Sample',
        title: 'Doctor 会诚实保留未验证项',
        command: 'recording-agent doctor --workspace "$DEMO_WORKSPACE"',
        output: sanitize(doctor, demoRoot),
      }),
    },
    {
      file: 'sample-offline.png',
      html: pageHtml({
        eyebrow: 'Recording Agent Starter · Public Sample',
        title: '安全 fixture 生成唯一主记录',
        command: 'recording-agent sample --workspace "$DEMO_WORKSPACE"',
        output: sanitize(sample, demoRoot),
        secondaryTitle: 'R-0001-offline-sample.md · public excerpt',
        secondary: publicExcerpt,
      }),
    },
  ];

  for (const screenshot of screenshots) {
    await page.setContent(screenshot.html, { waitUntil: 'load' });
    await page.screenshot({
      path: join(outputDirectory, screenshot.file),
      fullPage: true,
    });
  }
} finally {
  if (browser !== undefined) await browser.close();
  await rm(demoRoot, { recursive: true, force: true });
}
