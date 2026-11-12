import { Monetka } from '../brand/Monetka';
import { MonetkaAvatar } from '../brand/MonetkaAvatar';
import { MqxCompanionCard } from '../brand/MqxCompanionCard';

/** Ситуации Монетки — таблица из game/design-lab/mascots/ink-mascots-round/README.md. */
const SITUATIONS = [
  { caption: 'ДЕНЬ ЗАРПЛАТЫ', face: 'smile', arms: 'wave', when: 'Приветствие, старт' },
  { caption: 'НОВЫЙ ХОД', face: 'smile', arms: 'wave', when: 'Начало периода' },
  { caption: 'ЖМИ ЗАРПЛАТУ', face: 'wink', arms: 'hey', when: 'Зарплата не взята' },
  { caption: 'СОБЫТИЕ!', face: 'surprised', arms: 'up', when: 'Пришла карта события' },
  { caption: 'ИНТЕРЕСНО…', face: 'think', arms: 'chin', when: 'Объяснение механики' },
  { caption: 'ПОДУШКА РАСТЁТ', face: 'joy', arms: 'up', when: 'Похвала' },
  { caption: 'ДОЛГ РАСТЁТ', face: 'worried', arms: 'chin', when: 'Предупреждение' },
  { caption: 'ПОБЕДА', face: 'victory', arms: 'up', when: 'Финал партии' },
];

const COMPANION_TEMPLATES = ['mq_game_basic_v1', 'mq_game_tight_budget_v1', 'mq_game_mortgage_stress_v1', 'mq_game_debt_stack_v1'];

/** Маскоты ★ ink-mascots-round, companions-round (PO 2026-11-02). */
export function MqxMascotsCatalogDemo() {
  return (
    <>
      <p className="mqx-catalog__lead">
        <code>Monetka</code> — лицо, руки и надпись на ободе (читается от 120 px), канон{' '}
        <code>game/design/system/illustrations/monetka.js</code>. Мельче — <code>MonetkaAvatar</code> без надписи.
        Жестов пальцами нет; рука у подбородка — поверх надписи.
      </p>
      <div className="mqx-catalog-mascots">
        {SITUATIONS.map((s) => (
          <figure key={s.caption} className="mqx-catalog-mascots__cell">
            <Monetka face={s.face} arms={s.arms} caption={s.caption} size={140} label={`Монетка: ${s.when}`} />
            <figcaption>{s.when}</figcaption>
          </figure>
        ))}
      </div>
      <div className="mqx-catalog-mascots mqx-catalog-mascots--sizes">
        {[56, 40, 24].map((size) => (
          <figure key={size} className="mqx-catalog-mascots__cell">
            <MonetkaAvatar size={size} />
            <figcaption>{size} px</figcaption>
          </figure>
        ))}
        <figure className="mqx-catalog-mascots__cell">
          <Monetka size={56} face="wink" />
          <figcaption>«в шапке» 56 px</figcaption>
        </figure>
      </div>
      <p className="mqx-catalog__lead">
        <code>MqxCompanionCard</code> — знакомство с напарником (★ companions-round B), экран между выбором жизни и
        первым ходом.
      </p>
      <div className="mqx-catalog-mascots mqx-catalog-mascots--cards">
        {COMPANION_TEMPLATES.map((key) => (
          <MqxCompanionCard key={key} templateKey={key} titleId={`mqx-catalog-companion-${key}`} headingLevel="h3" />
        ))}
      </div>
    </>
  );
}
