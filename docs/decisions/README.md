---
tags:
  - tvoy-hod/layer/adr
aliases:
  - "Architecture Decision Records (ADR)"
---
# Architecture Decision Records (ADR)

Когда фиксировать ADR: необратимый выбор схемы, миграции, отказ от Alembic, контракт API.

- [ADR-001: `save_kind`, отказ от light/hardcore](../../game/docs/decisions/ADR-001-save-kind-remove-light-hardcore.md) (accepted; резерв Plan superseded ADR-013)
- [ADR-013: только Game, отказ от режима Plan](../../game/docs/decisions/ADR-013-game-only-drop-plan-mode.md) (accepted; п.3 superseded ADR-016)
- [ADR-016: два продукта (Game и Plan) на общем финансовом ядре](ADR-016-two-products-shared-fincore.md) (accepted; п.8 amended ADR-017)
- [ADR-017: продуктовый каркас Plan (P2) не ждёт Pre-Alpha gate игры](ADR-017-plan-p2-without-game-gate.md) (accepted)
- [ADR-014: направление бренда — настольная игра про деньги](../../game/docs/decisions/ADR-014-brand-direction-board-game.md) (accepted)
- [ADR-015: потребности — износ рутиной и уровень жизни](../../game/docs/decisions/ADR-015-needs-set-point-model.md) (accepted)
- [ADR-002: движок победы v2 и `victory_config`](../../game/docs/decisions/ADR-002-victory-engine-and-template-config.md) (accepted)
- [ADR-003: снятие character XP/level](../../game/docs/decisions/ADR-003-remove-character-progression.md) (accepted)
- [ADR-004: разблокировка механик по цепочке целей](../../game/docs/decisions/ADR-004-mechanics-unlock-victory-chain.md) (accepted)
- [ADR-005: потребности персонажа, decay, поражение при нуле](../../game/docs/decisions/ADR-005-character-needs-state-and-defeat.md) (accepted)
- [ADR-006: «Порадовать себя» — выбор варианта, MVP ≥1 опция, кулдаун 15](../../game/docs/decisions/ADR-006-treat-self-options-and-cooldown.md) (accepted)
- [ADR-012: primary channels — PWA и web; TMA вторичный](../../game/docs/decisions/ADR-012-primary-channels-pwa-web-over-tma.md) (accepted)

Шаблон: [`../templates/ADR.md`](../templates/ADR.md)

Именование: `ADR-NNN-<slug>.md`

Размещение продуктов: [ADR-018](ADR-018-product-roots.md). Продуктовые ADR GAME сохранены
с прежними идентификаторами в [game/docs/decisions](../../game/docs/decisions/).
