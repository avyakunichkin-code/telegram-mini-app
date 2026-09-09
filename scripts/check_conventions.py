#!/usr/bin/env python3
"""Гейт свода CONVENTIONS.md — полнота полей, якоря, ссылки C-*, отклонения, журнал C-Y."""

from __future__ import annotations

import datetime as dt
import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
CONVENTIONS = ROOT / "CONVENTIONS.md"
REVIEWS = ROOT / "docs" / "conventions" / "reviews.yaml"
WINDOW_DAYS = 90

HEADING_RE = re.compile(r"^## (C-[A-Z0-9]+) · (.+)$", re.M)
FIELD_LABELS = (
    "Ограничение",
    "Объект вердикта",
    "Вопрос ревью",
    "Нарушение выглядит так",
    "Покупаем",
    "Платим",
    "Порождает правила",
    "Соответствие",
    "Якорь",
)
TRIAL_RE = re.compile(r"Пробное \(до (\d{4}-\d{2}-\d{2})\)")
CID_REF_RE = re.compile(r"\bC-(?:X|Y|[0-9]+)\b")
RETIRED_RE = re.compile(
    r"## Снятые идентификаторы\n(.+?)(?=\n## |\Z)", re.S
)
DEV_TABLE_RE = re.compile(
    r"## Реестр осознанных отклонений\n\n\|[^\n]+\n\|[-| ]+\n((?:\|[^\n]+\n)+)"
)
CLOSED_OUTCOMES = frozenset({"accepted", "partial", "rejected", "withdrawn"})
TRACE_OUTCOMES = frozenset({"accepted", "partial"})
PLAYER_SCAN_DIRS = (
    ROOT / "data" / "events",
    ROOT / "frontend-react" / "src",
    ROOT / "landing" / "src",
)
PLAYER_SUFFIXES = {".yaml", ".yml", ".js", ".jsx", ".css", ".html"}
FORBIDDEN_PLAYER = (
    re.compile(r"микрозайм", re.I),
    re.compile(r"казино", re.I),
    re.compile(r"инвестируй в", re.I),
    re.compile(r"гарантированн\w*\s+доходно", re.I),
)
REVIEW_KEYS = (
    "id",
    "date",
    "subject",
    "human_decision",
    "disagreement",
    "alternative",
    "alternative_cost",
    "outcome",
    "decision",
    "repo_trace",
    "decision_changed",
)


def fail(errors: list[str]) -> int:
    for item in errors:
        print(f"FAIL: {item}", file=sys.stderr)
    print(f"{len(errors)} error(s)", file=sys.stderr)
    return 1


def parse_principles(text: str) -> list[tuple[str, str, str]]:
    matches = list(HEADING_RE.finditer(text))
    out: list[tuple[str, str, str]] = []
    for i, match in enumerate(matches):
        start = match.end()
        end = matches[i + 1].start() if i + 1 < len(matches) else text.find("\n## Реестр")
        if end < 0:
            end = len(text)
        out.append((match.group(1), match.group(2).strip(), text[start:end]))
    return out


def extract_paths(blob: str) -> list[str]:
    found: list[str] = []
    for raw in re.findall(r"`([^`]+)`", blob):
        found.append(raw.strip())
    for raw in re.findall(r"\(([^)]+\.(?:md|py|yaml|yml|mdc|js|jsx))\)", blob):
        found.append(raw.strip())
    return found


def resolve_anchor_token(token: str, errors: list[str], cid: str) -> None:
    if token.startswith("py -3 scripts/check_conventions.py"):
        if not (ROOT / "scripts" / "check_conventions.py").is_file():
            errors.append(f"{cid}: якорь scripts/check_conventions.py не найден")
        return
    if token.startswith("py -3 -m pytest"):
        pytest_files = re.findall(r"tests/[\w./-]+\.py", token)
        for rel in pytest_files:
            path = ROOT / "backend" / rel
            if not path.is_file():
                errors.append(f"{cid}: якорь-тест не найден: {path.relative_to(ROOT)}")
        return
    if "/" in token or token.endswith((".md", ".py", ".yaml", ".yml", ".mdc")):
        cleaned = token.split()[0].strip("`").rstrip("/")
        if cleaned.startswith("http"):
            return
        path = ROOT / cleaned
        if not path.exists():
            errors.append(f"{cid}: якорь-путь не существует: {cleaned}")
        return


