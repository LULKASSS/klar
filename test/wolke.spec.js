// Abgleich zwischen Geräten (öffentliche Fassung mit Konto). Supabase wird hier nachgebaut:
// ein gemeinsamer Speicher im Testprozess, an den sich mehrere Browser („Mac“, „Handy“)
// hängen – so wie echte Geräte an dasselbe Konto. Geprüft wird Klars Abgleich-Logik,
// nicht Supabase selbst.
import { test, expect, devices } from '@playwright/test';
import { readFileSync } from 'node:fs';

test.describe.configure({ mode: 'serial' });

function speicher() {
  const zeilen = new Map(), nutzer = new Map(), seiten = [];
  const schluessel = r => `${r.user_id}|${r.sammlung}|${r.id}`;
  async function melden(ereignis) {
    for (const p of seiten) await p.evaluate(e => window.__klarRT && window.__klarRT(e), ereignis).catch(() => {});
  }
  async function db(st) {
    const f = Object.fromEntries(st.filters);
    const passt = r => Object.entries(f).every(([k, v]) => r[k] === v);
    if (st.op === 'upsert') { zeilen.set(schluessel(st.row), st.row); await melden({ eventType: 'UPDATE', new: st.row, old: {} }); return { data: null, error: null }; }
    if (st.op === 'delete') {
      const weg = [...zeilen.values()].filter(passt);
      weg.forEach(r => zeilen.delete(schluessel(r)));
      for (const r of weg) await melden({ eventType: 'DELETE', new: {}, old: { user_id: r.user_id, sammlung: r.sammlung, id: r.id } });
      return { data: null, error: null };
    }
    let liste = [...zeilen.values()].filter(passt);
    if (st.single) return { data: liste[0] ? { daten: liste[0].daten } : null, error: null };
    if (st.order) {
      const feld = st.order[0].replace('daten->>', '');
      liste.sort((a, b) => String(a.daten[feld]).localeCompare(String(b.daten[feld])) * (st.order[1] ? 1 : -1));
    }
    if (st.limit) liste = liste.slice(0, st.limit);
    return { data: liste.map(r => ({ id: r.id, daten: r.daten })), error: null };
  }
  function auth(op, mail, pw) {
    if (op === 'neu') { if (nutzer.has(mail)) return { error: { message: 'User already registered' } }; nutzer.set(mail, pw); }
    else if (nutzer.get(mail) !== pw) return { error: { message: 'Invalid login credentials' } };
    return { user: { id: 'u-' + mail.replace(/\W/g, ''), email: mail } };
  }
  async function geraet(browser, opts) {
    const ctx = await browser.newContext(opts);
    await ctx.exposeBinding('__klarDb', (_q, st) => db(JSON.parse(st)));
    await ctx.exposeBinding('__klarAuth', (_q, op, mail, pw) => auth(op, mail, pw));
    await ctx.addInitScript(() => {
      function abfrage() {
        const st = { op: 'select', filters: [], order: null, limit: null, single: false, row: null };
        const b = {
          select() { return b; }, upsert(row) { st.op = 'upsert'; st.row = row; return b; }, delete() { st.op = 'delete'; return b; },
          eq(k, v) { st.filters.push([k, v]); return b; }, order(f, o) { st.order = [f, o.ascending]; return b; },
          limit(n) { st.limit = n; return b; }, maybeSingle() { st.single = true; return b; },
          then(ok, nein) { return window.__klarDb(JSON.stringify(st)).then(ok, nein); }
        };
        return b;
      }
      let horcher = null;
      const sitzung = () => { try { return JSON.parse(localStorage.getItem('test.sitzung')); } catch { return null; } };
      const anmelden = async (op, email, password) => {
        const r = await window.__klarAuth(op, email, password);
        if (r.error) return { data: {}, error: r.error };
        const s = { user: r.user };
        localStorage.setItem('test.sitzung', JSON.stringify(s));
        return { data: { user: r.user, session: s }, error: null };
      };
      window.__klarSupabase = {
        createClient: () => ({
          auth: {
            getSession: async () => ({ data: { session: sitzung() } }),
            onAuthStateChange: cb => { horcher = cb; return { data: { subscription: { unsubscribe() {} } } }; },
            signUp: ({ email, password }) => anmelden('neu', email, password),
            signInWithPassword: ({ email, password }) => anmelden('an', email, password),
            signOut: async () => { localStorage.removeItem('test.sitzung'); return {}; }
          },
          from: () => abfrage(),
          channel: () => { const k = { on(_t, _f, cb) { window.__klarRT = cb; return k; }, subscribe() { return k; } }; return k; },
          removeChannel: () => { window.__klarRT = null; }
        })
      };
    });
    const page = await ctx.newPage();
    const fehler = [];
    page.on('pageerror', e => fehler.push(e.message));
    seiten.push(page);
    await page.goto('/lokal?wolke=test');
    return { page, ctx, fehler };
  }
  return { geraet, zeilen };
}

