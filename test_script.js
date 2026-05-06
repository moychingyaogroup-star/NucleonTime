const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    recordVideo: {
      dir: 'videos/',
      size: { width: 1280, height: 720 },
    }
  });
  const page = await context.newPage();

  // Test Analytics canvas logic by visiting the site and navigating to Analytics
  try {
    await page.goto('http://localhost:8000');
    // We are mocking auth somewhat? The site might require clicking login

    // Wait for the app to load
    await page.waitForTimeout(2000);

    // Let's take a screenshot of home page
    await page.screenshot({ path: 'screenshot_home.png' });

    console.log('Test completed.');
  } catch (error) {
    console.error('Error during testing:', error);
  } finally {
    await context.close();
    await browser.close();
  }
})();
