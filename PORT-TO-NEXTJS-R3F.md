# ΟΛΥΜΠΟΣ → Next.js 15 + React Three Fiber

The prototype (`index.html`) is deliberately framework-free so every technique is visible in one file. This is the map from that file to the stack you specified. Hand this to Claude Code / Antigravity together with `index.html` — the working reference is worth more than any description of it.

---

## 1. Install

```bash
npx create-next-app@latest olympos --typescript --tailwind --app --no-src-dir
cd olympos
npm i three @react-three/fiber @react-three/drei gsap zustand lucide-react
npm i -D @types/three
```

## 2. File tree

```
app/
  layout.tsx              # fonts (Cinzel, Cormorant Garamond, IBM Plex Mono via next/font)
  page.tsx                # <Threshold/> <Scene/> <Hud/>
  globals.css             # tokens from index.html <style>, verbatim
components/
  scene/
    Scene.tsx             # <Canvas dpr={[1,2]} gl={{antialias:true}} camera={{fov:38}}>
    CameraRig.tsx         # useFrame: CatmullRomCurve3 + bulge + shake  (§ "8. RENDER LOOP")
    Artifact.tsx          # one god; switch on god.key
    gods/                 # Zeus.tsx Athena.tsx Apollo.tsx Poseidon.tsx Hades.tsx
    Atmosphere.tsx        # Dust, Stars, Sea
    materials/
      useDissolve.ts      # onBeforeCompile injection (§ "dissolve injection")
      pointsMaterial.ts   # shaderMaterial() from drei
  ui/
    Plaque.tsx  IndexRail.tsx  DepthRail.tsx  Threshold.tsx  Tools.tsx
lib/
  pantheon.ts             # the PANTHEON array, unchanged
  store.ts                # zustand
  useAudio.ts             # AudioEngine as a hook
```

## 3. Store — keep scroll *out* of React

This is the single most important rule for holding 60fps. `p` (scroll position) changes every frame; if it lives in React state you re-render the tree 60×/sec.

```ts
// lib/store.ts
import { create } from 'zustand'

type S = {
  active: number          // integer index — CHANGES RARELY, safe in React
  entered: boolean
  narrating: boolean
  setActive: (i: number) => void
  setEntered: (v: boolean) => void
  setNarrating: (v: boolean) => void
}
export const useStore = create<S>((set) => ({
  active: 0, entered: false, narrating: false,
  setActive: (active) => set({ active }),
  setEntered: (entered) => set({ entered }),
  setNarrating: (narrating) => set({ narrating }),
}))

// mutable, non-reactive — read/written inside useFrame only
export const rig = { p: 0, target: 0, vel: 0, audio: 0, mx: 0, my: 0, intro: 1 }
```

`rig` is a plain object. `useFrame` mutates it. Only `setActive` (fired when `Math.round(rig.p)` changes) crosses into React, which repaints the plaque. Everything else — camera, dissolve, particles, fog — is written directly to `.current` refs and uniforms.

## 4. The dissolve material

Port `attachDissolve()` as a hook that returns a ref to the uniform so `useFrame` can drive it without a re-render:

```ts
export function useDissolve(edge: string, scale = 1.15) {
  const uDissolve = useRef({ value: 0 })
  const onBeforeCompile = useCallback((shader) => {
    shader.uniforms.uDissolve = uDissolve.current
    // ...identical injection to index.html
  }, [])
  return { uDissolve, onBeforeCompile }
}
```

```tsx
<meshPhysicalMaterial onBeforeCompile={onBeforeCompile} {...props} />
```

Caveat: three caches programs by shader source. Give each material a distinct `customProgramCacheKey` if you vary the injected GLSL per god.

## 5. GSAP + useFrame — who owns what

Split it cleanly or they fight over the same values:

| Owner | Drives |
| --- | --- |
| **GSAP** | `rig.target` (nav clicks, wheel snap), intro dolly `rig.intro`, all DOM/UI timelines |
| **useFrame** | `rig.p` damping toward `rig.target`, camera transform, uniforms, presence |

