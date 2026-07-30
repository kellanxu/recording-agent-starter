const TOKEN_PATTERN = /\b(?:obc|oc|ou|om|app|user|chat|open)_[a-z0-9_-]{8,}\b/giu;
const CREDENTIAL_PATTERN =
  /\b(?:app_secret|client_secret|access_token|refresh_token|tenant_access_token)\s*[:=]\s*\S+/giu;
const TRANSCRIPT_PATTERN =
  /\b(?:transcript|raw_transcript|transcript_text)\s*[:=]\s*(?:"[^"]*"|'[^']*'|\S+)/giu;
const HOME_PATH_PATTERN = /\/Users\/[^/\s]+\/[^\s]*/gu;

export function redactLogMessage(message: string): string {
  return message
    .replace(CREDENTIAL_PATTERN, '[REDACTED_CREDENTIAL]')
    .replace(TRANSCRIPT_PATTERN, '[REDACTED_TRANSCRIPT]')
    .replace(TOKEN_PATTERN, '[REDACTED_ID]')
    .replace(HOME_PATH_PATTERN, '[REDACTED_PATH]');
}
