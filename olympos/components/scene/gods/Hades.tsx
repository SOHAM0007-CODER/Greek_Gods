'use client';

import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { Artifact } from '../Artifact';
import { PANTHEON } from '@/lib/pantheon';
import { useDissolve } from '../materials/useDissolve';
import { stone, emissiveMat } from '../materials/materials';
import { PointCloud } from '../materials/Points';
import { rig } from '@/lib/store';

function smooth(t: number) { return t * t * (3 - 2 * t); }

export function Hades({ index = 4 }: { index?: number }) {
  const god = PANTHEON[index];
  const presenceRef = useRef(0);
  const acc = god.accent;
  const acc2 = god.accent2;

  const coreMat = useDissolve(acc2, 1.0, 'hades_core');
  const shardMat = useDissolve(acc2, 1.6, 'hades_shard');
  const ringMat = useDissolve(acc2, 0.7, 'hades_ring');
  
  const coreGeo = useMemo(() => new THREE.SphereGeometry(1.3, 56, 56), []);
  const coreBaseMat = useMemo(() => stone(0x1b141a, 0.14, 0.1), []); // metal 0.1
  const shardBaseMat = useMemo(() => stone(0x2a1f22, 0.22, 0.55), []);
  const ringBaseMat = useMemo(() => emissiveMat(acc, 2.2), [acc]);

  const haloMat = useMemo(() => {
    const s = 256, c = document.createElement('canvas'); c.width = c.height = s;
    const x = c.getContext('2d');
    if (x) {
      const g = x.createRadialGradient(s / 2, s / 2, 0, s / 2, s / 2, s / 2);
      g.addColorStop(0, 'rgba(255,255,255,1)');
      g.addColorStop(0.18, 'rgba(255,255,255,.55)');
      g.addColorStop(0.45, 'rgba(255,255,255,.16)');
      g.addColorStop(1, 'rgba(255,255,255,0)');
      x.fillStyle = g; x.fillRect(0, 0, s, s);
    }
    const t = new THREE.CanvasTexture(c);
    t.colorSpace = THREE.SRGBColorSpace;
    return new THREE.SpriteMaterial({
      map: t, color: acc, transparent: true, opacity: 0.5,
      blending: THREE.AdditiveBlending, depthWrite: false, depthTest: false
    });
  }, [acc]);

  const coreSpin = useRef<THREE.Mesh>(null);
  const shardsSpin = useRef<THREE.Group>(null);
  const ringSpin = useRef<THREE.Mesh>(null);

  useFrame((state, dt) => {
    const p = presenceRef.current;
    
    // Update dissolves
    coreMat.uDissolve.current.value = Math.pow(1 - smooth(p), 0.85) * 1.05;
    shardMat.uDissolve.current.value = Math.pow(1 - smooth(p), 0.85) * 1.05;
    ringMat.uDissolve.current.value = Math.pow(1 - smooth(p), 0.85) * 1.05;
    
    haloMat.opacity = 0.5 * smooth(p);
    
    // Spin
    if (coreSpin.current) {
      coreSpin.current.rotation.y += 0.05 * dt;
    }
    if (shardsSpin.current) {
      shardsSpin.current.rotation.x += 0.03 * dt;
      shardsSpin.current.rotation.y += -0.14 * dt;
      shardsSpin.current.rotation.z += 0.02 * dt;
    }
    if (ringSpin.current) {
      ringSpin.current.rotation.y += 0.1 * dt;
    }
  });

  return (
    <Artifact index={index} presenceRef={presenceRef}>
      
      <sprite scale={[5.2, 5.2, 1]} material={haloMat} />

      <mesh ref={coreSpin} geometry={coreGeo}>
        <primitive object={coreBaseMat} attach="material" onBeforeCompile={coreMat.onBeforeCompile} customProgramCacheKey={coreMat.customProgramCacheKey} />
      </mesh>

      <group ref={shardsSpin}>
        {[...Array(40)].map((_, i) => {
          const GA = Math.PI * (3 - Math.sqrt(5));
          const y = 1 - (i / 39) * 2, rr = Math.sqrt(Math.max(0, 1 - y * y)), a = GA * i;
          return (
            <mesh 
              key={i} 
              position={[Math.cos(a) * rr * 2.25, y * 2.25, Math.sin(a) * rr * 2.25]}
              rotation={[Math.random() * 3, Math.random() * 3, Math.random() * 3]}
            >
              <tetrahedronGeometry args={[0.16 + Math.random() * 0.2]} />
              <primitive object={shardBaseMat} attach="material" onBeforeCompile={shardMat.onBeforeCompile} customProgramCacheKey={shardMat.customProgramCacheKey} />
            </mesh>
          );
        })}
      </group>

      <mesh ref={ringSpin} rotation={[Math.PI / 2 - 0.3, 0, 0]}>
        <torusGeometry args={[3.1, 0.012, 6, 140]} />
        <primitive object={ringBaseMat} attach="material" onBeforeCompile={ringMat.onBeforeCompile} customProgramCacheKey={ringMat.customProgramCacheKey} />
      </mesh>

      <PointCloud 
        count={900} 
        colorHex={acc2} 
        sizeMin={0.6} 
        sizeMax={2.4} 
        rise={true}
        presenceRef={presenceRef}
        builder={(v) => {
          const a = Math.random() * Math.PI * 2;
          const r = 1.6 + Math.random() * 4.6;
          v.set(Math.cos(a) * r, Math.random() * 9 - 3, Math.sin(a) * r);
        }}
      />
    </Artifact>
  );
}
