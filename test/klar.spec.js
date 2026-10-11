// Klar mit erfundenen Daten (test/beispiel.json). Ohne claude.ai läuft Klar als Nur-Lesen-Ansicht.
import { test, expect } from '@playwright/test';

async function open(page) {
  const problems = [];
  page.on('pageerror', e => problems.push('Fehler: ' + e.message));
  page.on('console', m => { if (m.type() === 'error') problems.push('Konsole: ' + m.text()); });
  await page.goto('/');
  return problems;
}

test('Liste zeigt die Beispielaufgaben ohne Fehler @mobil @dunkel', async ({ page }) => {
  const problems = await open(page);
  await expect(page.getByText('Testkunde Muster: Angebot Hausrat schicken')).toBeVisible();
  await expect(page.getByText('Wochenplanung')).toBeVisible();
  await expect(page.getByText('Nur-Lesen-Ansicht')).toBeVisible();
  await page.waitForTimeout(500);
  expect(problems).toEqual([]);
});

test('kein Kopf mit Zeichen oben links, Menü sitzt unten rechts @mobil', async ({ page }) => {
  const problems = await open(page);
  await expect(page.getByText('Wochenplanung')).toBeVisible();
  await expect(page.locator('#marke')).toBeHidden();
  const kopf = await page.locator('.kopf-oben').boundingBox();
  expect(kopf.height).toBeLessThan(2);
  const knopf = page.locator('#menuknopf');
  await expect(knopf).toBeVisible();
  const kb = await knopf.boundingBox();
  const vp = page.viewportSize();
  expect(kb.y).toBeGreaterThan(vp.height / 2);
  expect(kb.x).toBeGreaterThan(vp.width / 2);
  await knopf.click();
  const menu = page.locator('.hauptmenu');
  await expect(menu).toBeVisible();
  await expect(knopf).toHaveAttribute('aria-expanded', 'true');
  const mb = await menu.boundingBox();
  expect(mb.y).toBeGreaterThanOrEqual(0);
  expect(mb.y + mb.height).toBeLessThanOrEqual(kb.y);
  await page.keyboard.press('Escape');
  await expect(menu).toBeHidden();
  expect(problems).toEqual([]);
});
