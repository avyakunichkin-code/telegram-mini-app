"""Generate synthetic UI contract cases from the existing server precision function."""
import json
import random
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[3]
sys.path[:0] = [str(ROOT / 'apps/plan-api'), str(ROOT / 'packages/fincore/src')]
from plan_api.analysis.adapter import precision
from plan_api.schemas import CheckupData

cases = []
def add(name, data):
    parsed = CheckupData.model_validate(data)
    level, share = precision(parsed)
    cases.append(dict(name=name, data=parsed.model_dump(mode='json'), expected=dict(level=level, share=share)))

def income(lo, hi):
    return dict(member_id='synthetic', amount=dict(min=lo, max=hi))

add('empty', {})
add('zero', dict(incomes=[income(0, 0)]))
add('exact boundary 1.1', dict(incomes=[income(100, 110)]))
add('just above 1.1', dict(incomes=[income(100, 110.01)]))
add('50 percent', dict(incomes=[income(50, 50), income(0, 50)]))
add('85 percent', dict(incomes=[income(85, 85), income(0, 15)]))
add('approved demo', dict(incomes=[income(120000, 120000)], expenses=[dict(category_key='life', amount=dict(min=20000,max=100000))], savings=[dict(amount=dict(min=270000,max=270000))], liabilities=[dict(balance=100000,annual_rate=18,monthly_payment=30000,estimated=True)]))
rng = random.Random(311)
for i in range(40):
    data = dict(incomes=[], expenses=[], savings=[], liabilities=[])
    for key in ('incomes','expenses','savings'):
        for _ in range(rng.randrange(4)):
            lo = rng.choice([0, 100, 10000, 65000, 120000])
            hi = round(lo * rng.choice([1, 1.1, 1.101, 2, 3.01]), 2)
            row = dict(amount=dict(min=lo,max=hi))
            if key == 'incomes': row['member_id'] = 'synthetic'
            if key == 'expenses': row['category_key'] = 'life'
            data[key].append(row)
    for _ in range(rng.randrange(3)):
        data['liabilities'].append(dict(balance=100000,annual_rate=18,monthly_payment=rng.choice([0,1000,20000]),estimated=rng.choice([True,False])))
    add(f'synthetic-{i}',data)

target = ROOT / 'apps/plan-web/test/fixtures/precision.json'
target.parent.mkdir(parents=True,exist_ok=True)
target.write_text(json.dumps(cases,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
print(f'{len(cases)} server-derived synthetic precision cases written.')