async function konto(page, mail, neu) {
  await page.locator('#marke').click();
  await page.locator('[data-mtu="sicher"]').click();
  await page.locator('#kmail').fill(mail);
  await page.locator('#kpw').fill('geheim123');
  await page.locator(`[data-ktu="${neu ? 'neu' : 'an'}"]`).click();
  await expect(page.getByText('Angemeldet als')).toBeVisible();
  await page.locator('[data-ptu="zu"]').first().click();
}

async function aufgabe(page, titel) {
  const neu = page.locator('#neu');
  if (await neu.isVisible()) await neu.click(); else await page.locator('#fab').click();
  await page.locator('#dtitel').fill(titel);
  await page.locator('[data-dtu="anlegen"]').click();
  await expect(page.getByText(titel).first()).toBeVisible();
}

test('Mac und Handy haben live denselben Stand', async ({ browser }, info) => {
  test.skip(info.project.name !== 'mac', 'baut seine Geräte selbst');
  const s = speicher();
  const mac = await s.geraet(browser, { viewport: { width: 1360, height: 860 } });
  const handy = await s.geraet(browser, { ...devices['iPhone 13'], defaultBrowserType: undefined });

  /* Vorher nur auf dem Mac angelegt – geht beim ersten Anmelden ins Konto */
  await aufgabe(mac.page, 'Schon vorher auf dem Mac');
  await konto(mac.page, 'lukas@test.de', true);
  await konto(handy.page, 'lukas@test.de', false);
  await expect(handy.page.getByText('Schon vorher auf dem Mac').first()).toBeVisible({ timeout: 10_000 });

  await aufgabe(mac.page, 'Neu am Mac');
  await expect(handy.page.getByText('Neu am Mac').first()).toBeVisible({ timeout: 10_000 });

  await aufgabe(handy.page, 'Neu am Handy');
  await expect(mac.page.getByText('Neu am Handy').first()).toBeVisible({ timeout: 10_000 });

  /* Neu laden: bleibt angemeldet und hat alles */
  await handy.page.reload();
  await expect(handy.page.getByText('Neu am Handy').first()).toBeVisible();
  await expect(handy.page.getByText('Neu am Mac').first()).toBeVisible();

  /* Jedes Konto sieht nur seine Zeilen */
  expect([...s.zeilen.values()].every(r => r.user_id === 'u-lukastestde')).toBe(true);
  expect(mac.fehler).toEqual([]);
  expect(handy.fehler).toEqual([]);
  await mac.ctx.close(); await handy.ctx.close();
});

