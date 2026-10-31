"""Границы модулей ADR-016: fincore не зависит от фреймворков и кода приложения."""

import subprocess
import sys
from pathlib import Path

BACKEND = Path(__file__).resolve().parents[1]

# В отдельном процессе: import-linter перенастраивает logging, и caplog в следующих тестах перестаёт ловить записи.
_LINT = "from importlinter.cli import lint_imports; raise SystemExit(lint_imports(config_filename='.importlinter', no_cache=True))"


def test_fincore_is_pure():
    result = subprocess.run(
        [sys.executable, "-c", _LINT],
        cwd=BACKEND,
        capture_output=True,
        text=True,
        encoding="utf-8",
        errors="replace",
    )
    assert result.returncode == 0, f"Нарушена граница fincore:\n{result.stdout}\n{result.stderr}"
