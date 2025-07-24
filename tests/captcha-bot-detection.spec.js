const { test, expect, chromium } = require("@playwright/test");
const path = require("path");

test.setTimeout(60000); // Increase timeout for slow network

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
  await page.goto("https://captcha-ex.rf.gd"); // or your test page

  // Simulate bot-like behavior
  await page.mouse.move(10, 1000);
  await page.mouse.down();
  await page.mouse.move(210, 1000, { steps: 1000 });
  await page.mouse.up();
  await page.waitForTimeout(1000);

  // Wait for either modal to appear
  const textModal = page.locator("#captchaTextModalOverlay");
  const puzzleModal = page.locator("#captchaModalOverlay");

  await expect(textModal.or(puzzleModal)).toBeVisible({ timeout: 20000 });

  if (await textModal.isVisible()) {
    // Wait for question to load
    await page.waitForFunction(
      () => {
        const el = document.getElementById("captchaQuestion");
        return el && el.textContent && el.textContent !== "Loading question...";
      },
      null,
      { timeout: 10000 }
    );
    const question = await page.locator("#captchaQuestion").innerText();
    // TODO: Parse question and compute answer, or use a known answer for testing
    await page.fill("#captchaAnswer", "4"); // Replace with real answer logic if needed
    await page.click("#submitBtn");
    // Optionally, check for success message
    await expect(page.locator("#message")).toHaveText(/CAPTCHA passed!/i, {
      timeout: 5000,
    });
  } else if (await puzzleModal.isVisible()) {
    // Wait for puzzle pieces and verify button to be ready
    await page.waitForSelector("#puzzle-container img", { timeout: 10000 });
    await page.waitForSelector("#verify-btn:not([disabled])", {
      timeout: 10000,
    });

    // Listen for browser console logs
    page.on("console", (msg) => {
      if (msg.type() === "log" || msg.type() === "error") {
        console.log("BROWSER LOG:", msg.text());
      }
    });

    // Try both click methods
    await page.click("#verify-btn");
    await page.waitForTimeout(1000); // Wait for any async JS

    // If no log, try JS click
    await page.evaluate(() => {
      document.getElementById("verify-btn").click();
    });
    await page.waitForTimeout(2000); // Wait for any async JS

    // Optionally, check for a result message or modal close
    // await expect(page.locator("#puzzleMessage")).toHaveText(/Puzzle verified!/i, { timeout: 5000 });
  } else {
    throw new Error("No known CAPTCHA modal appeared.");
  }

  await context.close();
});
