/* src/klar.html → öffentliche Fassung ohne Daten (GitHub Pages).
 * Aufruf: node scripts/oeffentlich.mjs [ausgabe.html]   (Standard: public/index.html)
 * Startet leer; jeder Nutzer hat seinen Stand nur im eigenen Browser. Das Merkmal
 * data-lokal="ja" schaltet Klar in diesen Modus – Lukas' Artifact bekommt es nie. */
import { writeFileSync, mkdirSync, copyFileSync } from 'node:fs';
import { dirname } from 'node:path';
import { pathToFileURL } from 'node:url';
import { ROOT, SRC, zusammensetzen, lies } from './teile.mjs';

export const LEER = {
  zustand: { fassung: 12, eintraege: [], aufgaben: [], cluster: [], mitschriften: [], reihen: [], vorschlaege: [], lagebericht: null, lernen: null, zuletzt: null },
  himmeldaten: { baum: null, ms: '[]', auf: '{}', aktualisiert: null }
};

export function oeffentlich(code = lies(SRC)) {
  const html = zusammensetzen(code, LEER);
  /* Nur das eigene <html> der Seite – dokument() trägt dieselbe Zeichenfolge als Text. */
  const marke = '<!doctype html>\n<html lang="de">';
  if (!html.startsWith(marke)) throw new Error('src/klar.html muss mit <!doctype html> und <html lang="de"> anfangen');
  /* Manifest: damit lässt sich Klar auf dem Mac (Chrome) und am Handy als App installieren */
  return html.replace(marke, '<!doctype html>\n<html lang="de" data-lokal="ja">')
    .replace('<title>Klar</title>', '<title>Klar</title>\n<link rel="manifest" href="manifest.webmanifest">');
}

export const ICONS = ['klar-192.png', 'klar-512.png', 'klar-maske-512.png'];
export const MANIFEST = JSON.stringify({
  name: 'Klar', short_name: 'Klar', lang: 'de', start_url: './', scope: './', display: 'standalone',
  background_color: '#f0f0f2', theme_color: '#6a52a3',
  icons: [
    { src: 'klar-192.png', sizes: '192x192', type: 'image/png' },
    { src: 'klar-512.png', sizes: '512x512', type: 'image/png' },
    { src: 'klar-maske-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' }
  ]
}, null, 1);

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  const aus = process.argv[2] || ROOT + 'public/index.html';
  const html = oeffentlich();
  mkdirSync(dirname(aus), { recursive: true });
  writeFileSync(aus, html);
  writeFileSync(dirname(aus) + '/manifest.webmanifest', MANIFEST);
  for (const f of ICONS) copyFileSync(ROOT + 'icon/' + f, dirname(aus) + '/' + f);
  console.log(`✅ ${aus} gebaut (${(html.length / 1024).toFixed(0)} KB, ohne Daten)`);
}
