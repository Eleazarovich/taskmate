// Sound feedback system — all sounds generated via Web Audio API (no external files needed)
// Backend integration point: replace with real audio file URLs if preferred

type SoundType = 'move-forward' | 'move-backward' | 'invalid-move' | 'board-create' | 'victory';

function createAudioContext(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  try {
    return new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
  } catch {
    return null;
  }
}

function playTone(
  ctx: AudioContext,
  frequency: number,
  duration: number,
  type: OscillatorType = 'sine',
  gain = 0.15,
  startTime = 0
) {
  const osc = ctx.createOscillator();
  const gainNode = ctx.createGain();
  osc.connect(gainNode);
  gainNode.connect(ctx.destination);
  osc.type = type;
  osc.frequency.setValueAtTime(frequency, ctx.currentTime + startTime);
  gainNode.gain.setValueAtTime(gain, ctx.currentTime + startTime);
  gainNode.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + startTime + duration);
  osc.start(ctx.currentTime + startTime);
  osc.stop(ctx.currentTime + startTime + duration + 0.05);
}

export function playSound(type: SoundType) {
  const ctx = createAudioContext();
  if (!ctx) return;

  switch (type) {
    case 'move-forward':
      playTone(ctx, 523, 0.08, 'sine', 0.12);
      playTone(ctx, 659, 0.1, 'sine', 0.1, 0.08);
      break;

    case 'move-backward': playTone(ctx, 392, 0.08,'sine', 0.1);
      playTone(ctx, 330, 0.12, 'sine', 0.1, 0.08);
      break;

    case 'invalid-move': playTone(ctx, 220, 0.05,'square', 0.08);
      playTone(ctx, 180, 0.08, 'square', 0.06, 0.06);
      break;

    case 'board-create': playTone(ctx, 440, 0.06,'sine', 0.1);
      playTone(ctx, 554, 0.06, 'sine', 0.1, 0.08);
      playTone(ctx, 659, 0.1, 'sine', 0.12, 0.16);
      break;

    case 'victory': playTone(ctx, 523, 0.08,'sine', 0.15);
      playTone(ctx, 659, 0.08, 'sine', 0.15, 0.1);
      playTone(ctx, 784, 0.08, 'sine', 0.15, 0.2);
      playTone(ctx, 1047, 0.3, 'sine', 0.18, 0.3);
      playTone(ctx, 784, 0.08, 'sine', 0.12, 0.65);
      playTone(ctx, 1047, 0.4, 'sine', 0.2, 0.75);
      break;
  }
}