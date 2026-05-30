# Events — оверлей и карточка

**Статус:** **L3 ★** карточка + **O1 ★** оверлей в prod.

| Раунд | Папка | Задача |
|-------|--------|--------|
| **1** | [`layout-round/`](layout-round/) | Компоновка L1–L5 → ★ **L3** |
| **2** | [`domains-round/`](domains-round/) | Скины `event_domain` на L3 |
| **3** | [`overlay-round/`](overlay-round/) | Окно: шапка, панель, навигация → ★ **O1** |
| **4** | [`tails-round/`](tails-round/) | E2 halo + E5 длинные тексты → ★ prod · канон [`tails-round/APPROVED.md`](tails-round/APPROVED.md) |
| Архив | `index.html` | Раунды M1–M6, B′ (2026-05) |

**Навигатор (основной способ):**

```powershell
cd design-lab
npx serve .
# http://localhost:3000/ — хаб из nav.manifest.json (поиск, parity, все раунды)
```

Пересборка хаба после правок `nav.manifest.json`:

```powershell
cd frontend-react
npm run design-lab:build-nav
```

**Синк раундов events:**

```powershell
cd design-lab/events
.\sync-all-rounds.ps1
```

В `index.html` только `./lab-base.css` и `./styles.css` — без `../`.

Ideation: [`IDEATION.md`](./IDEATION.md) · эпик: [`docs/vision/ideas/mqx-ui-unification.md`](../../docs/vision/ideas/mqx-ui-unification.md).

## Раунд 1 (legacy)

| ID | Идея |
|----|------|
| **A** | Текущий prod (рамка + violet outline) |
| **B** | Flat D′ |
| **B′ ★** | B + бейдж «Страховой случай» + emerald primary на выборе с полисом |

## Раунд 2 — Монетка (PNG `assets/monetka-mascot.png`)

| ID | Идея |
|----|------|
| **M6 ★** | Страховой бриф: emerald halo, пульс, Монетка 64px |
| **M1** | Компактный ряд: Монетка слева, chips, desc 2 строки |
| **M2** | Реплика в пузыре (description в bubble) |
| **M3** | Шапка-полоса: gradient hero, Монетка на кромке |
| **M4** | Колонка-визуал: кольцо + rail |
| **M5** | Ультра-компакт: 44px, мелкие выборы |

## API

`GET /api/game/events/pending` — у выбора с `insurance_claim` в effects: `"insurance_claim": true`, опционально `xp_delta`.
