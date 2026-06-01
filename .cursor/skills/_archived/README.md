# Archived Agent Skills (ТВОЙ ХОД)

Скиллы здесь **не удалены**, но вынесены из корня `.cursor/skills/`, чтобы Cursor не подтягивал их в каждую сессию.

- В [`catalog.yaml`](../catalog.yaml): `status: archived`
- В каждом `SKILL.md`: `disable-model-invocation: true`
- Вызов: явно по имени, например «используй скилл `ux-design` из `_archived`» или открой [`.cursor/skills/_archived/ux-design/SKILL.md`](ux-design/SKILL.md)
- В начале каждого `SKILL.md` — **баннер «АРХИВ (ТВОЙ ХОД)»**: не использовать `design/gdd/`, `design/ux/`; маппинг на `docs/` и active-скиллы (`idea-refine`, `spec-driven-development`, `frontend-ui-engineering`, …)

**Когда возвращать в корень:** появился полноценный GDD/UX-контур (`design/gdd/`, studio-процесс) или скилл снова нужен ежедневно — перенесите папку обратно в `.cursor/skills/<name>/` и смените `status` в каталоге на `active` или `optional`.

Behavioral specs: [`../specs/_archived/studio/`](../specs/_archived/studio/)
