/* src/klar.html + Daten der aktuellen Live-Fassung → ausgabe/klar.html (zum Veröffentlichen).
 * Aufruf: node scripts/einbauen.mjs <live.html> [ausgabe.html]
 * Immer eine frisch gelesene Live-Fassung nehmen, sonst gehen Änderungen an den Aufgaben verloren. */
import { writeFileSync, mkdirSync } from 'node:fs';
import { dirname } from 'node:path';
import { execSync } from 'node:child_process';
import { ROOT, SRC, zerlegen, zusammensetzen, lies } from './teile.mjs';

const [pfad, aus = ROOT + 'ausgabe/klar.html'] = process.argv.slice(2);
if (!pfad) { console.error('Aufruf: node scripts/einbauen.mjs <live.html> [ausgabe.html]'); process.exit(1); }
execSync('node scripts/check.mjs', { cwd: ROOT, stdio: 'inherit' });
const { daten } = zerlegen(lies(pfad));
const html = zusammensetzen(lies(SRC), daten);
mkdirSync(dirname(aus), { recursive: true });
writeFileSync(aus, html);
const z = JSON.parse(daten.zustand);
console.log(`✅ ${aus} gebaut (${(html.length / 1024).toFixed(0)} KB, ${z.aufgaben?.length ?? 0} Aufgaben aus der Live-Fassung)`);
