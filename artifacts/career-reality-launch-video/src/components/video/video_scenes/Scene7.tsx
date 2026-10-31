import { motion } from 'framer-motion';
import { SceneShell, CornerIndex, Wordmark, EASE } from './shared';

export function Scene7() {
  return (
    <SceneShell accent="coral" className="bg-[#f3eee4]">
      <CornerIndex value="07 / 07" />
      <motion.div className="absolute left-[9vw] top-[22%] w-[58vw]" initial={{ opacity: 0, scale: .95 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: .18, duration: .8, ease: EASE }}>
        <div className="mono mb-[1.2vw] text-[clamp(9px,.68vw,13px)] uppercase tracking-[.16em] text-[#e97862]">make the next decision with context</div>
        <h2 className="display text-[clamp(46px,7.2vw,138px)] leading-[.83] text-[#f3eee4]">Know what<br /><em className="text-[#e97862]">you’re choosing.</em></h2>
      </motion.div>
      <motion.div className="absolute bottom-[5vw] left-[9vw]" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: .9, duration: .45 }}><Wordmark /></motion.div>
      <motion.div className="absolute bottom-[5.2vw] right-[9vw] mono text-[clamp(9px,.7vw,13px)] uppercase tracking-[.16em] text-[#f3eee4]/45" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.05, duration: .45 }}>careerreality.in</motion.div>
      <motion.div className="absolute -right-[10vw] -top-[18vw] h-[41vw] w-[41vw] rounded-full border border-[#e97862]/25" animate={{ rotate: 360 }} transition={{ duration: 18, repeat: Infinity, ease: 'linear' }} />
    </SceneShell>
  );
}