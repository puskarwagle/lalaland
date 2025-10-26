import { chromium } from 'playwright';

// Configuration - Change these values to your desired plot numbers
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

async function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

async function automateForm() {
    console.log('Starting Playwright automation...');

    const browser = await chromium.launch({
        headless: false // Set to true to run in background without opening browser window
    });

    const context = await browser.newContext();
    const page = await context.newPage();

    console.log(`Navigating to ${CONFIG.baseUrl}...`);
    await page.goto(CONFIG.baseUrl);

    console.log('Waiting for countdown timer to complete...');
    // Wait for redirect to land.html
    await page.waitForURL('**/land.html', { timeout: 15000 });

    console.log('Form page loaded, starting automation...');

    // Wait for the form to be visible
    await page.waitForSelector('form', { timeout: 5000 });

    // Select 1st preference
    console.log(`Selecting 1st preference: ${CONFIG.plotPreferences.first}`);
    await page.selectOption('select[name="hilltopr2_1st_preference"]', CONFIG.plotPreferences.first);
    await sleep(CONFIG.selectDelay);

    // Select 2nd preference
    console.log(`Selecting 2nd preference: ${CONFIG.plotPreferences.second}`);
    await page.selectOption('select[name="hilltopr2_2nd_preference"]', CONFIG.plotPreferences.second);
    await sleep(CONFIG.selectDelay);

    // Select 3rd preference
    console.log(`Selecting 3rd preference: ${CONFIG.plotPreferences.third}`);
    await page.selectOption('select[name="hilltopr2_3rd_preference"]', CONFIG.plotPreferences.third);
    await sleep(CONFIG.selectDelay);

    // Select 4th preference
    console.log(`Selecting 4th preference: ${CONFIG.plotPreferences.fourth}`);
    await page.selectOption('select[name="hilltopr2_4th_preference"]', CONFIG.plotPreferences.fourth);
    await sleep(CONFIG.selectDelay);

    // Click submit button
    console.log('Clicking submit button...');
    await page.click('input[type="submit"]');

    console.log('Form submitted successfully!');

    // Wait a bit to see the result
    await sleep(3000);

    console.log('Closing browser...');
    await browser.close();
    console.log('Automation completed!');
}

// Run the automation
automateForm().catch(error => {
    console.error('Automation failed:', error);
    process.exit(1);
});
