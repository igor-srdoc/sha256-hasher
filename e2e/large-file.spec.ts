import { test, expect } from "@playwright/test";
import * as fs from "fs";
import * as path from "path";
import { fileURLToPath } from "url";
import { dirname } from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Find any large file in the mock directory (excluding .gitkeep)
const mockDir = path.join(__dirname, "mock");
let LARGE_FILE_PATH: string | null = null;
let LARGE_FILE_NAME: string | null = null;

if (fs.existsSync(mockDir)) {
  const files = fs.readdirSync(mockDir).filter(f => f !== ".gitkeep");
  if (files.length > 0) {
    LARGE_FILE_PATH = path.join(mockDir, files[0]);
    LARGE_FILE_NAME = files[0];
    console.log(`Found test file: ${LARGE_FILE_NAME}`);
  }
}

test.describe("Large File Real-World Testing", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("http://localhost:5173");
  });

  test.skip(!LARGE_FILE_PATH, "skipped: no large file found in e2e/mock/");

  test("handles real large file without hanging", async ({ page }) => {
    // Check if file exists
    expect(LARGE_FILE_PATH).toBeTruthy();
    expect(fs.existsSync(LARGE_FILE_PATH!)).toBe(true);
    
    const fileStats = fs.statSync(LARGE_FILE_PATH!);
    const fileSizeInMB = (fileStats.size / (1024 * 1024)).toFixed(2);
    
    console.log(`Testing with ${LARGE_FILE_NAME}: ${fileSizeInMB}MB`);

    // Set up console error listener to catch any runtime errors
    const consoleErrors: string[] = [];
    page.on("console", (msg) => {
      if (msg.type() === "error") {
        consoleErrors.push(msg.text());
      }
    });

    // Set up page error listener
    const pageErrors: string[] = [];
    page.on("pageerror", (error) => {
      pageErrors.push(error.message);
    });

    // Select file
    const fileChooserPromise = page.waitForEvent("filechooser");
    await page.getByText(/Drop file here or click to select/i).click();
    const fileChooser = await fileChooserPromise;
    await fileChooser.setFiles(LARGE_FILE_PATH!);

    // Verify file is selected
    await expect(page.getByText(LARGE_FILE_NAME!)).toBeVisible();

    // Start computation
    await page.getByRole("button", { name: /Compute SHA256 Hash/i }).click();

    // Wait for computation to start
    await expect(page.getByText(/Computing hash/i)).toBeVisible();

    // Monitor progress updates - check that progress is actually increasing
    const progressUpdates: number[] = [];
    let lastProgress = -1;
    let stuckCount = 0;
    const maxStuckChecks = 20; // Check 20 times (10 seconds)

    for (let i = 0; i < maxStuckChecks; i++) {
      await page.waitForTimeout(500); // Wait 500ms between checks

      // Try to get current progress percentage
      const progressText = await page.locator("text=/\\d+%/").textContent().catch(() => null);

      if (progressText) {
        const currentProgress = parseInt(progressText.replace("%", ""));
        progressUpdates.push(currentProgress);

        console.log(`Progress check ${i + 1}/${maxStuckChecks}: ${currentProgress}%`);

        if (currentProgress === lastProgress) {
          stuckCount++;
          console.log(`  Warning: Progress hasn't changed (stuck count: ${stuckCount})`);
        } else {
          stuckCount = 0; // Reset if progress changed
          lastProgress = currentProgress;
        }

        // If stuck for too long (5 consecutive checks without progress change)
        if (stuckCount >= 5) {
          console.error("ERROR: Progress appears to be stuck!");
          console.error("Progress updates:", progressUpdates);
          console.error("Console errors:", consoleErrors);
          console.error("Page errors:", pageErrors);

          // Take a screenshot for debugging
          await page.screenshot({ path: "test-results/stuck-progress.png" });

          throw new Error(`Progress stuck at ${currentProgress}% for 2.5 seconds`);
        }

        // If we've reached 100%, exit the monitoring loop
        if (currentProgress >= 100) {
          console.log("✅ Progress reached 100%");
          break;
        }
      }
    }

    // Verify no errors occurred
    if (consoleErrors.length > 0) {
      console.error("Console errors detected:", consoleErrors);
    }
    if (pageErrors.length > 0) {
      console.error("Page errors detected:", pageErrors);
    }

    // Wait for completion (give it more time for large files)
    await expect(page.getByText(/Hash computed successfully/i), {
      timeout: 120000, // 2 minutes timeout for very large files
    }).toBeVisible();

    // Verify hash is displayed
    const hashElement = page.locator("code").first();
    await expect(hashElement).toBeVisible();
    const hashText = await hashElement.textContent();
    expect(hashText?.length).toBe(64); // SHA256 is 64 hex chars

    console.log("✅ Test completed successfully");
    console.log(`Final progress updates: [${progressUpdates.join(", ")}]`);

    // Verify we had at least some progress updates
    expect(progressUpdates.length).toBeGreaterThan(0);

    // Verify no errors were thrown
    expect(consoleErrors.filter(e => !e.includes("Download the React DevTools"))).toHaveLength(0);
    expect(pageErrors).toHaveLength(0);
  });

  test("can cancel large file computation", async ({ page }) => {
    // Check if file exists
    if (!LARGE_FILE_PATH) {
      test.skip();
      return;
    }

    const consoleErrors: string[] = [];
    page.on("console", (msg) => {
      if (msg.type() === "error") {
        consoleErrors.push(msg.text());
      }
    });

    // Select file
    const fileChooserPromise = page.waitForEvent("filechooser");
    await page.getByText(/Drop file here or click to select/i).click();
    const fileChooser = await fileChooserPromise;
    await fileChooser.setFiles(LARGE_FILE_PATH!);

    // Start computation
    await page.getByRole("button", { name: /Compute SHA256 Hash/i }).click();
    await expect(page.getByText(/Computing hash/i)).toBeVisible();

    // Wait a bit for computation to be in progress
    await page.waitForTimeout(1000);

    // Cancel
    await page.getByRole("button", { name: /Cancel/i }).click();

    // Should return to idle state
    await expect(page.getByRole("button", { name: /Compute SHA256 Hash/i })).toBeVisible();
    await expect(page.getByText(/Computing hash/i)).not.toBeVisible();

    // Verify no errors during cancel
    expect(consoleErrors.filter(e => !e.includes("Download the React DevTools"))).toHaveLength(0);
  });
});

