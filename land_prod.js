import { Builder, By, until } from 'selenium-webdriver';
import chrome from 'selenium-webdriver/chrome.js';
import os from 'os';
import fs from 'fs';
import path from 'path';

// ============================================
// CONFIGURATION - CHANGE THESE VALUES
// ============================================
const CONFIG = {
    // Target URL - change this to your auction site
    lalaurl: 'https://info.birlingcommunity.com.au/lot-nomination-form-stage-5-release-1?utm_campaign=112457207-The%20Hilltop%20Stage%203&utm_medium=email&_hsenc=p2ANqtz-_d1TbHfcYG3mhilGj71vftIBbiIKQ2l4B6gVU2J9cXTvuO9kvk3LcGENHHVVlPYwp2R4nemsKvBq0SuKXlO55WR7nQPg&_hsmi=15142166&utm_content=15142166&utm_source=hs_email',
 
    // Deepa 0449699679
    // de_pals@yahoo.com
    // Lot 1 :5015
    // Lot2:5008

    // User information to fill in the form
    userInfo: {
        firstName: 'Kedr',
        lastName: 'bajain',
        email: 'kedeep2003@yahoo.com',
        phone: '+0431822833'
    },

    // Plot preferences for dropdown selections
    plotPreferences: {
        first: '5007',
        second: '5030',
        third: '5007',
        fourth: '5030'
    },

    // Monitoring settings 4.9
    checkInterval: 100,        // Check for form every 100ms
    pageReloadCheckInterval: 200,  // Check for page reload every 1s
    totalTimeTaken: 4900,      // Total time to fill and submit form (ms) - 4.9 seconds
};

// ============================================
// UTILITY FUNCTIONS
// ============================================
function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

function log(message, type = 'info') {
    const timestamp = new Date().toLocaleTimeString();
    const prefix = {
        'info': 'ℹ️',
        'success': '✓',
        'error': '❌',
        'warning': '⚠️',
        'watching': '👁️'
    }[type] || 'ℹ️';

    console.log(`[${timestamp}] ${prefix} ${message}`);
}

// ============================================
// FORM DETECTION AND FILLING
// ============================================

/**
 * Find an input field by looking for associated labels or common attributes
 * @param {WebDriver|WebElement} scope - Search scope (driver for whole page, or form element)
 */
async function findInputByLabel(scope, searchTerms, inputType = 'text') {
    const attempts = [];

    // Strategy 1: Find by input name/id containing search terms
    for (const term of searchTerms) {
        attempts.push(
            scope.findElement(By.css(`input[type="${inputType}"][name*="${term}" i]`)).catch(() => null),
            scope.findElement(By.css(`input[type="${inputType}"][id*="${term}" i]`)).catch(() => null)
        );
    }

    // Strategy 2: Find label with text matching search terms, then find associated input
    for (const term of searchTerms) {
        attempts.push(
            (async () => {
                try {
                    const labels = await scope.findElements(By.css('label'));
                    for (const label of labels) {
                        const text = await label.getText();
                        if (text.toLowerCase().includes(term.toLowerCase())) {
                            // Try to find input by 'for' attribute
                            const forAttr = await label.getAttribute('for').catch(() => null);
                            if (forAttr) {
                                return await scope.findElement(By.id(forAttr)).catch(() => null);
                            }
                            // Try to find input inside label
                            return await label.findElement(By.css('input')).catch(() => null);
                        }
                    }
                    return null;
                } catch {
                    return null;
                }
            })()
        );
    }

    // Strategy 3: Find by placeholder text
    for (const term of searchTerms) {
        attempts.push(
            scope.findElement(By.css(`input[type="${inputType}"][placeholder*="${term}" i]`)).catch(() => null)
        );
    }

    const results = await Promise.all(attempts);
    return results.find(result => result !== null) || null;
}

/**
 * Detect if a form is likely the auction/target form
 */
