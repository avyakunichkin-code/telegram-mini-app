---
name: frontend-design
description: Create distinctive, production-grade frontend interfaces with high design quality. Use this skill when the user asks to build web components, pages, artifacts, posters, or applications (examples include websites, landing pages, dashboards, React components, HTML/CSS layouts, or when styling/beautifying any web UI). Generates creative, polished code and UI design that avoids generic AI aesthetics.
license: Complete terms in LICENSE.txt
---

This skill guides creation of distinctive, production-grade frontend interfaces that avoid generic "AI slop" aesthetics. Implement real working code with exceptional attention to aesthetic details and creative choices.

The user provides frontend requirements: a component, page, application, or interface to build. They may include context about the purpose, audience, or technical constraints.

## Design Thinking

Before coding, understand the context and commit to a BOLD aesthetic direction:
- **Purpose**: What problem does this interface solve? Who uses it?
- **Tone**: Pick an extreme: brutally minimal, maximalist chaos, retro-futuristic, organic/natural, luxury/refined, playful/toy-like, editorial/magazine, brutalist/raw, art deco/geometric, soft/pastel, industrial/utilitarian, etc. There are so many flavors to choose from. Use these for inspiration but design one that is true to the aesthetic direction.
- **Constraints**: Technical requirements (framework, performance, accessibility).
- **Differentiation**: What makes this UNFORGETTABLE? What's the one thing someone will remember?

**CRITICAL**: Choose a clear conceptual direction and execute it with precision. Bold maximalism and refined minimalism both work - the key is intentionality, not intensity.

Then implement working code (HTML/CSS/JS, React, Vue, etc.) that is:
- Production-grade and functional
- Visually striking and memorable
- Cohesive with a clear aesthetic point-of-view
- Meticulously refined in every detail

## Frontend Aesthetics Guidelines

Focus on:
- **Typography**: Choose fonts that are beautiful, unique, and interesting. Avoid generic fonts like Arial and Inter; opt instead for distinctive choices that elevate the frontend's aesthetics; unexpected, characterful font choices. Pair a distinctive display font with a refined body font.
- **Color & Theme**: Commit to a cohesive aesthetic. Use CSS variables for consistency. Dominant colors with sharp accents outperform timid, evenly-distributed palettes.
- **Motion**: Use animations for effects and micro-interactions. Prioritize CSS-only solutions for HTML. Use Motion library for React when available. Focus on high-impact moments: one well-orchestrated page load with staggered reveals (animation-delay) creates more delight than scattered micro-interactions. Use scroll-triggering and hover states that surprise.
- **Spatial Composition**: Unexpected layouts. Asymmetry. Overlap. Diagonal flow. Grid-breaking elements. Generous negative space OR controlled density.
- **Backgrounds & Visual Details**: Create atmosphere and depth rather than defaulting to solid colors. Add contextual effects and textures that match the overall aesthetic. Apply creative forms like gradient meshes, noise textures, geometric patterns, layered transparencies, dramatic shadows, decorative borders, custom cursors, and grain overlays.

NEVER use generic AI-generated aesthetics like overused font families (Inter, Roboto, Arial, system fonts), cliched color schemes (particularly purple gradients on white backgrounds), predictable layouts and component patterns, and cookie-cutter design that lacks context-specific character.

Interpret creatively and make unexpected choices that feel genuinely designed for the context. No design should be the same. Vary between light and dark themes, different fonts, different aesthetics. NEVER converge on common choices (Space Grotesk, for example) across generations.

**IMPORTANT**: Match implementation complexity to the aesthetic vision. Maximalist designs need elaborate code with extensive animations and effects. Minimalist or refined designs need restraint, precision, and careful attention to spacing, typography, and subtle details. Elegance comes from executing the vision well.

Remember: Claude is capable of extraordinary creative work. Don't hold back, show what can truly be created when thinking outside the box and committing fully to a distinctive vision.

## ТВОЙ ХОД (этот репозиторий)

Для UI **ТВОЙ ХОД** не подставляй «универсальную» эстетику скилла вместо канона продукта. Сначала сверяйся с брендом и спеками:

