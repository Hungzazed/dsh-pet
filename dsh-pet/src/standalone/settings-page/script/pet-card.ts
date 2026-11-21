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
  picker.root.firstElementChild.setAttribute('aria-label', 'Select pet');
  return make('div', { class: 'petBar' }, [
    picker.root,
    button('Add', addPet),
    button('Delete', removePet, { danger: true }),
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
    name: 'New pet',
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
      title: 'Cannot delete the last pet',
      text:
        state.entry === 'main'
          ? 'The Default entry needs at least one pet: the host rejects a list of 0 as invalid, and reopening the page falls back to the built-in default list.'
          : 'Every entry needs at least one pet: the host rejects a list of 0 as invalid.',
      confirmLabel: 'OK',
      cancelLabel: null,
    });
    return;
  }
  const confirmed = await confirmDialog({
    title: 'Delete pet',
    text: 'Delete "' + (pet.name || pet.id) + '"? The change is written to disk only after you save.',
    confirmLabel: 'Delete',
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
    return card('Pet', null, [
      make('p', { class: 'empty', text: 'This entry has no pets yet. Click "Add" to create one.' }),
      make('div', { class: 'testRow' }, [button('Add', addPet)]),
    ]);
  }
  if (!pet.position) pet.position = { corner: 'bottom-right', marginX: 40, marginY: 40 };
  const sizePercent = typeof pet.sizePercent === 'number' ? String(pet.sizePercent) : '';
  const children = [
    petBar(),
    avatarRow(pet),
    textField('pet-name', 'Display name', pet.name || '', (value) => { pet.name = value; }),
    textField('pet-id', 'ID', pet.id, (value) => { pet.id = value.trim(); }, { disabled: true, hint: 'The ID determines the asset directory and memory files and cannot be changed here once the pet is created.' }),
    make('div', { class: 'grid2' }, [
      numberField('pet-size', 'Frame size (px)', pet.size, (value) => { pet.size = value; }, { min: 1, step: 1 }),
      textField('pet-size-percent', 'Screen width (%)', sizePercent, (value) => {
        if (value.trim() === '') delete pet.sizePercent;
        else pet.sizePercent = Number(value);
      }, { hint: 'Leave empty to size in px.' }),
    ]),
    selectField('pet-display', 'Display', pet.display, DISPLAYS.map((value) => ({ value: value, label: displayLabel(value) })), (value) => { pet.display = value; }, 'web = browser only / desktop = desktop only / both = show in both / none = hide in both'),
    make('div', { class: 'grid2' }, [
      selectField('pet-corner', 'Corner', pet.position.corner, CORNERS.map((value) => ({ value: value, label: cornerLabel(value) })), (value) => { pet.position.corner = value; }),
      numberField('pet-margin-x', 'Horizontal margin (px)', pet.position.marginX, (value) => { pet.position.marginX = value; }, { step: 1 }),
    ]),
    numberField('pet-margin-y', 'Vertical margin (px)', pet.position.marginY, (value) => { pet.position.marginY = value; }, { step: 1 }),
    toggleRow('pet-balance', 'Balance reactions', 'When on, this pet plays an animation and shows a bubble when the balance changes.', pet.balanceEnabled !== false, (value) => { pet.balanceEnabled = value; }),
    toggleRow('pet-whisper', 'Whispers', 'Periodically ask the model for one line and play it; turn it off to save API quota.', pet.whisperEnabled !== false, (value) => { pet.whisperEnabled = value; }),
    toggleRow('pet-work', 'Work status reactions', 'Switch animations and bubbles with the session state; no model calls.', pet.workStatusEnabled !== false, (value) => { pet.workStatusEnabled = value; }),
    toggleRow('pet-fixed', 'Stay still', 'When on, the random chain no longer picks turn and move; manual playback and dragging still work.', pet.fixedEnabled === true, (value) => { pet.fixedEnabled = value; }),
    make('div', { class: 'field' }, [
      make('label', { for: 'pet-persona', text: 'Persona for this pet (optional)' }),
      personaWrap(pet),
      make('p', { class: 'fieldHint', text: personaHint() }),
      make('p', { class: 'fieldHint', text: 'The system prompt sent to the model = this text + the name and time context appended automatically; do not repeat those here.' }),
    ]),
  ];
  return card('Pet', 'Editing the pets of ' + (state.entry === 'main' ? 'the Default entry' : 'entry ' + state.entry) + '; changes are written to disk after you save.', children);
}

/** 条目人设提示：占位符里放的就是条目人设正文，这里只说规则。 */
function personaHint() {
  if (state.prompts[state.entry]) return 'Leave empty to follow the entry persona; the gray placeholder text in the box is that content.';
  return 'This entry has no persona yet; leaving the box empty means this pet has no system prompt.';
}

/** 人设输入框连同右下角的字数统计；占位符用条目人设全文。 */
function personaWrap(pet) {
  const wrap = make('div', { class: 'personaWrap' });
  const area = make('textarea', { id: 'pet-persona' });
  area.value = typeof pet.whisperPrompt === 'string' ? pet.whisperPrompt : '';
  area.maxLength = 4000;
  area.rows = 4;
  const entryPrompt = state.prompts[state.entry] || '';
  area.placeholder = entryPrompt || 'Leave empty for no system prompt';
  const count = make('span', { class: 'personaCount', text: area.value.length + ' chars' });
  area.addEventListener('input', () => {
    const text = area.value.trim();
    if (text) pet.whisperPrompt = area.value;
    else delete pet.whisperPrompt;
    count.textContent = area.value.length + ' chars';
    markDirty(true);
  });
  wrap.append(area, count);
  return wrap;
}
`;
}
