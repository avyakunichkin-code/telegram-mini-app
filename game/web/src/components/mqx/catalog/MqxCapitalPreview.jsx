import { DEPOSIT_ANNUAL_RATE_PERCENT, BOND_ANNUAL_RATE_PERCENT } from '../../../constants/investProducts';
import { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { GameScreenLayout, GameScreenTabNav } from '../../GameScreenLayout';
import { MqxCapitalPage } from '../layout/MqxCapitalPage';
import { CapitalDetailsPanel } from '../layout/CapitalDetailsPanel';
import { CapitalActionsPanel } from '../layout/CapitalActionsPanel';

const overview = {
  period_index: 8,
  cash_balance: 42000,
  salary: { monthly_amount: 34767 },
  monthly_burn_total: 30000,
};
const initialPositions = [
  { id: 1, kind: 'deposit', title: 'Вклад', principal: 20000, annual_rate_percent: DEPOSIT_ANNUAL_RATE_PERCENT },
];
const sections = {
  invest: 'open', insurance: 'open', property: 'open', liabilities: 'open', car: 'open', mortgage: 'open',
};
const empty = [];

export function MqxCapitalPreview({ desktopParty } = {}) {
  const currentOverview = desktopParty ? { ...overview, cash_balance: desktopParty.cash, period_index: desktopParty.turn, salary: { monthly_amount: 35000 } } : overview;
  const [params] = useSearchParams();
  const locked = params.get('state') === 'locked';
  const visibleSections = locked ? { ...sections, insurance: 'locked', property: 'locked', car: 'locked', liabilities: 'locked', mortgage: 'locked' } : sections;
  const [mode, setMode] = useState(locked ? 'actions' : 'details');
  const [sheet, setSheet] = useState(null);
  const [localPositions, setPositions] = useState(initialPositions);
  const positions = desktopParty ? desktopParty.positions : localPositions;
  const [deposit, setDeposit] = useState(0);
  const [bond, setBond] = useState(0);
  const [notice, setNotice] = useState('');
  const gotoAction = (action) => {
    setMode('actions');
    setSheet(action);
  };
  const mockPurchase = (kind) => {
    if (desktopParty && kind) desktopParty.onInvest(kind, kind === 'deposit' ? deposit : bond);
    setSheet(null);
    setNotice('Действие выполнено в превью');
  };

  return (
    <GameScreenLayout
      moodClass="mq-game-shell--menu"
      tabNav={<GameScreenTabNav activeTab="finance" setActiveTab={() => {}} />}
    >
      <div className="mqx-screen mqx-screen--game">
        <div className="mqx-frame">
          <div className="mq-stack mq-stack-animate mq-stack--tight mq-stack--game-tab">
            <div className="mq-enter-item mq-enter-item--fill">
              <MqxCapitalPage overview={currentOverview} investPositions={positions} policies={empty} mode={mode} onModeChange={setMode}>
                {mode === 'details' ? (
                  <CapitalDetailsPanel
                    sections={visibleSections}
                    investPositions={positions}
                    policies={empty}
                    ownedAssets={empty}
                    ownedLiabilities={empty}
                    maxCash={currentOverview.cash_balance}
                    onCloseInvest={desktopParty ? desktopParty.onClose : (id) => setPositions((rows) => rows.filter((row) => row.id !== id))}
                    onGotoAction={gotoAction}
                    investmentChips
                  />
                ) : (
                  <CapitalActionsPanel
                    sections={visibleSections}
                    assetTemplates={empty}
                    liabilityTemplates={empty}
                    openSheet={sheet}
                    onOpenSheet={setSheet}
                    onCloseSheet={() => setSheet(null)}
                    depositAmount={deposit}
                    bondAmount={bond}
                    maxCash={currentOverview.cash_balance}
                    depositRate={DEPOSIT_ANNUAL_RATE_PERCENT}
                    bondRate={BOND_ANNUAL_RATE_PERCENT}
                    onDepositAmountChange={setDeposit}
                    onBondAmountChange={setBond}
                    onOpenDeposit={() => mockPurchase('deposit')}
                    onOpenBond={() => mockPurchase('bond')}
                    onBuyInsurance={() => mockPurchase()}
                  />
                )}
              </MqxCapitalPage>
            </div>
          </div>
        </div>
      </div>
      <div className="mqx-menu-preview__notice" role="status">{notice}</div>
    </GameScreenLayout>
  );
}
