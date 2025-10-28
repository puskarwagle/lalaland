import { Builder, By, until } from 'selenium-webdriver';
import chrome from 'selenium-webdriver/chrome.js';

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
        first: '3016',   // 1st preference
        second: '3009',  // 2nd preference
        third: '3000',   // 3rd preference
        fourth: '3004'   // 4th preference
    },
    totalTimeTaken: 5000 // Total time to fill and submit form (ms) - 5 seconds for testing
};

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
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

        // Find all select elements first to calculate total operations
        const selectElements = await driver.findElements(By.css('select'));
        const preferences = [
            CONFIG.plotPreferences.first,
            CONFIG.plotPreferences.second,
            CONFIG.plotPreferences.third,
            CONFIG.plotPreferences.fourth
        ];
        const totalOperations = 4 + Math.min(selectElements.length, preferences.length); // 4 text fields + dropdowns
        const delayPerOperation = CONFIG.totalTimeTaken / totalOperations;

        // Helper function to add appropriate delay
        const addDelay = async (operationNumber) => {
            const elapsed = Date.now() - startTime;
            const targetTime = operationNumber * delayPerOperation;
            const remainingDelay = Math.max(0, targetTime - elapsed);
            if (remainingDelay > 0) await sleep(remainingDelay);
        };

        // Fill in text input fields
        console.log('Filling in user information...');

        // Find and fill first name input
        try {
            const firstNameInput = await driver.findElement(By.css('input[type="text"][name*="first" i], input[type="text"][id*="first" i]'));
            await firstNameInput.clear();
            await firstNameInput.sendKeys(CONFIG.userInfo.firstName);
            console.log(`First name set to: ${CONFIG.userInfo.firstName}`);
            await addDelay(1);
        } catch (e) {
            console.log('First name field not found, skipping...');
        }

        // Find and fill last name input
        try {
            const lastNameInput = await driver.findElement(By.css('input[type="text"][name*="last" i], input[type="text"][id*="last" i]'));
            await lastNameInput.clear();
            await lastNameInput.sendKeys(CONFIG.userInfo.lastName);
            console.log(`Last name set to: ${CONFIG.userInfo.lastName}`);
            await addDelay(2);
        } catch (e) {
            console.log('Last name field not found, skipping...');
        }

        // Find and fill email input
        try {
            const emailInput = await driver.findElement(By.css('input[type="email"], input[name*="email" i], input[id*="email" i]'));
            await emailInput.clear();
            await emailInput.sendKeys(CONFIG.userInfo.email);
            console.log(`Email set to: ${CONFIG.userInfo.email}`);
            await addDelay(3);
        } catch (e) {
            console.log('Email field not found, skipping...');
        }

        // Find and fill phone input
        try {
            const phoneInput = await driver.findElement(By.css('input[type="tel"], input[name*="phone" i], input[id*="phone" i]'));
            await phoneInput.clear();
            await phoneInput.sendKeys(CONFIG.userInfo.phone);
            console.log(`Phone set to: ${CONFIG.userInfo.phone}`);
            await addDelay(4);
        } catch (e) {
            console.log('Phone field not found, skipping...');
        }

        // Fill dropdown selections
        console.log(`Found ${selectElements.length} select elements`);

        // Loop through each select element and set values
        for (let i = 0; i < Math.min(selectElements.length, preferences.length); i++) {
            const selectElement = selectElements[i];
            const preferenceValue = preferences[i];

            if (!preferenceValue) continue;

            try {
                console.log(`Selecting option ${i + 1}: ${preferenceValue}`);

                // Click on the select to reveal options
                await selectElement.click();
                await sleep(50);

                // Find the option with the desired value
                const option = await selectElement.findElement(By.css(`option[value="${preferenceValue}"]`));
                await option.click();

                console.log(`Selected preference ${i + 1}: ${preferenceValue}`);
                await addDelay(5 + i);
            } catch (error) {
                console.log(`Could not select value ${preferenceValue} in dropdown ${i + 1}:`, error.message);
            }
        }

        // Ensure we've reached target time before submitting
        const elapsed = Date.now() - startTime;
        const remainingTime = Math.max(0, CONFIG.totalTimeTaken - elapsed - 100); // Reserve 100ms for submit
        if (remainingTime > 0) await sleep(remainingTime);

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
        console.log(`⏱️  Configured time: ${CONFIG.totalTimeTaken}ms (${(CONFIG.totalTimeTaken / 1000).toFixed(2)}s)`);
        console.log(`⏱️  Actual time: ${timeTaken}ms (${(timeTaken / 1000).toFixed(2)}s)`);
        console.log(`⏱️  Difference: ${Math.abs(timeTaken - CONFIG.totalTimeTaken)}ms`);
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

// Run the automation
automateForm().catch(error => {
    console.error('Fatal error:', error);
    process.exit(1);
});
