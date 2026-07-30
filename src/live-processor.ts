import type { CodexRunner, CodexRunnerInput } from './codex-runner.js';
import { readSemanticRules } from './semantic-rules.js';
import { RecordRepository } from './record-repository.js';
import type { TranscriptProcessor, TranscriptResult } from './control-plane.js';
import type { MinuteGeneratedEvent } from './minute-event.js';

export class LiveTranscriptProcessor implements TranscriptProcessor {
  private readonly repository: RecordRepository;

  constructor(
    private readonly workspaceRoot: string,
    private readonly runner: CodexRunner,
    private readonly now: () => Date = () => new Date(),
  ) {
    this.repository = new RecordRepository(workspaceRoot);
  }

  async process(event: MinuteGeneratedEvent, transcript: TranscriptResult): Promise<string> {
    const rules = await readSemanticRules(this.workspaceRoot);
    const input: CodexRunnerInput = {
      schemaVersion: 1,
      recordingId: 'pending-allocation',
      source: {
        kind: 'feishu-minutes',
        sourceId: event.minuteToken,
        title: transcript.title ?? event.title,
        capturedAt: event.occurredAt,
      },
      transcript: transcript.transcript,
      allowedCategories: rules.categories,
    };
    const output = await this.runner.run(input);
    const entry = await this.repository.create(input, output, this.now().toISOString());
    return entry.recordingId;
  }
}
