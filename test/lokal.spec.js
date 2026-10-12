// Öffentliche Fassung (/lokal): startet leer, speichert im Browser, Sicherung als Datei.
import { test, expect } from '@playwright/test';
import { readFileSync } from 'node:fs';

async function open(page) {
  const problems = [];
  page.on('pageerror', e => problems.push('Fehler: ' + e.message));
  page.on('console', m => { if (m.type() === 'error') problems.push('Konsole: ' + m.text()); });
  await page.goto('/lokal');
  return problems;
}

async function aufgabeAnlegen(page, titel) {
  const neu = page.locator('#neu');
  if (await neu.isVisible()) await neu.click(); else await page.locator('#fab').click();
  await page.locator('#dtitel').fill(titel);
  await page.locator('[data-dtu="anlegen"]').click();
  await expect(page.getByText(titel).first()).toBeVisible();
}

async function menu(page, was) {
  await page.locator('#menuknopf').click();
  await page.locator(`[data-mtu="${was}"]`).click();
}

test('startet leer, ohne Nur-Lesen und ohne Claude-Menüpunkte @mobil @dunkel', async ({ page }) => {
  const problems = await open(page);
  await expect(page.getByText('Deine Aufgaben bleiben in diesem Browser')).toBeVisible();
  await expect(page.getByText('Nur-Lesen-Ansicht')).toHaveCount(0);
  await expect(page.getByText('Testkunde Muster')).toHaveCount(0);
  await page.locator('#menuknopf').click();
  await expect(page.locator('[data-mtu="sicher"]')).toBeVisible();
  await expect(page.locator('[data-mtu="vorschlaege"]')).toHaveCount(0);
  await expect(page.locator('[data-mtu="lernen"]')).toHaveCount(0);
  await page.waitForTimeout(300);
  expect(problems).toEqual([]);
});

test('Aufgabe bleibt nach Neuladen, ein anderer Browser sieht sie nicht @mobil', async ({ page, browser }) => {
  const problems = await open(page);
  await aufgabeAnlegen(page, 'Lokale Testaufgabe');
  await page.reload();
  await expect(page.getByText('Lokale Testaufgabe').first()).toBeVisible();
  const fremd = await browser.newContext();
  const p2 = await fremd.newPage();
  await p2.goto('/lokal');
  await expect(p2.locator('#app')).toBeVisible();
  await expect(p2.getByText('Lokale Testaufgabe')).toHaveCount(0);
  await fremd.close();
  expect(problems).toEqual([]);
});

test('Sicherung als Datei und wieder laden', async ({ page, browser }, info) => {
  const problems = await open(page);
  await aufgabeAnlegen(page, 'Aufgabe zum Umziehen');
  await menu(page, 'sicher');
  const [dl] = await Promise.all([page.waitForEvent('download'), page.getByRole('button', { name: 'Als Datei sichern' }).click()]);
  expect(dl.suggestedFilename()).toMatch(/^klar-sicherung-\d{4}-\d\d-\d\d\.json$/);
  const pfad = info.outputPath('sicherung.json');
  await dl.saveAs(pfad);
  expect(JSON.parse(readFileSync(pfad, 'utf8')).zustand.aufgaben.map(a => a.titel)).toContain('Aufgabe zum Umziehen');

  const neu = await browser.newContext();
  const p2 = await neu.newPage();
  await p2.goto('/lokal');
  await menu(p2, 'sicher');
  await p2.locator('#sicherdatei').setInputFiles(pfad);
  await p2.getByRole('button', { name: 'Ja, ersetzen' }).click();
  await expect(p2.getByText('Sicherung geladen: 1 Aufgaben.')).toBeVisible();
  await p2.reload();
  await expect(p2.getByText('Aufgabe zum Umziehen').first()).toBeVisible();
  await neu.close();
  expect(problems).toEqual([]);
});

