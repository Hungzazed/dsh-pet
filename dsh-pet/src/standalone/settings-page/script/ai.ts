/**
 * 「AI 服务商」面板：独立模式自己的模型接入配置。
 *
 * 服务商下拉决定对话与余额走哪家；选内置服务时协议、地址、模型按该家的 profile 回填，
 * 密钥与 profile 都按服务商分开保存，换服务不会覆盖别家。密钥只写不回显，请求一律带本次运行的访问令牌。
 * @module dsh-pet/src/standalone/settings-page/script/ai
 */

/** 生成 AI 面板片段。 */
export function aiScript(): string {
  return `
const AI_SETTINGS_URL = '/standalone-ai/settings';
const AI_TEST_URL = '/standalone-ai/test';
const AI_BALANCE_URL = '/standalone-ai/balance';

/** 自定义服务商的固定 id：它没有余额接口。 */
const CUSTOM_SERVICE_ID = 'custom';

/** 服务商目录：首帧只放自定义，读到设置后整份替换成后端下发的目录。 */
let serviceCatalog = [{ id: CUSTOM_SERVICE_ID, label: 'Custom', keyName: 'CUSTOM_API_KEY', protocol: 'openai-compatible' }];
/** 当前服务商，与下拉、密钥框标题、余额按钮同步。 */
let currentService = CUSTOM_SERVICE_ID;
/** 已保存密钥的键名，用于按服务显示「已保存」。 */
let savedKeys = [];
/** 每个服务商各自记住的 profile：协议、地址、模型。 */
let profilesByService = {};

async function aiRequest(method, body) {
  const response = await fetch(AI_SETTINGS_URL, {
    method: method,
    credentials: 'same-origin',
    cache: 'no-store',
    redirect: 'error',
    headers: body
      ? { 'X-DSH-Pet-Token': TOKEN, 'Content-Type': 'application/json' }
      : { 'X-DSH-Pet-Token': TOKEN },
    body: body ? JSON.stringify(body) : undefined,
  });
  if (!response.ok) {
    if (response.status === 403) throw new Error('The page credential has expired. Reopen settings from the pet menu.');
    if (response.status === 429) throw new Error('Saving too often. Wait a minute and try again.');
    throw new Error('Settings not saved. Check the endpoint URL, model name, and key, then try again.');
  }
  return response.json();
}

/** 按 id 取服务商条目；未知 id 回落到目录第一项。 */
function serviceInfo(id) {
  for (let i = 0; i < serviceCatalog.length; i++) {
    if (serviceCatalog[i].id === id) return serviceCatalog[i];
  }
  return serviceCatalog[0];
}

/** 取某个服务商的 profile；缺省给一份空白，避免首帧读到 undefined。 */
function profileOf(id) {
  const profile = profilesByService[id];
  if (profile && typeof profile === 'object') return profile;
  return { protocol: 'openai-compatible', baseUrl: '', model: '' };
}

/** 该服务商是否已保存过密钥。 */
function hasSavedKey(id) {
  return savedKeys.indexOf(serviceInfo(id).keyName) >= 0;
}

/** 把该服务商的协议、地址、模型填进表单。 */
function applyProfile(id) {
  const profile = profileOf(id);
  if (protocolSelect) protocolSelect.setValue(String(profile.protocol || 'openai-compatible'));
  byId('baseUrl').value = typeof profile.baseUrl === 'string' ? profile.baseUrl : '';
  byId('model').value = typeof profile.model === 'string' ? profile.model : '';
}

/** 把当前服务商的状态画进密钥框与余额按钮。 */
function paintServiceState() {
  byId('key-label').textContent = serviceInfo(currentService).label + ' API key';
  const saved = hasSavedKey(currentService);
  byId('key-state').textContent = saved ? 'Saved · not shown' : 'Not set';
  byId('key-actions').hidden = !saved;
  // 密钥框永远清空：留空表示保留该服务已保存的那把。
  byId('apiKey').value = '';
  byId('apiKey').disabled = false;
  // 自定义服务商没有余额接口；内置服务用的就是它自己那把密钥。
  const balance = byId('balance-btn');
  if (balance) balance.disabled = currentService === CUSTOM_SERVICE_ID;
}

/** 用读到的设置整份刷新面板。 */
function populateAi(data) {
  if (Array.isArray(data.services) && data.services.length) {
    serviceCatalog = data.services;
    if (serviceSelect) {
      serviceSelect.setOptions(
        data.services.map(function (entry) {
          return { value: entry.id, label: entry.label };
        }),
      );
    }
  }
  savedKeys = Array.isArray(data.savedKeys) ? data.savedKeys : [];
  profilesByService = data.profiles && typeof data.profiles === 'object' ? data.profiles : {};
  currentService = typeof data.service === 'string' ? data.service : CUSTOM_SERVICE_ID;
  // 旧后端没有 profiles 时，用平铺字段补一份，面板行为不变。
  if (!profilesByService[currentService]) {
    profilesByService[currentService] = {
      protocol: data.protocol === 'anthropic' ? 'anthropic' : 'openai-compatible',
      baseUrl: typeof data.baseUrl === 'string' ? data.baseUrl : '',
      model: typeof data.model === 'string' ? data.model : '',
    };
  }
  if (serviceSelect) serviceSelect.setValue(currentService);
  applyProfile(currentService);
  paintServiceState();
  byId('deepseek-key-state').textContent = data.hasDeepseekKey ? 'Saved · not shown' : 'Not set';
  byId('deepseek-key-actions').hidden = data.hasDeepseekKey !== true;
  byId('deepseekApiKey').value = '';
  byId('deepseekApiKey').disabled = false;
}

/** 用户换了服务商：回填该家自己的协议/地址/模型，其余状态跟着走。 */
function onServicePicked(id) {
  currentService = id;
  applyProfile(id);
  // 上一家拉到过的候选不能拿去配这一家。
  forgetModelOptions();
  paintServiceState();
  const result = byId('balance-result');
  if (result) {
    result.className = 'status';
    result.textContent = '';
    result.dataset.ok = '';
    result.dataset.error = '';
  }
  markDirty(true);
}

/** 把余额结果翻成一行可读文案；失败一律说明原因，不显示伪造数字。 */
function describeBalance(data) {
  if (!data || data.ok !== true) {
    if (data && data.reason === 'credential-missing') return 'Missing key: save an API key for the selected provider first.';
    if (data && data.reason === 'unsupported') return 'This provider does not offer balance lookup.';
    return data && data.message ? 'Lookup failed: ' + data.message : 'Lookup failed. Try again later.';
  }
  const payload = data.data || {};
  if (data.shape === 'money' && payload.wallets) {
    return payload.wallets
      .map(function (wallet) {
        return wallet.currency + ' ' + wallet.total;
      })
      .join(' / ');
  }
  if (data.shape === 'points') return payload.total + ' ' + payload.unit;
  if (data.shape === 'windows') return 'Used this month: ' + payload.monthly + '%';
  return 'Balance data received.';
}

function wireBalanceQuery() {
  const button = byId('balance-btn');
  const result = byId('balance-result');
  button.addEventListener('click', async () => {
    button.disabled = true;
    result.className = 'status';
    result.dataset.ok = '';
    result.dataset.error = '';
    result.textContent = 'Checking balance…';
    try {
      const response = await fetch(AI_BALANCE_URL, {
        method: 'POST',
        credentials: 'same-origin',
        cache: 'no-store',
        headers: { 'X-DSH-Pet-Token': TOKEN },
      });
      if (!response.ok) throw new Error('Lookup rejected (HTTP ' + response.status + ')');
      const data = await response.json();
      const ok = data && data.ok === true;
      if (ok) result.dataset.ok = 'true';
      else result.dataset.error = 'true';
      result.textContent = (ok ? '✓ ' : '✗ ') + describeBalance(data);
    } catch (error) {
      result.dataset.error = 'true';
      result.textContent = '✗ ' + (error && error.message ? error.message : String(error));
    } finally {
      button.disabled = currentService === CUSTOM_SERVICE_ID;
    }
  });
}

function wireKeyDelete(status) {
  byId('key-delete').addEventListener('click', async () => {
    const confirmed = await confirmDialog({
      title: 'Delete saved key',
      text: 'Deletes only the key for the current provider; keys saved for other providers are unaffected. After deletion the pet can no longer call this provider.',
      confirmLabel: 'Delete',
      danger: true,
    });
    if (!confirmed) return;
    setStatus(status, 'Deleting key…');
    try {
      // 带上服务商：用户可能刚切过来还没保存，服务端要删的必须是他看到的那一家。
      populateAi(await aiRequest('POST', { service: currentService, clearKey: true }));
      setStatus(status, 'Key deleted for this provider.', 'ok');
    } catch (error) {
      setStatus(status, error && error.message ? error.message : String(error), 'error');
    }
  });
}

function wireDeepseekKeyDelete(status) {
  byId('deepseek-key-delete').addEventListener('click', async () => {
    const confirmed = await confirmDialog({
      title: 'Delete saved speech key',
      text: 'After deletion DeepSeek speech stops working until you enter a key again.',
      confirmLabel: 'Delete',
      danger: true,
    });
    if (!confirmed) return;
    setStatus(status, 'Deleting speech key…');
    try {
      populateAi(await aiRequest('POST', { clearDeepseekKey: true }));
      setStatus(status, 'Saved speech key deleted.', 'ok');
    } catch (error) {
      setStatus(status, error && error.message ? error.message : String(error), 'error');
    }
  });
}

function wireTest(testBtn, testResult) {
  testBtn.addEventListener('click', async () => {
    testBtn.disabled = true;
    testResult.className = 'status';
    testResult.textContent = 'Testing the connection…';
    const input = {
      protocol: protocolSelect ? protocolSelect.getValue() : 'openai-compatible',
      baseUrl: byId('baseUrl').value.trim(),
      model: byId('model').value.trim(),
      apiKey: byId('apiKey').value.trim(),
    };
    try {
      const response = await fetch(AI_TEST_URL, {
        method: 'POST',
        credentials: 'same-origin',
        cache: 'no-store',
        headers: { 'X-DSH-Pet-Token': TOKEN, 'Content-Type': 'application/json' },
        body: JSON.stringify(input),
      });
      const data = await response.json();
      if (data.ok) {
        testResult.className = 'status';
        testResult.dataset.ok = 'true';
        testResult.textContent = '✓ ' + data.message;
        if (data.reply) testResult.textContent += '; reply: ' + data.reply;
      } else {
        testResult.className = 'status';
        testResult.dataset.error = 'true';
        testResult.textContent = '✗ ' + (data.message || data.error || 'Test failed');
      }
    } catch (error) {
      testResult.className = 'status';
      testResult.dataset.error = 'true';
      testResult.textContent = '✗ Request error: ' + (error && error.message ? error.message : String(error));
    } finally {
      testBtn.disabled = false;
    }
  });
}

function wireSave(form, save, status) {
  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    if (!form.reportValidity()) return;
    save.disabled = true;
    setStatus(status, 'Saving on this machine…');
    // 只提交当前服务商这一栏：别家的密钥与 profile 原样留在配置里。
    const keys = {};
    const typed = byId('apiKey').value;
    if (typed) keys[serviceInfo(currentService).keyName] = typed;
    const profiles = {};
    profiles[currentService] = {
      protocol: protocolSelect ? protocolSelect.getValue() : 'openai-compatible',
      baseUrl: byId('baseUrl').value.trim(),
      model: byId('model').value.trim(),
    };
    const input = {
      service: currentService,
      keys: keys,
      profiles: profiles,
      deepseekApiKey: byId('deepseekApiKey').value,
    };
    byId('apiKey').value = '';
    byId('deepseekApiKey').value = '';
    try {
      populateAi(await aiRequest('POST', input));
      setStatus(status, 'Saved on this machine.', 'ok');
    } catch (error) {
      setStatus(status, error && error.message ? error.message : String(error), 'error');
    } finally {
      save.disabled = false;
    }
  });
}

function wireAiPanel() {
  wireModelPicker();
  const status = byId('status');
  wireKeyDelete(status);
  wireDeepseekKeyDelete(status);
  wireTest(byId('test-btn'), byId('test-result'));
  wireBalanceQuery();
  wireSave(byId('settings'), byId('save'), status);
}
`;
}
