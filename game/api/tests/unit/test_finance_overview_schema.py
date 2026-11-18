"""Finance overview must resolve guidance in the API JSON schema on Python 3.13+."""

from app.schemas import FinanceOverview, GameBootstrapResponse


def test_overview_and_bootstrap_resolve_guidance_schema():
    for model in (FinanceOverview, GameBootstrapResponse):
        schema = model.model_json_schema()
        overview = schema if model is FinanceOverview else schema["$defs"]["FinanceOverview"]
        assert {"$ref": "#/$defs/GuidanceOverview"} in overview["properties"]["guidance"]["anyOf"]
        assert "show_curriculum" in schema["$defs"]["GuidanceOverview"]["properties"]
