'use client';

import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { Artifact } from '../Artifact';
import { PANTHEON } from '@/lib/pantheon';
import { useDissolve, GLSL_NOISE } from '../materials/useDissolve';
import { marble, metalMat } from '../materials/materials';
import { PointCloud } from '../materials/Points';
import { rig, useStore } from '@/lib/store';

function smooth(t: number) { return t * t * (3 - 2 * t); }

export function Poseidon({ index = 3 }: { index?: number }) {
  const god = PANTHEON[index];
  const presenceRef = useRef(0);
  const acc2 = god.accent2;

  const coreMat = useDissolve(acc2, 1.0, 'poseidon_core');
  const bronzeMat = useDissolve(acc2, 0.8, 'poseidon_bronze');
  
  const coreGeo = useMemo(() => new THREE.TorusKnotGeometry(1.08, 0.29, 200, 22, 2, 3), []);
  const coreBaseMat = useMemo(() => marble(0xbfd8d4, 0.16, 1.0), []);
  const bronzeBaseMat = useMemo(() => metalMat(0x9ecfc8, 0.14), []);

  const coreSpin = useRef<THREE.Mesh>(null);
  const waterMatRef = useRef<THREE.ShaderMaterial>(null);

  const waterU = useMemo(() => ({
    uTime: { value: 0 },
    uAudio: { value: 0 },
    uPresence: { value: 0 },
    uColor: { value: new THREE.Color(acc2) }
  }), [acc2]);

  useFrame((state, dt) => {
    const t = state.clock.elapsedTime;
    const p = presenceRef.current;
    
    // Update dissolves
    coreMat.uDissolve.current.value = Math.pow(1 - smooth(p), 0.85) * 1.05;
    bronzeMat.uDissolve.current.value = Math.pow(1 - smooth(p), 0.85) * 1.05;
    
    // Spin
    if (coreSpin.current) {
      coreSpin.current.rotation.x += 0.05 * dt;
      coreSpin.current.rotation.y += 0.12 * dt;
    }
    
    if (waterMatRef.current) {
      waterMatRef.current.uniforms.uTime.value = t;
      waterMatRef.current.uniforms.uAudio.value = rig.audio;
      waterMatRef.current.uniforms.uPresence.value = smooth(p);
    }
  });

  return (
    <Artifact index={index} presenceRef={presenceRef}>
      
      <mesh ref={coreSpin} geometry={coreGeo}>
        <primitive object={coreBaseMat} attach="material" onBeforeCompile={coreMat.onBeforeCompile} customProgramCacheKey={coreMat.customProgramCacheKey} />
      </mesh>

      <group position={[0, -0.4, -1.6]} rotation={[0, 0, 0.16]}>
        <mesh position={[0, 0, 0]}>
          <cylinderGeometry args={[0.045, 0.045, 4.6, 10]} />
          <primitive object={bronzeBaseMat} attach="material" onBeforeCompile={bronzeMat.onBeforeCompile} customProgramCacheKey={bronzeMat.customProgramCacheKey} />
        </mesh>
        {[-1, 0, 1].map((i) => (
          <group key={i}>
            <mesh position={[i * 0.42, 2.85, 0]}>
              <cylinderGeometry args={[0.032, 0.032, 1.25, 8]} />
              <primitive object={bronzeBaseMat} attach="material" onBeforeCompile={bronzeMat.onBeforeCompile} customProgramCacheKey={bronzeMat.customProgramCacheKey} />
            </mesh>
            <mesh position={[i * 0.42, 3.66, 0]}>
              <coneGeometry args={[0.055, 0.42, 8]} />
              <primitive object={bronzeBaseMat} attach="material" onBeforeCompile={bronzeMat.onBeforeCompile} customProgramCacheKey={bronzeMat.customProgramCacheKey} />
            </mesh>
          </group>
        ))}
        <mesh position={[0, 2.25, 0]}>
          <boxGeometry args={[1.1, 0.07, 0.07]} />
          <primitive object={bronzeBaseMat} attach="material" onBeforeCompile={bronzeMat.onBeforeCompile} customProgramCacheKey={bronzeMat.customProgramCacheKey} />
        </mesh>
      </group>

      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -2.6, 0]}>
        <circleGeometry args={[7.2, 128]} />
        <shaderMaterial
          ref={waterMatRef}
          uniforms={waterU}
          transparent
          depthWrite={false}
          blending={THREE.AdditiveBlending}
          side={THREE.DoubleSide}
          vertexShader={`uniform float uTime; uniform float uAudio; varying vec2 vUv; varying float vH;
            void main(){ vUv = uv; vec3 p = position;
              float r = length(p.xy);
              vH = sin(r*3.0 - uTime*2.2)*0.16 + sin(r*7.0 - uTime*3.4)*0.07;
              p.z += vH * (1.0 + uAudio*2.0);
              gl_Position = projectionMatrix * modelViewMatrix * vec4(p,1.0); }`}
          fragmentShader={`uniform vec3 uColor; uniform float uPresence; uniform float uAudio;
            varying vec2 vUv; varying float vH;
            void main(){
              float r = length(vUv - vec2(0.5)) * 2.0;
              float ring = abs(vH) * 5.0;
              float a = (1.0 - smoothstep(0.35, 1.0, r)) * ring * (0.35 + uAudio*0.6) * uPresence;
              gl_FragColor = vec4(uColor, a);
            }`}
        />
      </mesh>

      <PointCloud 
        count={820} 
        colorHex={acc2} 
        sizeMin={0.7} 
        sizeMax={2.8} 
        presenceRef={presenceRef}
        builder={(v) => {
          const a = Math.random() * Math.PI * 2;
          const r = 2.4 + Math.random() * 5.2;
          v.set(Math.cos(a) * r, (Math.random() - 0.5) * 4.6, Math.sin(a) * r);
        }}
      />
    </Artifact>
  );
}
