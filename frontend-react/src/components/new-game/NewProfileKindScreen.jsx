import { Button, Input } from '@telegram-apps/telegram-ui';
import { showNotification } from '../notifications';
import { MqxShell } from '../MqxShell';
import { MqxTabHero } from '../MqxTabHero';
import { IllustrationGame, IllustrationPlan } from './icons/ModeIllustrations';

/**
 * Шаг 1: название сохранения + выбор типа (Game → дальше / Plan → заглушка).
 */
export function NewProfileKindScreen({ profileName, onProfileNameChange, onChooseGame, onChoosePlan, onBack }) {
  const requireName = () => {
    const name = profileName.trim();
    if (!name) {
      showNotification('Введите название сохранения', 'error');
      return null;
    }
    return name;
  };

  const handleGame = () => {
    const name = requireName();
    if (name) onChooseGame(name);
  };

  const handlePlan = () => {
    const name = requireName();
    if (name) onChoosePlan(name);
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
            <button type="button" className="mq-profile-mode-card mq-profile-mode-card--game" onClick={handleGame}>
              <IllustrationGame className="mq-profile-mode-card__art mq-profile-mode-card__art--game" />
              <span className="mq-profile-mode-card__title">Игра</span>
              <span className="mq-profile-mode-card__desc">Симулятор с шаблонами и событиями периода.</span>
            </button>

            <button type="button" className="mq-profile-mode-card mq-profile-mode-card--plan" onClick={handlePlan}>
              <IllustrationPlan className="mq-profile-mode-card__art mq-profile-mode-card__art--plan" />
              <span className="mq-profile-mode-card__title">План</span>
              <span className="mq-profile-mode-card__desc">Свои цифры и статьи без игровых шаблонов.</span>
            </button>
          </div>

          <p className="mq-profile-mode-footnote">
            В «Плане» вы задаёте бюджет жизни вручную. В «Игре» старт только из каталога шаблонов.
          </p>
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
