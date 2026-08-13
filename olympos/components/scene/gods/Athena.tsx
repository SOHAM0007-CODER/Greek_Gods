'use client';

import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { Artifact } from '../Artifact';
import { PANTHEON } from '@/lib/pantheon';
import { useDissolve } from '../materials/useDissolve';
import { marble, metalMat, emissiveMat } from '../materials/materials';
import { PointCloud } from '../materials/Points';
import { rig } from '@/lib/store';

function smooth(t: number) { return t * t * (3 - 2 * t); }

export function Athena({ index = 1 }: { index?: number }) {
  const god = PANTHEON[index];
  const presenceRef = useRef(0);
  const acc2 = god.accent2;

  // Materials
  const coreMat = useDissolve(acc2, 1.0, 'athena_core');
  const goldMat = useDissolve(acc2, 0.9, 'athena_gold');
  const helixMat = useDissolve(acc2, 0.8, 'athena_helix');

  const coreGeo = useMemo(() => new THREE.OctahedronGeometry(1.55, 0), []);
  const coreBaseMat = useMemo(() => marble(0xf0efe9, 0.28, 0.8), []);
  const goldBaseMat = useMemo(() => metalMat(0xd9c07a, 0.15), []);
  const helixBaseMat = useMemo(() => emissiveMat(acc2, 2.0), [acc2]);

  const aegisTorus1 = useMemo(() => new THREE.TorusGeometry(2.45, 0.045, 10, 128), []);
  const aegisTorus2 = useMemo(() => new THREE.TorusGeometry(2.9, 0.014, 8, 128), []);
  const spikeGeo = useMemo(() => new THREE.BoxGeometry(0.016, 0.016, 0.42), []);
  const cubeGeo = useMemo(() => new THREE.BoxGeometry(0.2, 0.2, 0.2), []);

  const helixGeo = useMemo(() => {
    const helixPts = [];
    for (let i = 0; i <= 90; i++) {
      const t = i / 90;
      const a = t * Math.PI * 5.2;
      helixPts.push(new THREE.Vector3(Math.cos(a) * (1.9 - t * 0.5), t * 3.4 - 1.7, Math.sin(a) * (1.9 - t * 0.5)));
    }
    return new THREE.TubeGeometry(new THREE.CatmullRomCurve3(helixPts), 180, 0.017, 5, false);
  }, []);

  const coreSpin = useRef<THREE.Mesh>(null);
  const aegisSpin = useRef<THREE.Group>(null);
  const helixSpin = useRef<THREE.Mesh>(null);
  const cubesSpin = useRef<THREE.Group>(null);

  useFrame((state, dt) => {
    const p = presenceRef.current;
    
    // Update dissolves
    coreMat.uDissolve.current.value = Math.pow(1 - smooth(p), 0.85) * 1.05;
    goldMat.uDissolve.current.value = Math.pow(1 - smooth(p), 0.85) * 1.05;
    helixMat.uDissolve.current.value = Math.pow(1 - smooth(p), 0.85) * 1.05;
    
    // Spin
    if (coreSpin.current) {
      coreSpin.current.rotation.x += 0.05 * dt;
      coreSpin.current.rotation.y += 0.13 * dt;
    }
    if (aegisSpin.current) {
      aegisSpin.current.rotation.z += 0.14 * dt;
    }
    if (helixSpin.current) {
      helixSpin.current.rotation.y += -0.1 * dt;
    }
    if (cubesSpin.current) {
      cubesSpin.current.rotation.x += 0.2 * dt;
      cubesSpin.current.rotation.y += -0.3 * dt;
    }
  });

  return (
    <Artifact index={index} presenceRef={presenceRef}>
      
      <mesh ref={coreSpin} geometry={coreGeo}>
        <primitive object={coreBaseMat} attach="material" onBeforeCompile={coreMat.onBeforeCompile} customProgramCacheKey={coreMat.customProgramCacheKey} />
      </mesh>

      <group ref={aegisSpin} rotation={[0.42, 0, 0]}>
        <mesh geometry={aegisTorus1}>
          <primitive object={goldBaseMat} attach="material" onBeforeCompile={goldMat.onBeforeCompile} customProgramCacheKey={goldMat.customProgramCacheKey} />
        </mesh>
        <mesh geometry={aegisTorus2}>
          <primitive object={goldBaseMat} attach="material" onBeforeCompile={goldMat.onBeforeCompile} customProgramCacheKey={goldMat.customProgramCacheKey} />
        </mesh>
        {[...Array(28)].map((_, i) => {
          const a = (i / 28) * Math.PI * 2;
          return (
            <mesh 
              key={i} 
              geometry={spikeGeo}
              position={[Math.cos(a) * 2.68, Math.sin(a) * 2.68, 0]}
              rotation={[0, 0, a]}
            >
              <primitive object={goldBaseMat} attach="material" onBeforeCompile={goldMat.onBeforeCompile} customProgramCacheKey={goldMat.customProgramCacheKey} />
            </mesh>
          );
        })}
      </group>

      <mesh ref={helixSpin} geometry={helixGeo}>
        <primitive object={helixBaseMat} attach="material" onBeforeCompile={helixMat.onBeforeCompile} customProgramCacheKey={helixMat.customProgramCacheKey} />
      </mesh>

      <group ref={cubesSpin}>
        {[0, 1, 2].map((i) => {
          const a = (i / 3) * Math.PI * 2;
          return (
            <mesh 
              key={i} 
              geometry={cubeGeo}
              position={[Math.cos(a) * 3.4, Math.sin(a * 1.7) * 1.2, Math.sin(a) * 3.4]}
            >
              <primitive object={goldBaseMat} attach="material" onBeforeCompile={goldMat.onBeforeCompile} customProgramCacheKey={goldMat.customProgramCacheKey} />
            </mesh>
          );
        })}
      </group>

      <PointCloud 
        count={620} 
        colorHex={acc2} 
        sizeMin={0.7} 
        sizeMax={2.6} 
        presenceRef={presenceRef}
        builder={(v) => {
          const a = Math.random() * Math.PI * 2;
          const r = 2.6 + Math.random() * 3.8;
          v.set(Math.cos(a) * r, (Math.random() - 0.5) * 4.0, Math.sin(a) * r);
        }}
      />
    </Artifact>
  );
}
