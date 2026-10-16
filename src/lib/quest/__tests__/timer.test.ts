import { describe, expect, it } from 'vitest';
import {
  addSeconds, createCountdown, formatClock, isFinished, isRunning, pause, remainingMs, start,
} from '../timer';

describe('minuteur', () => {
  it('décompte à partir de l’horloge réelle', () => {
    let t = start(createCountdown(60), 1_000);
    expect(isRunning(t)).toBe(true);
    expect(remainingMs(t, 1_000)).toBe(60_000);
    expect(remainingMs(t, 31_000)).toBe(30_000);
    expect(isFinished(t, 61_000)).toBe(true);
    expect(remainingMs(t, 120_000)).toBe(0);
  });

  it('se met en pause puis reprend sans perdre de temps', () => {
    let t = start(createCountdown(60), 0);
    t = pause(t, 20_000);
    expect(isRunning(t)).toBe(false);
    expect(remainingMs(t, 50_000)).toBe(40_000);
    t = start(t, 50_000);
    expect(remainingMs(t, 60_000)).toBe(30_000);
  });

  it('pause et démarrage répétés sont sans effet', () => {
    let t = start(createCountdown(30), 0);
    expect(start(t, 5_000)).toBe(t);
    t = pause(t, 10_000);
    expect(pause(t, 15_000)).toBe(t);
  });

  it('ajoute ou retire du temps sans jamais passer sous zéro', () => {
    let t = start(createCountdown(60), 0);
    t = addSeconds(t, 15, 10_000);
    expect(remainingMs(t, 10_000)).toBe(65_000);
    t = addSeconds(t, -120, 10_000);
    expect(remainingMs(t, 10_000)).toBe(0);
    expect(isFinished(t, 10_000)).toBe(true);
  });

  it('formate l’affichage en minutes et secondes', () => {
    expect(formatClock(0)).toBe('0:00');
    expect(formatClock(59.2)).toBe('1:00');
    expect(formatClock(75)).toBe('1:15');
    expect(formatClock(-3)).toBe('0:00');
  });
});
