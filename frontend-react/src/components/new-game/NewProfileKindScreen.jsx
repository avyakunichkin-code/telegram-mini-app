import { Button, Input, Spinner } from '@telegram-apps/telegram-ui';
import { showNotification } from '../notifications';
import { MqxShell } from '../MqxShell';
import { MqxTabHero } from '../MqxTabHero';
import { IllustrationGame, IllustrationPlan } from './icons/ModeIllustrations';

/**
 * Шаг 1: название сохранения + выбор типа.
 * Game → автостарт простейшего шаблона (`startGameWithSimplestTemplate`); Plan → скоро.
 */
export function NewProfileKindScreen({ profileName, onProfileNameChange, onChooseGame, onBack, startingGame = false }) {
  const handleGame = () => {
    const name = profileName.trim();
    if (!name) {
      showNotification('Введите название сохранения', 'error');
      return;
    }
    onChooseGame(name);
  };

  return (
    <MqxShell
      header={
        <MqxTabHero
          sectionLabel="Новая игра"
          rightPill="Шаг 1"
          title="Сохранение"
          subtitle="Назовите слот и выберите тип: симулятор с шаблонами или личный план."
        />
      }
    >
      <div className="mq-stack mq-stack--tight mq-stack-animate">
        <div className="mq-enter-item mqx-card">
          <div className="mqx-card__kicker">Имя</div>
          <div className="mqx-card__title">Как назовём профиль?</div>
          <div className="mqx-card__sub">Это видно в списке сохранений.</div>

          <div className="mqx-form" style={{ marginTop: 14 }}>
            <Input
              header="Название сохранения"
              value={profileName}
              onChange={(e) => onProfileNameChange(e.target.value)}
              placeholder="Например: учебный слот"
              autoComplete="off"
              required
            />
          </div>
        </div>

        <div className="mq-enter-item mqx-card">
          <div className="mqx-card__kicker">Тип</div>
          <div className="mqx-card__title">Режим</div>
          <div className="mqx-card__sub">Игра — готовые сценарии. План — свои цифры и статьи расходов.</div>

          <div className="mq-profile-mode-grid" role="group" aria-label="Выбор режима сохранения">
            <button
              type="button"
              className="mq-profile-mode-card mq-profile-mode-card--game"
              disabled={startingGame}
              title="Симулятор с готовым сценарием и обучением Монетки"
              aria-label="Режим Игра"
              onClick={handleGame}
            >
              <IllustrationGame className="mq-profile-mode-card__art mq-profile-mode-card__art--game" />
              <span className="mq-profile-mode-card__title">Игра</span>
              <span className="mq-profile-mode-card__desc">Симулятор с шаблонами и событиями периода.</span>
            </button>

            <div
              className="mq-profile-mode-card mq-profile-mode-card--plan mq-profile-mode-card--soon"
              role="status"
              aria-label="Режим План скоро будет доступен"
            >
              <span className="mq-profile-mode-card__badge mq-profile-mode-card__badge--soon">Скоро</span>
              <IllustrationPlan className="mq-profile-mode-card__art mq-profile-mode-card__art--plan" />
              <span className="mq-profile-mode-card__title">План</span>
              <span className="mq-profile-mode-card__desc">Свои цифры и статьи без игровых шаблонов.</span>
            </div>
          </div>

          <p className="mq-profile-mode-footnote">
            Режим «Игра» сразу запускает самый простой сценарий. Чтобы задать всё вручную — дождитесь «План».
          </p>
          {startingGame ? (
            <div style={{ display: 'flex', justifyContent: 'center', paddingTop: 12 }}>
              <Spinner />
            </div>
          ) : null}
        </div>

        <div className="mq-enter-item mq-actions-stack">
          <Button type="button" mode="outline" stretched onClick={onBack}>
            Назад
          </Button>
        </div>
      </div>
    </MqxShell>
  );
}
