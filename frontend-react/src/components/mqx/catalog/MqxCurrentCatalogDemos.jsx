import { useState } from 'react';
import {
  MqxBoardButton, MqxChip, MqxProgress, MqxCapitalPageModeSeg,
  MqxSectionSeg, MqxFinListRow, MqxRowAction, MqxCapitalSheet, useMqxConfirm,
  AssetPositionMetrics, MqxDashboardHero, MqxNeedsDash, MqxFinancePeriodBlock,
  MqxGoalDash, MqxPeriodActions,
} from '../index';
import { CATALOG_LEGACY_GOAL_DEMO, CATALOG_VICTORY_DEMO } from './catalogVictoryDemo';

export function CurrentPrimitivesDemo() {
  const [notice, setNotice] = useState('Условный пример. Действия не меняют партию.');
  return <div className="mqx-catalog-current" data-catalog-demo="primitives">
    <p className="mqx-catalog__lead">BG-4 «Чернильный край»: фишки действий на поле, чернильная тень у нажатия.
      Прежний градиентный hero — история, не образец текущего дашборда.</p>
    <div className="mqx-stack">
      <button className="mqx-bg-btn mqx-bg-cta" type="button" onClick={() => setNotice('Показан пример главного действия «Завершить ход».')}>Завершить ход</button>
      <MqxBoardButton onClick={() => setNotice('Показана обычная кнопка.')} hint="Пример">Продолжить</MqxBoardButton>
      <MqxBoardButton disabled>Недоступное действие</MqxBoardButton>
      <MqxBoardButton variant="link" onClick={() => setNotice('Показано текстовое действие.')}>Назад</MqxBoardButton>
      <div className="mqx-catalog-current__row"><MqxChip>Тег</MqxChip></div>
      <p>Прогресс цели · 62%</p><MqxProgress value={62} aria-label="Прогресс цели: 62%" />
      <p role="status">{notice}</p>
    </div>
  </div>;
}

export function CurrentRowActionsDemo() {
  const [open, setOpen] = useState(false);
  const [owned, setOwned] = useState(true);
  const { confirm, dialog } = useMqxConfirm();
  async function remove() {
    if (await confirm({title:'Удалить актив?',message:'«Квартира под сдачу» будет снята с учёта в этом примере.'})) setOwned(false);
  }
  return <div className="mqx-catalog-current" data-catalog-demo="actions">
    <p className="mqx-catalog__lead">В окнах капитала — список A и глагол действия. Удаление требует подтверждения.
      «+» и корзина сохраняются в компактных строках; «−» — отдельный вариант, не главное удаление.</p>
    <MqxBoardButton onClick={() => setOpen(true)}>Открыть список имущества</MqxBoardButton>
    <MqxCapitalSheet open={open} onClose={() => setOpen(false)} title="Имущество · пример" titleId="catalog-actions-title" portal lockScroll sheetClassName="mqx-sheet--capital">
      <div className="mqx-fin-list">
        {owned ? <MqxFinListRow title="Квартира под сдачу"
          metrics={<AssetPositionMetrics assetValue={4200000} monthlyMaintenanceCost={12000} monthlyIncome={35000} />}
          trailing={<MqxRowAction variant="remove" verb="Удалить" ariaLabel="Удалить актив в примере" onClick={remove} />} />
          : <p role="status">Актив удалён из примера.</p>}
        <MqxFinListRow title="Шаблон: Квартира под сдачу" subtitle="Условная стоимость 4 200 000 ₽"
          trailing={<MqxRowAction variant="add" verb="Купить" ariaLabel="Купить актив в примере" disabled={owned} onClick={() => setOwned(true)} />} />
      </div>
    </MqxCapitalSheet>
    {dialog}
  </div>;
}

