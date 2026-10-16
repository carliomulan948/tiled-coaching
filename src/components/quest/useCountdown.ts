'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import {
  addSeconds, CountdownState, createCountdown, isFinished, isRunning, pause, remainingMs, start,
} from '@/lib/quest/timer';

export function useCountdown(onFinish?: () => void) {
  const [state, setState] = useState<CountdownState | null>(null);
  const [now, setNow] = useState(() => Date.now());
  const finishedRef = useRef(false);
  const onFinishRef = useRef(onFinish);
  onFinishRef.current = onFinish;

  useEffect(() => {
    if (!state || !isRunning(state)) return;
    const id = setInterval(() => setNow(Date.now()), 200);
    return () => clearInterval(id);
  }, [state]);

  useEffect(() => {
    if (state && isRunning(state) && isFinished(state, now) && !finishedRef.current) {
      finishedRef.current = true;
      onFinishRef.current?.();
    }
  }, [state, now]);

  const begin = useCallback((seconds: number) => {
    const t = Date.now();
    finishedRef.current = false;
    setNow(t);
    setState(start(createCountdown(seconds), t));
  }, []);

  const toggle = useCallback(() => {
    const t = Date.now();
    setNow(t);
    setState(s => (s ? (isRunning(s) ? pause(s, t) : start(s, t)) : s));
  }, []);

  const add = useCallback((seconds: number) => {
    const t = Date.now();
    setNow(t);
    setState(s => (s ? addSeconds(s, seconds, t) : s));
  }, []);

  const stop = useCallback(() => {
    finishedRef.current = true;
    setState(null);
  }, []);

  return {
    active: state !== null,
    running: state ? isRunning(state) : false,
    remaining: state ? remainingMs(state, now) / 1000 : 0,
    total: state ? state.durationMs / 1000 : 0,
    begin,
    toggle,
    add,
    stop,
  };
}
