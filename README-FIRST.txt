================================================================================
  MOBILE SIMULATOR - Chrome Extension
  Icon Error Fix Required
================================================================================

ERROR: "Could not load icon 'icons/icon16.png' specified in 'icons'"

SOLUTION: You need to generate the PNG icon files first.

================================================================================
  QUICK FIX (Choose ONE method)
================================================================================

METHOD 1 - Auto-Download (EASIEST):
  1. Open: START-HERE.html (in your browser)
  2. Click "Auto-Generate Icons" button
  3. Wait for 3 PNG files to download
  4. Move them to: mobile-simulator/icons/
  5. Go to Chrome → Click "Retry"

METHOD 2 - Python Script (AUTOMATIC):
  Windows: Double-click "generate-icons.bat"
  Mac/Linux: Run "python3 generate_icons.py"
  Then go to Chrome → Click "Retry"

METHOD 3 - Manual Download:
  1. Open: create-icons.html
  2. Click "Download All Icons"
  3. Save to: mobile-simulator/icons/
  4. Go to Chrome → Click "Retry"

================================================================================
  FILES NEEDED
================================================================================

These 3 files must be in mobile-simulator/icons/:
  ✓ icon16.png
  ✓ icon48.png
  ✓ icon128.png

================================================================================
  HELPFUL FILES
================================================================================

START-HERE.html ........... Main setup page (OPEN THIS FIRST)
FIX-ICON-ERROR.md ......... Detailed troubleshooting
QUICK-START.md ............ Quick reference guide
README.md ................. Full documentation
instructions.html ......... Complete setup instructions

================================================================================
