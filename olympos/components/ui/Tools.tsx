'use client';

import { useState } from 'react';
import { useStore } from '@/lib/store';
import { useAudio } from '@/lib/useAudio';

export function Tools() {
  const dpr = useStore((s) => s.dpr);
  const setDpr = useStore((s) => s.setDpr);
  const [ambience, setAmbience] = useState(true);
  const { setAmbience: setAudioAmbience } = useAudio();

  const toggleAmbience = () => {
    const next = !ambience;
    setAmbience(next);
    setAudioAmbience(next);
  };

  const toggleQuality = () => {
    // toggle between 1.5 and 1
    const next = dpr > 1 ? 1 : Math.min(window.devicePixelRatio || 1, 2);
    setDpr(next);
  };

  return (
    <header className="hud hud-top">
      <div className="mark">
        <div className="glyph">ΟΛΥΜΠΟΣ</div>
        <div className="sub">A descent in five strata</div>
      </div>
      <nav className="tools">
        <button 
          className="tool" 
          id="btnAmbience" 
          data-on={ambience} 
          onClick={toggleAmbience}
        >
          <i className="dot"></i>Ambience
        </button>
        <button 
          className="tool" 
          id="btnQuality" 
          data-on={dpr > 1} 
          onClick={toggleQuality}
        >
          {dpr > 1 ? '4K' : 'Lite'}
        </button>
        <button className="tool" id="btnFps">— fps</button>
      </nav>
    </header>
  );
}
