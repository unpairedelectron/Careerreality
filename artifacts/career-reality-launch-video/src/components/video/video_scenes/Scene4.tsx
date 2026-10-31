import { motion } from 'framer-motion';
import { SceneShell, Kicker, CornerIndex, EASE } from './shared';

const bars = [42, 68, 57, 84, 76, 92, 63];

export function Scene4() {
  return (
    <SceneShell accent="saffron">
      <CornerIndex value="04 / 07" />
      <motion.img
        src={`${import.meta.env.BASE_URL}assets/editorial-paper.jpg`}
        alt=""
        className="absolute inset-0 h-full w-full object-cover opacity-[.08] mix-blend-screen"
        initial={{ scale: 1.08, opacity: 0 }}
        animate={{ scale: 1, opacity: .08 }}
        transition={{ duration: 1.4, ease: EASE }}
      />
      <div className="absolute right-[9vw] top-[16%] w-[37vw]">
        <Kicker>THE DESK BEHIND THE DECISION</Kicker>
        <motion.h2 className="display mt-[1vw] text-[clamp(35px,4.7vw,88px)] leading-[.92] text-[#f3eee4]" initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: .22, duration: .75, ease: EASE }}>
          Evidence<br /><span className="text-[#e5ad56]">over noise.</span>
        </motion.h2>
        <motion.p className="mt-[1.6vw] max-w-[28vw] text-[clamp(11px,1vw,19px)] leading-[1.45] text-[#f3eee4]/62" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: .8, duration: .55 }}>
          A living intelligence layer for the parts of work no one puts in the job description.
        </motion.p>
      </div>
      <motion.div className="paper-card absolute left-[9vw] top-[18%] w-[34vw] -rotate-[3deg] p-[2vw]" initial={{ opacity: 0, x: -30, rotate: -12 }} animate={{ opacity: 1, x: 0, rotate: -3 }} transition={{ delay: .4, duration: 1, ease: EASE }}>
        <div className="flex justify-between border-b border-[#132d2a]/15 pb-[.7vw]">
          <span className="mono text-[clamp(8px,.62vw,12px)] tracking-[.15em] text-[#132d2a]/48">CAREERREALITY INDEX</span>
          <span className="text-[clamp(9px,.68vw,13px)] text-[#e97862]">live</span>
        </div>
        <div className="mt-[1.4vw] flex h-[11vw] items-end gap-[1vw] border-b border-l border-[#132d2a]/18 px-[.8vw] pb-[.8vw]">
            {bars.map((height, index) => (
              <motion.div key={`bar-${index}`} className={`flex-1 ${index === 5 ? 'bg-[#e97862]' : 'bg-[#114c43]'}`} initial={{ height: 0 }} animate={{ height: `${height}%` }} transition={{ delay: .68 + index * .08, duration: .55, ease: EASE }} />
          ))}
        </div>
        <div className="mt-[1vw] flex items-end justify-between"><span className="display text-[clamp(28px,3vw,58px)] text-[#114c43]">72.4</span><span className="text-right text-[clamp(9px,.65vw,12px)] leading-[1.3] text-[#132d2a]/52">signal strength<br />role / market / company</span></div>
      </motion.div>
    </SceneShell>
  );
}