```tsx
useGSAP(() => {
  gsap.to(rig, { target: i, duration: 1.9, ease: 'power3.inOut' })
}, { dependencies: [i] })
```

Use `@gsap/react`'s `useGSAP` for automatic cleanup. Register ScrollTrigger only if you switch to real document scroll — the prototype uses a virtual scroll because the page is `overflow:hidden`, which is the right call for a fixed 3D stage. If you do want ScrollTrigger, render a tall empty `<div style={{height:'500vh'}}/>` and map `self.progress * (N-1)` into `rig.target`.

## 6. Canvas config

```tsx
<Canvas
  dpr={[1, 2]}
  gl={{ antialias: true, powerPreference: 'high-performance', stencil: false }}
  camera={{ fov: 38, near: 0.1, far: 800 }}
  onCreated={({ gl }) => {
    gl.outputColorSpace = THREE.SRGBColorSpace   // r150+; r128 used outputEncoding
    gl.toneMapping = THREE.ACESFilmicToneMapping
    gl.toneMappingExposure = 1.16
  }}
>
  <Suspense fallback={null}>
    <Environment preset="sunset" />   {/* replaces the hand-rolled PMREM canvas */}
    <Scene />
  </Suspense>
</Canvas>
<Loader />
```

**Version note:** the prototype targets three r128 (what the CDN sandbox provides). On modern three (r150+): `outputEncoding` → `outputColorSpace`, `sRGBEncoding` → `SRGBColorSpace`, `physicallyCorrectLights` is gone (it's the default; `useLegacyLights={false}`). Everything else ports unchanged.

## 7. Post-processing — the one real upgrade

The prototype fakes bloom with additive sprite halos because it has no post pipeline. In R3F, do it properly:

```bash
npm i @react-three/postprocessing postprocessing
```

```tsx
<EffectComposer disableNormalPass>
  <Bloom intensity={0.85} luminanceThreshold={0.75} luminanceSmoothing={0.3} mipmapBlur />
  <ChromaticAberration offset={[0.0006, 0.0006]} />
  <Vignette darkness={0.55} offset={0.32} />
  <Noise opacity={0.035} />
</EffectComposer>
```

Then drop the `makeHalo()` sprites and raise `emissiveIntensity` instead — real bloom on emissive geometry is the single biggest visual jump you'll get. Drive `Bloom.intensity` from the audio level for the narration pulse.

## 8. Swapping in real GLTF models

The five sculptures are procedural on purpose — they're stand-ins with correct materials, scale, and pivots. To replace one:

1. Model/download a `.glb`, run `npx gltfjsx model.glb --transform` (draco + ktx2 + a typed component).
2. Keep the wrapper: the `<Artifact>` group owns position, presence scaling, exit drift.
3. Reuse the dissolve: traverse the loaded scene, apply `onBeforeCompile` to every mesh material.
4. Keep model radius ≈ 1.5 units so the camera anchors still frame it.

Budget: ~150k tris total on screen, textures ≤ 2k, KTX2 compressed.

## 9. Audio

`AudioEngine` becomes `lib/useAudio.ts` — a module-level singleton (not React state) plus a tiny hook exposing `speak()`, `stop()`, `setGod()`. Read `engine.level` inside `useFrame`, never through state.

To swap the synthesised drones for real recordings: replace `makeDrone()` with `new Audio(src)` → `ctx.createMediaElementSource()` → the same analyser chain. The visualiser code doesn't change. Narration files per god go in `public/audio/{key}.mp3`; keep the `speechSynthesis` path as the fallback.

## 10. Quality floor before you call it done

- `dpr={[1,2]}`, adaptive drop below 42fps (`<AdaptiveDpr pixelated />` from drei does this for you)
- no `setState` in `useFrame` — ever
- `frustumCulled = false` only on camera-following particle fields
- respect `prefers-reduced-motion`: shorten the intro, skip the letter stagger
- visible `:focus-visible` on every control; the god index rail must be keyboard-navigable
- test on a phone with the Lite path forced — the 4K toggle exists for a reason
