function isSupportedUrl(url) {
  return Boolean(
    url &&
    !url.startsWith('chrome://') &&
    !url.startsWith('chrome-extension://') &&
    !url.startsWith('edge://') &&
    !url.startsWith('about:')
  );
}

function clearActiveSimulation(tabId) {
  chrome.storage.local.get(['activeSimulations'], (result) => {
    const activeSimulations = result.activeSimulations || {};
    delete activeSimulations[String(tabId)];
    chrome.storage.local.set({ activeSimulations });
  });
}

function runSimulation(tabId, simulation, attempt = 0) {
  chrome.scripting.executeScript({
    target: { tabId },
    files: ['simulator.js']
  }).then(() => {
    return chrome.scripting.executeScript({
      target: { tabId },
      func: (savedSimulation) => {
        const runner =
          globalThis.__mobileSimulatorResizeViewport ||
          globalThis.resizeViewport;

        if (typeof runner !== 'function') {
          throw new Error('Mobile simulator renderer is not available.');
        }

        runner(
          savedSimulation.width,
          savedSimulation.height,
          savedSimulation.deviceName,
          savedSimulation.showFrame
        );
      },
      args: [simulation]
    });
  }).catch(() => {
    if (attempt >= 4) {
      return;
    }

    setTimeout(() => {
      runSimulation(tabId, simulation, attempt + 1);
    }, 350);
  });
}

function reapplySimulation(tabId, url) {
  if (!isSupportedUrl(url || '')) {
    return;
  }

  chrome.storage.local.get(['activeSimulations'], (result) => {
    const activeSimulations = result.activeSimulations || {};
    const simulation = activeSimulations[String(tabId)];

    if (!simulation) {
      return;
    }

    runSimulation(tabId, simulation);
  });
}

chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.status !== 'complete') {
    return;
  }

  reapplySimulation(tabId, tab.url || '');
});

chrome.webNavigation.onCompleted.addListener((details) => {
  if (details.frameId !== 0) {
    return;
  }

  chrome.tabs.get(details.tabId, (tab) => {
    if (chrome.runtime.lastError || !tab) {
      return;
    }

    reapplySimulation(details.tabId, tab.url || '');
  });
});

chrome.tabs.onRemoved.addListener((tabId) => {
  clearActiveSimulation(tabId);
});
