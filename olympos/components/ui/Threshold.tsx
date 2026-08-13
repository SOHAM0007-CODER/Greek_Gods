'use client';

import { useEffect, useRef, useState } from 'react';
import { useStore } from '@/lib/store';
import { useProgress } from '@react-three/drei';
import { gsap } from 'gsap';

export function Threshold() {
  const entered = useStore((s) => s.entered);
  const setEntered = useStore((s) => s.setEntered);
  const { progress } = useProgress();
  const enterBtnRef = useRef<HTMLButtonElement>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (progress === 100) {
      setTimeout(() => setReady(true), 500); // small delay to let textures compile
    }
  }, [progress]);

  useEffect(() => {
    if (ready && enterBtnRef.current) {
      gsap.to(enterBtnRef.current, { opacity: 1, duration: 1.2, ease: 'power2.out' });
      gsap.to('#enterNote', { opacity: 1, duration: 1.2, delay: 0.2, ease: 'power2.out' });
    }
  }, [ready]);

  if (entered) return null;

  return (
    <div className="threshold" id="threshold" style={entered ? { display: 'none' } : {}}>
      <div className="kicker">An interactive descent</div>
      <h1>ΟΛΥΜΠΟΣ</h1>
      <div className="rule">
        <i id="loadBar" style={{ width: `${progress}%` }}></i>
      </div>
      <div className="pct" id="loadPct">
        {ready ? 'THE MARBLE IS READY' : `CARVING THE MARBLE — ${Math.round(progress)}%`}
      </div>
      <p className="tagline">
        From the thin air of the aether to the cold rivers below, five gods hold their ground.
      </p>
      <button
        ref={enterBtnRef}
        className="enter"
        id="enterBtn"
        style={{ pointerEvents: ready ? 'auto' : 'none' }}
        onClick={() => {
          gsap.to('#threshold', { opacity: 0, duration: 1.2, ease: 'power2.inOut', onComplete: () => setEntered(true) });
        }}
      >
        <i></i>
        <span>Begin the descent</span>
      </button>
      <div className="note" id="enterNote">
        Best with sound · headphones recommended
      </div>
    </div>
  );
}
