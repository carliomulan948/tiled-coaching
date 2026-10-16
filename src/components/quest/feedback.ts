'use client';

import { QuestPreferences } from '@/lib/quest/types';

// Signal de fin de minuteur : vibration et bip selon les préférences et ce que permet le navigateur.
let audioContext: AudioContext | null = null;

type AudioWindow = Window & { webkitAudioContext?: typeof AudioContext };

// À appeler lors d'un geste utilisateur : certains navigateurs mobiles bloquent le son sinon.
export function unlockAudio(): void {
  if (typeof window === 'undefined') return;
  try {
    const Ctor = window.AudioContext ?? (window as AudioWindow).webkitAudioContext;
    if (!Ctor) return;
    audioContext = audioContext ?? new Ctor();
    if (audioContext.state === 'suspended') void audioContext.resume();
  } catch {
    audioContext = null;
  }
}

function beep(): void {
  if (!audioContext) return;
  try {
    const osc = audioContext.createOscillator();
    const gain = audioContext.createGain();
    osc.frequency.value = 880;
    gain.gain.setValueAtTime(0.15, audioContext.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, audioContext.currentTime + 0.35);
    osc.connect(gain).connect(audioContext.destination);
    osc.start();
    osc.stop(audioContext.currentTime + 0.35);
  } catch {
    // le son est un bonus : on ignore les erreurs du navigateur
  }
}

export function signalTimerEnd(prefs: QuestPreferences): void {
  if (prefs.vibration && typeof navigator !== 'undefined' && typeof navigator.vibrate === 'function') {
    try { navigator.vibrate([180, 80, 180]); } catch { /* non pris en charge */ }
  }
  if (prefs.sound) beep();
}
