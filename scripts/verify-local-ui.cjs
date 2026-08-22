const assert = require('node:assert/strict');
const fs = require('node:fs/promises');
const path = require('node:path');
const { app, BrowserWindow } = require('electron');

const root = path.resolve(__dirname, '..');
require(path.join(root, 'backend/node_modules/dotenv')).config({
  path: path.join(root, 'backend/.env'),
});
const { PrismaClient } = require(path.join(root, 'backend/node_modules/@prisma/client'));
const jwt = require(path.join(root, 'backend/node_modules/jsonwebtoken'));

const prisma = new PrismaClient();
const url = process.env.Q2PLAY_LOCAL_URL || 'http://127.0.0.1:5174';
const outputDir = path.join(root, '.codex-run');
const screenshotPath = path.join(outputDir, 'local-ui.png');

function wait(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function gameGridState(window) {
  return window.webContents.executeJavaScript(`(() => {
    const grid = document.querySelector('#game-grid');
    const cards = grid ? Array.from(grid.querySelectorAll('.game-card')) : [];
    const images = grid ? Array.from(grid.querySelectorAll('img')) : [];
    const more = Array.from(document.querySelectorAll('button')).find((button) => button.textContent.includes('juegos más'));
    const first = cards[0];
    const firstStyle = first ? getComputedStyle(first) : null;
    const page = grid?.closest('.page-view');
    const pageStyle = page ? getComputedStyle(page) : null;
    return {
      count: cards.length,
      names: cards.map((card) => card.textContent.trim()),
      moreLabel: more?.textContent.trim() || null,
      brokenImages: images.filter((image) => !image.complete || image.naturalWidth === 0).map((image) => image.src),
      valorantSource: images.find((image) => image.src.includes('valorant'))?.src || null,
      overflow: document.documentElement.scrollWidth - window.innerWidth,
      rect: grid ? { top: grid.getBoundingClientRect().top, bottom: grid.getBoundingClientRect().bottom } : null,
      first: first ? {
        rect: { x: first.getBoundingClientRect().x, y: first.getBoundingClientRect().y, width: first.getBoundingClientRect().width, height: first.getBoundingClientRect().height },
        display: firstStyle.display,
        opacity: firstStyle.opacity,
        visibility: firstStyle.visibility,
        pageOpacity: pageStyle?.opacity,
      } : null,
    };
  })()`);
}

async function loadGameGridImages(window) {
  await window.webContents.executeJavaScript(`Promise.all(Array.from(document.querySelectorAll('#game-grid img')).map(async (image) => {
    image.loading = 'eager';
    try { await image.decode(); } catch {}
  }))`);
}

async function verify() {
  const account = await prisma.user.findFirst({ select: { id: true } });
  assert.ok(account, 'Se necesita al menos una cuenta para verificar la vista autenticada');
  const token = jwt.sign(
    { userId: account.id },
    process.env.JWT_SECRET || 'dev-secret-change-me',
    { expiresIn: '10m' },
  );

  const consoleErrors = [];
  const window = new BrowserWindow({
    show: false,
    width: 1440,
    height: 1050,
    backgroundColor: '#070b14',
    webPreferences: { contextIsolation: true, nodeIntegration: false, sandbox: true, backgroundThrottling: false },
  });
  window.webContents.on('console-message', (event) => {
    if (event.level >= 3) consoleErrors.push(event.message);
  });

  await window.loadURL(url);
  await window.webContents.executeJavaScript(`localStorage.setItem('q2play_token', ${JSON.stringify(token)})`);
  const reloaded = new Promise((resolve) => window.webContents.once('did-finish-load', resolve));
  window.reload();
  await reloaded;
  await window.webContents.insertCSS('.page-view, .stagger > * { animation: none !important; opacity: 1 !important; transform: none !important; }');
  await wait(2500);
  await window.webContents.executeJavaScript(`document.querySelector('button[aria-label="Buscar jugadores"]')?.click()`);
  await wait(700);
  await window.webContents.executeJavaScript(`document.querySelector('#game-grid')?.scrollIntoView({ block: 'start' })`);
  await wait(700);
  await loadGameGridImages(window);

  const collapsed = await gameGridState(window);
  assert.equal(collapsed.count, 8);
  assert.match(collapsed.moreLabel || '', /Ver 8 juegos más/);
  assert.equal(collapsed.brokenImages.length, 0);
  assert.match(collapsed.valorantSource || '', /valorant\.webp$/);
  assert.ok(collapsed.overflow <= 1, `La pagina tiene ${collapsed.overflow}px de desborde horizontal`);

  await window.webContents.executeJavaScript(`Array.from(document.querySelectorAll('button')).find((button) => button.textContent.includes('juegos más'))?.click()`);
  await wait(500);
  await loadGameGridImages(window);
  const expanded = await gameGridState(window);
  assert.equal(expanded.count, 16);
  assert.equal(expanded.brokenImages.length, 0);

  await window.webContents.executeJavaScript(`document.querySelector('#game-grid')?.scrollIntoView({ block: 'start' })`);
  await wait(300);
  await fs.mkdir(outputDir, { recursive: true });
  const image = await window.webContents.capturePage();
  await fs.writeFile(screenshotPath, image.toPNG());
  assert.equal(consoleErrors.length, 0, `Errores de consola: ${consoleErrors.join(' | ')}`);

  console.log(`LOCAL_UI_TEST_OK ${JSON.stringify({ collapsed: collapsed.count, expanded: expanded.count, rect: expanded.rect, first: expanded.first, screenshotPath })}`);
  window.destroy();
}

app.whenReady()
  .then(verify)
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
    app.quit();
  });
