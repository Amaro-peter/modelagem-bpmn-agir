// Abre um Chromium para renderizar páginas, em qualquer sistema:
// 1) CHROMIUM_PATH  2) Chromium do Playwright (npx playwright install chromium)
// 3) Google Chrome ou Microsoft Edge instalados  4) qualquer Chromium já baixado pelo Playwright (Linux)
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { chromium } from 'playwright-core';

export async function abrirNavegador() {
  if (process.env.CHROMIUM_PATH) return chromium.launch({ executablePath: process.env.CHROMIUM_PATH });
  const attempts = [{}, { channel: 'chrome' }, { channel: 'msedge' }];
  const base = path.join(os.homedir(), '.cache/ms-playwright');
  if (fs.existsSync(base)) {
    for (const d of fs.readdirSync(base).filter(d => d.startsWith('chromium-')).sort().reverse()) {
      const p = path.join(base, d, 'chrome-linux64/chrome');
      if (fs.existsSync(p)) attempts.push({ executablePath: p });
    }
  }
  for (const opts of attempts) {
    try { return await chromium.launch(opts); } catch { /* tenta o próximo */ }
  }
  throw new Error('Nenhum navegador encontrado. Instale o Google Chrome ou rode: npx playwright install chromium (ou defina CHROMIUM_PATH).');
}
