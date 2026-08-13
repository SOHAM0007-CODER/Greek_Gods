'use client';

import { useEffect, useRef, useState } from 'react';
import { useStore } from '@/lib/store';
import { PANTHEON } from '@/lib/pantheon';
import { useAudio } from '@/lib/useAudio';
import { gsap } from 'gsap';
import { useGSAP } from '@gsap/react';

export function Plaque() {
  const active = useStore((s) => s.active);
  const entered = useStore((s) => s.entered);
  const narrating = useStore((s) => s.narrating);
  const setNarrating = useStore((s) => s.setNarrating);
  
  const containerRef = useRef<HTMLElement>(null);
  const godnameRef = useRef<HTMLHeadingElement>(null);
  const textElsRef = useRef<(HTMLElement | null)[]>([]);
  const { speak, stop } = useAudio();
  const [prevActive, setPrevActive] = useState(-1);

  // We only show the plaque if we have an active god (i.e. not the title screen)
  const isVisible = entered && active >= 0 && active < PANTHEON.length;
  const god = isVisible ? PANTHEON[active] : PANTHEON[0];

  useGSAP(() => {
    if (!isVisible || !godnameRef.current || !containerRef.current) return;
    if (active === prevActive) return; // Prevent re-trigger on re-render

    setPrevActive(active);

    const isReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const chars = godnameRef.current.querySelectorAll('.ch');
    const outEls = textElsRef.current.filter(Boolean);

    // Apply colors to root for CSS variables (like the original)
    document.documentElement.style.setProperty('--accent', god.accent);
    document.documentElement.style.setProperty('--accent-2', god.accent2);

    const reveal = () => {
      if (isReduced) {
        gsap.set(chars, { opacity: 1, y: 0, rotateX: 0 });
        gsap.set(outEls, { opacity: 1, y: 0, filter: 'blur(0px)' });
        return;
      }
      gsap.fromTo(
        chars,
        { yPercent: 90, opacity: 0, rotateX: -72 },
        { yPercent: 0, opacity: 1, rotateX: 0, duration: 1.0, ease: 'power3.out', stagger: { each: 0.045 } }
      );
      gsap.fromTo(
        ['#stratum', '#realm'],
        { opacity: 0, x: -8 },
        { opacity: 1, x: 0, duration: 0.7, ease: 'power2.out', stagger: 0.07 }
      );
      gsap.fromTo(
        outEls,
        { y: 20, opacity: 0, filter: 'blur(7px)' },
        { y: 0, opacity: 1, filter: 'blur(0px)', duration: 0.85, ease: 'power3.out', stagger: 0.07, delay: 0.16 }
      );
    };

    if (isReduced) {
      reveal();
    } else {
      const uiTl = gsap.timeline();
      uiTl
        .to(chars, { yPercent: -55, opacity: 0, duration: 0.3, ease: 'power2.in', stagger: { each: 0.014, from: 'random' } }, 0)
        .to(outEls, { y: -12, opacity: 0, filter: 'blur(6px)', duration: 0.3, ease: 'power2.in', stagger: 0.02 }, 0)
        .to(['#stratum', '#realm'], { opacity: 0, duration: 0.25 }, 0)
        .add(reveal, 0.34);
    }
  }, { dependencies: [active, isVisible, god, prevActive] });

  if (!isVisible) return null;

  const toggleListen = () => {
    if (narrating) {
      stop();
      setNarrating(false);
    } else {
      setNarrating(true);
      speak(god.speech, god, () => setNarrating(false));
    }
  };

  return (
    <section className="hud plaque" id="plaque" ref={containerRef}>
      <div className="eyebrow">
        <i id="stratum">{god.stratum}</i>
        <s></s>
        <span id="realm">{god.realm}</span>
      </div>
      <h2 className="godname" id="godname" aria-live="polite" ref={godnameRef}>
        {god.name.split('').map((c, i) =>
          c === ' ' ? <span key={i} className="sp"> </span> : <span key={i} className="ch">{c}</span>
        )}
      </h2>
      <div className="greek" id="greek" ref={(el) => { textElsRef.current[0] = el; }}>{god.greek}</div>
      <div className="epithet" id="epithet" ref={(el) => { textElsRef.current[1] = el; }}>{god.epithet}</div>
      <div className="domains" id="domains" ref={(el) => { textElsRef.current[2] = el; }}>
        {god.domains.map(d => (
          <span key={d} className="dom">{d}</span>
        ))}
      </div>
      <p className="lore" id="lore" ref={(el) => { textElsRef.current[3] = el; }}>{god.lore}</p>
      
      <button 
        className="listen" 
        id="listen" 
        data-playing={narrating} 
        onClick={toggleListen}
        ref={(el) => { textElsRef.current[4] = el; }}
      >
        <span className="wave" id="wave">
          <b></b><b></b><b></b><b></b><b></b>
        </span>
        <span id="listenLabel">{narrating ? 'Stop the narration' : 'Listen to the myth'}</span>
      </button>
    </section>
  );
}
