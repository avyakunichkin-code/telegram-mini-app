# Design-lab: Потребности персонажа (фаза 1)

**Статус:** готов к раундам · UX зафиксирован в [`docs/ux/CHARACTER_NEEDS_UX.md`](../../docs/ux/CHARACTER_NEEDS_UX.md)

Процесс: [`frontend-react/src/components/mqx/DESIGN_WORKFLOW.md`](../../frontend-react/src/components/mqx/DESIGN_WORKFLOW.md) · скилл `design-lab-mqx`.

## Раунды

| Папка | Приоритет | Варианты (план) | UX spec |
|-------|-----------|-----------------|---------|
| [`dashboard-needs-v5-round/`](dashboard-needs-v5-round/) | **★ prod** | v5 summary + footer | [`character-needs-dashboard.md`](../../docs/ux/screens/character-needs-dashboard.md) |
| [`dashboard-needs-v6-round/`](dashboard-needs-v6-round/) | **P0** · **на выбор** | v6-A glass / v6-B ring / v6-C strip | то же |
| [`dashboard-needs-round/`](dashboard-needs-round/) | архив | A–D compact/expand | то же |
| [`treat-self-round/`](treat-self-round/) | **P0** | A card+confirm, B sticky cost | [`character-needs-treat-self.md`](../../docs/ux/screens/character-needs-treat-self.md) |
| [`help-sheet-round/`](help-sheet-round/) | P1 | A accordion, B flat sections | [`character-needs-help.md`](../../docs/ux/screens/character-needs-help.md) |
| [`events-needs-chips-round/`](events-needs-chips-round/) | **P0** | A/B/C chips on choices | [`character-needs-events.md`](../../docs/ux/screens/character-needs-events.md) |
| [`needs-intro-banner-round/`](needs-intro-banner-round/) | P1 | post-onboarding intro | [`CHARACTER_NEEDS_UX.md`](../../docs/ux/CHARACTER_NEEDS_UX.md) § Onboarding |
| [`defeat-round/`](defeat-round/) | P1 | align with cash defeat | [`character-needs-period-defeat.md`](../../docs/ux/screens/character-needs-period-defeat.md) |

**Копирайт персонажей:** [`../game-templates/`](../game-templates/) — см. [`character-pick.md`](../../docs/ux/screens/character-pick.md).

**Портрет в Z-NEEDS (prod):** растровый аватар по `starter_template_key` — [`../game-templates/persona-portraits-round/`](../game-templates/persona-portraits-round/) (`PersonaPortrait` size `dash`). Lab v5 по-прежнему может показывать `student-mascot.png` до `sync-lab` из prod-ассетов.

## Тестовые данные (единые для всех раундов)

```json
{
  "needs": { "comfort": 72, "status": 41, "social": 28, "health": 65 },
  "needs_meta": { "thresholds": { "low": 40, "distressed": 30 } },
  "needs_zero_periods_streak": 1,
  "treat_self": {
    "available": true,
    "cooldown_periods_remaining": 0,
    "default_cost": 8400,
    "options": [{
      "id": "picnic_friends",
      "title": "Отгул: пикник с друзьями",
      "subtitle": "Отдых и общение",
      "cost": 8400,
      "needs_delta": { "social": 22, "health": 18, "comfort": 6, "status": 4 }
    }]
  }
}
```

## Запуск

```bash
cd design-lab/character-needs/dashboard-needs-v5-round
./sync-lab.sh
npx serve .
# или хаб: cd design-lab && npx serve .
```

## После утверждения

1. `MqxNeedsSummary`, `MqxNeedsBars`, … → `frontend-react/src/components/mqx/`
2. Секции в `#/dev/mqx`
3. `DashboardPremium` + `EventCard` — один PR за сценарий
