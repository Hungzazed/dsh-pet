/**
 * 通知标题的单元测试 —— 钉住「会话名进标题」这条约定：
 *   completed 的标题就是会话名（没有名字才回落「对话完成」）；
 *   error / max-tokens / 审批 / 提问 用「会话名 · 事件」，事件类型不被会话名吞掉；
 *   没有会话名（宿主没带 sessionId、会话不在列表、空白会话）一律回落固定文案；
 *   超长会话名按 30 字符截断，标题只占一行。
 */
import { describe, test } from 'node:test';
import assert from 'node:assert/strict';
import { frameToToast, MAX_BODY } from './notify.ts';

/** 审批帧：标题固定是「正在申请权限」，用它观察会话名怎么拼进标题。 */
const approvalFrame = { type: 'approval/requested', sessionId: 's1', toolName: 'bash', reason: 'wants to write /tmp' };

describe('frameToToast — session name in the title', () => {
  test('with a session name it is "session · event"', () => {
    assert.equal(
      frameToToast(approvalFrame, 'Fix notification titles')?.title,
      'Fix notification titles · Permission requested',
    );
  });

  test('no session name, empty string or whitespace only leaves the event type alone', () => {
    assert.equal(frameToToast(approvalFrame)?.title, 'Permission requested');
    assert.equal(frameToToast(approvalFrame, '')?.title, 'Permission requested');
    assert.equal(frameToToast(approvalFrame, '   ')?.title, 'Permission requested');
  });

  test('long session names truncate to 30 chars without eating the event type', () => {
    assert.equal(frameToToast(approvalFrame, 'ab'.repeat(30))?.title, 'ab'.repeat(15) + '… · Permission requested');
  });
});

describe('frameToToast — completion notifications', () => {
  const done = (text?: string) => ({
    type: 'session/event',
    sessionId: 's1',
    event: { type: 'turn/end', data: { reason: { kind: 'completed' }, text } },
  });

  test('title is the session name itself, with no "Chat finished" suffix', () => {
    const t = frameToToast(done('Done editing'), 'Fix notification titles');
    assert.equal(t?.title, 'Fix notification titles');
    assert.equal(t?.body, 'Done editing');
  });

  test('falls back to "Chat finished" without a session name', () => {
    assert.equal(frameToToast(done('Done editing'))?.title, 'Chat finished');
    assert.equal(frameToToast(done('Done editing'), '   ')?.title, 'Chat finished');
  });

  test('body still truncates at 80 chars; title and body stay independent', () => {
    const long = 'x'.repeat(MAX_BODY + 10);
    const t = frameToToast(done(long), 'a'.repeat(100));
    assert.equal(t?.body, 'x'.repeat(MAX_BODY) + '…');
    assert.equal(t?.title, 'a'.repeat(30) + '…');
  });
});

describe('frameToToast — other events carry the session name', () => {
  test('error is "session · Generation failed"; body stays the error message', () => {
    const frame = {
      type: 'session/event',
      sessionId: 's1',
      event: { type: 'turn/end', data: { reason: { kind: 'error', error: { message: 'Connection timeout' } } } },
    };
    const t = frameToToast(frame, 'Run tests');
    assert.equal(t?.title, 'Run tests · Generation failed');
    assert.equal(t?.body, 'Connection timeout');
    assert.equal(frameToToast(frame)?.title, 'Generation failed');
  });

  test('max-tokens / approval / question also prefix the session name', () => {
    const maxTokens = { type: 'session/event', event: { type: 'turn/end', data: { reason: { kind: 'max-tokens' } } } };
    assert.equal(frameToToast(maxTokens, 'Long document')?.title, 'Long document · Output truncated');
    assert.equal(frameToToast(approvalFrame, 'Deploy')?.title, 'Deploy · Permission requested');

    const question = { type: 'question/requested', sessionId: 's1', questions: [{ question: 'Which one?' }] };
    assert.equal(frameToToast(question, 'Pick a model')?.title, 'Pick a model · The model is waiting for your answer');
    assert.equal(frameToToast(question)?.title, 'The model is waiting for your answer');
  });

  test('host/agent-error has no session dimension; title stays "Generation failed"', () => {
    const t = frameToToast({ type: 'host/agent-error', message: 'process crashed' }, 'any name');
    assert.equal(t?.title, 'Generation failed');
    assert.equal(t?.body, 'process crashed');
  });
});

describe('frameToToast — events that do not pop', () => {
  test('aborted / interrupted / unknown types return null', () => {
    for (const kind of ['aborted', 'interrupted']) {
      const frame = { type: 'session/event', event: { type: 'turn/end', data: { reason: { kind } } } };
      assert.equal(frameToToast(frame, 'this one should not pop'), null);
    }
    assert.equal(frameToToast({ type: 'unknown/frame' }, 'likewise'), null);
  });
});
