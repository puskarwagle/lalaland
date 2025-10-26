# Land Form Automation

This project automates the land plot selection form using Node.js, Express, and Playwright.

## Features

1. Express server that serves the HTML files
2. Countdown timer on index.html that redirects to land.html after 10 seconds
3. Playwright automation script that:
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
- playwright: Browser automation

After installation, run:
```bash
npx playwright install
```

This downloads the necessary browser binaries for Playwright.

## Configuration

Edit the plot preferences in `automation.js`:

```javascript
const CONFIG = {
    baseUrl: 'http://localhost:3000',
    plotPreferences: {
        first: '3006',   // 1st preference
        second: '3007',  // 2nd preference
        third: '3008',   // 3rd preference
        fourth: '3009'   // 4th preference
    },
    selectDelay: 500 // 500ms delay between selections
};
```

Change the plot numbers to your desired values.

## Usage

### Step 1: Start the server

In one terminal:
```bash
npm start
```

This will start the Express server on http://localhost:3000

### Step 2: Run the automation

In another terminal (while the server is running):
```bash
npm run automate
```

This will:
1. Open a browser
2. Navigate to http://localhost:3000
3. Wait for the countdown timer (10 seconds)
4. Automatically redirect to land.html
5. Select the configured plot numbers
6. Submit the form

## Files

- `server.js` - Express server that serves the HTML files
- `automation.js` - Playwright automation script
- `index.html` - Landing page with countdown timer
- `land.html` - Form page with plot selection
- `package.json` - Project dependencies

## Notes

- The automation runs with `headless: false` so you can see what's happening. Change to `headless: true` in `automation.js` to run in background.
- The server runs on port 3000. Make sure this port is available.
- The automation waits 500ms between each dropdown selection as specified.
# lalaland
