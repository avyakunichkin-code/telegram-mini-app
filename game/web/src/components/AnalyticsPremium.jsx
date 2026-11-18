import { useEffect, useState } from 'react';
import { API, ApiError, formatApiErrorDetail } from '../api';
import { MqxAnalyticsPage } from './mqx/layout/MqxAnalyticsPage';

function useAnalyticsTimeseries(overview) {
  const [state, setState] = useState({ ts: null, error: null });
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    let cancelled = false;
    setState({ ts: null, error: null });
    API.getFinanceAnalyticsTimeseries(48)
      .then((ts) => !cancelled && setState({ ts, error: null }))
      .catch((e) => {
        if (cancelled) return;
        const msg =
          e instanceof ApiError
            ? formatApiErrorDetail(e.detail, e.message)
            : formatApiErrorDetail(e?.detail ?? e?.message, 'Не удалось загрузить историю');
        setState({ ts: null, error: msg });
      });
    return () => {
      cancelled = true;
    };
  }, [overview?.period_index, overview?.cash_balance, overview?.safety_fund_balance, attempt]);

  return { ...state, retry: () => setAttempt((n) => n + 1) };
}

export function AnalyticsPremium({ overview }) {
  const { ts, error, retry } = useAnalyticsTimeseries(overview);

  return (
    <MqxAnalyticsPage
      cash={Number(overview.cash_balance) || 0}
      reserve={Number(overview.safety_fund_balance) || 0}
      income={Number(overview.total_monthly_income) || 0}
      expenses={Number(overview.total_monthly_outflow) || 0}
      charges={overview.period_close_preview?.estimated_charges_total ?? undefined}
      turn={Number(overview.period_index) || 1}
      history={ts?.points}
      historyError={error}
      retry={retry}
    />
  );
}
