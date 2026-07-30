export const MINUTE_GENERATED_EVENT = 'minutes.minute.generated_v1';

export interface MinuteGeneratedEvent {
  eventId: string;
  minuteToken: string;
  title: string;
  occurredAt: string;
  source: 'event' | 'catch-up';
}

function nonEmpty(value: unknown, field: string): string {
  if (typeof value !== 'string' || value.trim() === '') {
    throw new Error(`invalid or missing ${field}`);
  }
  return value;
}

export function parseMinuteGeneratedEvent(input: unknown): MinuteGeneratedEvent {
  if (typeof input !== 'object' || input === null) throw new Error('event must be an object');
  const root = input as Record<string, unknown>;
  const header =
    typeof root.header === 'object' && root.header !== null
      ? (root.header as Record<string, unknown>)
      : {};
  const event =
    typeof root.event === 'object' && root.event !== null
      ? (root.event as Record<string, unknown>)
      : {};
  const minute =
    typeof event.minute === 'object' && event.minute !== null
      ? (event.minute as Record<string, unknown>)
      : {};
  const eventType = nonEmpty(header.event_type ?? root.event_type ?? root.type, 'event_type');
  if (eventType !== MINUTE_GENERATED_EVENT) {
    throw new Error(`unsupported event type: ${eventType}`);
  }

  return {
    eventId: nonEmpty(header.event_id ?? root.event_id, 'event_id'),
    minuteToken: nonEmpty(
      event.minute_token ?? minute.minute_token ?? root.minute_token,
      'minute_token',
    ),
    title:
      typeof (event.title ?? minute.title ?? root.title) === 'string' &&
      String(event.title ?? minute.title ?? root.title).trim() !== ''
        ? String(event.title ?? minute.title ?? root.title)
        : '未命名录音',
    occurredAt: nonEmpty(
      header.create_time ?? event.timestamp ?? root.timestamp,
      'event timestamp',
    ),
    source: 'event',
  };
}
