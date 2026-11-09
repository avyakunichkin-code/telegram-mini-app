import { PersonaPortrait } from '../brand/PersonaPortrait';
import { PersonaCompanion } from '../brand/PersonaCompanion';
import { MonetkaAvatar } from '../brand/MonetkaAvatar';
import { KvityaMascot } from '../brand/KvityaMascot';
import { MONETKA_POSES, KVITYA_POSES } from '../brand/guideMascots';

const POSE_LABELS = {welcome:'Приветствие',wink:'Поддержка',surprised:'Удивление',think:'Размышление',joy:'Радость',worried:'Внимание к риску',victory:'Победа',default:'Обычные итоги'};
const COIN_CONTEXT = {welcome:'Начало хода и приветствие',wink:'Подсказка о ходе',surprised:'Карточка события',think:'Разобраться в решении',joy:'Радость от результата',worried:'Предупреждение о зарплате',victory:'Победа'};
const RECEIPT_LABELS = {default:'Обычные итоги · баланс без изменений',joy:'Итог в плюс · баланс вырос',think:'Сверить строки · баланс снизился'};

const PAIRS = [
  ['mq_game_basic_v1', 'Студент', 'Студбилет'],
  ['mq_game_tight_budget_v1', 'Профессионал', 'Зарплатная карта'],
  ['mq_game_mortgage_stress_v1', 'Руководитель', 'Портфель'],
  ['mq_game_debt_stack_v1', 'Предприниматель', 'Смартфон'],
];

export function MqxMascotsCatalogDemo() {
  return (
    <>
      <p className="mqx-catalog__lead">
        ★ B «Мягкий объём», утверждён 03.11.2026. Портреты подключены в игровых экранах.
        Напарники доступны как отдельный компонент; голос и поток онбординга сохраняются.
      </p>
      <div className="mqx-catalog-mascots">
        {PAIRS.map(([key, name, mate]) => (
          <figure key={key} className="mqx-catalog-mascots__card">
            <div className="mqx-catalog-mascots__pair">
              <PersonaPortrait templateKey={key} size="dash" />
              <PersonaCompanion templateKey={key} size="pick" decorative />
            </div>
            <figcaption><b>{name}</b><span>Напарник — {mate.toLowerCase()}</span></figcaption>
            <div className="mqx-catalog-mascots__sizes" aria-label="Маленькие размеры">
              <PersonaPortrait templateKey={key} size="avatar" />
              <PersonaPortrait templateKey={key} size="pick" />
              <PersonaPortrait templateKey={key} size="md" />
              <PersonaCompanion templateKey={key} size="md" />
            </div>
          </figure>
        ))}
      </div>
      <h3>Монетка и Квитя · A «Чистый объём»</h3>
      <p>Чистый обод без надписей и номинала. Ситуацию объясняет текст рядом.
        Монетка — наставница; Квитя — помощник в итогах хода. Это статичные состояния.</p>
      <div className="mqx-catalog-mascots__sizes" aria-label="Монетка: лицо в маленьком размере и полная фигура">
        {[24, 40, 48, 72].map(size => <div key={size}>
          <MonetkaAvatar size={size} />
          <span>{size} px</span>
        </div>)}
      </div>
      <div className="mqx-guide-mascots">
        {MONETKA_POSES.map(pose => <figure key={pose}><MonetkaAvatar pose={pose} size={108} full /><figcaption>{POSE_LABELS[pose]}<p>{COIN_CONTEXT[pose]}</p></figcaption></figure>)}
        {KVITYA_POSES.map(pose => <figure key={pose}><KvityaMascot pose={pose} size={108} /><figcaption>{RECEIPT_LABELS[pose]}</figcaption></figure>)}
      </div>
      <p>В игре подключены приветствие, подмигивание, удивление и тревога Монетки.
        Остальные позы доступны в компоненте. Квитя выбирает состояние по изменению баланса;
        суммы и строки итогов остаются текстом.</p>
    </>
  );
}
