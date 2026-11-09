"""Версии JSON-документа чекапа (`checkups.data_json`).

Старый документ поднимается до текущей схемы при чтении. Ужесточая `CheckupData` или меняя
смысл поля, увеличь CURRENT_SCHEMA_VERSION и добавь шаг в UPCASTERS: {старая версия: функция}.
"""

from __future__ import annotations

import json
from collections.abc import Callable

from .schemas import CheckupData

CURRENT_SCHEMA_VERSION = 1
UPCASTERS: dict[int, Callable[[dict], dict]] = {}


def load_checkup_data(raw: str, version: int) -> CheckupData:
    if version > CURRENT_SCHEMA_VERSION:
        raise ValueError(f"документ чекапа новее кода: версия {version}")
    document = json.loads(raw)
    for step in range(version, CURRENT_SCHEMA_VERSION):
        document = UPCASTERS[step](document)
    return CheckupData.model_validate_json(json.dumps(document, ensure_ascii=False))
