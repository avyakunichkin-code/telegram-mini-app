"""SPL-204: расходы на жизнь по статьям — фильтр по сроку, ограничение снизу, категории."""

import pytest

from fincore.expenses import CategoryBurn, ExpenseCategory, monthly_burn
from fincore.household import ExpenseLine

CATEGORIES = {
    "food": ExpenseCategory(title="Еда"),
    "leisure": ExpenseCategory(title="Досуг", default_tier="discretionary"),
}


def _line(id_, category, amount, **kw) -> ExpenseLine:
    return ExpenseLine(id=id_, category_key=category, title=category, amount_monthly=amount, **kw)


def test_burn_sums_active_lines_and_extra():
    burn = monthly_burn(
        [
            _line(1, "food", 10_000.0),
            _line(2, "leisure", 2_000.0, expires_month_index=5),
            _line(3, "food", 3_000.0),
        ],
        month_index=4,
        extra=1_500.0,
        categories=CATEGORIES,
    )
    assert burn.lines_sum == 15_000.0
    assert burn.total == 16_500.0
    assert burn.extra == 1_500.0
    assert [line.id for line in burn.lines] == [1, 2, 3]
    assert burn.by_category == (
        CategoryBurn("food", "Еда", 13_000.0, "must"),
        CategoryBurn("leisure", "Досуг", 2_000.0, "discretionary"),
    )


def test_line_expires_in_its_month():
    lines = [_line(1, "leisure", 2_000.0, expires_month_index=5)]
    assert monthly_burn(lines, month_index=4).total == 2_000.0
    assert monthly_burn(lines, month_index=5).total == 0.0
    assert monthly_burn(lines, month_index=5).lines == ()


def test_negative_extra_is_clamped_at_zero():
    burn = monthly_burn([_line(1, "food", 5_000.0)], month_index=1, extra=-8_000.0)
    assert burn.total == 0.0
    assert burn.lines_sum == 5_000.0
    assert burn.extra == -8_000.0


def test_negative_line_counts_as_zero():
    burn = monthly_burn([_line(1, "food", -300.0), _line(2, "food", 1_000.0)], month_index=1)
    assert [line.amount_monthly for line in burn.lines] == [0.0, 1_000.0]
    assert burn.total == 1_000.0


def test_extra_without_lines_is_the_whole_burn():
    burn = monthly_burn([], month_index=1, extra=20_000.0)
    assert (burn.total, burn.lines_sum, burn.by_category) == (20_000.0, 0.0, ())


def test_unknown_category_falls_back_to_key_and_must():
    (cat,) = monthly_burn([_line(1, "pets", 700.0)], month_index=1, categories=CATEGORIES).by_category
    assert (cat.title, cat.tier) == ("pets", "must")


def test_rounding_lines_before_sum_categories_after():
    burn = monthly_burn(
        [_line(1, "food", 100.004), _line(2, "food", 100.004)],
        month_index=1,
    )
    assert [line.amount_monthly for line in burn.lines] == [100.0, 100.0]
    assert burn.lines_sum == 200.0
    assert burn.by_category[0].amount == pytest.approx(200.01)


def test_categories_sorted_by_amount_ties_keep_first_seen():
    burn = monthly_burn(
        [_line(1, "a", 100.0), _line(2, "b", 300.0), _line(3, "c", 100.0)],
        month_index=1,
    )
    assert [c.category_key for c in burn.by_category] == ["b", "a", "c"]


def test_total_rounded_after_clamp_with_fractional_extra():
    burn = monthly_burn([_line(1, "food", 1_000.0)], month_index=1, extra=0.005)
    assert burn.total == round(1_000.005, 2)
    assert monthly_burn([], month_index=1, extra=-0.004).total == 0.0
