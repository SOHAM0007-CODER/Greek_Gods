'use client';

import { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { useStore, rig } from '@/lib/store';
import { PANTHEON } from '@/lib/pantheon';
import { GLSL_NOISE } from './materials/useDissolve';

const DUST_SPAN = 260;

export function Atmosphere() {
  const dpr = useStore(s => s.dpr);
  const dustMat = useRef<THREE.ShaderMaterial>(null);
  const starsMat = useRef<THREE.ShaderMaterial>(null);
  const seaMat = useRef<THREE.ShaderMaterial>(null);

  // Dust
  const { dustPos, dustSz, dustPh } = useMemo(() => {
    const count = 1500;
    const pos = new Float32Array(count * 3);
    const sz = new Float32Array(count);
    const ph = new Float32Array(count);
    for (let i = 0; i < count; i++) {
      pos[i * 3] = (Math.random() - 0.5) * 150;
      pos[i * 3 + 1] = (Math.random() - 0.5) * DUST_SPAN;
      pos[i * 3 + 2] = (Math.random() - 0.5) * 150;
      sz[i] = 0.5 + Math.random() * 2.2;
      ph[i] = Math.random() * 6.283;
    }
    return { dustPos: pos, dustSz: sz, dustPh: ph };
  }, []);

  const dustU = useMemo(() => ({
    uTime: { value: 0 },
    uCamY: { value: 0 },
    uPix: { value: dpr },
    uSpeed: { value: 0 },
    uColor: { value: new THREE.Color(0xdfe6f5) },
  }), [dpr]);

  // Stars
  const { starsPos, starsSz } = useMemo(() => {
    const count = 2000;
    const pos = new Float32Array(count * 3);
    const sz = new Float32Array(count);
    for (let i = 0; i < count; i++) {
      const u = Math.random() * 2 - 1, a = Math.random() * Math.PI * 2, r = Math.sqrt(1 - u * u);
      pos[i * 3] = Math.cos(a) * r * 300;
      pos[i * 3 + 1] = u * 300;
      pos[i * 3 + 2] = Math.sin(a) * r * 300;
      sz[i] = Math.random() * Math.random() * 3.4 + 0.4;
    }
    return { starsPos: pos, starsSz: sz };
  }, []);

  const starsU = useMemo(() => ({
    uPix: { value: dpr },
    uTime: { value: 0 },
    uFade: { value: 1 },
  }), [dpr]);

  // Sea
  const seaU = useMemo(() => ({
    uTime: { value: 0 },
    uAudio: { value: 0 },
    uColor: { value: new THREE.Color(PANTHEON[0].accent) },
    uColor2: { value: new THREE.Color(PANTHEON[0].accent2) },
  }), []);

  useFrame((state) => {
    const t = state.clock.elapsedTime;
    const activeGod = PANTHEON[useStore.getState().active] || PANTHEON[0];
    
    if (dustMat.current) {
      dustMat.current.uniforms.uTime.value = t;
      dustMat.current.uniforms.uCamY.value = state.camera.position.y;
      dustMat.current.uniforms.uSpeed.value = Math.abs(rig.vel);
    }
    if (starsMat.current) {
      starsMat.current.uniforms.uTime.value = t;
    }
    if (seaMat.current) {
      seaMat.current.uniforms.uTime.value = t;
      seaMat.current.uniforms.uAudio.value = rig.audio;
      seaMat.current.uniforms.uColor.value.lerp(new THREE.Color(activeGod.accent), 0.05);
      seaMat.current.uniforms.uColor2.value.lerp(new THREE.Color(activeGod.accent2), 0.05);
    }
  });

  return (
    <group>
      <points frustumCulled={false}>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" count={dustPos.length / 3} array={dustPos} itemSize={3} />
          <bufferAttribute attach="attributes-aSize" count={dustSz.length} array={dustSz} itemSize={1} />
          <bufferAttribute attach="attributes-aPhase" count={dustPh.length} array={dustPh} itemSize={1} />
        </bufferGeometry>
        <shaderMaterial
          ref={dustMat}
          uniforms={dustU}
          transparent
          depthWrite={false}
          blending={THREE.AdditiveBlending}
          vertexShader={`
            attribute float aSize; attribute float aPhase;
            uniform float uTime; uniform float uCamY; uniform float uPix; uniform float uSpeed;
            varying float vA;
            void main(){
              vec3 p = position;
              p.y = mod(p.y - uCamY + ${(DUST_SPAN / 2.0).toFixed(1)}, ${DUST_SPAN.toFixed(1)}) - ${(DUST_SPAN / 2.0).toFixed(1)} + uCamY;
              p.x += sin(uTime*0.25 + aPhase)*1.6;
              p.z += cos(uTime*0.21 + aPhase)*1.6;
              vec4 mv = modelViewMatrix * vec4(p,1.0);
              float d = max(-mv.z, 1.0);
              gl_PointSize = aSize * uPix * (30.0/d) * (1.0 + uSpeed*3.0);
              gl_Position = projectionMatrix * mv;
              vA = smoothstep(200.0, 20.0, d) * (0.35 + uSpeed*0.65);
            }`}
          fragmentShader={`
            uniform vec3 uColor; varying float vA;
            void main(){
              float d = length(gl_PointCoord - vec2(0.5));
              if (d > 0.5) discard;
              gl_FragColor = vec4(uColor, pow(1.0-d*2.0, 2.0) * vA * 0.8);
            }`}
        />
      </points>

      <points frustumCulled={false}>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" count={starsPos.length / 3} array={starsPos} itemSize={3} />
          <bufferAttribute attach="attributes-aSize" count={starsSz.length} array={starsSz} itemSize={1} />
        </bufferGeometry>
        <shaderMaterial
          ref={starsMat}
          uniforms={starsU}
          transparent
          depthWrite={false}
          blending={THREE.AdditiveBlending}
          fog={false}
          vertexShader={`attribute float aSize; uniform float uPix; varying float vS;
            void main(){ vS = aSize;
              gl_PointSize = aSize * uPix * 1.1;
              gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }`}
          fragmentShader={`uniform float uFade; varying float vS;
            void main(){
              float d = length(gl_PointCoord - vec2(0.5));
              if (d > 0.5) discard;
              gl_FragColor = vec4(vec3(0.85,0.9,1.0), pow(1.0-d*2.0,2.5) * uFade * 0.9);
            }`}
        />
      </points>

      <mesh rotation={[-Math.PI / 2, 0, 0]} frustumCulled={false} position={[0, -160, 0]}>
        <planeGeometry args={[600, 600, 150, 150]} />
        <shaderMaterial
          ref={seaMat}
          uniforms={seaU}
          transparent
          depthWrite={false}
          side={THREE.DoubleSide}
          blending={THREE.AdditiveBlending}
          vertexShader={GLSL_NOISE + `
            uniform float uTime; uniform float uAudio; varying float vH; varying vec2 vUv;
            void main(){
              vUv = uv; vec3 p = position;
              float n = snoise(vec3(p.xy*0.012, uTime*0.06));
              float n2 = snoise(vec3(p.xy*0.045, uTime*0.11));
              vH = n*3.4 + n2*1.1;
              p.z += vH * (1.0 + uAudio*0.8);
              gl_Position = projectionMatrix * modelViewMatrix * vec4(p,1.0);
            }`}
          fragmentShader={`
            uniform vec3 uColor; uniform vec3 uColor2; uniform float uAudio;
            varying float vH; varying vec2 vUv;
            void main(){
              float r = length(vUv - vec2(0.5)) * 2.0;
              float crest = smoothstep(0.4, 2.4, vH);
              vec3 col = mix(uColor*0.35, uColor2, crest);
              float a = (1.0 - smoothstep(0.15, 0.85, r)) * (0.10 + crest*0.42) * (0.8 + uAudio*0.5);
              gl_FragColor = vec4(col, a);
            }`}
        />
      </mesh>
    </group>
  );
}
