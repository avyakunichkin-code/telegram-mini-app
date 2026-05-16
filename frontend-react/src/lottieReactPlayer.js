/**
 * После default/interop или отдельного чанка `import … from 'lottie-react'` иногда попадается объект —
 * React: type is invalid … got object (см. FintechTgsSticker).
 */
import * as LottiePkg from 'lottie-react';

function unwrapLottie(exp) {
  let x = exp;
  let depth = 0;
  while (depth++ < 4 && x != null) {
    if (typeof x === 'function') return x;
    if (typeof x.default === 'function') return x.default;
    x = x.default;
  }
  return null;
}

const resolved =
  unwrapLottie(LottiePkg.default) ?? unwrapLottie(LottiePkg);

function LottieUnavailable() {
  return null;
}

export const Lottie =
  typeof resolved === 'function' ? resolved : LottieUnavailable;

if (typeof resolved !== 'function') {
  console.error('[lottie-react] не удалось получить компонент, модуль:', LottiePkg);
}
