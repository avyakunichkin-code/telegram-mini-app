# B · Мягкий объём

Утверждённые 03.11.2026 растровые мастера четырёх персонажей и напарников.
[Решение и область](../../../../design-lab/mascots/APPROVED.md).
Происхождение: `design-lab/mascots/pet-style-round/assets/*-b-{person,mate,avatar}.webp`.
Исходные PNG imagegen сохранены в lab; эти masters — источник последующих экспортов.

`student`, `professional` (pro), `manager` (boss), `entrepreneur` (biz).
`*-person.webp` — полный персонаж, `*-mate.webp` — напарник,
`*-avatar.webp` — обрезка лица. Новые версии графики сначала проходят lab.

Из корня: `.venv/Scripts/python.exe frontend-react/scripts/process-soft-volume-mascots.py`,
затем `node scripts/design-assets.mjs`. Runtime-размеры людей — 56/72/108 px,
физические изображения — 2x. Аватар — 40 px, напарник — до 108 px.
Лендинг использует отдельные `*-mascot-landing.webp` высотой 400 px;
встроенные примеры — тот же аватар. Размеры не создают новых графических вариантов.
