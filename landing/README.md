# ТВОЙ ХОД · лендинг

Production-источник — site/. Текущий утверждённый дизайн — A «Первый ход» от 07.11.2026: большой фоновый арт, контекстные позы, нативные примеры и дорожка развития. Светлый вариант от 30 октября — история, его нельзя выпускать вместо текущего.

Утверждение: https://github.com/avyakunichkin-code/telegram-mini-app/blob/3ce95ff3d9dbdf6c32c90674aacfd3dc32525bd5/design-lab/landing-author-round/APPROVED.md
История выпуска: https://github.com/avyakunichkin-code/telegram-mini-app/blob/3ce95ff3d9dbdf6c32c90674aacfd3dc32525bd5/design-lab/landing-author-round/PUBLISHED.md
Финальная публикация: cd7ede36ba65b7b17039bd64b277de92804e06a1. Восстановленный исходник: 3ce95ff3:landing/site.

Восстановление 10.11.2026 сохраняет WebP, Open Graph/canonical/favicon, фокус на результате выбора, CTA после примера и на телефоне, предупреждение о первом запуске. Из повторной публикации старого дизайна сохранён общий cookie-consent.js из packages/cookie-consent (пакет находится в актуальной main; копию не редактировать).

site/game-preview/ — сохранённые утверждённые нативные фрагменты на условных данных. Карточка события с «Комфортом» сохранена в game-preview/event/, отдельно от генерируемых site/ds/: генератор в main содержит прежний пример с «Отдыхом». Это сохраняет опубликованный вид и проверку экспортов без изменений игрового UI или генератора. Новую синхронизацию выполнять отдельным согласованным срезом из актуального канона.

Команды из landing/:
- npm run dev — исходник через Vite.
- npm run check:design-assets — проверка общих экспортов.
- npm run build — статический dist/, CSS/JS получают версии по содержимому.
- Для Pages установить BASE_PATH=/telegram-mini-app/landing/ перед сборкой.
- node scripts/verify-restored.mjs — Chrome smoke. LANDING_TEST_URL задаёт адрес страницы (по умолчанию http://127.0.0.1:4178/). Проверяются 1440/390/375 px, все варианты/сброс/фокус, мобильный CTA, cookie, изображения и ошибки ресурсов. Скриншоты — .codex-state/landing-recovery/.

Публичный адрес: https://avyakunichkin-code.github.io/telegram-mini-app/landing/

Публикация выполняется workflow deploy-app.yml из main: он собирает игру и landing/site/. Изменение одной gh-pages не исправляет источник следующего выпуска — восстановление должно попасть в main. Не запускать выпуск из грязного дерева и не переносить посторонние игровые изменения. Backend и доставка почты этим срезом не проверяются.

Восстановление исходника: PR #37. Блокер общего выпуска (nullable для даты опроса) устранён отдельным PR #38; PostgreSQL, backend pytest, E2E и balance diff прошли. Публикацию следует запускать из main с этим исправлением, а не повторять неуспешный workflow на прежнем SHA.
