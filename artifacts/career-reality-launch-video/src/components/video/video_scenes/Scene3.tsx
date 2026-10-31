import { motion } from 'framer-motion';
import { SceneShell, Kicker, CornerIndex, EASE } from './shared';

export function Scene3() {
  return (
    <SceneShell accent="coral">
      <CornerIndex value="03 / 07" />
      <div className="absolute left-[9vw] top-[19%]">
        <Kicker>READ THE SIGNAL, NOT THE HEADLINE</Kicker>
        <motion.h2 className="display mt-[1vw] max-w-[44vw] text-[clamp(36px,5.25vw,100px)] leading-[.9] text-[#f3eee4]" initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: .22, duration: .74, ease: EASE }}>
          Every move<br />has a <span className="text-[#e97862]">risk<br />profile.</span>
        </motion.h2>
      </div>
      <motion.div className="absolute right-[10vw] top-[18%] h-[25vw] w-[32vw]" initial={{ opacity: 0, scale: .85 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: .35, duration: .8, ease: EASE }}>
        <div className="absolute inset-0 border border-[#f3eee4]/18" />
        <div className="absolute left-1/2 top-0 h-full w-px bg-[#f3eee4]/15" />
        <div className="absolute left-0 top-1/2 h-px w-full bg-[#f3eee4]/15" />
        <div className="absolute inset-[2.5vw] border border-dashed border-[#e97862]/35 rounded-full" />
        <motion.div className="absolute left-[53%] top-[24%] h-[8vw] w-[8vw] rounded-full border border-[#e97862] bg-[#e97862]/14" animate={{ scale: [1, 1.1, 1], opacity: [.75, 1, .75] }} transition={{ duration: 2.8, repeat: Infinity, ease: 'easeInOut' }} />
        <motion.div className="absolute bottom-[21%] left-[23%] h-[1.6vw] w-[1.6vw] rounded-full bg-[#e5ad56]" animate={{ y: [0, -12, 0] }} transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }} />
        <div className="absolute -top-[1.8vw] left-0 mono text-[clamp(8px,.62vw,11px)] uppercase tracking-[.12em] text-[#f3eee4]/40">signal / confidence</div>
        <div className="absolute -bottom-[1.7vw] right-0 mono text-[clamp(8px,.62vw,11px)] uppercase tracking-[.12em] text-[#f3eee4]/40">uncertainty / time</div>
        <div className="absolute left-[56%] top-[7%] text-[clamp(8px,.65vw,12px)] text-[#e97862]">role change</div>
        <div className="absolute bottom-[18%] left-[11%] text-[clamp(8px,.65vw,12px)] text-[#e5ad56]">runway</div>
      </motion.div>
      <motion.div className="absolute bottom-[8.5vw] left-[9vw] max-w-[37vw] border-l border-[#e97862] pl-[1vw] text-[clamp(11px,.9vw,17px)] leading-[1.35] text-[#f3eee4]/64" initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 1, duration: .5 }}>
        Company health. Layoff signals. AI exposure. Your runway.
      </motion.div>
    </SceneShell>
  );
}