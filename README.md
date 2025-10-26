# Land Form Automation

This project automates the land plot selection form using Node.js, Express, and Selenium WebDriver.

## Features

1. Combined Express server and Selenium automation in one script
2. Countdown timer on index.html that redirects to land.html after 10 seconds
3. Selenium automation that:
   - Opens Chrome browser
   - Waits for the page to load
   - Selects plot numbers for all 4 preference options
   - Waits 500ms between each selection
   - Submits the form

## Installation

```bash
npm install
```

This will install:
- express: Web server
- selenium-webdriver: Browser automation

Make sure you have Chrome browser installed on your system.

## Configuration

Edit the plot preferences in `run.js`:

```javascript
const CONFIG = {
    baseUrl: 'http://localhost:3000',
    plotPreferences: {
        first: '3016',   // 1st preference
        second: '3009',  // 2nd preference
        third: '3000',   // 3rd preference
        fourth: '3004'   // 4th preference
    },
    selectDelay: 500 // 500ms delay between selections
};
```

Change the plot numbers to your desired values.

## Usage

### IMPORTANT: Using Your Logged-In Chrome Browser

To use your actual Chrome browser with all your login sessions:

**Step 1:** Close ALL Chrome windows

**Step 2:** Run the batch file to start Chrome with remote debugging:
```bash
start-chrome.bat
```

**Step 3:** Run the automation:
```bash
npm start
```
(or `node automation.js` if you don't need the local server)

This will:
1. Connect to your logged-in Chrome browser
2. Fill in the form fields (name, email, phone)
3. Select all 4 plot preferences
4. Submit the form
5. Show the total time taken in milliseconds

Press Ctrl+C to stop the server when done.

## Files

- `run.js` - Combined Express server and Selenium automation script
- `index.html` - Landing page with countdown timer
- `land.html` - Form page with plot selection
- `package.json` - Project dependencies

## Notes

- The browser will remain open after automation completes so you can see the result
- The server runs on port 3000. Make sure this port is available
- The automation waits 500ms between each dropdown selection as specified
- For real-world use, change the `baseUrl` in CONFIG to your actual form URL
# lalaland
