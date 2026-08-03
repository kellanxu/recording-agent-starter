import { createHash } from 'node:crypto';

import type { CandidateAction, CodexRunnerInput, CodexRunnerOutput } from './codex-runner.js';

const NOT_SPECIFIED = '未明确';

function yamlString(value: string): string {
  return JSON.stringify(value);
}

function candidateAction(action: CandidateAction): string {
  return `- 对象：${action.object?.trim() || NOT_SPECIFIED}
  动作：${action.action?.trim() || NOT_SPECIFIED}
  时间：${action.due?.trim() || NOT_SPECIFIED}
  验收：${action.acceptance?.trim() || NOT_SPECIFIED}`;
}

export function renderMainRecord(
  input: CodexRunnerInput,
  output: CodexRunnerOutput,
  createdAt: string,
): string {
  const digest = createHash('sha256').update(input.transcript).digest('hex');
  const actions =
    output.candidateActions.length === 0
      ? candidateAction({})
      : output.candidateActions.map(candidateAction).join('\n');
  const creationAudit =
    input.source.kind === 'offline-sample'
      ? '创建离线样本主记录；尚未发送飞书确认单。'
      : '根据飞书妙记创建主记录；尚待本人确认。';

  return `---
recording_id: ${yamlString(input.recordingId)}
source_kind: ${yamlString(input.source.kind)}
source_id: ${yamlString(input.source.sourceId)}
status: "pending_confirmation"
category: ${yamlString(output.category)}
created_at: ${yamlString(createdAt)}
transcript_sha256: ${yamlString(digest)}
---

# ${output.title}

## 原始证据

${input.transcript.trim()}

## AI 整理

${output.summary}

### 证据摘录

${output.evidence.map((evidence) => `- ${evidence}`).join('\n')}

## 候选待办

${actions}

## 人工确认

未确认

## 审计

- ${createdAt} ${creationAudit}
`;
}
