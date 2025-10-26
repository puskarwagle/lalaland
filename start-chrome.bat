@echo off
echo Starting Chrome with Remote Debugging enabled...
echo This allows the automation script to control your Chrome browser.
echo.
echo Close all Chrome windows first, then run this script.
echo.

start chrome.exe --remote-debugging-port=9222 --disable-blink-features=AutomationControlled

echo Chrome started with remote debugging on port 9222
echo You can now run: npm start
