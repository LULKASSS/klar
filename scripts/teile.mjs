/* Zerlegt eine Klar-Seite in Code und Daten bzw. setzt beides wieder zusammen.
 * Klar speichert seinen Stand direkt in der Seite: zwei JSON-Blöcke (#zustand, #himmeldaten).
 * Im Repo steht nur der Code, an diesen Stellen stehen Platzhalter. */
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

export const ROOT = fileURLToPath(new URL('..', import.meta.url));
export const SRC = ROOT + 'src/klar.html';
export const PLATZ = { zustand: '{{ZUSTAND}}', himmeldaten: '{{HIMMEL}}' };
const block = id => new RegExp(`(<script type="application/json" id="${id}">)([\\s\\S]*?)(</script>)`);

/* Eine Live-Fassung, wie das Artifact-Lesen sie speichert: außen die Hülle des
 * Viewers, innen die eigentliche Seite. Nur die innere Seite zählt. */
export function innereSeite(html) {
  const start = html.indexOf('<!doctype html>\n<html lang="de">');
  if (start < 0) throw new Error('Keine Klar-Seite gefunden (<!doctype html> + <html lang="de"> fehlt)');
  const inner = html.slice(start);
  const ende = inner.lastIndexOf('</html>');
  if (ende < 0) throw new Error('</html> fehlt');
  return inner.slice(0, ende + 7) + '\n';
}

export function zerlegen(html) {
  let code = innereSeite(html);
  const daten = {};
  for (const [id, platz] of Object.entries(PLATZ)) {
    const m = code.match(block(id));
    if (!m) throw new Error(`Datenblock #${id} fehlt`);
    daten[id] = m[2];
    JSON.parse(m[2]); /* muss gültiges JSON sein */
    code = code.replace(block(id), (_, a, _b, c) => a + platz + c);
  }
  return { code, daten };
}

export function zusammensetzen(code, daten) {
  let html = code;
  for (const [id, platz] of Object.entries(PLATZ)) {
    if (html.split(platz).length !== 2) throw new Error(`Platzhalter ${platz} muss genau einmal im Code stehen`);
    const json = typeof daten[id] === 'string' ? daten[id] : JSON.stringify(daten[id]).replace(/</g, '\\u003c');
    html = html.replace(platz, () => json);
  }
  return html;
}

export const lies = p => readFileSync(p, 'utf8');
