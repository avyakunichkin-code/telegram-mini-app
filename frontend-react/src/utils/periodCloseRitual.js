import { derivePeriodCloseMetrics } from './periodCloseDisplay';

function formatMoneyAbs(n) {
  const v = Math.round(Math.abs(Number(n) || 0));
  return v.toLocaleString('ru-RU');
}

/**
 * 2–4 «удара» истории для ритуала закрытия хода (★ juice C).
 * @returns {{ id: string, tone: 'pos'|'neg'|'neutral', icon: string, lead: string, emphasis?: string, tail: string }[]}
 */
export function periodCloseRitualBeats(summary) {
  const m = derivePeriodCloseMetrics(summary);
  if (!m) return [];

  const beats = [];

  if (m.incomeDelta > 0) {
    beats.push({
      id: 'income',
      tone: 'pos',
      icon: '+',
      lead: 'Доходы ',
      emphasis: `+${formatMoneyAbs(m.incomeDelta)} ₽`,
      tail: ' — деньги пришли в этот ход',
    });
  }

  if (m.expenseDelta > 0) {
    beats.push({
      id: 'expense',
      tone: 'neg',
      icon: '!',
      lead: 'Расходы и платежи ',
      emphasis: `−${formatMoneyAbs(m.expenseDelta)} ₽`,
      tail: ' — часть прироста ушла на жизнь и долги',
    });
  } else if (m.cashDelta < 0) {
    beats.push({
      id: 'cash',
      tone: 'neg',
      icon: '!',
      lead: 'Наличные ',
      emphasis: `−${formatMoneyAbs(m.cashDelta)} ₽`,
      tail: ' за ход — баланс просел',
    });
  }

  if (m.cashDelta > 0 && m.incomeDelta <= m.expenseDelta) {
    beats.push({
      id: 'cash-pos',
      tone: 'pos',
      icon: '+',
      lead: 'Наличные ',
      emphasis: `+${formatMoneyAbs(m.cashDelta)} ₽`,
      tail: ' — итог хода в плюс',
    });
  }

  if (m.safetyDelta !== 0) {
    const sign = m.safetyDelta > 0 ? '+' : '−';
    beats.push({
      id: 'safety',
      tone: m.safetyDelta > 0 ? 'pos' : 'neutral',
      icon: m.safetyDelta > 0 ? '+' : '◎',
      lead: 'Подушка ',
      emphasis: `${sign}${formatMoneyAbs(m.safetyDelta)} ₽`,
      tail: ` — запас на чёрный день ${m.safetyDelta > 0 ? 'вырос' : 'изменился'}`,
    });
  } else {
    beats.push({
      id: 'safety-hold',
      tone: 'neutral',
      icon: '◎',
      lead: '',
      tail: 'Подушка держится — запас на чёрный день без сюрпризов',
    });
  }

  return beats.slice(0, 4);
}

export function periodCloseRitualPeriodLabel(summary) {
  const m = derivePeriodCloseMetrics(summary);
  const n = m?.periodIndex || 0;
  return n > 0 ? `Период №${n} закрыт` : 'Период закрыт';
}
