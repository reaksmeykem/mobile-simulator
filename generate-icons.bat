@echo off
echo Generating icons for Mobile Simulator...
echo.

REM Check if Python is installed
python --version >nul 2>&1
if %errorlevel% neq 0 (
    echo Error: Python is not installed or not in PATH
    echo.
    echo Please either:
    echo 1. Install Python from https://www.python.org/
    echo 2. Or open generate-icons-simple.html in your browser
    echo.
    pause
    exit /b 1
)

REM Check if Pillow is installed
python -c "import PIL" >nul 2>&1
if %errorlevel% neq 0 (
    echo Installing Pillow library...
    pip install Pillow
    echo.
)

REM Run the Python script
python generate_icons.py

echo.
pause
