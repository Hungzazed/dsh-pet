/**
 * 「桌宠配置」面板的全局部分：开关、语音、外观、物理、移动端、对话模型与落盘位置。
 *
 * 全部读写 state.globals（main 条目的全局字段），由 ./pets 的保存一并提交。
 * 卡片按 builder 数组返回，渲染时机由 ./pets 决定——这里不自己找容器。
 * @module dsh-pet/src/standalone/settings-page/script/globals
 */

/** 生成全局卡片片段。 */
export function globalsScript(): string {
  return `
function globalCards() {
  return [globalFlagsCard, voiceCard, fontCard, physicsCard, motionCard, modelCard, memoryCard, environmentCard, advancedCard];
}

function setGlobal(key, value) {
  state.globals[key] = value;
}

function globalFlagsCard() {
  const g = state.globals;
  return card('Global switches', 'Applies to all pets; written to disk as soon as you save.', [
    toggleRow('g-notify', 'System notifications', 'Show a system notification for chat completion, generation failures, permission requests, and similar events.', g.notificationsEnabled, (value) => setGlobal('notificationsEnabled', value)),
    toggleRow('g-notify-focused', 'Notify while focused', 'Keep sending notifications and voice work-status updates even with this page open in a focused window. Off by default.', g.notifyWhenFocused, (value) => setGlobal('notifyWhenFocused', value)),
    toggleRow('g-click', 'Click sound', 'Play a built-in sound when the pet is clicked.', g.clickSoundEnabled, (value) => setGlobal('clickSoundEnabled', value)),
    toggleRow('g-whisper-image', 'Whispers with images', 'Let the model pick a meme image when whispering.', g.whisperImageEnabled, (value) => setGlobal('whisperImageEnabled', value)),
    toggleRow('g-chat-image', 'Chat images', 'Give the model the meme list so it can pick images that fit the context.', g.chatImageEnabled, (value) => setGlobal('chatImageEnabled', value)),
    toggleRow('g-chat-anim', 'Chat animations', 'Let the model pick an animation to play during the chat.', g.chatAnimationEnabled, (value) => setGlobal('chatAnimationEnabled', value)),
    toggleRow('g-confine', 'Confine to current screen', 'Throwing and free roaming stay on the screen the pet is currently on.', g.confineToScreen, (value) => setGlobal('confineToScreen', value)),
    toggleRow('g-tray', 'Tray icon', 'Keep an icon in the system tray in desktop mode; once off, the pet can only be found from the taskbar.', g.trayEnabled, (value) => setGlobal('trayEnabled', value)),
  ]);
}

function environmentCard() {
  const g = state.globals;
  const feedback = make('p', { class: 'fieldHint', text: '', hidden: true });
  const show = (text) => {
    feedback.textContent = text;
    feedback.hidden = false;
  };
  const input = make('input', { type: 'text', id: 'g-env-city', value: g.environmentCity || '' });
  input.placeholder = 'Leave empty to auto-detect';
  input.addEventListener('input', () => {
    setGlobal('environmentCity', input.value);
    markDirty(true);
    feedback.hidden = true;
  });
  // 检测走宿主已有的环境查询（不带 pet = 纯查询，不点亮气泡），把 IP 定位结果回填。
  // 必带 fresh=1：不带就会读到 10 分钟内的缓存定位，用户点了检测却拿到旧城市。
  // 必带 ip=1：不带就会把配置里已填的城市原样回显，检测按钮等于没作用。
  // 回填后不自动保存——用户可能还要改，统一走页面底部的保存。
  const detect = button('Detect', () => {
    detect.textContent = 'Detecting…';
    detect.disabled = true;
    callApi('POST', '/environment?fresh=1&ip=1')
      .then((facts) => {
        if (!facts || typeof facts.city !== 'string' || !facts.city) {
          show('The host returned no city (IP lookup failed). Enter one manually.');
          return;
        }
        input.value = facts.city;
        setGlobal('environmentCity', facts.city);
        markDirty(true);
        show('Filled in: ' + facts.city + ' (save to apply)');
      })
      .catch((error) => show('Detection failed: ' + (error && error.message ? error.message : String(error))))
      .finally(() => {
        detect.textContent = 'Detect';
        detect.disabled = false;
      });
  });
  return card('Environment and location', 'Which city the weather is for. Leave empty to locate by egress IP; enter a city name to query that city.', [
    fieldRow('g-env-city', 'City', make('div', { class: 'row' }, [input, detect]), 'A city name is enough; "Yangzhou" and "Yangzhou City" both work.'),
    feedback,
  ]);
}

function voiceCard() {
  const g = state.globals;
  // 运行时目录优先：宿主注册了 Edge / DeepSeek 就都列出来；拉不到回落构建期的内置清单
  const voices = state.voiceOptions && state.voiceOptions.length > 0
    ? state.voiceOptions
    : VOICES.map((voice) => ({ id: voice.id, name: voice.name, tag: voice.tag, provider: voice.provider }));
  const speechProviders = state.speechProviders || [];
  return card('Voice', 'Four independent switches, one per voice type; the voice, speech recognition provider, and volume are shared.', [
    toggleRow('g-voice', 'Manual playback', 'Speak whispers and chat replies triggered from the context menu and slash commands.', g.voiceEnabled, (value) => setGlobal('voiceEnabled', value)),
    selectField('g-voice-name', 'Voice', g.voiceName, voices.map((voice) => ({ value: voice.id, label: voice.name + (voice.tag ? ' · ' + voice.tag : ''), group: voice.provider })), (value) => setGlobal('voiceName', value)),
    numberField('g-voice-volume', 'Volume (0–1)', g.voiceVolume, (value) => setGlobal('voiceVolume', clampNumber(value, 0, 1, 1)), { min: 0, max: 1, step: 0.05 }),
    toggleRow('g-voice-whisper', 'Speak scheduled whispers', 'Speak the whisper generated on the timer.', g.voiceWhisperEnabled, (value) => setGlobal('voiceWhisperEnabled', value)),
    toggleRow('g-voice-todo', 'Speak todo reminders', 'Speak todo reminders when they are due.', g.voiceTodoEnabled, (value) => setGlobal('voiceTodoEnabled', value)),
    toggleRow('g-voice-notify', 'Speak notifications', 'Speak the configured work-status line when a task completes, fails, or waits for your confirmation; it plays even when the page is hidden.', g.voiceNotifyEnabled, (value) => setGlobal('voiceNotifyEnabled', value)),
    selectField('g-speech-provider', 'Speech recognition', g.speechProvider, speechProviders.map((item) => ({ value: item.id, label: item.name })), (value) => setGlobal('speechProvider', value), 'Which implementation transcribes a press-and-hold recording. More options appear only when the matching plugin is installed; if the selected one is unavailable, recognition reports a clear error instead of switching automatically.'),
  ]);
}

function fontCard() {
  const g = state.globals;
  return card('Appearance and font', 'Font shared by bubbles, tooltips, and the chat window.', [
    selectField('g-font-family', 'Font', g.font.family, FONT_IDS.map((id) => ({ value: id, label: id })), (value) => { g.font = Object.assign({}, g.font, { family: value }); }),
    numberField('g-font-size', 'Font size (px)', g.font.size, (value) => { g.font = Object.assign({}, g.font, { size: clampNumber(value, 4, 200, 21) }); }, { min: 4, max: 200, step: 1, hint: 'Affects bubbles and tooltips only; the chat window font size stays the same.' }),
    toggleRow('g-font-follow', 'Scale font with pet size', 'When off, the font stays at the size above and does not scale with window size.', g.font.followPet, (value) => { g.font = Object.assign({}, g.font, { followPet: value }); }),
  ]);
}

function physicsCard() {
  const g = state.globals;
  return card('Drag and throw feel', 'Shared by all pets; value changes apply after you save.', [
    make('div', { class: 'grid2' }, [
      numberField('g-gravity', 'Gravity (px/s²)', g.physics.gravity, (value) => { g.physics = Object.assign({}, g.physics, { gravity: clampNumber(value, 0, 10000, 1400) }); }, { min: 0, max: 10000, step: 10 }),
      numberField('g-restitution', 'Wall bounce (0–1)', g.physics.restitution, (value) => { g.physics = Object.assign({}, g.physics, { restitution: clampNumber(value, 0, 1, 0.78) }); }, { min: 0, max: 1, step: 0.01 }),
    ]),
    make('div', { class: 'grid2' }, [
      numberField('g-friction', 'Ground friction (/s)', g.physics.groundFriction, (value) => { g.physics = Object.assign({}, g.physics, { groundFriction: clampNumber(value, 0, 30, 2.5) }); }, { min: 0, max: 30, step: 0.1 }),
      numberField('g-power', 'Throw power', g.physics.throwPower, (value) => { g.physics = Object.assign({}, g.physics, { throwPower: clampNumber(value, 0.1, 5, 1) }); }, { min: 0.1, max: 5, step: 0.1 }),
    ]),
    toggleRow('g-ceiling', 'Ceiling bounce', 'When off, there is no upper boundary and a throw can fly off the top of the screen.', g.physics.ceilingBounce !== false, (value) => { g.physics = Object.assign({}, g.physics, { ceilingBounce: value }); }),
    toggleRow('g-collide', 'Pet collisions', 'Pets in flight bounce off each other with momentum.', g.physics.petCollision !== false, (value) => { g.physics = Object.assign({}, g.physics, { petCollision: value }); }),
    toggleRow('g-spring', 'Spring follow', 'On (default) = a spring chases the pointer while dragging, with slight lag and a soft feel; off = rigid real-time follow, the pet sticks to the mouse. Does not affect throw power.', g.physics.dragSpring !== false, (value) => { g.physics = Object.assign({}, g.physics, { dragSpring: value }); }),
  ]);
}

function motionCard() {
  const g = state.globals;
  const weights = g.animationWeights;
  const actionId = 'g-motion-action';
  const actionValue = () => String(Math.max(0, 100 - weights.idle - weights.turn - weights.move));
  const syncAction = () => {
    const node = byId(actionId);
    if (node) node.value = actionValue();
  };
  const weightField = (key, label) =>
    numberField('g-motion-' + key, label, weights[key], (value) => {
      const others = weights.idle + weights.turn + weights.move - weights[key];
      const max = Math.max(0, 100 - others);
      weights[key] = Math.round(Math.min(Math.max(value, 0), max));
      syncAction();
    }, { min: 0, max: 100, step: 1 });
  return card('Animation frequency', 'Four boxes: idle / turn / move are editable, random action is computed automatically (= 100 − the other three). Shared by all pets; a pet pack can override it in its own species file.', [
    make('div', { class: 'grid2' }, [
      weightField('idle', 'Idle (%)'),
      weightField('turn', 'Turn (%)'),
      weightField('move', 'Move (%)'),
      numberField(actionId, 'Random action (%, auto)', actionValue(), () => {}, { min: 0, max: 100, step: 1, readOnly: true }),
    ]),
  ]);
}

function modelCard() {
  const g = state.globals;
  return card('Chat context', 'The model and connection are configured in the "Model connection" card above; this controls how much context a chat keeps.', [
    make('div', { class: 'grid2' }, [
      numberField('g-memory', 'Chat memory rounds', g.chatMemoryRounds, (value) => setGlobal('chatMemoryRounds', Math.round(clampNumber(value, 0, 100, 0))), { min: 0, max: 100, step: 1, hint: '0 means no history.' }),
      numberField('g-image-limit', 'Image limit', g.chatImageLimit, (value) => setGlobal('chatImageLimit', Math.round(clampNumber(value, 0, 50, 0))), { min: 0, max: 50, step: 1, hint: '0 means no limit.' }),
    ]),
  ]);
}

function memoryCard() {
  const g = state.globals;
  const memoryProviders = state.memoryProviders || [];
  const isPowerContext = g.memory.provider === POWERCONTEXT_ID;
  // PowerContext 的参数只属于它：选中别家时整块隐藏。用 hidden 切换而不是整卡重渲染——
  // 重渲染会把正在输入的光标位置丢掉。
  const details = make('div', { class: 'grid2', hidden: !isPowerContext }, [
    textField('g-pc-endpoint', 'PowerContext endpoint', g.memory.powercontext.endpoint, (value) => {
      g.memory.powercontext = Object.assign({}, g.memory.powercontext, { endpoint: value });
    }, { hint: 'Root URL of the local PowerContext service, e.g. http://127.0.0.1:8000.' }),
    textField('g-pc-token', 'Access token', g.memory.powercontext.token, (value) => {
      g.memory.powercontext = Object.assign({}, g.memory.powercontext, { token: value });
    }, { secret: true, hint: 'Leave empty when the server has no authentication. The token is stored only in the local config and is never written to logs.' }),
  ]);
  const optimize = make('div', { hidden: !isPowerContext }, [
    toggleRow('g-pc-optimize', 'Query optimization', 'When on, the model rewrites the sentence into a search query and adds the last two rounds to resolve references. Off by default: references usually point at what was just said, and those rounds are already in the chat history.', g.memory.powercontext.optimizeQuery, (value) => {
      g.memory.powercontext = Object.assign({}, g.memory.powercontext, { optimizeQuery: value });
    }),
  ]);
  return card('Long-term memory', 'Which memory implementation chats use; the endpoint, token, and switch below belong to PowerContext only.', [
    selectField('g-memory-provider', 'Memory implementation', g.memory.provider, memoryProviders.map((item) => ({ value: item.id, label: item.name })), (value) => {
      g.memory.provider = value;
      const show = value === POWERCONTEXT_ID;
      details.hidden = !show;
      optimize.hidden = !show;
    }, 'Which memory implementation chats use. The built-in one carries only the last few rounds of history; more options appear when a third-party memory plugin is installed, and the page falls back to the built-in one when it cannot find the configured implementation.'),
    details,
    optimize,
  ]);
}

function pathRows() {
  const meta = state.meta || {};
  const rows = [];
  const pairs = [['User config', meta.user], ['Built-in defaults', meta.default], ['Animation config', meta.animations], ['Memes', meta.memes], ['Todo data', meta.todos], ['Logs', meta.logs]];
  for (const pair of pairs) {
    if (!pair[1]) continue;
    rows.push(make('div', { class: 'pathRow' }, [
      make('span', { class: 'pathKey', text: pair[0] }),
      make('span', { class: 'pathValue', text: String(pair[1]), title: String(pair[1]) }),
    ]));
  }
  if (Array.isArray(meta.storage)) {
    for (const item of meta.storage) {
      if (!item || !item.path) continue;
      rows.push(make('div', { class: 'pathRow' }, [
        make('span', { class: 'pathKey', text: item.exists === false ? 'Not created' : 'Exists' }),
        make('span', { class: 'pathValue', text: String(item.path), title: String(item.path) }),
      ]));
    }
  }
  return rows.length ? rows : [make('p', { class: 'empty', text: 'Storage locations are not available.' })];
}

function advancedCard() {
  return card('Advanced', 'Find file locations here when editing the config by hand; "Sync" overwrites the user config with the built-in defaults.', [
    make('div', {}, pathRows()),
    make('div', { class: 'testRow' }, [button('Overwrite user config with built-in defaults', syncFromDefault)]),
  ]);
}

async function syncFromDefault() {
  const confirmed = await confirmDialog({
    title: 'Overwrite user config with built-in defaults',
    text: 'The current user config is replaced entirely. This cannot be undone.',
    confirmLabel: 'Overwrite',
    danger: true,
  });
  if (!confirmed) return;
  const status = byId('pet-status');
  setStatus(status, 'Syncing…');
  try {
    const merged = await callApi('POST', '/config');
    initDrafts(merged);
    markDirty(false);
    renderPetsPanel();
    setStatus(status, 'User config overwritten with built-in defaults.', 'ok');
  } catch (error) {
    setStatus(status, error && error.message ? error.message : String(error), 'error');
  }
}
`;
}
