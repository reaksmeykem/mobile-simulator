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

function injectEarlyScrollbarHide(tabId) {
  chrome.storage.local.get(['activeSimulations'], (result) => {
    const activeSimulations = result.activeSimulations || {};
    const simulation = activeSimulations[String(tabId)];
    if (!simulation) return;

    chrome.scripting.insertCSS({
      target: { tabId },
      css: 'html, body { overflow: hidden !important; scrollbar-width: none !important; -ms-overflow-style: none !important; } ::-webkit-scrollbar { width: 0 !important; height: 0 !important; display: none !important; }'
    }).catch(() => { /* ignore — page may not be ready yet */ });
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

function reapplySimulation(tabId, url, frameId = 0) {
  if (!isSupportedUrl(url || '')) {
    return;
  }

  // If this is not the main frame, we don't want to re-run the simulation logic
  // as the simulation logic should only run once on the host page.
  if (frameId !== 0) {
    return;
  }

  chrome.storage.local.get(['activeSimulations'], (result) => {
    const activeSimulations = result.activeSimulations || {};
    const simulation = activeSimulations[String(tabId)];

    if (!simulation) {
      return;
    }

    // Check if simulator is already running on the page before reapplying
    chrome.scripting.executeScript({
      target: { tabId },
      func: () => !!document.getElementById('mobile-simulator-container')
    }).then((results) => {
      if (results && results[0] && results[0].result) {
        // Already running, no need to reapply unless it's a full page refresh
        // But if we are here, it's either onUpdated or onCompleted.
        // If the URL changed but the container still exists, it means history.replaceState was likely used.
        return;
      }
      runSimulation(tabId, simulation);
    }).catch(() => {
      // If we can't even check, try running it anyway (will fail if cross-origin or restricted)
      runSimulation(tabId, simulation);
    });
  });
}

chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  // Inject scrollbar-hiding CSS as early as possible (on 'loading' status)
  if (changeInfo.status === 'loading' && isSupportedUrl(tab.url || '')) {
    injectEarlyScrollbarHide(tabId);
  }

  if (changeInfo.status !== 'complete') {
    return;
  }

  reapplySimulation(tabId, tab.url || '');
});

// Earliest possible injection point — right when the browser commits the navigation
chrome.webNavigation.onCommitted.addListener((details) => {
  if (details.frameId !== 0 || !isSupportedUrl(details.url || '')) return;
  injectEarlyScrollbarHide(details.tabId);
});

chrome.webNavigation.onCompleted.addListener((details) => {
  reapplySimulation(details.tabId, details.url || '', details.frameId);
});

chrome.tabs.onRemoved.addListener((tabId) => {
  clearActiveSimulation(tabId);
});

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'UPDATE_SIMULATION_STATE' && sender.tab) {
    const tabId = sender.tab.id;
    chrome.storage.local.get(['activeSimulations'], (result) => {
      const activeSimulations = result.activeSimulations || {};
      activeSimulations[String(tabId)] = message.simulation;
      chrome.storage.local.set({ activeSimulations });
    });
  }
  if (message.type === 'CLOSE_SIMULATION' && sender.tab) {
    clearActiveSimulation(sender.tab.id);
    sendResponse({ success: true });
  }
});
