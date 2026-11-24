/**
 * Settings write-flow tests (src/client/settings/config/write-flow.ts).
 * Verifies that saving config re-applies the server-returned merged aggregate
 * so derived defaults (such as entryPrompt placeholder after switching language) update immediately.
 */
import assert from 'node:assert/strict';
import { describe, test } from 'node:test';

import { DEFAULT_FONT } from '../../../shared/fonts.ts';
import { getLanguageSetting, setActiveLanguage } from '../../../shared/i18n/core.ts';
import { DEFAULT_PHYSICS } from '../../../shared/physics.ts';
import { DEFAULT_WEIGHTS } from '../../../shared/weights.ts';
import type { SaveFields } from './http.ts';
import type { MergedConfig } from './read.ts';
import { createWriteFlow } from './write-flow.ts';

function sampleFields(): SaveFields {
  return {
    pets: [
      {
        id: 'main',
        name: 'Pet',
        size: 320,
        sizePercent: 20,
        balanceEnabled: true,
        whisperEnabled: true,
        workStatusEnabled: true,
        fixedEnabled: false,
        display: 'web',
        position: { corner: 'bottom-right', marginX: 40, marginY: 40 },
      },
    ],
    language: 'en',
    notificationsEnabled: true,
    notifyWhenFocused: false,
    clickSoundEnabled: true,
    whisperImageEnabled: true,
    chatImageEnabled: true,
    chatAnimationEnabled: true,
    confineToScreen: false,
    trayEnabled: true,
    voiceEnabled: false,
    voiceName: 'edge/en-US-AvaNeural',
    voiceVolume: 0.8,
    voiceWhisperEnabled: false,
    voiceTodoEnabled: false,
    voiceNotifyEnabled: false,
    speechProvider: 'dsh',
    environmentCity: '',
    physics: DEFAULT_PHYSICS,
    whisperModel: { provider: '', model: '' },
    chatModel: { provider: '', model: '' },
    chatMemoryRounds: 5,
    chatImageLimit: 20,
    font: DEFAULT_FONT,
    animationWeights: DEFAULT_WEIGHTS,
  };
}

describe('createWriteFlow.save', () => {
  test('applies returned merged config back to form state after successful save', async () => {
    const prevLang = getLanguageSetting();
    const originalFetch = globalThis.fetch;
    const mergedResponse: MergedConfig = {
      main: {
        language: 'en',
        whisperPrompt: 'Updated English default persona',
        pets: sampleFields().pets,
      },
    };
    globalThis.fetch = (async () =>
      new Response(JSON.stringify(mergedResponse), {
        status: 200,
        headers: { 'content-type': 'application/json' },
      })) as typeof globalThis.fetch;

    const applied: MergedConfig[] = [];
    const messages: Array<{ kind: string; text: string }> = [];
    let busy = false;
    try {
      const flow = createWriteFlow({
        fields: sampleFields,
        packWrites: () => [],
        busy: () => busy,
        setBusy: (v) => {
          busy = v;
        },
        setMsg: (m) => messages.push(m),
        setDialog: () => undefined,
        dialog: () => null,
        applyConfig: (m) => applied.push(m),
        userFile: () => '/tmp/main-config.jsonc',
        t: (k) => k,
        onRemove: () => undefined,
      });

      await flow.save();
    } finally {
      globalThis.fetch = originalFetch;
      setActiveLanguage(prevLang);
    }

    assert.equal(applied.length, 1, 'save() must push merged response back to applyConfig');
    assert.deepEqual(applied[0], mergedResponse);
    assert.deepEqual(messages[messages.length - 1], { kind: 'ok', text: 'saved' });
  });
});
