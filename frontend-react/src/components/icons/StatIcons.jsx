/** Обёртки аналитики — канон в `FinanceMetricIcons`, здесь только tone-классы. */
import {
  IconMetricFlow,
  IconMetricGoal,
  IconMetricOverdue,
  IconMetricPercent,
  IconMetricShield,
  IconMetricWallet,
} from '../mqx/icons/FinanceMetricIcons';

function statWrap(className, Icon) {
  return function StatIcon({ size = 18 }) {
    return (
      <span className={className} aria-hidden style={{ display: 'inline-flex' }}>
        <Icon size={size} />
      </span>
    );
  };
}

export const IconWalletStat = statWrap('mq-stat-ico', IconMetricWallet);
export const IconShieldStat = statWrap('mq-stat-ico mq-stat-ico--muted', IconMetricShield);
export const IconFlowStat = statWrap('mq-stat-ico mq-stat-ico--emerald', IconMetricFlow);
export const IconOverdueStat = statWrap('mq-stat-ico mq-stat-ico--danger', IconMetricOverdue);
export const IconGoalStat = statWrap('mq-stat-ico mq-stat-ico--emerald', IconMetricGoal);
/** @deprecated используйте IconGoalStat для статуса победы */
export const IconPercentStat = IconGoalStat;