async function isTargetForm(form, verbose = false) {
    try {
        // Get all inputs and selects in this form for debugging
        const allInputs = await form.findElements(By.css('input')).catch(() => []);
        const allSelects = await form.findElements(By.css('select')).catch(() => []);

        // Look for the 4 key fields we need - SEARCH WITHIN THE FORM ELEMENT
        const hasFirstName = await findInputByLabel(form, ['first', 'fname', 'firstname'], 'text') !== null;
        const hasLastName = await findInputByLabel(form, ['last', 'lname', 'lastname'], 'text') !== null;
        const hasEmail = await findInputByLabel(form, ['email', 'mail'], 'email') !== null ||
                         await findInputByLabel(form, ['email', 'mail'], 'text') !== null;
        const hasPhone = await findInputByLabel(form, ['phone', 'mobile', 'tel', 'contact'], 'tel') !== null ||
                        await findInputByLabel(form, ['phone', 'mobile', 'tel', 'contact'], 'text') !== null;

        // Also check if form has select dropdowns (for preferences)
        const selects = await form.findElements(By.css('select')).catch(() => []);
        const hasSelects = selects.length > 0;

        // Consider it a target form if it has at least 3 of the 4 fields AND has selects
        const matchingFields = [hasFirstName, hasLastName, hasEmail, hasPhone].filter(Boolean).length;

        // Only log if verbose mode is on OR if we found a matching form
        if (verbose || matchingFields >= 3) {
            log(`Form: ${allInputs.length} inputs, ${allSelects.length} selects | Match: ${matchingFields}/4 fields (first:${hasFirstName}, last:${hasLastName}, email:${hasEmail}, phone:${hasPhone})`, matchingFields >= 3 ? 'success' : 'info');
        }

        return matchingFields >= 3 && hasSelects;
    } catch (error) {
        if (verbose) log(`Form analysis error: ${error.message}`, 'error');
        return false;
    }
}

/**
 * Fill the target form with user data
 */
async function fillForm(form) {
    log('Starting to fill form...', 'info');
    const startTime = Date.now();

    try {
        // Get dropdown count first to calculate total operations
        const selectElements = await form.findElements(By.css('select'));
        const preferences = [
            CONFIG.plotPreferences.first,
            CONFIG.plotPreferences.second,
            CONFIG.plotPreferences.third,
            CONFIG.plotPreferences.fourth
        ];
        const totalOperations = 4 + Math.min(selectElements.length, preferences.length); // 4 text fields + dropdowns
        const delayPerOperation = CONFIG.totalTimeTaken / totalOperations;

        // Helper function to add appropriate delay
        const addDelay = async () => {
            const elapsed = Date.now() - startTime;
            const targetTime = (arguments[0] || 0) * delayPerOperation;
            const remainingDelay = Math.max(0, targetTime - elapsed);
            if (remainingDelay > 0) await sleep(remainingDelay);
        };

        // Fill first name - SEARCH WITHIN THE FORM
        const firstNameInput = await findInputByLabel(form, ['first', 'fname', 'firstname'], 'text');
        if (firstNameInput) {
            await firstNameInput.clear();
            await firstNameInput.sendKeys(CONFIG.userInfo.firstName);
            log(`First name: ${CONFIG.userInfo.firstName}`, 'success');
            await addDelay(1);
        }

        // Fill last name - SEARCH WITHIN THE FORM
        const lastNameInput = await findInputByLabel(form, ['last', 'lname', 'lastname'], 'text');
        if (lastNameInput) {
            await lastNameInput.clear();
            await lastNameInput.sendKeys(CONFIG.userInfo.lastName);
            log(`Last name: ${CONFIG.userInfo.lastName}`, 'success');
            await addDelay(2);
        }

        // Fill email - SEARCH WITHIN THE FORM
        let emailInput = await findInputByLabel(form, ['email', 'mail'], 'email');
        if (!emailInput) {
            emailInput = await findInputByLabel(form, ['email', 'mail'], 'text');
        }
        if (emailInput) {
            await emailInput.clear();
            await emailInput.sendKeys(CONFIG.userInfo.email);
            log(`Email: ${CONFIG.userInfo.email}`, 'success');
            await addDelay(3);
        }

        // Fill phone - SEARCH WITHIN THE FORM
        let phoneInput = await findInputByLabel(form, ['phone', 'mobile', 'tel', 'contact'], 'tel');
        if (!phoneInput) {
            phoneInput = await findInputByLabel(form, ['phone', 'mobile', 'tel', 'contact'], 'text');
        }
        if (phoneInput) {
            await phoneInput.clear();
            await phoneInput.sendKeys(CONFIG.userInfo.phone);
            log(`Phone: ${CONFIG.userInfo.phone}`, 'success');
            await addDelay(4);
        }

        // Fill dropdown selections
        log(`Found ${selectElements.length} dropdown(s)`, 'info');

        for (let i = 0; i < Math.min(selectElements.length, preferences.length); i++) {
            const selectElement = selectElements[i];
            const preferenceValue = preferences[i];

            if (!preferenceValue) continue;

            try {
                await selectElement.click();
                await sleep(50);

                const option = await selectElement.findElement(By.css(`option[value="${preferenceValue}"]`));
                await option.click();

                log(`Dropdown ${i + 1}: ${preferenceValue}`, 'success');
                await addDelay(5 + i);
            } catch (error) {
                log(`Could not select ${preferenceValue} in dropdown ${i + 1}`, 'warning');
            }
        }

        // Ensure we've reached target time before submitting
        const elapsed = Date.now() - startTime;
        const remainingTime = Math.max(0, CONFIG.totalTimeTaken - elapsed - 100); // Reserve 100ms for submit
        if (remainingTime > 0) await sleep(remainingTime);

        const submitButton = await form.findElement(By.css('input[type="submit"], button[type="submit"]')).catch(() => null);
        if (submitButton) {
            await submitButton.click();
            const endTime = Date.now();
            const timeTaken = endTime - startTime;

            log('========================================', 'success');
            log(`FORM SUBMITTED SUCCESSFULLY!`, 'success');
            log(`Time taken: ${timeTaken}ms (${(timeTaken / 1000).toFixed(2)}s)`, 'success');
            log('========================================', 'success');

            return true;
        } else {
            log('Submit button not found!', 'error');
            return false;
        }

    } catch (error) {
        log(`Error filling form: ${error.message}`, 'error');
        return false;
    }
}

