import { PRECISION_LABELS } from '../../precision.js'

export default function PrecisionStatus({ estimate }) {
  return <div className="precision-status"><span className="precision-pill" data-level={estimate.level} role="status" aria-label={`Оценка денежных данных: ${PRECISION_LABELS[estimate.level]}`}>{PRECISION_LABELS[estimate.level]}</span><details><summary>Что означает точность</summary><p>Это оценка заполнения денежных данных, не вероятность прогноза. Большие суммы влияют сильнее. Пустой раздел не означает, что его проверили.</p>{!estimate.invalid && estimate.total > 0 && <p>Доля уточнённых сумм — {Math.round(estimate.share * 100)} %. Небольшой разброс тоже считается уточнённой суммой. Оценённые по платежу кредиты снижают долю.</p>}<p>Оценка по текущему вводу · ещё не отчёт.</p></details></div>
}
