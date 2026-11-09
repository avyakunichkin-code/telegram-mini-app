# ТВОЙ ХОД · дизайн

Игровой канон: [CURRENT_STYLE](../../design/system/CURRENT_STYLE.md),
[дизайн-система](../../design/system/README.md),
[MQX workflow](../../frontend-react/src/components/mqx/DESIGN_WORKFLOW.md).
Новый layout: lab → явное утверждение владельца → MQX → prod и canon.

Лаборатория игры: [только Game](../../design-lab/index.html?product=game).
Утверждения относятся к конкретному раунду и состояниям; архив не текущий канон.
`plan-checkup/` принадлежит Plan и не является источником оформления Game.

Навигация лаборатории генерируется из `design-lab/nav.manifest.json`:
из `frontend-react/` — `npm.cmd run design-lab:build-nav`.
Корневой index и lab-base.css вручную не редактировать.
