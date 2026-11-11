"""Generate the existing RU/EN static pages; no third-party build dependencies."""

from html import escape
from pathlib import Path

ROOT = Path(__file__).parent
PROJECTS = [
    (
        "KineticsApp",
        "https://kinetics-app.ru",
        "Rust · WebAssembly",
        "Приложение для расчёта химической кинетики. Можно задать механизм реакции и посмотреть, как меняются концентрации со временем.",
        "An app for chemical kinetics. Enter a reaction mechanism and plot how concentrations change over time.",
    ),
    (
        "unc_tools",
        "https://github.com/yaroslavsavateykin/unc_tools",
        "Python",
        "Библиотека на Python для обработки данных с погрешностями: подбор параметров модели, их неопределённости и графики.",
        "A Python library for fitting data with measurement uncertainties and plotting the results.",
    ),
    (
        "Leafview",
        "https://github.com/yaroslavsavateykin/leafview",
        "Rust",
        "Терминальное приложение для просмотра PDF и работы с Typst. В сборке с поддержкой Typst показывает предпросмотр документа и обновляет его при сохранении исходника.",
        "A terminal application for viewing PDFs and working with Typst. Builds with Typst support provide a document preview that updates when the source file is saved.",
    ),
]


def render_page(english):
    def t(ru, en):
        return en if english else ru

    lang = t("ru", "en")
    other_lang = t("en", "ru")
    other_path = t("/en/", "/")
    name = t("Ярослав Саватейкин", "Yaroslav Savateykin")
    url = "https://savateykin.ru" + t("/", "/en/")
    description = t(
        "Ярослав Саватейкин, студент химического факультета МГУ. Физическая химия, молекулярное моделирование и научное программное обеспечение.",
        "Yaroslav Savateykin, chemistry student at Moscow State University. Physical chemistry, molecular modelling, and scientific software.",
    )
    cards = "\n".join(
        f'''          <li class="project">
            <h3><a class="project-heading" href="{href}" target="_blank" rel="noopener noreferrer">{name_}<span aria-hidden="true">↗</span></a></h3>
            <p>{t(ru, en)}</p>
            <small class="tag">{tech}</small>
          </li>'''
        for name_, href, tech, ru, en in PROJECTS
    )
    title = f"{name} | {t('Физическая химия и научные вычисления', 'Physical chemistry & scientific computing')}"
    return f'''<!doctype html>
<html lang="{lang}">
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>{escape(title)}</title>
    <meta name="description" content="{description}">
    <meta name="theme-color" content="#ffffff">
    <meta property="og:title" content="{escape(title)}">
    <meta property="og:description" content="{description}">
    <meta property="og:type" content="website">
    <meta property="og:url" content="{url}">
    <meta property="og:locale" content="{t('ru_RU', 'en_US')}">
    <meta property="og:locale:alternate" content="{t('en_US', 'ru_RU')}">
    <link rel="canonical" href="{url}">
    <link rel="alternate" hreflang="ru" href="https://savateykin.ru/">
    <link rel="alternate" hreflang="en" href="https://savateykin.ru/en/">
    <link rel="alternate" hreflang="x-default" href="https://savateykin.ru/">
    <link rel="icon" href="/favicon.svg" type="image/svg+xml">
    <link rel="stylesheet" href="/styles.css">
    <script src="/script.js" defer></script>
  </head>
  <body id="top">
    <a class="skip" href="#main">{t('К содержимому', 'Skip to content')}</a>
    <div class="page">
      <header class="header">
        <a class="wordmark" href="{t('/', '/en/')}" aria-label="{name}">ys</a>
        <nav aria-label="{t('Основная навигация', 'Main navigation')}">
          <a href="#about">{t('Обо мне', 'About')}</a>
          <a href="#projects">{t('Проекты', 'Projects')}</a>
          <a href="#contact">{t('Контакты', 'Contact')}</a>
        </nav>
        <a class="language-switch" href="{other_path}" lang="{other_lang}" hreflang="{other_lang}" aria-label="{t('Switch to English', 'Переключить на русский')}">{other_lang.upper()}</a>
      </header>
      <main id="main">
        <section class="hero" id="about" aria-labelledby="name">
          <h1 id="name">{name}</h1>
          <p class="lead hero-intro">{t('Учусь на химическом факультете МГУ. Занимаюсь физической химией и молекулярным моделированием, пишу программы для научных расчётов.', 'I study chemistry at Moscow State University. I work on physical chemistry and molecular modelling, and write software for scientific calculations.')}</p>
        </section>
        <section class="section" id="projects" aria-labelledby="projects-title">
          <div class="section-title"><h2 id="projects-title">{t('Проекты', 'Projects')}</h2></div>
          <ul class="project-list">
{cards}
          </ul>
        </section>
        <section class="section contact" id="contact" aria-labelledby="contact-title">
          <div class="section-title"><h2 id="contact-title">{t('Контакты', 'Contact')}</h2></div>
          <p><a href="https://github.com/yaroslavsavateykin" target="_blank" rel="noopener noreferrer">github.com/yaroslavsavateykin</a></p>
        </section>
      </main>
      <footer><span>© {name}</span><a href="#top">{t('Наверх ↑', 'Back to top ↑')}</a></footer>
    </div>
  </body>
</html>
'''


def main():
    for english in (False, True):
        path = ROOT / ("en/index.html" if english else "index.html")
        path.parent.mkdir(exist_ok=True)
        path.write_text(render_page(english), encoding="utf-8")


if __name__ == "__main__":
    main()
