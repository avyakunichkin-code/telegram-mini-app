# admin-ops — behavioral spec

## Purpose

Extend the admin panel and ops alerts safely:

- Every `/api/admin/*` endpoint depends on `require_admin_user` (`ADMIN_USER_IDS` allowlist) and has a 403 test
- Catalog registry: a new catalog touches `catalogs.py`, `catalog_detail.py`, `catalog_patch.py`, `catalog_write.py`, `catalog_create_payload.py` + FE `catalogCreateConfig.js`
- YAML events are read-only in the admin (ADR-008): PATCH row → 422, choices → 409
- Alerts go through `emit_admin_alert` with a `dedupe_key`, no secrets/PII in payload, Telegram only when `OPS_TELEGRAM_*` is configured

## Trigger examples

- New admin catalog, catalog field, Watchtower column / filter, CSV column
- New alert kind (`notify_*`, `_KIND_EMOJI`, `_KIND_LABEL_RU`, `format_alert_message_ru`)
- New funnel metric or stuck heuristic
- Admin FE screens in `frontend-react/src/components/admin/`

## Expected outcomes

- `pytest -k admin` green; tests use `admin_env` + `auth_headers`; negative 403 case present
- Alerts are emitted after the business commit, wrapped in try/except, deduplicated
- CSV header and row builders change together

## Negative examples (must reject)

- Admin endpoint without `Depends(require_admin_user)` or gated only on the FE route
- Editing a YAML-catalog event through the admin instead of YAML + `db.sh events-sync`
- Alert payload with tokens, passwords, email or `initData`
- Repeating alert kind without `dedupe_key` that should fire once
