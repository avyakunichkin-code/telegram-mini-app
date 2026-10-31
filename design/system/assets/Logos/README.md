# Logos

- `logo-full.webp` — **G1**: lockup «ТВОЙ ХОД» + tagline «Финансы как игра». Старт, вход, меню — по центру, ~240–280px ширины на 390px экране. ТВОЙ — Coin Gold, ХОД — Quest Violet. Prod: `BrandLogo variant="full"` / `BrandMark`.
- `logo-compact.webp` — **G2**: без tagline. Шапка игры и вкладки — слева, 36–44px высоты. Prod: `BrandLogo variant="compact"` в `MqxTabHero`.
- `avatar-tx.svg` — монограмма **ТХ** на `#6D28D9`, белым. Только аватар (TG 512×512, соцсети) и chip — не замена G1/G2 в шапке.

Охранное поле ≥ ½ высоты знака. Нельзя: искажать, обводить, класть на фото без подложки ≥40% чёрной, использовать плоские SVG L1–L4 и «MQ / Money Quest». Оригиналы и размеры — здесь, в `Logos/` и `Logos/logo-full-sizes/`. `frontend-react/src/assets/brand/` — проверяемый экспорт. Для лендинга выбран G1 с подписью из `logo-full-sizes/`, без отдельной CSS-подписи.
