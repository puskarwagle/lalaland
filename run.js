import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { Builder, By, until } from 'selenium-webdriver';
import chrome from 'selenium-webdriver/chrome.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configuration - Change these values to your desired plot numbers
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

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

async function startServer() {
    const app = express();
    const PORT = 3000;

    // Serve static files from the current directory
    app.use(express.static(__dirname));

    // Route for index.html
    app.get('/', (req, res) => {
        res.sendFile(path.join(__dirname, 'index.html'));
    });

    // Route for land.html
    app.get('/land.html', (req, res) => {
        res.sendFile(path.join(__dirname, 'land.html'));
    });

    return new Promise((resolve) => {
        const server = app.listen(PORT, () => {
            console.log(`Server is running on http://localhost:${PORT}`);
            resolve(server);
        });
    });
}

async function automateForm() {
    console.log('Starting Selenium automation...');

    // Set up Chrome options to use existing Chrome profile
    const options = new chrome.Options();
    // Uncomment the line below to use your existing Chrome profile
    // options.addArguments('--user-data-dir=C:/Users/YourUsername/AppData/Local/Google/Chrome/User Data');

    const driver = await new Builder()
        .forBrowser('chrome')
        .setChromeOptions(options)
        .build();

    try {
        console.log(`Navigating to ${CONFIG.baseUrl}...`);
        await driver.get(CONFIG.baseUrl);

        console.log('Waiting for countdown timer to complete...');
        // Wait for URL to change to land.html
        await driver.wait(async () => {
            const currentUrl = await driver.getCurrentUrl();
            return currentUrl.includes('land.html');
        }, 15000);

        console.log('Form page loaded, starting automation...');

        // Wait for the form to be visible
        await driver.wait(until.elementLocated(By.css('form')), 5000);

        // Select 1st preference
        console.log(`Selecting 1st preference: ${CONFIG.plotPreferences.first}`);
        const select1 = await driver.findElement(By.name('hilltopr2_1st_preference'));
        await select1.sendKeys(CONFIG.plotPreferences.first);
        await sleep(CONFIG.selectDelay);

        // Select 2nd preference
        console.log(`Selecting 2nd preference: ${CONFIG.plotPreferences.second}`);
        const select2 = await driver.findElement(By.name('hilltopr2_2nd_preference'));
        await select2.sendKeys(CONFIG.plotPreferences.second);
        await sleep(CONFIG.selectDelay);

        // Select 3rd preference
        console.log(`Selecting 3rd preference: ${CONFIG.plotPreferences.third}`);
        const select3 = await driver.findElement(By.name('hilltopr2_3rd_preference'));
        await select3.sendKeys(CONFIG.plotPreferences.third);
        await sleep(CONFIG.selectDelay);

        // Select 4th preference
        console.log(`Selecting 4th preference: ${CONFIG.plotPreferences.fourth}`);
        const select4 = await driver.findElement(By.name('hilltopr2_4th_preference'));
        await select4.sendKeys(CONFIG.plotPreferences.fourth);
        await sleep(CONFIG.selectDelay);

        // Click submit button
        console.log('Clicking submit button...');
        const submitButton = await driver.findElement(By.css('input[type="submit"]'));
        await submitButton.click();

        console.log('Form submitted successfully!');

        // Wait a bit to see the result
        await sleep(3000);

        console.log('Automation completed!');

    } catch (error) {
        console.error('Automation failed:', error);
    } finally {
        // Uncomment the line below if you want to close the browser after automation
        // await driver.quit();
        console.log('\nBrowser will remain open. Close it manually when done.');
    }
}

async function main() {
    let server;

    try {
        // Start the server
        server = await startServer();

        // Wait a bit to ensure server is fully ready
        await sleep(2000);

        // Run the automation
        await automateForm();

        console.log('\nPress Ctrl+C to stop the server.');

    } catch (error) {
        console.error('Error:', error);
        if (server) {
            console.log('Stopping server...');
            server.close();
        }
        process.exit(1);
    }
}

// Handle Ctrl+C
process.on('SIGINT', () => {
    console.log('\nStopping server...');
    process.exit(0);
});

main();
