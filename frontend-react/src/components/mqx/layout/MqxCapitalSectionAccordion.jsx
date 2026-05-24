/**
 * Секция страницы «Управление капиталом» — один <details>.
 * tone: 'in' | 'out' | null (нейтральный ч/б)
 */
export function MqxCapitalSectionAccordion({
  title,
  meta,
  tone = null,
  open,
  defaultOpen = false,
  sectionId,
  children,
}) {
  const toneClass = tone ? `mqx-cap-sect--${tone}` : 'mqx-cap-sect--neutral';
  const openAttr = open !== undefined ? open : defaultOpen || undefined;

  return (
    <details id={sectionId} className={`mqx-cap-sect ${toneClass}`} open={openAttr}>
      <summary className="mqx-cap-sect__head">
        <span className="mqx-cap-sect__title">{title}</span>
        {meta != null && meta !== '' ? (
          <span className="mqx-cap-sect__meta">{meta}</span>
        ) : null}
      </summary>
      <div className="mqx-cap-sect__body">{children}</div>
    </details>
  );
}
