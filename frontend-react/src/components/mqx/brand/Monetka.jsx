import { useId } from 'react';

/*
 * Монетка в «Чернильном крае» ★ PO 2026-11-02 — шаблон design/system/illustrations/monetka.js
 * и design-lab/mascots/ink-mascots-round: лицо + руки + надпись сверху на ободе, снизу всегда «★ ТВОЙ ХОД ★».
 * Жестов пальцами нет («палец вверх» читался как средний); рука у подбородка рисуется поверх надписи.
 * Цвета зашиты и от темы не зависят. Inline SVG — надпись на ободе идёт шрифтом игры.
 */
const INK = '#1d1530';
const COIN = '#eab308';
const SOFT = '#fcf1c8';
const TURN = '#6d28d9';
const TURN_SOFT = '#ece4fb';

const EYES = (
  <>
    <ellipse cx="87" cy="82" rx="5" ry="8" fill={INK} stroke="none" />
    <ellipse cx="113" cy="82" rx="5" ry="8" fill={INK} stroke="none" />
  </>
);
const JOY_EYES = (
  <>
    <path d="M80 84 L87 76 L94 84" fill="none" strokeWidth="4.5" />
    <path d="M106 84 L113 76 L120 84" fill="none" strokeWidth="4.5" />
  </>
);

const FACES = {
  smile: (
    <>
      {EYES}
      <path d="M87 100 Q100 111 113 100" fill="none" strokeWidth="4.5" />
    </>
  ),
  wink: (
    <>
      <ellipse cx="87" cy="82" rx="5" ry="8" fill={INK} stroke="none" />
      <path d="M106 84 Q113 76 120 84" fill="none" strokeWidth="4.5" />
      <path d="M84 98 Q100 116 116 98 Z" fill={INK} strokeWidth="3" />
    </>
  ),
  surprised: (
    <>
      <circle cx="87" cy="80" r="7" fill="#ffffff" strokeWidth="3" />
      <circle cx="113" cy="80" r="7" fill="#ffffff" strokeWidth="3" />
      <circle cx="87" cy="80" r="3" fill={INK} stroke="none" />
      <circle cx="113" cy="80" r="3" fill={INK} stroke="none" />
      <ellipse cx="100" cy="103" rx="5" ry="7" fill={INK} stroke="none" />
    </>
  ),
  think: (
    <>
      <ellipse cx="91" cy="77" rx="4.5" ry="7" fill={INK} stroke="none" />
      <ellipse cx="116" cy="77" rx="4.5" ry="7" fill={INK} stroke="none" />
      <path d="M92 104 L108 101" fill="none" strokeWidth="4.5" />
    </>
  ),
  joy: (
    <>
      {JOY_EYES}
      <path d="M86 96 Q100 114 114 96 Z" fill={INK} strokeWidth="3" />
    </>
  ),
  worried: (
    <>
      <path d="M79 74 L93 69 M121 74 L107 69" fill="none" strokeWidth="3.5" />
      <ellipse cx="87" cy="83" rx="4.5" ry="6" fill={INK} stroke="none" />
      <ellipse cx="113" cy="83" rx="4.5" ry="6" fill={INK} stroke="none" />
      <path d="M86 104 Q93 99 100 104 Q107 109 114 104" fill="none" strokeWidth="4" />
    </>
  ),
  victory: (
    <>
      {JOY_EYES}
      <path d="M82 94 L118 94 Q118 116 100 116 Q82 116 82 94 Z" fill={INK} strokeWidth="3" />
    </>
  ),
};

const hand = (x, y) => <circle cx={x} cy={y} r="9" fill={SOFT} />;

/** back — за монетой, front — поверх монеты и надписи (рука у подбородка). */
const ARMS = {
  none: { back: null, front: null },
  wave: {
    back: (
      <>
        <path d="M44 96 Q24 88 28 62" fill="none" />
        {hand(28, 55)}
        <path d="M154 102 Q178 114 160 130" fill="none" />
        {hand(157, 133)}
      </>
    ),
    front: null,
  },
  /* «Напоминание»: поднятая открытая ладонь со штрихами «эй!», вторая рука на поясе */
  hey: {
    back: (
      <>
        <path d="M46 96 Q26 90 26 62" fill="none" />
        {hand(26, 54)}
        <path d="M10 38 L15 43 M6 52 L13 52 M10 66 L15 61" fill="none" strokeWidth="3.5" />
        <path d="M156 98 Q184 108 162 128" fill="none" />
        {hand(160, 131)}
      </>
    ),
    front: null,
  },
  up: {
    back: (
      <>
        <path d="M46 80 Q26 66 28 44" fill="none" />
        {hand(28, 37)}
        <path d="M154 80 Q174 66 172 44" fill="none" />
        {hand(172, 37)}
      </>
    ),
    front: null,
  },
  chin: {
    back: (
      <>
        <path d="M44 102 Q30 122 38 142" fill="none" />
        {hand(39, 149)}
      </>
    ),
    front: (
      <>
        <path d="M158 106 Q150 132 124 126" fill="none" />
        {hand(118, 123)}
      </>
    ),
  },
};

