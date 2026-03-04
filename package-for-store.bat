@echo off
echo ========================================
echo  Mobile Simulator - Chrome Store Package
echo ========================================
echo.

REM Check if icons exist
if not exist "icons\icon16.png" (
    echo ERROR: icon16.png not found!
    echo Please generate icons first using START-HERE.html
    echo.
    pause
    exit /b 1
)

if not exist "icons\icon48.png" (
    echo ERROR: icon48.png not found!
    echo Please generate icons first using START-HERE.html
    echo.
    pause
    exit /b 1
)

if not exist "icons\icon128.png" (
    echo ERROR: icon128.png not found!
    echo Please generate icons first using START-HERE.html
    echo.
    pause
    exit /b 1
)

echo Icons found: OK
echo.

REM Create a temporary directory
if exist "chrome-store-package" rmdir /s /q "chrome-store-package"
mkdir "chrome-store-package"

echo Copying required files...
copy "manifest.json" "chrome-store-package\" >nul
copy "popup.html" "chrome-store-package\" >nul
copy "popup.js" "chrome-store-package\" >nul
copy "styles.css" "chrome-store-package\" >nul

REM Copy icons folder
xcopy "icons\*.png" "chrome-store-package\icons\" /I /Y >nul

echo.
echo Files copied successfully!
echo.
echo Creating ZIP file...

REM Create ZIP using PowerShell
powershell -command "Compress-Archive -Path 'chrome-store-package\*' -DestinationPath 'mobile-simulator-chrome-store.zip' -Force"

if exist "mobile-simulator-chrome-store.zip" (
    echo.
    echo ========================================
    echo  SUCCESS!
    echo ========================================
    echo.
    echo ZIP file created: mobile-simulator-chrome-store.zip
    echo.
    echo Next steps:
    echo 1. Go to: https://chrome.google.com/webstore/devconsole
    echo 2. Click "New Item"
    echo 3. Upload: mobile-simulator-chrome-store.zip
    echo 4. Fill in store listing details
    echo 5. Submit for review
    echo.
    echo See CHROME-STORE-CHECKLIST.md for detailed instructions
    echo.
) else (
    echo.
    echo ERROR: Failed to create ZIP file
    echo.
)

REM Cleanup
rmdir /s /q "chrome-store-package"

pause
