import { useEffect, useRef, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { DashboardPremium } from '../src/components/DashboardPremium';
import { GameScreenLayout } from '../src/components/GameScreenLayout';
import { Monetka } from '../src/components/mqx/brand/Monetka';
import { EventChoiceImpacts } from '../src/components/mqx/events/EventChoiceImpacts';
import { IconHelpQuestion } from '../src/components/mqx/icons/MqxContextHelpIcons';
import { MqxButton } from '../src/components/mqx/primitives/MqxButton';
import suitcase from '../../design-lab/event-survey-review/assets/suitcase.webp';
import '../src/index.css';
import '../../design-lab/event-survey-review/styles.css';

const scale = [['Да', 'yes'], ['Частично', 'partly'], ['Нет', 'no']];
const surveySteps = [
  [['salary', 'Удалось получить зарплату?', scale], ['safety_transfer', 'Удалось пополнить подушку?', scale]],
  [['safety', 'Понятно, зачем нужна подушка?', scale], ['expense_buffer', 'Было понятно, сколько оставить на расходы?', scale]],
  [
    ['close', 'Удалось завершить ход?', scale],
    ['close_result', 'Понятно, что изменилось после хода?', scale],
    ['blocked', 'Был момент, когда не получилось продолжить?', [['Да', true], ['Нет', false]]],
  ],
  [
    ['difficulty', 'Насколько сложной показалась игра?', [['Легко', 'easy'], ['В самый раз', 'normal'], ['Сложно', 'hard']]],
    ['continue_playing', 'Хочется продолжить?', [['Да', 'yes'], ['Пока не знаю', 'unsure'], ['Нет', 'no']]],
  ],
];
const surveyIdentity = { profile_id: 1, survey_key: 'first_turns_v2' };

function Survey({ draft, state, onDraftChange, onSubmit, onLater, onClose }) {
  const [step, setStep] = useState(0);
  const heading = useRef(null);
  const { answers, comment } = draft;
  const submitted = state === 'submitted';
  const questions = surveySteps[step];
  const last = step === surveySteps.length - 1;
  const complete = questions.every(([key]) => Object.hasOwn(answers, key));

  useEffect(() => {
    heading.current.focus({ preventScroll: true });
  }, [step, submitted]);

  return <section className="review-sheet review-survey" aria-labelledby="survey-title">
    <header className="review-heading">
      <div>
        <h1 id="survey-title" ref={heading} tabIndex={-1} aria-describedby={submitted ? undefined : 'survey-step'}>
          {submitted ? 'Спасибо за ответы!' : 'Как прошли первые ходы?'}
        </h1>
        {!submitted && <p id="survey-step">Шаг {step + 1} из {surveySteps.length}</p>}
      </div>
      <div className="review-survey-mascot" aria-hidden="true">
        <Monetka pose={submitted ? 'joy' : 'think'} size={106} />
        {!submitted && <IconHelpQuestion className="review-mascot-question" size={20} />}
      </div>
    </header>
    {submitted ? <MqxButton variant="primary" stretched onClick={onClose}>Вернуться к игре</MqxButton> :
      <form className="review-form" onSubmit={(event) => {
        event.preventDefault();
        if (!complete) return;
        if (last) onSubmit({ ...surveyIdentity, answers, comment: comment.trim() });
        else setStep(step + 1);
      }}>
        {questions.map(([key, question, choices]) => <fieldset key={key} className="review-question">
          <legend>{question}</legend>
          <div className="review-options">
            {choices.map(([label, value]) => <label key={label}>
              <input type="radio" name={key} value={String(value)} checked={answers[key] === value}
                onChange={() => onDraftChange({ ...draft, answers: { ...answers, [key]: value } })} />
              <span>{label}</span>
            </label>)}
          </div>
        </fieldset>)}
        {last && <label className="review-comment">Что ещё хочется рассказать? <span>(необязательно)</span>
          <textarea maxLength={1000} rows={3} value={comment}
            onChange={(event) => onDraftChange({ ...draft, comment: event.target.value })} />
        </label>}
        <div className="review-actions">
          <MqxButton variant="secondary" onClick={() => step === 0 ? onLater() : setStep(step - 1)}>
            {step === 0 ? 'Позже' : 'Назад'}
          </MqxButton>
          <MqxButton variant="primary" type="submit" disabled={!complete}>
            {last ? 'Отправить' : 'Дальше'}
          </MqxButton>
        </div>
      </form>}
  </section>;
}

const eventOptions = [
  {
    title: 'Забронировать поездку',
    impacts: [{ kind: 'cash', delta: -5000 }],
    needsDelta: { social: 8 },
  },
  {
    title: 'Решить позже',
    needsDelta: { social: -3 },
  },
];

const dashboardOverview = {
  period_index: 9,
  starter_template_key: 'mq_game_basic_v1',
  cash_balance: 48000,
  safety_fund_balance: 20000,
  needs: { comfort: 72, status: 64, social: 65, health: 76 },
};

function EventPreview({ accent, choice, onChoose, onClose }) {
  const [selected, setSelected] = useState(eventOptions[0]);
  const focusTarget = useRef(null);
  useEffect(() => {
    focusTarget.current.focus({ preventScroll: true });
  }, [choice]);
  return <section className={`review-sheet review-event review-event--${accent}`} aria-labelledby="event-title">
    <header className="review-heading">
      <img className="review-suitcase" src={suitcase} alt="" width={96} height={96} />
      <h1 id="event-title" tabIndex={-1} ref={choice ? null : focusTarget}>Семейный отпуск</h1>
      <MqxButton className="review-close" variant="ghost" aria-label="Закрыть" onClick={onClose}>×</MqxButton>
    </header>
    <p className="review-description">Пора отдохнуть всей семьёй! Можно забронировать поездку сейчас. Если планы изменятся, при отмене может быть комиссия.</p>
    {choice ? <p tabIndex={-1} ref={focusTarget} className="review-current">Выбрано · {choice}</p> :
      <form className="review-choices" onSubmit={(event) => { event.preventDefault(); onChoose(selected.title); }}>
        <fieldset className="review-event-options" aria-label="Варианты решения">
          {eventOptions.map((option) => <label className="review-choice" key={option.title}>
            <input type="radio" name="event-choice" checked={selected === option} onChange={() => setSelected(option)} />
            <span className="review-choice-copy">
              <span>{option.title}</span>
              <EventChoiceImpacts impacts={option.impacts} needsDelta={option.needsDelta} />
            </span>
          </label>)}
        </fieldset>
        <MqxButton className="review-confirm" variant="primary" type="submit" stretched>Выбрать</MqxButton>
      </form>}
  </section>;
}

function panelFromHash() {
  return location.hash === '#survey' ? 'survey' : 'event';
}

function ReviewLab() {
  const [panel, setPanel] = useState(panelFromHash);
  const [accent, setAccent] = useState('gold');
  const [open, setOpen] = useState(true);
  const [choice, setChoice] = useState('');
  const [draft, setDraft] = useState({ answers: {}, comment: '' });
  const [surveyState, setSurveyState] = useState('pending');
  const reopen = useRef(null);

  useEffect(() => {
    function syncRoute() {
      show(panelFromHash());
    }
    window.addEventListener('hashchange', syncRoute);
    return () => window.removeEventListener('hashchange', syncRoute);
  }, []);

  useEffect(() => {
    if (!open) reopen.current.focus();
  }, [open]);

  function show(next) {
    setPanel(next);
    setChoice('');
    setOpen(true);
  }

  function navigate(next) {
    if (location.hash === `#${next}`) show(next);
    else location.hash = next;
  }

  function close() {
    setOpen(false);
  }

  return <div className="review-lab">
    <nav className="review-controls" aria-label="Экраны Design Lab">
      <MqxButton variant="secondary" onClick={() => navigate('event')} aria-pressed={panel === 'event'}>Карточка события</MqxButton>
      <MqxButton variant="secondary" onClick={() => navigate('survey')} aria-pressed={panel === 'survey'}>Опрос плейтеста</MqxButton>
      {panel === 'event' && <div className="review-palettes" role="group" aria-label="Акцент карточки">
        <MqxButton variant="ghost" onClick={() => setAccent('gold')} aria-pressed={accent === 'gold'}>Золото</MqxButton>
        <MqxButton variant="ghost" onClick={() => setAccent('purple')} aria-pressed={accent === 'purple'}>Фиолетовый</MqxButton>
      </div>}
    </nav>
    <div className={`review-board${open ? ' review-board--open' : ''}`}>
      <div className="review-game" aria-hidden="true" inert="">
        <GameScreenLayout>
          <DashboardPremium overview={dashboardOverview} pendingEventsCount={1} />
        </GameScreenLayout>
      </div>
      {!open && <div className="review-reopen">
        <MqxButton ref={reopen} variant="primary" onClick={() => show(panel)}>Открыть превью</MqxButton>
      </div>}
      {open && (panel === 'event'
        ? <EventPreview accent={accent} choice={choice} onChoose={setChoice} onClose={close} />
        : <Survey draft={draft} state={surveyState} onDraftChange={setDraft}
            onLater={() => { setSurveyState('dismissed'); close(); }}
            onSubmit={(response) => { setDraft(response); setSurveyState('submitted'); }}
            onClose={close} />)}
    </div>
  </div>;
}

createRoot(document.getElementById('root')).render(<ReviewLab />);
