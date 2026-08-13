'use client';

import { useStore } from '@/lib/store';
import { PANTHEON } from '@/lib/pantheon';

export function DepthRail() {
  const entered = useStore((s) => s.entered);

  if (!entered) return null;

  return (
    <aside className="hud rail" aria-hidden="true">
      <div className="read">
        DEPTH <b id="depthRead">0</b> ST
      </div>
      <div className="track" id="track">
        <div className="tick" id="tick"></div>
        {PANTHEON.map((_, i) => (
          <div 
            key={i} 
            className="notch" 
            style={{ top: `${(i / (PANTHEON.length - 1)) * 100}%` }}
          />
        ))}
      </div>
    </aside>
  );
}
