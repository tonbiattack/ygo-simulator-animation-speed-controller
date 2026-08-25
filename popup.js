const TARGET_ORIGIN = 'https://tsd0313.github.io';
const TARGET_SITES = [
  { pathPrefix: '/ygo-JunkBlade/dist/', name: 'JunkBlade Simulator' },
  { pathPrefix: '/ygo-DogmaBlade/dist/', name: 'DogmaBlade Simulator' }
];
const DEFAULT_SPEED = 4;

const speedInput = document.querySelector('#speed');
const speedValue = document.querySelector('#speed-value');
const applyButton = document.querySelector('#apply');
const status = document.querySelector('#site-status');
const result = document.querySelector('#result');
const presetButtons = [...document.querySelectorAll('[data-speed]')];
let activeTab;

function formatSpeed(speed) {
  return `${Number(speed)}x`;
}

function renderSpeed(speed) {
  speedInput.value = String(speed);
  speedValue.value = formatSpeed(speed);
  speedValue.textContent = formatSpeed(speed);
  presetButtons.forEach((button) => {
    button.classList.toggle('selected', Number(button.dataset.speed) === Number(speed));
  });
}

function setResult(text, isError = false) {
  result.textContent = text;
  result.classList.toggle('error', isError);
}

function getTargetSite(tab) {
  try {
    const url = new URL(tab.url);
    if (url.origin !== TARGET_ORIGIN) return null;
    return TARGET_SITES.find((site) => url.pathname.startsWith(site.pathPrefix)) || null;
  } catch {
    return null;
  }
}

function isTargetTab(tab) {
  return Boolean(getTargetSite(tab));
}

// この関数はページ本体と同じJavaScript実行環境で実行する。
function applyCreateJsSpeed(speed) {
  const FLAG = '__junkBladeAnimationSpeedController__';

  if (!window.createjs || !createjs.Tween || typeof createjs.Tween.get !== 'function') {
    return { ok: false, message: 'CreateJSの初期化が完了していません。ページを再読み込みしてから再度実行してください。' };
  }

  const Tween = createjs.Tween;
  let controller = window[FLAG];

  if (!controller) {
    controller = {
      originalGet: Tween.get.bind(Tween),
      speed: 1,
      installed: false
    };
    window[FLAG] = controller;
  }

  controller.speed = speed;

  if (!controller.installed) {
    Tween.get = function patchedGet(target, props, pluginData, override) {
      const tween = controller.originalGet(target, props, pluginData, override);
      if (tween && typeof tween.timeScale === 'number') {
        tween.timeScale = controller.speed;
      }
      return tween;
    };
    controller.installed = true;
  }

  let current = Tween._tweenHead;
  const visited = new Set();
  let activeCount = 0;

  while (current && !visited.has(current)) {
    visited.add(current);
    if (typeof current.timeScale === 'number') {
      current.timeScale = speed;
      activeCount += 1;
    }
    current = current._next;
  }

  return {
    ok: true,
    speed,
    activeCount,
    message: `アニメーションを ${speed}x に設定しました。`
  };
}

async function applySpeed() {
  if (!activeTab || !isTargetTab(activeTab)) {
    setResult('JunkBlade Simulator のタブを開いてから使ってください。', true);
    return;
  }

  const speed = Number(speedInput.value);
  applyButton.disabled = true;
  setResult('適用中です。');

  try {
    const execution = await chrome.scripting.executeScript({
      target: { tabId: activeTab.id },
      world: 'MAIN',
      func: applyCreateJsSpeed,
      args: [speed]
    });
    const response = execution[0]?.result;

    if (!response?.ok) {
      throw new Error(response?.message || '速度設定をページへ適用できませんでした。');
    }

    await chrome.storage.local.set({ junkBladeAnimationSpeed: speed });
    setResult(`${response.message} 進行中の演出 ${response.activeCount} 件にも反映しました。`);
  } catch (error) {
    setResult(error.message || '適用に失敗しました。ページを再読み込みしてから再度試してください。', true);
  } finally {
    applyButton.disabled = false;
  }
}

speedInput.addEventListener('input', () => renderSpeed(speedInput.value));
presetButtons.forEach((button) => {
  button.addEventListener('click', () => {
    renderSpeed(button.dataset.speed);
  });
});
applyButton.addEventListener('click', applySpeed);

(async () => {
  const stored = await chrome.storage.local.get({ junkBladeAnimationSpeed: DEFAULT_SPEED });
  renderSpeed(stored.junkBladeAnimationSpeed);

  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  activeTab = tab;

  if (isTargetTab(tab)) {
    status.textContent = `${getTargetSite(tab).name} を検出しました。`;
  } else {
    status.textContent = '対象外のページです。JunkBlade Simulator または DogmaBlade Simulator を開いてください。';
    status.classList.add('error');
    applyButton.disabled = true;
  }
})();
