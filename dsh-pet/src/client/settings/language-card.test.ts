import { describe, test } from 'node:test';
import assert from 'node:assert/strict';

import { makeLanguageCard } from './language-card.ts';
import { PET_LANGUAGES } from '../../shared/i18n/core.ts';

interface Node {
  type: unknown;
  props?: Record<string, unknown>;
}

const h = (type: unknown, props?: Record<string, unknown>): Node => ({ type, props });

function walk(node: unknown): Node[] {
  if (!node || typeof node !== 'object') return [];
  if (Array.isArray(node)) return node.flatMap(walk);
  const el = node as Node;
  return [el, ...walk(el.props?.children)];
}

describe('LanguageCard', () => {
  test('renders select with all PET_LANGUAGES options and forwards onChange', () => {
    let picked = '';
    const Card = makeLanguageCard({
      h,
      t: (key: string) => key,
      useState: (init: unknown) => [init, () => {}],
      useEffect: () => {},
      useRef: (init: unknown) => ({ current: init }),
      useCallback: (fn: unknown) => fn,
    } as never);
    const tree = Card({
      busy: false,
      language: 'vi',
      onChange: (next) => {
        picked = next;
      },
    });
    const all = walk(tree);
    const select = all.find((node) => Array.isArray(node.props?.options));
    assert.ok(select, 'Select component should be rendered');
    const options = select.props?.options as Array<{ id: string; label: string }>;
    assert.deepEqual(
      options.map((o) => o.id),
      [...PET_LANGUAGES],
    );
    assert.equal(select.props?.value, 'vi');
    (select.props?.onChange as (id: string) => void)('en');
    assert.equal(picked, 'en');
  });
});
