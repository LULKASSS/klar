/* Lokaler Server für die Entwicklung: http://localhost:5190
 * Liefert src/klar.html mit den erfundenen Daten aus test/beispiel.json aus –
 * echte Daten kommen hier nie hinein. Ohne claude.ai gibt es kein Speichern
 * und keine Datenbank; Klar läuft dann nur im Browser-Speicher.
 * /lokal liefert die öffentliche Fassung (leer, speichert im Browser). */
import { createServer } from 'node:http';
import { SRC, ROOT, zusammensetzen, lies } from './teile.mjs';
import { readFileSync } from 'node:fs';
import { oeffentlich, MANIFEST, ICONS } from './oeffentlich.mjs';

const port = +(process.env.PORT || 5190);
createServer((req, res) => {
  const { pathname } = new URL(req.url, 'http://x');
  const datei = pathname.split('/').pop();
  if (datei === 'manifest.webmanifest') { res.writeHead(200, { 'content-type': 'application/manifest+json' }).end(MANIFEST); return; }
  if (ICONS.includes(datei)) { res.writeHead(200, { 'content-type': 'image/png' }).end(readFileSync(ROOT + 'icon/' + datei)); return; }
  if (!['/', '/index.html', '/lokal', '/lokal/'].includes(pathname)) { res.writeHead(404).end('nicht gefunden'); return; }
  try {
    const html = pathname.startsWith('/lokal') ? oeffentlich()
      : zusammensetzen(lies(SRC), JSON.parse(lies(ROOT + 'test/beispiel.json')));
    res.writeHead(200, { 'content-type': 'text/html; charset=utf-8', 'cache-control': 'no-store' }).end(html);
  } catch (e) {
    res.writeHead(500).end(String(e));
  }
}).listen(port, '127.0.0.1', () => console.log(`Klar (Beispieldaten) läuft auf http://localhost:${port}`));
