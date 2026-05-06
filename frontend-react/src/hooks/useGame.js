// src/hooks/useGame.js
import { useState, useEffect, useCallback, useRef } from 'react';
import { API } from '../api';

export function useGame() {
  const [overview, setOverview] = useState(null);
  const [timeStatus, setTimeStatus] = useState(null);
  const [periodStatus, setPeriodStatus] = useState(null);
  const [pendingEvents, setPendingEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const timerRef = useRef(null);
  const localRemainingRef = useRef(0);
  const lastSyncRef = useRef(Date.now());

  // Загрузка данных (можно повторить после ошибки)
  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [overviewData, timeData, periodData, eventData] = await Promise.all([
        API.getOverview(),
        API.getTimeStatus(),
        API.getPeriodStatus(),
        API.getPendingEvent(),
      ]);
      setOverview(overviewData);
      setTimeStatus(timeData);
      setPeriodStatus(periodData);
      const evList =
        Array.isArray(eventData?.events) ? eventData.events
        : (eventData?.event ? [eventData.event] : []);
      setPendingEvents(evList);
      localRemainingRef.current = timeData.seconds_until_next_period;
      lastSyncRef.current = Date.now();
      setError(null);
    } catch (err) {
      setOverview(null);
      setTimeStatus(null);
      setError(err.detail || err.message || 'Не удалось загрузить данные');
    } finally {
      setLoading(false);
    }
  }, []);

  // Обновление только overview (после действий)
  const refreshOverview = useCallback(async () => {
    const data = await API.getOverview();
    setOverview(data);
  }, []);

  const refreshPeriodStatus = useCallback(async () => {
    const data = await API.getPeriodStatus();
    setPeriodStatus(data);
  }, []);

  const refreshPendingEvent = useCallback(async () => {
    const data = await API.getPendingEvent();
    const evList =
      Array.isArray(data?.events) ? data.events : (data?.event ? [data.event] : []);
    setPendingEvents(evList);
  }, []);

  const fetchPeriodStatus = useCallback(async () => {
    const data = await API.getPeriodStatus();
    setPeriodStatus(data);
    return data;
  }, []);

  // Таймер
  const startTimer = useCallback(() => {
    if (timerRef.current) clearInterval(timerRef.current);
    if (!timeStatus || timeStatus.time_state !== 'play') return;

    timerRef.current = setInterval(() => {
      const now = Date.now();
      const elapsed = Math.floor((now - lastSyncRef.current) / 1000);
      const remaining = Math.max(0, timeStatus.seconds_until_next_period - elapsed);
      localRemainingRef.current = remaining;

      // Обновляем UI через setTimeStatus (добавим поле remainingLocal)
      setTimeStatus(prev => ({ ...prev, remainingLocal: remaining }));

      if (remaining <= 0) {
        // Период закончился – синхронизируем
        clearInterval(timerRef.current);
        timerRef.current = null;
        handlePeriodEnd();
      }
    }, 1000);
  }, [timeStatus]);

  const stopTimer = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const handlePeriodEnd = useCallback(async () => {
    const newTime = await API.setTimeNext();
    if (newTime) {
      setTimeStatus(newTime);
      localRemainingRef.current = newTime.seconds_until_next_period;
      lastSyncRef.current = Date.now();
      await refreshOverview();
      await refreshPeriodStatus();
      await refreshPendingEvent();
      if (newTime.time_state === 'play') {
        startTimer();
      }
    }
  }, [refreshOverview, refreshPeriodStatus, refreshPendingEvent, startTimer]);

  /** Ручной или подтверждённый переход (без window.confirm — его показывает GameScreen). */
  const advancePeriod = useCallback(async () => {
    stopTimer();
    const result = await API.setTimeNext();
    if (result) {
      setTimeStatus(result);
      localRemainingRef.current = result.seconds_until_next_period;
      lastSyncRef.current = Date.now();
      await refreshOverview();
      await refreshPeriodStatus();
      await refreshPendingEvent();
      if (result.time_state === 'play') {
        startTimer();
      }
    }
    return result;
  }, [refreshOverview, refreshPeriodStatus, refreshPendingEvent, startTimer, stopTimer]);

  // Действия времени
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

  // Действия периода
  const claimSalary = useCallback(async () => {
    const result = await API.claimSalary();
    if (result && result.status === 'success') {
      await refreshOverview();
      await refreshPeriodStatus();
    }
    return result;
  }, [refreshOverview, refreshPeriodStatus]);

  const contributeToSafetyFund = useCallback(async (amount) => {
    const result = await API.contributeToSafetyFund({ amount });
    if (result && result.status === 'success') {
      await refreshOverview();
      await refreshPeriodStatus();
    }
    return result;
  }, [refreshOverview, refreshPeriodStatus]);

  const withdrawFromSafetyFund = useCallback(async (amount) => {
    const result = await API.withdrawFromSafetyFund({ amount });
    if (result && result.status === 'success') {
      await refreshOverview();
      await refreshPeriodStatus();
    }
    return result;
  }, [refreshOverview, refreshPeriodStatus]);

  // Инициализация
  useEffect(() => {
    loadData();
    return () => stopTimer();
  }, [loadData, stopTimer]);

  // Синхронизация таймера при изменении timeStatus
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
  };
}