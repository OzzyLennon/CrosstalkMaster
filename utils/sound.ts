let audioCtx: AudioContext | null = null;

// Initialize AudioContext (must be called on user interaction)
export const initAudio = () => {
  if (!audioCtx) {
    audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
  }
  if (audioCtx.state === 'suspended') {
    audioCtx.resume();
  }
};

// Play "Hecai" (Cheers) - A happy major chord chime + applause wash
export const playHecai = () => {
  if (!audioCtx) return;
  const t = audioCtx.currentTime;

  // 1. Happy Chime (Major Triad: C5, E5, G5)
  [523.25, 659.25, 783.99].forEach((freq, i) => {
    const osc = audioCtx!.createOscillator();
    const gain = audioCtx!.createGain();
    osc.frequency.value = freq;
    osc.type = 'sine'; // Sine wave for clean bell-like sound
    osc.connect(gain);
    gain.connect(audioCtx!.destination);
    
    // Envelope
    osc.start(t + i * 0.05);
    gain.gain.setValueAtTime(0, t + i * 0.05);
    gain.gain.linearRampToValueAtTime(0.1, t + i * 0.05 + 0.05);
    gain.gain.exponentialRampToValueAtTime(0.001, t + i * 0.05 + 0.6);
    osc.stop(t + i * 0.05 + 0.7);
  });

  // 2. Applause Simulation (Filtered Noise)
  const duration = 1.5;
  const bufferSize = audioCtx.sampleRate * duration;
  const buffer = audioCtx.createBuffer(1, bufferSize, audioCtx.sampleRate);
  const data = buffer.getChannelData(0);
  let lastOut = 0;
  
  // Generate Pink-ish noise
  for (let i = 0; i < bufferSize; i++) {
    const white = Math.random() * 2 - 1;
    data[i] = (lastOut + (0.02 * white)) / 1.02;
    lastOut = data[i];
    data[i] *= 3.5; // Compensate for gain loss
  }

  const noise = audioCtx.createBufferSource();
  noise.buffer = buffer;
  const noiseGain = audioCtx.createGain();
  
  // Envelope for applause (fade in/out)
  noiseGain.gain.setValueAtTime(0, t);
  noiseGain.gain.linearRampToValueAtTime(0.15, t + 0.1);
  noiseGain.gain.exponentialRampToValueAtTime(0.001, t + duration);
  
  noise.connect(noiseGain);
  noiseGain.connect(audioCtx.destination);
  noise.start(t);
};

// Play "Daocai" (Boos) - A dissonant, sliding low tone
export const playDaocai = () => {
  if (!audioCtx) return;
  const t = audioCtx.currentTime;

  // Create two oscillators for dissonance (Tritone feel)
  [130, 185].forEach((freq) => { 
     const osc = audioCtx!.createOscillator();
     const gain = audioCtx!.createGain();
     
     // Slide pitch down to simulate disappointment/jeering
     osc.frequency.setValueAtTime(freq, t);
     osc.frequency.linearRampToValueAtTime(freq - 50, t + 0.8);
     
     osc.type = 'sawtooth'; // Sawtooth for buzzing/crowd-like texture
     osc.connect(gain);
     gain.connect(audioCtx!.destination);
     
     // Envelope
     gain.gain.setValueAtTime(0, t);
     gain.gain.linearRampToValueAtTime(0.08, t + 0.1);
     gain.gain.linearRampToValueAtTime(0, t + 0.8);
     
     osc.start(t);
     osc.stop(t + 0.9);
  });
};

// Play "Encore" (Grand Finale) - Fanfare + Long Applause
export const playEncore = () => {
  if (!audioCtx) return;
  const t = audioCtx.currentTime;

  // 1. Fanfare Melody (Arpeggio Up: C4, E4, G4, C5)
  // Sawtooth for brassy sound
  const notes = [261.63, 329.63, 392.00, 523.25]; 
  notes.forEach((freq, i) => {
    const osc = audioCtx!.createOscillator();
    const gain = audioCtx!.createGain();
    osc.frequency.value = freq;
    osc.type = 'sawtooth'; 
    
    // Low pass filter to make it sound less harsh (more like a trumpet)
    const filter = audioCtx!.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = 2000;

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(audioCtx!.destination);
    
    const startTime = t + (i * 0.15);
    const duration = i === notes.length - 1 ? 2.0 : 0.4; // Last note holds longer

    osc.start(startTime);
    
    gain.gain.setValueAtTime(0, startTime);
    gain.gain.linearRampToValueAtTime(0.15, startTime + 0.05); // Attack
    gain.gain.exponentialRampToValueAtTime(0.01, startTime + duration); // Decay
    
    osc.stop(startTime + duration + 0.1);
  });

  // 2. Long Applause
  const duration = 4.0;
  const bufferSize = audioCtx.sampleRate * duration;
  const buffer = audioCtx.createBuffer(1, bufferSize, audioCtx.sampleRate);
  const data = buffer.getChannelData(0);
  let lastOut = 0;
  
  for (let i = 0; i < bufferSize; i++) {
    const white = Math.random() * 2 - 1;
    data[i] = (lastOut + (0.02 * white)) / 1.02;
    lastOut = data[i];
    data[i] *= 4.0; 
  }

  const noise = audioCtx.createBufferSource();
  noise.buffer = buffer;
  const noiseGain = audioCtx.createGain();
  
  noiseGain.gain.setValueAtTime(0, t);
  noiseGain.gain.linearRampToValueAtTime(0.2, t + 0.5); // Slow build up
  noiseGain.gain.setValueAtTime(0.2, t + 2.0); // Sustain
  noiseGain.gain.exponentialRampToValueAtTime(0.001, t + duration); // Fade out
  
  noise.connect(noiseGain);
  noiseGain.connect(audioCtx.destination);
  noise.start(t);
};