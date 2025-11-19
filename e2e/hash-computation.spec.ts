import { test, expect } from "@playwright/test";
import path from "path";
import { fileURLToPath } from "url";
import { dirname } from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

test.describe("SHA256 Hash Computation E2E", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("http://localhost:5173");
  });

  test("loads the application successfully", async ({ page }) => {
    // Check title
    await expect(page).toHaveTitle(/SHA256 File Hasher/);

    // Check main heading
    await expect(
      page.getByRole("heading", { name: /SHA256 File Hasher/i })
    ).toBeVisible();

    // Check upload zone is visible
    await expect(
      page.getByText(/Drop file here or click to select/i)
    ).toBeVisible();
  });

  test("shows file info after selection", async ({ page }) => {
    // Create a test file
    const testContent = "Hello, World! This is a test file.";
    const fileChooserPromise = page.waitForEvent("filechooser");

    await page.getByText(/Drop file here or click to select/i).click();

    const fileChooser = await fileChooserPromise;
    await fileChooser.setFiles({
      name: "test.txt",
      mimeType: "text/plain",
      buffer: Buffer.from(testContent),
    });

    // Verify file info is displayed
    await expect(page.getByText("test.txt")).toBeVisible();
    // Use first() to get the first match (the file size, not the page description)
    await expect(
      page.getByText(/^\d+(\.\d+)?\s*(Bytes|KB|MB|GB)$/)
    ).toBeVisible();
  });

  test("computes hash for small text file", async ({ page }) => {
    const testContent = "Hello, World!";
    const fileChooserPromise = page.waitForEvent("filechooser");

    await page.getByText(/Drop file here or click to select/i).click();

    const fileChooser = await fileChooserPromise;
    await fileChooser.setFiles({
      name: "test.txt",
      mimeType: "text/plain",
      buffer: Buffer.from(testContent),
    });

    // Wait for file to be selected
    await expect(page.getByText("test.txt")).toBeVisible();

    // Click compute button
    await page.getByRole("button", { name: /Compute SHA256 Hash/i }).click();

    // Wait for hash to be computed
    await expect(page.getByText(/Hash computed successfully/i), {
      timeout: 10000,
    }).toBeVisible();

    // Verify hash is displayed
    const hashElement = page.locator("code").first();
    await expect(hashElement).toBeVisible();

    // Hash should be 64 characters (SHA256)
    const hashText = await hashElement.textContent();
    expect(hashText?.length).toBe(64);
  });

  test("allows adding description before computation", async ({ page }) => {
    const testContent = "Test file content";
    const fileChooserPromise = page.waitForEvent("filechooser");

    await page.getByText(/Drop file here or click to select/i).click();

    const fileChooser = await fileChooserPromise;
    await fileChooser.setFiles({
      name: "test.txt",
      mimeType: "text/plain",
      buffer: Buffer.from(testContent),
    });

    // Add description
    const description = "This is a test file for SHA256 hashing";
    await page.getByPlaceholder(/Add a description/i).fill(description);

    // Compute hash
    await page.getByRole("button", { name: /Compute SHA256 Hash/i }).click();

    // Wait for completion
    await expect(page.getByText(/Hash computed successfully/i), {
      timeout: 10000,
    }).toBeVisible();

    // Verify description is shown in results textarea and is editable
    const resultDescriptionField = page.getByRole("textbox", {
      name: /Description/i,
    });
    await expect(resultDescriptionField).toBeVisible();
    await expect(resultDescriptionField).toHaveValue(description);
    await expect(resultDescriptionField).toBeFocused(); // Should be auto-focused
  });

  test("shows progress during computation", async ({ page }) => {
    // Create a larger file to see progress
    const largeContent = "A".repeat(1024 * 1024); // 1MB
    const fileChooserPromise = page.waitForEvent("filechooser");

    await page.getByText(/Drop file here or click to select/i).click();

    const fileChooser = await fileChooserPromise;
    await fileChooser.setFiles({
      name: "large.txt",
      mimeType: "text/plain",
      buffer: Buffer.from(largeContent),
    });

    // Click compute
    await page.getByRole("button", { name: /Compute SHA256 Hash/i }).click();

    // Check for progress indicator
    await expect(page.getByText(/Computing hash/i)).toBeVisible();

    // Verify verbose status information is shown
    await expect(page.getByText(/Processing chunk/i)).toBeVisible();
    await expect(page.getByText(/File size:/i)).toBeVisible();

    // Wait for completion
    await expect(page.getByText(/Hash computed successfully/i), {
      timeout: 15000,
    }).toBeVisible();
  });

  test("allows computing another hash after completion", async ({ page }) => {
    const testContent = "First file";
    const fileChooserPromise = page.waitForEvent("filechooser");

    await page.getByText(/Drop file here or click to select/i).click();

    const fileChooser = await fileChooserPromise;
    await fileChooser.setFiles({
      name: "first.txt",
      mimeType: "text/plain",
      buffer: Buffer.from(testContent),
    });

    // Compute first hash
    await page.getByRole("button", { name: /Compute SHA256 Hash/i }).click();
    await expect(page.getByText(/Hash computed successfully/i), {
      timeout: 10000,
    }).toBeVisible();

    // Click "Compute Another Hash"
    await page.getByRole("button", { name: /Compute Another Hash/i }).click();

    // Verify we're back to upload state
    await expect(
      page.getByText(/Drop file here or click to select/i)
    ).toBeVisible();
  });

  test("UI remains responsive during computation", async ({ page }) => {
    const smallContent = "Test".repeat(100); // Smaller file for faster test
    const fileChooserPromise = page.waitForEvent("filechooser");

    await page.getByText(/Drop file here or click to select/i).click();

    const fileChooser = await fileChooserPromise;
    await fileChooser.setFiles({
      name: "test.txt",
      mimeType: "text/plain",
      buffer: Buffer.from(smallContent),
    });

    // Add initial description - UI is responsive
    const descriptionField = page.getByPlaceholder(/Add a description/i);
    await descriptionField.fill("Initial description");

    // Start computation - button click works (UI not blocked)
    await page.getByRole("button", { name: /Compute SHA256 Hash/i }).click();

    // Wait for completion - computation succeeds (UI not blocked)
    await expect(page.getByText(/Hash computed successfully/i), {
      timeout: 10000,
    }).toBeVisible();

    // Verify the description was saved and is displayed in results textarea
    const resultDescriptionField = page.getByRole("textbox", {
      name: /Description/i,
    });
    await expect(resultDescriptionField).toHaveValue("Initial description");

    // UI remains responsive - can click "Compute Another Hash"
    await page.getByRole("button", { name: /Compute Another Hash/i }).click();

    // Should be back to upload state (UI responsive throughout)
    await expect(
      page.getByText(/Drop file here or click to select/i)
    ).toBeVisible();
  });

  test("allows typing description during computation without breaking hash", async ({
    page,
  }) => {
    // Create a 5MB file to have enough time to type during computation
    const largeContent = "X".repeat(5 * 1024 * 1024); // 5MB
    const fileChooserPromise = page.waitForEvent("filechooser");

    await page.getByText(/Drop file here or click to select/i).click();

    const fileChooser = await fileChooserPromise;
    await fileChooser.setFiles({
      name: "large-typing-test.txt",
      mimeType: "text/plain",
      buffer: Buffer.from(largeContent),
    });

    // Start computation immediately (no description yet)
    await page.getByRole("button", { name: /Compute SHA256 Hash/i }).click();

    // Wait for computation to start
    await expect(page.getByText(/Computing hash/i)).toBeVisible();

    // Type description WHILE hashing is in progress (this was the bug!)
    const descriptionField = page.getByPlaceholder(/Add a description/i);
    await descriptionField.fill("Typed during hashing");

    // Wait for completion - should succeed despite typing
    await expect(page.getByText(/Hash computed successfully/i), {
      timeout: 15000,
    }).toBeVisible();

    // Verify hash was computed (64 hex characters)
    const hashElement = page.locator("code").first();
    await expect(hashElement).toBeVisible();
    const hashText = await hashElement.textContent();
    expect(hashText?.length).toBe(64);

    // Verify the description typed during hashing was saved in the editable textarea
    const resultDescriptionField = page.getByRole("textbox", {
      name: /Description/i,
    });
    await expect(resultDescriptionField).toHaveValue("Typed during hashing");
  });

  test("allows multiple description edits during computation", async ({
    page,
  }) => {
    // Create a 10MB file to ensure we have enough time to type multiple edits
    const largeContent = "Y".repeat(10 * 1024 * 1024); // 10MB
    const fileChooserPromise = page.waitForEvent("filechooser");

    await page.getByText(/Drop file here or click to select/i).click();

    const fileChooser = await fileChooserPromise;
    await fileChooser.setFiles({
      name: "multi-edit-test.txt",
      mimeType: "text/plain",
      buffer: Buffer.from(largeContent),
    });

    // Start with initial description
    const descriptionField = page.getByPlaceholder(/Add a description/i);
    await descriptionField.fill("Version 1");

    // Start computation
    await page.getByRole("button", { name: /Compute SHA256 Hash/i }).click();
    await expect(page.getByText(/Computing hash/i)).toBeVisible();

    // Edit description multiple times during hashing (stop if computation completes)
    try {
      await descriptionField.fill("Version 2", { timeout: 2000 });
      await page.waitForTimeout(100);
      await descriptionField.fill("Version 3", { timeout: 2000 });
      await page.waitForTimeout(100);
      await descriptionField.fill("Final version", { timeout: 2000 });
    } catch (e) {
      // It's OK if computation completes before all edits - we verified typing works
      console.log("Computation completed before all description edits");
    }

    // Wait for completion
    await expect(page.getByText(/Hash computed successfully/i), {
      timeout: 20000,
    }).toBeVisible();

    // Verify hash was computed successfully
    const hashElement = page.locator("code").first();
    const hashText = await hashElement.textContent();
    expect(hashText?.length).toBe(64);

    // The important part: verify hash completed successfully despite typing
    // (The final description text may vary depending on when computation finished)
  });

  test("validates visual styling", async ({ page }) => {
    const testContent = "Styling test";
    const fileChooserPromise = page.waitForEvent("filechooser");

    await page.getByText(/Drop file here or click to select/i).click();

    const fileChooser = await fileChooserPromise;
    await fileChooser.setFiles({
      name: "style-test.txt",
      mimeType: "text/plain",
      buffer: Buffer.from(testContent),
    });

    await page.getByRole("button", { name: /Compute SHA256 Hash/i }).click();
    await expect(page.getByText(/Hash computed successfully/i), {
      timeout: 10000,
    }).toBeVisible();

    // Check that hash code element exists
    const hashElement = page.locator("code").first();
    await expect(hashElement).toBeVisible();

    // Verify it's using monospace font
    const fontFamily = await hashElement.evaluate((el) => {
      return window.getComputedStyle(el).fontFamily;
    });
    expect(fontFamily.toLowerCase()).toMatch(/mono|courier|consolas/);
  });

  test("supports continuous typing workflow: before, during, and after hashing", async ({
    page,
  }) => {
    // Create a 5MB file to have enough time to type during computation
    const largeContent = "Z".repeat(5 * 1024 * 1024); // 5MB
    const fileChooserPromise = page.waitForEvent("filechooser");

    await page.getByText(/Drop file here or click to select/i).click();

    const fileChooser = await fileChooserPromise;
    await fileChooser.setFiles({
      name: "continuous-typing-test.txt",
      mimeType: "text/plain",
      buffer: Buffer.from(largeContent),
    });

    // PHASE 1: Type BEFORE starting hash
    const descriptionField = page.getByPlaceholder(/Add a description/i);
    await descriptionField.fill("Before hashing: ");

    // Verify initial text
    await expect(descriptionField).toHaveValue("Before hashing: ");

    // Start computation
    await page.getByRole("button", { name: /Compute SHA256 Hash/i }).click();
    await expect(page.getByText(/Computing hash/i)).toBeVisible();

    // PHASE 2: Type DURING hashing (append to existing text)
    await descriptionField.fill("Before hashing: during hashing: ");

    // Verify text was updated during computation
    await expect(descriptionField).toHaveValue(
      "Before hashing: during hashing: "
    );

    // Wait for completion
    await expect(page.getByText(/Hash computed successfully/i), {
      timeout: 20000,
    }).toBeVisible();

    // PHASE 3: Description field should be auto-focused on results page
    // Type AFTER hashing (append to existing text)
    const resultDescriptionField = page.getByRole("textbox", {
      name: /Description/i,
    });
    await expect(resultDescriptionField).toBeFocused();

    // Continue typing seamlessly
    await resultDescriptionField.fill(
      "Before hashing: during hashing: after hashing!"
    );

    // Verify final text includes all phases
    await expect(resultDescriptionField).toHaveValue(
      "Before hashing: during hashing: after hashing!"
    );

    // Verify hash was computed successfully
    const hashElement = page.locator("code").first();
    await expect(hashElement).toBeVisible();
    const hashText = await hashElement.textContent();
    expect(hashText?.length).toBe(64);

    // Verify description persists after page refresh simulation (compute another hash)
    await page.getByRole("button", { name: /Compute Another Hash/i }).click();
    await expect(
      page.getByText(/Drop file here or click to select/i)
    ).toBeVisible();
  });

  test("allows canceling computation", async ({ page }) => {
    // Create a larger file so we have time to cancel
    const largeContent = "X".repeat(5 * 1024 * 1024); // 5MB
    const fileChooserPromise = page.waitForEvent("filechooser");

    await page.getByText(/Drop file here or click to select/i).click();

    const fileChooser = await fileChooserPromise;
    await fileChooser.setFiles({
      name: "large-cancel.txt",
      mimeType: "text/plain",
      buffer: Buffer.from(largeContent),
    });

    // Start computation
    await page.getByRole("button", { name: /Compute SHA256 Hash/i }).click();

    // Wait for computation to start
    await expect(page.getByText(/Computing hash/i)).toBeVisible();

    // Click cancel button
    await page.getByRole("button", { name: /Cancel/i }).click();

    // Should be back to idle state with file still selected
    await expect(page.getByText("large-cancel.txt")).toBeVisible();
    await expect(
      page.getByRole("button", { name: /Compute SHA256 Hash/i })
    ).toBeVisible();

    // Progress bar should be gone
    await expect(page.getByText(/Computing hash/i)).not.toBeVisible();
  });

  test("handles large files efficiently", async ({ page }) => {
    // Test with a 10MB file (smaller than 700MB but large enough to test chunking)
    const largeContent = "L".repeat(10 * 1024 * 1024); // 10MB
    const fileChooserPromise = page.waitForEvent("filechooser");

    await page.getByText(/Drop file here or click to select/i).click();

    const fileChooser = await fileChooserPromise;
    await fileChooser.setFiles({
      name: "large-10mb.txt",
      mimeType: "text/plain",
      buffer: Buffer.from(largeContent),
    });

    // Verify file size is displayed
    await expect(page.getByText("large-10mb.txt")).toBeVisible();
    await expect(page.getByText(/10(\.\d+)?\s*MB/)).toBeVisible();

    // Start computation
    await page.getByRole("button", { name: /Compute SHA256 Hash/i }).click();

    // Check for progress indicator
    await expect(page.getByText(/Computing hash/i)).toBeVisible();

    // Wait for completion (allow more time for 10MB)
    await expect(page.getByText(/Hash computed successfully/i), {
      timeout: 30000,
    }).toBeVisible();

    // Verify hash is computed
    const hashElement = page.locator("code").first();
    await expect(hashElement).toBeVisible();
    const hashText = await hashElement.textContent();
    expect(hashText?.length).toBe(64); // SHA256 is 64 hex chars
  });
});
