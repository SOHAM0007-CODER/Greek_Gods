'use client';

import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { useStore, rig } from '@/lib/store';
import { PANTHEON, SPACING_Y } from '@/lib/pantheon';

function smooth(t: number) { return t * t * (3 - 2 * t); }
function clamp(v: number, a: number, b: number) { return v < a ? a : (v > b ? b : v); }

interface ArtifactProps {
  index: number;
  children: React.ReactNode;
  presenceRef: React.MutableRefObject<number>;
}

export function Artifact({ index, children, presenceRef }: ArtifactProps) {
  const groupRef = useRef<THREE.Group>(null);
  const innerRef = useRef<THREE.Group>(null);

  const { basePos, exitDir } = useMemo(() => {
    const a = index * 2.35;
    const basePos = new THREE.Vector3(Math.cos(a) * 11, -index * SPACING_Y, Math.sin(a) * 11);
    const exitDir = new THREE.Vector3(Math.cos(a + 1.2), 0.35, Math.sin(a + 1.2)).normalize();
    return { basePos, exitDir };
  }, [index]);

  useFrame(() => {
    if (!groupRef.current || !innerRef.current) return;
    
    // Distance from camera focal point (rig.p) to this artifact's index
    const dist = Math.abs(rig.p - index);
    const v = Math.max(0, 1 - dist); // 1 when active, 0 when one full step away
    
    presenceRef.current = v; // pass down to children via ref

    groupRef.current.visible = v > 0.004;
    
    if (groupRef.current.visible) {
      const e = smooth(clamp(v, 0, 1));
      innerRef.current.scale.setScalar(0.55 + 0.45 * e);
      
      const pos = basePos.clone().addScaledVector(exitDir, (1 - e) * 9);
      groupRef.current.position.copy(pos);
      
      innerRef.current.rotation.z = (1 - e) * 0.5;
    }
  });

  return (
    <group ref={groupRef} position={basePos}>
      <group ref={innerRef}>
        {children}
      </group>
    </group>
  );
}
