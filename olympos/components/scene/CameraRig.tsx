'use client';

import { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { useStore, rig } from '@/lib/store';
import { PANTHEON, SPACING_Y } from '@/lib/pantheon';
import { AudioEngine } from '@/lib/useAudio';

function smooth(t: number) { return t * t * (3 - 2 * t); }
function damp(cur: number, tgt: number, l: number, dt: number) { return cur + (tgt - cur) * (1 - Math.exp(-l * dt)); }

export function CameraRig() {
  const setActive = useStore(s => s.setActive);
  
  const { camCurve, tmpV, tmpW, focusPos } = useMemo(() => {
    const anchors = PANTHEON.map((_, i) => {
      const a = i * 2.35 + 0.62;
      return new THREE.Vector3(Math.cos(a) * 20.5, -i * SPACING_Y + 5.2, Math.sin(a) * 20.5);
    });
    return {
      camCurve: new THREE.CatmullRomCurve3(anchors, false, 'centripetal', 0.5),
      tmpV: new THREE.Vector3(),
      tmpW: new THREE.Vector3(),
      focusPos: new THREE.Vector3(),
    };
  }, []);

  const fpsRef = useRef({ frames: 0, time: 0 });

  useFrame((state, dt) => {
    // FPS counter
    fpsRef.current.frames++;
    const t = state.clock.elapsedTime;
    if (t - fpsRef.current.time >= 1) {
      const fpsBtn = document.getElementById('btnFps');
      if (fpsBtn) fpsBtn.innerText = `${fpsRef.current.frames} fps`;
      fpsRef.current.frames = 0;
      fpsRef.current.time = t;
    }

    // 1. Damping logic from rig target
    rig.vel = (rig.target - rig.p) * 4.2;
    rig.p += rig.vel * dt;
    if (Math.abs(rig.vel) < 0.001) {
      rig.p = rig.target;
      rig.vel = 0;
    }
    rig.mx = damp(rig.mx, useStore.getState().entered ? state.pointer.x : 0, 4.0, dt);
    rig.my = damp(rig.my, useStore.getState().entered ? state.pointer.y : 0, 4.0, dt);
    rig.intro = damp(rig.intro, 0, 1.2, dt);
    
    rig.audio = AudioEngine.update(dt);

    const N = PANTHEON.length;
    const clampedP = Math.max(0, Math.min(rig.p, N - 1));
    const activeIndex = Math.round(clampedP);
    
    // Update React store if active changed
    if (activeIndex !== useStore.getState().active) {
      setActive(activeIndex);
    }

    // 2. Camera positioning
    const tCurve = clampedP / (N - 1);
    camCurve.getPoint(tCurve, tmpV);
    
    // Bulginess / Shake
    const bump = Math.sin(clampedP * Math.PI) * 2.6;
    tmpW.copy(tmpV).normalize();
    tmpV.addScaledVector(tmpW, bump + rig.intro * 20);
    
    // Shake
    const S = useStore.getState() as any; // any internal state like shakeSeed
    if (!S.shakeSeed) S.shakeSeed = Math.random() * 100;
    const t2 = state.clock.elapsedTime * 1.6 + S.shakeSeed;
    const shake = (Math.abs(rig.vel) + rig.audio) * 0.4;
    tmpV.x += Math.sin(t2 * 2.1) * shake;
    tmpV.y += Math.sin(t2 * 2.6) * shake;
    tmpV.z += Math.cos(t2 * 2.3) * shake;
    
    // Apply pointer sway
    tmpV.x += rig.mx * 2.5;
    tmpV.y += rig.my * 1.5;
    
    state.camera.position.copy(tmpV);
    
    // Update Focus (the object we look at)
    const activeGodPos = new THREE.Vector3(
      Math.cos(activeIndex * 2.35) * 11,
      -activeIndex * SPACING_Y,
      Math.sin(activeIndex * 2.35) * 11
    );
    
    const lookTgt = activeGodPos.clone();
    lookTgt.y += 0.5;
    
    // Blend look target during transition
    const frac = clampedP - Math.floor(clampedP);
    if (frac > 0.01 && Math.floor(clampedP) < N - 1) {
      const nextId = Math.floor(clampedP) + 1;
      const nextPos = new THREE.Vector3(
        Math.cos(nextId * 2.35) * 11,
        -nextId * SPACING_Y,
        Math.sin(nextId * 2.35) * 11
      );
      nextPos.y += 0.5;
      lookTgt.copy(activeGodPos.clone().setY(activeGodPos.y + 0.5).lerp(nextPos, smooth(frac)));
    }
    
    lookTgt.x -= rig.mx * 3.5;
    lookTgt.y += rig.my * 1.5;
    
    focusPos.lerp(lookTgt, 1 - Math.exp(-6.0 * dt));
    state.camera.lookAt(focusPos);
    
    // Depth rail DOM update
    const depthRead = document.getElementById('depthRead');
    if (depthRead) {
      depthRead.innerText = (clampedP * 12).toFixed(0);
    }
    const tick = document.getElementById('tick');
    if (tick) {
      tick.style.top = (tCurve * 100) + '%';
    }
  });

  return null;
}
