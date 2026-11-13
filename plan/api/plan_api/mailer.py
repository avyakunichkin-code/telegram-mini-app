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
    def __init__(self, *, log_code: bool = True) -> None:
        self.sent: list[tuple[str, str]] = []  # для тестов: (email, code)
        self.log_code = log_code

    def send_code(self, email: str, code: str) -> None:
        self.sent.append((email, code))
        if self.log_code:
            logger.info("login code for %s: %s", mask_email(email), code)
        else:
            logger.warning("login code for %s not delivered: mail provider is not configured", mask_email(email))
