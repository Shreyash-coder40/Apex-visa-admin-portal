const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  
  page.on('console', msg => console.log('BROWSER CONSOLE:', msg.type(), msg.text()));
  page.on('pageerror', err => console.log('BROWSER ERROR:', err.message));

  console.log('Navigating...');
  await page.goto('http://localhost:5173/');
  await page.waitForLoadState('networkidle');

  console.log('Clicking Clients...');
  await page.click('text=Clients');
  await page.waitForTimeout(1000);
  
  // Find a client card or row and click it
  // Wait, in Clients list, they might be in a list/table. Let's just click the first client name.
  // Wait for the client list to load
  await page.waitForSelector('text=Convert'); // If there is a convert button? No, that's leads.
  // Let's just wait and click the first table row in the clients list
  const rows = await page.$$('tr');
  if (rows.length > 1) {
    await rows[1].click();
    await page.waitForTimeout(1000);
  }

  console.log('Clicking Edit Profile...');
  try {
    await page.click('text=Edit Profile');
    console.log('Clicked successfully.');
  } catch(err) {
    console.log('Failed to click Edit Profile', err.message);
  }

  await page.waitForTimeout(1000);
  await browser.close();
})();
