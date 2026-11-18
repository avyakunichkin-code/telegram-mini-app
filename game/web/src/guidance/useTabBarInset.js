import { useEffect } from 'react';

/**
 * Пишет --mqx-tabbar-measured с реальной высотой .bottom-nav (tab bar в потоке).
 */
export function useTabBarInset() {
  useEffect(() => {
    const el = document.querySelector('.mq-game-shell .bottom-nav');
    if (!el) return undefined;

    const apply = () => {
      const h = Math.ceil(el.getBoundingClientRect().height);
      document.documentElement.style.setProperty('--mqx-tabbar-measured', `${h}px`);
    };

    apply();
    const ro = new ResizeObserver(apply);
    ro.observe(el);
    window.addEventListener('resize', apply);
    window.visualViewport?.addEventListener('resize', apply);

    return () => {
      ro.disconnect();
      window.removeEventListener('resize', apply);
      window.visualViewport?.removeEventListener('resize', apply);
      document.documentElement.style.removeProperty('--mqx-tabbar-measured');
    };
  }, []);
}
