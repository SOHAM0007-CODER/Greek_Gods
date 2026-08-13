'use client';

import { Canvas } from '@react-three/fiber';
import { Environment } from '@react-three/drei';
import { EffectComposer, Bloom, ChromaticAberration, Vignette, Noise } from '@react-three/postprocessing';
import * as THREE from 'three';
import { useStore, rig } from '@/lib/store';
import { PANTHEON } from '@/lib/pantheon';
import { CameraRig } from './CameraRig';
import { Atmosphere } from './Atmosphere';

import { Zeus } from './gods/Zeus';
import { Athena } from './gods/Athena';
import { Apollo } from './gods/Apollo';
import { Poseidon } from './gods/Poseidon';
import { Hades } from './gods/Hades';

export function Scene() {
  const dpr = useStore(s => s.dpr);
  const fogCol = new THREE.Color(PANTHEON[0].fog);

  return (
    <div id="stage">
      <Canvas
        dpr={[1, dpr]}
        gl={{ antialias: true, powerPreference: 'high-performance', stencil: false }}
        camera={{ fov: 38, near: 0.1, far: 800, position: [0, 6, 40] }}
        onCreated={({ gl, scene }) => {
          gl.outputColorSpace = THREE.SRGBColorSpace;
          gl.toneMapping = THREE.ACESFilmicToneMapping;
          gl.toneMappingExposure = 1.16;
          scene.fog = new THREE.FogExp2(fogCol.getHex(), 0.0125);
          scene.background = fogCol.clone();
        }}
      >
        <Environment preset="sunset" />
        
        {/* Cinematic 3-point lighting */}
        <directionalLight color={0xfff2d8} intensity={3.2} position={[6, 9, 7]} />
        <directionalLight color={0x8fb6ff} intensity={2.2} position={[-8, 2, -6]} />
        <hemisphereLight color={0xbfd4ff} groundColor={0x120a08} intensity={0.55} />
        <pointLight color={0xffffff} intensity={60} distance={46} decay={2.0} />

        <CameraRig />
        <Atmosphere />

        <Zeus index={0} />
        <Athena index={1} />
        <Apollo index={2} />
        <Poseidon index={3} />
        <Hades index={4} />

        <EffectComposer disableNormalPass>
          {/* Bloom intensity driven by audio in useFrame normally, here statically or softly pulsing */}
          <Bloom intensity={0.85} luminanceThreshold={0.75} luminanceSmoothing={0.3} mipmapBlur />
          <ChromaticAberration offset={new THREE.Vector2(0.0006, 0.0006)} />
          <Vignette darkness={0.55} offset={0.32} />
          <Noise opacity={0.035} />
        </EffectComposer>
      </Canvas>
    </div>
  );
}