test('Claude-Brücke übernimmt alles, auch Gruppen', async ({ page }) => {
  const problems = await open(page);
  const stand = {
    fassung: 12, aufgaben: [{ id: 't-g', titel: 'Aufgabe mit Gruppe', status: 'offen', prio: 2, punkte: [], verlauf: [], gruppen: ['g-1'] }],
    cluster: [], mitschriften: [], reihen: [], gruppen: [{ id: 'g-1', name: 'Testgruppe', kurz: [], eltern: [] }],
    tagwerk: { '2026-10-01': 3 }, tagwerkStart: '2026-09-01T00:00:00.000Z', zuletzt: '2026-10-01T10:00:00.000Z'
  };
  await page.locator('#menuknopf').click();
  await page.locator('[data-mtu="bruecke"]').click();
  await page.locator('#breingabe').fill(JSON.stringify(stand));
  await page.locator('[data-btu="rein"]').click();
  await expect(page.getByText(/Übernommen: 1 Aufgaben/)).toBeVisible();
  await page.reload();
  const z = await page.evaluate(() => JSON.parse(localStorage.getItem('ideenbrett.entwurf')));
  expect(z.gruppen.map(g => g.name)).toEqual(['Testgruppe']);
  expect(z.aufgaben[0].gruppen).toEqual(['g-1']);
  expect(z.tagwerk['2026-10-01']).toBe(3);
  expect(problems).toEqual([]);
});

test('abgeschlossene Mitschriften und erledigte Aufgaben bleiben auffindbar @mobil', async ({ page }) => {
  const problems = await open(page);
  const stand = {
    fassung: 12, cluster: [], reihen: [], gruppen: [], tagwerkStart: '2026-09-01T00:00:00.000Z', zuletzt: '2026-10-10T10:00:00.000Z',
    aufgaben: [
      { id: 'a-o', titel: 'Noch offen', status: 'offen', prio: 2, punkte: [], verlauf: [] },
      { id: 'a-e', titel: 'Schon erledigt', status: 'erledigt', erledigtAm: '2026-10-10T09:00:00.000Z', prio: 2, punkte: [], verlauf: [] }
    ],
    mitschriften: [{ id: 'm-a', titel: 'Termin von gestern', teilnehmer: '', html: '<p>Inhalt der Mitschrift</p>', am: '2026-10-10', erstellt: '2026-10-10T09:10:00.000Z', zeilen: [], mstatus: 'abgeschlossen', verarbeitetAm: '2026-10-11T06:40:00.000Z', auswertung: null }]
  };
  await page.locator('#menuknopf').click();
  await page.locator('[data-mtu="bruecke"]').click();
  await page.locator('#breingabe').fill(JSON.stringify(stand));
  await page.locator('[data-btu="rein"]').click();
  await expect(page.getByText(/1 Mitschrift, zuletzt Termin von gestern · 1 Aufgabe, zuletzt Schon erledigt/)).toBeVisible();
  await page.locator('[data-aufklappen="fertig"]').first().click();
  await page.getByText('Termin von gestern').first().click();
  await expect(page.getByText('Inhalt der Mitschrift')).toBeVisible();
  expect(problems).toEqual([]);
});

