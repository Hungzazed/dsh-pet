/**
 * 模型字段的可手填下拉：输入框持有值，右侧箭头拉取候选并弹出菜单。
 *
 * 拉到的列表只留在内存，地址或协议一改就作废，避免拿 A 家的模型去配 B 家。
 * @module dsh-pet/src/standalone/settings-page/script/model-picker
 */

/** 生成模型选择片段。 */
export function modelPickerScript(): string {
  return `
const AI_MODELS_URL = '/standalone-ai/models';

/** 上一次拉到的候选；null 表示还没拉过，需要先请求。 */
let modelOptions = null;

function modelLabel(model) {
  return model.name && model.name !== model.id ? model.name + ' (' + model.id + ')' : model.id;
}

function openModelMenu(trigger) {
  if (!modelOptions) return;
  openSelectMenu(
    trigger,
    modelOptions,
    byId('model').value.trim(),
    (picked) => {
      byId('model').value = picked;
      markDirty(true);
      setStatus(byId('model-result'), 'Model name filled in; save to apply.', 'ok');
    },
    byId('model-combo'),
    // 上百个模型时手翻不现实：顶部给一个过滤框，输入即筛。
    'Search model ID or name',
  );
}

function forgetModelOptions() {
  modelOptions = null;
  setStatus(byId('model-result'), '');
}

async function fetchModelOptions(trigger) {
  const result = byId('model-result');
  trigger.disabled = true;
  setStatus(result, 'Requesting the model list from the endpoint…');
  try {
    const response = await fetch(AI_MODELS_URL, {
      method: 'POST',
      credentials: 'same-origin',
      cache: 'no-store',
      headers: { 'X-DSH-Pet-Token': TOKEN, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        protocol: protocolSelect ? protocolSelect.getValue() : 'openai-compatible',
        baseUrl: byId('baseUrl').value.trim(),
        apiKey: byId('apiKey').value,
      }),
    });
    if (response.status === 403) throw new Error('The page credential has expired. Reopen settings from the pet menu.');
    const data = await response.json().catch(() => null);
    if (!data) throw new Error('The local endpoint returned nothing. Try again.');
    if (!data.ok) throw new Error(data.message || 'Fetch failed');
    const models = data.models || [];
    if (!models.length) {
      setStatus(result, 'The endpoint returned no models. Enter one by hand.', 'error');
      return;
    }
    modelOptions = models.map((model) => ({ value: model.id, label: modelLabel(model) }));
    setStatus(result, 'Fetched ' + models.length + ' models. Pick one to fill the model field.', 'ok');
    openModelMenu(trigger);
  } catch (error) {
    setStatus(result, error && error.message ? error.message : String(error), 'error');
  } finally {
    trigger.disabled = false;
  }
}

function wireModelPicker() {
  const toggle = byId('model-toggle');
  if (!toggle) return;
  toggle.append(chevron());
  toggle.addEventListener('click', () => {
    if (modelOptions) openModelMenu(toggle);
    else void fetchModelOptions(toggle);
  });
  byId('baseUrl').addEventListener('input', forgetModelOptions);
}
`;
}
