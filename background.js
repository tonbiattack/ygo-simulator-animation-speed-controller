chrome.runtime.onInstalled.addListener(() => {
  chrome.storage.local.get({ junkBladeAnimationSpeed: 4 }).then((settings) => {
    return chrome.storage.local.set(settings);
  });
});
