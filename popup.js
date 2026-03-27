// Mobile Simulator - Popup Controller
const devices = [
  { name: 'iPhone 17 Pro', width: 402, height: 874, userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15' },
  { name: 'Samsung Galaxy S26', width: 360, height: 800, userAgent: 'Mozilla/5.0 (Linux; Android 15; SM-S926B) AppleWebKit/537.36' },
  { name: 'iPad Air', width: 820, height: 1180, userAgent: 'Mozilla/5.0 (iPad; CPU OS 18_0 like Mac OS X) AppleWebKit/605.1.15' },
  { name: 'MacBook Air 13"', width: 1280, height: 832, userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 15_0) AppleWebKit/605.1.15' },
  { name: 'MacBook Air 15"', width: 1440, height: 932, userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 15_0) AppleWebKit/605.1.15' }
];

const PHONE_ICON = '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5"><rect width="12.5" height="18.5" x="5.75" y="2.75" rx="3"></rect><path d="M11 17.75h2"></path></svg>';
const MAC_ICON = '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5"><rect width="20" height="14" x="2" y="3" rx="2"></rect><line x1="2" y1="21" x2="22" y2="21"></line></svg>';

// State
let selectedDevice = 'iPhone 17 Pro';
let isRotated = false;
let changeUserAgent = true;
let addFrame = true;

// DOM Elements
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
  renderDevicePicker();
  loadSettings();
  attachEventListeners();
}

function setDevicePickerOpen(isOpen) {
  devicePickerPanel.style.display = isOpen ? 'block' : 'none';
  devicePickerButton.classList.toggle('open', isOpen);
  devicePickerIcon.textContent = isOpen ? '^' : 'v';
}

function renderDevicePicker() {
  devicePickerPanel.innerHTML = '';
  devices.forEach((device) => {
    const isActive = device.name === selectedDevice;

    const optionBtn = document.createElement('button');
    optionBtn.type = 'button';
    optionBtn.className = 'device-option' + (isActive ? ' active' : '');
    optionBtn.dataset.deviceName = device.name;

    const iconBox = document.createElement('span');
    iconBox.className = 'device-option-icon';
    iconBox.innerHTML = device.name.toLowerCase().includes('macbook') ? MAC_ICON : PHONE_ICON;

    const optCopy = document.createElement('div');
    optCopy.className = 'device-option-copy';

    const optName = document.createElement('strong');
    optName.className = 'device-option-name';
    optName.textContent = device.name;

    const optMeta = document.createElement('small');
    optMeta.className = 'device-option-meta';
    optMeta.textContent = `${device.width} x ${device.height}`;

    optCopy.appendChild(optName);
    optCopy.appendChild(optMeta);
    optionBtn.appendChild(iconBox);
    optionBtn.appendChild(optCopy);

    optionBtn.addEventListener('click', function() {
      setSelectedDevice(device.name);
      setDevicePickerOpen(false);
    });

    devicePickerPanel.appendChild(optionBtn);
  });
}

function updateSelectedDeviceUI() {
  var device = getCurrentDevice();

  devicePickerName.textContent = device.name.toUpperCase();
  devicePickerMeta.textContent = device.width + ' x ' + device.height + 'px';

  devicePickerPanel.querySelectorAll('.device-option').forEach(function(option) {
    var isActive = option.dataset.deviceName === selectedDevice;
    option.classList.toggle('active', isActive);
    var meta = option.querySelector('.device-option-meta');
    if (meta) {
      meta.style.color = isActive ? 'rgba(255,255,255,0.7)' : '#6b7280';
    }
  });
}

function setSelectedDevice(deviceName) {
  selectedDevice = deviceName;
  isRotated = false;
  setRotateButtonLabel();
  updateSelectedDeviceUI();
}

function loadSettings() {
  chrome.storage.local.get(['selectedDevice', 'changeUserAgent', 'addFrame'], function(result) {
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

    updateSelectedDeviceUI();
  });
}

