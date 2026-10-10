/* src/klar.html → öffentliche Fassung ohne Daten (GitHub Pages).
 * Aufruf: node scripts/oeffentlich.mjs [ausgabe.html]   (Standard: public/index.html)
 * Startet leer; jeder Nutzer hat seinen Stand nur im eigenen Browser. Das Merkmal
 * data-lokal="ja" schaltet Klar in diesen Modus – Lukas' Artifact bekommt es nie. */
import { writeFileSync, mkdirSync } from 'node:fs';
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
  return html.replace(marke, '<!doctype html>\n<html lang="de" data-lokal="ja">');
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  const aus = process.argv[2] || ROOT + 'public/index.html';
  const html = oeffentlich();
  mkdirSync(dirname(aus), { recursive: true });
  writeFileSync(aus, html);
  console.log(`✅ ${aus} gebaut (${(html.length / 1024).toFixed(0)} KB, ohne Daten)`);
}
