function GoalPathLockIcon() {
  return (
    <svg className="mqx-goal-path__lock" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M7 11V8a5 5 0 0110 0v3M6 11h12v10H6V11z"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  );
}

function segmentDisplayStatus(step, index, chain, phase) {
  if (phase === 'gate' && index === chain.length - 1) return 'gate';
  return step.status;
}

function segmentNodeContent(status, index) {
  if (status === 'done') return '✓';
  if (status === 'gate') return <GoalPathLockIcon />;
  return String(index + 1);
}

/**
 * Горизонтальная тропа целей (свёрнутый аккордеон «Цель»).
 * @param {{ chain: Array<{ key: string, title: string, status: string }>, phase?: string, dense?: boolean, ariaLabel?: string }} props
 */
export function MqxGoalPathStepper({ chain, phase = 'active', dense = false, ariaLabel }) {
  if (!chain?.length) return null;

  return (
    <div
      className={`mqx-goal-path${dense ? ' mqx-goal-path--dense' : ''}`}
      role="group"
      aria-label={ariaLabel}
    >
      <div className="mqx-goal-path__track">
        {chain.map((step, index) => {
          const display = segmentDisplayStatus(step, index, chain, phase);
          return (
            <div
              key={step.key}
              className={`mqx-goal-path__segment mqx-goal-path__segment--${display}`}
            >
              <span className="mqx-goal-path__node" aria-hidden="true">
                {segmentNodeContent(display, index)}
              </span>
              <span className="mqx-goal-path__sr">{step.title}</span>
              {index < chain.length - 1 ? (
                <span className="mqx-goal-path__connector" aria-hidden="true" />
              ) : null}
            </div>
          );
        })}
      </div>
    </div>
  );
}
