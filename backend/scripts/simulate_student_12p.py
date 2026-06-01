#!/usr/bin/env python3
"""
12-period balance bot (wrapper around balance_simulate.py).

Usage (from backend/):
  python scripts/simulate_student_12p.py
"""

from __future__ import annotations

import sys
from pathlib import Path

SCRIPTS = Path(__file__).resolve().parent
BACKEND = SCRIPTS.parent
for p in (str(BACKEND), str(SCRIPTS)):
    if p not in sys.path:
        sys.path.insert(0, p)

from balance_simulate import format_report_markdown, run_balance_simulation  # noqa: E402


def main() -> int:
    report = run_balance_simulation(
        template_key="mq_game_basic_v1",
        periods=12,
        policy="tutorial",
        profile_name="Sim Student",
    )
    print(format_report_markdown(report))
    s = report["summary"]
    print("\n## Итог после прогона\n")
    print(f"- **Периодов закрыто:** {s['periods_closed']}")
    print(f"- **cash:** {s['cash_end']:,.0f} | **safety:** {s['safety_end']:,.0f}")
    print(f"- **win_reached:** {s['win_reached']} | **goals_met:** {s['goals_met']}/{s['goals_enabled']}")
    print(f"- **defeated:** {s['defeated']}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
