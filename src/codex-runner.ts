export interface RecordingSource {
  kind: 'offline-sample' | 'feishu-minutes';
  sourceId: string;
  title: string;
  capturedAt: string;
}

export interface CodexRunnerInput {
  schemaVersion: 1;
  recordingId: string;
  source: RecordingSource;
  transcript: string;
  allowedCategories: readonly string[];
}

export interface CandidateAction {
  object?: string;
  action?: string;
  due?: string;
  acceptance?: string;
}

export interface CodexRunnerOutput {
  schemaVersion: 1;
  title: string;
  category: string;
  summary: string;
  evidence: readonly string[];
  candidateActions: readonly CandidateAction[];
}

export interface CodexRunner {
  run(input: CodexRunnerInput): Promise<CodexRunnerOutput>;
}

export class OfflineSampleRunner implements CodexRunner {
  run(input: CodexRunnerInput): Promise<CodexRunnerOutput> {
    const category = input.allowedCategories[0];
    if (category === undefined) {
      return Promise.reject(new Error('at least one allowed category is required'));
    }

    return Promise.resolve({
      schemaVersion: 1,
      title: '最小录音整理流程验证',
      category,
      summary: '先用安全离线样本跑通可审计记录，再接入真实飞书。',
      evidence: [
        '讨论结论和未明确行动需要分开记录。',
        '安装检查清单的负责人、时间和验收标准尚未确定。',
      ],
      candidateActions: [{ action: '整理一份安装检查清单' }],
    });
  }
}
