// src/hooks/useGame.js
import { useState, useEffect, useCallback, useRef } from 'react';
import { API } from '../api';

export function useGame() {
  const [overview, setOverview] = useState(null);
  const [timeStatus, setTimeStatus] = useState(null);
  const [periodStatus, setPeriodStatus] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const timerRef = useRef(null);
  const localRemainingRef = useRef(0);
  const lastSyncRef = useRef(Date.now());

  // Загрузка данных
  const loadData = useCallback(async () => {
    try {
      const [overviewData, timeData, periodData] = await Promise.all([
        API.getOverview(),
        API.getTimeStatus(),
        API.getPeriodStatus(),
      ]);
      setOverview(overviewData);
      setTimeStatus(timeData);
      setPeriodStatus(periodData);
      localRemainingRef.current = timeData.seconds_until_next_period;
      lastSyncRef.current = Date.now();
      setError(null);
    } catch (err) {
      setError(err.message);
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
    }, 200);
  }, [timeStatus]);

  const stopTimer = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const handlePeriodEnd = useCallback(async () => {
    // Принудительно переходим на следующий период
    const newTime = await API.setTimeNext();
    if (newTime) {
      setTimeStatus(newTime);
      localRemainingRef.current = newTime.seconds_until_next_period;
      lastSyncRef.current = Date.now();
      // Обновляем overview
      await refreshOverview();
      await refreshPeriodStatus();
      // Если режим play – перезапускаем таймер
      if (newTime.time_state === 'play') {
        startTimer();
      }
    }
  }, [refreshOverview, refreshPeriodStatus, startTimer]);

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

  const nextPeriod = useCallback(async () => {
    stopTimer();

    // Ручной Next: предупредим, что зарплата сгорит.
    try {
      const status = await API.getPeriodStatus();
      setPeriodStatus(status);
      if (status && status.salary_claimed === false && status.can_claim_salary) {
        const ok = window.confirm(
          'Вы не получили зарплату в этом периоде. Если перейти дальше, зарплата сгорит. Перейти в следующий период?'
        );
        if (!ok) return;
      }
    } catch (e) {
      // Если статус не получили — не блокируем переход.
    }

    const result = await API.setTimeNext();
    if (result) {
      setTimeStatus(result);
      localRemainingRef.current = result.seconds_until_next_period;
      lastSyncRef.current = Date.now();
      await refreshOverview();
      await refreshPeriodStatus();
      if (result.time_state === 'play') startTimer();
    }
    return result;
  }, [refreshOverview, refreshPeriodStatus, startTimer, stopTimer]);

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
    timeStatus: timeStatus ? {
      ...timeStatus,
      remainingLocal: localRemainingRef.current,
    } : null,
    loading,
    error,
    setPlay,
    setPause,
    nextPeriod,
    claimSalary,
    contributeToSafetyFund,
    withdrawFromSafetyFund,
    refreshOverview,
    refreshPeriodStatus,
  };
}