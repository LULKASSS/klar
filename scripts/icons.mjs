/* icon/klar.svg → Icons für die installierte Web-App (192/512 px) und die beiden Zeichen,
 * die in src/klar.html eingebettet sind (Homescreen 180 px, Tab 64 px).
 * Aufruf: node scripts/icons.mjs   (braucht Playwright mit Chromium) */
import { chromium } from '@playwright/test';
import { readFileSync, writeFileSync } from 'node:fs';
import { ROOT, SRC, lies } from './teile.mjs';

const svg = readFileSync(ROOT + 'icon/klar.svg', 'utf8');
/* Ohne Rand, aber mit runden Ecken – so sieht Klar überall gleich aus (Lukas, 11.10.2026).
 * Nur das Masken-Icon bleibt eckig: Android schneidet es selbst zu. */
const voll = svg.replace(/viewBox="0 0 1024 1024"/, 'viewBox="100 100 824 824"');
const eckig = voll.replace(/ rx="18[15]"/g, '');
const browser = await chromium.launch(process.env.PW_CHROMIUM ? { executablePath: process.env.PW_CHROMIUM } : {});
async function png(quelle, px) {
  const p = await browser.newPage({ viewport: { width: px, height: px } });
  await p.setContent(`<html><body style="margin:0;background:transparent">${quelle.replace(/width="1024" height="1024"/, `width="${px}" height="${px}"`)}</body></html>`);
  const b = await p.screenshot({ omitBackground: true, clip: { x: 0, y: 0, width: px, height: px } });
  await p.close();
  return b;
}
writeFileSync(ROOT + 'icon/klar-512.png', await png(voll, 512));
writeFileSync(ROOT + 'icon/klar-192.png', await png(voll, 192));
writeFileSync(ROOT + 'icon/klar-maske-512.png', await png(eckig.replace('scale(25.75)', 'scale(19)').replace('translate(100 100)', 'translate(208 208)'), 512));
const touch = (await png(voll, 180)).toString('base64');
const tab = (await png(svg, 64)).toString('base64');
await browser.close();
let html = lies(SRC);
/* Zwei Stellen je Zeichen: der Kopf der Seite und KOPFEXTRA im Code (dort mit \"),
 * aus dem Klar sich beim Sichern selbst neu baut – sonst käme das alte Zeichen zurück. */
const ersetze = (rel, b64) => {
  const re = new RegExp(`(<link rel=\\\\?"${rel}\\\\?"[^>]*?href=\\\\?"data:image/png;base64,)[^"\\\\]+`, 'g');
  const n = (html.match(re) || []).length;
  if (n !== 2) throw new Error(`<link rel="${rel}"> ${n}× gefunden, erwartet 2 (Kopf und KOPFEXTRA)`);
  html = html.replace(re, (_, a) => a + b64);
};
ersetze('apple-touch-icon', touch);
ersetze('icon', tab);
writeFileSync(SRC, html);
console.log('✅ Icons in icon/ und die eingebetteten Zeichen in src/klar.html erneuert');
