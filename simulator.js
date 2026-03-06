function resizeViewport(width, height, deviceName, showFrame) {
  function captureScrollState() {
    return {
      bodyOverflow: document.body.style.overflow,
      bodyOverscrollBehavior: document.body.style.overscrollBehavior,
      docOverflow: document.documentElement.style.overflow,
      docOverscrollBehavior: document.documentElement.style.overscrollBehavior
    };
  }

  function applyScrollLock() {
    document.body.style.overflow = 'hidden';
    document.body.style.overscrollBehavior = 'none';
    document.documentElement.style.overflow = 'hidden';
    document.documentElement.style.overscrollBehavior = 'none';
  }

  function createIcon(svgMarkup) {
    const icon = document.createElement('div');
    icon.style.cssText = 'display: flex; align-items: center; justify-content: center; width: 20px; height: 20px;';
    icon.innerHTML = svgMarkup;
    return icon;
  }

  function parseCssColor(colorValue) {
    if (!colorValue || colorValue === 'transparent') {
      return null;
    }

    const normalized = colorValue.trim();
    const hexMatch = normalized.match(/^#([0-9a-f]{3}|[0-9a-f]{6})$/i);
    if (hexMatch) {
      const hex = hexMatch[1];
      const expanded = hex.length === 3
        ? hex.split('').map((char) => char + char).join('')
        : hex;

      return {
        r: Number.parseInt(expanded.slice(0, 2), 16),
        g: Number.parseInt(expanded.slice(2, 4), 16),
        b: Number.parseInt(expanded.slice(4, 6), 16),
        a: 1
      };
    }

    const match = normalized.match(/rgba?\(([^)]+)\)/i);
    if (!match) {
      return null;
    }

    const parts = match[1].split(',').map((part) => Number.parseFloat(part.trim()));
    if (parts.length < 3 || parts.some((part, index) => index < 3 && Number.isNaN(part))) {
      return null;
    }

    return {
      r: parts[0],
      g: parts[1],
      b: parts[2],
      a: Number.isNaN(parts[3]) ? 1 : parts[3]
    };
  }

  function mixColors(baseColor, overlayColor) {
    const overlayAlpha = overlayColor.a ?? 1;
    const baseAlpha = baseColor.a ?? 1;
    const outAlpha = overlayAlpha + (baseAlpha * (1 - overlayAlpha));

    if (!outAlpha) {
      return { r: 255, g: 255, b: 255, a: 1 };
    }

    return {
      r: Math.round(((overlayColor.r * overlayAlpha) + (baseColor.r * baseAlpha * (1 - overlayAlpha))) / outAlpha),
      g: Math.round(((overlayColor.g * overlayAlpha) + (baseColor.g * baseAlpha * (1 - overlayAlpha))) / outAlpha),
      b: Math.round(((overlayColor.b * overlayAlpha) + (baseColor.b * baseAlpha * (1 - overlayAlpha))) / outAlpha),
      a: outAlpha
    };
  }

  function getEffectiveBackgroundColor(targetWindow, element) {
    let current = element;
    let color = { r: 255, g: 255, b: 255, a: 1 };

    while (current && current !== targetWindow.document.documentElement) {
      const parsed = parseCssColor(targetWindow.getComputedStyle(current).backgroundColor);
      if (parsed && parsed.a > 0) {
        color = mixColors(color, parsed);
      }

      current = current.parentElement;
    }

    const docColor = parseCssColor(targetWindow.getComputedStyle(targetWindow.document.documentElement).backgroundColor);
    if (docColor && docColor.a > 0) {
      color = mixColors(color, docColor);
    }

    return color;
  }

  function getColorLuminance(color) {
    return ((color.r * 299) + (color.g * 587) + (color.b * 114)) / 1000;
  }

  function colorToRgba(color, alpha) {
    return `rgba(${Math.round(color.r)}, ${Math.round(color.g)}, ${Math.round(color.b)}, ${alpha})`;
  }

  function averageColors(colors) {
    if (!colors.length) {
      return { r: 245, g: 245, b: 245, a: 1 };
    }

    const totals = colors.reduce((acc, color) => {
      acc.r += color.r;
      acc.g += color.g;
      acc.b += color.b;
      return acc;
    }, { r: 0, g: 0, b: 0 });

    return {
      r: totals.r / colors.length,
      g: totals.g / colors.length,
      b: totals.b / colors.length,
      a: 1
    };
  }

  function getThemeAwareTopColor(targetWindow, screenWidth) {
    try {
      const metaTheme = targetWindow.document.querySelector('meta[name="theme-color"]');
      if (metaTheme && metaTheme.content) {
        const parsedMetaColor = parseCssColor(metaTheme.content);
        if (parsedMetaColor) {
          return parsedMetaColor;
        }
      }
    } catch (error) {
      // ignore theme-color lookup issues
    }

    return sampleTopAreaColor(targetWindow, screenWidth);
  }

  function sampleTopAreaColor(targetWindow, screenWidth) {
    try {
      const sampleY = Math.max(8, Math.round(targetWindow.innerHeight * 0.02));
      const samplePoints = [
        Math.max(16, Math.round(screenWidth * 0.12)),
        Math.round(screenWidth * 0.5),
        Math.min(screenWidth - 16, Math.round(screenWidth * 0.88))
      ];

      const sampledColors = samplePoints.map((pointX) => {
        const element = targetWindow.document.elementFromPoint(pointX, sampleY);
        return element ? getEffectiveBackgroundColor(targetWindow, element) : null;
      }).filter(Boolean);

      if (!sampledColors.length) {
        const bodyColor = parseCssColor(targetWindow.getComputedStyle(targetWindow.document.body).backgroundColor);
        if (bodyColor) {
          return bodyColor;
        }
      }

      return averageColors(sampledColors);
    } catch (error) {
      return { r: 245, g: 245, b: 245, a: 1 };
    }
  }

  function getLocalDeviceTime() {
    return new Date().toLocaleTimeString([], {
      hour: 'numeric',
      minute: '2-digit'
    });
  }

  function createIPhoneStatusOverlay(screenWidth, screenHeight) {
    const horizontalInset = Math.max(18, Math.round(screenWidth * 0.045));
    const topInset = Math.max(6, Math.round(screenHeight * 0.008));

    const overlay = document.createElement('div');
    overlay.style.cssText = 'position: absolute; inset: 0; z-index: 4; pointer-events: none; color: #111;';

    const statusBar = document.createElement('div');
    statusBar.style.cssText = `position: absolute; top: ${topInset}px; left: ${horizontalInset}px; right: ${horizontalInset}px; display: flex; align-items: center; justify-content: space-between; font-family: -apple-system, BlinkMacSystemFont, sans-serif; font-size: 15px; font-weight: 700; letter-spacing: -0.2px;`;

    const timeLabel = document.createElement('div');
    timeLabel.textContent = getLocalDeviceTime();
    timeLabel.style.cssText = 'display: inline-flex; align-items: center; justify-content: center; min-width: 84px; height: 30px; padding: 0 11px 0 9px; border-radius: 999px; background: rgba(18,18,18,0.96); color: #fff; font-size: 13px; font-weight: 700; letter-spacing: 0;';

    const statusIcons = document.createElement('div');
    statusIcons.style.cssText = 'display: flex; align-items: center; gap: 8px; height: 30px; padding: 0 10px 0 12px; border-radius: 999px; background: rgba(18,18,18,0.96); font-size: 12px; font-weight: 700; color: #fff;';

    const signal = document.createElement('div');
    signal.style.cssText = 'display: flex; align-items: flex-end; gap: 2px; height: 14px;';
    [5, 7, 9, 11].forEach((barHeight) => {
      const bar = document.createElement('span');
      bar.style.cssText = `display: block; width: 2.2px; height: ${barHeight}px; background: currentColor; border-radius: 2px;`;
      signal.appendChild(bar);
    });

    const wifi = createIcon('<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.1" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12.55a11 11 0 0 1 14.08 0"/><path d="M8.53 16.11a6 6 0 0 1 6.95 0"/><path d="M12 20h.01"/><path d="M2 8.82a16 16 0 0 1 20 0"/></svg>');

    const battery = document.createElement('div');
    battery.style.cssText = 'position: relative; width: 26px; height: 13px; border: 1.8px solid currentColor; border-radius: 4px; box-sizing: border-box;';

    const batteryCap = document.createElement('div');
    batteryCap.style.cssText = 'position: absolute; top: 3px; right: -3px; width: 2px; height: 6px; background: currentColor; border-radius: 0 2px 2px 0;';

    const batteryLevel = document.createElement('div');
    batteryLevel.style.cssText = 'position: absolute; top: 1.6px; left: 1.8px; width: 15px; height: 7.5px; background: currentColor; border-radius: 2px;';

    battery.appendChild(batteryCap);
    battery.appendChild(batteryLevel);

    statusIcons.appendChild(signal);
    statusIcons.appendChild(wifi);
    statusIcons.appendChild(battery);

    statusBar.appendChild(timeLabel);
    statusBar.appendChild(statusIcons);

    const homeIndicator = document.createElement('div');
    homeIndicator.style.cssText = `position: absolute; left: 50%; bottom: ${Math.max(8, Math.round(screenHeight * 0.009))}px; transform: translateX(-50%); width: ${Math.round(screenWidth * 0.32)}px; height: 4px; background: rgba(17,17,17,0.8); border-radius: 999px;`;

    overlay.appendChild(statusBar);
    overlay.appendChild(homeIndicator);

    const timeTimer = window.setInterval(() => {
      timeLabel.textContent = getLocalDeviceTime();
    }, 30000);

    function applyTheme(baseColor) {
      const fallbackColor = baseColor || { r: 245, g: 245, b: 245, a: 1 };
      const isDark = getColorLuminance(fallbackColor) < 140;
      const pillBackground = isDark
        ? colorToRgba(mixColors(fallbackColor, { r: 0, g: 0, b: 0, a: 0.24 }), 0.94)
        : colorToRgba(mixColors(fallbackColor, { r: 255, g: 255, b: 255, a: 0.24 }), 0.94);
      const foreground = isDark ? '#f7f7f7' : '#181818';

      timeLabel.textContent = getLocalDeviceTime();
      timeLabel.style.background = pillBackground;
      timeLabel.style.color = foreground;
      statusIcons.style.background = pillBackground;
      statusIcons.style.color = foreground;
    }

    return {
      overlay,
      applyTheme,
      cleanup() {
        window.clearInterval(timeTimer);
      }
    };
  }

  function createAndroidStatusOverlay(screenWidth, screenHeight) {
    const horizontalInset = Math.max(10, Math.round(screenWidth * 0.028));
    const topInset = Math.max(5, Math.round(screenHeight * 0.006));

    const overlay = document.createElement('div');
    overlay.style.cssText = 'position: absolute; inset: 0; z-index: 4; pointer-events: none; color: #5c5c5c; font-family: Roboto, Arial, sans-serif;';

    const statusBg = document.createElement('div');
    statusBg.style.cssText = 'position: absolute; top: 0; left: 0; right: 0; height: 30px; background: rgba(246,246,246,0.92); backdrop-filter: blur(10px);';

    const statusBar = document.createElement('div');
    statusBar.style.cssText = `position: absolute; top: ${topInset}px; left: ${horizontalInset}px; right: ${horizontalInset}px; display: flex; align-items: center; justify-content: space-between; font-size: 10px; font-weight: 700; letter-spacing: 0;`;

    const timeLabel = document.createElement('div');
    timeLabel.textContent = getLocalDeviceTime();
    timeLabel.style.cssText = 'font-size: 12px; font-weight: 700; color: #5a5a5a; padding-left: 4px;';

    const rightSide = document.createElement('div');
    rightSide.style.cssText = 'display: flex; align-items: center; gap: 4px; color: #6a6a6a;';

    const silentIcon = createIcon('<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17 9.34a4 4 0 0 1 0 5.32"/><path d="M19.07 4.93a10 10 0 0 1 0 14.14"/><path d="M9 9v6"/><path d="m3 3 18 18"/></svg>');
    const wifiIcon = createIcon('<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12.55a11 11 0 0 1 14.08 0"/><path d="M8.53 16.11a6 6 0 0 1 6.95 0"/><path d="M12 20h.01"/><path d="M2 8.82a16 16 0 0 1 20 0"/></svg>');

    const mobileSignal = document.createElement('div');
    mobileSignal.style.cssText = 'display: flex; align-items: flex-end; gap: 1px; height: 10px;';
    [3, 5, 7, 9].forEach((barHeight) => {
      const bar = document.createElement('span');
      bar.style.cssText = `display: block; width: 1.6px; height: ${barHeight}px; background: currentColor; border-radius: 2px;`;
      mobileSignal.appendChild(bar);
    });

    const batteryWrap = document.createElement('div');
    batteryWrap.style.cssText = 'display: flex; align-items: center; justify-content: center; min-width: 28px; height: 16px; padding: 0 6px; background: rgba(164,164,164,0.9); color: white; border-radius: 999px; font-size: 10px; font-weight: 700;';
    batteryWrap.textContent = '16';

    const batteryGroup = document.createElement('div');
    batteryGroup.style.cssText = 'display: flex; align-items: center; padding-right: 4px;';
    batteryGroup.appendChild(batteryWrap);

    rightSide.appendChild(silentIcon);
    rightSide.appendChild(wifiIcon);
    rightSide.appendChild(mobileSignal);
    rightSide.appendChild(batteryGroup);

    statusBar.appendChild(timeLabel);
    statusBar.appendChild(rightSide);

    overlay.appendChild(statusBg);
    overlay.appendChild(statusBar);

    const timeTimer = window.setInterval(() => {
      timeLabel.textContent = getLocalDeviceTime();
    }, 30000);

    function applyTheme(baseColor) {
      const isDark = getColorLuminance(baseColor) < 140;
      const foreground = isDark ? '#f4f4f4' : '#5c5c5c';
      const secondary = isDark ? 'rgba(255,255,255,0.78)' : 'rgba(92,92,92,0.92)';
      const badgeBg = isDark ? 'rgba(255,255,255,0.22)' : 'rgba(164,164,164,0.9)';
      const barBg = isDark
        ? colorToRgba(baseColor, 0.88)
        : colorToRgba(baseColor, 0.92);

      overlay.style.color = foreground;
      statusBg.style.background = `linear-gradient(180deg, ${barBg} 0%, ${colorToRgba(baseColor, isDark ? 0.82 : 0.88)} 100%)`;
      statusBg.style.borderBottom = 'none';
      timeLabel.textContent = getLocalDeviceTime();
      timeLabel.style.color = foreground;
      rightSide.style.color = secondary;
      batteryWrap.style.background = badgeBg;
      batteryWrap.style.color = isDark ? '#fff' : '#f8f8f8';
    }

    return {
      overlay,
      applyTheme,
      cleanup() {
        window.clearInterval(timeTimer);
      }
    };
  }

  const existing = document.getElementById('mobile-simulator-container');
  let preservedScrollState = null;
  if (existing) {
    if (typeof existing._cleanup === 'function') {
      existing._cleanup();
    }
    preservedScrollState = existing._scrollState || null;
    existing.remove();
  }

  const nameLower = deviceName.toLowerCase();
  const isIPhone = nameLower.includes('iphone');
  const isSamsung = nameLower.includes('samsung') || nameLower.includes('galaxy');
  const isAndroid = isSamsung || nameLower.includes('pixel');
  const isTablet = nameLower.includes('ipad');
  const hasIPhoneNotch = isIPhone && !nameLower.includes('se');

  const sideBezel = 4;
  const topBezel = 6;
  const bottomBezel = 6;
  const phoneWidth = width + (sideBezel * 2);
  const phoneHeight = height + topBezel + bottomBezel;

  const isSmallScreen = window.innerWidth < 1024;
  const maxHeight = window.innerHeight - 80;
  const maxWidth = isSmallScreen ? (window.innerWidth - 80) : (window.innerWidth - 380);
  const scale = Math.min(maxHeight / phoneHeight, maxWidth / phoneWidth, 1);
  const topOverlayInset = showFrame
    ? (isAndroid ? 30 : ((isIPhone && hasIPhoneNotch) ? 36 : 0))
    : 0;

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
  container.style.cssText = `position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: #0a0a0a; z-index: 999998; display: flex; align-items: center; justify-content: center; ${isSmallScreen ? 'flex-direction: column;' : 'gap: 40px;'}`;

  let drawerOpen = false;
  const drawerToggle = document.createElement('button');

  if (isSmallScreen) {
    drawerToggle.style.cssText = 'position: fixed; top: 20px; left: 20px; z-index: 999999; background: rgba(102, 126, 234, 0.95); color: white; border: none; padding: 12px 16px; border-radius: 12px; font-size: 14px; font-weight: 600; cursor: pointer; box-shadow: 0 4px 12px rgba(0,0,0,0.3); font-family: -apple-system, sans-serif;';
    drawerToggle.textContent = 'Controls';
    drawerToggle.onclick = () => {
      drawerOpen = !drawerOpen;
      controlPanel.style.transform = drawerOpen ? 'translateX(0)' : 'translateX(-100%)';
      drawerToggle.textContent = drawerOpen ? 'Close' : 'Controls';
    };
    container.appendChild(drawerToggle);
  }

  const controlPanel = document.createElement('div');

  if (isSmallScreen) {
    controlPanel.style.cssText = 'position: fixed; left: 0; top: 0; height: 100%; width: 300px; max-width: 85vw; display: flex; flex-direction: column; gap: 20px; padding: 70px 20px 20px; background: rgba(26, 26, 26, 0.98); backdrop-filter: blur(20px); border-right: 1px solid rgba(255,255,255,0.1); box-shadow: 4px 0 24px rgba(0,0,0,0.5); z-index: 999999; overflow-y: auto; transform: translateX(-100%); transition: transform 0.3s ease;';
  } else {
    controlPanel.style.cssText = 'display: flex; flex-direction: column; gap: 20px; padding: 30px; background: rgba(26, 26, 26, 0.8); backdrop-filter: blur(20px); border-radius: 24px; border: 1px solid rgba(255,255,255,0.1); box-shadow: 0 12px 48px rgba(0,0,0,0.6); max-width: 280px;';
  }

  const title = document.createElement('div');
  title.style.cssText = 'font-family: -apple-system, sans-serif; font-size: 18px; font-weight: 700; color: white; margin-bottom: 10px;';
  title.textContent = 'Mobile Simulator';

  const deviceInfo = document.createElement('div');
  deviceInfo.style.cssText = 'font-family: -apple-system, sans-serif; font-size: 13px; color: #888; margin-bottom: 10px;';
  deviceInfo.innerHTML = `<span style="color: #3b82f6; font-weight: 600;">${deviceName}</span><br>${width} x ${height}px`;

  const selectLabel = document.createElement('div');
  selectLabel.style.cssText = 'font-family: -apple-system, sans-serif; font-size: 11px; color: #888; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 12px;';
  selectLabel.textContent = 'Select Device';

  const deviceSelectWrapper = document.createElement('div');
  deviceSelectWrapper.style.cssText = 'position: relative; margin-bottom: 16px;';

  const deviceSelectCtrl = document.createElement('select');
  deviceSelectCtrl.style.cssText = 'background: rgba(255,255,255,0.1); color: white; border: 1px solid rgba(255,255,255,0.2); padding: 14px 40px 14px 16px; border-radius: 12px; font-size: 14px; font-family: -apple-system, sans-serif; cursor: pointer; outline: none; width: 100%; appearance: none;';

  const iphoneGroup = document.createElement('optgroup');
  iphoneGroup.label = 'iPhone';

  const samsungGroup = document.createElement('optgroup');
  samsungGroup.label = 'Samsung';

  const androidGroup = document.createElement('optgroup');
  androidGroup.label = 'Android';

  const tabletGroup = document.createElement('optgroup');
  tabletGroup.label = 'Tablets';

  devicesList.forEach((device) => {
    const option = document.createElement('option');
    option.value = device.name;
    option.textContent = device.name;
    option.style.background = '#1a1a1a';
    option.style.color = 'white';

    if (device.name === deviceName) {
      option.selected = true;
    }

    if (device.name.includes('iPhone')) {
      iphoneGroup.appendChild(option);
    } else if (device.name.includes('Samsung') || device.name.includes('Galaxy')) {
      samsungGroup.appendChild(option);
    } else if (device.name.includes('Pixel')) {
      androidGroup.appendChild(option);
    } else if (device.name.includes('iPad')) {
      tabletGroup.appendChild(option);
    }
  });

  deviceSelectCtrl.appendChild(iphoneGroup);
  deviceSelectCtrl.appendChild(samsungGroup);
  deviceSelectCtrl.appendChild(androidGroup);
  deviceSelectCtrl.appendChild(tabletGroup);

  const dropdownArrow = document.createElement('div');
  dropdownArrow.textContent = 'v';
  dropdownArrow.style.cssText = 'position: absolute; right: 16px; top: 50%; transform: translateY(-50%); color: #888; font-size: 10px; pointer-events: none;';

  deviceSelectWrapper.appendChild(deviceSelectCtrl);
  deviceSelectWrapper.appendChild(dropdownArrow);

  deviceSelectCtrl.addEventListener('change', () => {
    const selected = devicesList.find((d) => d.name === deviceSelectCtrl.value);
    if (!selected) return;

    resizeViewport(selected.width, selected.height, selected.name, showFrame);

    if (isSmallScreen) {
      drawerOpen = false;
      controlPanel.style.transform = 'translateX(-100%)';
      drawerToggle.textContent = 'Controls';
    }
  });

  const controlsLabel = document.createElement('div');
  controlsLabel.style.cssText = 'font-family: -apple-system, sans-serif; font-size: 11px; color: #888; text-transform: uppercase; letter-spacing: 0.5px; margin-top: 10px; margin-bottom: 8px;';
  controlsLabel.textContent = 'Controls';

  const rotateButton = document.createElement('button');
  rotateButton.innerHTML = '<span>Rotate</span>';
  rotateButton.style.cssText = 'background: rgba(59, 130, 246, 0.15); color: #3b82f6; border: 1px solid rgba(59, 130, 246, 0.3); padding: 12px 20px; border-radius: 12px; font-size: 14px; font-family: -apple-system, sans-serif; cursor: pointer; width: 100%; text-align: left; font-weight: 500;';
  rotateButton.onmouseover = () => {
    rotateButton.style.background = 'rgba(59, 130, 246, 0.25)';
  };
  rotateButton.onmouseout = () => {
    rotateButton.style.background = 'rgba(59, 130, 246, 0.15)';
  };
  rotateButton.addEventListener('click', () => {
    resizeViewport(height, width, deviceName, showFrame);

    if (isSmallScreen) {
      drawerOpen = false;
      controlPanel.style.transform = 'translateX(-100%)';
      drawerToggle.textContent = 'Controls';
    }
  });

  const frameButton = document.createElement('button');
  frameButton.innerHTML = `<span>${showFrame ? 'Hide' : 'Show'} Frame</span>`;
  frameButton.style.cssText = 'background: rgba(255,255,255,0.08); color: white; border: 1px solid rgba(255,255,255,0.2); padding: 12px 20px; border-radius: 12px; font-size: 14px; font-family: -apple-system, sans-serif; cursor: pointer; width: 100%; text-align: left; font-weight: 500;';
  frameButton.onmouseover = () => {
    frameButton.style.background = 'rgba(255,255,255,0.15)';
  };
  frameButton.onmouseout = () => {
    frameButton.style.background = 'rgba(255,255,255,0.08)';
  };
  frameButton.addEventListener('click', () => {
    resizeViewport(width, height, deviceName, !showFrame);

    if (isSmallScreen) {
      drawerOpen = false;
      controlPanel.style.transform = 'translateX(-100%)';
      drawerToggle.textContent = 'Controls';
    }
  });

  const closeButton = document.createElement('button');
  closeButton.innerHTML = '<span>Close</span>';
  closeButton.style.cssText = 'background: rgba(239, 68, 68, 0.15); color: #ef4444; border: 1px solid rgba(239, 68, 68, 0.3); padding: 12px 20px; border-radius: 12px; font-size: 14px; font-family: -apple-system, sans-serif; cursor: pointer; width: 100%; text-align: left; font-weight: 500; margin-top: 10px;';
  closeButton.onmouseover = () => {
    closeButton.style.background = 'rgba(239, 68, 68, 0.25)';
  };
  closeButton.onmouseout = () => {
    closeButton.style.background = 'rgba(239, 68, 68, 0.15)';
  };
  closeButton.addEventListener('click', () => {
    resetViewport();
  });

  controlPanel.appendChild(title);
  controlPanel.appendChild(deviceInfo);
  controlPanel.appendChild(selectLabel);
  controlPanel.appendChild(deviceSelectWrapper);
  controlPanel.appendChild(controlsLabel);
  controlPanel.appendChild(rotateButton);
  controlPanel.appendChild(frameButton);
  controlPanel.appendChild(closeButton);

  const mockupWrapper = document.createElement('div');
  mockupWrapper.style.cssText = `display: flex; align-items: center; justify-content: center; ${isSmallScreen ? 'width: 100%; height: 100%;' : ''}`;

  const mockup = document.createElement('div');

  if (isIPhone) {
    mockup.style.cssText = `position: relative; width: ${phoneWidth}px; height: ${phoneHeight}px; background: linear-gradient(145deg, #6f3f2d 0%, #b46e4d 22%, #f0ba93 52%, #9a5f45 78%, #573126 100%); border-radius: 38px; padding: ${topBezel}px ${sideBezel}px ${bottomBezel}px ${sideBezel}px; transform: scale(${scale}); box-shadow: 0 0 0 1px #532d21, 0 0 0 3px #8a563f, 0 0 0 5px #d79a76, 0 50px 120px rgba(0,0,0,0.75), inset 0 1px 2px rgba(255,255,255,0.35), inset 0 -6px 12px rgba(72,35,24,0.35);`;
  } else if (isAndroid) {
    mockup.style.cssText = `position: relative; width: ${phoneWidth}px; height: ${phoneHeight}px; background: linear-gradient(145deg, #2a2a2a, #1a1a1a); border-radius: 24px; padding: ${topBezel}px ${sideBezel}px ${bottomBezel}px ${sideBezel}px; transform: scale(${scale}); box-shadow: 0 0 0 1px #0a0a0a, 0 0 0 3px #1a1a1a, 0 0 0 5px #2a2a2a, 0 50px 120px rgba(0,0,0,0.9), inset 0 1px 1px rgba(255,255,255,0.05);`;
  } else {
    mockup.style.cssText = `position: relative; width: ${phoneWidth}px; height: ${phoneHeight}px; background: linear-gradient(145deg, #1f1f1f, #2d2d2d); border-radius: 38px; padding: ${topBezel}px ${sideBezel}px ${bottomBezel}px ${sideBezel}px; transform: scale(${scale}); box-shadow: 0 0 0 2px #0a0a0a, 0 0 0 6px #1a1a1a, 0 0 0 8px #333, 0 50px 120px rgba(0,0,0,0.9), inset 0 1px 2px rgba(255,255,255,0.1);`;
  }

  if (showFrame) {
    if (isIPhone) {
      const dynamicIsland = document.createElement('div');
      dynamicIsland.style.cssText = 'position: absolute; top: 10px; left: 50%; transform: translateX(-50%); width: 126px; height: 30px; background: linear-gradient(180deg, #151515 0%, #050505 100%); border-radius: 999px; z-index: 10; box-shadow: inset 0 1px 1px rgba(255,255,255,0.08);';

      const islandCamera = document.createElement('div');
      islandCamera.style.cssText = 'position: absolute; top: 10px; left: calc(50% + 40px); width: 10px; height: 10px; background: radial-gradient(circle, #203c8a 20%, #0a0a0a 65%); border-radius: 50%; z-index: 11;';

      const islandSensor = document.createElement('div');
      islandSensor.style.cssText = 'position: absolute; top: 16px; left: calc(50% - 28px); width: 40px; height: 4px; background: rgba(255,255,255,0.08); border-radius: 999px; z-index: 11;';

      mockup.appendChild(dynamicIsland);
      mockup.appendChild(islandCamera);
      mockup.appendChild(islandSensor);
    } else if (isAndroid) {
      const punchHole = document.createElement('div');
      punchHole.style.cssText = 'position: absolute; top: 13px; left: 50%; transform: translateX(-50%); width: 10px; height: 10px; background: #0a0a0a; border-radius: 50%; z-index: 10;';

      const camera = document.createElement('div');
      camera.style.cssText = 'position: absolute; top: 15px; left: 50%; transform: translateX(-50%); width: 6px; height: 6px; background: radial-gradient(circle, #1e40af 30%, #0a0a0a 70%); border-radius: 50%; z-index: 11;';

      mockup.appendChild(punchHole);
      mockup.appendChild(camera);
    }

    const powerBtn = document.createElement('div');
    powerBtn.style.cssText = `position: absolute; right: -3px; top: 120px; width: 3px; height: 70px; background: ${isIPhone ? 'linear-gradient(90deg, #6e3f2d, #d9a07c)' : 'linear-gradient(90deg, #0a0a0a, #1a1a1a)'}; border-radius: 0 2px 2px 0;`;

    const volumeUp = document.createElement('div');
    volumeUp.style.cssText = `position: absolute; left: -3px; top: 100px; width: 3px; height: 50px; background: ${isIPhone ? 'linear-gradient(270deg, #6e3f2d, #d9a07c)' : 'linear-gradient(270deg, #0a0a0a, #1a1a1a)'}; border-radius: 2px 0 0 2px;`;

    const volumeDown = document.createElement('div');
    volumeDown.style.cssText = `position: absolute; left: -3px; top: 160px; width: 3px; height: 50px; background: ${isIPhone ? 'linear-gradient(270deg, #6e3f2d, #d9a07c)' : 'linear-gradient(270deg, #0a0a0a, #1a1a1a)'}; border-radius: 2px 0 0 2px;`;

    mockup.appendChild(powerBtn);
    mockup.appendChild(volumeUp);
    mockup.appendChild(volumeDown);
  }

  const screenRadius = isIPhone ? '30px' : (isAndroid ? '18px' : '32px');
  const screen = document.createElement('div');
  screen.style.cssText = `position: relative; width: ${width}px; height: ${height}px; background: white; border-radius: ${showFrame ? screenRadius : '8px'}; overflow: hidden; box-shadow: inset 0 0 20px rgba(0,0,0,0.1);`;

  const iframe = document.createElement('iframe');
  iframe.style.cssText = `position: absolute; top: ${topOverlayInset}px; left: 0; width: ${width}px; height: ${height - topOverlayInset}px; border: none; background: white; border-radius: 0 0 ${showFrame ? screenRadius : '8px'} ${showFrame ? screenRadius : '8px'};`;
  let topOverlayControls = null;

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
      style.textContent = `html, body { width: ${width}px !important; min-height: ${height}px !important; margin: 0 !important; padding: 0 !important; overflow-x: hidden !important; box-sizing: border-box !important; } ::-webkit-scrollbar { width: 0; height: 0; } * { scrollbar-width: none; -ms-overflow-style: none; }`;
      iframeDoc.head.appendChild(style);

      if (topOverlayControls && iframe.contentWindow) {
        const syncTopStatusBar = () => {
          topOverlayControls.applyTheme(getThemeAwareTopColor(iframe.contentWindow, width));
        };

        let framePending = false;
        const scheduleSync = () => {
          if (framePending) {
            return;
          }

          framePending = true;
          iframe.contentWindow.requestAnimationFrame(() => {
            framePending = false;
            syncTopStatusBar();
          });
        };

        syncTopStatusBar();
        iframe.contentWindow.addEventListener('scroll', scheduleSync, { passive: true });
        iframe.contentWindow.addEventListener('resize', scheduleSync);

        if (iframeDoc.body) {
          const observer = new MutationObserver(scheduleSync);
          observer.observe(iframeDoc.body, { attributes: true, childList: true, subtree: true });
        }
      }
    } catch (e) {
      // ignore cross-origin styling limits
    }
  };

  iframe.src = window.location.href;
  screen.appendChild(iframe);

  if (showFrame && isIPhone && hasIPhoneNotch) {
    topOverlayControls = createIPhoneStatusOverlay(width, height);
    screen.appendChild(topOverlayControls.overlay);
  }

  if (showFrame && isAndroid) {
    topOverlayControls = createAndroidStatusOverlay(width, height);
    screen.appendChild(topOverlayControls.overlay);
  }

  mockup.appendChild(screen);
  mockupWrapper.appendChild(mockup);

  if (!isSmallScreen) {
    container.appendChild(controlPanel);
  }

  container.appendChild(mockupWrapper);

  if (isSmallScreen) {
    container.appendChild(controlPanel);
  }

  container._scrollState = preservedScrollState || captureScrollState();
  container._cleanup = () => {
    if (topOverlayControls && typeof topOverlayControls.cleanup === 'function') {
      topOverlayControls.cleanup();
    }
  };

  document.body.appendChild(container);
  applyScrollLock();
}

function resetViewport() {
  const container = document.getElementById('mobile-simulator-container');

  if (container) {
    if (typeof container._cleanup === 'function') {
      container._cleanup();
    }
    const scrollState = container._scrollState || {};
    container.remove();
    document.body.style.overflow = scrollState.bodyOverflow || '';
    document.body.style.overscrollBehavior = scrollState.bodyOverscrollBehavior || '';
    document.documentElement.style.overflow = scrollState.docOverflow || '';
    document.documentElement.style.overscrollBehavior = scrollState.docOverscrollBehavior || '';
    return;
  }
}

globalThis.__mobileSimulatorResizeViewport = resizeViewport;
globalThis.__mobileSimulatorResetViewport = resetViewport;
