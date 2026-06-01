import { useMemo, useState } from 'react';
import { CURRICULUM } from '../../../guidance/curriculum';
import { MqxGuidanceStrip } from './MqxGuidanceStrip';
import { MqxButton } from '../primitives/MqxButton';

const P1_BEATS = CURRICULUM.filter((b) => b.period_index === 1);

/** Витрина O2 guidance strip (variant A ★) в #/dev/mqx. */
export function MqxGuidanceStripDemo() {
  const [preset, setPreset] = useState('read');
  const [viewIndex, setViewIndex] = useState(0);

  const beat = P1_BEATS[viewIndex] ?? P1_BEATS[0];
  const moduleStepCount = beat?.module_step_count ?? 4;

  const demoProps = useMemo(() => {
    if (preset === 'nudge') {
      return {
        mode: 'nudge',
        title: 'Подушка на нуле',
        body: 'Закинь хоть немного в подушку — так проще пережить неожиданные траты в конце месяца.',
        showNav: false,
        beatCompleted: false,
        dismissHint: undefined,
        onContinue: undefined,
        viewIndex: 0,
        lastCompletedIndex: -1,
      };
    }
    if (preset === 'done') {
      const salary = P1_BEATS[1];
      return {
        mode: 'curriculum',
        title: salary.title,
        body: salary.body,
        viewIndex: 1,
        lastCompletedIndex: 1,
        beatCompleted: true,
        dismissHint: undefined,
        onContinue: undefined,
      };
    }
    if (preset === 'dismiss-hint') {
      const cushion = P1_BEATS[2];
      return {
        mode: 'curriculum',
        title: cushion.title,
        body: cushion.body,
        viewIndex: 2,
        lastCompletedIndex: 2,
        beatCompleted: false,
        dismissHint: 'Ещё раз — пропустить всё обучение',
        onContinue: undefined,
      };
    }
    return {
      mode: 'curriculum',
      title: beat.title,
      body: beat.body,
      viewIndex,
      lastCompletedIndex: Math.max(-1, viewIndex - 1),
      beatCompleted: false,
      dismissHint: undefined,
      onContinue: () => setViewIndex((i) => Math.min(i + 1, P1_BEATS.length - 1)),
    };
  }, [preset, beat, viewIndex]);

  return (
    <div className="mqx-guidance-strip-demo">
      <p className="mqx-catalog__lead" style={{ marginTop: 0 }}>
        <strong>O2 Progressive Guidance</strong> — variant <strong>A ★</strong> (violet bubble dock). Lab:{' '}
        <code>design-lab/onboarding-o2/guidance-strip-round/</code>. Монетка sit-edge у заголовка; toolbar:{' '}
        <code>‹ N из M ›</code> слева, зелёный ✓ + × справа.
      </p>

      <div className="mqx-guidance-strip-demo__toolbar">
        {[
          ['read', 'Read + CTA'],
          ['done', 'Gate done ✓'],
          ['dismiss-hint', '2× dismiss hint'],
          ['nudge', 'Nudge'],
        ].map(([id, label]) => (
          <MqxButton
            key={id}
            variant={preset === id ? 'primary' : 'secondary'}
            onClick={() => {
              setPreset(id);
              if (id === 'read') setViewIndex(0);
            }}
          >
            {label}
          </MqxButton>
        ))}
      </div>

      <div className="mqx-guidance-strip-demo__phone">
        <div className="mqx-guidance-strip-demo__dash">
          <div className="mqx-guidance-strip-demo__hero-kicker">Месяц открыт</div>
          <div className="mqx-guidance-strip-demo__hero-title">Закрыть месяц</div>
          <div className="mqx-guidance-strip-demo__hero-meta">Период №1 · 42 150 ₽</div>
        </div>
        <nav className="mqx-guidance-strip-demo__tabbar" aria-hidden="true">
          <span className="is-active">Обзор</span>
          <span>Финансы</span>
          <span>Аналитика</span>
          <span>Меню</span>
        </nav>
        <MqxGuidanceStrip
          className="mqx-guidance-strip--demo"
          mode={demoProps.mode}
          title={demoProps.title}
          body={demoProps.body}
          moduleStepCount={moduleStepCount}
          viewIndex={demoProps.viewIndex}
          lastCompletedIndex={demoProps.lastCompletedIndex}
          beatCompleted={demoProps.beatCompleted}
          dismissHint={demoProps.dismissHint}
          onDismiss={() => {}}
          onPrev={() => setViewIndex((i) => Math.max(0, i - 1))}
          onNext={() => setViewIndex((i) => Math.min(P1_BEATS.length - 1, i + 1))}
          onContinue={demoProps.onContinue}
          showNav={demoProps.mode === 'curriculum'}
        />
      </div>
    </div>
  );
}
