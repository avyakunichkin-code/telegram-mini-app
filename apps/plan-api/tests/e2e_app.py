"""Factory for the isolated Playwright database, never a production entry point."""
from dataclasses import replace

from plan_api.main import create_app as application
from plan_api.settings import Settings


def create_app():
    settings = Settings.from_env()
    if settings.production:
        raise RuntimeError("The E2E factory cannot run in production")
    # Independent browser cases all log in from localhost; API rate-limit tests
    # continue using the normal Settings defaults (20 requests/IP/hour).
    return application(replace(settings, codes_per_ip=200))
