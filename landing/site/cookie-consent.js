/*
 * Уведомление о cookie — единый источник для всех сайтов «ТВОЙ ХОД» / «ТВОЙ ПЛАН».
 * Копии раздаёт `node scripts/sync-cookie-consent.mjs` (проверка: `--check`). Правки — только здесь.
 *
 * Без зависимостей; сам вставляет свои стили. Выбор хранится в localStorage
 * (ключ `cookie-consent-v1`) — это строго необходимое хранение, согласия не требует.
 *
 * Конфигурация — data-атрибуты на <script>:
 *   data-policy-url="/privacy.html"  ссылка на политику обработки ПДн / cookie (если не задана — ссылки нет)
 *   data-operator="ООО «…»"           наименование оператора (показывается в тексте)
 *
 * API для подключения аналитики (подключать её ТОЛЬКО после согласия):
 *   window.CookieConsent.allowed('analytics')   → true/false
 *   window.CookieConsent.onChange(fn)           → fn({analytics:boolean}) при выборе и при загрузке с сохранённым выбором
 *   window.CookieConsent.open()                 → показать баннер снова (ссылка «Настройки cookie» в футере)
 */
(function () {
  'use strict';
  if (window.CookieConsent) return;

  var KEY = 'cookie-consent-v1';
  var script = document.currentScript;
  var policyUrl = script && script.getAttribute('data-policy-url');
  var operator = script && script.getAttribute('data-operator');
  var listeners = [];

  function read() {
    try {
      var v = JSON.parse(localStorage.getItem(KEY));
      return v && typeof v.analytics === 'boolean' ? v : null;
    } catch (e) { return null; }
  }
  function write(analytics) {
    var v = { analytics: analytics, ts: new Date().toISOString() };
    try { localStorage.setItem(KEY, JSON.stringify(v)); } catch (e) { /* приватный режим: выбор живёт до перезагрузки */ }
    return v;
  }
  function emit(v) {
    listeners.slice().forEach(function (fn) { try { fn({ analytics: v.analytics }); } catch (e) { /* ignore */ } });
  }

  var API = window.CookieConsent = {
    allowed: function (cat) { var v = read(); return cat === 'necessary' || !!(v && v[cat]); },
    onChange: function (fn) {
      listeners.push(fn);
      var v = read();
      if (v) { try { fn({ analytics: v.analytics }); } catch (e) { /* ignore */ } }
    },
    open: function () { show(); }
  };

  var CSS = '' +
    '#cc-banner{position:fixed;z-index:2147483000;left:16px;right:16px;bottom:16px;max-width:560px;' +
    'margin:0 auto;padding:16px 18px;border-radius:16px;background:#17181c;color:#fff;' +
    'font:14px/1.45 Onest,system-ui,-apple-system,"Segoe UI",sans-serif;box-shadow:0 12px 40px rgba(0,0,0,.35)}' +
    '#cc-banner p{margin:0 0 12px}#cc-banner a{color:#f7d774;text-decoration:underline}' +
    '#cc-banner .cc-row{display:flex;gap:8px;flex-wrap:wrap}' +
    '#cc-banner button{flex:1 1 140px;min-height:44px;padding:10px 14px;border-radius:12px;border:2px solid #f7d774;' +
    'font:inherit;font-weight:600;cursor:pointer;background:transparent;color:#fff}' +
    '#cc-banner button:focus-visible{outline:3px solid #fff;outline-offset:2px}' +
    '@media (prefers-reduced-motion:no-preference){#cc-banner{animation:cc-in .2s ease-out}}' +
    '@keyframes cc-in{from{opacity:0;transform:translateY(12px)}to{opacity:1;transform:none}}';

  function show() {
    if (document.getElementById('cc-banner')) return;
    if (!document.getElementById('cc-style')) {
      var st = document.createElement('style');
      st.id = 'cc-style'; st.textContent = CSS;
      document.head.appendChild(st);
    }
    var box = document.createElement('div');
    box.id = 'cc-banner';
    box.setAttribute('role', 'dialog');
    box.setAttribute('aria-label', 'Уведомление об использовании cookie');

    var p = document.createElement('p');
    p.textContent = (operator ? operator + ' использует' : 'Мы используем') +
      ' файлы cookie и локальное хранилище браузера. Необходимые нужны для работы сайта (вход, настройки, сохранение прогресса) — они включены всегда. ' +
      'Аналитические помогают понять, как люди пользуются сайтом, — только с вашего согласия. Выбор можно изменить в любой момент. ';
    if (policyUrl) {
      var a = document.createElement('a');
      a.href = policyUrl; a.textContent = 'Подробнее в политике';
      p.appendChild(a);
    }
    var row = document.createElement('div'); row.className = 'cc-row';
    function btn(label, analytics) {
      var b = document.createElement('button');
      b.type = 'button'; b.textContent = label;
      b.addEventListener('click', function () {
        var v = write(analytics);
        box.remove();
        emit(v);
      });
      return b;
    }
    // Равнозначные кнопки: отказ не спрятан и не слабее согласия.
    row.appendChild(btn('Только необходимые', false));
    row.appendChild(btn('Принять все', true));
    box.appendChild(p); box.appendChild(row);
    document.body.appendChild(box);
  }

  function init() { if (!read()) show(); }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();
})();
