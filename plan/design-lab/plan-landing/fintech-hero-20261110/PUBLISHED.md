# Опубликовано · 10.11.2026

Разрешение владельца после просмотра полной страницы: «Отлично, публикуй».

- Адрес: https://avyakunichkin-code.github.io/tvoy-plan-landing/
- Отдельный репозиторий: `avyakunichkin-code/tvoy-plan-landing`, ветка `main`.
- Коммит: `a27f40cdeb7f2ea7eb066fdb2eb58edaa69186ec`, родитель `d9a2d51`.
- GitHub Pages: legacy, main `/`, финальный статус `built`, error `null`.
- Срез: `index.html`, `fintech.css`, `assets/foundation.webp`, общий `cookie-consent.js`, README. Приложение, API, игра и реальные данные не выпускались.

Перед публикацией пять runtime-файлов побайтно сверены с проверенным lab (HTML, CSS, hero, JS, cookie-consent) — exit 0. `git diff --check`, `node --check site.js`, commit и push — exit 0. Рабочее дерево отдельного репозитория после публикации чистое.

Публичная проверка:

`PLAN_LANDING_URL=https://avyakunichkin-code.github.io/tvoy-plan-landing/ node plan/design-lab/plan-landing/fintech-hero-20261110/verify.mjs` — exit 0.

1440/1024/768/390/375/320 px: без переполнений, битых изображений, ошибочных якорей и повторяющихся ID. Четыре сценария, четыре вопроса, раскрытие объяснения, отметка и сброс шага, reload и сохранение cookie-выбора — PASS. Ошибок выполнения или HTTP-ресурсов нет. Публичные скриншоты — `qa/published/`.

Ограничения: нет полного WCAG-аудита и полевых Core Web Vitals; социальное превью в сторонних приложениях не проверялось. Лендинг показывает прототип с вымышленными данными, без формы регистрации и API.

Откат: отдельный revert коммита `a27f40c` в репозитории лендинга и обычный push в main; без force-push и без изменения файлов игры.