test('anderes Konto auf demselben Gerät bekommt die alten Daten nicht', async ({ browser }, info) => {
  test.skip(info.project.name !== 'mac', 'baut seine Geräte selbst');
  const s = speicher();
  const g = await s.geraet(browser, { viewport: { width: 1360, height: 860 } });
  await konto(g.page, 'erste@test.de', true);
  await aufgabe(g.page, 'Gehört dem ersten Konto');
  await g.page.waitForTimeout(2600);
  await g.page.locator('#marke').click();
  await g.page.locator('[data-mtu="sicher"]').click();
  await g.page.locator('[data-ktu="ab"]').click();
  await g.page.locator('#kmail').fill('zweite@test.de');
  await g.page.locator('#kpw').fill('geheim123');
  await g.page.locator('[data-ktu="neu"]').click();
  await expect(g.page.getByText('Angemeldet als')).toBeVisible();
  await g.page.waitForTimeout(2600);
  const zweite = [...s.zeilen.values()].filter(r => r.user_id === 'u-zweitetestde' && r.sammlung === 'stand');
  expect(zweite.every(r => !r.daten.stand.includes('Gehört dem ersten Konto'))).toBe(true);
  await g.page.locator('[data-ptu="zu"]').first().click();
  await expect(g.page.getByText('Gehört dem ersten Konto')).toHaveCount(0);
  expect(g.fehler).toEqual([]);
  await g.ctx.close();
});

test('ein leeres Gerät überschreibt nie einen echten Stand', async ({ browser }, info) => {
  test.skip(info.project.name !== 'mac', 'baut seine Geräte selbst');
  const s = speicher();
  const mac = await s.geraet(browser, { viewport: { width: 1360, height: 860 } });
  const handy = await s.geraet(browser, { ...devices['iPhone 13'], defaultBrowserType: undefined });
  /* Mac hat schon Daten, ist aber noch nicht angemeldet */
  await aufgabe(mac.page, 'Echter Stand am Mac');
  /* App einmal zu und wieder auf – so wie im echten Leben zwischen zwei Tagen */
  await mac.page.reload();
  await expect(mac.page.getByText('Echter Stand am Mac').first()).toBeVisible();
  /* Das leere Handy meldet sich zuerst an … */
  await konto(handy.page, 'lukas@test.de', true);
  await handy.page.waitForTimeout(2600);
  /* … danach der Mac: sein Stand muss bleiben und aufs Handy wandern */
  await konto(mac.page, 'lukas@test.de', false);
  await mac.page.waitForTimeout(3000);
  await expect(mac.page.getByText('Echter Stand am Mac').first()).toBeVisible();
  await expect(handy.page.getByText('Echter Stand am Mac').first()).toBeVisible({ timeout: 10_000 });
  expect(mac.fehler).toEqual([]);
  await mac.ctx.close(); await handy.ctx.close();
});

test('Stand aus dem alten Klar per Claude-Brücke übernehmen, landet auf dem Handy', async ({ browser }, info) => {
  test.skip(info.project.name !== 'mac', 'baut seine Geräte selbst');
  const s = speicher();
  const mac = await s.geraet(browser, { viewport: { width: 1360, height: 860 } });
  const handy = await s.geraet(browser, { ...devices['iPhone 13'], defaultBrowserType: undefined });
  await konto(mac.page, 'lukas@test.de', true);
  await konto(handy.page, 'lukas@test.de', false);
  const alt = JSON.parse(readFileSync(new URL('./beispiel.json', import.meta.url), 'utf8')).zustand;
  await mac.page.locator('#marke').click();
  await mac.page.locator('[data-mtu="bruecke"]').click();
  await mac.page.locator('#breingabe').fill(JSON.stringify(alt));
  await mac.page.locator('[data-btu="rein"]').click();
  await expect(mac.page.getByText(/Übernommen: 4 Aufgaben/)).toBeVisible();
  await expect(handy.page.getByText('Testkunde Muster: Angebot Hausrat schicken').first()).toBeVisible({ timeout: 10_000 });
  await mac.page.locator('#marke').click();
  await mac.page.locator('[data-mtu="sicher"]').click();
  await expect(mac.page.getByText('Abgeglichen.')).toBeVisible({ timeout: 10_000 });
  expect(mac.fehler).toEqual([]); expect(handy.fehler).toEqual([]);
  await mac.ctx.close(); await handy.ctx.close();
});