| Источник | Путь |
|----------|------|
| **Brand Guidelines** (лого, цвет, голос, Монетка) | [`docs/reference/brandbook/BRANDBOOK.md`](../../../../docs/reference/brandbook/BRANDBOOK.md) |
| **Product UI (MQX)** | [`docs/reference/brandbook/BRANDBOOK_MQX.md`](../../../../docs/reference/brandbook/BRANDBOOK_MQX.md) |
| PDF Brand | [`brandbook-print.html`](../../../../docs/reference/brandbook/brandbook-print.html) |
| PDF Product UI | [`brandbook-mqx-print.html`](../../../../docs/reference/brandbook/brandbook-mqx-print.html) |
| Ассеты (G1, G2, ТХ, Монетка) | [`docs/reference/brandbook/assets/INDEX.md`](../../../../docs/reference/brandbook/assets/INDEX.md) |
| Маскот (копирайт) | [`docs/reference/CHARACTER_MONETKA.md`](../../../../docs/reference/CHARACTER_MONETKA.md) |
| Логотип prod (G1/G2 PNG) | [`frontend-react/src/assets/brand/`](../../src/assets/brand/) · лендинг: [`landing/public/brand/`](../../../../landing/public/brand/) — **без** плоских SVG L1–L4 |
| Контракт экранов TMA | [`docs/specs/SPEC_FRONTEND_UI.md`](../../../../docs/specs/SPEC_FRONTEND_UI.md) |
| Токены и MQX в коде | [`frontend-react/src/index.css`](../../src/index.css) |
| **FLOW компонентной базы MQX (обязательно)** | [`src/components/mqx/DESIGN_WORKFLOW.md`](../../../src/components/mqx/DESIGN_WORKFLOW.md) — не обходить без явного согласования; исключение: багфикс/hotfix без смены дизайна |

## ⛔ Design-lab перед prod (обязательно)

Для **ТВОЙ ХОД** скилл frontend-design **не заменяет** design-lab. Любое изменение видимого UI (layout, новые блоки, порядок секций, footer/CTA, accordion) — **сначала** `design-lab/<тема>/` + скилл **design-lab-mqx**, **явное утверждение в чате**, **потом** `mqx/` и `*Premium.jsx`.

Порядок для агента:

1. Прочитать `DESIGN_WORKFLOW.md` и UX-spec экрана (`docs/ux/screens/`).
2. Сделать или обновить lab-раунд; показать пользователю через хаб `cd design-lab && npx serve .`.
3. После «утверждаем X» — React + Canon Sync (`APPROVED.md`, parity round).

**Hotfix без lab:** только если diff не меняет компоновку и не вводит новых `mqx-*` паттернов (копирайт, мелкий баг, токен цвета).

**Обязательно для TMA:**

- Палитра: **Quest Violet** `#6D28D9` для primary CTA, табов и нижнего меню; **Signal Emerald** / **Danger** / **Warning Amber** — только по смыслу данных (не «радуга»).
- Тема Telegram: `tg-theme-*` для фона и текста; премиум-слой **MQX** (`MqxShell`, `mqx-hero`, `mqx-card`, `--mqx-glass-*`) — см. брендбук §5.
- Типографика в приложении: **системный стек**, шкала `--mq-fs-body` (15px) / `--mq-fs-caption` (12px) / `--mq-fs-small` (11px); **не** подключать Inter как основной шрифт TMA без продуктового решения.
- **Inter** и выразительные маркетинговые приёмы скилла — для лендинга, `brandbook-print.html` и материалов вне клиента Telegram.
- Видимый UI — **русский**, короткий активный залог; без EN kickers в production.

Новые игровые экраны — только паттерны `*Premium.jsx` и `mqx-*` (см. `.cursor/rules/tvoy-hod-frontend-core.mdc`).

### Капитал MQX (портфель, страховки, новые подразделы «Финансы»)

- **Порядок разделов (утверждено):** Доходы → Расходы → Инвестиции → Страховки → Имущество → Обязательства (аккордеоны). **Бюджет не в плане.** Макет: [`design-lab/capital-page/`](../../../../design-lab/capital-page/), ориентация: [`orient-round/`](../../../../design-lab/capital-page/orient-round/).
- **Каталог vs позиции:** сегмент **«Добавить | Мои (N)»** (или «Оформить | Позиции» для инвестиций) — **внутри** `mqx-capital-card` активного раздела, сразу после `mqx-capital-lead`, по умолчанию левая вкладка («Добавить»). Не в hero страницы. См. [`design-lab/capital-page/`](../../../../design-lab/capital-page/).
- **Строки позиций** (актив, долг, полис, инвест-позиция): **`MqxFinListRow`** + метрики + **`MqxRowAction`**. Карточка с вертикальным accent (**`CapitalPositionCard`**, вариант H) — только **каталог** (шаблоны активов/долгов, тарифы страховки с **+**).
- **Кикеры в шаблонах:** не показывать сырой `kind` из API (`home`, `rental_home` и т.д.); не повторять название раздела («Долг» во вкладке долгов). Смысловой контекст страхового полиса (**продукт · объект**) — в `subtitle` у `MqxFinListRow`, если не дублирует метрики (см. E2 в [`SPEC_FRONTEND_UI.md`](../../../../docs/specs/SPEC_FRONTEND_UI.md)).
- **Новый подраздел «Финансы»:** тот же каркас — `mqx-card mqx-capital-card`, при необходимости `MqxSubtab`, lead `mqx-capital-lead`, затем либо каталог, либо список позиций за кнопкой. Не вводить третий визуальный язык без этапа `design-lab` и утверждения по [`DESIGN_WORKFLOW.md`](../../../src/components/mqx/DESIGN_WORKFLOW.md).
