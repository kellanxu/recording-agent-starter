import { realpathSync } from 'node:fs';
import { createRequire } from 'node:module';
import { pathToFileURL } from 'node:url';

import { patchChannelPrototype } from './bridge-hook-runtime.js';

interface ChannelModule {
  LarkChannel?: { prototype: Record<PropertyKey, unknown> };
  default?: { LarkChannel?: { prototype: Record<PropertyKey, unknown> } };
}

const bridgeEntry = process.argv[1];
if (bridgeEntry !== undefined) {
  try {
    const requireFromBridge = createRequire(realpathSync(bridgeEntry));
    const channelEntry = requireFromBridge.resolve('@larksuite/channel');
    const imported = (await import(pathToFileURL(channelEntry).href)) as ChannelModule;
    const channel = imported.LarkChannel ?? imported.default?.LarkChannel;
    if (channel !== undefined) {
      patchChannelPrototype(channel.prototype as Parameters<typeof patchChannelPrototype>[0]);
    }
  } catch {
    // A Bridge upgrade must not be allowed to take the existing chat bot down.
    console.warn('[recording-agent-hook] incompatible Bridge runtime; Minutes hook not installed');
  }
}
