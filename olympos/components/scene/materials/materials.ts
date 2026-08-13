import * as THREE from 'three';

// Helpers to quickly create base materials, matching the look of the prototype
export function marble(colorHex: number | string, rough = 0.38, clearcoat = 0.55) {
  return new THREE.MeshPhysicalMaterial({
    color: colorHex,
    roughness: rough,
    metalness: 0.04,
    clearcoat: clearcoat,
    clearcoatRoughness: 0.3,
    envMapIntensity: 1.15,
    flatShading: false,
  });
}

export function stone(colorHex: number | string, rough = 0.5, metal = 0.1) {
  return new THREE.MeshPhysicalMaterial({
    color: colorHex,
    roughness: rough,
    metalness: metal,
    envMapIntensity: 1.4,
    clearcoat: 0.2,
  });
}

export function metalMat(colorHex: number | string, rough = 0.2) {
  return new THREE.MeshStandardMaterial({
    color: colorHex,
    metalness: 1.0,
    roughness: rough,
    envMapIntensity: 1.7,
  });
}

export function emissiveMat(colorHex: number | string, strength = 2.4) {
  return new THREE.MeshStandardMaterial({
    color: 0x000000,
    emissive: colorHex,
    emissiveIntensity: strength,
    roughness: 0.4,
    metalness: 0.0,
  });
}

export function addMat(colorHex: number | string, opacity: number) {
  return new THREE.MeshBasicMaterial({
    color: colorHex,
    transparent: true,
    opacity: opacity,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
    side: THREE.DoubleSide,
  });
}
