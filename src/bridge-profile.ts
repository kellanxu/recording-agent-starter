import { homedir } from 'node:os';
import { join } from 'node:path';

export function bridgeProfileEnvironment(
  profile: string,
  baseEnvironment: NodeJS.ProcessEnv = process.env,
  channelHome = baseEnvironment.LARK_CHANNEL_HOME ?? join(homedir(), '.lark-channel'),
  identity: 'bot' | 'user' = 'bot',
): NodeJS.ProcessEnv {
  const normalized = profile.trim();
  if (
    normalized === '' ||
    normalized === '.' ||
    normalized === '..' ||
    !/^[A-Za-z0-9._-]+$/.test(normalized)
  ) {
    throw new Error('bridge profile name is invalid');
  }
  const profileRoot = join(channelHome, 'profiles', normalized);
  return {
    ...baseEnvironment,
    LARK_CHANNEL: '1',
    LARK_CHANNEL_HOME: channelHome,
    LARK_CHANNEL_PROFILE: normalized,
    LARK_CHANNEL_CONFIG: join(profileRoot, 'lark-cli-source', 'config.json'),
    LARKSUITE_CLI_CONFIG_DIR: join(profileRoot, identity === 'bot' ? 'lark-cli' : 'lark-cli-user'),
    LARKSUITE_CLI_NO_UPDATE_NOTIFIER: '1',
    LARKSUITE_CLI_NO_SKILLS_NOTIFIER: '1',
  };
}
