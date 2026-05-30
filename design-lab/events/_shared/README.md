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

```powershell
# один раунд (из папки раунда)
.\sync-lab.ps1

# все раунды events
cd design-lab/events
.\sync-all-rounds.ps1
```

После правок `design-lab/events/styles*.css` или `layout-round/styles.css` — пересобрать затронутые раунды.

Раунды с разметкой `ev-l3__` (domains, tails) автоматически включают `layout-round/styles.css` в `lab-base.css` — флаг `-WithLayoutStyles` не обязателен.

## Агентам

См. `.cursor/rules/tvoy-hod-design-lab.mdc` и скилл `design-lab-mqx`.
