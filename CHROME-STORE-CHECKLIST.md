# Chrome Web Store Submission Checklist

## ✅ Required Files

### 1. Icons (MUST HAVE)
- [ ] `icons/icon16.png` (16×16 pixels)
- [ ] `icons/icon48.png` (48×48 pixels)
- [ ] `icons/icon128.png` (128×128 pixels)

**Generate icons using:**
- Open `START-HERE.html` → Click "Auto-Generate Icons"
- Or run `python generate_icons.py`
- Or open `create-icons.html` → Download manually

### 2. Store Assets (Required for Chrome Web Store)
Create these promotional images:

- [ ] **Small Promo Tile**: 440×280 pixels (PNG or JPEG)
- [ ] **Large Promo Tile**: 920×680 pixels (PNG or JPEG)  
- [ ] **Marquee Promo Tile**: 1400×560 pixels (PNG or JPEG)
- [ ] **Screenshots**: At least 1, up to 5 (1280×800 or 640×400 pixels)

### 3. Store Listing Information
- [ ] **Name**: Mobile Simulator (or your chosen name)
- [ ] **Summary**: Short description (132 characters max)
- [ ] **Description**: Detailed description of features
- [ ] **Category**: Developer Tools
- [ ] **Language**: English (or your language)
- [ ] **Privacy Policy**: URL (if collecting user data)

## 📋 Pre-Submission Checklist

### Extension Files
- [ ] All icon PNG files exist in `icons/` folder
- [ ] `manifest.json` is valid (no syntax errors)
- [ ] `popup.html` loads correctly
- [ ] `popup.js` has no errors
- [ ] `styles.css` is included

### Testing
- [ ] Extension loads without errors in Chrome
- [ ] Device selector shows all devices
- [ ] Simulator works on regular websites
- [ ] Rotate function works
- [ ] Frame toggle works
- [ ] Settings are saved and restored
- [ ] Reset button works

### Manifest Requirements
- [ ] `manifest_version: 3` (required)
- [ ] Valid `name` (45 characters max)
- [ ] Valid `description` (132 characters max)
- [ ] Valid `version` (e.g., "1.0.0")
- [ ] All required permissions listed
- [ ] Icons paths are correct

## 🚫 Common Issues & Solutions

### Issue 1: "Failed to load extension - Could not load icon"
**Solution**: Generate the PNG icon files first
```bash
# Use one of these methods:
1. Open START-HERE.html
2. Run: python generate_icons.py
3. Open create-icons.html
```

### Issue 2: Extension doesn't work on some pages
**Reason**: Chrome extensions can't run on:
- `chrome://` pages
- `chrome-extension://` pages
- Chrome Web Store pages
- `edge://` or `about:` pages

**Solution**: This is normal browser security. Test on regular websites like google.com

### Issue 3: "Manifest file is invalid"
**Solution**: 
- Check JSON syntax (no trailing commas)
- Ensure all icon files exist
- Validate at: https://developer.chrome.com/docs/extensions/mv3/manifest/

### Issue 4: Popup is blank
**Solution**:
- Check browser console (F12) for errors
- Ensure popup.js loads correctly
- Verify all file paths are correct

## 📦 Creating the ZIP File

### What to Include:
```
mobile-simulator/
├── icons/
│   ├── icon16.png ✓
│   ├── icon48.png ✓
│   └── icon128.png ✓
├── lib/ (optional, not used currently)
├── manifest.json ✓
├── popup.html ✓
├── popup.js ✓
└── styles.css ✓
```

### What to EXCLUDE:
- ❌ `README.md`
- ❌ `QUICK-START.md`
- ❌ `FIX-ICON-ERROR.md`
- ❌ `START-HERE.html`
- ❌ `create-icons.html`
- ❌ `generate-icons-simple.html`
- ❌ `generate_icons.py`
- ❌ `generate-icons.bat`
- ❌ `.git` folder
- ❌ `node_modules` folder

### Create ZIP:
**Windows:**
1. Select only required files (manifest.json, popup.html, popup.js, styles.css, icons folder)
2. Right-click → Send to → Compressed (zipped) folder

**Mac/Linux:**
```bash
cd mobile-simulator
zip -r mobile-simulator.zip manifest.json popup.html popup.js styles.css icons/
```

## 🌐 Chrome Web Store Submission Steps

1. **Go to**: https://chrome.google.com/webstore/devconsole
2. **Sign in** with your Google account
3. **Pay one-time fee**: $5 USD (required for first submission)
4. **Click**: "New Item"
5. **Upload**: Your ZIP file
6. **Fill in**:
   - Store listing
   - Upload promotional images
   - Upload screenshots
   - Privacy practices
   - Category selection
7. **Submit for review**

## ⏱️ Review Timeline
- **Typical**: 1-3 days
- **First submission**: May take longer
- **Updates**: Usually faster

## 📝 Store Listing Template

### Summary (132 chars max):
```
Test responsive designs with realistic mobile device simulators. 16 devices including iPhone, Samsung, Pixel, and iPad.
```

### Description:
```
Mobile Simulator helps developers test responsive web designs with realistic device mockups.

FEATURES:
• 16 Popular Devices: iPhone 17/16/15/14/SE, Samsung S26/S25/S24/S23, Pixel 8, iPad Pro/Air/Mini
• Realistic Mockups: Device-specific designs with notch (iPhone) or punch-hole camera (Samsung/Android)
• Rotate Devices: Switch between portrait and landscape orientations
• Toggle Frame: Show or hide device bezels and buttons
• Organized Selector: Devices grouped by category for easy selection
• Minimal Bezels: Realistic 4px side, 6px top/bottom bezels
• Save Settings: Remembers your last selected device and preferences

PERFECT FOR:
✓ Web developers testing responsive designs
✓ UI/UX designers previewing mobile layouts
✓ QA testers checking mobile compatibility
✓ Anyone building mobile-first websites

HOW TO USE:
1. Open any website
2. Click the Mobile Simulator icon
3. Select a device from the dropdown
4. View your site in a realistic mobile mockup

Note: Extension only works on regular websites (not chrome:// pages or Chrome Web Store).
```

### Category:
- Developer Tools

### Screenshots Ideas:
1. Extension popup showing device selector
2. iPhone mockup with a website
3. Samsung mockup with different website
4. Landscape orientation example
5. Control panel with all options

## 🔒 Privacy Policy

If you don't collect user data, you can use this simple statement:

```
Privacy Policy for Mobile Simulator

This extension does not collect, store, or transmit any personal data. 
All settings are stored locally on your device using Chrome's storage API.

No analytics, tracking, or data collection of any kind is performed.
```

Host this on:
- GitHub Pages
- Your website
- Google Docs (set to public)

## ✅ Final Checklist Before Upload

- [ ] Icons generated and in correct folder
- [ ] Extension tested and working
- [ ] ZIP file created with only required files
- [ ] Store assets (images) prepared
- [ ] Store listing text written
- [ ] Screenshots taken
- [ ] Privacy policy URL ready (if needed)
- [ ] Developer account created
- [ ] $5 registration fee paid

## 🎉 After Approval

Once approved:
1. Share your extension link
2. Monitor reviews and ratings
3. Respond to user feedback
4. Update regularly with improvements

Good luck with your submission! 🚀
