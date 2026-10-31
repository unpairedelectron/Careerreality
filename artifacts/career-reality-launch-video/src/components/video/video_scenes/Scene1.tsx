import { motion } from 'framer-motion';
import { SceneShell, Kicker, Rule, Wordmark, CornerIndex, EASE } from './shared';

export function Scene1() {
  return (
    <SceneShell accent="coral">
      <CornerIndex value="01 / 07" />
      <div className="absolute left-[6vw] top-[5.1vw]"><Wordmark /></div>
      <motion.div className="absolute bottom-0 right-0 h-[93%] w-[56%] overflow-hidden border-l border-[#f3eee4]/10" initial={{ x: '18%', opacity: 0 }} animate={{ x: 0, opacity: 1 }} transition={{ duration: 1.3, ease: EASE }}>
        <img src={`${import.meta.env.BASE_URL}assets/career-desk.jpg`} alt="" className="h-full w-full object-cover opacity-55 mix-blend-screen" />
        <div className="absolute inset-0 bg-gradient-to-r from-[#092f2b] via-transparent to-transparent" />
        <div className="absolute inset-0 bg-[#092f2b]/25" />
      </motion.div>
      <div className="absolute left-[9vw] top-[27%] max-w-[48vw]">
        <Kicker>THE WORKING LIFE, UNEDITED</Kicker>
        <Rule width="8vw" />
        <motion.h1 className="display mt-[1.5vw] text-[clamp(44px,7.4vw,142px)] leading-[.86] text-[#f3eee4]" initial={{ opacity: 0, y: 42 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: .32, duration: .84, ease: EASE }}>
          Stop<br /><em className="text-[#e97862]">guessing.</em>
        </motion.h1>
        <motion.p className="mt-[2.1vw] max-w-[25vw] text-[clamp(12px,1.28vw,25px)] leading-[1.35] text-[#f3eee4]/68" initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: .78, duration: .6, ease: EASE }}>
          Your career is too important for vague advice and glossy promises.
        </motion.p>
      </div>
      <motion.div className="absolute bottom-[5vw] left-[9vw] mono text-[clamp(9px,.65vw,12px)] uppercase tracking-[.18em] text-[#f3eee4]/36" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.12, duration: .5 }}>
        A launch film for consequential decisions
      </motion.div>
    </SceneShell>
  );
}