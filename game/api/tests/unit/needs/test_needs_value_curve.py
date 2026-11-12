"""CS-7: кривая цены балла (SPEC_needs-set-point §1)."""

import pytest

from app.needs.value_curve import cost_for_points, needs_points

STUDENT_SALARY = 62_500


@pytest.mark.parametrize(
    ("cost", "expected"),
    [
        (10, 2.9),
        (300, 8.1),
        (2_500, 15.2),
        (5_000, 18.7),
        (1_200_000, 97.1),
    ],
)
def test_needs_points_anchors_student(cost, expected):
    assert needs_points(cost, STUDENT_SALARY) == pytest.approx(expected, abs=0.1)


def test_needs_points_concave_price_per_point_grows():
    costs = [10, 300, 5_000, 62_500, 1_200_000, 3_500_000]
    rub_per_point = [c / needs_points(c, STUDENT_SALARY) for c in costs]
    assert rub_per_point == sorted(rub_per_point)
    points = [needs_points(c, STUDENT_SALARY) for c in costs]
    assert points == sorted(points)


def test_needs_points_scale_invariant_by_salary():
    # Та же доля зарплаты — те же баллы у любой персоны.
    assert needs_points(6_250, 62_500) == pytest.approx(needs_points(20_000, 200_000))
    # Одна и та же сумма даёт богатому меньше.
    assert needs_points(300, 200_000) < needs_points(300, 62_500)


@pytest.mark.parametrize(("cost", "salary"), [(0, 62_500), (-100, 62_500), (300, 0), (float("nan"), 62_500)])
def test_needs_points_degenerate_inputs_zero(cost, salary):
    assert needs_points(cost, salary) == 0.0


def test_cost_for_points_inverse():
    for cost in (300, 5_000, 1_200_000):
        pts = needs_points(cost, STUDENT_SALARY)
        assert cost_for_points(pts, STUDENT_SALARY) == pytest.approx(cost, rel=1e-9)
