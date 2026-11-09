# Монетка и Квитя · A «Чистый объём»

Утверждение и внедрение: [маскоты](../../../../../design-lab/mascots/APPROVED.md).
Лаборатория: `design-lab/mascots/monetka-kvitya-soft-round/`.

Здесь сохранены исходные прозрачные WebP после извлечения поз из imagegen-полос.
Монетка без надписей: ситуация задаётся текстом интерфейса, не ободком.
Семь полных поз и аватары; Квитя — обычные итоги, радость, сверка строк.

Экспорт из корня: `.venv/Scripts/python.exe frontend-react/scripts/process-guide-mascots.py`,
затем `node scripts/design-assets.mjs`. Скрипт не рисует маскотов: сохраняет
мастера, уменьшает совместимые PNG/WebP и регистрирует exports в design/asset-exports.json.

Игра: `MonetkaAvatar` сохраняет API default/wink/sit-edge; sit-edge — совместимое
имя приветственной позы новой серии. До 48 px используется лицо, full — вся фигура.
`KvityaMascot` включён в итоги хода. Положительный cash delta → joy,
отрицательный → think, нулевой → default. Суммы остаются текстом.
Все состояния представлены в `#/dev/mqx`.
