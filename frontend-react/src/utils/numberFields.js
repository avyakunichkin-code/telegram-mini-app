/** Текстовый ввод сумм: пусто означает «как 0 при отправке», без ведущих нулей типа «054» */

export function sanitizeIntInput(raw) {
  if (raw == null || raw === '') return '';
  const digits = String(raw).replace(/\D/g, '');
  if (digits === '') return '';
  return String(parseInt(digits, 10));
}

/** Проценты / суммы с точкой: одна точка, ограничение дробной части */
export function sanitizeDecimalInput(raw, maxDecimals = 2) {
  if (raw == null || raw === '') return '';
  let s = String(raw).replace(/,/g, '.').replace(/[^\d.]/g, '');
  const dot = s.indexOf('.');
  if (dot !== -1) {
    s = `${s.slice(0, dot + 1)}${s.slice(dot + 1).replace(/\./g, '')}`;
  }
  let intPart = '';
  let fracPart = '';
  if (s.includes('.')) {
    const [a, b = ''] = s.split('.');
    intPart = a;
    fracPart = maxDecimals >= 0 ? b.slice(0, maxDecimals) : b;
  } else {
    intPart = s;
  }
  intPart = intPart.replace(/^0+(?=\d)/g, '');
  if (dot === -1) return intPart === '' && s === '' ? '' : intPart;
  if (s.endsWith('.') && fracPart === '') return intPart === '' ? '0.' : `${intPart || '0'}.`;
  const i = intPart === '' ? '0' : intPart;
  return `${i}.${fracPart}`;
}

export function parseNumLoose(str, fallback = 0) {
  if (str === '' || str == null || str === undefined) return fallback;
  const n = typeof str === 'number' ? str : Number(String(str).replace(',', '.'));
  return Number.isFinite(n) ? n : fallback;
}
