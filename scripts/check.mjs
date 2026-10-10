/* Schneller Fehlercheck ohne Browser:
 * 1. Platzhalter für Daten stehen genau einmal in src/klar.html
 * 2. JavaScript ist syntaktisch gültig
 * 3. Keine Klar-Daten im Repo: kein Titel, keine Mitschrift aus der lokalen Live-Fassung
 *    (daten/live.html) taucht im Code auf, keine Datendateien eingecheckt
 * Exit-Code 1 bei Fehlern. */
import { execFileSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import vm from 'node:vm';
import { ROOT, SRC, PLATZ, zerlegen, lies } from './teile.mjs';

const errors = [], warns = [];
const code = lies(SRC);

/* 1. Platzhalter */
for (const p of Object.values(PLATZ)) if (code.split(p).length !== 2) errors.push(`Platzhalter ${p} muss genau einmal in src/klar.html stehen`);

/* 2. Syntax (JSON-Blöcke ausgenommen) */
const scripts = [...code.matchAll(/<script(?![^>]*\b(src=|type="application\/json"))[^>]*>([\s\S]*?)<\/script>/g)].map(m => m[2]);
if (!scripts.length) errors.push('src/klar.html: kein <script> gefunden');
scripts.forEach((s, i) => { try { new vm.Script(s, { filename: `klar.html <script #${i + 1}>` }); } catch (e) { errors.push(`Syntaxfehler in Script ${i + 1}: ${e.message}`); } });
for (const need of ['<!doctype html>', '<meta charset', 'name="viewport"', '<title>Klar</title>', 'id="app-js"', 'id="stil"'])
  if (!code.includes(need)) errors.push(`src/klar.html: ${need} fehlt`);

/* 3. Daten */
let files = [];
try { files = execFileSync('git', ['ls-files', '--cached', '--others', '--exclude-standard'], { cwd: ROOT, encoding: 'utf8' }).split('\n').filter(Boolean); }
catch { warns.push('git nicht verfügbar, Dateicheck übersprungen'); }
for (const f of files) {
  if (/^(daten|ausgabe|public)\//.test(f)) errors.push(`Datenordner im Repo: ${f}`);
  if (/\.json$/.test(f) && !/^(package(-lock)?\.json|test\/beispiel\.json)$/.test(f)) {
    const t = lies(ROOT + f);
    if (/"aufgaben"\s*:/.test(t)) errors.push(`Sieht nach Klar-Daten aus: ${f}`);
  }
  if (/\.(js|mjs|html|md|json)$/.test(f) && f !== 'package-lock.json') {
    const t = lies(ROOT + f);
    if (/gh[pousr]_[A-Za-z0-9]{30,}|github_pat_[A-Za-z0-9_]{30,}|sk-ant-[A-Za-z0-9-]{20,}/.test(t)) errors.push(`Möglicher Zugangsschlüssel in ${f}`);
  }
}
if (existsSync(ROOT + 'daten/live.html')) {
  const z = JSON.parse(zerlegen(lies(ROOT + 'daten/live.html')).daten.zustand);
  const geheim = new Set();
  for (const a of z.aufgaben || []) { geheim.add(a.titel); for (const p of a.punkte || []) geheim.add(p.t); }
  for (const m of z.mitschriften || []) geheim.add(m.titel);
  for (const v of z.vorschlaege || []) geheim.add(v.titel);
  const pruefen = [code, ...files.filter(f => /\.(js|mjs|md|json)$/.test(f) && f !== 'package-lock.json').map(f => lies(ROOT + f))].join('\n');
  for (const g of geheim) if (g && g.trim().length >= 20 && pruefen.includes(g.trim())) errors.push(`Text aus den Klar-Daten steht im Code: „${g.trim().slice(0, 40)}…“`);
} else warns.push('daten/live.html fehlt – Abgleich mit echten Daten übersprungen (erst ausbauen)');

for (const w of warns) console.log('⚠️  ' + w);
if (errors.length) { console.log('❌ Fehlercheck fehlgeschlagen:'); for (const e of errors) console.log('   • ' + e); process.exit(1); }
console.log(`✅ Fehlercheck ok (${scripts.length} Scripts, ${files.length} Dateien geprüft)`);
