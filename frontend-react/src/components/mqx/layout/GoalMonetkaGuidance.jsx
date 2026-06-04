import { MonetkaAvatar } from '../brand/MonetkaAvatar';
import { guidanceForGoal } from '../utils/goalGuidanceCopy';

function GuidanceParagraph({ parts }) {
  if (!parts?.length) return null;
  return (
    <p className="mqx-goal-monetka__text">
      {parts.map((part, i) =>
        part.highlight != null ? (
          <strong key={i}>{part.highlight}</strong>
        ) : (
          <span key={i}>{part.text ?? ''}</span>
        ),
      )}
    </p>
  );
}

/** @param {{ goal: object|null, view: object }} props */
export function GoalMonetkaGuidance({ goal, view }) {
  const copy = guidanceForGoal(goal, view);

  return (
    <div className="mqx-goal-monetka">
      <div className="mqx-goal-monetka__inner">
        <MonetkaAvatar size={44} className="mqx-goal-monetka__img" />
        <div className="mqx-goal-monetka__bubble">
          <h4 className="mqx-goal-monetka__title">Давай, помогу разобраться</h4>
          <GuidanceParagraph parts={copy.lead} />
          {copy.tips.length > 0 ? (
            <ul className="mqx-goal-monetka__tips">
              {copy.tips.map((tip) => (
                <li key={tip}>{tip}</li>
              ))}
            </ul>
          ) : null}
        </div>
      </div>
    </div>
  );
}
