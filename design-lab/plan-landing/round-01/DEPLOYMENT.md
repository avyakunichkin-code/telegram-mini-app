# Публикация — 2026-10-30

Утверждён вариант A; разрешение пользователя сохранено в [APPROVED.md](./APPROVED.md).

- Сайт: https://avyakunichkin-code.github.io/tvoy-plan-landing/
- Репозиторий: https://github.com/avyakunichkin-code/tvoy-plan-landing
- Commit: `57fb82bdd1037058a6a332b08701056b33113fe2`.
- GitHub Pages: `main`, `/`, `build_type=legacy`, build status **built**, error message **null**.
- Публичный информационный лендинг. Файлы игры, API Plan, анкеты, персональные данные и служебная конфигурация Sites не загружались.

## Проверки

- `node --check site.js`: exit **0**.
- Python HTMLParser: один H1, уникальные ID, якорные цели, локальные ресурсы, отсутствие lab/варианта B, PNG signature: exit **0**.
- Создание/загрузка репозитория и настройка Pages: exit **0**.
- Проверка публичных `index.html`, `styles.css`, `site.js`, `favicon.svg`, `social-card.png`: все **HTTP 200**, exit **0**.
- Браузер на публичном URL: desktop и 390 px; на телефоне `scrollWidth=clientWidth=375`, lab-панель отсутствует; переключение «Рост цен» работает, console errors/warnings — пусто.
- Скриншоты: [desktop](./qa/published-desktop.png), [mobile](./qa/published-mobile.png).

Ограничение: полный WCAG-аудит и полевые Core Web Vitals не проводились. Шрифты внешние — Google Fonts с системным fallback. Приложение остаётся прототипом, сайт не открывает регистрацию и ввод реальных финансовых данных.

GitHub connector использован для проверки аккаунта. Создание репозитория и настройка Pages выполнены через авторизованный GitHub CLI, поскольку этих операций нет в доступном connector. Новые учётные данные не создавались.