// ============================================
// MONITORING AND MAIN LOGIC
// ============================================

/**
 * Continuously monitor the page for the target form
 */
async function monitorPage(driver) {
    let lastUrl = '';
    let monitoringCount = 0;

    while (true) {
        try {
            monitoringCount++;

            // Check if page has reloaded by comparing URL
            const currentUrl = await driver.getCurrentUrl();
            if (currentUrl !== lastUrl) {
                log(`Page detected: ${currentUrl}`, 'info');
                lastUrl = currentUrl;
            }

            // Log periodic status
            if (monitoringCount % 10 === 0) {
                log(`Monitoring... (${monitoringCount} checks)`, 'watching');
            }

            // Enable verbose logging every 10th check
            const verbose = monitoringCount % 10 === 0;

            // FIRST: Check for forms in the main page
            const forms = await driver.findElements(By.css('form'));
            if (forms.length > 0 && verbose) {
                log(`Found ${forms.length} form(s) on main page`, 'info');
            }

            for (const form of forms) {
                const isTarget = await isTargetForm(form, verbose);
                if (isTarget) {
                    log('TARGET FORM FOUND ON MAIN PAGE! Starting auto-fill...', 'success');
                    const success = await fillForm(form);
                    if (success) {
                        log('Mission accomplished! Keeping browser open for review.', 'success');
                        await sleep(5000);
                    }
                }
            }

            // SECOND: Check for forms inside iframes
            const iframes = await driver.findElements(By.css('iframe'));
            if (iframes.length > 0 && verbose) {
                log(`Found ${iframes.length} iframe(s), checking each...`, 'info');
            }

            for (let i = 0; i < iframes.length; i++) {
                try {
                    // Switch to iframe
                    await driver.switchTo().frame(i);

                    // Find forms inside this iframe
                    const iframeForms = await driver.findElements(By.css('form'));

                    if (iframeForms.length > 0 && verbose) {
                        log(`Found ${iframeForms.length} form(s) in iframe #${i}`, 'info');
                    }

                    for (const form of iframeForms) {
                        const isTarget = await isTargetForm(form, verbose);
                        if (isTarget) {
                            log(`TARGET FORM FOUND IN IFRAME #${i}! Starting auto-fill...`, 'success');
                            const success = await fillForm(form);
                            if (success) {
                                log('Mission accomplished! Keeping browser open for review.', 'success');
                                await sleep(5000);
                            }
                        }
                    }

                    // Switch back to main content
                    await driver.switchTo().defaultContent();
                } catch (iframeError) {
                    // Switch back to main content if error
                    await driver.switchTo().defaultContent();
                    if (verbose) {
                        log(`Error checking iframe #${i}: ${iframeError.message}`, 'warning');
                    }
                }
            }

            // Wait before next check
            await sleep(CONFIG.checkInterval);

        } catch (error) {
            // Make sure we're back to default content
            try {
                await driver.switchTo().defaultContent();
            } catch (e) {}

            // If we get a stale element or navigation error, the page might have reloaded
            if (error.name === 'StaleElementReferenceError' ||
                error.message.includes('navigation') ||
                error.message.includes('document unloaded')) {
                log('Page reload detected, continuing monitoring...', 'info');
                await sleep(CONFIG.pageReloadCheckInterval);
            } else {
                log(`Monitoring error: ${error.message}`, 'error');
                await sleep(CONFIG.checkInterval);
            }
        }
    }
}

