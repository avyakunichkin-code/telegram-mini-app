"""Synthetic E2E stand only: keep production auth limits unchanged."""
import sys
from dataclasses import replace
from pathlib import Path

import uvicorn

sys.path.insert(0, str(Path(__file__).resolve().parents[2] / "plan-api"))
from plan_api.main import create_app
from plan_api.settings import Settings

settings = Settings.from_env()
if settings.production or not settings.database_url.startswith("sqlite:///"):
    raise RuntimeError("E2E stand requires a local SQLite database")
uvicorn.run(create_app(replace(settings, codes_per_ip=1000)), host="127.0.0.1", port=int(sys.argv[1]))
