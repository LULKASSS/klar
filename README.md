# Klar

Aufgaben, Mitschriften und Übersicht in einer ruhigen Liste.

**Öffnen:** https://lulkasss.github.io/klar/

## Deine Daten

Klar startet leer. Alles, was du anlegst, bleibt im Browser des Geräts, auf dem du es anlegst – es gibt keinen Server und kein Konto, niemand sonst sieht deine Aufgaben. Das heißt auch: Handy und Laptop haben jeweils ihren eigenen Stand, und wer die Browserdaten löscht, löscht Klar mit.

Unter **Menü → Sicherungen** lässt sich der Stand als Datei sichern und auf einem anderen Gerät wieder laden.

## Entwicklung

- `npm run dev` – mit erfundenen Daten ansehen: http://localhost:5190, die öffentliche Fassung unter http://localhost:5190/lokal
- `npm test` – Fehlercheck und Browsertests
- `npm run oeffentlich` – baut die öffentliche Fassung nach `public/index.html`

Jeder Push auf `main` wird getestet und danach von GitHub Actions auf GitHub Pages gestellt.