/**
 * Get Chrome binary path based on OS
 */
function getChromePath() {
    const platform = os.platform();

    if (platform === 'linux') {
        // Ubuntu/Linux paths - try multiple common locations
        const paths = [
            '/usr/bin/google-chrome',
            '/usr/bin/google-chrome-stable',
            '/usr/bin/chromium-browser',
            '/usr/bin/chromium',
            '/snap/bin/chromium'
        ];

        for (const chromePath of paths) {
            if (fs.existsSync(chromePath)) {
                return chromePath;
            }
        }
    } else if (platform === 'darwin') {
        // macOS paths
        return '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
    } else if (platform === 'win32') {
        // Windows paths
        const paths = [
            'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
            'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe'
        ];

        for (const chromePath of paths) {
            if (fs.existsSync(chromePath)) {
                return chromePath;
            }
        }
    }

    return null; // Let Selenium find it automatically
}

/**
 * Get user data directory path based on OS
 */
function getUserDataDir() {
    const platform = os.platform();
    const homeDir = os.homedir();

    if (platform === 'linux') {
        return path.join(homeDir, '.config', 'google-chrome');
    } else if (platform === 'darwin') {
        return path.join(homeDir, 'Library', 'Application Support', 'Google', 'Chrome');
    } else if (platform === 'win32') {
        return path.join(homeDir, 'AppData', 'Local', 'Google', 'Chrome', 'User Data');
    }

    return null;
}

/**
 * Main entry point
 */
async function main() {
    log('===========================================', 'info');
    log('LALALAND PRODUCTION BOT STARTING...', 'info');
    log('===========================================', 'info');
    log(`Target URL: ${CONFIG.lalaurl}`, 'info');
    log(`Check interval: ${CONFIG.checkInterval}ms`, 'info');
    log('', 'info');

    const options = new chrome.Options();

    // Get Chrome binary path for the current OS
    const chromePath = getChromePath();
    if (chromePath) {
        options.setChromeBinaryPath(chromePath);
        log(`Using Chrome at: ${chromePath}`, 'info');
    }

    // Use a separate user data directory to avoid conflicts with running Chrome
    // Add process ID to make it unique so multiple scripts can run simultaneously
    const userDataDir = getUserDataDir();
    const botProfileDir = userDataDir ? `${userDataDir}-bot-${process.pid}` : path.join(os.tmpdir(), `chrome-bot-profile-${process.pid}`);

    options.addArguments(`--user-data-dir=${botProfileDir}`);
    log(`Using bot profile at: ${botProfileDir}`, 'info');

    // Disable automation detection
    options.excludeSwitches('enable-automation');
    options.addArguments('--disable-blink-features=AutomationControlled');

    // Additional flags
    options.addArguments('--no-first-run');
    options.addArguments('--no-default-browser-check');

    try {
        const driver = await new Builder()
            .forBrowser('chrome')
            .setChromeOptions(options)
            .build();

        log('Chrome browser opened', 'success');

        log(`Navigating to ${CONFIG.lalaurl}...`, 'info');
        await driver.get(CONFIG.lalaurl);

        log('Starting continuous monitoring...', 'watching');
        log('Bot will auto-detect and fill the target form when it appears', 'watching');
        log('Press Ctrl+C to stop', 'info');
        log('', 'info');

        await monitorPage(driver);

    } catch (error) {
        log(`Fatal error: ${error.message}`, 'error');
        console.error(error);
    } finally {
        // Keep browser open for manual review
        log('Browser will remain open. Close manually when done.', 'info');
    }
}

// Handle graceful shutdown
process.on('SIGINT', () => {
    log('Shutdown signal received. Exiting...', 'warning');
    process.exit(0);
});

// Run the bot
main().catch(error => {
    log(`Fatal error: ${error.message}`, 'error');
    console.error(error);
    process.exit(1);
});
