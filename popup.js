// Alpine.js component for Mobile Simulator
function mobileSimulator() {
  return {
    devices: [
      { name: 'iPhone 17 Pro', width: 402, height: 874, userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15' },
      { name: 'iPhone 16 Pro', width: 402, height: 874, userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15' },
      { name: 'iPhone 16', width: 393, height: 852, userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15' },
      { name: 'iPhone 15 Pro', width: 393, height: 852, userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15' },
      { name: 'iPhone 15', width: 430, height: 932, userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15' },
      { name: 'iPhone 14 Pro', width: 393, height: 852, userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 16_0 like Mac OS X) AppleWebKit/605.1.15' },
      { name: 'iPhone 14', width: 390, height: 844, userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 16_0 like Mac OS X) AppleWebKit/605.1.15' },
      { name: 'iPhone SE', width: 375, height: 667, userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 16_0 like Mac OS X) AppleWebKit/605.1.15' },
      { name: 'Samsung Galaxy S26', width: 360, height: 800, userAgent: 'Mozilla/5.0 (Linux; Android 15; SM-S926B) AppleWebKit/537.36' },
      { name: 'Samsung Galaxy S25', width: 360, height: 800, userAgent: 'Mozilla/5.0 (Linux; Android 15; SM-S925B) AppleWebKit/537.36' },
      { name: 'Samsung Galaxy S24', width: 360, height: 780, userAgent: 'Mozilla/5.0 (Linux; Android 14; SM-S921B) AppleWebKit/537.36' },
      { name: 'Samsung Galaxy S23', width: 360, height: 780, userAgent: 'Mozilla/5.0 (Linux; Android 13; SM-S911B) AppleWebKit/537.36' },
      { name: 'Google Pixel 8', width: 412, height: 915, userAgent: 'Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36' },
      { name: 'iPad Pro 12.9"', width: 1024, height: 1366, userAgent: 'Mozilla/5.0 (iPad; CPU OS 17_0 like Mac OS X) AppleWebKit/605.1.15' },
      { name: 'iPad Air', width: 820, height: 1180, userAgent: 'Mozilla/5.0 (iPad; CPU OS 17_0 like Mac OS X) AppleWebKit/605.1.15' },
      { name: 'iPad Mini', width: 744, height: 1133, userAgent: 'Mozilla/5.0 (iPad; CPU OS 17_0 like Mac OS X) AppleWebKit/605.1.15' }
    ],
    selectedDevice: 'iPhone 17 Pro',
    isRotated: false,
    changeUserAgent: true,
    addFrame: true,
    currentWidth: 402,
    currentHeight: 874,

    init() {
      // Load saved settings
      chrome.storage.local.get(['selectedDevice', 'changeUserAgent', 'addFrame'], (result) => {
        if (result.selectedDevice) {
          this.selectedDevice = result.selectedDevice;
        }
        if (result.changeUserAgent !== undefined) {
          this.changeUserAgent = result.changeUserAgent;
        }
        if (result.addFrame !== undefined) {
          this.addFrame = result.addFrame;
        }
        this.updateDimensions();
      });
    },

    getCurrentDevice() {
      return this.devices.find(d => d.name === this.selectedDevice) || this.devices[0];
    },

    updateDimensions() {
      const device = this.getCurrentDevice();
      this.currentWidth = this.isRotated ? device.height : device.width;
      this.currentHeight = this.isRotated ? device.width : device.height;
    },

    simulate() {
      const device = this.getCurrentDevice();
      const width = this.isRotated ? device.height : device.width;
      const height = this.isRotated ? device.width : device.height;

      this.currentWidth = width;
      this.currentHeight = height;

      // Save settings
      chrome.storage.local.set({ 
        selectedDevice: this.selectedDevice, 
        changeUserAgent: this.changeUserAgent, 
        addFrame: this.addFrame 
      });

      // Apply to current tab
      chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        if (!tabs[0]) {
          this.showError('No active tab found');
          return;
        }
        
        const tab = tabs[0];
        const url = tab.url || '';
        
        if (url.startsWith('chrome://') || url.startsWith('chrome-extension://') || 
            url.startsWith('edge://') || url.startsWith('about:') || !url) {
          this.showError('Cannot simulate on this page. Please open a regular website');
          return;
        }

        chrome.scripting.executeScript({
          target: { tabId: tab.id },
          func: resizeViewport,
          args: [width, height, device.name, this.addFrame]
        }).then(() => {
          this.showSuccess('Simulator applied!');
        }).catch(err => {
          this.showError('Failed to apply simulator');
          console.error(err);
        });
      });
    },

    rotate() {
      this.isRotated = !this.isRotated;
      this.updateDimensions();
      this.simulate();
    },

    reset() {
      this.isRotated = false;
      this.updateDimensions();
      
      chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        if (!tabs[0]) return;
        chrome.scripting.executeScript({
          target: { tabId: tabs[0].id },
          func: resetViewport
        }).catch(err => console.error(err));
      });
    },

    showError(message) {
      // Simple notification (you can enhance this)
      console.error(message);
    },

    showSuccess(message) {
      // Simple notification (you can enhance this)
      console.log(message);
    }
  };
}

// Viewport resize function (injected into page)
function resizeViewport(width, height, deviceName, showFrame) {
  const existing = document.getElementById('mobile-simulator-container');
  if (existing) existing.remove();

  const isIPhone = deviceName.toLowerCase().includes('iphone');
  const isSamsung = deviceName.toLowerCase().includes('samsung') || deviceName.toLowerCase().includes('galaxy');
  const isAndroid = isSamsung || deviceName.toLowerCase().includes('pixel');

  // Minimal bezels for realistic look
  const sideBezel = 4;
  const topBezel = 6;
  const bottomBezel = 6;
  const phoneWidth = width + (sideBezel * 2);
  const phoneHeight = height + topBezel + bottomBezel;

  const maxHeight = window.innerHeight - 80;
  const maxWidth = window.innerWidth - 380;
  const scale = Math.min(maxHeight / phoneHeight, maxWidth / phoneWidth, 1);

  const devicesList = [
    { name: 'iPhone 17 Pro', width: 402, height: 874 },
    { name: 'iPhone 16 Pro', width: 402, height: 874 },
    { name: 'iPhone 16', width: 393, height: 852 },
    { name: 'iPhone 15 Pro', width: 393, height: 852 },
    { name: 'iPhone 15', width: 430, height: 932 },
    { name: 'iPhone 14 Pro', width: 393, height: 852 },
    { name: 'iPhone 14', width: 390, height: 844 },
    { name: 'iPhone SE', width: 375, height: 667 },
    { name: 'Samsung Galaxy S26', width: 360, height: 800 },
    { name: 'Samsung Galaxy S25', width: 360, height: 800 },
    { name: 'Samsung Galaxy S24', width: 360, height: 780 },
    { name: 'Samsung Galaxy S23', width: 360, height: 780 },
    { name: 'Google Pixel 8', width: 412, height: 915 },
    { name: 'iPad Pro 12.9"', width: 1024, height: 1366 },
    { name: 'iPad Air', width: 820, height: 1180 },
    { name: 'iPad Mini', width: 744, height: 1133 }
  ];

  const container = document.createElement('div');
  container.id = 'mobile-simulator-container';
  container.style.cssText = `position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: #0a0a0a; z-index: 999998; display: flex; align-items: center; justify-content: center; gap: 40px;`;

  const controlPanel = document.createElement('div');
  controlPanel.style.cssText = `display: flex; flex-direction: column; gap: 20px; padding: 30px; background: rgba(26, 26, 26, 0.8); backdrop-filter: blur(20px); border-radius: 24px; border: 1px solid rgba(255,255,255,0.1); box-shadow: 0 12px 48px rgba(0,0,0,0.6); max-width: 280px;`;

  const title = document.createElement('div');
  title.style.cssText = `font-family: -apple-system, sans-serif; font-size: 18px; font-weight: 700; color: white; margin-bottom: 10px;`;
  title.textContent = '📱 Mobile Simulator';

  const deviceInfo = document.createElement('div');
  deviceInfo.style.cssText = `font-family: -apple-system, sans-serif; font-size: 13px; color: #888; margin-bottom: 10px;`;
  deviceInfo.innerHTML = `<span style="color: #3b82f6; font-weight: 600;">${deviceName}</span><br>${width} × ${height}px`;

  const selectLabel = document.createElement('div');
  selectLabel.style.cssText = `font-family: -apple-system, sans-serif; font-size: 11px; color: #888; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 12px;`;
  selectLabel.textContent = 'Select Device';

  const deviceSelectWrapper = document.createElement('div');
  deviceSelectWrapper.style.cssText = `position: relative; margin-bottom: 16px;`;

  const deviceSelectCtrl = document.createElement('select');
  deviceSelectCtrl.style.cssText = `background: rgba(255,255,255,0.1); color: white; border: 1px solid rgba(255,255,255,0.2); padding: 14px 40px 14px 16px; border-radius: 12px; font-size: 14px; font-family: -apple-system, sans-serif; cursor: pointer; outline: none; width: 100%; appearance: none;`;
  
  const iphoneGroup = document.createElement('optgroup');
  iphoneGroup.label = '📱 iPhone';
  const samsungGroup = document.createElement('optgroup');
  samsungGroup.label = '📱 Samsung';
  const androidGroup = document.createElement('optgroup');
  androidGroup.label = '📱 Android';
  const tabletGroup = document.createElement('optgroup');
  tabletGroup.label = '📱 Tablets';

  devicesList.forEach(device => {
    const option = document.createElement('option');
    option.value = device.name;
    option.textContent = device.name;
    option.style.background = '#1a1a1a';
    option.style.color = 'white';
    if (device.name === deviceName) option.selected = true;
    
    if (device.name.includes('iPhone')) iphoneGroup.appendChild(option);
    else if (device.name.includes('Samsung') || device.name.includes('Galaxy')) samsungGroup.appendChild(option);
    else if (device.name.includes('Pixel')) androidGroup.appendChild(option);
    else if (device.name.includes('iPad')) tabletGroup.appendChild(option);
  });

  deviceSelectCtrl.appendChild(iphoneGroup);
  deviceSelectCtrl.appendChild(samsungGroup);
  deviceSelectCtrl.appendChild(androidGroup);
  deviceSelectCtrl.appendChild(tabletGroup);

  const dropdownArrow = document.createElement('div');
  dropdownArrow.innerHTML = '▼';
  dropdownArrow.style.cssText = `position: absolute; right: 16px; top: 50%; transform: translateY(-50%); color: #888; font-size: 10px; pointer-events: none;`;

  deviceSelectWrapper.appendChild(deviceSelectCtrl);
  deviceSelectWrapper.appendChild(dropdownArrow);

  deviceSelectCtrl.addEventListener('change', () => {
    const selected = devicesList.find(d => d.name === deviceSelectCtrl.value);
    if (selected) resizeViewport(selected.width, selected.height, selected.name, showFrame);
  });

  const controlsLabel = document.createElement('div');
  controlsLabel.style.cssText = `font-family: -apple-system, sans-serif; font-size: 11px; color: #888; text-transform: uppercase; letter-spacing: 0.5px; margin-top: 10px; margin-bottom: 8px;`;
  controlsLabel.textContent = 'Controls';

  const rotateButton = document.createElement('button');
  rotateButton.innerHTML = '🔄 <span style="margin-left: 8px;">Rotate</span>';
  rotateButton.style.cssText = `background: rgba(59, 130, 246, 0.15); color: #3b82f6; border: 1px solid rgba(59, 130, 246, 0.3); padding: 12px 20px; border-radius: 12px; font-size: 14px; font-family: -apple-system, sans-serif; cursor: pointer; width: 100%; text-align: left; font-weight: 500;`;
  rotateButton.onmouseover = () => rotateButton.style.background = 'rgba(59, 130, 246, 0.25)';
  rotateButton.onmouseout = () => rotateButton.style.background = 'rgba(59, 130, 246, 0.15)';
  rotateButton.addEventListener('click', () => resizeViewport(height, width, deviceName, showFrame));

  const frameButton = document.createElement('button');
  frameButton.innerHTML = `${showFrame ? '📱' : '⬜'} <span style="margin-left: 8px;">${showFrame ? 'Hide' : 'Show'} Frame</span>`;
  frameButton.style.cssText = `background: rgba(255,255,255,0.08); color: white; border: 1px solid rgba(255,255,255,0.2); padding: 12px 20px; border-radius: 12px; font-size: 14px; font-family: -apple-system, sans-serif; cursor: pointer; width: 100%; text-align: left; font-weight: 500;`;
  frameButton.onmouseover = () => frameButton.style.background = 'rgba(255,255,255,0.15)';
  frameButton.onmouseout = () => frameButton.style.background = 'rgba(255,255,255,0.08)';
  frameButton.addEventListener('click', () => resizeViewport(width, height, deviceName, !showFrame));

  const closeButton = document.createElement('button');
  closeButton.innerHTML = '✕ <span style="margin-left: 8px;">Close</span>';
  closeButton.style.cssText = `background: rgba(239, 68, 68, 0.15); color: #ef4444; border: 1px solid rgba(239, 68, 68, 0.3); padding: 12px 20px; border-radius: 12px; font-size: 14px; font-family: -apple-system, sans-serif; cursor: pointer; width: 100%; text-align: left; font-weight: 500; margin-top: 10px;`;
  closeButton.onmouseover = () => closeButton.style.background = 'rgba(239, 68, 68, 0.25)';
  closeButton.onmouseout = () => closeButton.style.background = 'rgba(239, 68, 68, 0.15)';
  closeButton.addEventListener('click', () => resetViewport());

  controlPanel.appendChild(title);
  controlPanel.appendChild(deviceInfo);
  controlPanel.appendChild(selectLabel);
  controlPanel.appendChild(deviceSelectWrapper);
  controlPanel.appendChild(controlsLabel);
  controlPanel.appendChild(rotateButton);
  controlPanel.appendChild(frameButton);
  controlPanel.appendChild(closeButton);

  const mockupWrapper = document.createElement('div');
  mockupWrapper.style.cssText = `display: flex; align-items: center; justify-content: center;`;

  const mockup = document.createElement('div');
  
  if (isIPhone) {
    mockup.style.cssText = `position: relative; width: ${phoneWidth}px; height: ${phoneHeight}px; background: linear-gradient(145deg, #1f1f1f, #2d2d2d); border-radius: 48px; padding: ${topBezel}px ${sideBezel}px ${bottomBezel}px ${sideBezel}px; transform: scale(${scale}); box-shadow: 0 0 0 2px #0a0a0a, 0 0 0 5px #1a1a1a, 0 0 0 7px #2a2a2a, 0 50px 120px rgba(0,0,0,0.9), inset 0 1px 2px rgba(255,255,255,0.1);`;
  } else if (isAndroid) {
    mockup.style.cssText = `position: relative; width: ${phoneWidth}px; height: ${phoneHeight}px; background: linear-gradient(145deg, #2a2a2a, #1a1a1a); border-radius: 32px; padding: ${topBezel}px ${sideBezel}px ${bottomBezel}px ${sideBezel}px; transform: scale(${scale}); box-shadow: 0 0 0 1px #0a0a0a, 0 0 0 3px #1a1a1a, 0 0 0 5px #2a2a2a, 0 50px 120px rgba(0,0,0,0.9), inset 0 1px 1px rgba(255,255,255,0.05);`;
  } else {
    mockup.style.cssText = `position: relative; width: ${phoneWidth}px; height: ${phoneHeight}px; background: linear-gradient(145deg, #1f1f1f, #2d2d2d); border-radius: 38px; padding: ${topBezel}px ${sideBezel}px ${bottomBezel}px ${sideBezel}px; transform: scale(${scale}); box-shadow: 0 0 0 2px #0a0a0a, 0 0 0 6px #1a1a1a, 0 0 0 8px #333, 0 50px 120px rgba(0,0,0,0.9), inset 0 1px 2px rgba(255,255,255,0.1);`;
  }

  if (showFrame) {
    if (isIPhone) {
      const notch = document.createElement('div');
      notch.style.cssText = `position: absolute; top: 0; left: 50%; transform: translateX(-50%); width: 140px; height: 28px; background: #0a0a0a; border-radius: 0 0 18px 18px; z-index: 10;`;
      const speaker = document.createElement('div');
      speaker.style.cssText = `position: absolute; top: 7px; left: 50%; transform: translateX(-50%); width: 50px; height: 4px; background: #111; border-radius: 2px; z-index: 11;`;
      const camera = document.createElement('div');
      camera.style.cssText = `position: absolute; top: 6px; left: calc(50% + 45px); width: 8px; height: 8px; background: radial-gradient(circle, #1e40af 30%, #0a0a0a 70%); border-radius: 50%; z-index: 11;`;
      const homeIndicator = document.createElement('div');
      homeIndicator.style.cssText = `position: absolute; bottom: 4px; left: 50%; transform: translateX(-50%); width: 120px; height: 4px; background: rgba(255,255,255,0.4); border-radius: 2px; z-index: 10;`;
      mockup.appendChild(notch);
      mockup.appendChild(speaker);
      mockup.appendChild(camera);
      mockup.appendChild(homeIndicator);
    } else if (isAndroid) {
      const punchHole = document.createElement('div');
      punchHole.style.cssText = `position: absolute; top: 10px; left: 50%; transform: translateX(-50%); width: 10px; height: 10px; background: #0a0a0a; border-radius: 50%; z-index: 10;`;
      const camera = document.createElement('div');
      camera.style.cssText = `position: absolute; top: 12px; left: 50%; transform: translateX(-50%); width: 6px; height: 6px; background: radial-gradient(circle, #1e40af 30%, #0a0a0a 70%); border-radius: 50%; z-index: 11;`;
      mockup.appendChild(punchHole);
      mockup.appendChild(camera);
    }

    const powerBtn = document.createElement('div');
    powerBtn.style.cssText = `position: absolute; right: -3px; top: 120px; width: 3px; height: 70px; background: linear-gradient(90deg, #0a0a0a, #1a1a1a); border-radius: 0 2px 2px 0;`;
    const volumeUp = document.createElement('div');
    volumeUp.style.cssText = `position: absolute; left: -3px; top: 100px; width: 3px; height: 50px; background: linear-gradient(270deg, #0a0a0a, #1a1a1a); border-radius: 2px 0 0 2px;`;
    const volumeDown = document.createElement('div');
    volumeDown.style.cssText = `position: absolute; left: -3px; top: 160px; width: 3px; height: 50px; background: linear-gradient(270deg, #0a0a0a, #1a1a1a); border-radius: 2px 0 0 2px;`;
    mockup.appendChild(powerBtn);
    mockup.appendChild(volumeUp);
    mockup.appendChild(volumeDown);
  }

  const screenRadius = isIPhone ? '42px' : (isAndroid ? '26px' : '32px');
  const screen = document.createElement('div');
  screen.style.cssText = `width: ${width}px; height: ${height}px; background: white; border-radius: ${showFrame ? screenRadius : '8px'}; overflow: hidden; box-shadow: inset 0 0 20px rgba(0,0,0,0.1);`;

  const iframe = document.createElement('iframe');
  iframe.style.cssText = `width: ${width}px; height: ${height}px; border: none; background: white; border-radius: ${showFrame ? screenRadius : '8px'};`;
  
  iframe.onload = function() {
    try {
      const iframeDoc = iframe.contentDocument || iframe.contentWindow.document;
      let viewportMeta = iframeDoc.querySelector('meta[name="viewport"]');
      if (!viewportMeta) {
        viewportMeta = iframeDoc.createElement('meta');
        viewportMeta.name = 'viewport';
        iframeDoc.head.appendChild(viewportMeta);
      }
      viewportMeta.content = `width=${width}, initial-scale=1.0, maximum-scale=1.0, user-scalable=no`;
      const style = iframeDoc.createElement('style');
      style.textContent = `html, body { width: ${width}px !important; min-height: ${height}px !important; margin: 0 !important; padding: 0 !important; overflow-x: hidden !important; } ::-webkit-scrollbar { width: 0; height: 0; } * { scrollbar-width: none; -ms-overflow-style: none; }`;
      iframeDoc.head.appendChild(style);
    } catch (e) {}
  };
  
  iframe.src = window.location.href;

  screen.appendChild(iframe);
  mockup.appendChild(screen);
  mockupWrapper.appendChild(mockup);
  container.appendChild(controlPanel);
  container.appendChild(mockupWrapper);
  document.body.appendChild(container);
  document.body.style.overflow = 'hidden';
}

function resetViewport() {
  const container = document.getElementById('mobile-simulator-container');
  if (container) container.remove();
  document.body.style.overflow = '';
}
