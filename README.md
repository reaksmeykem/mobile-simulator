# Mobile Simulator Chrome Extension

A Chrome extension to simulate mobile devices for testing responsive designs.

## Installation

### Step 1: Generate Icons
1. Open `create-icons.html` in your browser
2. Click "Download All Icons" button
3. Save the three PNG files (`icon16.png`, `icon48.png`, `icon128.png`) to the `icons/` folder

### Step 2: Load Extension
1. Open Chrome and navigate to `chrome://extensions/`
2. Enable "Developer mode" (toggle in top right)
3. Click "Load unpacked"
4. Select the `mobile-simulator` folder

## ⚠️ IMPORTANT: Where It Works

The extension **CANNOT** work on:
- `chrome://` pages (like chrome://extensions/)
- `chrome-extension://` pages  
- Browser internal pages
- `edge://` or `about:` pages

It **ONLY** works on regular websites like:
- google.com
- github.com
- Your own website
- Any normal webpage

## How to Use

### Quick Start:
1. **Open a regular website** (e.g., https://www.google.com)
2. Click the 📱 extension icon in your toolbar
3. Select a device (e.g., "Samsung Galaxy S24")
4. The page will display in a mobile viewport!

### Features:
- **Device Selector**: Choose from 16 different devices organized by category
- **Rotate**: Switch between portrait/landscape
- **Show/Hide Frame**: Toggle realistic phone mockup with notch/punch-hole camera
- **Close**: Return to normal desktop view

## Testing Steps

```
1. Navigate to: https://www.google.com
2. Click the Mobile Simulator icon (📱)
3. Select "iPhone 15 Pro" from dropdown
4. You should see Google in a 393×852 mobile viewport
5. Click "Rotate" to test landscape mode
6. Click "Close" to return to normal view
```

## Troubleshooting

**Extension not working?**
1. ✅ Make sure you're on a regular website (NOT chrome:// pages)
2. 🔄 Reload the extension from chrome://extensions/
3. 🔄 Refresh the webpage and try again
4. 🔍 Open DevTools (F12) and check console for errors

**After making code changes:**
1. Go to `chrome://extensions/`
2. Click the reload icon (🔄) on Mobile Simulator
3. Close and reopen the extension popup
4. Navigate to a test website

## Supported Devices

### Latest Models (2026-2027)
- iPhone 17 Pro (402×874)
- iPhone 16 Pro (402×874)
- iPhone 16 (393×852)
- Samsung Galaxy S26 (360×800)
- Samsung Galaxy S25 (360×800)

### Previous Models
- iPhone 15 Pro, iPhone 15, iPhone 14 Pro, iPhone 14, iPhone SE
- Samsung Galaxy S24, S23
- Google Pixel 8
- iPad Pro 12.9", iPad Air, iPad Mini

## Device Mockups

The extension features realistic device mockups:
- **iPhone**: Notch design with rounded corners (48px radius)
- **Samsung/Android**: Punch-hole camera with less rounded corners (32px radius)
- **iPad**: Tablet design with moderate rounding (38px radius)
- **Minimal bezels**: 4px sides, 6px top/bottom for realistic appearance
- **Physical buttons**: Power and volume buttons on device frame