const LEGS = (
  <>
    <path d="M86 146 L82 182" fill="none" />
    <path d="M114 146 L118 182" fill="none" />
    <path d="M64 192 Q64 180 78 180 L86 180 Q92 180 92 192 Z" fill={INK} />
    <path d="M108 192 Q108 180 114 180 L122 180 Q136 180 136 192 Z" fill={INK} />
  </>
);

const STARS = (
  <>
    <path d="M24 112 L26.5 119.5 L34 122 L26.5 124.5 L24 132 L21.5 124.5 L14 122 L21.5 119.5 Z" fill="#ffffff" strokeWidth="2.5" />
    <path d="M178 100 L180 106 L186 108 L180 110 L178 116 L176 110 L170 108 L176 106 Z" fill={COIN} strokeWidth="2.5" />
  </>
);

export const MONETKA_FACES = Object.keys(FACES);
export const MONETKA_ARMS = Object.keys(ARMS);

const STROKE = { stroke: INK, strokeWidth: 5, strokeLinecap: 'round', strokeLinejoin: 'round' };

/**
 * Монетка целиком.
 * @param {'smile'|'wink'|'surprised'|'think'|'joy'|'worried'|'victory'} [face]
 * @param {'none'|'wave'|'hey'|'up'|'chin'} [arms] — с руками добавляются ноги, viewBox шире
 * @param {string} [caption] — надпись сверху на ободе; читается от 120 px. Без неё обода без надписей (вариант «в шапке»).
 * @param {string} [label] — подпись для скринридера; без неё Монетка декоративная (aria-hidden).
 */
export function Monetka({ face = 'smile', arms = 'none', caption, size, label, className = '' }) {
  const id = `mk${useId().replace(/[^a-zA-Z0-9]/g, '')}`;
  const a = ARMS[arms] || ARMS.none;
  const full = a !== ARMS.none;
  const a11y = label ? { role: 'img', 'aria-label': label } : { 'aria-hidden': true, focusable: 'false' };

  return (
    <svg
      className={['mqx-monetka', className].filter(Boolean).join(' ')}
      viewBox={full ? '0 0 200 210' : '30 20 140 140'}
      width={size}
      height={size ? (full ? size * 1.05 : size) : undefined}
      {...a11y}
    >
      {caption ? (
        <>
          <path id={`${id}t`} d="M55.5 88 A44.5 44.5 0 0 1 144.5 88" fill="none" />
          <path id={`${id}b`} d="M50 88 A50 50 0 0 0 150 88" fill="none" />
        </>
      ) : null}
      <g {...STROKE}>
        {full ? LEGS : null}
        {a.back}
        {face === 'victory' ? STARS : null}
        <circle cx="108" cy="96" r="62" fill={INK} stroke="none" />
        <circle cx="100" cy="88" r="62" fill={COIN} />
        <circle cx="100" cy="88" r="47" fill={SOFT} stroke={TURN} strokeWidth="12" />
        <circle cx="100" cy="88" r="53.5" fill="none" strokeWidth="3" />
        <circle cx="100" cy="88" r="40.5" fill="none" strokeWidth="3" />
        {FACES[face] || FACES.smile}
      </g>
      {caption ? (
        <>
          <text className="mqx-monetka__rim" fontSize="9" fill={face === 'victory' ? SOFT : '#ffffff'} letterSpacing="1.4">
            <textPath href={`#${id}t`} startOffset="50%" textAnchor="middle">
              {caption}
            </textPath>
          </text>
          <text className="mqx-monetka__rim" fontSize="7.5" fill={TURN_SOFT} letterSpacing="1.6">
            <textPath href={`#${id}b`} startOffset="50%" textAnchor="middle">
              ★ ТВОЙ ХОД ★
            </textPath>
          </text>
        </>
      ) : null}
      {/* рука у подбородка — поверх надписи на ободе, иначе буквы и «★» рисуются на руке */}
      {a.front ? <g {...STROKE}>{a.front}</g> : null}
    </svg>
  );
}
