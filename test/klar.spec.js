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
