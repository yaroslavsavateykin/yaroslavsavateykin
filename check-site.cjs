const assert = require('node:assert/strict');
const fs = require('node:fs');
const { chromium } = require(process.env.PLAYWRIGHT_MODULE ||
  '/home/yaroslav/.npm/_npx/e41f203b7505f1fb/node_modules/playwright');
const base = process.env.SITE_URL || 'http://127.0.0.1:31006';

(async () => {
  fs.mkdirSync('artifacts/review', { recursive: true });
  const browser = await chromium.launch({ headless: true });
  try {
    for (const [lang, path] of [['ru', '/'], ['en', '/en/']]) {
      for (const [label, width, height] of [['desktop', 1440, 1100], ['tablet', 768, 1024], ['mobile', 390, 844], ['small', 320, 740]]) {
        const context = await browser.newContext({ viewport: { width, height } });
        const page = await context.newPage();
        const errors = [];
        page.on('pageerror', e => errors.push(e.message));
        page.on('console', e => { if (e.type() === 'error') errors.push(e.text()); });
        page.on('response', r => { if (r.status() >= 400) errors.push(`${r.status()} ${r.url()}`); });
        await page.goto(base + path);
        assert.equal(await page.locator('html').getAttribute('lang'), lang);
        assert.equal(await page.locator('main section').count(), 3);
        assert.equal(await page.locator('nav a').count(), 3);
        assert.equal(await page.locator('.language-switch').count(), 1);
        assert.equal(await page.locator('.language-switch').innerText(), lang === 'ru' ? 'EN' : 'RU');
        assert.deepEqual(await page.locator('.project h3').evaluateAll(nodes => nodes.map(node => node.firstElementChild.firstChild.textContent)), ['KineticsApp', 'unc_tools', 'Leafview']);
        assert.doesNotMatch(await page.content(), /Orbitalis|Equilibrium|note-\d|#notes|О чём это место|Три направления/);
        assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false, `Overflow: ${lang}/${label}`);
        const canonical = 'https://savateykin.ru' + path;
        assert.equal(await page.locator('link[rel="canonical"]').getAttribute('href'), canonical);
        assert.equal(await page.locator('meta[property="og:url"]').getAttribute('content'), canonical);
        assert.equal(await page.locator('meta[property="og:locale"]').getAttribute('content'), lang === 'ru' ? 'ru_RU' : 'en_US');
        assert.equal(await page.locator('link[hreflang="ru"]').getAttribute('href'), 'https://savateykin.ru/');
        assert.equal(await page.locator('link[hreflang="en"]').getAttribute('href'), 'https://savateykin.ru/en/');
        for (const name of ['description', 'og:title', 'og:description']) {
          assert.ok((await page.locator(`meta[${name === 'description' ? 'name' : 'property'}="${name}"]`).getAttribute('content')).length > 20);
        }
        for (const href of await page.locator('a[href^="#"]').evaluateAll(a => a.map(el => el.getAttribute('href')))) {
          assert.equal(await page.locator(href).count(), 1, `Missing anchor ${href}`);
        }
        // Skip link and all visible controls remain keyboard accessible.
        await page.keyboard.press('Tab');
        assert.equal(await page.locator('.skip').evaluate(el => el === document.activeElement), true);
        await page.keyboard.press('Tab');
        await page.locator(':focus').evaluate(el => el.blur());
        await page.screenshot({ path: `artifacts/review/${lang}-${label}.png`, fullPage: true });
        for (const section of ['about', 'projects', 'contact']) {
          await page.locator(`nav a[href="#${section}"]`).click();
          await page.waitForURL(`**/#${section}`);
          await page.locator('.language-switch').focus();
          await page.keyboard.press('Enter');
          await page.waitForURL(`**${lang === 'ru' ? '/en/' : '/'}#${section}`);
          assert.equal(await page.locator('html').getAttribute('lang'), lang === 'ru' ? 'en' : 'ru');
          assert.equal(await page.evaluate(() => localStorage.getItem('savateykin-language')), lang === 'ru' ? 'en' : 'ru');
          await page.locator('.language-switch').click();
          await page.waitForURL(`**${path}#${section}`);
          assert.equal(await page.locator('html').getAttribute('lang'), lang);
        }
        assert.deepEqual(errors, []);
        await context.close();
        console.log(`${lang} ${label}: content, SEO, navigation, keyboard, language anchors OK`);
      }
    }
    // Persist EN across a fresh visit to the root. Switching back persists RU.
    const context = await browser.newContext();
    const first = await context.newPage();
    await first.goto(base + '/');
    await first.locator('.language-switch').click();
    await first.waitForURL('**/en/');
    const revisit = await context.newPage();
    await revisit.goto(base + '/#projects');
    await revisit.waitForURL('**/en/#projects');
    await revisit.reload();
    assert.equal(await revisit.locator('html').getAttribute('lang'), 'en');
    await revisit.locator('.language-switch').click();
    await revisit.waitForURL('**/#projects');
    const russianVisit = await context.newPage();
    await russianVisit.goto(base + '/');
    assert.equal(await russianVisit.locator('html').getAttribute('lang'), 'ru');
    await first.goto(base + '/en/'); // Explicit English URL always works.
    assert.equal(await first.locator('html').getAttribute('lang'), 'en');
    await context.close();
    console.log('Language persistence, reload, explicit /en/: OK');

    const historyContext = await browser.newContext();
    const historyPage = await historyContext.newPage();
    await historyPage.goto(base + '/#contact');
    await historyPage.locator('.language-switch').click();
    await historyPage.waitForURL('**/en/#contact');
    await historyPage.goBack();
    assert.equal(await historyPage.locator('html').getAttribute('lang'), 'ru');
    await historyPage.goForward();
    assert.equal(await historyPage.locator('html').getAttribute('lang'), 'en');
    await historyContext.close();
    console.log('Browser Back/Forward: OK');

    for (const blocked of [false, true]) {
      const context = await browser.newContext({ javaScriptEnabled: blocked });
      if (blocked) await context.addInitScript(() => {
        Object.defineProperty(window, 'localStorage', { get() { throw new Error('Storage blocked'); } });
      });
      const page = await context.newPage();
      const errors = [];
      page.on('pageerror', e => errors.push(e.message));
      await page.goto(base + '/');
      await page.locator('.language-switch').click();
      await page.waitForURL('**/en/');
      await page.locator('.language-switch').click();
      await page.waitForURL(base + '/');
      assert.deepEqual(errors, []);
      await context.close();
    }
    console.log('No JavaScript and blocked storage: OK');
  } finally {
    await browser.close();
  }
})().catch(error => { console.error(error); process.exit(1); });
