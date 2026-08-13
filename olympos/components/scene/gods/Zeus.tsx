'use client';

import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { Artifact } from '../Artifact';
import { PANTHEON } from '@/lib/pantheon';
import { useDissolve } from '../materials/useDissolve';
import { marble, metalMat, addMat } from '../materials/materials';
import { PointCloud } from '../materials/Points';
import { rig } from '@/lib/store';

function boltGeometry(len: number, jitter: number) {
  const pts = [];
  const steps = 9;
  for (let i = 0; i <= steps; i++) {
    const t = i / steps;
    pts.push(
      new THREE.Vector3(
        (Math.random() - 0.5) * jitter * (1 - Math.abs(t - 0.5) * 1.4),
        -t * len,
        (Math.random() - 0.5) * jitter * (1 - Math.abs(t - 0.5) * 1.4)
      )
    );
  }
  return new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 40, 0.022, 4, false);
}

export function Zeus({ index = 0 }: { index?: number }) {
  const god = PANTHEON[index];
  const presenceRef = useRef(0);
  const acc2 = god.accent2;

  // Materials
  const coreMat = useDissolve(acc2, 1.1, 'zeus_core');
  const ringMat = useDissolve(acc2, 0.9, 'zeus_ring');
  const shardMat = useDissolve(acc2, 1.4, 'zeus_shard');
  
  const boltMat = useMemo(() => addMat(0xdfeaff, 0.0), []);
  const haloMat = useMemo(() => {
    // Generate a quick radial glow texture
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
      map: t, color: acc2, transparent: true, opacity: 0.32,
      blending: THREE.AdditiveBlending, depthWrite: false, depthTest: false
    });
  }, [acc2]);

  const coreGeo = useMemo(() => new THREE.IcosahedronGeometry(1.55, 1), []);
  const coreBaseMat = useMemo(() => marble(0xe8e2d4, 0.34, 0.7), []);
  const ringBaseMat = useMemo(() => metalMat(0xc9a227, 0.16), []);
  const shardBaseMat = useMemo(() => metalMat(0xf0d68a, 0.12), []);
  const shardGeo = useMemo(() => new THREE.ConeGeometry(0.1, 2.3, 4), []);
  const boltGeos = useMemo(() => [
    boltGeometry(7 + Math.random() * 4, 1.6),
    boltGeometry(7 + Math.random() * 4, 1.6),
    boltGeometry(7 + Math.random() * 4, 1.6),
    boltGeometry(7 + Math.random() * 4, 1.6)
  ], []);

  const coreSpin = useRef<THREE.Mesh>(null);
  const ringsSpin = useRef<THREE.Group>(null);
  const shardsSpin = useRef<THREE.Group>(null);

  useFrame((state, dt) => {
    const t = state.clock.elapsedTime;
    const p = presenceRef.current;
    
    // Update dissolves
    coreMat.uDissolve.current.value = Math.pow(1 - smooth(p), 0.85) * 1.05;
    ringMat.uDissolve.current.value = Math.pow(1 - smooth(p), 0.85) * 1.05;
    shardMat.uDissolve.current.value = Math.pow(1 - smooth(p), 0.85) * 1.05;
    
    haloMat.opacity = 0.32 * smooth(p);
    
    // Spin
    if (coreSpin.current) {
      coreSpin.current.rotation.x += 0.04 * dt;
      coreSpin.current.rotation.y += 0.1 * dt;
      coreSpin.current.rotation.z += 0.02 * dt;
    }
    if (ringsSpin.current) {
      ringsSpin.current.children.forEach((r, i) => {
        r.rotation.y += (i % 2 ? 0.16 : -0.12) * dt;
        r.rotation.z += 0.05 * dt;
      });
    }
    if (shardsSpin.current) {
      shardsSpin.current.rotation.y += -0.22 * dt;
    }

    // Audio reactive bolt strike
    boltMat.opacity = Math.min(1, Math.pow(Math.abs(Math.sin(t * 1.7)), 26) * 0.9 + rig.audio * 0.3 * Math.random()) * smooth(p);
  });

  return (
    <Artifact index={index} presenceRef={presenceRef}>
      <sprite scale={[13, 13, 1]} material={haloMat} />
      
      <mesh ref={coreSpin} geometry={coreGeo}>
        <primitive object={coreBaseMat} attach="material" onBeforeCompile={coreMat.onBeforeCompile} customProgramCacheKey={coreMat.customProgramCacheKey} />
      </mesh>

      <group ref={ringsSpin}>
        {[0, 1, 2].map(i => (
          <mesh 
            key={i} 
            rotation={[Math.PI / 2 - i * 0.42, i * 0.6, i * 0.3]}
          >
            <torusGeometry args={[2.5 + i * 0.55, 0.022, 8, 140]} />
            <primitive object={ringBaseMat} attach="material" onBeforeCompile={ringMat.onBeforeCompile} customProgramCacheKey={ringMat.customProgramCacheKey} />
          </mesh>
        ))}
      </group>

      <group ref={shardsSpin}>
        {[...Array(8)].map((_, i) => {
          const a = (i / 8) * Math.PI * 2;
          return (
            <mesh 
              key={i} 
              geometry={shardGeo}
              position={[Math.cos(a) * 2.05, 0, Math.sin(a) * 2.05]}
              rotation={[Math.PI / 2 * (i % 2 ? 1 : -1), -a, Math.PI / 2.4]}
            >
              <primitive object={shardBaseMat} attach="material" onBeforeCompile={shardMat.onBeforeCompile} customProgramCacheKey={shardMat.customProgramCacheKey} />
            </mesh>
          );
        })}
      </group>

      <group>
        {boltGeos.map((geo, i) => {
          const a = (i / 4) * Math.PI * 2;
          return (
            <mesh 
              key={i} 
              geometry={geo} 
              material={boltMat} 
              position={[Math.cos(a) * 2.6, 3.4, Math.sin(a) * 2.6]} 
            />
          );
        })}
      </group>

      <PointCloud 
        count={760} 
        colorHex={acc2} 
        sizeMin={0.9} 
        sizeMax={3.4} 
        presenceRef={presenceRef}
        builder={(v) => {
          const a = Math.random() * Math.PI * 2;
          const r = 3 + Math.random() * 4.5;
          v.set(Math.cos(a) * r, (Math.random() - 0.5) * 5.5, Math.sin(a) * r);
        }}
      />
    </Artifact>
  );
}

function smooth(t: number) { return t * t * (3 - 2 * t); }
