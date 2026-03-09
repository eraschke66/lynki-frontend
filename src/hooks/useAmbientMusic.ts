import { useState, useEffect, useRef, useCallback } from "react";

const STORAGE_KEY = "lynki-ambient-music";

const TRACKS = [
  "/djovan-breathe-with-me-486762.mp3",
  "/hitslab-spa-buddha-zen-music-459416.mp3",
  "/meditativetiger-zen-garden-tibetan-bowls-calming-music-for-toddlers-387024.mp3",
];

export function useAmbientMusic() {
  const [playing, setPlaying] = useState(() => {
    try {
      return localStorage.getItem(STORAGE_KEY) === "on";
    } catch {
      return false;
    }
  });

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const trackIndexRef = useRef(0);

  const playTrack = useCallback((index: number) => {
    const audio = audioRef.current;
    if (!audio) return;
    trackIndexRef.current = index;
    audio.src = TRACKS[index];
    audio.play().catch(() => {
      /* blocked by autoplay policy — user must interact first */
    });
  }, []);

  // Create the Audio element once and wire up the "ended" handler
  useEffect(() => {
    const audio = new Audio();
    audio.volume = 0.4;
    audioRef.current = audio;

    const onEnded = () => {
      const next = (trackIndexRef.current + 1) % TRACKS.length;
      playTrack(next);
    };
    audio.addEventListener("ended", onEnded);

    return () => {
      audio.removeEventListener("ended", onEnded);
      audio.pause();
      audio.src = "";
      audioRef.current = null;
    };
  }, [playTrack]);

  // React to playing state changes
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    if (playing) {
      if (!audio.src || audio.ended) {
        playTrack(trackIndexRef.current);
      } else {
        audio.play().catch(() => {});
      }
    } else {
      audio.pause();
    }
  }, [playing, playTrack]);

  const toggle = useCallback(() => {
    setPlaying((prev) => {
      const next = !prev;
      try {
        localStorage.setItem(STORAGE_KEY, next ? "on" : "off");
      } catch { /* storage full / blocked */ }
      return next;
    });
  }, []);

  return { playing, toggle };
}
