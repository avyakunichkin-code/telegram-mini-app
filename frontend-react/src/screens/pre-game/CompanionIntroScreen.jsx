import { useEffect, useRef } from 'react';
import { MqxCompanionCard } from '../../components/mqx/brand/MqxCompanionCard';

/**
 * Знакомство с напарником ★ companions-round B (PO 2026-11-02): экран между выбором жизни
 * (или авто-стартом за Студента) и первым ходом. Монетка передаёт эстафету — первые шаги ведёт напарник.
 */
export function CompanionIntroScreen({ templateKey, onStart }) {
  const ctaRef = useRef(null);

  useEffect(() => {
    ctaRef.current?.focus();
  }, []);

  return (
    <div className="mqx-pg">
      <MqxCompanionCard templateKey={templateKey} titleId="mqx-companion-intro-title" />
      <button ref={ctaRef} type="button" className="mqx-bg-btn mqx-bg-cta mqx-pg-cta" onClick={onStart}>
        Начать первый ход
      </button>
    </div>
  );
}
