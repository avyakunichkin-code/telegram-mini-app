// src/hooks/useGame.js
import { useState, useEffect, useCallback, useRef } from 'react';
import { API, ApiError, formatApiErrorDetail } from '../api';
import {
  notifyAchievementUnlocks,
  notifyPeriodCloseRewards,
} from '../utils/progressionToasts';

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
  const [error, setError] = useState(null);
  const [periodCloseSummary, setPeriodCloseSummary] = useState(null);

  const timerRef = useRef(null);
  const localRemainingRef = useRef(0);
  const lastSyncRef = useRef(Date.now());
  const handlePeriodEndRef = useRef(null);
  const startTimerRef = useRef(null);

  const applyBootstrapPayload = useCallback((data, { bumpEvents = false, updateTime = true } = {}) => {
    setOverview(data.overview);
    if (updateTime && data.time) {
      setTimeStatus(data.time);
      localRemainingRef.current = data.time.seconds_until_next_period;
      lastSyncRef.current = Date.now();
    }
    setPeriodStatus(data.period);
    const evList = parsePendingEvents(data.events);
    setPendingEvents(evList);
    if (bumpEvents && evList.length > 0) setEventsPromptTick((t) => t + 1);
    if (data.overview?.newly_unlocked?.length) {
      notifyAchievementUnlocks(data.overview.newly_unlocked);
    }
  }, []);

  /** Один round-trip: overview + period + events (+ time). После мутаций в игре. */
  const refreshGameState = useCallback(async (opts) => {
    const data = await API.getGameBootstrap();
    applyBootstrapPayload(data, opts);
    return data;
  }, [applyBootstrapPayload]);

  const loadData = useCallback(async () => {
    setLoading(true);
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
    localRemainingRef.current = result.seconds_until_next_period;
    lastSyncRef.current = Date.now();
    await refreshGameState({ bumpEvents: true, updateTime: false });
    if (result.time_state === 'play') {
      startTimerRef.current?.();
    }
    return result;
  }, [refreshGameState]);

  const handlePeriodEnd = useCallback(async () => {
    const newTime = await API.setTimeNext();
    await applyPeriodTransition(newTime);
  }, [applyPeriodTransition]);

  handlePeriodEndRef.current = handlePeriodEnd;

  const stopTimer = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const startTimer = useCallback(() => {
    if (timerRef.current) clearInterval(timerRef.current);
    if (!timeStatus || timeStatus.time_state !== 'play') return;

    timerRef.current = setInterval(() => {
      const now = Date.now();
      const elapsed = Math.floor((now - lastSyncRef.current) / 1000);
      const remaining = Math.max(0, timeStatus.seconds_until_next_period - elapsed);
      localRemainingRef.current = remaining;

      setTimeStatus((prev) => ({ ...prev, remainingLocal: remaining }));

      if (remaining <= 0) {
        clearInterval(timerRef.current);
        timerRef.current = null;
        handlePeriodEndRef.current?.();
      }
    }, 1000);
  }, [timeStatus]);

  startTimerRef.current = startTimer;

  const advancePeriod = useCallback(async () => {
    stopTimer();
    const result = await API.setTimeNext();
    await applyPeriodTransition(result);
    return result;
  }, [applyPeriodTransition, stopTimer]);

  const setPlay = useCallback(async () => {
    const result = await API.setTimePlay();
    if (result) {
      setTimeStatus(result);
      localRemainingRef.current = result.seconds_until_next_period;
      lastSyncRef.current = Date.now();
      startTimer();
    }
  }, [startTimer]);

  const setPause = useCallback(async () => {
    const result = await API.setTimePause();
    if (result) {
      setTimeStatus(result);
      localRemainingRef.current = result.seconds_until_next_period;
      lastSyncRef.current = Date.now();
      stopTimer();
    }
  }, [stopTimer]);

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
    return () => stopTimer();
  }, [loadData, stopTimer]);

  useEffect(() => {
    if (timeStatus && timeStatus.time_state === 'play') {
      startTimer();
    } else {
      stopTimer();
    }
  }, [timeStatus, startTimer, stopTimer]);

  return {
    overview,
    periodStatus,
    pendingEvents,
    eventsPromptTick,
    timeStatus: timeStatus ? {
      ...timeStatus,
      remainingLocal: localRemainingRef.current,
    } : null,
    loading,
    error,
    setPlay,
    setPause,
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
