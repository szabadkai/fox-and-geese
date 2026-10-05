// A dry puck landing on a wooden board: friction, a short contact transient,
// and rapidly damped, inharmonic body resonances. No pitch sweep or reverb.
export function puckSamples(sampleRate, { capture = false, sliding = false, seed = 1 } = {}) {
  let randomState = seed >>> 0;
  const random = () => {
    randomState = (Math.imul(1664525, randomState) + 1013904223) >>> 0;
    return randomState / 4294967296 * 2 - 1;
  };
  const impactAt = sliding ? 0.265 : 0.008;
  const samples = new Float32Array(Math.ceil(sampleRate * (impactAt + 0.24)));
  const variation = 1 + random() * 0.055;
  const modes = capture
    ? [[175, 0.26, 0.033], [425, 0.19, 0.021], [880, 0.11, 0.012], [1670, 0.05, 0.006]]
    : [[205, 0.21, 0.028], [510, 0.17, 0.017], [1060, 0.10, 0.009], [2140, 0.045, 0.004]];
  let grain = 0, previousGrain = 0, scrape = 0;
  for (let i = 0; i < samples.length; i++) {
    const time = i / sampleRate;
    const noise = random();
    grain += (1 - Math.exp(-2 * Math.PI * 4200 / sampleRate)) * (noise - grain);
    scrape += (1 - Math.exp(-2 * Math.PI * 900 / sampleRate)) * (noise - scrape);
    let value = 0;
    if (sliding && time < impactAt) {
      const progress = time / impactAt;
      const envelope = Math.sin(Math.PI * progress) ** 1.5;
      // Quiet, uneven friction, fading away before the landing.
      value += (grain - scrape) * envelope * 0.025 * (0.8 + 0.2 * Math.sin(time * 93));
    }
    const age = time - impactAt;
    if (age >= 0) {
      const attack = 1 - Math.exp(-age / 0.0006);
      const contact = (grain - previousGrain * 0.4) * Math.exp(-age / 0.0045) * 0.62;
      let body = 0;
      for (const [frequency, amplitude, decay] of modes) {
        body += amplitude * Math.sin(2 * Math.PI * frequency * variation * age) * Math.exp(-age / decay);
      }
      value += attack * (contact + body);
      // A captured piece gives a tiny second wooden contact, not a musical cue.
      const rebound = age - 0.046;
      if (capture && rebound >= 0) {
        value += (1 - Math.exp(-rebound / 0.0005)) * Math.exp(-rebound / 0.007)
          * (grain * 0.18 + Math.sin(2 * Math.PI * 740 * variation * rebound) * 0.07);
      }
    }
    previousGrain = grain;
    const fade = Math.min(1, (samples.length - 1 - i) / (sampleRate * 0.012));
    samples[i] = Math.tanh(value * 1.25) * 0.58 * fade;
  }
  return samples;
}

export function createPuckAudio() {
  let context;
  const buffers = new Map(), active = new Set();
  return {
    async play(capture = false, sliding = false) {
      try {
        context ??= new (window.AudioContext || window.webkitAudioContext)();
        if (context.state === 'suspended') await context.resume();
        if (context.state !== 'running') return;
        const variant = Math.floor(Math.random() * 5);
        const key = `${capture}:${sliding}:${variant}`;
        if (!buffers.has(key)) {
          const samples = puckSamples(context.sampleRate, { capture, sliding, seed: variant + 71 });
          const buffer = context.createBuffer(1, samples.length, context.sampleRate);
          buffer.copyToChannel(samples, 0);
          buffers.set(key, buffer);
        }
        const source = context.createBufferSource();
        source.buffer = buffers.get(key);
        source.connect(context.destination);
        active.add(source);
        source.onended = () => { active.delete(source); source.disconnect(); };
        source.start();
      } catch { /* Sound remains optional if the browser cannot play audio. */ }
    },
    stop() {
      for (const source of active) source.stop();
      active.clear();
    },
  };
}
