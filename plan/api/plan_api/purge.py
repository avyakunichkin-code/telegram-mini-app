"""
Уничтожить данные удалённых аккаунтов (spec: ≤ 30 дней, 152-ФЗ ст. 21): `py -3 -m plan_api.purge`.

Запускать по расписанию раз в сутки — тогда срок с запасом. Расписание — в плане деплоя (SPL-406).
"""

from tvoy_platform.db import Database

from .repo import Repo
from .settings import Settings

if __name__ == "__main__":
    db = Database(Settings.from_env().database_url)
    with db.session() as s:
        print("purged users:", Repo(s).purge_deleted())
