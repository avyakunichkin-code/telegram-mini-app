# Design-lab events — общие скрипты

## Почему `sync-lab`

`npx serve .` из подпапки раунда **не отдаёт** родительские `../styles.css` и `../assets/`. Каждый раунд должен быть **self-contained**:

| Файл | Назначение |
|------|------------|
| `lab-base.css` | Сборка токенов + общих стилей (генерируется) |
| `styles.css` | Стили только этого раунда |
| `assets/monetka-mascot.png` | Копия маскота |

В `index.html` только **относительные пути `./`**, без `../`.

## Команды

```bash
# один раунд (из папки раунда)
./sync-lab.sh

# все раунды events
cd design-lab/events
./sync-all-rounds.sh
```

Сборщик: `events/_shared/sync-lab-round.sh` (bash).

После правок `design-lab/events/styles*.css` или `layout-round/styles.css` — пересобрать затронутые раунды.

Раунды с разметкой `ev-l3__` (domains, tails) автоматически включают `layout-round/styles.css` в `lab-base.css`.

## Агентам

См. `.cursor/rules/tvoy-hod-design-lab.mdc` и скилл `design-lab-mqx`.
