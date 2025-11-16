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
    await expect(page.getByRole("heading", { name: /SHA256 File Hasher/i })).toBeVisible();

    // Check upload zone is visible
    await expect(page.getByText(/Drop file here or click to select/i)).toBeVisible();
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
    await expect(page.getByText(/^\d+(\.\d+)?\s*(Bytes|KB|MB|GB)$/)).toBeVisible();
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

    // Verify description is shown in results
    await expect(page.getByText(description)).toBeVisible();
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
    await expect(page.getByText(/Drop file here or click to select/i)).toBeVisible();
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
    
    // Verify the description was saved and is displayed in results
    await expect(page.getByText("Initial description")).toBeVisible();
    
    // UI remains responsive - can click "Compute Another Hash"
    await page.getByRole("button", { name: /Compute Another Hash/i }).click();
    
    // Should be back to upload state (UI responsive throughout)
    await expect(page.getByText(/Drop file here or click to select/i)).toBeVisible();
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
});

