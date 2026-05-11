import { chromium } from "playwright";
import fs from "node:fs/promises";
import path from "node:path";
import readline from "node:readline/promises";
import { stdin as input, stdout as output } from "node:process";

const PROJECT_ROOT = "C:/Users/jtayl/portfolio-site";
const IMAGE_ROOT = path.join(PROJECT_ROOT, "public", "images");

const files = [
  { category: "climbing", fileId: "1Wa3UIf9Jk-BYfQBl6hBrFPpDQdLZ7BLQ", newName: "climbing-01.jpg", originalName: "201021_JTP6589.jpg" },
  { category: "climbing", fileId: "1o8GO0UH-4JDDOuWZXnkHDKx7o__SzaDO", newName: "climbing-02.jpg", originalName: "201021_JTP6558.jpg" },
  { category: "climbing", fileId: "1XrUvKfYaads7JHjD__XjAllzD9P92U4D", newName: "climbing-03.jpg", originalName: "201021_JTP6532.jpg" },

  { category: "commercial", fileId: "1nuudmLGY5dk7vKIv9GSbqb83BiPozwIx", newName: "commercial-01.jpg", originalName: "201019_JTP-12.jpg" },
  { category: "commercial", fileId: "18DJVDRo6PuZe_wHOTACOGP9buVHJc_7K", newName: "commercial-02.jpg", originalName: "201019_JTP-11.jpg" },
  { category: "commercial", fileId: "1uhEgkXwiOQhPfYe-oWXagFIwR06TSen_", newName: "commercial-03.jpg", originalName: "201019_JTP-10.jpg" },

  { category: "portraits", fileId: "1CX6poaatPxrONMyZDK6ln-hUuDHysVJP", newName: "portrait-01.jpg", originalName: "200507_JTP3209.jpg" },
  { category: "portraits", fileId: "1NWRP6niYEGbbF8MB3-80peIAVLdsOYY7", newName: "portrait-02.jpg", originalName: "200507_JTP3261.jpg" },
  { category: "portraits", fileId: "1dhnObJTbB-qcdsSqP7Xcay3SVqjWOmFK", newName: "portrait-03.jpg", originalName: "200507_JTP3257.jpg" },

  { category: "product-brand", fileId: "11XvNkfAN5xhx2L5C5WkvrIDciP2yuLRC", newName: "product-01.jpg", originalName: "201018_JTP5816.jpg" },
  { category: "product-brand", fileId: "1cYM4PfB6H6930JICHBodjaAnM2NvUOHj", newName: "product-02.jpg", originalName: "201018_JTP5827.jpg" },
  { category: "product-brand", fileId: "1uHZq4pzk5kDzY8Rjr4qoM3XiU753j7pZ", newName: "product-03.jpg", originalName: "201004_JTP5527.jpg" },

  { category: "personal", fileId: "1MXA77C5LRdAajR-23wFa5Brc1Vdaqg_A", newName: "personal-01.jpg", originalName: "210624_JTP8334.jpg" },
  { category: "personal", fileId: "1ftiC50oD1dKxhrfJCWp8HJz9WXjFEiml", newName: "personal-02.jpg", originalName: "210623_JTP8306.jpg" },
  { category: "personal", fileId: "1NhNMikbUYy0ubepw5RKZwmSi-Eed0jYO", newName: "personal-03.jpg", originalName: "210623_JTP8282.jpg" }
];

async function waitForEnter(message) {
  const rl = readline.createInterface({ input, output });
  await rl.question(message);
  rl.close();
}

async function ensureFolders() {
  for (const file of files) {
    await fs.mkdir(path.join(IMAGE_ROOT, file.category), { recursive: true });
  }
}

async function clickFirstVisible(page, selectors) {
  for (const selector of selectors) {
    const locator = page.locator(selector).first();

    try {
      await locator.waitFor({ state: "visible", timeout: 5000 });
      await locator.click();
      return true;
    } catch {
      // Try next selector
    }
  }

  return false;
}

async function maybeClickDownloadAnyway(page) {
  const selectors = [
    'button:has-text("Download anyway")',
    'a:has-text("Download anyway")',
    'input[value="Download anyway"]',
    'button:has-text("Download")',
    'a:has-text("Download")'
  ];

  return await clickFirstVisible(page, selectors);
}

async function downloadFromDrivePreview(page, file) {
  const viewUrl = `https://drive.google.com/file/d/${file.fileId}/view`;
  const destination = path.join(IMAGE_ROOT, file.category, file.newName);

  console.log("");
  console.log(`Opening: ${file.originalName}`);
  console.log(`Saving as: ${file.category}/${file.newName}`);

  await page.goto(viewUrl, {
    waitUntil: "domcontentloaded",
    timeout: 120000
  });

  await page.waitForTimeout(4000);

  const downloadPromise = page.waitForEvent("download", {
    timeout: 120000
  });

  const clickedDownload = await clickFirstVisible(page, [
    '[aria-label="Download"]',
    '[aria-label*="Download"]',
    '[data-tooltip="Download"]',
    'div[role="button"][aria-label*="Download"]',
    'button[aria-label*="Download"]'
  ]);

  if (!clickedDownload) {
    throw new Error("Could not find the Google Drive download button.");
  }

  let download;

  try {
    download = await Promise.race([
      downloadPromise,
      new Promise((resolve) => setTimeout(() => resolve(null), 12000))
    ]);
  } catch {
    download = null;
  }

  if (!download) {
    console.log("No download event yet. Checking for Google confirmation page...");
    await page.waitForTimeout(3000);

    const secondDownloadPromise = page.waitForEvent("download", {
      timeout: 120000
    });

    const clickedAnyway = await maybeClickDownloadAnyway(page);

    if (!clickedAnyway) {
      throw new Error("Could not trigger download or find a confirmation button.");
    }

    download = await secondDownloadPromise;
  }

  await download.saveAs(destination);

  console.log(`Saved: ${destination}`);
}

async function createManifest() {
  const manifestPath = path.join(IMAGE_ROOT, "manifest.drive-downloads.json");

  const manifest = files.map((file) => ({
    category: file.category,
    savedAs: `${file.category}/${file.newName}`,
    originalName: file.originalName,
    driveFileId: file.fileId,
    driveViewUrl: `https://drive.google.com/file/d/${file.fileId}/view`
  }));

  await fs.writeFile(manifestPath, JSON.stringify(manifest, null, 2));
}

async function main() {
  await ensureFolders();

  const browser = await chromium.connectOverCDP("http://127.0.0.1:9222");
  const context = browser.contexts()[0];

  if (!context) {
    throw new Error("Could not connect to Chrome. Open Chrome with remote debugging first.");
  }

  const page = await context.newPage();

  await page.goto("https://drive.google.com/drive/my-drive", {
    waitUntil: "domcontentloaded"
  });

  console.log("");
  console.log("Make sure Chrome is signed into the Google account that has access to the Photography folder.");
  console.log("");

  await waitForEnter("Press Enter to start downloading images...");

  for (const file of files) {
    try {
      await downloadFromDrivePreview(page, file);
    } catch (error) {
      console.error(`FAILED: ${file.originalName}`);
      console.error(error);
    }
  }

  await createManifest();

  console.log("");
  console.log("Done.");
  console.log(`Images should be saved under: ${IMAGE_ROOT}`);
  console.log("");

  await page.close();
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
