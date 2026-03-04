# 🔧 Fix "Failed to load extension" Icon Error

## The Problem
Chrome extensions require PNG icon files, but they haven't been generated yet.

## Quick Fix (Choose ONE method)

### ⚡ Method 1: Auto-Download (FASTEST)
1. Open `generate-icons-simple.html` in your browser
2. Wait 1 second - 3 PNG files will auto-download
3. Move the downloaded files to `mobile-simulator/icons/` folder:
   - `icon16.png`
   - `icon48.png`
   - `icon128.png`
4. Go back to Chrome → click "Retry" button

### 🐍 Method 2: Python Script (AUTOMATIC)
**Windows:**
```bash
cd mobile-simulator
generate-icons.bat
```

**Mac/Linux:**
```bash
cd mobile-simulator
python3 generate_icons.py
```

Icons will be automatically created in the `icons/` folder.
Then go to Chrome → click "Retry" button.

### 🎨 Method 3: Manual with UI
1. Open `create-icons.html` in your browser
2. Click "Download All Icons" button
3. Save all 3 PNG files to `mobile-simulator/icons/` folder
4. Go back to Chrome → click "Retry" button

## Verify Icons Are Created

Check that these files exist in `mobile-simulator/icons/`:
- ✅ icon16.png
- ✅ icon48.png
- ✅ icon128.png

## After Generating Icons

1. Go to `chrome://extensions/`
2. Find "Mobile Simulator" 
3. Click the "Retry" button in the error dialog
4. OR click the reload icon (🔄) on the extension card
5. Extension should now load successfully!

## Still Having Issues?

1. Make sure the PNG files are in the correct location: `mobile-simulator/icons/`
2. Make sure filenames are exactly: `icon16.png`, `icon48.png`, `icon128.png` (lowercase)
3. Try removing and re-adding the extension:
   - Click "Remove" on the extension
   - Click "Load unpacked" again
   - Select the `mobile-simulator` folder