def parse_reviews(text: str) -> list[dict[str, str]]:
    blocks = re.split(r"\n  - id:", text)
    rows: list[dict[str, str]] = []
    for i, block in enumerate(blocks):
        if i == 0:
            continue
        body = "id:" + block
        row: dict[str, str] = {}
        current: str | None = None
        folded: list[str] = []
        folding = False
        for line in body.splitlines():
            key_match = re.match(r"^    ([a-z_]+):\s*(.*)$", line)
            dash_id = re.match(r"^id:\s*(\S+)\s*$", line)
            if dash_id and "id" not in row:
                row["id"] = dash_id.group(1)
                current = "id"
                folding = False
                continue
            if key_match:
                if current and folding:
                    row[current] = " ".join(folded).strip()
                current = key_match.group(1)
                raw = key_match.group(2)
                if raw in (">-", ">") or raw.endswith("|"):
                    folding = True
                    folded = []
                else:
                    folding = False
                    row[current] = raw.strip().strip("'\"")
                continue
            if folding and current and (line.startswith("      ") or line.startswith("    ")):
                folded.append(line.strip())
        if current and folding:
            row[current] = " ".join(folded).strip()
        rows.append(row)
    return rows


def scan_player_copy(errors: list[str]) -> None:
    for directory in PLAYER_SCAN_DIRS:
        if not directory.is_dir():
            continue
        for path in directory.rglob("*"):
            if not path.is_file() or path.suffix.lower() not in PLAYER_SUFFIXES:
                continue
            try:
                text = path.read_text(encoding="utf-8")
            except OSError:
                continue
            rel = path.relative_to(ROOT).as_posix()
            for pattern in FORBIDDEN_PLAYER:
                if pattern.search(text):
                    errors.append(f"C-3: запрещённая формулировка в игровом контенте {rel}: /{pattern.pattern}/")


def collect_cid_refs() -> dict[str, set[str]]:
    found: dict[str, set[str]] = {}
    skip_parts = {
        ".git",
        "node_modules",
        "dist",
        "__pycache__",
        ".venv",
        "design-lab",
    }
    for path in ROOT.rglob("*"):
        if not path.is_file():
            continue
        if any(part in skip_parts for part in path.parts):
            continue
        if path.suffix.lower() not in {".md", ".mdc", ".py", ".yaml", ".yml", ".js", ".jsx"}:
            continue
        try:
            text = path.read_text(encoding="utf-8")
        except OSError:
            continue
        rel = path.relative_to(ROOT).as_posix()
        for match in CID_REF_RE.finditer(text):
            found.setdefault(match.group(0), set()).add(rel)
    return found


