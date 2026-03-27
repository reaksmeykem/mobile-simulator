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
    
    // Create a style element to hide scrollbars globally on the host page
    let style = document.getElementById('mobile-simulator-scrollbar-lock');
    if (!style) {
      style = document.createElement('style');
      style.id = 'mobile-simulator-scrollbar-lock';
      style.textContent = `
        html, body { 
          overflow: hidden !important; 
          overscroll-behavior: none !important;
          scrollbar-width: none !important;
          -ms-overflow-style: none !important;
        }
        ::-webkit-scrollbar {
          width: 0 !important;
          height: 0 !important;
          display: none !important;
        }
        #mobile-simulator-container iframe::-webkit-scrollbar {
          width: 0 !important;
          height: 0 !important;
          display: none !important;
        }
      `;
      document.head.appendChild(style);
    }
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
    const isLandscape = screenWidth > screenHeight;
    const horizontalInset = Math.max(24, Math.round(screenWidth * 0.07));
    const statusBarHeight = isLandscape ? 0 : 54;
    const statusContentTop = 10;

    const overlay = document.createElement('div');
    overlay.style.cssText = 'position: absolute; inset: 0; z-index: 100; pointer-events: none; color: #fff;';

    // Hide status bar entirely in landscape to avoid cluttering safe areas awkwardly
    if (isLandscape) return { overlay, applyTheme: () => {}, cleanup: () => {} };

    // Background bar behind the status bar — ensures icons are always visible
    const statusBg = document.createElement('div');
    statusBg.style.cssText = `position: absolute; top: 0; left: 0; right: 0; height: ${statusBarHeight}px; background: transparent; z-index: 99;`;

    const statusBar = document.createElement('div');
    statusBar.style.cssText = `position: absolute; top: ${statusContentTop}px; left: ${horizontalInset}px; right: ${horizontalInset}px; height: 24px; display: flex; align-items: center; justify-content: space-between; font-family: -apple-system, BlinkMacSystemFont, sans-serif; font-size: 13.5px; font-weight: 700; letter-spacing: -0.2px; z-index: 101; color: #fff;`;

    const timeLabel = document.createElement('div');
    timeLabel.textContent = getLocalDeviceTime();
    timeLabel.style.cssText = 'display: inline-flex; align-items: center; justify-content: center; min-width: 54px; height: 24px; padding: 0 4px 0 8px; color: currentColor; font-size: 13px; font-weight: 700; letter-spacing: -0.01em; position: relative; z-index: 102;';

    const statusIcons = document.createElement('div');
    statusIcons.style.cssText = 'display: flex; align-items: center; gap: 5px; height: 24px; padding: 0 6px 0 4px; font-size: 12px; font-weight: 700; color: currentColor; position: relative; z-index: 102;';

    const signal = document.createElement('div');
    signal.style.cssText = 'display: flex; align-items: flex-end; gap: 1.6px; height: 12px; color: currentColor;';
    [4, 6, 8, 10].forEach((barHeight) => {
      const bar = document.createElement('span');
      bar.style.cssText = `display: block; width: 2.3px; height: ${barHeight}px; background: currentColor; border-radius: 999px; opacity: 0.98;`;
      signal.appendChild(bar);
    });

    const wifi = createIcon('<svg width="15" height="11" viewBox="0 0 15 11" fill="none" xmlns="http://www.w3.org/2000/svg"><path fill="currentColor" d="M7.5 10.7a1.2 1.2 0 1 0 0-2.4 1.2 1.2 0 0 0 0 2.4Zm3.07-2.12a.72.72 0 0 1-1.01 0 2.94 2.94 0 0 0-4.12 0 .72.72 0 1 1-1.01-1.04 4.38 4.38 0 0 1 6.14 0 .72.72 0 0 1 0 1.04Zm2.2-2.24a.72.72 0 0 1-1.02 0 6.06 6.06 0 0 0-8.5 0 .72.72 0 1 1-1.02-1.04 7.5 7.5 0 0 1 10.54 0 .72.72 0 0 1 0 1.04Zm1.93-2.2a.72.72 0 0 1-1.02 0 8.81 8.81 0 0 0-12.37 0 .72.72 0 1 1-1.02-1.04 10.25 10.25 0 0 1 14.41 0 .72.72 0 0 1 0 1.04Z"/></svg>');
    wifi.style.cssText = 'display: flex; align-items: center; justify-content: center; width: 15px; height: 12px; color: currentColor;';

    const battery = document.createElement('div');
    battery.style.cssText = 'position: relative; width: 24px; height: 12px; border: 1.65px solid currentColor; border-radius: 3.8px; box-sizing: border-box; color: currentColor;';

    const batteryCap = document.createElement('div');
    batteryCap.style.cssText = 'position: absolute; top: 3.1px; right: -3.2px; width: 2.4px; height: 5px; background: currentColor; border-radius: 0 2px 2px 0; opacity: 0.95;';

    const batteryLevel = document.createElement('div');
    batteryLevel.style.cssText = 'position: absolute; top: 1.55px; left: 1.6px; width: 15.4px; height: 5.9px; background: currentColor; border-radius: 2.3px;';

    battery.appendChild(batteryCap);
    battery.appendChild(batteryLevel);

    statusIcons.appendChild(signal);
    statusIcons.appendChild(wifi);
    statusIcons.appendChild(battery);

    statusBar.appendChild(timeLabel);
    statusBar.appendChild(statusIcons);

    const homeIndicator = document.createElement('div');
    homeIndicator.style.cssText = `position: absolute; left: 50%; bottom: ${Math.max(8, Math.round(screenHeight * 0.009))}px; transform: translateX(-50%); width: ${Math.round(screenWidth * 0.31)}px; height: 4.5px; background: rgba(255,255,255,0.92); border-radius: 999px; box-shadow: 0 1px 1px rgba(0,0,0,0.14);`;

    overlay.appendChild(statusBg);
    overlay.appendChild(statusBar);
    overlay.appendChild(homeIndicator);

    const timeTimer = window.setInterval(() => {
      timeLabel.textContent = getLocalDeviceTime();
    }, 30000);

    function applyTheme(baseColor) {
      const fallbackColor = baseColor || { r: 245, g: 245, b: 245, a: 1 };
      const isDark = getColorLuminance(fallbackColor) < 140;
      const foreground = isDark ? '#ffffff' : 'rgba(0,0,0,0.94)';
      statusBg.style.background = 'transparent';

      overlay.style.color = foreground;
      statusBar.style.color = foreground;
      statusBar.style.textShadow = isDark ? '0 1px 2px rgba(0,0,0,0.45)' : '0 1px 1px rgba(255,255,255,0.25)';
      timeLabel.textContent = getLocalDeviceTime();
      timeLabel.style.color = foreground;
      statusIcons.style.color = foreground;
      signal.style.color = foreground;
      battery.style.borderColor = foreground;
      batteryLevel.style.backgroundColor = foreground;
      batteryCap.style.backgroundColor = foreground;

      homeIndicator.style.background = isDark ? 'rgba(255,255,255,0.92)' : 'rgba(17,17,17,0.78)';
      homeIndicator.style.boxShadow = isDark ? '0 1px 1px rgba(0,0,0,0.28)' : '0 1px 1px rgba(255,255,255,0.18)';
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
    overlay.style.cssText = 'position: absolute; inset: 0; z-index: 100; pointer-events: none; color: #5c5c5c; font-family: Roboto, Arial, sans-serif;';

    const statusBg = document.createElement('div');
    statusBg.style.cssText = 'position: absolute; top: 0; left: 0; right: 0; height: 30px; background: rgba(246,246,246,0.92); backdrop-filter: blur(10px); z-index: 99;';

    const statusBar = document.createElement('div');
    statusBar.style.cssText = `position: absolute; top: ${topInset}px; left: ${horizontalInset}px; right: ${horizontalInset}px; display: flex; align-items: center; justify-content: space-between; font-size: 10px; font-weight: 700; letter-spacing: 0; z-index: 101;`;

    const timeLabel = document.createElement('div');
    timeLabel.textContent = getLocalDeviceTime();
    timeLabel.style.cssText = 'font-size: 12px; font-weight: 700; color: #5a5a5a; padding-left: 4px;';

    const rightSide = document.createElement('div');
    rightSide.style.cssText = 'display: flex; align-items: center; gap: 4px; color: #6a6a6a;';

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
    batteryWrap.textContent = '100%';

    const batteryGroup = document.createElement('div');
    batteryGroup.style.cssText = 'display: flex; align-items: center; padding-right: 4px;';
    batteryGroup.appendChild(batteryWrap);

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
      const fallbackColor = baseColor || { r: 245, g: 245, b: 245, a: 1 };
      const isDark = getColorLuminance(fallbackColor) < 140;
      const foreground = isDark ? '#f4f4f4' : '#1a1a1a';
      const secondary = isDark ? 'rgba(255,255,255,0.78)' : 'rgba(40,40,40,0.92)';
      const badgeBg = isDark ? 'rgba(255,255,255,0.22)' : 'rgba(120,120,120,0.85)';
      const badgeText = '#ffffff';
      const barBg = isDark
        ? colorToRgba(fallbackColor, 0.88)
        : colorToRgba(fallbackColor, 0.92);

      // Update all containers and children explicitly
      overlay.style.color = foreground;
      statusBar.style.color = foreground;
      statusBg.style.background = `linear-gradient(180deg, ${barBg} 0%, ${colorToRgba(fallbackColor, isDark ? 0.82 : 0.88)} 100%)`;
      statusBg.style.borderBottom = 'none';
      timeLabel.textContent = getLocalDeviceTime();
      timeLabel.style.color = foreground;
      rightSide.style.color = secondary;
      mobileSignal.style.color = secondary;
      batteryWrap.style.background = badgeBg;
      batteryWrap.style.color = badgeText;
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
  const isMacBook = nameLower.includes('macbook');
  const hasIPhoneNotch = isIPhone && !nameLower.includes('se');

  const isLandscape = width > height;

  const sideBezel = isMacBook ? 16 : (isIPhone ? 7 : (isTablet ? 8 : 6));
  const topBezel = isMacBook ? 18 : (isIPhone ? 7 : (isTablet ? 8 : 6));
  const bottomBezel = isMacBook ? 30 : (isIPhone ? 7 : (isTablet ? 8 : 6));
  const phoneWidth = width + (sideBezel * 2);
  const phoneHeight = height + topBezel + bottomBezel;

  const isSmallScreen = window.innerWidth < 1024;
  const maxHeight = window.innerHeight - 80;
  const maxWidth = isSmallScreen ? (window.innerWidth - 80) : (window.innerWidth - 380);
  const scale = Math.min(maxHeight / phoneHeight, maxWidth / phoneWidth, 1);
  const topOverlayInset = showFrame
    ? (isAndroid ? 30 : (isTablet ? 30 : ((isIPhone && hasIPhoneNotch && !isLandscape) ? 48 : 0)))
    : 0;

  const devicesList = [
    { name: 'iPhone 17 Pro', width: 402, height: 874 },
    { name: 'Samsung Galaxy S26', width: 360, height: 800 },
    { name: 'iPad Air', width: 820, height: 1180 },
    { name: 'MacBook Air 13"', width: 1280, height: 832 },
    { name: 'MacBook Air 15"', width: 1440, height: 932 }
  ];

  const container = document.createElement('div');
  container.id = 'mobile-simulator-container';
  container.style.cssText = `position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: #0a0a0a; z-index: 999998; display: flex; align-items: center; justify-content: center; ${isSmallScreen ? 'flex-direction: column;' : 'gap: 40px;'}`;

  let drawerOpen = false;

  const drawerToggle = document.createElement('button');
  drawerToggle.style.cssText = 'position: fixed; bottom: 30px; right: 30px; width: 60px; height: 60px; border-radius: 50%; z-index: 999999; background: #ec4899; color: white; border: none; cursor: pointer; box-shadow: 0 4px 20px rgba(236, 72, 153, 0.4); display: flex; align-items: center; justify-content: center; transition: transform 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275), background 0.3s; padding: 0; outline: none;';
  drawerToggle.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="4" y1="21" x2="4" y2="14"></line><line x1="4" y1="10" x2="4" y2="3"></line><line x1="12" y1="21" x2="12" y2="12"></line><line x1="12" y1="8" x2="12" y2="3"></line><line x1="20" y1="21" x2="20" y2="16"></line><line x1="20" y1="12" x2="20" y2="3"></line><line x1="1" y1="14" x2="7" y2="14"></line><line x1="9" y1="8" x2="15" y2="8"></line><line x1="17" y1="16" x2="23" y2="16"></line></svg>';

  const controlPanel = document.createElement('div');
  controlPanel.style.cssText = 'position: fixed; bottom: 100px; right: 30px; width: 320px; display: flex; flex-direction: column; gap: 20px; padding: 30px; background: rgba(22, 22, 22, 0.95); backdrop-filter: blur(20px); border-radius: 24px; border: 1px solid rgba(255,255,255,0.08); box-shadow: 0 20px 40px rgba(0,0,0,0.6); z-index: 999999; opacity: 0; pointer-events: none; transform: translateY(20px); transition: all 0.3s cubic-bezier(0.165, 0.84, 0.44, 1);';

  drawerToggle.onclick = () => {
    drawerOpen = !drawerOpen;
    if (drawerOpen) {
      controlPanel.style.opacity = '1';
      controlPanel.style.pointerEvents = 'auto';
      controlPanel.style.transform = 'translateY(0)';
      drawerToggle.style.transform = 'rotate(180deg)';
      drawerToggle.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>';
      drawerToggle.style.background = '#4b5563';
    } else {
      controlPanel.style.opacity = '0';
      controlPanel.style.pointerEvents = 'none';
      controlPanel.style.transform = 'translateY(20px)';
      drawerToggle.style.transform = 'rotate(0deg)';
      drawerToggle.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="4" y1="21" x2="4" y2="14"></line><line x1="4" y1="10" x2="4" y2="3"></line><line x1="12" y1="21" x2="12" y2="12"></line><line x1="12" y1="8" x2="12" y2="3"></line><line x1="20" y1="21" x2="20" y2="16"></line><line x1="20" y1="12" x2="20" y2="3"></line><line x1="1" y1="14" x2="7" y2="14"></line><line x1="9" y1="8" x2="15" y2="8"></line><line x1="17" y1="16" x2="23" y2="16"></line></svg>';
      drawerToggle.style.background = '#ec4899';
    }
  };
  
  container.appendChild(drawerToggle);

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
  deviceSelectWrapper.style.cssText = 'position: relative; margin-bottom: 16px; font-family: -apple-system, sans-serif;';

  const selectedDeviceObj = devicesList.find(d => d.name === deviceName) || devicesList[0];

  const devicePickerButton = document.createElement('button');
  devicePickerButton.style.cssText = 'width: 100%; padding: 14px 16px; background: rgba(53,50,56,0.3); background-image: linear-gradient(180deg, #353238 0%, #27252b 100%); border: 1px solid rgba(255,255,255,0.2); border-radius: 14px; color: white; display: flex; align-items: center; justify-content: space-between; cursor: pointer; transition: border-color 0.2s; box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.06); outline: none;';
  
  const devicePickerCopy = document.createElement('div');
  devicePickerCopy.style.cssText = 'display: flex; flex-direction: column; align-items: flex-start; gap: 3px; text-align: left;';

  const pickerName = document.createElement('strong');
  pickerName.style.cssText = 'font-size: 14px; font-weight: 700; color: #ffffff; margin: 0; padding: 0; line-height: 1;';
  pickerName.textContent = selectedDeviceObj.name.toUpperCase();

  const pickerMeta = document.createElement('small');
  pickerMeta.style.cssText = 'font-size: 11px; color: #9ca3af; font-weight: 600; text-transform: uppercase; letter-spacing: 0.04em; margin: 0; padding: 0; line-height: 1;';
  pickerMeta.textContent = `${selectedDeviceObj.width} x ${selectedDeviceObj.height}px`;

  devicePickerCopy.appendChild(pickerName);
  devicePickerCopy.appendChild(pickerMeta);

  const pickerIcon = document.createElement('span');
  pickerIcon.style.cssText = 'width: 18px; height: 18px; color: #8f8a97; display: inline-flex; align-items: center; justify-content: center; font-size: 14px;';
  pickerIcon.textContent = 'v';

  devicePickerButton.appendChild(devicePickerCopy);
  devicePickerButton.appendChild(pickerIcon);

  const devicePickerPanel = document.createElement('div');
  devicePickerPanel.style.cssText = 'display: none; position: absolute; top: 100%; left: 0; width: 100%; max-height: 250px; overflow-y: auto; background: #ffffff; border: 1px solid rgba(124, 156, 255, 0.58); border-top: none; border-radius: 0 0 14px 14px; box-shadow: 0 14px 28px rgba(0,0,0,0.3); z-index: 10;';

  const DEVICE_PICKER_ICON_SVG = '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5"><rect width="12.5" height="18.5" x="5.75" y="2.75" rx="3"></rect><path d="M11 17.75h2"></path></svg>';
  const MAC_ICON = '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5"><rect width="20" height="14" x="2" y="3" rx="2"></rect><line x1="2" y1="21" x2="22" y2="21"></line></svg>';

  devicesList.forEach((device) => {
    const optionBtn = document.createElement('button');
    const isActive = device.name === deviceName;
    
    optionBtn.style.cssText = `width: 100%; padding: 10px 14px; border: none; border-bottom: 1px solid #e5e7eb; border-radius: 0; background: ${isActive ? '#2d6cdf' : '#ffffff'}; color: ${isActive ? '#ffffff' : '#111827'}; display: flex; align-items: center; justify-content: flex-start; gap: 10px; cursor: pointer; transition: background 0.2s; outline: none; margin: 0;`;
    optionBtn.onmouseover = () => { if (!isActive) optionBtn.style.background = '#f4f6fb'; };
    optionBtn.onmouseout = () => { if (!isActive) optionBtn.style.background = '#ffffff'; };

    const isMac = device.name.toLowerCase().includes('macbook');
    const iconBox = document.createElement('span');
    iconBox.style.cssText = 'width: 18px; height: 28px; display: flex; align-items: center; justify-content: center; flex: 0 0 auto; color: currentColor;';
    iconBox.innerHTML = isMac ? MAC_ICON : DEVICE_PICKER_ICON_SVG;

    const optCopy = document.createElement('div');
    optCopy.style.cssText = 'display: flex; flex-direction: column; align-items: flex-start; text-align: left; gap: 2px;';

    const optName = document.createElement('strong');
    optName.style.cssText = 'font-size: 13px; font-weight: 600; margin: 0; padding: 0; line-height: 1;';
    optName.textContent = device.name;

    const optMeta = document.createElement('small');
    optMeta.style.cssText = `font-size: 11px; margin: 0; padding: 0; line-height: 1; color: ${isActive ? 'rgba(255,255,255,0.7)' : '#6b7280'};`;
    optMeta.textContent = `${device.width} x ${device.height}`;

    optCopy.appendChild(optName);
    optCopy.appendChild(optMeta);
    optionBtn.appendChild(iconBox);
    optionBtn.appendChild(optCopy);

    optionBtn.addEventListener('click', () => {
      // Before resizing, if there is an iframe, get its current URL to preserve it
      let currentUrl = window.location.href;
      try {
        const currentIframe = container.querySelector('iframe');
        if (currentIframe && currentIframe.contentWindow && currentIframe.contentWindow.location.href !== 'about:blank') {
          currentUrl = currentIframe.contentWindow.location.href;
        }
      } catch (e) {
        // use host URL if cross-origin
      }
      
      resizeViewport(device.width, device.height, device.name, showFrame);
      
      // Update the iframe with the last known URL to avoid resetting to homepage
      try {
        const newIframe = document.getElementById('mobile-simulator-container').querySelector('iframe');
        if (newIframe) {
          newIframe.src = currentUrl;
        }
      } catch (e) {
        // ignore
      }
    });

    devicePickerPanel.appendChild(optionBtn);
  });

  devicePickerButton.onclick = () => {
    const isObjHidden = !devicePickerPanel.style.display || devicePickerPanel.style.display === 'none';
    devicePickerPanel.style.display = isObjHidden ? 'block' : 'none';
    devicePickerButton.style.borderRadius = isObjHidden ? '14px 14px 0 0' : '14px';
    devicePickerButton.style.borderColor = isObjHidden ? '#7c9cff' : 'rgba(255,255,255,0.2)';
    pickerIcon.style.transform = isObjHidden ? 'rotate(180deg)' : 'rotate(0deg)';
  };

  deviceSelectWrapper.appendChild(devicePickerButton);
  deviceSelectWrapper.appendChild(devicePickerPanel);


  

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
    // Before resizing, if there is an iframe, get its current URL to preserve it
    let currentUrl = window.location.href;
    try {
      const currentIframe = container.querySelector('iframe');
      if (currentIframe && currentIframe.contentWindow && currentIframe.contentWindow.location.href !== 'about:blank') {
        currentUrl = currentIframe.contentWindow.location.href;
      }
    } catch (e) {
      // ignore
    }

    resizeViewport(height, width, deviceName, showFrame);

    // Update the iframe with the last known URL
    try {
      const newIframe = document.getElementById('mobile-simulator-container').querySelector('iframe');
      if (newIframe) {
        newIframe.src = currentUrl;
      }
    } catch (e) {
      // ignore
    }

    drawerOpen = false;
    controlPanel.style.opacity = '0';
    controlPanel.style.pointerEvents = 'none';
    controlPanel.style.transform = 'translateY(20px)';
    drawerToggle.style.transform = 'rotate(0deg)';
    drawerToggle.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="4" y1="21" x2="4" y2="14"></line><line x1="4" y1="10" x2="4" y2="3"></line><line x1="12" y1="21" x2="12" y2="12"></line><line x1="12" y1="8" x2="12" y2="3"></line><line x1="20" y1="21" x2="20" y2="16"></line><line x1="20" y1="12" x2="20" y2="3"></line><line x1="1" y1="14" x2="7" y2="14"></line><line x1="9" y1="8" x2="15" y2="8"></line><line x1="17" y1="16" x2="23" y2="16"></line></svg>';
    drawerToggle.style.background = '#ec4899';
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

    drawerOpen = false;
    controlPanel.style.opacity = '0';
    controlPanel.style.pointerEvents = 'none';
    controlPanel.style.transform = 'translateY(20px)';
    drawerToggle.style.transform = 'rotate(0deg)';
    drawerToggle.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="4" y1="21" x2="4" y2="14"></line><line x1="4" y1="10" x2="4" y2="3"></line><line x1="12" y1="21" x2="12" y2="12"></line><line x1="12" y1="8" x2="12" y2="3"></line><line x1="20" y1="21" x2="20" y2="16"></line><line x1="20" y1="12" x2="20" y2="3"></line><line x1="1" y1="14" x2="7" y2="14"></line><line x1="9" y1="8" x2="15" y2="8"></line><line x1="17" y1="16" x2="23" y2="16"></line></svg>';
    drawerToggle.style.background = '#ec4899';
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
    mockup.style.cssText = `position: relative; width: ${phoneWidth}px; height: ${phoneHeight}px; background: linear-gradient(145deg, #6e7075 0%, #242529 18%, #0b0b0d 47%, #3a3d42 82%, #9a9ea3 100%); border-radius: 54px; padding: ${topBezel}px ${sideBezel}px ${bottomBezel}px ${sideBezel}px; transform: scale(${scale}); box-shadow: 0 0 0 1px rgba(255,255,255,0.14), 0 0 0 2px #111214, 0 0 0 4px #45484e, 0 45px 110px rgba(0,0,0,0.72), inset 0 1px 0 rgba(255,255,255,0.34), inset 0 -10px 16px rgba(0,0,0,0.34);`;
  } else if (isTablet) {
    mockup.style.cssText = `position: relative; width: ${phoneWidth}px; height: ${phoneHeight}px; background: linear-gradient(145deg, #3a3a3c 0%, #2c2c2e 50%, #1c1c1e 100%); border-radius: 28px; padding: ${topBezel}px ${sideBezel}px ${bottomBezel}px ${sideBezel}px; transform: scale(${scale}); box-shadow: 0 0 0 1px #1a1a1a, 0 0 0 3px #2c2c2e, 0 50px 120px rgba(0,0,0,0.8), inset 0 1px 1px rgba(255,255,255,0.12);`;
  } else if (isAndroid) {
    mockup.style.cssText = `position: relative; width: ${phoneWidth}px; height: ${phoneHeight}px; background: linear-gradient(145deg, #2a2a2a, #1a1a1a); border-radius: 28px; padding: ${topBezel}px ${sideBezel}px ${bottomBezel}px ${sideBezel}px; transform: scale(${scale}); box-shadow: 0 0 0 1px #0a0a0a, 0 0 0 3px #1a1a1a, 0 0 0 5px #2a2a2a, 0 50px 120px rgba(0,0,0,0.9), inset 0 1px 1px rgba(255,255,255,0.05);`;
  } else {
    mockup.style.cssText = `position: relative; width: ${phoneWidth}px; height: ${phoneHeight}px; background: linear-gradient(145deg, #1f1f1f, #2d2d2d); border-radius: 48px; padding: ${topBezel}px ${sideBezel}px ${bottomBezel}px ${sideBezel}px; transform: scale(${scale}); box-shadow: 0 0 0 2px #0a0a0a, 0 0 0 6px #1a1a1a, 0 0 0 8px #333, 0 50px 120px rgba(0,0,0,0.9), inset 0 1px 2px rgba(255,255,255,0.1);`;
  }

  if (showFrame) {
    if (isIPhone) {
      // Dynamic Island — positioned relative to the screen, not the mockup bezel
      if (isLandscape) {
        // Rotated 90deg and on the left side
        const diLeft = sideBezel + 8;
        const dynamicIsland = document.createElement('div');
        dynamicIsland.style.cssText = `position: absolute; top: 50%; left: ${diLeft}px; transform: translateY(-50%); width: 34px; height: 118px; background: linear-gradient(90deg, #131314 0%, #030303 100%); border-radius: 999px; z-index: 200;`;

        const islandCamera = document.createElement('div');
        islandCamera.style.cssText = `position: absolute; top: calc(50% - 42px); left: ${diLeft + 7}px; width: 9px; height: 9px; background: radial-gradient(circle, #3157b3 12%, #121318 48%, #040404 75%); border-radius: 50%; z-index: 201; box-shadow: inset 0 0 2px rgba(255,255,255,0.15);`;

        mockup.appendChild(dynamicIsland);
        mockup.appendChild(islandCamera);
      } else {
        const diTop = topBezel + 7;
        const dynamicIsland = document.createElement('div');
        dynamicIsland.style.cssText = `position: absolute; top: ${diTop}px; left: 50%; transform: translateX(-50%); width: 118px; height: 30px; background: linear-gradient(180deg, #151517 0%, #050505 100%); border-radius: 999px; z-index: 200;`;

        const islandCamera = document.createElement('div');
        islandCamera.style.cssText = `position: absolute; top: ${diTop + 6}px; left: calc(50% + 36px); width: 8px; height: 8px; background: radial-gradient(circle, #3157b3 12%, #121318 48%, #040404 75%); border-radius: 50%; z-index: 201; box-shadow: inset 0 0 2px rgba(255,255,255,0.15);`;

        const islandSensor = document.createElement('div');
        islandSensor.style.cssText = `position: absolute; top: ${diTop + 13}px; left: calc(50% - 27px); width: 39px; height: 3px; background: rgba(255,255,255,0.08); border-radius: 999px; z-index: 201;`;

        mockup.appendChild(dynamicIsland);
        mockup.appendChild(islandCamera);
        mockup.appendChild(islandSensor);
      }
    } else if (isMacBook) {
      const camera = document.createElement('div');
      camera.style.cssText = 'position: absolute; top: 7px; left: 50%; transform: translateX(-50%); width: 4.5px; height: 4.5px; background: radial-gradient(circle, #203c8a 30%, #111 75%); border-radius: 50%; z-index: 11; box-shadow: 0 0 0 0.5px #2a2a2a;';
      mockup.appendChild(camera);

      const deviceLogo = document.createElement('div');
      deviceLogo.style.cssText = `position: absolute; bottom: 8px; left: 50%; transform: translateX(-50%); font-family: -apple-system, sans-serif; font-size: 11px; font-weight: 500; color: rgba(255, 255, 255, 0.4); letter-spacing: 0.6px; z-index: 10;`;
      deviceLogo.textContent = 'MacBook Air';
      mockup.appendChild(deviceLogo);
      
      const bottomBase = document.createElement('div');
      bottomBase.style.cssText = `position: absolute; bottom: -12px; left: -80px; right: -80px; height: 12px; background: linear-gradient(180deg, #b0b4b8 0%, #767c85 100%); border-radius: 2px 2px 14px 14px; box-shadow: inset 0 2px 3px rgba(255,255,255,0.6), 0 15px 30px rgba(0,0,0,0.7); z-index: -1;`;
      const thumbScoop = document.createElement('div');
      thumbScoop.style.cssText = 'position: absolute; top: 0; left: 50%; transform: translateX(-50%); width: 110px; height: 5px; background: #5a6169; border-radius: 0 0 6px 6px; box-shadow: inset 0 2px 4px rgba(0,0,0,0.5);';
      bottomBase.appendChild(thumbScoop);
      mockup.appendChild(bottomBase);
    } else if (isAndroid) {
      const punchHole = document.createElement('div');
      punchHole.style.cssText = `position: absolute; top: ${topBezel + 7}px; left: 50%; transform: translateX(-50%); width: 10px; height: 10px; background: #0a0a0a; border-radius: 50%; z-index: 200;`;

      const camera = document.createElement('div');
      camera.style.cssText = `position: absolute; top: ${topBezel + 9}px; left: 50%; transform: translateX(-50%); width: 6px; height: 6px; background: radial-gradient(circle, #1e40af 30%, #0a0a0a 70%); border-radius: 50%; z-index: 201;`;

      mockup.appendChild(punchHole);
      mockup.appendChild(camera);
    } else if (isTablet) {
      const camera = document.createElement('div');
      camera.style.cssText = `position: absolute; top: ${topBezel + 8}px; left: 50%; transform: translateX(-50%); width: 7px; height: 7px; background: radial-gradient(circle, #203c8a 30%, #111 75%); border-radius: 50%; z-index: 200; box-shadow: 0 0 0 1px #2a2a2a;`;
      mockup.appendChild(camera);
    }

    if (!isMacBook) {
      if (isLandscape) {
        // Reposition hardware buttons for landscape
        const powerBtn = document.createElement('div');
        powerBtn.style.cssText = `position: absolute; top: -3px; right: 120px; width: 70px; height: 3px; background: ${isIPhone ? 'linear-gradient(180deg, #5f636a, #0b0b0d)' : 'linear-gradient(180deg, #0a0a0a, #1a1a1a)'}; border-radius: 2px 2px 0 0;`;

        const volumeUp = document.createElement('div');
        volumeUp.style.cssText = `position: absolute; bottom: -3px; right: 100px; width: 50px; height: 3px; background: ${isIPhone ? 'linear-gradient(0deg, #5f636a, #0b0b0d)' : 'linear-gradient(0deg, #0a0a0a, #1a1a1a)'}; border-radius: 0 0 2px 2px;`;

        const volumeDown = document.createElement('div');
        volumeDown.style.cssText = `position: absolute; bottom: -3px; right: 160px; width: 50px; height: 3px; background: ${isIPhone ? 'linear-gradient(0deg, #5f636a, #0b0b0d)' : 'linear-gradient(0deg, #0a0a0a, #1a1a1a)'}; border-radius: 0 0 2px 2px;`;

        mockup.appendChild(powerBtn);
        mockup.appendChild(volumeUp);
        mockup.appendChild(volumeDown);
      } else {
        const powerBtn = document.createElement('div');
        powerBtn.style.cssText = `position: absolute; right: -3px; top: 126px; width: 3px; height: 78px; background: ${isIPhone ? 'linear-gradient(90deg, #5f636a, #0b0b0d)' : 'linear-gradient(90deg, #0a0a0a, #1a1a1a)'}; border-radius: 0 2px 2px 0;`;

        const actionBtn = isIPhone ? document.createElement('div') : null;
        if (actionBtn) {
          actionBtn.style.cssText = 'position: absolute; left: -3px; top: 82px; width: 3px; height: 30px; background: linear-gradient(270deg, #5f636a, #0b0b0d); border-radius: 2px 0 0 2px;';
        }

        const volumeUp = document.createElement('div');
        volumeUp.style.cssText = `position: absolute; left: -3px; top: 128px; width: 3px; height: 54px; background: ${isIPhone ? 'linear-gradient(270deg, #5f636a, #0b0b0d)' : 'linear-gradient(270deg, #0a0a0a, #1a1a1a)'}; border-radius: 2px 0 0 2px;`;

        const volumeDown = document.createElement('div');
        volumeDown.style.cssText = `position: absolute; left: -3px; top: 190px; width: 3px; height: 54px; background: ${isIPhone ? 'linear-gradient(270deg, #5f636a, #0b0b0d)' : 'linear-gradient(270deg, #0a0a0a, #1a1a1a)'}; border-radius: 2px 0 0 2px;`;

        mockup.appendChild(powerBtn);
        if (actionBtn) {
          mockup.appendChild(actionBtn);
        }
        mockup.appendChild(volumeUp);
        mockup.appendChild(volumeDown);
      }
    }
  }

  const screenRadius = isMacBook ? '8px 8px 0 0' : (isIPhone ? '42px' : (isTablet ? '20px' : (isAndroid ? '20px' : '32px')));
  const screen = document.createElement('div');
  screen.style.cssText = `position: relative; width: ${width}px; height: ${height}px; background: white; border-radius: ${showFrame ? screenRadius : '8px'}; overflow: hidden; box-shadow: ${isIPhone ? '0 0 0 1px rgba(255,255,255,0.06), inset 0 0 0 1px rgba(255,255,255,0.05), inset 0 0 24px rgba(0,0,0,0.16)' : 'inset 0 0 20px rgba(0,0,0,0.1)'};`;

  const iframe = document.createElement('iframe');
  iframe.style.cssText = `position: absolute; top: ${topOverlayInset}px; left: 0; width: ${width}px; height: ${height - topOverlayInset}px; border: none; background: white; border-radius: 0 0 ${showFrame && !isMacBook ? screenRadius : '0'} ${showFrame && !isMacBook ? screenRadius : '0'}; visibility: hidden; scrollbar-width: none; -ms-overflow-style: none;`;
  let topOverlayControls = null;

  // Sync navigation state from iframe to outer window so refreshes retain correct URL
  // Only sync for same-origin pages — syncing cross-origin URLs breaks iframe navigation
  const initialOrigin = window.location.origin;
  const syncInnerToOuterNav = () => {
    try {
      if (iframe.contentWindow && iframe.contentWindow.location) {
        const innerUrl = iframe.contentWindow.location.href;
        const outerUrl = window.location.href;
        if (innerUrl && innerUrl !== 'about:blank' && innerUrl !== outerUrl) {
          const innerOrigin = new URL(innerUrl).origin;
          // Only sync if same-origin — cross-origin sync breaks iframe navigation
          if (innerOrigin === initialOrigin) {
            window.history.replaceState(null, '', innerUrl);
          }
        }
      }
    } catch(e) {
      // Cross-origin — cannot access iframe location, skip sync
    }
  };

  const navSyncInterval = setInterval(syncInnerToOuterNav, 500);

  // Detect when iframe navigates cross-origin (e.g. external link inside iframe)
  let iframeIsSameOrigin = true;
  const crossOriginCheckInterval = setInterval(() => {
    try {
      iframe.contentDocument;
      iframeIsSameOrigin = true;
    } catch (e) {
      iframeIsSameOrigin = false;
    }
  }, 1000);

  // Update storage with current simulation state
  try {
    const currentSim = {
      width,
      height,
      deviceName,
      showFrame
    };
    chrome.storage.local.get(['activeSimulations'], (result) => {
      const activeSimulations = result.activeSimulations || {};
      const tabIdStr = 'current'; // We'll use a placeholder or handle it via messaging if tabId isn't known
      // Better: send a message to background to update the storage for this tab
      chrome.runtime.sendMessage({
        type: 'UPDATE_SIMULATION_STATE',
        simulation: currentSim
      });
    });
  } catch (e) {
    // Ignore if chrome.runtime is not available
  }

  iframe.onload = function() {
    syncInnerToOuterNav();

    // Check if iframe is same-origin before trying to access contentDocument
    let isSameOrigin = false;
    try {
      isSameOrigin = !!iframe.contentDocument;
    } catch (e) {
      isSameOrigin = false;
    }

    if (!isSameOrigin) {
      // Cross-origin: the iframe navigated to an external URL.
      // Most external sites block iframe embedding via X-Frame-Options or CSP,
      // which causes "refused to connect" errors. Redirect the top window
      // to that URL so the user can actually view the site.
      try {
        // Try to get the URL the iframe navigated to
        const iframeUrl = iframe.contentWindow.location.href;
        if (iframeUrl && iframeUrl !== 'about:blank') {
          window.top.location.href = iframeUrl;
          return;
        }
      } catch (e) {
        // Can't access cross-origin location — use the iframe's src attribute as fallback
        if (iframe.src && iframe.src !== 'about:blank') {
          const srcOrigin = new URL(iframe.src).origin;
          if (srcOrigin !== initialOrigin) {
            window.top.location.href = iframe.src;
            return;
          }
        }
      }
      // Fallback: just reveal it (for same-scheme cross-origin that might still work)
      iframe.style.visibility = 'visible';
      return;
    }

    try {
      const iframeDoc = iframe.contentDocument;
      
      // Prevent recursion if this is somehow called again
      if (iframeDoc._simulatorInjected) return;
      iframeDoc._simulatorInjected = true;

      let viewportMeta = iframeDoc.querySelector('meta[name="viewport"]');

      if (!viewportMeta) {
        viewportMeta = iframeDoc.createElement('meta');
        viewportMeta.name = 'viewport';
        iframeDoc.head.appendChild(viewportMeta);
      }

      viewportMeta.content = `width=${width}, initial-scale=1.0, maximum-scale=1.0, user-scalable=no`;

      const style = iframeDoc.createElement('style');
      style.textContent = `html, body { width: ${width}px !important; height: ${height}px !important; min-height: ${height}px !important; margin: 0 !important; padding: 0 !important; box-sizing: border-box !important; overflow: auto !important; scrollbar-width: none !important; -ms-overflow-style: none !important; } ::-webkit-scrollbar { width: 0 !important; height: 0 !important; display: none !important; } * { scrollbar-width: none !important; -ms-overflow-style: none !important; }`;
      iframeDoc.head.appendChild(style);

      // Reveal iframe only after CSS has been injected to prevent scrollbar/content flash
      iframe.style.visibility = 'visible';

      // Inject external link interceptor into the IFRAME document — redirects
      // window.top for cross-origin links so the browser navigates to the
      // external URL instead of trying to load it inside the iframe (which
      // would fail for sites that set X-Frame-Options or CSP frame-ancestors).
      try {
        const currentOrigin = initialOrigin;
        iframeDoc.addEventListener('click', function(e) {
          var a = e.target && (e.target.closest ? e.target.closest('a') : null);
          if (!a || !a.href) return;
          try {
            var linkUrl = new URL(a.href, iframe.contentWindow.location.href);
            if (linkUrl.origin !== currentOrigin) {
              // External link — navigate the top window so it actually loads
              e.preventDefault();
              e.stopPropagation();
              e.stopImmediatePropagation();
              window.top.location.href = linkUrl.href;
            } else if (a.target === '_blank') {
              // Same-origin link with target=_blank — navigate within iframe
              // instead of opening a new tab (which would be outside the simulator)
              e.preventDefault();
              e.stopPropagation();
              iframe.contentWindow.location.href = linkUrl.href;
            }
          } catch(err) {}
        }, true);

        // Also intercept window.open calls for external URLs
        const origOpen = iframe.contentWindow.open;
        iframe.contentWindow.open = function(url, target, features) {
          try {
            if (url) {
              var linkUrl = new URL(url, iframe.contentWindow.location.href);
              if (linkUrl.origin !== currentOrigin) {
                window.top.location.href = linkUrl.href;
                return null;
              }
            }
          } catch(err) {}
          return origOpen.call(this, url, target, features);
        };
      } catch (e) { /* ignore if injection fails */ }

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
      // Fallback: reveal iframe even if CSS injection fails
      iframe.style.visibility = 'visible';
    }
  };

  iframe.src = window.location.href;
  screen.appendChild(iframe);

  if (showFrame && isIPhone && hasIPhoneNotch) {
    topOverlayControls = createIPhoneStatusOverlay(width, height);
    screen.appendChild(topOverlayControls.overlay);
  } else if (showFrame && isIPhone && !hasIPhoneNotch) {
    // For iPhone SE or older, we still show the status bar but with a background
    topOverlayControls = createAndroidStatusOverlay(width, height); // Reuse Android's as it has a BG
    screen.appendChild(topOverlayControls.overlay);
  }

  if (showFrame && isTablet) {
    topOverlayControls = createAndroidStatusOverlay(width, height);
    screen.appendChild(topOverlayControls.overlay);
  }

  if (showFrame && isAndroid) {
    topOverlayControls = createAndroidStatusOverlay(width, height);
    screen.appendChild(topOverlayControls.overlay);
  }

  // Ensure topOverlayControls is valid for sync
  if (topOverlayControls && typeof topOverlayControls.applyTheme === 'function') {
    topOverlayControls.applyTheme({ r: 245, g: 245, b: 245, a: 1 });
  }

  mockup.appendChild(screen);
  mockupWrapper.appendChild(mockup);

  container.appendChild(controlPanel);
  container.appendChild(mockupWrapper);

  container._scrollState = preservedScrollState || captureScrollState();
  container._cleanup = () => {
    clearInterval(navSyncInterval);
    clearInterval(crossOriginCheckInterval);
    if (topOverlayControls && typeof topOverlayControls.cleanup === 'function') {
      topOverlayControls.cleanup();
    }
  };

  applyScrollLock();
  document.body.appendChild(container);
}

function resetViewport() {
  const container = document.getElementById('mobile-simulator-container');

  if (container) {
    if (typeof container._cleanup === 'function') {
      container._cleanup();
    }
    const scrollState = container._scrollState || {};
    container.remove();
    
    // Remove the global scrollbar lock style
    const style = document.getElementById('mobile-simulator-scrollbar-lock');
    if (style) {
      style.remove();
    }
    
    document.body.style.overflow = scrollState.bodyOverflow || '';
    document.body.style.overscrollBehavior = scrollState.bodyOverscrollBehavior || '';
    document.documentElement.style.overflow = scrollState.docOverflow || '';
    document.documentElement.style.overscrollBehavior = scrollState.docOverscrollBehavior || '';

    // Clear simulation from storage so it doesn't reapply on refresh
    try {
      chrome.runtime.sendMessage({ type: 'CLOSE_SIMULATION' }, () => {
        if (chrome.runtime.lastError) { /* ignore */ }
      });
    } catch (e) { /* ignore */ }

    return;
  }
}

globalThis.__mobileSimulatorResizeViewport = resizeViewport;
globalThis.__mobileSimulatorResetViewport = resetViewport;
