/**
 * Plays a short notification sound using the Web Audio API.
 * No external files required.
 */

let audioCtx: AudioContext | null = null;

function getCtx(): AudioContext {
  if (!audioCtx) {
    audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
  }
  return audioCtx;
}

function playTone(frequency: number, duration: number, gainValue: number, type: OscillatorType = 'sine') {
  try {
    const ctx = getCtx();
    const osc = ctx.createOscillator();
    const gainNode = ctx.createGain();
    osc.connect(gainNode);
    gainNode.connect(ctx.destination);
    osc.type = type;
    osc.frequency.setValueAtTime(frequency, ctx.currentTime);
    gainNode.gain.setValueAtTime(gainValue, ctx.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + duration);
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + duration);
  } catch {
    // Audio unavailable — silent fallback
  }
}

/** Gentle two-tone chime for "someone liked you" */
export function playInterestSound() {
  playTone(880, 0.18, 0.3);
  setTimeout(() => playTone(1100, 0.25, 0.25), 160);
}

/** Warm three-tone fanfare for "mutual match!" */
export function playMatchSound() {
  playTone(660, 0.2, 0.3);
  setTimeout(() => playTone(880, 0.2, 0.3), 180);
  setTimeout(() => playTone(1100, 0.35, 0.28), 360);
}

/** Soft two-note pop for an incoming chat message */
export function playMessageSound() {
  playTone(800, 0.14, 0.2, 'sine');
  setTimeout(() => playTone(1000, 0.1, 0.15, 'sine'), 110);
}

/** Romantic four-note chime for a wedding invite 💍 */
export function playWeddingInviteSound() {
  playTone(523, 0.2, 0.28);   // C5
  setTimeout(() => playTone(659, 0.2, 0.26), 200);  // E5
  setTimeout(() => playTone(784, 0.2, 0.24), 400);  // G5
  setTimeout(() => playTone(1047, 0.35, 0.22), 600); // C6
}
