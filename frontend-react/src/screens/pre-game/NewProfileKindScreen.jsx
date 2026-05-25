import { MqxMonetkaDialogScreen } from '../../components/mqx/layout/MqxMonetkaDialogScreen';
import { MqxSaveKindPicker } from '../../components/mqx/layout/MqxSaveKindPicker';
import { MqxButton } from '../../components/mqx/primitives/MqxButton';

/**
 * Шаг 1: новая игра — выбор режима (Игра / План). Название сохранения — на шаге шаблонов.
 */
export function NewProfileKindScreen({ onChooseGame, onBack }) {
  return (
    <MqxMonetkaDialogScreen
      showBrand
      title="Новая игра!"
      subtitle={
        <p>
          В режиме <strong>Игра</strong> — симулятор: выбираешь жизненную ситуацию и проходишь месяцы с деньгами. В{' '}
          <strong>Плане</strong> — свой сценарий из реальных цифр (скоро).
        </p>
      }
      titleId="mqx-new-game-kind-title"
    >
      <MqxSaveKindPicker
        className="mqx-monetka-flow__save-kind"
        sectionTitle="Режим игры"
        sectionTitleId="mqx-new-game-mode-heading"
        onSelectGame={onChooseGame}
      />

      <div className="mqx-monetka-flow__actions">
        <MqxButton type="button" variant="secondary" stretched onClick={onBack} title="Вернуться в меню">
          Назад
        </MqxButton>
      </div>
    </MqxMonetkaDialogScreen>
  );
}
