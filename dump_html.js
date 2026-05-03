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
        const filename = `page-dump-${timestamp}.html`;

        console.log('Extracting HTML...');

        // Get main page HTML
        const mainHTML = await driver.executeScript('return document.documentElement.outerHTML;');
        let fullHTML = `<!-- MAIN PAGE HTML -->\n${mainHTML}\n\n`;

        // Get all iframes
        const iframes = await driver.findElements(By.css('iframe'));
        console.log(`Found ${iframes.length} iframe(s)`);

        for (let i = 0; i < iframes.length; i++) {
            try {
                console.log(`Extracting iframe #${i}...`);
                await driver.switchTo().frame(i);
                const iframeHTML = await driver.executeScript('return document.documentElement.outerHTML;');
                fullHTML += `\n\n<!-- IFRAME #${i} HTML -->\n${iframeHTML}\n\n`;
                await driver.switchTo().defaultContent();
            } catch (err) {
                await driver.switchTo().defaultContent();
                fullHTML += `\n\n<!-- IFRAME #${i} - ERROR: ${err.message} -->\n\n`;
            }
        }

        // Save to file
        fs.writeFileSync(filename, fullHTML, 'utf8');
        console.log(`\n✓ Full HTML saved to: ${filename}`);
        console.log(`✓ File size: ${(fullHTML.length / 1024).toFixed(2)} KB`);

    } catch (error) {
        console.error('Error:', error.message);
    } finally {
        await driver.quit();
    }
}

dumpHTML();
