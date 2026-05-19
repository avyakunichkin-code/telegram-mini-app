import { Button, Input } from '@telegram-apps/telegram-ui';
import { showNotification } from '../notifications';
import { MonetkaBubbleScreen } from '../mqx/layout/MonetkaBubbleScreen';
import { IllustrationGame, IllustrationPlan } from './icons/ModeIllustrations';

/**
 * Шаг 1: название сохранения + выбор типа (Игра / План).
 * Игра → экран шаблонов; План — скоро.
 */
export function NewProfileKindScreen({
  profileName,
  onProfileNameChange,
  onChooseGame,
  onBack,
}) {
  const handleGame = () => {
    const name = profileName.trim();
    if (!name) {
      showNotification('Введите название сохранения', 'error');
      return;
    }
    onChooseGame(name);
  };

  return (
    <MonetkaBubbleScreen
      title="Интересно, как назовём эту партию?"
      subtitle="Напишите название слота. Симулятор — кнопка «Игра», сценарии откроются следом."
      titleId="mqx-new-game-kind-title"
      bubbleClassName="mqx-auth-monetka__bubble--wide"
    >
      <div className="mqx-form mqx-auth-monetka__form">
        <Input
          id="new-game-profile-name"
          name="profile_name"
          header="Название сохранения"
          value={profileName}
          onChange={(e) => onProfileNameChange(e.target.value)}
          placeholder="Например: учебный слот"
          autoComplete="off"
          required
        />
      </div>

      <div
        className="mq-profile-mode-grid mqx-auth-monetka__mode-grid"
        role="group"
        aria-label="Выбор режима сохранения"
      >
        <button
          type="button"
          className="mq-profile-mode-card mq-profile-mode-card--game"
          title="Симулятор с готовым сценарием и подсказками в игре"
          aria-label="Режим Игра — выбрать сценарий на следующем шаге"
          onClick={handleGame}
        >
          <IllustrationGame className="mq-profile-mode-card__art mq-profile-mode-card__art--game" />
          <span className="mq-profile-mode-card__title">Игра</span>
          <span className="mq-profile-mode-card__desc">Симулятор с шаблонами и событиями.</span>
        </button>

        <div
          className="mq-profile-mode-card mq-profile-mode-card--plan mq-profile-mode-card--soon"
          role="status"
          aria-label="Режим План скоро будет доступен"
        >
          <span className="mq-profile-mode-card__badge mq-profile-mode-card__badge--soon">Скоро</span>
          <IllustrationPlan className="mq-profile-mode-card__art mq-profile-mode-card__art--plan" />
          <span className="mq-profile-mode-card__title">План</span>
          <span className="mq-profile-mode-card__desc">Свои цифры и статьи расходов.</span>
        </div>
      </div>

      <div className="mqx-auth-monetka__actions">
        <Button type="button" mode="outline" stretched onClick={onBack} title="Вернуться в меню">
          Назад
        </Button>
      </div>
    </MonetkaBubbleScreen>
  );
}
