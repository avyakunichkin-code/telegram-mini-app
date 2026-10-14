> Вызывать перед PR/выкаткой. Skill: **`release-web`** (primary channels PWA + web, [ADR-012](../../../docs/decisions/ADR-012-primary-channels-pwa-web-over-tma.md)). Legacy **`/release-tma`** → redirect. Hook не дублирует — только напоминания после правок UI/lab.

# Pre-release / выкатка — обязательные проверки

Перед merge в release / deploy прогонять guardrails, design-lab parity и **PWA/web smoke**. TMA — опционально при правках TMA shell.

## Обязательное (каждый раз)

### 1) Guardrails

Из `frontend-react/`:

```bash
npm run check:guardrails
```

Ожидаемо включает:
- boundaries/quarantine
- canon sync
- `check:dashboard-canon`
- `check:finance-canon`

### 2) Design-lab parity + навигатор

Из `frontend-react/`:

```bash
npm run design-lab:build
```

Это пересобирает:
- `design-lab/dashboard/parity-generated-page-round/`
- `design-lab/finance/parity-generated-page-round/`
- `design-lab/index.html` (design-lab dashboard)

### 3) Backend (если менялся `backend/`)

```bash
cd backend && python -m pytest -q
```

### 4) PWA / web smoke (primary)

- JWT login → новая игра → 4 вкладки, события, закрытие периода
- **320px** и **~390px**; тёмная тема
- **`#/`** refresh на deep link
- PWA install + resume — [`docs/foundation/PWA_INSTALL.md`](../../../docs/foundation/PWA_INSTALL.md)

Полный чеклист: skill **`release-web`**.

### 5) Безопасность (если diff трогает auth, деньги, секреты, вебхуки)

`/security-review` по ветке + проектный чеклист (бывший скилл `security-and-hardening`, консолидирован 2026-10-14):

- **JWT** — `backend/app/auth.py`, ключ `SECRET_KEY` из env (`backend/app/config.py`). Дефолт `default-secret-key-change-me` на проде недопустим: убедиться, что переменная задана в окружении деплоя.
- **Админка** — все `/api/admin/*` через `require_admin_user` (`ADMIN_USER_IDS` из env).
- **Telegram webhook** — `/api/telegram/webhook/player` проверяет `X-Telegram-Bot-Api-Secret-Token` только если задан `PLAYER_TELEGRAM_WEBHOOK_SECRET`; на проде он обязан быть задан.
- **Деньги** — денежные POST идемпотентны (`Idempotency-Key` → `run_idempotent`; FE — `utils/idempotencyKey.js`), ставки и цены только с сервера, баланс меняется только через `adjust_balance` (row-lock).
- **CORS** — origins из env (`app/cors_settings.py`), не `*`.
- **Секреты** — `.env` не в git (`.env.example` — шаблон); Claude Code не читает `.env` (deny в `.claude/settings.json`).

## Опционально

### TMA regression

Только если в ветке менялся WebApp SDK / TMA shell — skill **`telegram-mini-app-runtime`**.

### Design-lab baseline compare

```bash
npm run design-lab:freeze-baseline
```

Открыть: `design-lab/compare-prod/index.html`
