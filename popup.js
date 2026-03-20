// Mobile Simulator - Popup Controller
const devices = [
  { name: 'iPhone 17 Pro', width: 402, height: 874, userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15' },
  { name: 'Samsung Galaxy S26', width: 360, height: 800, userAgent: 'Mozilla/5.0 (Linux; Android 15; SM-S926B) AppleWebKit/537.36' }
];

const DEVICE_PICKER_ICON_SVG = `
  <svg xmlns="http://www.w3.org/2000/svg" width="200" height="200" viewBox="0 0 24 24" fill="#000000" aria-hidden="true">
    <g fill="none" stroke="#000000" stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5">
      <rect width="12.5" height="18.5" x="5.75" y="2.75" rx="3"></rect>
      <path d="M11 17.75h2"></path>
    </g>
  </svg>
`;

// State
let selectedDevice = 'iPhone 17 Pro';
let isRotated = false;
let changeUserAgent = true;
let addFrame = true;
let isDevicePickerOpen = false;

// DOM Elements
const deviceSelect = document.getElementById('deviceSelect');
const devicePickerButton = document.getElementById('devicePickerButton');
const devicePickerPanel = document.getElementById('devicePickerPanel');
const devicePickerIcon = document.getElementById('devicePickerIcon');
const devicePickerName = document.getElementById('devicePickerName');
const devicePickerMeta = document.getElementById('devicePickerMeta');
const applyBtn = document.getElementById('applyBtn');
const rotateBtn = document.getElementById('rotateBtn');
const resetBtn = document.getElementById('resetBtn');
const changeUACheckbox = document.getElementById('changeUA');
const addFrameCheckbox = document.getElementById('addFrame');

function saveActiveSimulation(tabId, simulation) {
  chrome.storage.local.get(['activeSimulations'], (result) => {
    const activeSimulations = result.activeSimulations || {};
    activeSimulations[String(tabId)] = simulation;
    chrome.storage.local.set({ activeSimulations });
  });
}

function clearActiveSimulation(tabId) {
  chrome.storage.local.get(['activeSimulations'], (result) => {
    const activeSimulations = result.activeSimulations || {};
    delete activeSimulations[String(tabId)];
    chrome.storage.local.set({ activeSimulations });
  });
}

// Initialize
function init() {
  applyBtn.textContent = 'Apply Simulator';
  resetBtn.textContent = 'Close Simulator';
  setRotateButtonLabel();

  populateDeviceSelect();
  renderDevicePicker();
  loadSettings();
  attachEventListeners();
}

function populateDeviceSelect() {
  devices.forEach((device) => {
    const option = document.createElement('option');
    option.value = device.name;
    option.textContent = device.name;
    deviceSelect.appendChild(option);
  });
}

function setDevicePickerOpen(isOpen) {
  isDevicePickerOpen = isOpen;
  devicePickerButton.classList.toggle('open', isOpen);
  devicePickerPanel.classList.toggle('open', isOpen);
  devicePickerButton.setAttribute('aria-expanded', String(isOpen));
  devicePickerIcon.textContent = isOpen ? '^' : 'v';
}

function renderDevicePicker() {
  devicePickerPanel.textContent = '';
  devices.forEach((device) => {
    const option = document.createElement('button');
    option.type = 'button';
    option.className = 'device-option';
    option.dataset.deviceName = device.name;

    const icon = document.createElement('span');
    icon.className = 'device-option-icon';
    icon.innerHTML = DEVICE_PICKER_ICON_SVG;

    const copy = document.createElement('span');
    copy.className = 'device-option-copy';

    const name = document.createElement('span');
    name.className = 'device-option-name';
    name.textContent = device.name;

    const meta = document.createElement('span');
    meta.className = 'device-option-meta';
    meta.textContent = `${device.width} X ${device.height}PX`;

    copy.appendChild(name);
    copy.appendChild(meta);
    option.appendChild(icon);
    option.appendChild(copy);

    option.addEventListener('click', () => {
      setSelectedDevice(device.name);
      setDevicePickerOpen(false);
    });

    devicePickerPanel.appendChild(option);
  });
}

function updateSelectedDeviceUI() {
  const device = getCurrentDevice();

  deviceSelect.value = selectedDevice;
  devicePickerName.textContent = device.name.toUpperCase();
  devicePickerMeta.textContent = `${device.width} X ${device.height}PX`;

  devicePickerPanel.querySelectorAll('.device-option').forEach((option) => {
    option.classList.toggle('active', option.dataset.deviceName === selectedDevice);
  });
}

function setSelectedDevice(deviceName) {
  selectedDevice = deviceName;
  isRotated = false;
  setRotateButtonLabel();
  updateDisplay();
  updateSelectedDeviceUI();

  applyBtn.style.animation = 'pulse 0.5s ease';
  setTimeout(() => {
    applyBtn.style.animation = '';
  }, 500);
}

function loadSettings() {
  chrome.storage.local.get(['selectedDevice', 'changeUserAgent', 'addFrame'], (result) => {
    if (result.selectedDevice) {
      selectedDevice = result.selectedDevice;
    }

    if (result.changeUserAgent !== undefined) {
      changeUserAgent = result.changeUserAgent;
      changeUACheckbox.checked = changeUserAgent;
    }

    if (result.addFrame !== undefined) {
      addFrame = result.addFrame;
      addFrameCheckbox.checked = addFrame;
    }

    updateDisplay();
    checkAndAutoApply();
  });
}

function checkAndAutoApply() {
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    if (!tabs[0]) return;

    const url = tabs[0].url || '';

    if (!url.startsWith('chrome://') &&
        !url.startsWith('chrome-extension://') &&
        !url.startsWith('edge://') &&
        !url.startsWith('about:') &&
        url) {
      chrome.scripting.executeScript({
        target: { tabId: tabs[0].id },
        func: () => !!document.getElementById('mobile-simulator-container')
      }).then((results) => {
        if (results && results[0] && results[0].result) {
          console.log('Simulator already active');
        }
      }).catch(() => {
        // ignore restricted pages
      });
    }
  });
}

