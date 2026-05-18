import { useEffect, useRef, useState } from 'react';

import { Lottie } from '../lottieReactPlayer';

/**
 * Прогресс периода 0…1.
 * Замените файл `src/assets/lottie/mascot-period.json` на свой экспорт (LottieFiles / AE Bodymovin).
 */
import mascotData from '../assets/lottie/mascot-period.json';

function periodProgress(durationSec, remainingSec) {
  const d = Number(durationSec);
  const r = Math.max(0, Number(remainingSec) || 0);
  if (!Number.isFinite(d) || d <= 0) return 0;
  return Math.min(1, Math.max(0, (d - r) / d));
}

function usePrefersReducedMotion() {
  const [reduced, setReduced] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    const apply = () => setReduced(Boolean(mq.matches));
    apply();
    mq.addEventListener('change', apply);
    return () => mq.removeEventListener('change', apply);
  }, []);
  return reduced;
}

export function PeriodJourneyLottie({
  timeState,
  remainingSeconds,
  periodDurationSeconds,
}) {
  const reducedMotion = usePrefersReducedMotion();
  const duration = Number(periodDurationSeconds) || 300;
  const remaining = Number(remainingSeconds) || 0;
  const progress = periodProgress(duration, remaining);
  const lottieRef = useRef(null);
  const [ready, setReady] = useState(false);
  const playing = timeState === 'play';

  useEffect(() => {
    let n = 0;
    const t = window.setInterval(() => {
      n += 1;
      const L = lottieRef.current;
      if (L?.animationLoaded) {
        setReady(true);
        window.clearInterval(t);
        return;
      }
      if (n > 200) {
        window.clearInterval(t);
      }
    }, 32);
    return () => window.clearInterval(t);
  }, []);

  useEffect(() => {
    const L = lottieRef.current;
    if (!L?.animationLoaded || !ready) return;
    if (reducedMotion) {
      L.goToAndStop(0, true);
      return;
    }
    let maxFrame =
      typeof L.getDuration === 'function' ? L.getDuration(true) : undefined;
    if (typeof maxFrame !== 'number' || !Number.isFinite(maxFrame)) {
      const ip = typeof mascotData.ip === 'number' ? mascotData.ip : 0;
      const op = typeof mascotData.op === 'number' ? mascotData.op : 301;
      maxFrame = Math.max(1, Math.floor(op - ip) - 1);
    } else {
      maxFrame = Math.max(1, Math.floor(maxFrame) - 1);
    }
    const frame = Math.min(maxFrame, Math.max(0, progress * maxFrame));
    L.goToAndStop(frame, true);
  }, [progress, ready, reducedMotion]);

  return (
    <div
      className={`mq-period-boy mq-period-boy--lottie${playing ? ' mq-period-boy--lottie-playing' : ' mq-period-boy--lottie-paused'}`}
      aria-hidden
    >
      <div className="mq-period-boy__label">Цикл месяца · Lottie</div>
      <div className="mq-period-boy__lottie-wrap">
        <Lottie
          lottieRef={lottieRef}
          animationData={mascotData}
          loop={false}
          autoplay={false}
          rendererSettings={{
            preserveAspectRatio: 'xMidYMid slice',
            clearCanvas: true,
          }}
          className="mq-period-boy__lottie"
          style={{ height: '100%', width: '100%' }}
        />
      </div>
    </div>
  );
}

export default PeriodJourneyLottie;
