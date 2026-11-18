"""Closed product-event contract. No free text, financial values or client clocks."""
from typing import Literal

from pydantic import BaseModel, ConfigDict, Field, model_validator

from .analysis.config import STEP_ACTIONS

CONSENT_VERSION = "2026-10-proto"
EventName = Literal[
    "signup", "consent_accepted", "checkup_started", "quick_done", "section_done",
    "report_viewed", "checkup_completed", "step_done", "step_dismissed",
    "step_action_done", "account_deleted",
]
RuleKey = Literal[
    "close_overdue", "stop_deficit", "first_cushion", "avalanche", "stress_fail",
    "goal_unrealistic", "cushion_target", "protection_check", "liquidity_first",
    "concentration", "direct_surplus",
]


class Props(BaseModel):
    model_config = ConfigDict(extra="forbid", strict=True)


class ConsentProps(Props):
    consent_version: Literal["2026-10-proto"]


class StartProps(Props):
    entry_question: Literal["mortgage", "debts", "resilience", "goal", "overview"]


class DurationProps(Props):
    duration_seconds: int = Field(ge=0)


class SectionProps(Props):
    section: Literal["incomes", "expenses", "liabilities", "savings", "assets", "investments", "pension", "insurance", "goals", "decision"]


class ReportProps(Props):
    final: bool
    precision: Literal["draft", "approximate", "refined"]


class StepProps(Props):
    rule_key: RuleKey


class ActionProps(StepProps):
    action: str

    @model_validator(mode="after")
    def known_action(self):
        if self.action not in {key for key, _ in STEP_ACTIONS.get(self.rule_key, [])}:
            raise ValueError("Unknown action for rule")
        return self


EVENT_PROPS = {
    "signup": Props, "consent_accepted": ConsentProps, "checkup_started": StartProps,
    "quick_done": DurationProps, "section_done": SectionProps, "report_viewed": ReportProps,
    "checkup_completed": DurationProps, "step_done": StepProps, "step_dismissed": StepProps,
    "step_action_done": ActionProps, "account_deleted": Props,
}


def event_props(name: str, props: dict) -> dict:
    if name not in EVENT_PROPS:
        raise ValueError("Unknown product event")
    return EVENT_PROPS[name].model_validate(props).model_dump()