function attachEventListeners() {
  applyBtn.addEventListener('click', () => {
    applyBtn.classList.add('loading');
    applyBtn.disabled = true;

    simulate(true);

    setTimeout(() => {
      applyBtn.classList.remove('loading');
      applyBtn.disabled = false;
    }, 1000);
  });

  devicePickerButton.addEventListener('click', () => {
    setDevicePickerOpen(!isDevicePickerOpen);
  });

  document.addEventListener('click', (event) => {
    if (!event.target.closest('.device-section')) {
      setDevicePickerOpen(false);
    }
  });

  rotateBtn.addEventListener('click', () => {
    isRotated = !isRotated;
    setRotateButtonLabel();
    updateDisplay();
    simulate();
  });

  resetBtn.addEventListener('click', () => {
    isRotated = false;
    setRotateButtonLabel();

    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (!tabs[0]) return;

      chrome.scripting.executeScript({
        target: { tabId: tabs[0].id },
        func: () => {
          if (globalThis.__mobileSimulatorResetViewport) {
            globalThis.__mobileSimulatorResetViewport();
          } else if (globalThis.resetViewport) {
            globalThis.resetViewport();
          }
        }
      }).then(() => {
        clearActiveSimulation(tabs[0].id);
        showSuccess('Simulator closed');
      }).catch((err) => console.error(err));
    });
  });

  changeUACheckbox.addEventListener('change', () => {
    changeUserAgent = changeUACheckbox.checked;
    chrome.storage.local.set({ changeUserAgent });
  });

  addFrameCheckbox.addEventListener('change', () => {
    addFrame = addFrameCheckbox.checked;
    chrome.storage.local.set({ addFrame });

    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (!tabs[0]) return;

      chrome.scripting.executeScript({
        target: { tabId: tabs[0].id },
        func: () => !!document.getElementById('mobile-simulator-container')
      }).then((results) => {
        if (results && results[0] && results[0].result) {
          simulate();
        }
      }).catch(() => {
        // ignore restricted pages
      });
    });
  });
}

function setRotateButtonLabel() {
  rotateBtn.textContent = isRotated ? 'Reset Rotation' : 'Rotate';
}

function getCurrentDevice() {
  return devices.find((d) => d.name === selectedDevice) || devices[0];
}

function updateDisplay() {
  updateSelectedDeviceUI();
}

function simulate(closePopupOnSuccess = false) {
  const device = getCurrentDevice();
  const width = isRotated ? device.height : device.width;
  const height = isRotated ? device.width : device.height;

  updateDisplay();

  chrome.storage.local.set({ selectedDevice, changeUserAgent, addFrame });

  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    if (!tabs[0]) {
      showError('No active tab found');
      return;
    }

    const tab = tabs[0];
    const url = tab.url || '';

    if (url.startsWith('chrome://') ||
        url.startsWith('chrome-extension://') ||
        url.startsWith('edge://') ||
        url.startsWith('about:') ||
        !url) {
      showError('Cannot simulate on this page');
      return;
    }

    saveActiveSimulation(tab.id, {
      width,
      height,
      deviceName: device.name,
      showFrame: addFrame
    });

    chrome.scripting.executeScript({
      target: { tabId: tab.id },
      files: ['simulator.js']
    }).then(() => {
      return chrome.scripting.executeScript({
        target: { tabId: tab.id },
        func: (w, h, name, frame) => {
          if (globalThis.__mobileSimulatorResizeViewport) {
            globalThis.__mobileSimulatorResizeViewport(w, h, name, frame);
          } else if (globalThis.resizeViewport) {
            globalThis.resizeViewport(w, h, name, frame);
          }
        },
        args: [width, height, device.name, addFrame]
      });
    }).then(() => {
      if (closePopupOnSuccess) {
        window.close();
        return;
      }

      showSuccess('Simulator applied successfully');
    }).catch((err) => {
      clearActiveSimulation(tab.id);
      showError('Failed to apply simulator');
      console.error(err);
    });
  });
}

function showError(message) {
  const notification = document.createElement('div');
  notification.className = 'status-message error';
  notification.textContent = message;
  document.body.appendChild(notification);

  setTimeout(() => {
    notification.remove();
  }, 3000);
}

function showSuccess(message) {
  const notification = document.createElement('div');
  notification.className = 'status-message success';
  notification.textContent = 'OK: ' + message;
  document.body.appendChild(notification);

  setTimeout(() => {
    notification.remove();
  }, 2000);
}


if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
