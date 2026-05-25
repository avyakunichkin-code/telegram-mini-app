// src/hooks/useGame.js
import { useState, useEffect, useCallback, useRef } from 'react';
import { API, ApiError, formatApiErrorDetail } from '../api';
import {
  notifyAchievementUnlocks,
  notifyPeriodCloseRewards,
} from '../utils/progressionToasts';
import { showNotification } from '../components/notifications';
import { subscribeAppForeground, debounceForeground } from '../utils/appLifecycle';

const FOREGROUND_RESYNC_MS = 400;

function parsePendingEvents(eventPayload) {
  if (!eventPayload) return [];
  if (Array.isArray(eventPayload.events)) return eventPayload.events;
  return eventPayload.event ? [eventPayload.event] : [];
}

export function useGame() {
  const [overview, setOverview] = useState(null);
  const [timeStatus, setTimeStatus] = useState(null);
  const [periodStatus, setPeriodStatus] = useState(null);
  const [pendingEvents, setPendingEvents] = useState([]);
  /** Увеличивается только при загрузке/смене периода при наличии незакрытых событий (не после каждого выбора). */
  const [eventsPromptTick, setEventsPromptTick] = useState(0);
  const [loading, setLoading] = useState(true);
  /** Фоновое обновление после действий — без полноэкранного спиннера. */
  const [syncing, setSyncing] = useState(false);
  const [error, setError] = useState(null);
  const [periodCloseSummary, setPeriodCloseSummary] = useState(null);

  const periodIndexRef = useRef(null);
  const periodEndInFlightRef = useRef(false);
  const loadingRef = useRef(true);

  const applyBootstrapPayload = useCallback((data, { bumpEvents = false, updateTime = true } = {}) => {
    setOverview(data.overview);
    if (updateTime && data.time) {
      setTimeStatus(data.time);
      periodIndexRef.current = data.time.period_index ?? null;
    }
    setPeriodStatus(data.period);
    const evList = parsePendingEvents(data.events);
    setPendingEvents(evList);
    if (bumpEvents && evList.length > 0) setEventsPromptTick((t) => t + 1);
    if (data.overview?.newly_unlocked?.length) {
      notifyAchievementUnlocks(data.overview.newly_unlocked);
    }
    return data;
  }, []);

  /** Один round-trip: overview + period + events (+ time). После мутаций в игре. */
  const refreshGameState = useCallback(async (opts) => {
    setSyncing(true);
    try {
      const data = await API.getGameBootstrap();
      applyBootstrapPayload(data, opts);
      return data;
    } finally {
      setSyncing(false);
    }
  }, [applyBootstrapPayload]);

  const loadData = useCallback(async () => {
    setLoading(true);
    loadingRef.current = true;
    try {
      const data = await API.getGameBootstrap();
      applyBootstrapPayload(data, { bumpEvents: true });
      setError(null);
    } catch (err) {
      setOverview(null);
      setTimeStatus(null);
      setPeriodStatus(null);
      setPendingEvents([]);
      const msg =
        err instanceof ApiError
          ? formatApiErrorDetail(err.detail, err.message)
          : formatApiErrorDetail(err?.detail ?? err?.message, err?.message || 'Не удалось загрузить данные');
      setError(msg);
    } finally {
      setLoading(false);
      loadingRef.current = false;
    }
  }, [applyBootstrapPayload]);

  const refreshOverview = useCallback(async () => {
    const data = await API.getOverview();
    setOverview(data);
    if (data?.newly_unlocked?.length) {
      notifyAchievementUnlocks(data.newly_unlocked);
    }
  }, []);

  const refreshPeriodStatus = useCallback(async () => {
    const data = await API.getPeriodStatus();
    setPeriodStatus(data);
  }, []);

  const refreshPendingEvent = useCallback(async ({ bumpOverlay = false } = {}) => {
    const data = await API.getPendingEvent();
    const evList = parsePendingEvents(data);
    setPendingEvents(evList);
    if (bumpOverlay && evList.length > 0) setEventsPromptTick((t) => t + 1);
    return evList.length;
  }, []);

  const fetchPeriodStatus = useCallback(async () => {
    const data = await API.getPeriodStatus();
    setPeriodStatus(data);
    return data;
  }, []);

  const applyPeriodTransition = useCallback(async (result) => {
    if (!result) return result;
    if (result.period_close) {
      notifyPeriodCloseRewards(result.period_close);
      setPeriodCloseSummary(result.period_close);
    }
    setTimeStatus(result);
    periodIndexRef.current = result.period_index ?? periodIndexRef.current;
    await refreshGameState({ bumpEvents: true, updateTime: false });
    return result;
  }, [refreshGameState]);

  const resyncAfterForeground = useCallback(async () => {
    if (loadingRef.current) return;
    try {
      const prevIndex = periodIndexRef.current;
      const data = await refreshGameState();
      if (
        prevIndex != null &&
        data?.time?.period_index != null &&
        prevIndex !== data.time.period_index
      ) {
        const evList = parsePendingEvents(data.events);
        if (evList.length > 0) setEventsPromptTick((t) => t + 1);
      }
    } catch (err) {
      const msg =
        err instanceof ApiError
          ? formatApiErrorDetail(err.detail, err.message)
          : formatApiErrorDetail(err?.detail ?? err?.message, 'Не удалось обновить игру после возврата');
      showNotification(msg, 'error');
    }
  }, [refreshGameState]);

  const advancePeriod = useCallback(async () => {
    if (periodEndInFlightRef.current) return;
    periodEndInFlightRef.current = true;
    try {
      const result = await API.setTimeNext();
      await applyPeriodTransition(result);
      return result;
    } finally {
      periodEndInFlightRef.current = false;
    }
  }, [applyPeriodTransition]);

  const claimSalary = useCallback(async () => {
    const result = await API.claimSalary();
    if (result && result.status === 'success') {
      await refreshGameState();
    }
    return result;
  }, [refreshGameState]);

  const contributeToSafetyFund = useCallback(async (amount) => {
    const result = await API.contributeToSafetyFund({ amount });
    if (result && result.status === 'success') {
      await refreshGameState();
    }
    return result;
  }, [refreshGameState]);

  const withdrawFromSafetyFund = useCallback(async (amount) => {
    const result = await API.withdrawFromSafetyFund({ amount });
    if (result && result.status === 'success') {
      await refreshGameState();
    }
    return result;
  }, [refreshGameState]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  useEffect(() => {
    const onForeground = debounceForeground(() => {
      resyncAfterForeground();
    }, FOREGROUND_RESYNC_MS);
    return subscribeAppForeground(onForeground);
  }, [resyncAfterForeground]);

  return {
    overview,
    periodStatus,
    pendingEvents,
    eventsPromptTick,
    timeStatus,
    loading,
    syncing,
    error,
    advancePeriod,
    fetchPeriodStatus,
    reload: loadData,
    claimSalary,
    contributeToSafetyFund,
    withdrawFromSafetyFund,
    refreshOverview,
    refreshPeriodStatus,
    refreshPendingEvent,
    refreshGameState,
    periodCloseSummary,
    dismissPeriodClose: () => setPeriodCloseSummary(null),
  };
}
