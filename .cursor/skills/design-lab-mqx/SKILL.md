---
name: design-lab-mqx
description: Design-lab rounds for MQX — self-contained HTML/CSS, sync-lab scripts, serve without broken ../ paths. Use when creating or editing design-lab/, layout variants, or before saying a lab mockup is ready for review.
---

# Design-lab MQX

## When to use

- Новый раунд или вариант в `design-lab/<тема>/`
- Правки `design-lab/**/styles.css` или родительских `styles.css` / `styles-monetka.css`
- Пользователь видит «голый» HTML без стилей в lab
- Перед сдачей макета на утверждение

Полный продуктовый цикл: [`frontend-react/src/components/mqx/DESIGN_WORKFLOW.md`](../../../frontend-react/src/components/mqx/DESIGN_WORKFLOW.md).

## Why styles break

`npx serve .` **не раздаёт родительские каталоги**. Любой `href="../..."` в `index.html` даёт 404.

## Self-contained layout (обязательно)

```
design-lab/<тема>/<round>/
  index.html          # только ./lab-base.css, ./styles.css, ./assets/...
  styles.css          # стили раунда
  lab-base.css        # AUTO — не править руками
  sync-lab.ps1        # пересборка
  assets/
    monetka-mascot.png
```

## Workflow

### 1. Создать или изменить макет

- Пишем варианты в `styles.css` раунда и при необходимости в `design-lab/<тема>/styles.css` (общие токены).
- В `index.html` — **только относительные `./` пути**.

### 2. Sync

**Events** (есть общий скрипт):

```powershell
cd design-lab/events
.\sync-all-rounds.ps1
# или из папки раунда:
cd design-lab/events/overlay-round
.\sync-lab.ps1
```

**Другая тема** — скопировать паттерн из [`design-lab/events/_shared/sync-lab-round.ps1`](../../../design-lab/events/_shared/sync-lab-round.ps1) или inline-сборка `lab-base.css` из локальных `../styles.css` **в файл внутри раунда**.

### 3. Verify

```powershell
cd design-lab/<тема>/<round>
npx serve .
```

В DevTools → Network: нет 404 на `.css` и `.png`.

### 4. Commit

Включить в коммит: `lab-base.css`, `assets/*`, `index.html`, `styles.css`, `sync-lab.ps1`.

## Events-specific

| Раунд | sync-lab | lab-base включает |
|-------|----------|-------------------|
| `layout-round` | `.\sync-lab.ps1` | `events/styles.css` + `styles-monetka.css` |
| `overlay-round` | `.\sync-lab.ps1` | то же |
| `domains-round` | `.\sync-lab.ps1` | + `layout-round/styles.css` (`-WithLayoutStyles`) |

## Rules

- Cursor rule: `tvoy-hod-design-lab.mdc`
- MQX prod flow: `tvoy-hod-frontend-mqx.mdc`

## Checklist (перед «готово»)

```
- [ ] index.html без ../ для статики
- [ ] sync-lab.ps1 запущен
- [ ] lab-base.css и assets закоммичены
- [ ] serve . — стили и Монетка на месте
- [ ] README раунда обновлён (запуск + sync)
```
