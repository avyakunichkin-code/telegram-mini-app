import { investMonthlyAccrual } from '../constants/investProducts';
import { getExpenseLines, getMonthlyBurn } from './expensesDisplay';

const INVEST_KIND_LABELS = {
  deposit: 'Депозиты',
  bond: 'Облигации',
};

const ASSET_KIND_LABELS = {
  home: 'Жильё',
  rental_home: 'Аренда',
  vehicle: 'Авто',
  rental_car: 'Авто (аренда)',
  generic: 'Имущество',
};

const LIABILITY_KIND_LABELS = {
  mortgage: 'Ипотека',
  consumer_loan: 'Кредит',
  credit_card: 'Кредитная карта',
  generic: 'Обязательство',
};

function kindLabel(map, kind, fallback) {
  const k = (kind || '').trim() || 'generic';
  return map[k] || fallback || k;
}

function sumAmount(items) {
  return items.reduce((s, it) => s + (Number(it.amount) || 0), 0);
}

function pushGroup(bucket, key, label, item) {
  const amount = Number(item.amount) || 0;
  if (amount <= 0) return;
  if (!bucket[key]) {
    bucket[key] = { key, label, amount: 0, items: [] };
  }
  bucket[key].amount += amount;
  bucket[key].items.push(item);
}

function groupsFromBucket(bucket) {
  return Object.values(bucket)
    .filter((g) => g.amount > 0)
    .sort((a, b) => b.amount - a.amount);
}

/**
 * Сводка доходов и расходов за период для блока «Управление капиталом».
 * @param {{ overview: object, investPositions?: object[], policies?: object[] }} input
 */
export function buildCapitalPeriodFlows({ overview, investPositions = [], policies = [] }) {
  const salary = Number(overview?.salary?.monthly_amount) || 0;

  const investBucket = {};
  for (const p of investPositions) {
    if (!p) continue;
    const kind = p.kind || 'deposit';
    const amount = investMonthlyAccrual(p.principal, p.annual_rate_percent);
    pushGroup(investBucket, kind, kindLabel(INVEST_KIND_LABELS, kind, 'Инвестиции'), {
      id: p.id,
      title: p.title || kindLabel(INVEST_KIND_LABELS, kind, 'Позиция'),
      amount,
    });
  }
  const investGroups = groupsFromBucket(investBucket);
  const investTotal = sumAmount(investGroups);

  const assetIncomeBucket = {};
  for (const a of overview?.assets || []) {
    const amount = Number(a.monthly_income) || 0;
    if (amount <= 0) continue;
    const kind = a.kind || 'generic';
    pushGroup(assetIncomeBucket, kind, kindLabel(ASSET_KIND_LABELS, kind, 'Доходное имущество'), {
      id: a.id,
      title: a.title || kindLabel(ASSET_KIND_LABELS, kind, 'Актив'),
      amount,
    });
  }
  const assetIncomeGroups = groupsFromBucket(assetIncomeBucket);
  const assetIncomeTotal = sumAmount(assetIncomeGroups);

  const incomeArticles = [
    { key: 'salary', label: 'Зарплата', amount: salary, items: salary > 0 ? [{ title: 'Зарплата', amount: salary }] : [] },
    {
      key: 'invest',
      label: 'Инвестиции',
      amount: investTotal,
      items: investGroups,
      byType: true,
    },
    {
      key: 'asset_income',
      label: 'Доходное имущество',
      amount: assetIncomeTotal,
      items: assetIncomeGroups,
      byType: true,
    },
  ].filter((a) => a.amount > 0);

  const incomeTotal = sumAmount(incomeArticles);

  const burn = getMonthlyBurn(overview);
  const burnLines = getExpenseLines(overview).filter((l) => Number(l?.amount) > 0);

  const maintenanceBucket = {};
  for (const a of overview?.assets || []) {
    const amount = Number(a.monthly_maintenance_cost) || 0;
    if (amount <= 0) continue;
    const kind = a.kind || 'generic';
    pushGroup(maintenanceBucket, kind, kindLabel(ASSET_KIND_LABELS, kind, 'Содержание'), {
      id: a.id,
      title: a.title || kindLabel(ASSET_KIND_LABELS, kind, 'Актив'),
      amount,
    });
  }
  const maintenanceGroups = groupsFromBucket(maintenanceBucket);
  const maintenanceTotal = sumAmount(maintenanceGroups);

  const liabilityBucket = {};
  for (const l of overview?.liabilities || []) {
    const amount = Number(l.monthly_payment) || 0;
    if (amount <= 0) continue;
    const kind = l.kind || 'generic';
    pushGroup(liabilityBucket, kind, kindLabel(LIABILITY_KIND_LABELS, kind, 'Платёж'), {
      id: l.id,
      title: l.title || kindLabel(LIABILITY_KIND_LABELS, kind, 'Долг'),
      amount,
    });
  }
  const liabilityGroups = groupsFromBucket(liabilityBucket);
  const liabilityTotal = sumAmount(liabilityGroups);

  const insuranceBucket = {};
  for (const pol of policies) {
    const amount = Number(pol.monthly_premium) || 0;
    if (amount <= 0) continue;
    const key = pol.plan_key || pol.product || 'insurance';
    pushGroup(insuranceBucket, key, pol.title || 'Страховка', {
      id: pol.id,
      title: pol.title || 'Полис',
      amount,
    });
  }
  const insuranceGroups = groupsFromBucket(insuranceBucket);
  const insuranceTotal = sumAmount(insuranceGroups);

  const expenseArticles = [
    {
      key: 'burn',
      label: 'На жизнь',
      amount: burn,
      items: burnLines.map((l) => ({
        title: l.label || l.title || l.category_key || 'Статья',
        amount: Number(l.amount) || 0,
      })),
    },
    {
      key: 'maintenance',
      label: 'Содержание имущества',
      amount: maintenanceTotal,
      items: maintenanceGroups,
      byType: true,
    },
    {
      key: 'liabilities',
      label: 'Платежи по обязательствам',
      amount: liabilityTotal,
      items: liabilityGroups,
      byType: true,
    },
    {
      key: 'insurance',
      label: 'Страховки',
      amount: insuranceTotal,
      items: insuranceGroups,
      byType: true,
    },
  ].filter((a) => a.amount > 0);

  const expenseTotal = sumAmount(expenseArticles);

  return {
    income: { total: incomeTotal, articles: incomeArticles },
    expense: { total: expenseTotal, articles: expenseArticles },
  };
}
