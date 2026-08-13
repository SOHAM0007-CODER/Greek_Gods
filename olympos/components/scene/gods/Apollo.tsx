'use client';

import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { Artifact } from '../Artifact';
import { PANTHEON } from '@/lib/pantheon';
import { useDissolve } from '../materials/useDissolve';
import { marble, metalMat, emissiveMat, addMat } from '../materials/materials';
import { PointCloud } from '../materials/Points';
import { rig } from '@/lib/store';

function smooth(t: number) { return t * t * (3 - 2 * t); }

export function Apollo({ index = 2 }: { index?: number }) {
  const god = PANTHEON[index];
  const presenceRef = useRef(0);
  const acc = god.accent;
  const acc2 = god.accent2;

  const coreMat = useDissolve(acc2, 1.2, 'apollo_core');
  const goldMat = useDissolve(acc2, 0.9, 'apollo_gold');
  const strMat = useDissolve(acc2, 0.7, 'apollo_str');
  
  const sunMat = useMemo(() => addMat(acc2, 0.5), [acc2]);
  const disc2Mat = useMemo(() => addMat(acc, 0.32), [acc]);
  const rayMat = useMemo(() => addMat(acc2, 0.42), [acc2]);

  const coreGeo = useMemo(() => new THREE.SphereGeometry(1.22, 56, 56), []);
  const coreBaseMat = useMemo(() => marble(0xf2e6cf, 0.3, 0.7), []);
  const goldBaseMat = useMemo(() => metalMat(0xe8b45a, 0.18), []);
  const strBaseMat = useMemo(() => emissiveMat(acc2, 2.6), [acc2]);

  const disc1Geo = useMemo(() => new THREE.RingGeometry(1.7, 1.78, 128), []);
  const disc2Geo = useMemo(() => new THREE.RingGeometry(2.7, 2.73, 128), []);
  const arm1Geo = useMemo(() => new THREE.TorusGeometry(1.85, 0.05, 8, 90, Math.PI * 1.15), []);
  
  const coreSpin = useRef<THREE.Mesh>(null);
  const disc2Spin = useRef<THREE.Mesh>(null);
  const raysSpin = useRef<THREE.Group>(null);
  const stringsRef = useRef<THREE.Group>(null);

  useFrame((state, dt) => {
    const t = state.clock.elapsedTime;
    const p = presenceRef.current;
    
    // Update dissolves
    coreMat.uDissolve.current.value = Math.pow(1 - smooth(p), 0.85) * 1.05;
    goldMat.uDissolve.current.value = Math.pow(1 - smooth(p), 0.85) * 1.05;
    strMat.uDissolve.current.value = Math.pow(1 - smooth(p), 0.85) * 1.05;
    
    // Spin
    if (coreSpin.current) {
      coreSpin.current.rotation.y += 0.07 * dt;
    }
    if (disc2Spin.current) {
      disc2Spin.current.rotation.z += 0.05 * dt;
    }
    if (raysSpin.current) {
      raysSpin.current.rotation.z += -0.08 * dt;
    }

    // Custom audio reaction
    const k = 1 + rig.audio * 0.9;
    if (stringsRef.current) {
      stringsRef.current.children.forEach((s, i) => {
        s.scale.x = s.scale.z = 1 + Math.sin(t * (9 + i * 1.7)) * 0.5 * rig.audio * 2.2;
      });
    }
    sunMat.opacity = (0.42 + rig.audio * 0.4) * smooth(p);
    rayMat.opacity = (0.3 + rig.audio * 0.5) * smooth(p);
    // scale disc 1
    // (We will animate the scale via a ref or just directly if we have a ref to disc1)
  });

  return (
    <Artifact index={index} presenceRef={presenceRef}>
      
      <mesh ref={coreSpin} geometry={coreGeo}>
        <primitive object={coreBaseMat} attach="material" onBeforeCompile={coreMat.onBeforeCompile} customProgramCacheKey={coreMat.customProgramCacheKey} />
      </mesh>

      <mesh geometry={disc1Geo} material={sunMat} />
      
      <mesh ref={disc2Spin} geometry={disc2Geo} material={disc2Mat} rotation={[0, 0, 0.6]} />

      <group ref={raysSpin}>
        {[...Array(36)].map((_, i) => {
          const a = (i / 36) * Math.PI * 2;
          const len = 0.5 + (i % 3) * 0.55;
          return (
            <mesh 
              key={i} 
              material={rayMat}
              position={[Math.cos(a) * (2.0 + len / 2), Math.sin(a) * (2.0 + len / 2), 0]}
              rotation={[0, 0, a - Math.PI / 2]}
            >
              <planeGeometry args={[0.012, len]} />
            </mesh>
          );
        })}
      </group>

      <mesh geometry={arm1Geo} rotation={[0, 0, Math.PI * 0.42]} position={[0, 0, -0.05]}>
        <primitive object={goldBaseMat} attach="material" onBeforeCompile={goldMat.onBeforeCompile} customProgramCacheKey={goldMat.customProgramCacheKey} />
      </mesh>

      <group ref={stringsRef}>
        {[...Array(7)].map((_, i) => (
          <mesh 
            key={i} 
            position={[(i - 3) * 0.24, 0, 0.9]}
          >
            <cylinderGeometry args={[0.009, 0.009, 2.6 - Math.abs(i - 3) * 0.18, 5]} />
            <primitive object={strBaseMat} attach="material" onBeforeCompile={strMat.onBeforeCompile} customProgramCacheKey={strMat.customProgramCacheKey} />
          </mesh>
        ))}
      </group>

      <PointCloud 
        count={700} 
        colorHex={acc2} 
        sizeMin={0.8} 
        sizeMax={3.0} 
        presenceRef={presenceRef}
        builder={(v) => {
          const a = Math.random() * Math.PI * 2;
          const r = 2.2 + Math.random() * 4.4;
          v.set(Math.cos(a) * r, (Math.random() - 0.5) * 3.2, Math.sin(a) * r);
        }}
      />
    </Artifact>
  );
}
