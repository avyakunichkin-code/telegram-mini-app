# Перенос B · Мягкий объём — 03.11.2026

Поручение владельца после утверждения B: «Переносим».
[Область утверждения](../APPROVED.md). Самопроверка выполнена; независимый агентский
review не запускался, человеческое утверждение не подменялось тестами.

## Результат

- Мастера всех четырёх людей, напарников и аватаров — в
  `design/system/illustrations/soft-volume/`; исходные PNG и утверждённый lab сохранены.
- `process-soft-volume-mascots.py` создаёт активные PNG/WebP в `design/system/assets/`.
  UI-файлы — 2x; отображаемые размеры 56/72/108 и avatar 40 px сохраняются.
- 147 зарегистрированных экспортов. Существующие пути `character-portraits/`
  теперь указывают на B, новые напарники — `src/assets/companions/`.
  Генерация архивной серии не возвращает старые портреты в приложение.
- `PersonaPortrait` подключает B во всех существующих потребителях: выбор жизни,
  меню/сохранения, деньги на главной, финал поражения. Круглый аватар — отдельная обрезка.
- `PersonaCompanion` даёт четыре предмета с русскими alt и декоративным режимом;
  неизвестные ключи/размеры возвращают `null`, включая prototype-подобные имена размеров.
- Каталог `#/dev/mqx` показывает семьи и размеры. Прежний демонстрационный
  лист итогов периода открывается кнопкой и закрывается, вместо постоянного
  перекрытия каталога. Игровой sheet этим исправлением не менялся.
- Галерея design-system показывает B; прежние SVG-потребители лендинга сохраняются.

## Проверки

| cwd | Команда / runtime | Результат |
|---|---|---|
| root | `.venv/Scripts/python.exe frontend-react/scripts/process-soft-volume-mascots.py` · Python 3.13/Pillow | exit 0, все четыре пары |
| root | `node scripts/design-assets.mjs --check` · Node 24 | exit 0, 147 экспортов, 0 stale/unregistered |
| frontend-react | `npm.cmd run test:unit` | exit 0 |
| frontend-react | `npm.cmd run build` | exit 0 |
| frontend-react | `npm.cmd run check:guardrails` | exit 0 |
| frontend-react | `node scripts/check-soft-volume-browser.mjs` · Playwright/system Chrome | exit 0 |
| root | `.venv/Scripts/python.exe -X utf8 scripts/check_conventions.py` | exit 0 |
| root | `git diff --check -- design design-lab frontend-react scripts/design-assets.mjs` | exit 0 |

Browser report: `qa/react/verification.json`. Проверены реальные React-компоненты
в 1440 и 390 px: все роли, размеры, PNG fallback, неизвестные ключи, круглый аватар,
меню, список сохранений, выбор каждой жизни; предметов до выбора роли нет.
API-ответы синтетические и перехвачены браузером; обращения к реальным анкетам,
backend-записи и пользовательским credentials не выполнялись.
Снимки каждой пары и выбора жизни — `qa/react/`; просмотрены при self-review.

Сборка предупреждает о chunk >600 kB, существующем смешанном static/dynamic
импорте API и давности Browserslist. Ошибок сборки нет; зависимости не обновлялись.

## Границы

Новый flow знакомства и голос напарников O3 не вводились: утверждена графика,
а демонстрационный копирайт lab не является контрактом онбординга.
Кубковые позы победного финала остаются прежними — отдельного B-мастера с кубком
в утверждённом раунде нет. Это оставшийся графический follow-up.
Деплой, commit/push, изменение экономики и backend не выполнялись.
Backend pytest и баланс N/A: backend/экономические данные этим срезом не менялись.
Исходные параллельные изменения пользователя сохранены.
