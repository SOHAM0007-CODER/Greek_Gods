'use client';

import { useStore, rig } from '@/lib/store';
import { PANTHEON } from '@/lib/pantheon';
import { gsap } from 'gsap';

export function IndexRail() {
  const entered = useStore((s) => s.entered);
  const active = useStore((s) => s.active);

  if (!entered) return null;

  const goTo = (i: number) => {
    // We drive `rig.target` directly, GSAP will tween S.target?
    // Wait, in index.html, S was the mutable object. In our port, `rig` is the mutable object.
    gsap.to(rig, { target: Math.max(0, Math.min(i, PANTHEON.length - 1)), duration: 1.9, ease: 'power3.inOut' });
    
    // Hide hint if it exists
    const hint = document.getElementById('hint');
    if (hint && !hint.dataset.gone) {
      hint.dataset.gone = '1';
      gsap.to(hint, { opacity: 0, y: 14, duration: 0.6, ease: 'power2.out' });
    }
  };

  return (
    <nav className="hud index" id="index" aria-label="Gods">
      {PANTHEON.map((g, i) => (
        <button 
          key={g.key} 
          className="idx" 
          aria-current={active === i}
          onClick={() => goTo(i)}
        >
          <span className="nm">{g.name}</span>
          <span className="ln"></span>
        </button>
      ))}
    </nav>
  );
}
