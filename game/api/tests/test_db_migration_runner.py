"""The canonical migration runner must preserve checkout paths containing spaces."""
from pathlib import Path
import os
import shutil
import subprocess

import pytest


def test_migrate_preserves_paths_with_spaces(tmp_path):
    bash = shutil.which("bash")
    if bash is None and Path("C:/Program Files/Git/bin/bash.exe").is_file():
        bash = "C:/Program Files/Git/bin/bash.exe"
    if bash is None:
        pytest.skip("bash required to exercise canonical db.sh")

    checkout = tmp_path / "checkout with spaces"
    scripts = checkout / "game/api" / "scripts"
    migrations = checkout / "game/api" / "migrations"
    stub_bin = checkout / "bin"
    for directory in (scripts, migrations, stub_bin):
        directory.mkdir(parents=True, exist_ok=True)
    source = Path(__file__).resolve().parents[1] / "scripts" / "db.sh"
    shutil.copyfile(source, scripts / "db.sh")
    expected = ["0000_schema_baseline.sql", "0051_transaction_liability_id.sql", "0052_transaction_event_instance_id.sql", "0053_name with spaces.sql"]
    for name in reversed(expected):
        (migrations / name).write_text("-- synthetic migration\n", encoding="utf-8")
    capture = checkout / "applied.txt"
    psql = stub_bin / "psql"
    psql.write_text("""#!/usr/bin/env bash
set -euo pipefail
while [[ $# -gt 0 ]]; do
  if [[ "$1" == '-f' ]]; then
    [[ -f "$2" ]] || { echo "missing migration file" >&2; exit 9; }
    printf '%s\\n' "${2##*/}" >> "$STUB_CAPTURE"
    exit 0
  fi
  shift
done
""", encoding="utf-8", newline="\n")
    psql.chmod(0o755)
    result = subprocess.run(
        [bash, "-c", 'stub_bin="$(cd "$1" && pwd)"; export PATH="$stub_bin:$PATH"; bash "$2" migrate',
         "migration-test", stub_bin.as_posix(), (scripts / "db.sh").as_posix()],
        env={**os.environ, "DATABASE_URL": "postgresql://synthetic@127.0.0.1/unused", "STUB_CAPTURE": capture.as_posix()},
        capture_output=True, text=True, timeout=30,
    )
    assert result.returncode == 0, result.stdout + result.stderr
    assert capture.read_text(encoding="utf-8").splitlines() == expected
