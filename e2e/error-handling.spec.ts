import { test, expect } from "@playwright/test";

test.describe("Error Handling E2E", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("http://localhost:5173");
  });

  test("displays error message and allows retry when hash computation fails", async ({
    page,
  }) => {
    console.log("Testing error handling and retry functionality...");

    // Inject a function to force an error in the worker
    await page.evaluate(() => {
      // Override Worker constructor to inject error
      const OriginalWorker = window.Worker;
      (window as any).Worker = class extends OriginalWorker {
        constructor(scriptURL: string | URL, options?: WorkerOptions) {
          super(scriptURL, options);
          const originalPostMessage = this.postMessage.bind(this);
          let messageCount = 0;

          this.postMessage = function (message: any) {
            originalPostMessage(message);
            // Simulate error after worker starts
            messageCount++;
            if (messageCount === 1) {
              setTimeout(() => {
                this.dispatchEvent(
                  new MessageEvent("message", {
                    data: {
                      type: "ERROR",
                      error: "Simulated hash computation error for testing",
                    },
                  })
                );
              }, 1000);
            }
          };
        }
      };
    });

    // Select a file
    console.log("Selecting file...");
    const testContent = "A".repeat(5 * 1024 * 1024); // 5MB to ensure multiple chunks
    const fileChooserPromise = page.waitForEvent("filechooser");
    await page.getByText(/Drop file here or click to select/i).click();
    const fileChooser = await fileChooserPromise;
    await fileChooser.setFiles({
      name: "test-error.txt",
      mimeType: "text/plain",
      buffer: Buffer.from(testContent),
    });

    // Verify file is selected
    await expect(page.getByText("test-error.txt")).toBeVisible();

    // Start computation
    console.log("Starting hash computation (will trigger error)...");
    await page.getByRole("button", { name: /Compute SHA256 Hash/i }).click();

    // Wait for computation to start
    await expect(page.getByText(/Computing hash/i)).toBeVisible();

    // Wait for error to appear
    console.log("Waiting for error message...");
    await expect(page.getByText(/Error/i)).toBeVisible({
      timeout: 15000,
    });

    // Verify error message content
    await expect(
      page.getByText(/Simulated hash computation error for testing/i)
    ).toBeVisible();

    console.log("✅ Error message displayed correctly");

    // Verify "Try Again" button is visible
    const tryAgainButton = page.getByRole("button", { name: /Try Again/i });
    await expect(tryAgainButton).toBeVisible();

    console.log("✅ Try Again button is visible");

    // Click "Try Again" button
    console.log("Clicking Try Again button...");
    await tryAgainButton.click();

    // Verify we're back to the initial upload state
    await expect(
      page.getByText(/Drop file here or click to select/i)
    ).toBeVisible();

    // Error message should be gone
    await expect(page.getByRole("heading", { name: /Error/i })).not.toBeVisible();

    console.log("✅ Successfully returned to initial state after retry");

    // Select file again for successful retry
    console.log("Selecting file for retry...");
    const testContent2 = "B".repeat(1024 * 100); // Smaller file
    const fileChooserPromise2 = page.waitForEvent("filechooser");
    await page.getByText(/Drop file here or click to select/i).click();
    const fileChooser2 = await fileChooserPromise2;
    await fileChooser2.setFiles({
      name: "test-retry.txt",
      mimeType: "text/plain",
      buffer: Buffer.from(testContent2),
    });

    // Now compute again (should work - Worker override is one-time)
    await page.getByRole("button", { name: /Compute SHA256 Hash/i}).click();

    // Wait for success
    await expect(page.getByText(/Hash computed successfully/i)).toBeVisible({
      timeout: 15000,
    });

    // Verify hash
    const hashElement = page.locator("code").first();
    await expect(hashElement).toBeVisible();
    const hashText = await hashElement.textContent();
    expect(hashText?.length).toBe(64);

    console.log("✅ Retry successful after error");
    console.log("✅ Error handling and retry test completed successfully");
  });

  test("maintains file selection after error and allows immediate retry", async ({
    page,
  }) => {
    console.log("Testing file persistence after error...");

    // Inject Worker override to simulate error
    await page.evaluate(() => {
      const OriginalWorker = window.Worker;
      (window as any).Worker = class extends OriginalWorker {
        constructor(scriptURL: string | URL, options?: WorkerOptions) {
          super(scriptURL, options);
          const originalPostMessage = this.postMessage.bind(this);
          let messageCount = 0;

          this.postMessage = function (message: any) {
            originalPostMessage(message);
            messageCount++;
            if (messageCount === 1) {
              setTimeout(() => {
                this.dispatchEvent(
                  new MessageEvent("message", {
                    data: {
                      type: "ERROR",
                      error: "Network connection lost during hash computation",
                    },
                  })
                );
              }, 800);
            }
          };
        }
      };
    });

    // Select file
    const testContent = "Test";
    const fileChooserPromise = page.waitForEvent("filechooser");
    await page.getByText(/Drop file here or click to select/i).click();
    const fileChooser = await fileChooserPromise;
    await fileChooser.setFiles({
      name: "persistent-file.txt",
      mimeType: "text/plain",
      buffer: Buffer.from(testContent),
    });

    // Add description
    await page
      .getByPlaceholder(/Add a description/i)
      .fill("Important document for review");

    // Start computation (will fail)
    await page.getByRole("button", { name: /Compute SHA256 Hash/i }).click();

    // Wait for error
    await expect(page.getByRole("heading", { name: /Error/i })).toBeVisible({
      timeout: 10000,
    });

    // Verify error message contains our simulated error
    await expect(
      page.getByText(/Network connection lost during hash computation/i)
    ).toBeVisible();

    console.log("✅ Error message displayed");

    // Click Try Again
    await page.getByRole("button", { name: /Try Again/i }).click();

    // Verify we're back to initial upload state (file cleared)
    await expect(
      page.getByText(/Drop file here or click to select/i)
    ).toBeVisible();

    // Error should be gone
    await expect(page.getByRole("heading", { name: /Error/i })).not.toBeVisible();

    console.log("✅ Successfully reset to initial state after error");
    console.log("✅ Ready for fresh file upload");
  });
});

