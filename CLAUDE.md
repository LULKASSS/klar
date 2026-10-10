# Klar

Lukas' Steuerzentrale: Aufgaben, Ideen, Mitschriften, Wissensbaum, Zeitstrahl. Läuft als Claude-Artifact:
https://claude.ai/code/artifact/755a3d98-e8d8-490b-a14a-8a5149ded4db (Mac: `~/Applications/Chrome Apps/Klar.app`).
Sprache in App, Kommentaren und Commits: **Deutsch**.

## Zwei Fassungen aus demselben Code
- **Lukas' Klar** (Artifact oben): seine Daten, Datenbank, Claude-Auswertung, Sonntagslauf. Ablauf unten.
- **Öffentliche Fassung** (https://lulkasss.github.io/klar/): `scripts/oeffentlich.mjs` baut `src/klar.html` mit leerem Stand und `data-lokal="ja"` am `<html>`.
  Dann gilt `LOKAL` im Code: Stand nur im Browser (`ideenbrett.entwurf` im localStorage), Sicherung als Datei unter Sicherungen,
  keine Vorschläge/Gelernt/Auswertung. GitHub Actions (`.github/workflows/pages.yml`) testet und veröffentlicht bei jedem Push auf `main`.
- `LOKAL` hängt **nur** am Merkmal aus dem Bau, nie an fehlendem `window.claude` – sonst würde eine Artifact-Vorschau lokal weiterschreiben.
- **Abgleich in der öffentlichen Fassung:** Konto bei Supabase (`KONTO` im Code, Tabelle `klar_dokumente` aus `supabase/schema.sql`,
  Ziel aus `wolke.json`). `KONTO` bietet dieselben Griffe wie der Artifact-Speicher (`doc().set/get/delete/onSnapshot`,
  `collection().orderBy().limit().get()`) und wird mit `wolkeVerbinden()` untergeschoben – Abgleich, Konflikte und Sicherungen
  sind derselbe Code wie im Artifact. Test: `test/wolke.spec.js` (Supabase nachgebaut, zwei Geräte).
- Mit `wolke.json` ist die öffentliche Fassung kontogebunden: ohne Sitzung nur die Anmeldeseite (`#tor`, `KONTO.tor()`), danach speichert
  Klar von selbst ins Konto. Kein Gerät-Konto-Abgleich in der Oberfläche, keine Datei-Sicherung; Menü → Konto zeigt Status, Abmelden
  (wartet aufs Speichern, leert dann das Gerät) und frühere Stände. Ohne `wolke.json` (Tests unter `/lokal`) bleibt der reine Browser-Modus.
- `wolke.json` enthält nur den öffentlichen Schlüssel (anon). Den geheimen Schlüssel (service_role) nie ins Repo oder in die Seite.
- Neue Funktionen, die Claude oder die Datenbank brauchen, in der öffentlichen Fassung ausblenden (`if (!LOKAL)`).
- Das Repo ist öffentlich: keine Kundennamen, auch nicht in Platzhaltern oder Beispielen.

## Code hier, Daten im Artifact
Klar speichert seinen Stand **in der Seite selbst** (`#zustand`, `#himmeldaten`) und in der Artifact-Datenbank.
Claude Chat, die Projekt-Assistenz und der Sonntagslauf lesen und schreiben Klar dort. Darum:
- Dieses Repo enthält **nur den Code**: `src/klar.html` mit den Platzhaltern `{{ZUSTAND}}` und `{{HIMMEL}}`.
- **Nie** Klar-Daten committen (Aufgaben, Kundennamen, Mitschriften). `daten/`, `ausgabe/` und `public/` sind ignoriert, `npm run check` prüft das.
- Veröffentlicht wird weiter an dieselbe Artifact-URL, Fähigkeiten (artifact, db, sample) dabei nicht anfassen.

## Ablauf für eine Änderung
1. **Live holen:** Artifact `read` auf die URL oben → gespeicherte Datei → `node scripts/ausbauen.mjs <datei>`.
   Meldet es „aktualisiert“, wurde Klar außerhalb geändert (Claude Chat) → erst das committen: „Stand aus Live übernommen“.
2. **Ändern** in `src/klar.html` (Stil in `#stil`, Markup in `SCHALE`, Logik in `#app-js` – Klar baut sich beim Sichern aus genau diesen drei Teilen neu).
3. `npm test` – Fehlercheck + Browsertests mit erfundenen Daten. `npm run dev` → http://localhost:5190 (Nur-Lesen-Ansicht), `/lokal` = öffentliche Fassung.
4. **Veröffentlichen:** Live **frisch** lesen (Lukas kann seit Schritt 1 gesichert haben) → `node scripts/einbauen.mjs <datei>` → Artifact `publish` mit `file_path: ausgabe/klar.html` und `url` von oben. Lehnt der Server wegen neuerer Fassung ab: neu lesen, neu einbauen, nochmal.
5. Committen und pushen – die öffentliche Fassung zieht über GitHub Actions automatisch nach.

## Dateien
- `scripts/teile.mjs` – Zerlegen/Zusammensetzen (Hülle des Artifact-Lesens wird entfernt).
- `scripts/check.mjs` – Syntax, Platzhalter, Datenleck-Prüfung gegen `daten/live.html`.
- `test/beispiel.json` – erfundene Daten, nur die dürfen ins Repo.
- `icon/klar.svg` – App-Zeichen (Flieder-Kachel, Haken mit Stern). Nach Änderungen `node scripts/icons.mjs`: erneuert die Web-App-Icons in `icon/` und die eingebetteten Zeichen in `src/klar.html`.
- Look: eigene Vorgaben (Flieder, Geist/IBM Plex, Bewegung `--ease-aus`), **nicht** der `app-ui`-Skill.
- Alter Baukasten vom 15.09.: `Projektmanagement Vault/03 Ideen/klar-bau/` – nur noch Geschichte.