test('Mitschriften bleiben offen und bearbeitbar, bis man sie abhakt @mobil', async ({ page }) => {
  const problems = await open(page);
  const stand = {
    fassung: 12, cluster: [], reihen: [], gruppen: [], tagwerkStart: '2026-09-01T00:00:00.000Z', zuletzt: '2026-10-10T10:00:00.000Z',
    aufgaben: [{ id: 'a-o', titel: 'Noch offen', status: 'offen', prio: 2, punkte: [], verlauf: [] }],
    mitschriften: [{ id: 'm-o', titel: 'Laufender Termin', teilnehmer: '', html: '<p>Erste Notiz</p>', am: '2026-10-10', erstellt: '2026-10-10T09:10:00.000Z', zeilen: [], mstatus: 'entwurf', verarbeitetAm: null, auswertung: null }]
  };
  await page.locator('#menuknopf').click();
  await page.locator('[data-mtu="bruecke"]').click();
  await page.locator('#breingabe').fill(JSON.stringify(stand));
  await page.locator('[data-btu="rein"]').click();
  const zeile = page.locator('.mzeile', { hasText: 'Laufender Termin' });
  /* öffnen, nichts ist „Fertig“, schließen – bleibt offen */
  await zeile.locator('.mschrift').click();
  await expect(page.locator('[data-mfertig]')).toHaveCount(0);
  await expect(page.locator('#m-text')).toHaveAttribute('contenteditable', 'true');
  await page.locator('.m-fuss [data-mzu]').click();
  await expect(zeile.locator('.haken')).toHaveAttribute('aria-label', 'Abhaken');
  /* abhaken wie eine Aufgabe → unter Erledigt */
  await zeile.locator('.haken').click();
  await expect(page.getByText('Mitschrift abgehakt')).toBeVisible();
  await page.locator('[data-aufklappen="fertig"]').first().click();
  const erl = page.locator('#spur-fertig .mzeile', { hasText: 'Laufender Termin' });
  await expect(erl).toHaveAttribute('data-erledigt', 'ja');
  /* wieder aufmachen über den Haken, dann ist sie wieder bearbeitbar */
  await erl.locator('.haken').click();
  await expect(page.locator('#spur-fertig .mzeile', { hasText: 'Laufender Termin' })).toHaveCount(0);
  await page.locator('.mzeile', { hasText: 'Laufender Termin' }).locator('.mschrift').click();
  await expect(page.locator('#m-text')).toHaveAttribute('contenteditable', 'true');
  await expect(page.locator('[data-mabhaken]')).toBeVisible();
  expect(problems).toEqual([]);
});

test('Verlaufsschritt für einen Unterpunkt festhalten @mobil', async ({ page }) => {
  const problems = await open(page);
  const stand = {
    fassung: 12, cluster: [], reihen: [], gruppen: [], tagwerkStart: '2026-09-01T00:00:00.000Z', zuletzt: '2026-10-10T10:00:00.000Z',
    aufgaben: [{ id: 'a-v', titel: 'Angebot vergleichen', status: 'offen', prio: 2, erstellt: '2026-10-01T09:00:00.000Z', verlauf: [],
      punkte: [{ id: 'p-a', t: 'Tarife holen', st: 'laeuft', ok: false, notiz: null, loesung: null },
               { id: 'p-b', t: 'Rückruf vereinbaren', st: 'offen', ok: false, notiz: null, loesung: null }] }],
    mitschriften: []
  };
  await menu(page, 'bruecke');
  await page.locator('#breingabe').fill(JSON.stringify(stand));
  await page.locator('[data-btu="rein"]').click();
  await page.locator('.zeile', { hasText: 'Angebot vergleichen' }).locator('.titel').click();
  /* läuft genau ein Punkt, ist er vorgewählt */
  const wahl = page.locator('.v-wahl button');
  await expect(wahl).toHaveCount(3);
  await expect(page.locator('.v-wahl button[aria-pressed="true"]')).toHaveText('Tarife holen');
  await page.locator('#vfeld').fill('Zwei Tarife angefragt');
  await page.locator('[data-atu="verlauf-ab"]').click();
  await expect(page.locator('.verlauf li', { hasText: 'Zwei Tarife angefragt' }).locator('.v-zu')).toHaveText('Tarife holen');
  await expect(page.locator('.punkte li[data-i="0"] .p-schritte')).toContainText('Zwei Tarife angefragt');
  /* anderer Punkt, dann die ganze Aufgabe */
  await page.locator('.v-wahl button', { hasText: 'Rückruf vereinbaren' }).click();
  await page.locator('#vfeld').fill('Mailbox, morgen nochmal');
  await page.locator('[data-atu="verlauf-ab"]').click();
  await expect(page.locator('.punkte li[data-i="1"] .p-schritte')).toContainText('Mailbox, morgen nochmal');
  await expect(page.locator('.punkte li[data-i="0"] .p-schritte')).not.toContainText('Mailbox');
  await page.locator('.v-wahl button', { hasText: 'Ganze Aufgabe' }).click();
  await page.locator('#vfeld').fill('Kunde hat Unterlagen geschickt');
  await page.locator('[data-atu="verlauf-ab"]').click();
  await expect(page.locator('.verlauf li', { hasText: 'Kunde hat Unterlagen geschickt' }).locator('.v-zu')).toHaveCount(0);
  expect(problems).toEqual([]);
});
