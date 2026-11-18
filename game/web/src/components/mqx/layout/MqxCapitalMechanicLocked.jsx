/** Заглушка для раздела капитала, ещё не открытого цепочкой целей. */
export function MqxCapitalMechanicLocked({ hint }) {
  if (!hint) return null;
  return (
    <p className="mqx-capital-mechanic-locked" role="status">
      {hint}
    </p>
  );
}
