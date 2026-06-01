# Run finale — ассеты

## Победа: маскот с кубком

| Файл | Назначение |
|------|------------|
| `source/*-mascot-cup-source.png` | Исходники (генерация + правки) |
| `{persona}-mascot-cup-dash.png` / `.webp` | Lab + prod: **без фона**, tight trim |

Персонажи: `student`, `professional`, `manager`, `entrepreneur` — в одежде сценария, **только кубок** в руках (у предпринимателя **2 руки**).

**Обработка (обязательно перед вставкой в UI):** как `process-persona-portraits.py` — убрать белый/серый фон (`flood_transparent`), defringe, **trim** прозрачных полей, resize 108px, **повторный trim**. Иначе в макете остаются «пустые» поля вокруг силуэта.

```bash
cd design-lab/run-finale
python process-cup-assets.py
```

В lab/CSS: `<img height="108" width="auto">` — не фиксировать ширину контейнера под старый холст.

## Прочее

- `monetka-mascot.png` — пузырь при поражении (уже с прозрачностью из prod pipeline)
