/**
 * 单只宠物的卡片：选择器、增删与这只宠物的字段编辑（含头像行与人设）。
 *
 * 只改 state.pets 里的草稿，不直接写盘——保存与草稿装配见 ./pets。
 * @module dsh-pet/src/standalone/settings-page/script/pet-card
 */

/** 生成宠物卡片片段。 */
export function petCardScript(): string {
  return `
function petBar() {
  const list = currentPets();
  const options = list.map((pet, index) => ({ value: String(index), label: (pet.name || pet.id) + ' (' + pet.id + ')' }));
  const picker = createSelect(options, String(state.petIndex), (value) => {
    state.petIndex = Number(value);
    renderPetsPanel();
  });
  picker.root.id = 'pet-picker';
  picker.root.firstElementChild.setAttribute('aria-label', tr('pet.pickerAria'));
  return make('div', { class: 'petBar' }, [
    picker.root,
    button(tr('btn.add'), addPet),
    button(tr('btn.delete'), removePet, { danger: true }),
  ]);
}

function addPet() {
  const list = currentPets();
  let index = list.length + 1;
  let id = (state.entry === 'main' ? 'pet-' : '') + index;
  while (list.some((pet) => pet.id === id)) {
    index += 1;
    id = (state.entry === 'main' ? 'pet-' : '') + index;
  }
  list.push({
    id: id,
    name: tr('pet.newName'),
    size: 462,
    display: 'none',
    balanceEnabled: true,
    whisperEnabled: true,
    workStatusEnabled: true,
    fixedEnabled: false,
    position: { corner: 'bottom-right', marginX: 40, marginY: 40 },
  });
  state.petIndex = list.length - 1;
  markDirty(true);
  renderPetsPanel();
}

async function removePet() {
  const list = currentPets();
  const pet = list[state.petIndex];
  if (!pet) return;
  if (list.length <= 1) {
    await confirmDialog({
      title: tr('pet.cannotDelTitle'),
      text: state.entry === 'main' ? tr('pet.cannotDelMain') : tr('pet.cannotDelPack'),
      confirmLabel: tr('btn.gotIt'),
      cancelLabel: null,
    });
    return;
  }
  const confirmed = await confirmDialog({
    title: tr('pet.delTitle'),
    text: tr('pet.delText', { name: pet.name || pet.id }),
    confirmLabel: tr('btn.delete'),
    danger: true,
  });
  if (!confirmed) return;
  list.splice(state.petIndex, 1);
  state.petIndex = Math.max(0, Math.min(state.petIndex, list.length - 1));
  markDirty(true);
  renderPetsPanel();
}

function petCard() {
  const list = currentPets();
  const pet = list[state.petIndex];
  if (!pet) {
    return card(tr('pet.cardTitle'), null, [
      make('p', { class: 'empty', text: tr('pet.empty') }),
      make('div', { class: 'testRow' }, [button(tr('btn.add'), addPet)]),
    ]);
  }
  if (!pet.position) pet.position = { corner: 'bottom-right', marginX: 40, marginY: 40 };
  const sizePercent = typeof pet.sizePercent === 'number' ? String(pet.sizePercent) : '';
  const children = [
    petBar(),
    avatarRow(pet),
    textField('pet-name', tr('pet.name'), pet.name || '', (value) => { pet.name = value; }),
    textField('pet-id', tr('pet.id'), pet.id, (value) => { pet.id = value.trim(); }, { disabled: true, hint: tr('pet.idHint') }),
    make('div', { class: 'grid2' }, [
      numberField('pet-size', tr('pet.size'), pet.size, (value) => { pet.size = value; }, { min: 1, step: 1 }),
      textField('pet-size-percent', tr('pet.sizePercent'), sizePercent, (value) => {
        if (value.trim() === '') delete pet.sizePercent;
        else pet.sizePercent = Number(value);
      }, { hint: tr('pet.sizePercentHint') }),
    ]),
    selectField('pet-display', tr('pet.display'), pet.display, DISPLAYS.map((value) => ({ value: value, label: displayLabel(value) })), (value) => { pet.display = value; }, tr('pet.displayHint')),
    make('div', { class: 'grid2' }, [
      selectField('pet-corner', tr('pet.corner'), pet.position.corner, CORNERS.map((value) => ({ value: value, label: cornerLabel(value) })), (value) => { pet.position.corner = value; }),
      numberField('pet-margin-x', tr('pet.marginX'), pet.position.marginX, (value) => { pet.position.marginX = value; }, { step: 1 }),
    ]),
    numberField('pet-margin-y', tr('pet.marginY'), pet.position.marginY, (value) => { pet.position.marginY = value; }, { step: 1 }),
    toggleRow('pet-balance', tr('pet.balance'), tr('pet.balanceHint'), pet.balanceEnabled !== false, (value) => { pet.balanceEnabled = value; }),
    toggleRow('pet-whisper', tr('pet.whisper'), tr('pet.whisperHint'), pet.whisperEnabled !== false, (value) => { pet.whisperEnabled = value; }),
    toggleRow('pet-work', tr('pet.work'), tr('pet.workHint'), pet.workStatusEnabled !== false, (value) => { pet.workStatusEnabled = value; }),
    toggleRow('pet-fixed', tr('pet.fixed'), tr('pet.fixedHint'), pet.fixedEnabled === true, (value) => { pet.fixedEnabled = value; }),
    make('div', { class: 'field' }, [
      make('label', { for: 'pet-persona', text: tr('pet.persona') }),
      personaWrap(pet),
      make('p', { class: 'fieldHint', text: personaHint() }),
      make('p', { class: 'fieldHint', text: tr('pet.personaRule') }),
    ]),
  ];
  return card(tr('pet.cardTitle'), tr('pet.cardHint', { entry: state.entry === 'main' ? tr('entry.main') : state.entry }), children);
}

/** 条目人设提示：占位符里放的就是条目人设正文，这里只说规则。 */
function personaHint() {
  if (state.prompts[state.entry]) return tr('pet.personaHintHasEntry');
  return tr('pet.personaHintNoEntry');
}

/** 人设输入框连同右下角的字数统计；占位符用条目人设全文。 */
function personaWrap(pet) {
  const wrap = make('div', { class: 'personaWrap' });
  const area = make('textarea', { id: 'pet-persona' });
  area.value = typeof pet.whisperPrompt === 'string' ? pet.whisperPrompt : '';
  area.maxLength = 4000;
  area.rows = 4;
  const entryPrompt = state.prompts[state.entry] || '';
  area.placeholder = entryPrompt || tr('pet.personaPlaceholderEmpty');
  const count = make('span', { class: 'personaCount', text: tr('pet.personaCount', { count: area.value.length }) });
  area.addEventListener('input', () => {
    const text = area.value.trim();
    if (text) pet.whisperPrompt = area.value;
    else delete pet.whisperPrompt;
    count.textContent = tr('pet.personaCount', { count: area.value.length });
    markDirty(true);
  });
  wrap.append(area, count);
  return wrap;
}
`;
}