function attachEventListeners() {
  devicePickerButton.addEventListener('click', function() {
    var isHidden = !devicePickerPanel.style.display || devicePickerPanel.style.display === 'none';
    setDevicePickerOpen(isHidden);
  });

  document.addEventListener('click', function(event) {
    if (!event.target.closest('.device-select-wrapper')) {
      setDevicePickerOpen(false);
    }
  });

  applyBtn.addEventListener('click', function() {
    applyBtn.classList.add('loading');
    applyBtn.disabled = true;
    simulate(true);
    setTimeout(function() {
      applyBtn.classList.remove('loading');
      applyBtn.disabled = false;
    }, 1000);
  });

  rotateBtn.addEventListener('click', function() {
    isRotated = !isRotated;
    setRotateButtonLabel();
    simulate();
  });

  resetBtn.addEventListener('click', function() {
    isRotated = false;
    setRotateButtonLabel();

    chrome.tabs.query({ active: true, currentWindow: true }, function(tabs) {
      if (!tabs[0]) return;

      chrome.scripting.executeScript({
        target: { tabId: tabs[0].id },
        func: function() {
          if (globalThis.__mobileSimulatorResetViewport) {
            globalThis.__mobileSimulatorResetViewport();
          } else if (globalThis.resetViewport) {
            globalThis.resetViewport();
          }
        }
      }).then(function() {
        clearActiveSimulation(tabs[0].id);
        showSuccess('Simulator closed');
      }).catch(function(err) { console.error(err); });
    });
  });

  changeUACheckbox.addEventListener('change', function() {
    changeUserAgent = changeUACheckbox.checked;
    chrome.storage.local.set({ changeUserAgent: changeUserAgent });
  });

  addFrameCheckbox.addEventListener('change', function() {
    addFrame = addFrameCheckbox.checked;
    chrome.storage.local.set({ addFrame: addFrame });

    chrome.tabs.query({ active: true, currentWindow: true }, function(tabs) {
      if (!tabs[0]) return;

      chrome.scripting.executeScript({
        target: { tabId: tabs[0].id },
        func: function() {
          return !!document.getElementById('mobile-simulator-container');
        }
      }).then(function(results) {
        if (results && results[0] && results[0].result) {
          simulate();
        }
      }).catch(function() {});
    });
  });
}

function setRotateButtonLabel() {
  rotateBtn.querySelector('span').textContent = isRotated ? 'Reset' : 'Rotate';
}

function getCurrentDevice() {
  return devices.find(function(d) { return d.name === selectedDevice; }) || devices[0];
}

function simulate(closePopupOnSuccess) {
  closePopupOnSuccess = closePopupOnSuccess || false;
  var device = getCurrentDevice();
  var width = isRotated ? device.height : device.width;
  var height = isRotated ? device.width : device.height;

  updateSelectedDeviceUI();

  chrome.storage.local.set({ selectedDevice: selectedDevice, changeUserAgent: changeUserAgent, addFrame: addFrame });

  chrome.tabs.query({ active: true, currentWindow: true }, function(tabs) {
    if (!tabs[0]) {
      showError('No active tab found');
      return;
    }

    var tab = tabs[0];
    var url = tab.url || '';

    if (url.startsWith('chrome://') ||
        url.startsWith('chrome-extension://') ||
        url.startsWith('edge://') ||
        url.startsWith('about:') ||
        !url) {
      showError('Cannot simulate on this page');
      return;
    }

    saveActiveSimulation(tab.id, {
      width: width,
      height: height,
      deviceName: device.name,
      showFrame: addFrame
    });

    chrome.scripting.executeScript({
      target: { tabId: tab.id },
      files: ['simulator.js']
    }).then(function() {
      return chrome.scripting.executeScript({
        target: { tabId: tab.id },
        func: function(w, h, name, frame) {
          if (globalThis.__mobileSimulatorResizeViewport) {
            globalThis.__mobileSimulatorResizeViewport(w, h, name, frame);
          } else if (globalThis.resizeViewport) {
            globalThis.resizeViewport(w, h, name, frame);
          }
        },
        args: [width, height, device.name, addFrame]
      });
    }).then(function() {
      if (closePopupOnSuccess) {
        window.close();
        return;
      }
      showSuccess('Simulator applied');
    }).catch(function(err) {
      clearActiveSimulation(tab.id);
      showError('Failed to apply');
      console.error(err);
    });
  });
}

function showError(message) {
  var notification = document.createElement('div');
  notification.className = 'status-message error';
  notification.textContent = message;
  document.body.appendChild(notification);
  setTimeout(function() { notification.remove(); }, 3000);
}

function showSuccess(message) {
  var notification = document.createElement('div');
  notification.className = 'status-message success';
  notification.textContent = message;
  document.body.appendChild(notification);
  setTimeout(function() { notification.remove(); }, 2000);
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
