const { test, expect, chromium } = require("@playwright/test");
const path = require("path");

test("captcha triggers on bot-like behavior", async () => {
  const extensionPath = path.join(__dirname, "..");

  const context = await chromium.launchPersistentContext("", {
    headless: false,
    args: [
      `--disable-extensions-except=${extensionPath}`,
      `--load-extension=${extensionPath}`,
    ],
  });

  const page = await context.newPage();
  await page.goto("https://captcha-ex.rf.gd"); // Use your test page

  // Simulate bot-like behavior: single smooth linear mouse movement
  await page.mouse.move(10, 1000);
  await page.mouse.down();
  await page.mouse.move(210, 1000, { steps: 1000 }); // Move horizontally in 100 steps
  await page.mouse.up();
  await page.waitForTimeout(1000); // Wait for detection interval

  // Wait for the captcha modal to appear
  const modal = await page.waitForSelector("#captcha-modal", {
    timeout: 300000,
  });
  expect(await modal.isVisible()).toBe(true);

  // Solve a text captcha
  const question = await page
    .locator("#captcha-modal .captcha-question")
    .innerText();
  const answer = solveCaptcha(question);
  await page.fill("#captcha-modal input[type='text']", answer);
  await page.click("#captcha-modal button[type='submit']");

  await context.close();
});

// Helper function (example)
function solveCaptcha(question) {
  // Implement logic to parse and solve the question
  // For example, if question is "What is 2 + 2?", return "4"
  // This is just a placeholder
  return "4";
}
