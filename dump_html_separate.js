import { Builder, By } from 'selenium-webdriver';
import chrome from 'selenium-webdriver/chrome.js';
import os from 'os';
import fs from 'fs';
import path from 'path';

// URL to dump
const URL = 'https://info.birlingcommunity.com.au/lot-nomination-form-stage-5-release-1?utm_campaign=112457207-The%20Hilltop%20Stage%203&utm_medium=email&_hsenc=p2ANqtz-9Vtjea8IP9T8VnL1zXsLgoo188SyVeEE41isy3ZFm21avNee40jOuRNAgF2t0uQReNxtPrFRkd-y1PdHjrpGzcrFH2xA&_hsmi=15142166&utm_content=15142166&utm_source=hs_email';

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

function getChromePath() {
    const platform = os.platform();
    if (platform === 'linux') {
        const paths = [
            '/usr/bin/google-chrome',
            '/usr/bin/google-chrome-stable',
            '/usr/bin/chromium-browser',
            '/usr/bin/chromium',
            '/snap/bin/chromium'
        ];
        for (const chromePath of paths) {
            if (fs.existsSync(chromePath)) return chromePath;
        }
    } else if (platform === 'darwin') {
        return '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
    } else if (platform === 'win32') {
        const paths = [
            'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
            'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe'
        ];
        for (const chromePath of paths) {
            if (fs.existsSync(chromePath)) return chromePath;
        }
    }
    return null;
}

async function dumpHTML() {
    console.log('Starting HTML dump...');

    const options = new chrome.Options();
    const chromePath = getChromePath();
    if (chromePath) {
        options.setChromeBinaryPath(chromePath);
    }

    const userDataDir = path.join(os.tmpdir(), `chrome-dump-${Date.now()}`);
    options.addArguments(`--user-data-dir=${userDataDir}`);
    options.addArguments('--no-first-run');
    options.addArguments('--no-default-browser-check');

    const driver = await new Builder()
        .forBrowser('chrome')
        .setChromeOptions(options)
        .build();

    try {
        console.log('Loading page...');
        await driver.get(URL);

        // Wait for page to fully load
        console.log('Waiting for page to load...');
        await sleep(5000);

        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const dirname = `page-dump-${timestamp}`;

        // Create directory
        if (!fs.existsSync(dirname)) {
            fs.mkdirSync(dirname);
        }

        console.log('Extracting HTML...');

        // Get main page HTML
        const mainHTML = await driver.executeScript('return document.documentElement.outerHTML;');
        fs.writeFileSync(path.join(dirname, 'main-page.html'), mainHTML, 'utf8');
        console.log('✓ Saved main-page.html');

        // Get all iframes
        const iframes = await driver.findElements(By.css('iframe'));
        console.log(`Found ${iframes.length} iframe(s)`);

        for (let i = 0; i < iframes.length; i++) {
            try {
                console.log(`Extracting iframe #${i}...`);
                await driver.switchTo().frame(i);
                const iframeHTML = await driver.executeScript('return document.documentElement.outerHTML;');
                fs.writeFileSync(path.join(dirname, `iframe-${i}.html`), iframeHTML, 'utf8');
                console.log(`✓ Saved iframe-${i}.html`);
                await driver.switchTo().defaultContent();
            } catch (err) {
                await driver.switchTo().defaultContent();
                console.log(`✗ Error extracting iframe #${i}: ${err.message}`);
            }
        }

        // Create index file
        let indexHTML = `<!DOCTYPE html>
<html>
<head>
    <title>Page Dump Index</title>
    <style>
        body { font-family: Arial, sans-serif; padding: 20px; }
        h1 { color: #333; }
        ul { list-style: none; padding: 0; }
        li { margin: 10px 0; }
        a { color: #0066cc; text-decoration: none; font-size: 16px; }
        a:hover { text-decoration: underline; }
    </style>
</head>
<body>
    <h1>Page Dump - ${new Date().toLocaleString()}</h1>
    <h2>Files:</h2>
    <ul>
        <li><a href="main-page.html" target="_blank">📄 Main Page HTML</a></li>
`;
        for (let i = 0; i < iframes.length; i++) {
            indexHTML += `        <li><a href="iframe-${i}.html" target="_blank">📄 IFrame #${i} HTML (THE FORM)</a></li>\n`;
        }
        indexHTML += `    </ul>
</body>
</html>`;

        fs.writeFileSync(path.join(dirname, 'index.html'), indexHTML, 'utf8');

        console.log(`\n✓ All files saved to folder: ${dirname}/`);
        console.log(`✓ Open ${dirname}/index.html to see all files`);

    } catch (error) {
        console.error('Error:', error.message);
    } finally {
        await driver.quit();
    }
}

dumpHTML();
