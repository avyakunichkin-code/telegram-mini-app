import { MqxMonetkaDialogScreen } from '../../components/mqx/layout/MqxMonetkaDialogScreen';
import { MqxSaveKindPicker } from '../../components/mqx/layout/MqxSaveKindPicker';
import { MqxButton } from '../../components/mqx/primitives/MqxButton';

/**
 * Шаг 1: новая игра — выбор режима (Игра / План). Название сохранения — на шаге шаблонов.
 */
export function NewProfileKindScreen({ onChooseGame, onBack }) {
  return (
    <MqxMonetkaDialogScreen
      title="Новая игра!"
      subtitle={
        <>
          <p>
            <span className="mqx-voice-em">Игра</span> — попробуй себя в разных жизнях: от первой зарплаты до своей
            квартиры. Можно инвестировать, копить подушку и ловить финансовые сюрпризы.
          </p>
          <p>
            <span className="mqx-voice-em">План</span> скоро — свой бюджет с нуля, без готового сценария.
          </p>
        </>
      }
      titleId="mqx-new-game-kind-title"
    >
      <MqxSaveKindPicker
        className="mqx-monetka-flow__save-kind"
        sectionTitle="Режим игры"
        sectionTitleId="mqx-new-game-mode-heading"
        onSelectGame={onChooseGame}
      />

      <div className="pg-actions mqx-monetka-flow__actions">
        <MqxButton type="button" variant="secondary" stretched onClick={onBack} title="Вернуться в меню">
          Назад
        </MqxButton>
      </div>
    </MqxMonetkaDialogScreen>
  );
}
