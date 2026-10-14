# Run finale — финал партии (победа / поражение)

**Статус:** черновик на review  
**Идея:** [`docs/vision/ideas/game-run-finale-pre-alpha.md`](../../docs/vision/ideas/game-run-finale-pre-alpha.md) (эпик **GE1**)

## Запуск

```bash
cd design-lab/run-finale
./sync-lab.sh   # после правки styles.css → lab-base.css
npx serve .
```

Раунд self-contained: `index.html` подключает только `./lab-base.css`. Также доступен из хаба `design-lab/` → **Run finale — GE1**.

## Управление на странице

- **Исход:** победа / поражение (меняет копирайт и CTA).
- **Сценарий** (для V7): Студент / Предприниматель.
- **Тема:** светлая / тёмная.

## Варианты

См. [VARIANTS.md](./VARIANTS.md).

## Общее для всех вариантов

- Блок **обратной связи**: необязательное поле + «Отправить» (в lab — демо-toast).
- Без звука.
- Поражение: намёк на **архив** + бейдж; победа: бейдж **Победа**, кнопка **Играть дальше**.

## Ассеты победы

Четыре маскота с кубком: `assets/{student,professional,manager,entrepreneur}-mascot-cup-dash.png`. Исходники — `assets/source/`. Пересборка: `python process-cup-assets.py` из этой папки (нужен Pillow).

## Утверждение

**V1 ★** (2026-06-01) — дальше spec → prod.
