"""Применить миграции БД `plan`: `py -3 -m plan_api.migrate` (берёт `PLAN_DATABASE_URL`)."""

from tvoy_platform.db import Database
from tvoy_platform.migrations import migrate

from .settings import MIGRATIONS, Settings

if __name__ == "__main__":
    applied = migrate(Database(Settings.from_env().database_url).engine, MIGRATIONS)
    print("applied:", ", ".join(applied) if applied else "nothing new")
