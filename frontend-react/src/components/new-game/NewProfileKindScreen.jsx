import { Button, Input } from '@telegram-apps/telegram-ui';
import { showNotification } from '../notifications';
import { MqxMonetkaDialogScreen } from '../mqx/layout/MqxMonetkaDialogScreen';
import { MqxSaveKindPicker } from '../mqx/layout/MqxSaveKindPicker';

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
    <MqxMonetkaDialogScreen
      title="О, новое сохранение!"
      subtitle={
        <>
          <p>
            Слот уже подписан — можешь переименовать, я не обижусь. Дальше выбери режим.
          </p>
          <p>
            <strong>Игра</strong> — я кидаю тебя в разные жизненные ситуации: зарплата, сюрпризы, цели.
            Щёлкни «Игра» — на следующем шаге выберем сценарий.
          </p>
          <p>
            <strong>План</strong> пока допиливают… но обещают что-то интересненькое — я сама жду!
          </p>
        </>
      }
      titleId="mqx-new-game-kind-title"
    >
      <div className="mqx-form mqx-monetka-flow__form">
        <Input
          id="new-game-profile-name"
          name="profile_name"
          header="Название сохранения"
          value={profileName}
          onChange={(e) => onProfileNameChange(e.target.value)}
          autoComplete="off"
          required
        />
      </div>

      <MqxSaveKindPicker
        className="mqx-monetka-flow__save-kind"
        onSelectGame={handleGame}
        gameTitle="Игра"
        gameDesc="Разные жизни и сюрпризы — мой режим"
        planTitle="План"
        planDesc="Ещё в работе — обещают интересненькое"
      />

      <div className="mqx-monetka-flow__actions">
        <Button type="button" mode="outline" stretched onClick={onBack} title="Вернуться в меню">
          Назад
        </Button>
      </div>
    </MqxMonetkaDialogScreen>
  );
}
