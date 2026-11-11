// Keep real language URLs usable without JavaScript or browser storage.
(() => {
  const language = document.documentElement.lang;
  const switcher = document.querySelector('.language-switch');
  const storageKey = 'savateykin-language';
  const sections = new Set(['#about', '#projects', '#contact']);
  const sectionHash = () => sections.has(location.hash) ? location.hash : '';
  const targetPath = language === 'ru' ? '/en/' : '/';

  function updateSwitchLink() {
    if (switcher) switcher.href = targetPath + sectionHash();
  }

  // Restore the preference only on a fresh visit, not during in-site navigation
  // or Back/Forward. An explicit /en/ URL always remains directly accessible.
  let preference;
  try {
    preference = localStorage.getItem(storageKey);
  } catch {
    // Privacy settings may disable localStorage; navigation must still work.
  }
  const navigation = performance.getEntriesByType('navigation')[0];
  let internalReferrer = false;
  try {
    internalReferrer = Boolean(document.referrer) &&
      new URL(document.referrer).origin === location.origin;
  } catch {
    // An absent or malformed referrer is treated as a fresh visit.
  }
  if (language === 'ru' && preference === 'en' && !internalReferrer &&
      (!navigation || navigation.type === 'navigate')) {
    location.replace('/en/' + sectionHash());
    return;
  }

  try {
    localStorage.setItem(storageKey, language);
  } catch {
    // Storage is optional.
  }
  updateSwitchLink();
  window.addEventListener('hashchange', updateSwitchLink);
  switcher?.addEventListener('click', () => {
    updateSwitchLink();
    try {
      localStorage.setItem(storageKey, language === 'ru' ? 'en' : 'ru');
    } catch {
      // Follow the ordinary link even if persistence is unavailable.
    }
  });
})();
