# Archived Agent Skills (ТВОЙ ХОД)

Скиллы здесь **не удалены**, но вынесены из корня `.claude/skills/`: Claude Code обнаруживает только `.claude/skills/<name>/SKILL.md`, поэтому `_archived/<name>/SKILL.md` не попадает ни в список скиллов, ни в меню `/`.

- В [`catalog.yaml`](../catalog.yaml): `status: archived`
- В каждом `SKILL.md`: `disable-model-invocation: true`
- Вызов: `/ux-design` **не сработает**. Попросите явно: «прочитай и примени `_archived/ux-design`» или откройте [`.claude/skills/_archived/ux-design/SKILL.md`](ux-design/SKILL.md)
- В начале каждого `SKILL.md` — **баннер «АРХИВ (ТВОЙ ХОД)»**: не использовать `design/gdd/`, `design/ux/`; маппинг на `docs/` и active-скиллы (`idea-refine`, `spec-driven-development`, `frontend-ui-engineering`, …)

**Когда возвращать в корень:** появился полноценный GDD/UX-контур (`design/gdd/`, studio-процесс) или скилл снова нужен ежедневно — перенесите папку обратно в `.claude/skills/<name>/` и смените `status` в каталоге на `active` или `optional`.

Behavioral specs: [`../specs/_archived/studio/`](../specs/_archived/studio/)
