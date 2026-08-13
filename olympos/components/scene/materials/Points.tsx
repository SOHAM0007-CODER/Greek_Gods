'use client';

import { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { useStore, rig } from '@/lib/store';

const POINT_VERT = `
attribute float aSize; attribute float aPhase; attribute float aSpeed;
uniform float uTime; uniform float uAudio; uniform float uPresence; uniform float uPix; uniform float uRise;
varying float vA;
void main(){
  vec3 p = position;
  float a = uTime * aSpeed;
  float c = cos(a), s = sin(a);
  p.xz = mat2(c, -s, s, c) * p.xz;
  if (uRise > 0.5){
    p.y = mod(p.y + uTime * (0.4 + aSpeed), 9.0) - 3.0;
  } else {
    p.y += sin(uTime * 0.8 + aPhase) * 0.4;
  }
  p *= 1.0 + uAudio * 0.16 * sin(aPhase + uTime * 2.6);
  vec4 mv = modelViewMatrix * vec4(p, 1.0);
  gl_PointSize = aSize * uPix * (44.0 / max(-mv.z, 0.6)) * (0.7 + uAudio * 0.85) * (0.35 + 0.65 * uPresence);
  gl_Position = projectionMatrix * mv;
  vA = uPresence * (0.5 + 0.5 * uAudio);
}`;

const POINT_FRAG = `
uniform vec3 uColor; varying float vA;
void main(){
  float d = length(gl_PointCoord - vec2(0.5));
  if (d > 0.5) discard;
  float a = pow(1.0 - d * 2.0, 2.3);
  gl_FragColor = vec4(uColor, a * vA);
}`;

interface PointCloudProps {
  count: number;
  colorHex: string | number;
  sizeMin: number;
  sizeMax: number;
  rise?: boolean;
  builder: (v: THREE.Vector3, i: number, count: number) => void;
  presenceRef: React.MutableRefObject<number>;
}

export function PointCloud({ count, builder, colorHex, sizeMin, sizeMax, rise = false, presenceRef }: PointCloudProps) {
  const dpr = useStore(s => s.dpr);
  const matRef = useRef<THREE.ShaderMaterial>(null);

  const { pos, size, ph, sp } = useMemo(() => {
    const pos = new Float32Array(count * 3);
    const size = new Float32Array(count);
    const ph = new Float32Array(count);
    const sp = new Float32Array(count);
    const v = new THREE.Vector3();
    for (let i = 0; i < count; i++) {
      builder(v, i, count);
      pos[i * 3] = v.x;
      pos[i * 3 + 1] = v.y;
      pos[i * 3 + 2] = v.z;
      size[i] = sizeMin + Math.random() * (sizeMax - sizeMin);
      ph[i] = Math.random() * Math.PI * 2;
      sp[i] = (Math.random() * 0.5 + 0.08) * (Math.random() < 0.5 ? -1 : 1);
    }
    return { pos, size, ph, sp };
  }, [count, builder, sizeMin, sizeMax]);

  const uniforms = useMemo(() => ({
    uTime: { value: 0 },
    uAudio: { value: 0 },
    uPresence: { value: 0 },
    uPix: { value: dpr },
    uColor: { value: new THREE.Color(colorHex) },
    uRise: { value: rise ? 1 : 0 },
  }), [dpr, colorHex, rise]);

  useFrame((state) => {
    if (!matRef.current) return;
    matRef.current.uniforms.uTime.value = state.clock.elapsedTime;
    matRef.current.uniforms.uAudio.value = rig.audio;
    matRef.current.uniforms.uPresence.value = presenceRef.current;
  });

  return (
    <points frustumCulled={false}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" count={count} array={pos} itemSize={3} />
        <bufferAttribute attach="attributes-aSize" count={count} array={size} itemSize={1} />
        <bufferAttribute attach="attributes-aPhase" count={count} array={ph} itemSize={1} />
        <bufferAttribute attach="attributes-aSpeed" count={count} array={sp} itemSize={1} />
      </bufferGeometry>
      <shaderMaterial
        ref={matRef}
        uniforms={uniforms}
        vertexShader={POINT_VERT}
        fragmentShader={POINT_FRAG}
        transparent
        depthWrite={false}
        blending={THREE.AdditiveBlending}
      />
    </points>
  );
}
