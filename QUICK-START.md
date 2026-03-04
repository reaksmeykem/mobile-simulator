# 🚀 Quick Start Guide

## 📋 What You Need to Do

### 1. Generate Icons (Required!)
The extension needs PNG icon files to work properly in Chrome.

**Choose ONE of these methods:**

#### Method A: Browser (Easiest)
1. Open `generate-icons-simple.html` in your browser
2. Icons will auto-download (3 files)
3. Move them to `mobile-simulator/icons/` folder

#### Method B: Python Script (Automatic)
1. Double-click `generate-icons.bat` (Windows)
2. Or run: `python generate_icons.py`
3. Icons are automatically saved to the correct folder

#### Method C: Manual with UI
1. Open `create-icons.html` in your browser
2. Click "Download All Icons" button
3. Save the 3 PNG files to `mobile-simulator/icons/` folder:
   - `icon16.png`
   - `icon48.png`
   - `icon128.png`

### 2. Load Extension in Chrome

1. Open Chrome and go to `chrome://extensions/`
2. Enable "Developer mode" (toggle in top right)
3. Click "Load unpacked"
4. Select the `mobile-simulator` folder
5. Done! The extension icon should appear in your toolbar

### 3. Test It

1. Go to any website (e.g., https://google.com)
2. Click the 📱 extension icon
3. Select a device (e.g., "iPhone 17 Pro")
4. Enjoy your mobile simulator!

## ⚠️ Important Notes

- Only works on regular websites (NOT chrome:// pages)
- Must generate icons first (step 1 above)
- If you make code changes, reload the extension from chrome://extensions/

## 🎯 Features

- 16 devices: iPhone 17/16/15/14/SE, Samsung S26/S25/S24/S23, Pixel 8, iPad Pro/Air/Mini
- Realistic mockups with notch (iPhone) or punch-hole camera (Samsung/Android)
- Rotate between portrait/landscape
- Toggle device frame on/off
- Organized device selector by category

## 📖 More Info

- See `instructions.html` for detailed setup guide
- See `README.md` for full documentation
