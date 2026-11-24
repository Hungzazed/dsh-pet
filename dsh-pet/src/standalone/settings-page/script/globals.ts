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
  return [languageCard, globalFlagsCard, voiceCard, fontCard, physicsCard, motionCard, modelCard, memoryCard, environmentCard, advancedCard];
}

function setGlobal(key, value) {
  state.globals[key] = value;
}

function languageCard() {
  const g = state.globals;
  return card(tr('lang.title'), tr('lang.hint'), [
    selectField('g-language', tr('lang.label'), g.language || 'vi', [
      { value: 'vi', label: 'Tiếng Việt' },
      { value: 'en', label: 'English' },
      { value: 'zh', label: '中文 (Chinese)' },
      { value: 'auto', label: tr('lang.optAuto') },
    ], (value) => {
      setGlobal('language', value);
      if (DEFAULT_VOICE_SET.has(g.voiceName)) {
        const nextLang = resolveUiLang(value);
        g.voiceName = DEFAULT_VOICE_BY_LANG[nextLang] || DEFAULT_VOICE_ID;
        renderPetsPanel();
      }
    }),
  ]);
}

function globalFlagsCard() {
  const g = state.globals;
  return card(tr('flags.title'), tr('flags.hint'), [
    toggleRow('g-notify', tr('flags.notify'), tr('flags.notifyHint'), g.notificationsEnabled, (value) => setGlobal('notificationsEnabled', value)),
    toggleRow('g-notify-focused', tr('flags.notifyFocused'), tr('flags.notifyFocusedHint'), g.notifyWhenFocused, (value) => setGlobal('notifyWhenFocused', value)),
    toggleRow('g-click', tr('flags.clickSound'), tr('flags.clickSoundHint'), g.clickSoundEnabled, (value) => setGlobal('clickSoundEnabled', value)),
    toggleRow('g-whisper-image', tr('flags.whisperImg'), tr('flags.whisperImgHint'), g.whisperImageEnabled, (value) => setGlobal('whisperImageEnabled', value)),
    toggleRow('g-chat-image', tr('flags.chatImg'), tr('flags.chatImgHint'), g.chatImageEnabled, (value) => setGlobal('chatImageEnabled', value)),
    toggleRow('g-chat-anim', tr('flags.chatAnim'), tr('flags.chatAnimHint'), g.chatAnimationEnabled, (value) => setGlobal('chatAnimationEnabled', value)),
    toggleRow('g-confine', tr('flags.confine'), tr('flags.confineHint'), g.confineToScreen, (value) => setGlobal('confineToScreen', value)),
    toggleRow('g-tray', tr('flags.tray'), tr('flags.trayHint'), g.trayEnabled, (value) => setGlobal('trayEnabled', value)),
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
  input.placeholder = tr('env.cityPlaceholder');
  input.addEventListener('input', () => {
    setGlobal('environmentCity', input.value);
    markDirty(true);
    feedback.hidden = true;
  });
  const detect = button(tr('btn.detect'), () => {
    detect.textContent = tr('btn.detecting');
    detect.disabled = true;
    callApi('POST', '/environment?fresh=1&ip=1')
      .then((facts) => {
        if (!facts || typeof facts.city !== 'string' || !facts.city) {
          show(tr('env.detectEmpty'));
          return;
        }
        input.value = facts.city;
        setGlobal('environmentCity', facts.city);
        markDirty(true);
        show(tr('env.detectFilled', { city: facts.city }));
      })
      .catch((error) => show(tr('env.detectFail', { message: error && error.message ? error.message : String(error) })))
      .finally(() => {
        detect.textContent = tr('btn.detect');
        detect.disabled = false;
      });
  });
  return card(tr('env.title'), tr('env.hint'), [
    fieldRow('g-env-city', tr('env.city'), make('div', { class: 'row' }, [input, detect]), tr('env.cityHint')),
    feedback,
  ]);
}

function voiceCard() {
  const g = state.globals;
  const voices = state.voiceOptions && state.voiceOptions.length > 0
    ? state.voiceOptions
    : VOICES.map((voice) => ({ id: voice.id, name: voice.name, tag: voice.tag, provider: voice.provider }));
  const speechProviders = state.speechProviders || [];
  return card(tr('voice.title'), tr('voice.hint'), [
    toggleRow('g-voice', tr('voice.enabled'), tr('voice.enabledHint'), g.voiceEnabled, (value) => setGlobal('voiceEnabled', value)),
    selectField('g-voice-name', tr('voice.name'), g.voiceName, voices.map((voice) => ({ value: voice.id, label: voice.name + (voice.tag ? ' · ' + voice.tag : ''), group: voice.provider })), (value) => setGlobal('voiceName', value)),
    numberField('g-voice-volume', tr('voice.volume'), g.voiceVolume, (value) => setGlobal('voiceVolume', clampNumber(value, 0, 1, 1)), { min: 0, max: 1, step: 0.05 }),
    toggleRow('g-voice-whisper', tr('voice.whisper'), tr('voice.whisperHint'), g.voiceWhisperEnabled, (value) => setGlobal('voiceWhisperEnabled', value)),
    toggleRow('g-voice-todo', tr('voice.todo'), tr('voice.todoHint'), g.voiceTodoEnabled, (value) => setGlobal('voiceTodoEnabled', value)),
    toggleRow('g-voice-notify', tr('voice.notify'), tr('voice.notifyHint'), g.voiceNotifyEnabled, (value) => setGlobal('voiceNotifyEnabled', value)),
    selectField('g-speech-provider', tr('voice.speech'), g.speechProvider, speechProviders.map((item) => ({ value: item.id, label: item.name })), (value) => setGlobal('speechProvider', value), tr('voice.speechHint')),
  ]);
}

function fontCard() {
  const g = state.globals;
  return card(tr('font.title'), tr('font.hint'), [
    selectField('g-font-family', tr('font.family'), g.font.family, FONT_IDS.map((id) => ({ value: id, label: id })), (value) => { g.font = Object.assign({}, g.font, { family: value }); }),
    numberField('g-font-size', tr('font.size'), g.font.size, (value) => { g.font = Object.assign({}, g.font, { size: clampNumber(value, 4, 200, 21) }); }, { min: 4, max: 200, step: 1, hint: tr('font.sizeHint') }),
    toggleRow('g-font-follow', tr('font.follow'), tr('font.followHint'), g.font.followPet, (value) => { g.font = Object.assign({}, g.font, { followPet: value }); }),
  ]);
}

function physicsCard() {
  const g = state.globals;
  return card(tr('phys.title'), tr('phys.hint'), [
    make('div', { class: 'grid2' }, [
      numberField('g-gravity', tr('phys.gravity'), g.physics.gravity, (value) => { g.physics = Object.assign({}, g.physics, { gravity: clampNumber(value, 0, 10000, 1400) }); }, { min: 0, max: 10000, step: 10 }),
      numberField('g-restitution', tr('phys.restitution'), g.physics.restitution, (value) => { g.physics = Object.assign({}, g.physics, { restitution: clampNumber(value, 0, 1, 0.78) }); }, { min: 0, max: 1, step: 0.01 }),
    ]),
    make('div', { class: 'grid2' }, [
      numberField('g-friction', tr('phys.friction'), g.physics.groundFriction, (value) => { g.physics = Object.assign({}, g.physics, { groundFriction: clampNumber(value, 0, 30, 2.5) }); }, { min: 0, max: 30, step: 0.1 }),
      numberField('g-power', tr('phys.power'), g.physics.throwPower, (value) => { g.physics = Object.assign({}, g.physics, { throwPower: clampNumber(value, 0.1, 5, 1) }); }, { min: 0.1, max: 5, step: 0.1 }),
    ]),
    toggleRow('g-ceiling', tr('phys.ceiling'), tr('phys.ceilingHint'), g.physics.ceilingBounce !== false, (value) => { g.physics = Object.assign({}, g.physics, { ceilingBounce: value }); }),
    toggleRow('g-collide', tr('phys.collide'), tr('phys.collideHint'), g.physics.petCollision !== false, (value) => { g.physics = Object.assign({}, g.physics, { petCollision: value }); }),
    toggleRow('g-spring', tr('phys.spring'), tr('phys.springHint'), g.physics.dragSpring !== false, (value) => { g.physics = Object.assign({}, g.physics, { dragSpring: value }); }),
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
  return card(tr('motion.title'), tr('motion.hint'), [
    make('div', { class: 'grid2' }, [
      weightField('idle', tr('motion.idle')),
      weightField('turn', tr('motion.turn')),
      weightField('move', tr('motion.move')),
      numberField(actionId, tr('motion.action'), actionValue(), () => {}, { min: 0, max: 100, step: 1, readOnly: true }),
    ]),
  ]);
}

function modelCard() {
  const g = state.globals;
  return card(tr('ctx.title'), tr('ctx.hint'), [
    make('div', { class: 'grid2' }, [
      numberField('g-memory', tr('ctx.memoryRounds'), g.chatMemoryRounds, (value) => setGlobal('chatMemoryRounds', Math.round(clampNumber(value, 0, 100, 0))), { min: 0, max: 100, step: 1, hint: tr('ctx.memoryRoundsHint') }),
      numberField('g-image-limit', tr('ctx.imageLimit'), g.chatImageLimit, (value) => setGlobal('chatImageLimit', Math.round(clampNumber(value, 0, 50, 0))), { min: 0, max: 50, step: 1, hint: tr('ctx.imageLimitHint') }),
    ]),
  ]);
}

function memoryCard() {
  const g = state.globals;
  const memoryProviders = state.memoryProviders || [];
  const isPowerContext = g.memory.provider === POWERCONTEXT_ID;
  const details = make('div', { class: 'grid2', hidden: !isPowerContext }, [
    textField('g-pc-endpoint', tr('mem.pcEndpoint'), g.memory.powercontext.endpoint, (value) => {
      g.memory.powercontext = Object.assign({}, g.memory.powercontext, { endpoint: value });
    }, { hint: tr('mem.pcEndpointHint') }),
    textField('g-pc-token', tr('mem.pcToken'), g.memory.powercontext.token, (value) => {
      g.memory.powercontext = Object.assign({}, g.memory.powercontext, { token: value });
    }, { secret: true, hint: tr('mem.pcTokenHint') }),
  ]);
  const optimize = make('div', { hidden: !isPowerContext }, [
    toggleRow('g-pc-optimize', tr('mem.pcOptimize'), tr('mem.pcOptimizeHint'), g.memory.powercontext.optimizeQuery, (value) => {
      g.memory.powercontext = Object.assign({}, g.memory.powercontext, { optimizeQuery: value });
    }),
  ]);
  return card(tr('mem.title'), tr('mem.hint'), [
    selectField('g-memory-provider', tr('mem.provider'), g.memory.provider, memoryProviders.map((item) => ({ value: item.id, label: item.name })), (value) => {
      g.memory.provider = value;
      const show = value === POWERCONTEXT_ID;
      details.hidden = !show;
      optimize.hidden = !show;
    }, tr('mem.providerHint')),
    details,
    optimize,
  ]);
}

function pathRows() {
  const meta = state.meta || {};
  const rows = [];
  const pairs = [
    [tr('adv.pathUser'), meta.user],
    [tr('adv.pathDefault'), meta.default],
    [tr('adv.pathAnim'), meta.animations],
    [tr('adv.pathMemes'), meta.memes],
    [tr('adv.pathTodos'), meta.todos],
    [tr('adv.pathLogs'), meta.logs],
  ];
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
        make('span', { class: 'pathKey', text: item.exists === false ? tr('adv.storageMissing') : tr('adv.storageExists') }),
        make('span', { class: 'pathValue', text: String(item.path), title: String(item.path) }),
      ]));
    }
  }
  return rows.length ? rows : [make('p', { class: 'empty', text: tr('adv.pathsEmpty') })];
}

function advancedCard() {
  return card(tr('adv.title'), tr('adv.hint'), [
    make('div', {}, pathRows()),
    make('div', { class: 'testRow' }, [button(tr('btn.syncDefault'), syncFromDefault)]),
  ]);
}

async function syncFromDefault() {
  const confirmed = await confirmDialog({
    title: tr('adv.syncTitle'),
    text: tr('adv.syncText'),
    confirmLabel: tr('btn.overwrite'),
    danger: true,
  });
  if (!confirmed) return;
  const status = byId('pet-status');
  setStatus(status, tr('status.syncing'));
  try {
    const merged = await callApi('POST', '/config');
    initDrafts(merged);
    markDirty(false);
    renderPetsPanel();
    setStatus(status, tr('status.synced'), 'ok');
  } catch (error) {
    setStatus(status, error && error.message ? error.message : String(error), 'error');
  }
}
`;
}