def check() -> int:
    errors: list[str] = []
    if not CONVENTIONS.is_file():
        return fail(["нет CONVENTIONS.md в корне репозитория"])
    text = CONVENTIONS.read_text(encoding="utf-8")
    principles = parse_principles(text)
    if len(principles) < 4:
        errors.append(f"ожидалось ≥4 действующих принципа, найдено {len(principles)}")

    required_ids = {"C-X", "C-Y"}
    active_ids = {cid for cid, _, _ in principles}
    missing_meta = required_ids - active_ids
    if missing_meta:
        errors.append(f"нет обязательных мета-принципов: {sorted(missing_meta)}")

    retired_section = RETIRED_RE.search(text)
    retired_ids = set()
    if retired_section:
        retired_ids = set(re.findall(r"\bC-[A-Z0-9]+\b", retired_section.group(1)))
    overlap = active_ids & retired_ids
    if overlap:
        errors.append(f"снятый id снова в заголовке: {sorted(overlap)}")

    today = dt.date.today()
    for cid, _name, body in principles:
        for label in FIELD_LABELS:
            if f"**{label}.**" not in body:
                errors.append(f"{cid}: нет поля «{label}»")
        trial = TRIAL_RE.search(body)
        if trial:
            deadline = dt.date.fromisoformat(trial.group(1))
            if deadline < today:
                errors.append(f"{cid}: просроченное Пробное (до {deadline.isoformat()})")
        anchor_match = re.search(r"\*\*Якорь\.\*\*(.+?)(?=\n---|\n## |\Z)", body, re.S)
        if anchor_match:
            for token in extract_paths(anchor_match.group(1)):
                resolve_anchor_token(token, errors, cid)

    doc_sys = ROOT / "docs" / "DOCUMENTATION_SYSTEM.md"
    if doc_sys.is_file():
        ds = doc_sys.read_text(encoding="utf-8")
        if "код + тесты" not in ds and "код + тесты" not in ds.replace("\xa0", " "):
            # both Cyrillic plus
            if "Поведение в production" not in ds:
                errors.append("C-1: в DOCUMENTATION_SYSTEM.md нет иерархии конфликта")
    else:
        errors.append("C-1: нет docs/DOCUMENTATION_SYSTEM.md")

    audits = ROOT / "docs" / "audits" / "README.md"
    if audits.is_file():
        if "не канон" not in audits.read_text(encoding="utf-8").lower():
            errors.append("C-1: docs/audits/README.md должен явно говорить, что аудит не канон")
    else:
        errors.append("C-1: нет docs/audits/README.md")

    catalog = ROOT / "data" / "events" / "mvp11" / "catalog.yaml"
    if not catalog.is_file():
        errors.append("C-4: нет data/events/mvp11/catalog.yaml")

    dev_table = DEV_TABLE_RE.search(text)
    if not dev_table:
        errors.append("нет таблицы реестра отклонений")
    else:
        for line in dev_table.group(1).strip().splitlines():
            cells = [c.strip() for c in line.strip().strip("|").split("|")]
            if len(cells) < 4:
                errors.append(f"отклонение: ожидалось 4 колонки: {line}")
                continue
            lift = cells[3]
            if not lift or lift in {"—", "-", "TODO"}:
                errors.append(f"отклонение без условия снятия: {cells[0]}")

    if not REVIEWS.is_file():
        errors.append("нет docs/conventions/reviews.yaml")
    else:
        reviews = parse_reviews(REVIEWS.read_text(encoding="utf-8"))
        cutoff = today - dt.timedelta(days=WINDOW_DAYS)
        in_window = 0
        changed = 0
        for row in reviews:
            rid = row.get("id") or "?"
            for key in ("id", "date", "subject", "human_decision", "outcome"):
                if not row.get(key):
                    errors.append(f"журнал {rid}: нет поля {key}")
            disagreement = (row.get("disagreement") or "").strip()
            alternative = (row.get("alternative") or "").strip()
            if disagreement and disagreement not in {"—", "-", "нет"} and not alternative:
                errors.append(f"журнал {rid}: возражение без alternative")
            outcome = (row.get("outcome") or "").strip()
            if outcome not in CLOSED_OUTCOMES | {"pending"}:
                errors.append(f"журнал {rid}: неизвестный outcome {outcome!r}")
            if outcome in CLOSED_OUTCOMES and not (row.get("decision") or "").strip():
                errors.append(f"журнал {rid}: закрытая запись без decision")
            if outcome in TRACE_OUTCOMES and not (row.get("repo_trace") or "").strip():
                errors.append(f"журнал {rid}: {outcome} без repo_trace")
            try:
                when = dt.date.fromisoformat(row.get("date", ""))
            except ValueError:
                errors.append(f"журнал {rid}: неверная дата")
                continue
            if when >= cutoff:
                in_window += 1
                flag = str(row.get("decision_changed", "")).strip().lower()
                if flag in {"true", "yes", "1"}:
                    changed += 1
        print(
            f"C-Y journal: {len(reviews)} total, {in_window} in {WINDOW_DAYS}d, "
            f"{changed} changed the decision"
        )

    scan_player_copy(errors)

    refs = collect_cid_refs()
    unknown = sorted(set(refs) - active_ids - retired_ids)
    # C-N leftover from templates
    unknown = [u for u in unknown if u not in {"C-N"}]
    if unknown:
        errors.append(f"ссылка на неизвестный принцип: {unknown}")
    for cid in sorted(active_ids):
        files = refs.get(cid, set())
        others = {f for f in files if f != "CONVENTIONS.md"}
        if not others:
            errors.append(f"{cid}: нет ссылки вне CONVENTIONS.md — свод оторван от работы")

    if errors:
        return fail(errors)
    print(f"OK: {len(principles)} principles, conventions gate passed")
    return 0


if __name__ == "__main__":
    sys.exit(check())
