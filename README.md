# Klar

Aufgaben, Mitschriften und Übersicht in einer ruhigen Liste.

**Öffnen:** https://lulkasss.github.io/klar/

## Als App installieren

- **Mac:** in Chrome öffnen → Menü ⋮ → „Streamen, speichern und teilen“ → „Seite als App installieren“
- **iPhone:** in Safari öffnen → Teilen → „Zum Home-Bildschirm“

## Deine Daten

Klar braucht ein Konto: einmal anmelden, dann gehört dein Stand deinem Konto. Jede Änderung wird nach wenigen Sekunden automatisch gespeichert und ist auf jedem Gerät da, auf dem du angemeldet bist. Ohne Netz arbeitest du mit dem Stand auf dem Gerät weiter, gespeichert wird, sobald du wieder online bist. Jedes Konto sieht nur seine eigenen Daten.

Unter Menü → **Konto** stehen der Status („Alles gespeichert“), Abmelden und frühere Stände zum Zurückholen. Beim Abmelden wird der Stand vom Gerät gelöscht – er liegt ja im Konto.

## Abgleich einrichten (einmalig, für den Betreiber)

Der Abgleich läuft über ein Supabase-Projekt:

1. Auf supabase.com ein Projekt anlegen, Region **Frankfurt (eu-central-1)**.
2. **SQL Editor** → New query → Inhalt von `supabase/schema.sql` einfügen → Run.
3. **Authentication → URL Configuration:** Site URL `https://lulkasss.github.io/klar/`.
4. **Project Settings → API:** Project URL und den öffentlichen Schlüssel (anon / publishable) in `wolke.json` eintragen:
   `{ "url": "https://….supabase.co", "key": "…" }` – nie den geheimen Schlüssel (service_role / secret).

Ohne `wolke.json` läuft Klar ohne Konto, nur im Browser.

## Entwicklung

- `npm run dev` – mit erfundenen Daten ansehen: http://localhost:5190, die öffentliche Fassung unter http://localhost:5190/lokal
- `npm test` – Fehlercheck und Browsertests
- `npm run oeffentlich` – baut die öffentliche Fassung nach `public/index.html`

Jeder Push auf `main` wird getestet und danach von GitHub Actions auf GitHub Pages gestellt.
