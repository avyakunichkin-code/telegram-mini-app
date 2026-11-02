"""
Отправка кода входа. Внешнего почтового сервиса нет (новая зависимость — «ask first» в spec):
код пишется в лог. Адрес в лог не попадает целиком — только маска.
"""

from __future__ import annotations

import logging

logger = logging.getLogger("plan_api.mail")


def mask_email(email: str) -> str:
    local, _, domain = email.partition("@")
    return f"{local[:1]}***@{domain}"


class LogMailer:
    def __init__(self) -> None:
        self.sent: list[tuple[str, str]] = []  # для тестов: (email, code)

    def send_code(self, email: str, code: str) -> None:
        self.sent.append((email, code))
        logger.info("login code for %s: %s", mask_email(email), code)
