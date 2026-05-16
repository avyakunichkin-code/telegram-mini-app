import { useEffect, useRef, useState } from 'react';
import Lottie from 'lottie-react';

import fintechTgsUrl from '../assets/lottie/Fintech.tgs?url';

async function tgsArrayBufferToLottieJson(arrayBuffer) {
  if (typeof DecompressionStream !== 'undefined') {
    const blob = new Blob([arrayBuffer]);
    const stream = blob.stream().pipeThrough(new DecompressionStream('gzip'));
    const text = await new Response(stream).text();
    return JSON.parse(text);
  }
  const head = new Uint8Array(arrayBuffer, 0, 2);
  const isGzip = head[0] === 0x1f && head[1] === 0x8b;
  if (!isGzip) {
    const text = new TextDecoder('utf-8').decode(arrayBuffer);
    return JSON.parse(text);
  }
  throw new Error('Gzip decompression is not supported in this environment');
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

/**
 * Telegram `.tgs` (gzip Lottie) для экранов входа / проверки сессии.
 */
export function FintechTgsSticker({ className = '' }) {
  const reducedMotion = usePrefersReducedMotion();
  const lottieRef = useRef(null);
  const [animationData, setAnimationData] = useState(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(fintechTgsUrl);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const ab = await res.arrayBuffer();
        const json = await tgsArrayBufferToLottieJson(ab);
        if (!cancelled) setAnimationData(json);
      } catch {
        if (!cancelled) setAnimationData(null);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!animationData) return;
    let n = 0;
    const t = window.setInterval(() => {
      n += 1;
      const L = lottieRef.current;
      if (L?.animationLoaded) {
        setReady(true);
        window.clearInterval(t);
        return;
      }
      if (n > 200) window.clearInterval(t);
    }, 32);
    return () => window.clearInterval(t);
  }, [animationData]);

  useEffect(() => {
    const L = lottieRef.current;
    if (!animationData || !L?.animationLoaded || !ready) return;
    if (reducedMotion) {
      L.goToAndStop(0, true);
    }
  }, [animationData, ready, reducedMotion]);

  return (
    <div
      className={`mq-auth-tgs${animationData ? '' : ' mq-auth-tgs--skeleton'}${className ? ` ${className}` : ''}`}
      aria-hidden
    >
      {animationData ? (
        <Lottie
          lottieRef={lottieRef}
          animationData={animationData}
          loop={!reducedMotion}
          autoplay={!reducedMotion}
          rendererSettings={{
            preserveAspectRatio: 'xMidYMid meet',
            clearCanvas: true,
          }}
          className="mq-auth-tgs__lottie"
        />
      ) : null}
    </div>
  );
}

export default FintechTgsSticker;
