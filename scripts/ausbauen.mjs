/* Live-Fassung → src/klar.html (nur Code, Daten raus).
 * Aufruf: node scripts/ausbauen.mjs <live.html>
 * Vor jeder Änderung laufen lassen: in Claude Chat oder per Sonntagslauf kann Klar
 * auch direkt im Artifact geändert worden sein. */
import { writeFileSync, copyFileSync, mkdirSync } from 'node:fs';
import { ROOT, SRC, zerlegen, lies } from './teile.mjs';

const pfad = process.argv[2];
if (!pfad) { console.error('Aufruf: node scripts/ausbauen.mjs <live.html>'); process.exit(1); }
const live = lies(pfad);
const { code } = zerlegen(live);
let alt = ''; try { alt = lies(SRC); } catch {}
mkdirSync(ROOT + 'src', { recursive: true });
writeFileSync(SRC, code);
/* Die letzte Live-Fassung bleibt lokal liegen (daten/ ist nie im Repo) – für Check und Einbauen */
mkdirSync(ROOT + 'daten', { recursive: true });
if (pfad !== ROOT + 'daten/live.html') copyFileSync(pfad, ROOT + 'daten/live.html');
console.log(alt === code ? '✅ Code unverändert gegenüber src/klar.html' : '✏️  src/klar.html aktualisiert – Änderungen aus der Live-Fassung bitte committen');
