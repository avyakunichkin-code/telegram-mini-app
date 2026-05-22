import { Button } from '@telegram-apps/telegram-ui';
import { MqxMonetkaDialogScreen } from '../mqx/layout/MqxMonetkaDialogScreen';
import { MqxSaveKindPicker } from '../mqx/layout/MqxSaveKindPicker';

/**
 * Шаг 1: новая игра — выбор режима (Игра / План). Имя партии — на шаге шаблонов.
 */
export function NewProfileKindScreen({ onChooseGame, onBack }) {
  return (
    <MqxMonetkaDialogScreen
      title="Новая игра!"
      subtitle={
        <p>
          Я слышала, что в режиме <strong>Игра</strong> можно выбирать различные жизненные ситуации, а в режиме{' '}
          <strong>План</strong> будет что-то очень интересное
        </p>
      }
      titleId="mqx-new-game-kind-title"
    >
      <MqxSaveKindPicker
        className="mqx-monetka-flow__save-kind"
        sectionTitle="Режим игры"
        sectionTitleId="mqx-new-game-mode-heading"
        onSelectGame={onChooseGame}
        gameDesc=""
        planDesc=""
      />

      <div className="mqx-monetka-flow__actions">
        <Button type="button" mode="outline" stretched onClick={onBack} title="Вернуться в меню">
          Назад
        </Button>
      </div>
    </MqxMonetkaDialogScreen>
  );
}
