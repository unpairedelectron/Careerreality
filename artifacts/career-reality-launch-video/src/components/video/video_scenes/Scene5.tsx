import { motion } from 'framer-motion';
import { SceneShell, Kicker, CornerIndex, EASE } from './shared';

const chips = ['salary', 'company', 'layoffs', 'AI impact', 'next step'];

export function Scene5() {
  return (
    <SceneShell accent="coral">
      <CornerIndex value="05 / 07" />
      <div className="absolute left-[9vw] top-[18%]">
        <Kicker>FROM QUESTION TO CLARITY</Kicker>
        <motion.h2 className="display mt-[1vw] max-w-[51vw] text-[clamp(38px,5.8vw,110px)] leading-[.88] text-[#f3eee4]" initial={{ opacity: 0, scale: .94 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: .2, duration: .9, ease: EASE }}>
          Ask better.<br /><span className="text-[#e97862]">Move wiser.</span>
        </motion.h2>
      </div>
      <motion.div className="absolute bottom-[11vw] left-[9vw] flex w-[67vw] items-center gap-[.8vw]" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: .72, duration: .5 }}>
        {chips.map((chip, index) => (
          <motion.div key={chip} className={`mono flex h-[3vw] items-center px-[1vw] text-[clamp(8px,.7vw,13px)] uppercase tracking-[.08em] ${index === 4 ? 'bg-[#e97862] text-[#132d2a]' : 'border border-[#f3eee4]/24 bg-[#f3eee4]/6 text-[#f3eee4]/74'}`} initial={{ opacity: 0, y: 18, scale: .9 }} animate={{ opacity: 1, y: 0, scale: 1 }} transition={{ delay: .82 + index * .11, duration: .42, ease: EASE }}>
            {chip}
          </motion.div>
        ))}
        <motion.div className="h-px flex-1 bg-[#e97862]" initial={{ scaleX: 0, transformOrigin: 'left' }} animate={{ scaleX: 1 }} transition={{ delay: 1.55, duration: .5, ease: EASE }} />
      </motion.div>
      <motion.p className="absolute bottom-[5.3vw] left-[9vw] text-[clamp(11px,1vw,19px)] text-[#f3eee4]/58" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.18, duration: .45 }}>
        One private workspace. Every consequential signal in one place.
      </motion.p>
    </SceneShell>
  );
}