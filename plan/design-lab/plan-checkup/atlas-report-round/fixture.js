window.ATLAS_FIXTURE = {
  "current": {
    "checkup_id": "demo-2026-11",
    "final": true,
    "as_of": "2026-11",
    "precision": "approximate",
    "precision_share": 0.783,
    "rules_version": 1,
    "fincore_version": "0.1.0",
    "entry_answer": {
      "question": "Как у нас дела в целом?",
      "verdict": "edge",
      "text": "Зелёных областей — 3, жёлтых — 1, красных — 0. Начните с шагов ниже.",
      "numbers": {
        "green": 3,
        "yellow": 1,
        "red": 0
      }
    },
    "areas": [
      {
        "key": "budget",
        "title": "Бюджет",
        "light": "green",
        "metrics": {
          "income": 180000.0,
          "outflow": 135000.0,
          "free_cashflow": 45000.0,
          "savings_rate": 0.25
        }
      },
      {
        "key": "debts",
        "title": "Долги",
        "light": "green",
        "metrics": {
          "dti_percent": 16.666666666666664,
          "total_debt": 300000.0,
          "overdue": 0.0,
          "payments": 30000.0
        }
      },
      {
        "key": "cushion",
        "title": "Подушка и цели",
        "light": "yellow",
        "metrics": {
          "cushion": 270000.0,
          "months": 2.0,
          "target_months": 3.0,
          "goals_realistic": true
        }
      },
      {
        "key": "protection",
        "title": "Инвестиции и защита",
        "light": "green",
        "metrics": {
          "investments": 0
        },
        "flags": []
      }
    ],
    "metrics_base": {
      "income": 180000.0,
      "outflow": 135000.0,
      "liability_payments": 30000.0,
      "dti_percent": 16.666666666666664,
      "safety_fund_months": 2.0,
      "total_debt": 300000.0,
      "net_worth": -30000.0
    },
    "metrics_pessimistic": {
      "income": 170000.0,
      "outflow": 140000.0,
      "liability_payments": 30000.0,
      "dti_percent": 17.647058823529413,
      "safety_fund_months": 1.9285714285714286,
      "total_debt": 300000.0,
      "net_worth": -30000.0
    },
    "net_worth": -30000.0,
    "free_cashflow": 45000.0,
    "forecast": {
      "base": [
        {
          "month": "2026-11",
          "liquid": 315000.0
        },
        {
          "month": "2026-12",
          "liquid": 360000.0
        },
        {
          "month": "2027-01",
          "liquid": 405000.0
        },
        {
          "month": "2027-02",
          "liquid": 450000.0
        },
        {
          "month": "2027-03",
          "liquid": 495000.0
        },
        {
          "month": "2027-04",
          "liquid": 540000.0
        },
        {
          "month": "2027-05",
          "liquid": 585000.0
        },
        {
          "month": "2027-06",
          "liquid": 640000.0
        },
        {
          "month": "2027-07",
          "liquid": 695000.0
        },
        {
          "month": "2027-08",
          "liquid": 750000.0
        },
        {
          "month": "2027-09",
          "liquid": 805000.0
        },
        {
          "month": "2027-10",
          "liquid": 860000.0
        }
      ],
      "pessimistic": [
        {
          "month": "2026-11",
          "liquid": 300000.0
        },
        {
          "month": "2026-12",
          "liquid": 330000.0
        },
        {
          "month": "2027-01",
          "liquid": 360000.0
        },
        {
          "month": "2027-02",
          "liquid": 390000.0
        },
        {
          "month": "2027-03",
          "liquid": 420000.0
        },
        {
          "month": "2027-04",
          "liquid": 450000.0
        },
        {
          "month": "2027-05",
          "liquid": 480000.0
        },
        {
          "month": "2027-06",
          "liquid": 520000.0
        },
        {
          "month": "2027-07",
          "liquid": 560000.0
        },
        {
          "month": "2027-08",
          "liquid": 600000.0
        },
        {
          "month": "2027-09",
          "liquid": 640000.0
        },
        {
          "month": "2027-10",
          "liquid": 680000.0
        }
      ],
      "base_months_until_negative": null,
      "pessimistic_months_until_negative": null
    },
    "scenarios": [
      {
        "id": "S1",
        "title": "Потеря крупнейшего дохода",
        "description": "Доход «Я» пропадает на 6 мес.",
        "verdict": "fail",
        "months_until_negative": 4,
        "min_liquid": -180000.0,
        "series": [
          {
            "month": "2026-11",
            "liquid": 195000.0
          },
          {
            "month": "2026-12",
            "liquid": 120000.0
          },
          {
            "month": "2027-01",
            "liquid": 45000.0
          },
          {
            "month": "2027-02",
            "liquid": -30000.0
          },
          {
            "month": "2027-03",
            "liquid": -105000.0
          },
          {
            "month": "2027-04",
            "liquid": -180000.0
          },
          {
            "month": "2027-05",
            "liquid": -135000.0
          },
          {
            "month": "2027-06",
            "liquid": -80000.0
          },
          {
            "month": "2027-07",
            "liquid": -25000.0
          },
          {
            "month": "2027-08",
            "liquid": 30000.0
          },
          {
            "month": "2027-09",
            "liquid": 85000.0
          },
          {
            "month": "2027-10",
            "liquid": 140000.0
          }
        ]
      },
      {
        "id": "S2",
        "title": "Рождение ребёнка",
        "description": "+25 000 ₽/мес расходов, доход одного взрослого −60 % на год",
        "verdict": "ok",
        "months_until_negative": null,
        "min_liquid": 128000.0,
        "series": [
          {
            "month": "2026-11",
            "liquid": 254000.0
          },
          {
            "month": "2026-12",
            "liquid": 238000.0
          },
          {
            "month": "2027-01",
            "liquid": 222000.0
          },
          {
            "month": "2027-02",
            "liquid": 206000.0
          },
          {
            "month": "2027-03",
            "liquid": 190000.0
          },
          {
            "month": "2027-04",
            "liquid": 174000.0
          },
          {
            "month": "2027-05",
            "liquid": 158000.0
          },
          {
            "month": "2027-06",
            "liquid": 152000.0
          },
          {
            "month": "2027-07",
            "liquid": 146000.0
          },
          {
            "month": "2027-08",
            "liquid": 140000.0
          },
          {
            "month": "2027-09",
            "liquid": 134000.0
          },
          {
            "month": "2027-10",
            "liquid": 128000.0
          }
        ]
      },
      {
        "id": "S3",
        "title": "Рост цен",
        "description": "Расходы на жизнь +10 %, доходы те же",
        "verdict": "ok",
        "months_until_negative": null,
        "min_liquid": 304500.0,
        "series": [
          {
            "month": "2026-11",
            "liquid": 304500.0
          },
          {
            "month": "2026-12",
            "liquid": 339000.0
          },
          {
            "month": "2027-01",
            "liquid": 373500.0
          },
          {
            "month": "2027-02",
            "liquid": 408000.0
          },
          {
            "month": "2027-03",
            "liquid": 442500.0
          },
          {
            "month": "2027-04",
            "liquid": 477000.0
          },
          {
            "month": "2027-05",
            "liquid": 511500.0
          },
          {
            "month": "2027-06",
            "liquid": 556000.0
          },
          {
            "month": "2027-07",
            "liquid": 600500.0
          },
          {
            "month": "2027-08",
            "liquid": 645000.0
          },
          {
            "month": "2027-09",
            "liquid": 689500.0
          },
          {
            "month": "2027-10",
            "liquid": 734000.0
          }
        ]
      },
      {
        "id": "S4",
        "title": "Двойной удар",
        "description": "Потеря крупнейшего дохода и рост цен одновременно",
        "verdict": "fail",
        "months_until_negative": 4,
        "min_liquid": -243000.0,
        "series": [
          {
            "month": "2026-11",
            "liquid": 184500.0
          },
          {
            "month": "2026-12",
            "liquid": 99000.0
          },
          {
            "month": "2027-01",
            "liquid": 13500.0
          },
          {
            "month": "2027-02",
            "liquid": -72000.0
          },
          {
            "month": "2027-03",
            "liquid": -157500.0
          },
          {
            "month": "2027-04",
            "liquid": -243000.0
          },
          {
            "month": "2027-05",
            "liquid": -208500.0
          },
          {
            "month": "2027-06",
            "liquid": -174000.0
          },
          {
            "month": "2027-07",
            "liquid": -129500.0
          },
          {
            "month": "2027-08",
            "liquid": -85000.0
          },
          {
            "month": "2027-09",
            "liquid": -40500.0
          },
          {
            "month": "2027-10",
            "liquid": 4000.0
          }
        ]
      }
    ],
    "debt_strategy": {
      "extra": 11250.0,
      "current": {
        "months": 13,
        "payoff_month": "2027-12",
        "total_interest": 21534.14,
        "order": [
          "Кредитная карта",
          "Потребительский кредит"
        ]
      },
      "avalanche": {
        "months": 8,
        "payoff_month": "2027-07",
        "total_interest": 14345.39,
        "order": [
          "Кредитная карта",
          "Потребительский кредит"
        ]
      },
      "snowball": {
        "months": 8,
        "payoff_month": "2027-07",
        "total_interest": 14345.39,
        "order": [
          "Кредитная карта",
          "Потребительский кредит"
        ]
      },
      "saved_by_avalanche": 7188.75,
      "high_rate": [
        {
          "title": "Кредитная карта",
          "rate": 24.0
        }
      ]
    },
    "goals": [],
    "steps": [
      {
        "rule_key": "avalanche",
        "rank": 1,
        "title": "Гасить досрочно «Кредитная карта» (24 %)",
        "why": "Если добавлять 11 250 ₽/мес к самому дорогому долгу, переплата снизится на 7 189 ₽, кредиты закроются на 5 мес. раньше.",
        "numbers": {
          "extra": 11250.0,
          "saved": 7188.75,
          "sooner_months": 5
        },
        "status": "suggested",
        "actions": [
          {
            "key": "terms",
            "title": "Уточнить условия досрочного погашения",
            "done": false
          },
          {
            "key": "pay",
            "title": "Самостоятельно внести дополнительный платёж",
            "done": false
          },
          {
            "key": "verify",
            "title": "Проверить новый остаток долга",
            "done": false
          }
        ]
      },
      {
        "rule_key": "stress_fail",
        "rank": 2,
        "title": "Потеря крупнейшего дохода: укрепить запас",
        "why": "В этом сценарии деньги кончатся через 4 мес. Подушка 405 000 ₽ даст время перестроиться.",
        "numbers": {
          "scenario": "S1",
          "months_until_negative": 4,
          "target": 405000.0
        },
        "status": "suggested",
        "actions": [
          {
            "key": "review",
            "title": "Посмотреть, когда в сценарии заканчиваются деньги",
            "done": false
          },
          {
            "key": "plan",
            "title": "Определить, как укрепить запас",
            "done": false
          },
          {
            "key": "start",
            "title": "Выполнить первое действие для увеличения запаса",
            "done": false
          }
        ]
      },
      {
        "rule_key": "cushion_target",
        "rank": 3,
        "title": "Довести подушку до 405 000 ₽",
        "why": "Сейчас 2.0 мес. из 3. По 22 500 ₽/мес — за 6 мес.",
        "numbers": {
          "target": 405000.0,
          "monthly": 22500.0,
          "months": 6
        },
        "status": "suggested",
        "actions": [
          {
            "key": "choose_account",
            "title": "Выбрать отдельный счёт для резерва",
            "done": false
          },
          {
            "key": "transfer",
            "title": "Самостоятельно внести месячный взнос",
            "done": false
          },
          {
            "key": "verify",
            "title": "Проверить, что деньги зачислены",
            "done": false
          }
        ]
      }
    ],
    "disclaimer": "Расчёт информационный, на данных, которые вы ввели. Это не индивидуальная инвестиционная рекомендация и не предложение финансовых продуктов."
  },
  "history": [
    {
      "checkup_id": "demo-2026-09",
      "final": true,
      "as_of": "2026-09",
      "precision": "approximate",
      "precision_share": 0.745,
      "rules_version": 1,
      "fincore_version": "0.1.0",
      "entry_answer": {
        "question": "Как у нас дела в целом?",
        "verdict": "edge",
        "text": "Зелёных областей — 3, жёлтых — 1, красных — 0. Начните с шагов ниже.",
        "numbers": {
          "green": 3,
          "yellow": 1,
          "red": 0
        }
      },
      "areas": [
        {
          "key": "budget",
          "title": "Бюджет",
          "light": "green",
          "metrics": {
            "income": 180000.0,
            "outflow": 135000.0,
            "free_cashflow": 45000.0,
            "savings_rate": 0.25
          }
        },
        {
          "key": "debts",
          "title": "Долги",
          "light": "green",
          "metrics": {
            "dti_percent": 16.666666666666664,
            "total_debt": 351764.69,
            "overdue": 0.0,
            "payments": 30000.0
          }
        },
        {
          "key": "cushion",
          "title": "Подушка и цели",
          "light": "yellow",
          "metrics": {
            "cushion": 180000.0,
            "months": 1.3333333333333333,
            "target_months": 3.0,
            "goals_realistic": true
          }
        },
        {
          "key": "protection",
          "title": "Инвестиции и защита",
          "light": "green",
          "metrics": {
            "investments": 0
          },
          "flags": []
        }
      ],
      "metrics_base": {
        "income": 180000.0,
        "outflow": 135000.0,
        "liability_payments": 30000.0,
        "dti_percent": 16.666666666666664,
        "safety_fund_months": 1.3333333333333333,
        "total_debt": 351764.69,
        "net_worth": -171764.69
      },
      "metrics_pessimistic": {
        "income": 170000.0,
        "outflow": 140000.0,
        "liability_payments": 30000.0,
        "dti_percent": 17.647058823529413,
        "safety_fund_months": 1.2857142857142858,
        "total_debt": 351764.69,
        "net_worth": -171764.69
      },
      "net_worth": -171764.69,
      "free_cashflow": 45000.0,
      "forecast": {
        "base": [
          {
            "month": "2026-09",
            "liquid": 225000.0
          },
          {
            "month": "2026-10",
            "liquid": 270000.0
          },
          {
            "month": "2026-11",
            "liquid": 315000.0
          },
          {
            "month": "2026-12",
            "liquid": 360000.0
          },
          {
            "month": "2027-01",
            "liquid": 405000.0
          },
          {
            "month": "2027-02",
            "liquid": 450000.0
          },
          {
            "month": "2027-03",
            "liquid": 495000.0
          },
          {
            "month": "2027-04",
            "liquid": 540000.0
          },
          {
            "month": "2027-05",
            "liquid": 585000.0
          },
          {
            "month": "2027-06",
            "liquid": 640000.0
          },
          {
            "month": "2027-07",
            "liquid": 695000.0
          },
          {
            "month": "2027-08",
            "liquid": 750000.0
          }
        ],
        "pessimistic": [
          {
            "month": "2026-09",
            "liquid": 210000.0
          },
          {
            "month": "2026-10",
            "liquid": 240000.0
          },
          {
            "month": "2026-11",
            "liquid": 270000.0
          },
          {
            "month": "2026-12",
            "liquid": 300000.0
          },
          {
            "month": "2027-01",
            "liquid": 330000.0
          },
          {
            "month": "2027-02",
            "liquid": 360000.0
          },
          {
            "month": "2027-03",
            "liquid": 390000.0
          },
          {
            "month": "2027-04",
            "liquid": 420000.0
          },
          {
            "month": "2027-05",
            "liquid": 450000.0
          },
          {
            "month": "2027-06",
            "liquid": 490000.0
          },
          {
            "month": "2027-07",
            "liquid": 530000.0
          },
          {
            "month": "2027-08",
            "liquid": 570000.0
          }
        ],
        "base_months_until_negative": null,
        "pessimistic_months_until_negative": null
      },
      "scenarios": [
        {
          "id": "S1",
          "title": "Потеря крупнейшего дохода",
          "description": "Доход «Я» пропадает на 6 мес.",
          "verdict": "fail",
          "months_until_negative": 3,
          "min_liquid": -270000.0,
          "series": [
            {
              "month": "2026-09",
              "liquid": 105000.0
            },
            {
              "month": "2026-10",
              "liquid": 30000.0
            },
            {
              "month": "2026-11",
              "liquid": -45000.0
            },
            {
              "month": "2026-12",
              "liquid": -120000.0
            },
            {
              "month": "2027-01",
              "liquid": -195000.0
            },
            {
              "month": "2027-02",
              "liquid": -270000.0
            },
            {
              "month": "2027-03",
              "liquid": -225000.0
            },
            {
              "month": "2027-04",
              "liquid": -180000.0
            },
            {
              "month": "2027-05",
              "liquid": -135000.0
            },
            {
              "month": "2027-06",
              "liquid": -80000.0
            },
            {
              "month": "2027-07",
              "liquid": -25000.0
            },
            {
              "month": "2027-08",
              "liquid": 30000.0
            }
          ]
        },
        {
          "id": "S2",
          "title": "Рождение ребёнка",
          "description": "+25 000 ₽/мес расходов, доход одного взрослого −60 % на год",
          "verdict": "ok",
          "months_until_negative": null,
          "min_liquid": 18000.0,
          "series": [
            {
              "month": "2026-09",
              "liquid": 164000.0
            },
            {
              "month": "2026-10",
              "liquid": 148000.0
            },
            {
              "month": "2026-11",
              "liquid": 132000.0
            },
            {
              "month": "2026-12",
              "liquid": 116000.0
            },
            {
              "month": "2027-01",
              "liquid": 100000.0
            },
            {
              "month": "2027-02",
              "liquid": 84000.0
            },
            {
              "month": "2027-03",
              "liquid": 68000.0
            },
            {
              "month": "2027-04",
              "liquid": 52000.0
            },
            {
              "month": "2027-05",
              "liquid": 36000.0
            },
            {
              "month": "2027-06",
              "liquid": 30000.0
            },
            {
              "month": "2027-07",
              "liquid": 24000.0
            },
            {
              "month": "2027-08",
              "liquid": 18000.0
            }
          ]
        },
        {
          "id": "S3",
          "title": "Рост цен",
          "description": "Расходы на жизнь +10 %, доходы те же",
          "verdict": "ok",
          "months_until_negative": null,
          "min_liquid": 214500.0,
          "series": [
            {
              "month": "2026-09",
              "liquid": 214500.0
            },
            {
              "month": "2026-10",
              "liquid": 249000.0
            },
            {
              "month": "2026-11",
              "liquid": 283500.0
            },
            {
              "month": "2026-12",
              "liquid": 318000.0
            },
            {
              "month": "2027-01",
              "liquid": 352500.0
            },
            {
              "month": "2027-02",
              "liquid": 387000.0
            },
            {
              "month": "2027-03",
              "liquid": 421500.0
            },
            {
              "month": "2027-04",
              "liquid": 456000.0
            },
            {
              "month": "2027-05",
              "liquid": 490500.0
            },
            {
              "month": "2027-06",
              "liquid": 535000.0
            },
            {
              "month": "2027-07",
              "liquid": 579500.0
            },
            {
              "month": "2027-08",
              "liquid": 624000.0
            }
          ]
        },
        {
          "id": "S4",
          "title": "Двойной удар",
          "description": "Потеря крупнейшего дохода и рост цен одновременно",
          "verdict": "fail",
          "months_until_negative": 3,
          "min_liquid": -333000.0,
          "series": [
            {
              "month": "2026-09",
              "liquid": 94500.0
            },
            {
              "month": "2026-10",
              "liquid": 9000.0
            },
            {
              "month": "2026-11",
              "liquid": -76500.0
            },
            {
              "month": "2026-12",
              "liquid": -162000.0
            },
            {
              "month": "2027-01",
              "liquid": -247500.0
            },
            {
              "month": "2027-02",
              "liquid": -333000.0
            },
            {
              "month": "2027-03",
              "liquid": -298500.0
            },
            {
              "month": "2027-04",
              "liquid": -264000.0
            },
            {
              "month": "2027-05",
              "liquid": -229500.0
            },
            {
              "month": "2027-06",
              "liquid": -185000.0
            },
            {
              "month": "2027-07",
              "liquid": -140500.0
            },
            {
              "month": "2027-08",
              "liquid": -96000.0
            }
          ]
        }
      ],
      "debt_strategy": {
        "extra": 11250.0,
        "current": {
          "months": 15,
          "payoff_month": "2027-12",
          "total_interest": 29769.45,
          "order": [
            "Кредитная карта",
            "Потребительский кредит"
          ]
        },
        "avalanche": {
          "months": 10,
          "payoff_month": "2027-07",
          "total_interest": 19778.16,
          "order": [
            "Кредитная карта",
            "Потребительский кредит"
          ]
        },
        "snowball": {
          "months": 10,
          "payoff_month": "2027-07",
          "total_interest": 19778.16,
          "order": [
            "Кредитная карта",
            "Потребительский кредит"
          ]
        },
        "saved_by_avalanche": 9991.29,
        "high_rate": [
          {
            "title": "Кредитная карта",
            "rate": 24.0
          }
        ]
      },
      "goals": [],
      "steps": [
        {
          "rule_key": "avalanche",
          "rank": 1,
          "title": "Гасить досрочно «Кредитная карта» (24 %)",
          "why": "Если добавлять 11 250 ₽/мес к самому дорогому долгу, переплата снизится на 9 991 ₽, кредиты закроются на 5 мес. раньше.",
          "numbers": {
            "extra": 11250.0,
            "saved": 9991.29,
            "sooner_months": 5
          },
          "status": "suggested",
          "actions": [
            {
              "key": "terms",
              "title": "Уточнить условия досрочного погашения",
              "done": false
            },
            {
              "key": "pay",
              "title": "Самостоятельно внести дополнительный платёж",
              "done": false
            },
            {
              "key": "verify",
              "title": "Проверить новый остаток долга",
              "done": false
            }
          ]
        },
        {
          "rule_key": "stress_fail",
          "rank": 2,
          "title": "Потеря крупнейшего дохода: укрепить запас",
          "why": "В этом сценарии деньги кончатся через 3 мес. Подушка 405 000 ₽ даст время перестроиться.",
          "numbers": {
            "scenario": "S1",
            "months_until_negative": 3,
            "target": 405000.0
          },
          "status": "suggested",
          "actions": [
            {
              "key": "review",
              "title": "Посмотреть, когда в сценарии заканчиваются деньги",
              "done": false
            },
            {
              "key": "plan",
              "title": "Определить, как укрепить запас",
              "done": false
            },
            {
              "key": "start",
              "title": "Выполнить первое действие для увеличения запаса",
              "done": false
            }
          ]
        },
        {
          "rule_key": "cushion_target",
          "rank": 3,
          "title": "Довести подушку до 405 000 ₽",
          "why": "Сейчас 1.3 мес. из 3. По 22 500 ₽/мес — за 10 мес.",
          "numbers": {
            "target": 405000.0,
            "monthly": 22500.0,
            "months": 10
          },
          "status": "suggested",
          "actions": [
            {
              "key": "choose_account",
              "title": "Выбрать отдельный счёт для резерва",
              "done": false
            },
            {
              "key": "transfer",
              "title": "Самостоятельно внести месячный взнос",
              "done": false
            },
            {
              "key": "verify",
              "title": "Проверить, что деньги зачислены",
              "done": false
            }
          ]
        }
      ],
      "disclaimer": "Расчёт информационный, на данных, которые вы ввели. Это не индивидуальная инвестиционная рекомендация и не предложение финансовых продуктов."
    },
    {
      "checkup_id": "demo-2026-10",
      "final": true,
      "as_of": "2026-10",
      "precision": "approximate",
      "precision_share": 0.766,
      "rules_version": 1,
      "fincore_version": "0.1.0",
      "entry_answer": {
        "question": "Как у нас дела в целом?",
        "verdict": "edge",
        "text": "Зелёных областей — 3, жёлтых — 1, красных — 0. Начните с шагов ниже.",
        "numbers": {
          "green": 3,
          "yellow": 1,
          "red": 0
        }
      },
      "areas": [
        {
          "key": "budget",
          "title": "Бюджет",
          "light": "green",
          "metrics": {
            "income": 180000.0,
            "outflow": 135000.0,
            "free_cashflow": 45000.0,
            "savings_rate": 0.25
          }
        },
        {
          "key": "debts",
          "title": "Долги",
          "light": "green",
          "metrics": {
            "dti_percent": 16.666666666666664,
            "total_debt": 326053.19,
            "overdue": 0.0,
            "payments": 30000.0
          }
        },
        {
          "key": "cushion",
          "title": "Подушка и цели",
          "light": "yellow",
          "metrics": {
            "cushion": 225000.0,
            "months": 1.6666666666666667,
            "target_months": 3.0,
            "goals_realistic": true
          }
        },
        {
          "key": "protection",
          "title": "Инвестиции и защита",
          "light": "green",
          "metrics": {
            "investments": 0
          },
          "flags": []
        }
      ],
      "metrics_base": {
        "income": 180000.0,
        "outflow": 135000.0,
        "liability_payments": 30000.0,
        "dti_percent": 16.666666666666664,
        "safety_fund_months": 1.6666666666666667,
        "total_debt": 326053.19,
        "net_worth": -101053.19
      },
      "metrics_pessimistic": {
        "income": 170000.0,
        "outflow": 140000.0,
        "liability_payments": 30000.0,
        "dti_percent": 17.647058823529413,
        "safety_fund_months": 1.6071428571428572,
        "total_debt": 326053.19,
        "net_worth": -101053.19
      },
      "net_worth": -101053.19,
      "free_cashflow": 45000.0,
      "forecast": {
        "base": [
          {
            "month": "2026-10",
            "liquid": 270000.0
          },
          {
            "month": "2026-11",
            "liquid": 315000.0
          },
          {
            "month": "2026-12",
            "liquid": 360000.0
          },
          {
            "month": "2027-01",
            "liquid": 405000.0
          },
          {
            "month": "2027-02",
            "liquid": 450000.0
          },
          {
            "month": "2027-03",
            "liquid": 495000.0
          },
          {
            "month": "2027-04",
            "liquid": 540000.0
          },
          {
            "month": "2027-05",
            "liquid": 585000.0
          },
          {
            "month": "2027-06",
            "liquid": 640000.0
          },
          {
            "month": "2027-07",
            "liquid": 695000.0
          },
          {
            "month": "2027-08",
            "liquid": 750000.0
          },
          {
            "month": "2027-09",
            "liquid": 805000.0
          }
        ],
        "pessimistic": [
          {
            "month": "2026-10",
            "liquid": 255000.0
          },
          {
            "month": "2026-11",
            "liquid": 285000.0
          },
          {
            "month": "2026-12",
            "liquid": 315000.0
          },
          {
            "month": "2027-01",
            "liquid": 345000.0
          },
          {
            "month": "2027-02",
            "liquid": 375000.0
          },
          {
            "month": "2027-03",
            "liquid": 405000.0
          },
          {
            "month": "2027-04",
            "liquid": 435000.0
          },
          {
            "month": "2027-05",
            "liquid": 465000.0
          },
          {
            "month": "2027-06",
            "liquid": 505000.0
          },
          {
            "month": "2027-07",
            "liquid": 545000.0
          },
          {
            "month": "2027-08",
            "liquid": 585000.0
          },
          {
            "month": "2027-09",
            "liquid": 625000.0
          }
        ],
        "base_months_until_negative": null,
        "pessimistic_months_until_negative": null
      },
      "scenarios": [
        {
          "id": "S1",
          "title": "Потеря крупнейшего дохода",
          "description": "Доход «Я» пропадает на 6 мес.",
          "verdict": "fail",
          "months_until_negative": 4,
          "min_liquid": -225000.0,
          "series": [
            {
              "month": "2026-10",
              "liquid": 150000.0
            },
            {
              "month": "2026-11",
              "liquid": 75000.0
            },
            {
              "month": "2026-12",
              "liquid": 0.0
            },
            {
              "month": "2027-01",
              "liquid": -75000.0
            },
            {
              "month": "2027-02",
              "liquid": -150000.0
            },
            {
              "month": "2027-03",
              "liquid": -225000.0
            },
            {
              "month": "2027-04",
              "liquid": -180000.0
            },
            {
              "month": "2027-05",
              "liquid": -135000.0
            },
            {
              "month": "2027-06",
              "liquid": -80000.0
            },
            {
              "month": "2027-07",
              "liquid": -25000.0
            },
            {
              "month": "2027-08",
              "liquid": 30000.0
            },
            {
              "month": "2027-09",
              "liquid": 85000.0
            }
          ]
        },
        {
          "id": "S2",
          "title": "Рождение ребёнка",
          "description": "+25 000 ₽/мес расходов, доход одного взрослого −60 % на год",
          "verdict": "ok",
          "months_until_negative": null,
          "min_liquid": 73000.0,
          "series": [
            {
              "month": "2026-10",
              "liquid": 209000.0
            },
            {
              "month": "2026-11",
              "liquid": 193000.0
            },
            {
              "month": "2026-12",
              "liquid": 177000.0
            },
            {
              "month": "2027-01",
              "liquid": 161000.0
            },
            {
              "month": "2027-02",
              "liquid": 145000.0
            },
            {
              "month": "2027-03",
              "liquid": 129000.0
            },
            {
              "month": "2027-04",
              "liquid": 113000.0
            },
            {
              "month": "2027-05",
              "liquid": 97000.0
            },
            {
              "month": "2027-06",
              "liquid": 91000.0
            },
            {
              "month": "2027-07",
              "liquid": 85000.0
            },
            {
              "month": "2027-08",
              "liquid": 79000.0
            },
            {
              "month": "2027-09",
              "liquid": 73000.0
            }
          ]
        },
        {
          "id": "S3",
          "title": "Рост цен",
          "description": "Расходы на жизнь +10 %, доходы те же",
          "verdict": "ok",
          "months_until_negative": null,
          "min_liquid": 259500.0,
          "series": [
            {
              "month": "2026-10",
              "liquid": 259500.0
            },
            {
              "month": "2026-11",
              "liquid": 294000.0
            },
            {
              "month": "2026-12",
              "liquid": 328500.0
            },
            {
              "month": "2027-01",
              "liquid": 363000.0
            },
            {
              "month": "2027-02",
              "liquid": 397500.0
            },
            {
              "month": "2027-03",
              "liquid": 432000.0
            },
            {
              "month": "2027-04",
              "liquid": 466500.0
            },
            {
              "month": "2027-05",
              "liquid": 501000.0
            },
            {
              "month": "2027-06",
              "liquid": 545500.0
            },
            {
              "month": "2027-07",
              "liquid": 590000.0
            },
            {
              "month": "2027-08",
              "liquid": 634500.0
            },
            {
              "month": "2027-09",
              "liquid": 679000.0
            }
          ]
        },
        {
          "id": "S4",
          "title": "Двойной удар",
          "description": "Потеря крупнейшего дохода и рост цен одновременно",
          "verdict": "fail",
          "months_until_negative": 3,
          "min_liquid": -288000.0,
          "series": [
            {
              "month": "2026-10",
              "liquid": 139500.0
            },
            {
              "month": "2026-11",
              "liquid": 54000.0
            },
            {
              "month": "2026-12",
              "liquid": -31500.0
            },
            {
              "month": "2027-01",
              "liquid": -117000.0
            },
            {
              "month": "2027-02",
              "liquid": -202500.0
            },
            {
              "month": "2027-03",
              "liquid": -288000.0
            },
            {
              "month": "2027-04",
              "liquid": -253500.0
            },
            {
              "month": "2027-05",
              "liquid": -219000.0
            },
            {
              "month": "2027-06",
              "liquid": -184500.0
            },
            {
              "month": "2027-07",
              "liquid": -140000.0
            },
            {
              "month": "2027-08",
              "liquid": -95500.0
            },
            {
              "month": "2027-09",
              "liquid": -51000.0
            }
          ]
        }
      ],
      "debt_strategy": {
        "extra": 11250.0,
        "current": {
          "months": 14,
          "payoff_month": "2027-12",
          "total_interest": 25480.95,
          "order": [
            "Кредитная карта",
            "Потребительский кредит"
          ]
        },
        "avalanche": {
          "months": 9,
          "payoff_month": "2027-07",
          "total_interest": 16994.63,
          "order": [
            "Кредитная карта",
            "Потребительский кредит"
          ]
        },
        "snowball": {
          "months": 9,
          "payoff_month": "2027-07",
          "total_interest": 16994.63,
          "order": [
            "Кредитная карта",
            "Потребительский кредит"
          ]
        },
        "saved_by_avalanche": 8486.32,
        "high_rate": [
          {
            "title": "Кредитная карта",
            "rate": 24.0
          }
        ]
      },
      "goals": [],
      "steps": [
        {
          "rule_key": "avalanche",
          "rank": 1,
          "title": "Гасить досрочно «Кредитная карта» (24 %)",
          "why": "Если добавлять 11 250 ₽/мес к самому дорогому долгу, переплата снизится на 8 486 ₽, кредиты закроются на 5 мес. раньше.",
          "numbers": {
            "extra": 11250.0,
            "saved": 8486.32,
            "sooner_months": 5
          },
          "status": "suggested",
          "actions": [
            {
              "key": "terms",
              "title": "Уточнить условия досрочного погашения",
              "done": false
            },
            {
              "key": "pay",
              "title": "Самостоятельно внести дополнительный платёж",
              "done": false
            },
            {
              "key": "verify",
              "title": "Проверить новый остаток долга",
              "done": false
            }
          ]
        },
        {
          "rule_key": "stress_fail",
          "rank": 2,
          "title": "Потеря крупнейшего дохода: укрепить запас",
          "why": "В этом сценарии деньги кончатся через 4 мес. Подушка 405 000 ₽ даст время перестроиться.",
          "numbers": {
            "scenario": "S1",
            "months_until_negative": 4,
            "target": 405000.0
          },
          "status": "suggested",
          "actions": [
            {
              "key": "review",
              "title": "Посмотреть, когда в сценарии заканчиваются деньги",
              "done": false
            },
            {
              "key": "plan",
              "title": "Определить, как укрепить запас",
              "done": false
            },
            {
              "key": "start",
              "title": "Выполнить первое действие для увеличения запаса",
              "done": false
            }
          ]
        },
        {
          "rule_key": "cushion_target",
          "rank": 3,
          "title": "Довести подушку до 405 000 ₽",
          "why": "Сейчас 1.7 мес. из 3. По 22 500 ₽/мес — за 8 мес.",
          "numbers": {
            "target": 405000.0,
            "monthly": 22500.0,
            "months": 8
          },
          "status": "suggested",
          "actions": [
            {
              "key": "choose_account",
              "title": "Выбрать отдельный счёт для резерва",
              "done": false
            },
            {
              "key": "transfer",
              "title": "Самостоятельно внести месячный взнос",
              "done": false
            },
            {
              "key": "verify",
              "title": "Проверить, что деньги зачислены",
              "done": false
            }
          ]
        }
      ],
      "disclaimer": "Расчёт информационный, на данных, которые вы ввели. Это не индивидуальная инвестиционная рекомендация и не предложение финансовых продуктов."
    },
    {
      "checkup_id": "demo-2026-11",
      "final": true,
      "as_of": "2026-11",
      "precision": "approximate",
      "precision_share": 0.783,
      "rules_version": 1,
      "fincore_version": "0.1.0",
      "entry_answer": {
        "question": "Как у нас дела в целом?",
        "verdict": "edge",
        "text": "Зелёных областей — 3, жёлтых — 1, красных — 0. Начните с шагов ниже.",
        "numbers": {
          "green": 3,
          "yellow": 1,
          "red": 0
        }
      },
      "areas": [
        {
          "key": "budget",
          "title": "Бюджет",
          "light": "green",
          "metrics": {
            "income": 180000.0,
            "outflow": 135000.0,
            "free_cashflow": 45000.0,
            "savings_rate": 0.25
          }
        },
        {
          "key": "debts",
          "title": "Долги",
          "light": "green",
          "metrics": {
            "dti_percent": 16.666666666666664,
            "total_debt": 300000.0,
            "overdue": 0.0,
            "payments": 30000.0
          }
        },
        {
          "key": "cushion",
          "title": "Подушка и цели",
          "light": "yellow",
          "metrics": {
            "cushion": 270000.0,
            "months": 2.0,
            "target_months": 3.0,
            "goals_realistic": true
          }
        },
        {
          "key": "protection",
          "title": "Инвестиции и защита",
          "light": "green",
          "metrics": {
            "investments": 0
          },
          "flags": []
        }
      ],
      "metrics_base": {
        "income": 180000.0,
        "outflow": 135000.0,
        "liability_payments": 30000.0,
        "dti_percent": 16.666666666666664,
        "safety_fund_months": 2.0,
        "total_debt": 300000.0,
        "net_worth": -30000.0
      },
      "metrics_pessimistic": {
        "income": 170000.0,
        "outflow": 140000.0,
        "liability_payments": 30000.0,
        "dti_percent": 17.647058823529413,
        "safety_fund_months": 1.9285714285714286,
        "total_debt": 300000.0,
        "net_worth": -30000.0
      },
      "net_worth": -30000.0,
      "free_cashflow": 45000.0,
      "forecast": {
        "base": [
          {
            "month": "2026-11",
            "liquid": 315000.0
          },
          {
            "month": "2026-12",
            "liquid": 360000.0
          },
          {
            "month": "2027-01",
            "liquid": 405000.0
          },
          {
            "month": "2027-02",
            "liquid": 450000.0
          },
          {
            "month": "2027-03",
            "liquid": 495000.0
          },
          {
            "month": "2027-04",
            "liquid": 540000.0
          },
          {
            "month": "2027-05",
            "liquid": 585000.0
          },
          {
            "month": "2027-06",
            "liquid": 640000.0
          },
          {
            "month": "2027-07",
            "liquid": 695000.0
          },
          {
            "month": "2027-08",
            "liquid": 750000.0
          },
          {
            "month": "2027-09",
            "liquid": 805000.0
          },
          {
            "month": "2027-10",
            "liquid": 860000.0
          }
        ],
        "pessimistic": [
          {
            "month": "2026-11",
            "liquid": 300000.0
          },
          {
            "month": "2026-12",
            "liquid": 330000.0
          },
          {
            "month": "2027-01",
            "liquid": 360000.0
          },
          {
            "month": "2027-02",
            "liquid": 390000.0
          },
          {
            "month": "2027-03",
            "liquid": 420000.0
          },
          {
            "month": "2027-04",
            "liquid": 450000.0
          },
          {
            "month": "2027-05",
            "liquid": 480000.0
          },
          {
            "month": "2027-06",
            "liquid": 520000.0
          },
          {
            "month": "2027-07",
            "liquid": 560000.0
          },
          {
            "month": "2027-08",
            "liquid": 600000.0
          },
          {
            "month": "2027-09",
            "liquid": 640000.0
          },
          {
            "month": "2027-10",
            "liquid": 680000.0
          }
        ],
        "base_months_until_negative": null,
        "pessimistic_months_until_negative": null
      },
      "scenarios": [
        {
          "id": "S1",
          "title": "Потеря крупнейшего дохода",
          "description": "Доход «Я» пропадает на 6 мес.",
          "verdict": "fail",
          "months_until_negative": 4,
          "min_liquid": -180000.0,
          "series": [
            {
              "month": "2026-11",
              "liquid": 195000.0
            },
            {
              "month": "2026-12",
              "liquid": 120000.0
            },
            {
              "month": "2027-01",
              "liquid": 45000.0
            },
            {
              "month": "2027-02",
              "liquid": -30000.0
            },
            {
              "month": "2027-03",
              "liquid": -105000.0
            },
            {
              "month": "2027-04",
              "liquid": -180000.0
            },
            {
              "month": "2027-05",
              "liquid": -135000.0
            },
            {
              "month": "2027-06",
              "liquid": -80000.0
            },
            {
              "month": "2027-07",
              "liquid": -25000.0
            },
            {
              "month": "2027-08",
              "liquid": 30000.0
            },
            {
              "month": "2027-09",
              "liquid": 85000.0
            },
            {
              "month": "2027-10",
              "liquid": 140000.0
            }
          ]
        },
        {
          "id": "S2",
          "title": "Рождение ребёнка",
          "description": "+25 000 ₽/мес расходов, доход одного взрослого −60 % на год",
          "verdict": "ok",
          "months_until_negative": null,
          "min_liquid": 128000.0,
          "series": [
            {
              "month": "2026-11",
              "liquid": 254000.0
            },
            {
              "month": "2026-12",
              "liquid": 238000.0
            },
            {
              "month": "2027-01",
              "liquid": 222000.0
            },
            {
              "month": "2027-02",
              "liquid": 206000.0
            },
            {
              "month": "2027-03",
              "liquid": 190000.0
            },
            {
              "month": "2027-04",
              "liquid": 174000.0
            },
            {
              "month": "2027-05",
              "liquid": 158000.0
            },
            {
              "month": "2027-06",
              "liquid": 152000.0
            },
            {
              "month": "2027-07",
              "liquid": 146000.0
            },
            {
              "month": "2027-08",
              "liquid": 140000.0
            },
            {
              "month": "2027-09",
              "liquid": 134000.0
            },
            {
              "month": "2027-10",
              "liquid": 128000.0
            }
          ]
        },
        {
          "id": "S3",
          "title": "Рост цен",
          "description": "Расходы на жизнь +10 %, доходы те же",
          "verdict": "ok",
          "months_until_negative": null,
          "min_liquid": 304500.0,
          "series": [
            {
              "month": "2026-11",
              "liquid": 304500.0
            },
            {
              "month": "2026-12",
              "liquid": 339000.0
            },
            {
              "month": "2027-01",
              "liquid": 373500.0
            },
            {
              "month": "2027-02",
              "liquid": 408000.0
            },
            {
              "month": "2027-03",
              "liquid": 442500.0
            },
            {
              "month": "2027-04",
              "liquid": 477000.0
            },
            {
              "month": "2027-05",
              "liquid": 511500.0
            },
            {
              "month": "2027-06",
              "liquid": 556000.0
            },
            {
              "month": "2027-07",
              "liquid": 600500.0
            },
            {
              "month": "2027-08",
              "liquid": 645000.0
            },
            {
              "month": "2027-09",
              "liquid": 689500.0
            },
            {
              "month": "2027-10",
              "liquid": 734000.0
            }
          ]
        },
        {
          "id": "S4",
          "title": "Двойной удар",
          "description": "Потеря крупнейшего дохода и рост цен одновременно",
          "verdict": "fail",
          "months_until_negative": 4,
          "min_liquid": -243000.0,
          "series": [
            {
              "month": "2026-11",
              "liquid": 184500.0
            },
            {
              "month": "2026-12",
              "liquid": 99000.0
            },
            {
              "month": "2027-01",
              "liquid": 13500.0
            },
            {
              "month": "2027-02",
              "liquid": -72000.0
            },
            {
              "month": "2027-03",
              "liquid": -157500.0
            },
            {
              "month": "2027-04",
              "liquid": -243000.0
            },
            {
              "month": "2027-05",
              "liquid": -208500.0
            },
            {
              "month": "2027-06",
              "liquid": -174000.0
            },
            {
              "month": "2027-07",
              "liquid": -129500.0
            },
            {
              "month": "2027-08",
              "liquid": -85000.0
            },
            {
              "month": "2027-09",
              "liquid": -40500.0
            },
            {
              "month": "2027-10",
              "liquid": 4000.0
            }
          ]
        }
      ],
      "debt_strategy": {
        "extra": 11250.0,
        "current": {
          "months": 13,
          "payoff_month": "2027-12",
          "total_interest": 21534.14,
          "order": [
            "Кредитная карта",
            "Потребительский кредит"
          ]
        },
        "avalanche": {
          "months": 8,
          "payoff_month": "2027-07",
          "total_interest": 14345.39,
          "order": [
            "Кредитная карта",
            "Потребительский кредит"
          ]
        },
        "snowball": {
          "months": 8,
          "payoff_month": "2027-07",
          "total_interest": 14345.39,
          "order": [
            "Кредитная карта",
            "Потребительский кредит"
          ]
        },
        "saved_by_avalanche": 7188.75,
        "high_rate": [
          {
            "title": "Кредитная карта",
            "rate": 24.0
          }
        ]
      },
      "goals": [],
      "steps": [
        {
          "rule_key": "avalanche",
          "rank": 1,
          "title": "Гасить досрочно «Кредитная карта» (24 %)",
          "why": "Если добавлять 11 250 ₽/мес к самому дорогому долгу, переплата снизится на 7 189 ₽, кредиты закроются на 5 мес. раньше.",
          "numbers": {
            "extra": 11250.0,
            "saved": 7188.75,
            "sooner_months": 5
          },
          "status": "suggested",
          "actions": [
            {
              "key": "terms",
              "title": "Уточнить условия досрочного погашения",
              "done": false
            },
            {
              "key": "pay",
              "title": "Самостоятельно внести дополнительный платёж",
              "done": false
            },
            {
              "key": "verify",
              "title": "Проверить новый остаток долга",
              "done": false
            }
          ]
        },
        {
          "rule_key": "stress_fail",
          "rank": 2,
          "title": "Потеря крупнейшего дохода: укрепить запас",
          "why": "В этом сценарии деньги кончатся через 4 мес. Подушка 405 000 ₽ даст время перестроиться.",
          "numbers": {
            "scenario": "S1",
            "months_until_negative": 4,
            "target": 405000.0
          },
          "status": "suggested",
          "actions": [
            {
              "key": "review",
              "title": "Посмотреть, когда в сценарии заканчиваются деньги",
              "done": false
            },
            {
              "key": "plan",
              "title": "Определить, как укрепить запас",
              "done": false
            },
            {
              "key": "start",
              "title": "Выполнить первое действие для увеличения запаса",
              "done": false
            }
          ]
        },
        {
          "rule_key": "cushion_target",
          "rank": 3,
          "title": "Довести подушку до 405 000 ₽",
          "why": "Сейчас 2.0 мес. из 3. По 22 500 ₽/мес — за 6 мес.",
          "numbers": {
            "target": 405000.0,
            "monthly": 22500.0,
            "months": 6
          },
          "status": "suggested",
          "actions": [
            {
              "key": "choose_account",
              "title": "Выбрать отдельный счёт для резерва",
              "done": false
            },
            {
              "key": "transfer",
              "title": "Самостоятельно внести месячный взнос",
              "done": false
            },
            {
              "key": "verify",
              "title": "Проверить, что деньги зачислены",
              "done": false
            }
          ]
        }
      ],
      "disclaimer": "Расчёт информационный, на данных, которые вы ввели. Это не индивидуальная инвестиционная рекомендация и не предложение финансовых продуктов."
    }
  ],
  "origin": "Existing plan_api.analysis.report.build_report / synthetic inputs only",
  "assumptions": {
    "income": [
      170000,
      190000
    ],
    "living_expenses": [
      100000,
      110000
    ],
    "debt_payment": 30000,
    "debt_total": 300000,
    "reserve": 270000,
    "rates": "Synthetic: card 24%, consumer loan 12%. Not market offers."
  }
};
