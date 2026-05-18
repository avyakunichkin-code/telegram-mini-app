import { useCallback, useEffect, useRef, useState } from 'react';

const CAROUSEL_EDGE = 52;
const SLIDE_MS = 290;

/**
 * Состояние карусели событий: индекс, анимация слайда, свайп.
 */
export function useEventCarousel(events, { open, onClose, navigationLocked = false }) {
  const [idx, setIdx] = useState(0);
  const [slide, setSlide] = useState(null);
  const animLock = useRef(false);
  const touchStart = useRef(null);
  const slideTimer = useRef(null);

  const rawList = Array.isArray(events) ? events : [];
  const n = rawList.length;
  const list = rawList.map((ev, i) => ({
    ...ev,
    idxInDeck: i,
    deckLen: n,
  }));

  const clearSlideTimer = useCallback(() => {
    if (slideTimer.current) {
      window.clearTimeout(slideTimer.current);
      slideTimer.current = null;
    }
  }, []);

  useEffect(() => {
    if (open) setIdx(0);
  }, [open]);

  useEffect(() => {
    setIdx((i) => (n === 0 ? 0 : Math.min(Math.max(i, 0), n - 1)));
  }, [n]);

  useEffect(() => () => clearSlideTimer(), [clearSlideTimer]);

  const finalizeSlide = useCallback(
    (enterIdx) => {
      clearSlideTimer();
      setIdx(enterIdx);
      setSlide(null);
      animLock.current = false;
    },
    [clearSlideTimer],
  );

  const startSlide = useCallback(
    (dir, enterIdx) => {
      if (navigationLocked || animLock.current || n === 0) return;
      if (enterIdx < 0 || enterIdx >= n) return;
      animLock.current = true;
      setSlide({ dir, enterIdx });
      clearSlideTimer();
      slideTimer.current = window.setTimeout(() => finalizeSlide(enterIdx), SLIDE_MS);
    },
    [navigationLocked, n, clearSlideTimer, finalizeSlide],
  );

  const goNext = useCallback(() => {
    if (idx >= n - 1) return;
    startSlide('next', idx + 1);
  }, [idx, n, startSlide]);

  const goPrev = useCallback(() => {
    if (idx <= 0) return;
    startSlide('prev', idx - 1);
  }, [idx, startSlide]);

  const onDotActivate = useCallback(
    (i) => {
      if (navigationLocked || slide || animLock.current) return;
      if (i === idx) return;
      startSlide(i > idx ? 'next' : 'prev', i);
    },
    [navigationLocked, idx, slide, startSlide],
  );

  const onViewportTouchStart = useCallback(
    (e, blocked) => {
      if (blocked || slide || animLock.current) return;
      if (e.target.closest('button, a, [role="button"]')) return;
      touchStart.current = e.touches[0].clientX;
    },
    [slide],
  );

  const onViewportTouchEnd = useCallback(
    (e, blocked) => {
      const start = touchStart.current;
      touchStart.current = null;
      if (start === null || slide || blocked) return;
      const end = e.changedTouches[0]?.clientX;
      if (end === undefined) return;
      const dx = end - start;
      if (Math.abs(dx) < CAROUSEL_EDGE) return;
      if (dx < 0) goNext();
      else goPrev();
    },
    [slide, goNext, goPrev],
  );

  const onViewportTouchCancel = useCallback(() => {
    touchStart.current = null;
  }, []);

  useEffect(() => {
    if (n === 0 && open) onClose();
  }, [n, open, onClose]);

  const current = list[idx] ?? null;
  const entering = slide ? list[slide.enterIdx] : null;

  return {
    list,
    n,
    idx,
    slide,
    current,
    entering,
    goNext,
    goPrev,
    onDotActivate,
    onViewportTouchStart,
    onViewportTouchEnd,
    onViewportTouchCancel,
    canNavigate: !slide && !animLock.current,
  };
}