export function CurrentSectionSegDemo() {
  const [page, setPage] = useState('details');
  const [mode, setMode] = useState('add');
  return <div className="mqx-catalog-current" data-catalog-demo="segment">
    <p className="mqx-catalog__lead">Текущий сегмент страницы капитала — «Детали / Действия» (BG-4, шов).
      MqxSectionSeg — отдельный переключатель «Добавить / Мои» в списках имущества и обязательств.</p>
    <MqxCapitalPageModeSeg mode={page} onModeChange={setPage} />
    {['details','actions'].map(value => <div key={value} id={`capital-panel-${value}`} role="tabpanel" aria-labelledby={`capital-tab-${value}`} hidden={page !== value}>
      <p>{value === 'details' ? 'Детали: доходы, расходы и позиции.' : 'Действия: покупки и оформление.'}</p>
    </div>)}
    <MqxSectionSeg mode={mode} onModeChange={setMode} addLabel="Добавить" mineLabel="Мои" mineCount={2} />
    <p role="status">{mode === 'add' ? 'Выбран каталог шаблонов для добавления.' : 'Выбраны мои позиции: 2.'}</p>
  </div>;
}

export function CurrentDashboardDemo() {
  const [claimed, setClaimed] = useState(false);
  const [notice, setNotice] = useState('Условные данные, действия работают только внутри примера.');
  return <div data-catalog-demo="dashboard">
    <p className="mqx-catalog__lead">BG-3: одна рамка на уровень. BG-4: «Чернильный край», карта K1.
      Зафиксировано 04.11.2026: шкалы 6 px без обводки; деньги и цель на поле без рамок; действия — заливки с нижней кромкой. Карта хода → потребности → деньги → цель → действия. Канон: design-lab/dashboard/current-page-round/.</p>
    <div className="mqx-catalog__board-demo mqx-tab-page mqx-tab-page--dash-unified mqx-tab-page--board">
      <div className="mqx-content mqx-tab-page__scroll"><div className="mqx-bg-stack">
        <MqxDashboardHero roleTitle="Студент" periodIndex={4} onCloseMonth={() => setNotice('Показано завершение хода. Реальная партия не меняется.')}
          pendingEventsCount={2} onOpenEvents={() => setNotice('В этом ходе два события.')}
          tip={{text:claimed ? 'Зарплата получена — можно планировать расходы' : 'Забери зарплату до конца хода',tone:'normal'}}
          closePreview={{charges:37500,after:49900+(claimed ? 62500 : 0),negative:false,defeat:false}} />
        <MqxNeedsDash needs={{comfort:70,status:45,social:60,health:80}} treatSelf={{available:true}}
          onHelp={() => setNotice('Потребности: комфорт, статус, связи и здоровье.')} onTreatSelf={() => setNotice('Показано действие «Порадовать себя».')} />
        <MqxFinancePeriodBlock templateKey="mq_game_basic_v1" cash={87400+(claimed ? 62500 : 0)} safety={45000} cushionPercent={60}
          income={{label:'Доходы за ход',value:64300}} outflow={37500} onFlowsNavigate={() => setNotice('Показан переход к потокам капитала.')} />
        <MqxGoalDash victory={CATALOG_VICTORY_DEMO} legacyGoal={CATALOG_LEGACY_GOAL_DEMO} />
        <MqxPeriodActions salaryHot={!claimed} salaryClaimed={claimed} salaryDisabled={claimed} salaryAmount={62500}
          onSalary={() => {setClaimed(true);setNotice('Зарплата получена: +62 500 ₽ в этом примере.');}}
          onContribute={() => setNotice('Показано действие «В подушку».')} onWithdraw={() => setNotice('Показано действие «Из подушки».')} onInvest={() => setNotice('Показано действие «Вложить».')} />
      </div></div>
    </div>
    <p role="status">{notice}</p>
    <MqxBoardButton variant="link" onClick={() => {setClaimed(false);setNotice('Пример сброшен.');}}>Сбросить пример дашборда</MqxBoardButton>
  </div>;
}
