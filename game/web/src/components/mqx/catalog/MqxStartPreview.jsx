import { useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { MqxStartFlow } from '../pregame/MqxStartFlow';
import { roles, screens } from '../pregame/startFlowData';

const SAVE = { id: 1, name: 'Моя игра', starter_template_key: roles[0].templateKey, period_index: 2, cash_balance: 21000 };

export function MqxStartPreview() {
  const [params, setParams] = useSearchParams();
  const state = params.get('state');
  const screen = Object.hasOwn(screens, state) || state === 'game' ? state : 'welcome';
  const [role, setRole] = useState(roles[0]);
  const move = (state) => setParams({ state });
  const begin = () => {
    setRole(roles[0]);
    move('intro');
  };

  return (
      <MqxStartFlow
        screen={screen} role={role} setRole={setRole} move={move} begin={begin}
        profiles={['saved', 'returning', 'saves'].includes(screen) ? [SAVE] : []}
        onAuth={() => move(screen === 'register' ? 'empty' : 'saved')}
        onLogout={() => move('welcome')}
        onNewGame={screen === 'empty' ? begin : () => move('roles')}
        onLoadGame={() => move('game')}
        onStartRole={() => move('intro')}
        onEnterGame={() => move('game')}
        onBack={() => move(['roles', 'saves'].includes(screen) ? 'saved' : 'welcome')}
        footer={(
          <nav className="start-lab__states" aria-label="Состояния Design Lab">
            <Link to="/dev/mqx">Каталог MQX</Link>
            {Object.entries(screens).map(([key, label]) => (
              <Link key={key} to={`?state=${key}`} aria-current={screen === key ? 'page' : undefined}>{label}</Link>
            ))}
          </nav>
        )}
      />
  );
}
