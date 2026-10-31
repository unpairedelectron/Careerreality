import { motion } from 'framer-motion';
import { SceneShell, Kicker, CornerIndex, EASE, Wordmark } from './shared';

export function Scene6() {
  return (
    <SceneShell accent="paper">
      <CornerIndex value="06 / 07" />
      <div className="absolute left-[9vw] top-[17%]">
        <Kicker light>INDIA'S MOST HONEST CAREER PLATFORM</Kicker>
        <motion.h2 className="display mt-[1vw] max-w-[65vw] text-[clamp(38px,6vw,115px)] leading-[.86] text-[#f3eee4]" initial={{ opacity: 0, y: 38 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: .22, duration: .85, ease: EASE }}>
          The reality check<br /><span className="text-[#e5ad56]">your career deserved.</span>
        </motion.h2>
      </div>
      <motion.div className="absolute bottom-[8.5vw] right-[9vw] flex items-center gap-[1.2vw]" initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: .84, duration: .6, ease: EASE }}>
        <div className="h-px w-[6vw] bg-[#e5ad56]" />
        <span className="text-[clamp(11px,1vw,19px)] text-[#f3eee4]/62">built for the next right move</span>
      </motion.div>
      <motion.div className="absolute bottom-[5.1vw] left-[9vw]" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 1.05, duration: .45 }}>
        <Wordmark />
      </motion.div>
    </SceneShell>
  );
}