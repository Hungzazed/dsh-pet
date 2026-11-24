/**
 * Slash command i18n refresh tests (command-balance, command-chat, command-pet).
 * Verifies that changing configured language and calling refresh() disposes the previous
 * command registration and re-registers with updated localized description and input hint.
 */
import assert from 'node:assert/strict';
import { describe, test } from 'node:test';

import type { ResolvedLanguage } from '../../shared/i18n/core.ts';
import { registerBalanceCommand } from './command-balance.ts';
import { registerChatCommand } from './command-chat.ts';
import { registerPetCommand } from './command-pet.ts';

function fakeCtx() {
  const registered: Array<{ name: string; description: string; input?: { hint?: string }; disposed: boolean }> = [];
  const effectCleanups: Array<() => void> = [];
  const ctx = {
    effect(fn: () => (() => void) | void) {
      const cleanup = fn();
      if (typeof cleanup === 'function') effectCleanups.push(cleanup);
    },
    commands: {
      register(def: { name: string; description: string; input?: { hint?: string } }) {
        const entry = { name: def.name, description: def.description, input: def.input, disposed: false };
        registered.push(entry);
        return () => {
          entry.disposed = true;
        };
      },
    },
  };
  return { ctx, registered, effectCleanups };
}

describe('slash commands —— refresh() on language change', () => {
  test('balance / chat / pet commands dispose old registration and re-register in new language', () => {
    const { ctx, registered, effectCleanups } = fakeCtx();
    let lang: ResolvedLanguage = 'vi';
    const sleep = { sleeping: () => false } as never;

    const bal = registerBalanceCommand({
      ctx,
      language: () => lang,
      effectivePetList: () => [],
      refreshBalance: async () => undefined,
      sleep,
      sleepRefusalText: () => '',
    });
    const chat = registerChatCommand({
      ctx,
      language: () => lang,
      chatWithPet: async () => ({ ok: true as const, text: '' }),
      log: { info: () => undefined, warn: () => undefined } as never,
      publishWhisper: (async () => ({ ok: true as const, text: '' })) as never,
      resolveActivePetId: () => 'main',
      sleep,
      sleepRefusalText: () => '',
    });
    const pet = registerPetCommand({
      ctx,
      language: () => lang,
      effectivePetList: () => [],
      petDisplayName: () => 'Pet',
      resolveActivePetId: () => 'main',
      setActivePetId: () => undefined,
    });

    assert.equal(registered.length, 3);
    assert.match(registered[0].description, /số dư/i);
    assert.match(registered[1].description, /thú cưng/i);
    assert.match(registered[2].description, /thú cưng/i);

    lang = 'en';
    bal.refresh();
    chat.refresh();
    pet.refresh();

    assert.equal(registered.length, 6);
    assert.equal(registered[0].disposed, true);
    assert.equal(registered[1].disposed, true);
    assert.equal(registered[2].disposed, true);
    assert.match(registered[3].description, /balance bubble/i);
    assert.match(registered[4].description, /Chat with your pet/i);
    assert.match(registered[5].description, /Select the active pet/i);

    for (const fn of effectCleanups) fn();
    assert.equal(registered[3].disposed, true);
    assert.equal(registered[4].disposed, true);
    assert.equal(registered[5].disposed, true);
  });
});
