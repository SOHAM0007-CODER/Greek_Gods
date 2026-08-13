import { create } from 'zustand';

type S = {
  active: number;
  entered: boolean;
  narrating: boolean;
  dpr: number;
  setActive: (i: number) => void;
  setEntered: (v: boolean) => void;
  setNarrating: (v: boolean) => void;
  setDpr: (v: number) => void;
};

export const useStore = create<S>((set) => ({
  active: 0,
  entered: false,
  narrating: false,
  dpr: 1.5,
  setActive: (active) => set({ active }),
  setEntered: (entered) => set({ entered }),
  setNarrating: (narrating) => set({ narrating }),
  setDpr: (dpr) => set({ dpr }),
}));

// mutable, non-reactive — read/written inside useFrame only
export const rig = {
  p: 0,
  target: 0,
  vel: 0,
  audio: 0,
  mx: 0,
  my: 0,
  intro: 1
};
