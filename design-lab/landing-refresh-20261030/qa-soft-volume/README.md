# Проверка графики B на лендинге · 03.11.2026

Поручение: «После этого актуализируй лендинг с новыми маскотами».
Утверждённая композиция A сохранена; серия B относится к графике рассказчиков.

Заменены Студент, Профессионал, Руководитель и Предприниматель в существующих
боковых местах. Новая галерея и новые роли напарников не добавлялись.
Аватар Студента в статическом TurnCard также берётся из серии B.
WebP-рассказчики высотой 400 px экспортируются из общих мастеров design/;
текст, ссылки, механика примера, размеры и композиционный CSS сохранены.

| cwd | Команда | Результат |
|---|---|---|
| root | `.venv/Scripts/python.exe frontend-react/scripts/process-soft-volume-mascots.py` | exit 0 |
| root | `node scripts/design-assets.mjs --check` | exit 0, 147 экспортов, 0 stale |
| landing | `npm.cmd run build` | exit 0, prebuild asset check также exit 0 |
| landing | `node scripts/check-mascots.mjs` | exit 0, system Chrome/Playwright |
| root | `node --check landing/scripts/check-mascots.mjs` | exit 0 |
| root | `git diff --check -- landing design design-lab/landing-refresh-20261030 frontend-react/scripts/process-soft-volume-mascots.py scripts/design-assets.mjs` | exit 0 |

В browser QA проверен именно `landing/dist` через read-only HTTP-сервер:
1440/390 px, четыре загруженных B-рассказчика с исходной высотой 400 px,
новый iframe-аватар, отсутствие старых SVG-рассказчиков в разметке,
горизонтального overflow, обрезки по ширине, ошибок JS и HTTP.
Три решения и сброс примера работают. JSON: `verification.json`.
Снимки desktop/mobile просмотрены по блокам.

Самопроверка, без независимого агента. Новая графика уже утверждена человеком;
браузерная проверка не выдаётся за approval.
Frontend unit/guardrails и backend pytest повторно не запускались: React,
CSS приложения, backend и экономика этим срезом не менялись.
Публичная игра, доставка почты и опубликованный Pages не проверялись.
Деплой, commit и push этой итерации не выполнялись.
