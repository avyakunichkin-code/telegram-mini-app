import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const round = path.dirname(fileURLToPath(import.meta.url));
const source = path.resolve(round, '../../../../sites/tvoy-plan-landing');
const out = path.join(round, 'site');
fs.mkdirSync(out, { recursive: true });
const old = fs.readFileSync(path.join(source, 'index.html'), 'utf8');
function section(marker) {
  const start = old.indexOf(marker);
  if (start < 0) throw new Error(`Missing ${marker}`);
  return old.slice(start, old.indexOf('</section>', start) + 10);
}
let head = old.slice(0, old.indexOf('<body'));
head = head.replace(/<link rel="stylesheet"[^>]+>/g, '')
  .replace('family=Onest:wght@400;500;600;700&amp;family=Unbounded:wght@500;600;700', 'family=Onest:wght@400;500;600;700;800')
  .replace('content="#eceef1"', 'content="#faf8f5"')
  .replace('ТВОЙ ПЛАН — понять финансы семьи', 'ТВОЙ ПЛАН — видеть дальше, решать увереннее')
  .replace('</head>', '<link rel="stylesheet" href="./fintech.css?v=1"></head>');
const hero = `
<body id="top"><a class="skip-link" href="#main">Перейти к содержанию</a>
<header class="site-header wrap"><a class="brand" href="#top" aria-label="ТВОЙ ПЛАН — на главную">твой план<i aria-hidden="true"></i><span>Деньги отвечают.</span></a><nav aria-label="Основная навигация"><a href="#process">Как это работает</a><a href="#report">Пример отчёта</a><a class="nav-cta" href="#report">Посмотреть пример <span aria-hidden="true">↗</span></a></nav></header>
<main id="main">
<section class="hero wrap" aria-labelledby="hero-title"><div class="hero-copy"><span class="eyebrow">ЛИЧНЫЕ ФИНАНСЫ · ПОНЯТНЫЙ ПЛАН</span><h1 id="hero-title">Видеть дальше.<br>Решать увереннее.</h1><p>Разберите бюджет, проверьте запас прочности и сравните сценарии на ближайший год.</p><a class="button" href="#report">Посмотреть пример отчёта <span aria-hidden="true">↗</span></a><small>Вымышленные данные · Без регистрации</small></div><figure class="hero-visual"><div class="hero-art"><img src="./assets/foundation.webp" width="1536" height="1024" fetchpriority="high" alt="Финансовая конструкция: прочное основание, резерв из синего стекла, опоры и восходящие платформы под защитным куполом. Над ними свободно летит птица."><span class="art-label label-protection">Защита</span><span class="art-label label-investment">Инвестиции</span><span class="art-label label-reserve">Резерв</span><span class="art-label label-foundation">Фундамент</span></div><figcaption><span class="mini-bars" aria-hidden="true"><i></i><i></i><i></i></span><div><b>Опора сегодня.<br>Больше возможностей завтра.</b><small>Резерв · Защита · Цели</small></div></figcaption></figure></section>
<section class="intro wrap" id="features"><span class="eyebrow">ФИНАНСОВЫЙ ЧЕКАП</span><h2>Ваши цифры.<br class="mobile-break"> Понятные ответы.</h2><div class="intro-grid"><article><span class="intro-icon" aria-hidden="true">▥</span><h3>Что происходит сейчас</h3><p>Соберите доходы, расходы и обязательства в одну картину. Узнайте, сколько остаётся на ваши планы.</p></article><article><span class="intro-icon" aria-hidden="true">⇄</span><h3>Что изменится при нагрузке</h3><p>Посмотрите, как бюджет переживёт потерю дохода, рост расходов или новое большое решение.</p></article><article><span class="intro-icon" aria-hidden="true">↗</span><h3>Каким может быть следующий шаг</h3><p>Получите три действия с объяснением «почему» — и выберите то, с которого готовы начать.</p></article></div><p class="prototype-note"><span></span> Приложение в разработке. Ниже можно изучить пример без ввода личных данных.</p></section>
<section class="foundation-story wrap"><div><span class="eyebrow">УСТОЙЧИВОСТЬ НАЧИНАЕТСЯ С ОСНОВЫ</span><h2>Строить планы.<br>Иметь опору.</h2><p>Финансы — это конструкция. Важно не только двигаться к цели, но и понимать, на чём держится ваш план.</p></div><ol class="foundation-list"><li><span>01</span><div><h3>Фундамент — понятный бюджет</h3><p>Что приходит, что уходит и сколько остаётся после обязательных платежей.</p></div></li><li><span>02</span><div><h3>Резерв — пространство для манёвра</h3><p>Запас на случай, если жизнь пойдёт иначе. Его размер зависит от вашей ситуации.</p></div></li><li><span>03</span><div><h3>Защита — внимание к рискам</h3><p>Обязательства, страховки и сценарии, которые стоит проверить заранее.</p></div></li><li><span>04</span><div><h3>Цели — направление движения</h3><p>Накопления и инвестиции в общей картине. С понятным сроком и без обещаний доходности.</p></div></li></ol></section>`;
const questions = section('<section class="questions"').replace('Потянем ли ипотеку?', 'Потянем ли ипотеку?');
const process = section('<section id="process"');
let report = section('<section id="report"');
report = report.replace('Вся семья.<br>Одна картина.', 'План становится<br>видимым.');
const demo = section('<section id="demo"');
const roadmap = `<section id="roadmap" class="roadmap-section wrap"><div class="section-head horizontal"><div><span class="eyebrow">КУДА МЫ ДВИЖЕМСЯ</span><h2>Шаг за шагом.<br>К полезному сервису.</h2></div><p>Развиваем продукт и проверяем, помогает ли он понимать финансы. Это направление работы, а не обещание сроков.</p></div><ol class="roadmap-grid"><li class="complete"><span class="stage">01 · Основа готова</span><h3>Рабочий прототип</h3><p>Путь от вопросов до отчёта: бюджет, прогноз, стресс-сценарии и следующие шаги.</p></li><li class="current"><span class="stage">02 · Проверяем</span><h3>Понятность и польза</h3><p>Готовим проверку на вымышленных кейсах: понятны ли вопросы, объяснения и действия.</p></li><li class="current"><span class="stage">03 · В разработке</span><h3>Подготовка к запуску</h3><p>Вход, сохранение чекапов и защита данных. До запуска — необходимые проверки готовности.</p></li><li><span class="stage">04 · Впереди</span><h3>Первая версия</h3><p>От разбора к своему плану: цели, шаги и повторные чекапы, чтобы видеть изменения.</p></li></ol></section>`;
const faq = section('<section class="faq"').replace('<section class="faq">', '<section class="faq wrap" id="faq">').replace('Ещё пара вопросов', 'Перед тем как начать');
const closing = `<section class="closing wrap"><span class="eyebrow">СЛЕДУЮЩИЙ ШАГ — К ЯСНОСТИ</span><h2>Меньше неизвестности.<br>Больше опоры.</h2><p>Начните с примера. Посмотрите, как цифры складываются в картину, а картина — в понятный план.</p><a class="button" href="#report">Посмотреть пример отчёта <span aria-hidden="true">↗</span></a><small>Прототип · Без регистрации и личных данных</small></section></main><footer class="site-footer wrap"><a class="brand" href="#top">твой план<i aria-hidden="true"></i><span>Деньги отвечают.</span></a><div><a href="#roadmap">Развитие продукта</a><a href="#faq">Вопросы и ответы</a></div><p>Финансовый чекап для личных и семейных решений.<br>Расчёты — ориентир для размышления, не персональная финансовая рекомендация.</p><small>ТВОЙ ПЛАН · 2026 · Приложение в разработке</small></footer></body></html>`;
const content = head + hero + questions + process + report + demo + roadmap + faq + closing;
fs.writeFileSync(path.join(out, 'index.html'), content);
for (const name of ['site.js', 'cookie-consent.js', 'favicon.svg', 'social-card.png']) fs.copyFileSync(path.join(source, name), path.join(out, name));
fs.writeFileSync(path.join(out, '.nojekyll'), '');
console.log('Built full Plan landing preview; no production files changed.');
