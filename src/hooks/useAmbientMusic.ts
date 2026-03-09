import { useState, useEffect, useRef, useCallback } from "react";

const STORAGE_KEY = "lynki-ambient-music";

/**
 * Generates lo-fi ambient garden audio using the Web Audio API.
 * Layers soft filtered oscillators to create a gentle, looping pad sound.
 */
function createAmbientGraph(ctx: AudioContext) {
  const master = ctx.createGain();
  master.gain.value = 0.18;

  // Warm pad – detuned saw pair through a low-pass filter
  const makePad = (freq: number, detune: number) => {
    const osc = ctx.createOscillator();
    osc.type = "sawtooth";
    osc.frequency.value = freq;
    osc.detune.value = detune;

    const filter = ctx.createBiquadFilter();
    filter.type = "lowpass";
    filter.frequency.value = 400;
    filter.Q.value = 1;

    const gain = ctx.createGain();
    gain.gain.value = 0.3;

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(master);
    osc.start();
    return osc;
  };

  // Soft sine sub-bass hum
  const makeSub = (freq: number) => {
    const osc = ctx.createOscillator();
    osc.type = "sine";
    osc.frequency.value = freq;

    const gain = ctx.createGain();
    gain.gain.value = 0.15;

    osc.connect(gain);
    gain.connect(master);
    osc.start();
    return osc;
  };

  // High shimmer – triangle through heavy low-pass
  const makeShimmer = (freq: number) => {
    const osc = ctx.createOscillator();
    osc.type = "triangle";
    osc.frequency.value = freq;

    const filter = ctx.createBiquadFilter();
    filter.type = "lowpass";
    filter.frequency.value = 800;
    filter.Q.value = 0.5;

    const gain = ctx.createGain();
    gain.gain.value = 0.08;

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(master);
    osc.start();
    return osc;
  };

  // C major 7th voicing – gentle and garden-like
  const oscillators = [
    makePad(130.81, -8),   // C3
    makePad(164.81, 6),    // E3
    makePad(196.0, -5),    // G3
    makeSub(65.41),        // C2
    makeShimmer(493.88),   // B4
    makeShimmer(329.63),   // E4
  ];

  master.connect(ctx.destination);

  return { master, oscillators };
}

export function useAmbientMusic() {
  const [playing, setPlaying] = useState(() => {
    try {
      return localStorage.getItem(STORAGE_KEY) === "on";
    } catch {
      return false;
    }
  });

  const ctxRef = useRef<AudioContext | null>(null);
  const graphRef = useRef<{ master: GainNode; oscillators: OscillatorNode[] } | null>(null);

  const start = useCallback(() => {
    if (!ctxRef.current) {
      ctxRef.current = new AudioContext();
    }
    const ctx = ctxRef.current;

    if (ctx.state === "suspended") {
      ctx.resume();
    }

    if (!graphRef.current) {
      graphRef.current = createAmbientGraph(ctx);
    }

    // Fade in over 1s
    graphRef.current.master.gain.cancelScheduledValues(ctx.currentTime);
    graphRef.current.master.gain.setValueAtTime(graphRef.current.master.gain.value, ctx.currentTime);
    graphRef.current.master.gain.linearRampToValueAtTime(0.18, ctx.currentTime + 1);
  }, []);

  const stop = useCallback(() => {
    const ctx = ctxRef.current;
    const graph = graphRef.current;
    if (!ctx || !graph) return;

    // Fade out over 0.5s, then stop oscillators
    graph.master.gain.cancelScheduledValues(ctx.currentTime);
    graph.master.gain.setValueAtTime(graph.master.gain.value, ctx.currentTime);
    graph.master.gain.linearRampToValueAtTime(0, ctx.currentTime + 0.5);

    setTimeout(() => {
      graph.oscillators.forEach((o) => {
        try { o.stop(); } catch { /* already stopped */ }
      });
      graphRef.current = null;
    }, 600);
  }, []);

  const toggle = useCallback(() => {
    setPlaying((prev) => {
      const next = !prev;
      try {
        localStorage.setItem(STORAGE_KEY, next ? "on" : "off");
      } catch { /* storage full / blocked */ }
      return next;
    });
  }, []);

  // React to playing state changes
  useEffect(() => {
    if (playing) {
      start();
    } else {
      stop();
    }
  }, [playing, start, stop]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      graphRef.current?.oscillators.forEach((o) => {
        try { o.stop(); } catch { /* noop */ }
      });
      ctxRef.current?.close();
      ctxRef.current = null;
      graphRef.current = null;
    };
  }, []);

  return { playing, toggle };
}
