import { Threshold } from '@/components/ui/Threshold';
import { Plaque } from '@/components/ui/Plaque';
import { IndexRail } from '@/components/ui/IndexRail';
import { DepthRail } from '@/components/ui/DepthRail';
import { Tools } from '@/components/ui/Tools';
import { Scene } from '@/components/scene/Scene';

export default function Page() {
  return (
    <main>
      <Scene />
      
      {/* HUD & Overlays */}
      <div className="veil vignette"></div>
      <div className="veil grain"></div>
      <div className="bar top"></div>
      <div className="bar bottom"></div>
      <div id="cursor"></div>

      <Tools />
      <DepthRail />
      <IndexRail />
      <Plaque />
      
      <div className="hud hint" id="hint">
        <span>Scroll to descend</span>
        <div className="drop"></div>
      </div>

      <Threshold />
    </main>
  );
}
