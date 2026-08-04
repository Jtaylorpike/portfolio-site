import { spawn } from 'node:child_process';
import process from 'node:process';
import { chromium } from 'playwright';

const editorPort = 5055;
const editorUrl = `http://127.0.0.1:${editorPort}/`;
const routes = ['images', 'import', 'gallery', 'about', 'about/photos', 'categories', 'settings', 'backups'];
let editorProcess = null;

async function editorIsAvailable() {
  try {
    const response = await fetch(editorUrl);
    return response.ok && (await response.text()).includes('Portfolio Editor');
  } catch {
    return false;
  }
}

async function waitForEditor() {
  const deadline = Date.now() + 15_000;
  while (Date.now() < deadline) {
    if (await editorIsAvailable()) return;
    await new Promise((resolve) => setTimeout(resolve, 150));
  }
  throw new Error('The local editor did not start within 15 seconds.');
}

async function startEditor() {
  if (await editorIsAvailable()) throw new Error(`Test port ${editorPort} is already serving an editor.`);
  editorProcess = spawn(
    'python',
    ['-c', `from app import create_app; create_app().run(host='127.0.0.1', port=${editorPort}, debug=False)`],
    {
      cwd: new URL('../local-editor/', import.meta.url),
      env: { ...process.env, PYTHONUNBUFFERED: '1' },
      stdio: ['ignore', 'pipe', 'pipe']
    }
  );
  let serverError = '';
  editorProcess.stderr.on('data', (chunk) => { serverError += chunk.toString(); });
  editorProcess.on('exit', (code) => {
    if (code && !serverError.includes('Press CTRL+C to quit')) process.stderr.write(serverError);
  });
  await waitForEditor();
}

function stopEditor() {
  if (!editorProcess || editorProcess.killed) return;
  editorProcess.kill();
  editorProcess = null;
}

async function auditRoutes(page) {
  const results = [];
  for (const route of routes) {
    await page.goto(`${editorUrl}#/${route}`);
    const activePage = page.locator('.editor-page-section.is-active');
    await activePage.waitFor();
    const result = await activePage.evaluate((root) => {
      const controls = [...root.querySelectorAll('button, a[href], input:not([type="hidden"]), select, textarea')];
      const hasName = (element) => {
        const directName = element.getAttribute('aria-label') || element.textContent || element.value || '';
        const labelName = element.labels ? [...element.labels].some((label) => label.textContent.trim()) : false;
        return Boolean(directName.trim() || labelName);
      };
      return {
        controls: controls.length,
        unnamedControls: controls.filter((control) => !hasName(control)).length
      };
    });
    if (result.unnamedControls) throw new Error(`${route} has ${result.unnamedControls} unnamed visible controls.`);
    results.push({ route, controls: result.controls });
  }
  return results;
}

async function auditReducedMotion(page) {
  await page.goto(`${editorUrl}#/about/photos`);
  await page.locator('[data-open-about-collage]').waitFor();
  await page.emulateMedia({ reducedMotion: 'reduce' });
  const result = await page.evaluate(() => {
    const button = document.querySelector('[data-open-about-collage]');
    const frame = document.createElement('div');
    frame.className = 'crop-modal-frame';
    const image = document.createElement('img');
    image.dataset.snapping = 'true';
    frame.append(image);
    document.body.append(frame);
    const values = {
      preference: matchMedia('(prefers-reduced-motion: reduce)').matches,
      controlTransition: getComputedStyle(button).transitionDuration,
      cropTransition: getComputedStyle(image).transitionDuration
    };
    frame.remove();
    return values;
  });
  if (!result.preference || result.controlTransition !== '0s' || result.cropTransition !== '0s') {
    throw new Error(`Reduced-motion contract failed: ${JSON.stringify(result)}`);
  }
  await page.emulateMedia({ reducedMotion: 'no-preference' });
  return result;
}

async function auditAboutDialog(page) {
  await page.goto(`${editorUrl}#/about/photos`);
  const launcher = page.locator('[data-open-about-collage]');
  await launcher.waitFor();
  const unavailableCropPhotos = page.locator('.about-editor-thumb:disabled');
  const unavailableCount = await unavailableCropPhotos.count();
  for (let index = 0; index < unavailableCount; index += 1) {
    const item = unavailableCropPhotos.nth(index);
    if (!(await item.getAttribute('title')) || !(await item.locator('.about-editor-crop-unavailable').isVisible())) {
      throw new Error(`Unused About photo ${index + 1} does not explain its disabled crop state.`);
    }
  }

  await launcher.click();
  const modal = page.locator('[data-about-collage-modal]');
  const backgroundIsInert = await launcher.evaluate((element) => element.inert || element.closest('[inert]') !== null);
  if (!backgroundIsInert) throw new Error('The editor behind the About dialog is not inert.');

  const focusable = modal.locator('a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])');
  const visible = [];
  for (let index = 0; index < await focusable.count(); index += 1) {
    if (await focusable.nth(index).isVisible()) visible.push(focusable.nth(index));
  }
  const first = visible[0];
  const last = visible[visible.length - 1];
  await last.focus();
  await page.keyboard.press('Tab');
  if (!(await first.evaluate((element) => document.activeElement === element))) throw new Error('Forward focus wrapping failed.');
  await first.focus();
  await page.keyboard.press('Shift+Tab');
  if (!(await last.evaluate((element) => document.activeElement === element))) throw new Error('Reverse focus wrapping failed.');

  await page.keyboard.press('Escape');
  if (!(await modal.isHidden())) throw new Error('Escape did not close the About dialog.');
  if (!(await launcher.evaluate((element) => document.activeElement === element))) throw new Error('Dialog focus was not restored.');
  return { focusableControls: visible.length, unavailableCropPhotos: unavailableCount };
}

let browser;
try {
  await startEditor();
  browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });
  const browserErrors = [];
  page.on('console', (message) => { if (message.type() === 'error') browserErrors.push(message.text()); });
  page.on('pageerror', (error) => browserErrors.push(error.message));

  const routeResults = await auditRoutes(page);
  const reducedMotion = await auditReducedMotion(page);
  const aboutDialog = await auditAboutDialog(page);
  if (browserErrors.length) throw new Error(`Browser errors: ${browserErrors.join('; ')}`);

  console.log(JSON.stringify({ editorPort, routeResults, reducedMotion, aboutDialog, browserErrors }, null, 2));
} finally {
  await browser?.close();
  stopEditor();
}
