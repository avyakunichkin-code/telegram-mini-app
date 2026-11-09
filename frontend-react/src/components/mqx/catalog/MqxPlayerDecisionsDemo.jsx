import { useState } from 'react';
import { MqxGoalDash } from '../layout/MqxGoalDash';
import { MqxNeedsDash } from '../layout/MqxNeedsDash';
import { EventChoiceButton } from '../events/EventChoiceButton';

export function MqxPlayerDecisionsDemo() {
  const [notice, setNotice] = useState('Синтетический пример. Игровая партия не меняется.');
  const goal = {key:'safety_6x',type:'safety_fund_months',title:'Запас на 6 ходов',enabled:true,available:true,met:false,progress:900000/1080000,detail:{target:1080000,current:900000}};
  return <div className="mqx-catalog-current" data-testid="player-decisions-demo">
    <h3>Последствия B · условные будущие варианты</h3>
    <EventChoiceButton choice={{id:1,title:'Поехать сейчас по кредитке',impacts:[],future_payments:{version:1,incomplete:false,payments:[{period_index:11,cash_delta:-150000,salary_fraction:.75,choice_path:['Погасить всё сразу']},{period_index:11,cash_delta:-80000,salary_fraction:.4,choice_path:['Платить частями']},{period_index:14,cash_delta:-90000,salary_fraction:.45,choice_path:['Платить частями','Понятно']}]}}} onPick={() => setNotice('Решение принято в демо.')} />
    <h3>Следующая цель A</h3>
    <MqxGoalDash victory={{goals:[goal],current_goal_key:goal.key,progression_mode:'chain'}} cash={260000} outflow={180000} onContribute={amount => setNotice(`Откроется перевод: ${amount} ₽.`)} />
    <h3>Потребности A</h3>
    <MqxNeedsDash needs={{comfort:32,status:6,social:45,health:28}} needsMeta={{model:'set_point',periods_to_zero_if_idle:{status:1}}} cash={260000} treatSelf={{available:true,options:[{id:'quiet_evening',title:'Тихий вечер',cost:16000,needs_delta:{status:7}}]}} onTreatSelf={() => setNotice('Откроется «Порадовать себя».')} onHelp={() => setNotice('Откроется помощь.')} />
    <p role="status">{notice}</p>
  </div>;
}
