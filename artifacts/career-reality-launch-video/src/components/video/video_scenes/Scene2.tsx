import { motion } from 'framer-motion';
import { SceneShell, Kicker, Rule, CornerIndex, EASE } from './shared';

const rows = [
  ['OFFER', '₹18.0L CTC', 'looks good'],
  ['IN-HAND', '₹1.18L / mo', 'the actual move'],
  ['RISK', 'unpriced', 'ask again'],
];

export function Scene2() {
  return (
    <SceneShell accent="saffron">
      <CornerIndex value="02 / 07" />
      <div className="absolute left-[9vw] top-[17%] w-[35vw]">
        <Kicker>THE FIRST LIE IS A NUMBER</Kicker>
        <motion.h2 className="display mt-[1vw] text-[clamp(34px,5vw,94px)] leading-[.9] text-[#f3eee4]" initial={{ opacity: 0, x: -30 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: .24, duration: .78, ease: EASE }}>
          CTC is not<br /><span className="text-[#e5ad56]">cash.</span>
        </motion.h2>
        <motion.p className="mt-[1.7vw] max-w-[26vw] text-[clamp(12px,1.05vw,20px)] leading-[1.45] text-[#f3eee4]/62" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: .8, duration: .55 }}>
          Decode the offer into what reaches your bank account — and what quietly disappears.
        </motion.p>
      </div>
      <motion.div className="paper-card absolute right-[10vw] top-[17%] w-[31vw] rotate-[2.6deg] p-[2.1vw]" initial={{ opacity: 0, scale: .8, rotate: 9 }} animate={{ opacity: 1, scale: 1, rotate: 2.6 }} transition={{ delay: .42, duration: 1, ease: EASE }}>
        <div className="flex items-center justify-between border-b border-[#132d2a]/15 pb-[.75vw]"><span className="mono text-[clamp(9px,.65vw,12px)] tracking-[.15em] text-[#132d2a]/50">OFFER / 24–25</span><span className="h-[.5vw] w-[.5vw] rounded-full bg-[#e97862]" /></div>
        <div className="mt-[1.3vw] space-y-[1vw]">
          {rows.map(([label, value, note], index) => (
            <motion.div key={label} className="grid grid-cols-[1fr_1.4fr_.9fr] items-baseline gap-[.6vw] border-b border-[#132d2a]/10 pb-[.75vw]" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: .75 + index * .16, duration: .45, ease: EASE }}>
              <span className="mono text-[clamp(8px,.6vw,11px)] tracking-[.14em] text-[#132d2a]/54">{label}</span>
              <span className={`display text-[clamp(18px,2vw,38px)] ${index === 1 ? 'text-[#114c43]' : 'text-[#132d2a]'}`}>{value}</span>
              <span className="text-right text-[clamp(8px,.62vw,12px)] text-[#132d2a]/45">{note}</span>
            </motion.div>
          ))}
        </div>
        <div className="mt-[1.2vw] flex items-center justify-between"><span className="mono text-[clamp(8px,.6vw,11px)] uppercase tracking-[.13em] text-[#114c43]">usable truth</span><span className="text-[clamp(12px,1vw,18px)] font-bold text-[#e97862]">→</span></div>
      </motion.div>
      <Rule width="10vw" />
    </SceneShell>
  );
}