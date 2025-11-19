import { chromium } from "@playwright/test";
import * as fs from "fs";
import * as path from "path";
import { fileURLToPath } from "url";
import { dirname } from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

async function captureScreenshots() {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });

  // Create screenshots directory
  const screenshotsDir = path.join(__dirname, "..", "screenshots");
  if (!fs.existsSync(screenshotsDir)) {
    fs.mkdirSync(screenshotsDir, { recursive: true });
  }

  console.log("Starting screenshot capture...");

  // Navigate to the app
  await page.goto("http://localhost:5173");
  await page.waitForLoadState("networkidle");

  // 1. Main screen (file upload)
  console.log("Capturing main screen...");
  await page.screenshot({
    path: path.join(screenshotsDir, "01-main-screen.png"),
    fullPage: false,
  });

  // 2. Select a file to show file info
  console.log("Capturing file selected state...");
  const testContent = "A".repeat(1024 * 1024); // 1MB file
  const fileChooserPromise = page.waitForEvent("filechooser");
  await page.getByText(/Drop file here or click to select/i).click();
  const fileChooser = await fileChooserPromise;
  await fileChooser.setFiles({
    name: "test-document.pdf",
    mimeType: "application/pdf",
    buffer: Buffer.from(testContent),
  });

  // Wait for file info to appear
  await page.waitForTimeout(500);
  await page.screenshot({
    path: path.join(screenshotsDir, "02-file-selected.png"),
    fullPage: false,
  });

  // 3. Add description
  console.log("Capturing description input...");
  const descriptionField = page.getByPlaceholder(/Add a description/i);
  await descriptionField.fill(
    "Q4 Financial Report - Contains sensitive company data and projections"
  );
  await page.waitForTimeout(300);
  await page.screenshot({
    path: path.join(screenshotsDir, "03-with-description.png"),
    fullPage: false,
  });

  // 4. Start computation and capture progress
  console.log("Capturing hashing progress...");
  await page.getByRole("button", { name: /Compute SHA256 Hash/i }).click();

  // Wait for progress to appear
  await page.waitForSelector('text=/Computing hash/i');
  await page.waitForTimeout(200); // Wait for progress to start

  await page.screenshot({
    path: path.join(screenshotsDir, "04-hashing-progress.png"),
    fullPage: false,
  });

  // 5. Wait for completion and capture result
  console.log("Waiting for completion and capturing result...");
  await page.waitForSelector('text=/Hash computed successfully/i', {
    timeout: 30000,
  });
  await page.waitForTimeout(500); // Let the UI settle

  await page.screenshot({
    path: path.join(screenshotsDir, "05-result-page.png"),
    fullPage: false,
  });

  // 6. Capture result page scrolled (if needed)
  await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
  await page.waitForTimeout(300);
  await page.screenshot({
    path: path.join(screenshotsDir, "06-result-page-full.png"),
    fullPage: true,
  });

  console.log("✅ All screenshots captured successfully!");
  console.log(`Screenshots saved to: ${screenshotsDir}`);

  await browser.close();
}

// Run the function
captureScreenshots().catch((error) => {
  console.error("Error capturing screenshots:", error);
  process.exit(1);
});

