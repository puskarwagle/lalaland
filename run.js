import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { Builder, By, until } from 'selenium-webdriver';
import chrome from 'selenium-webdriver/chrome.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configuration - Change these values to your desired inputs
const CONFIG = {
    baseUrl: 'http://localhost:3000',
    userInfo: {
        firstName: 'John',
        lastName: 'Doe',
        email: 'john.doe@example.com',
        phone: '+1234567890'
    },
    plotPreferences: {
        first: '3022',   // 1st preference
        second: '3041',  // 2nd preference
        third: '3056',   // 3rd preference
        fourth: '3070'   // 4th preference
    },
    selectDelay: 1 // 500ms delay between selections
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
    console.log('Starting automation...\n');

    const options = new chrome.Options();

    // Disable automation detection
    options.excludeSwitches('enable-automation');
    options.addArguments('--disable-blink-features=AutomationControlled');

    const driver = await new Builder()
        .forBrowser('chrome')
        .setChromeOptions(options)
        .build();

    console.log('✓ Chrome opened!\n');

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

        // START TIMER HERE - after form loads
        const startTime = Date.now();

        // Wait for the form to be visible
        await driver.wait(until.elementLocated(By.css('form')), 5000);

        // Fill in text input fields
        console.log('Filling in user information...');

        // Find and fill first name input
        try {
            const firstNameInput = await driver.findElement(By.css('input[type="text"][name*="first" i], input[type="text"][id*="first" i]'));
            await firstNameInput.clear();
            await firstNameInput.sendKeys(CONFIG.userInfo.firstName);
            console.log(`First name set to: ${CONFIG.userInfo.firstName}`);
            await sleep(CONFIG.selectDelay);
        } catch (e) {
            console.log('First name field not found, skipping...');
        }

        // Find and fill last name input
        try {
            const lastNameInput = await driver.findElement(By.css('input[type="text"][name*="last" i], input[type="text"][id*="last" i]'));
            await lastNameInput.clear();
            await lastNameInput.sendKeys(CONFIG.userInfo.lastName);
            console.log(`Last name set to: ${CONFIG.userInfo.lastName}`);
            await sleep(CONFIG.selectDelay);
        } catch (e) {
            console.log('Last name field not found, skipping...');
        }

        // Find and fill email input
        try {
            const emailInput = await driver.findElement(By.css('input[type="email"], input[name*="email" i], input[id*="email" i]'));
            await emailInput.clear();
            await emailInput.sendKeys(CONFIG.userInfo.email);
            console.log(`Email set to: ${CONFIG.userInfo.email}`);
            await sleep(CONFIG.selectDelay);
        } catch (e) {
            console.log('Email field not found, skipping...');
        }

        // Find and fill phone input
        try {
            const phoneInput = await driver.findElement(By.css('input[type="tel"], input[name*="phone" i], input[id*="phone" i]'));
            await phoneInput.clear();
            await phoneInput.sendKeys(CONFIG.userInfo.phone);
            console.log(`Phone set to: ${CONFIG.userInfo.phone}`);
            await sleep(CONFIG.selectDelay);
        } catch (e) {
            console.log('Phone field not found, skipping...');
        }

        // Find all select elements (dropdowns) on the page
        console.log('Finding all select elements on the page...');
        const selectElements = await driver.findElements(By.css('select'));
        console.log(`Found ${selectElements.length} select elements`);

        const preferences = [
            CONFIG.plotPreferences.first,
            CONFIG.plotPreferences.second,
            CONFIG.plotPreferences.third,
            CONFIG.plotPreferences.fourth
        ];

        // Loop through each select element and set values
        for (let i = 0; i < Math.min(selectElements.length, preferences.length); i++) {
            const selectElement = selectElements[i];
            const preferenceValue = preferences[i];

            if (!preferenceValue) continue;

            try {
                console.log(`Selecting option ${i + 1}: ${preferenceValue}`);

                // Click on the select to reveal options
                await selectElement.click();
                await sleep(200);

                // Find the option with the desired value
                const option = await selectElement.findElement(By.css(`option[value="${preferenceValue}"]`));
                await option.click();

                console.log(`Selected preference ${i + 1}: ${preferenceValue}`);
                await sleep(CONFIG.selectDelay);
            } catch (error) {
                console.log(`Could not select value ${preferenceValue} in dropdown ${i + 1}:`, error.message);
            }
        }

        // Click submit button
        console.log('Clicking submit button...');
        const submitButton = await driver.findElement(By.css('input[type="submit"]'));
        await submitButton.click();

        console.log('Form submitted successfully!');

        // Wait a bit to see the result
        await sleep(3000);

        const endTime = Date.now();
        const timeTaken = endTime - startTime;

        console.log('\n========================================');
        console.log('✓ Automation completed successfully!');
        console.log(`⏱️  Total time: ${timeTaken} milliseconds (${(timeTaken / 1000).toFixed(2)} seconds)`);
        console.log('========================================\n');
        console.log('Browser will remain open. Close it manually when done.');

    } catch (error) {
        console.error('\n❌ Automation failed:', error);
        const endTime = Date.now();
        const timeTaken = endTime - startTime;
        console.error(`Time before failure: ${timeTaken} milliseconds`);
    } finally {
        // Don't close the browser so user can see the result and their session remains
        // await driver.quit();
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
