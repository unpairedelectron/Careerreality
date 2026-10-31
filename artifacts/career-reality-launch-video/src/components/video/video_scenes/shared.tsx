import { motion } from 'framer-motion';
import type { CSSProperties, ReactNode } from 'react';

export const EASE = [0.16, 1, 0.3, 1] as const;
const charContainerVariants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.025, delayChildren: 0.12 } },
} as any;
const charVariants = {
  hidden: { opacity: 0, y: 32, rotateX: -55 },
  visible: { opacity: 1, y: 0, rotateX: 0, transition: { duration: 0.52, ease: EASE } },
} as any;

export function SceneShell({
  children,
  accent = 'coral',
  className = '',
}: {
  children: ReactNode;
  accent?: 'coral' | 'saffron' | 'paper';
  className?: string;
}) {
  const accentColor = accent === 'coral' ? 'var(--color-accent)' : accent === 'saffron' ? 'var(--color-saffron)' : 'var(--color-paper)';
  return (
    <motion.div
      className={`absolute inset-0 overflow-hidden ${className}`}
      initial={{ opacity: 0, clipPath: 'inset(0 0 100% 0)' }}
      animate={{ opacity: 1, clipPath: 'inset(0 0 0% 0)' }}
      exit={{ opacity: 0, clipPath: 'inset(100% 0 0 0)' }}
      transition={{ duration: 0.72, ease: EASE }}
      style={{ background: 'linear-gradient(135deg, #0b3d37 0%, #092f2b 54%, #062521 100%)', '--scene-accent': accentColor } as CSSProperties}
    >
      <div className="absolute -left-[12vw] -top-[20vw] h-[42vw] w-[42vw] rounded-full opacity-20 blur-[1px]" style={{ background: 'radial-gradient(circle, var(--scene-accent), transparent 66%)' }} />
      <div className="absolute inset-0 film-grid opacity-50" />
      <div className="scan-line" />
      {children}
    </motion.div>
  );
}

export function Kicker({ children, light = false }: { children: ReactNode; light?: boolean }) {
  return (
    <motion.div
      className={`mono text-[clamp(9px,0.72vw,14px)] uppercase ${light ? 'text-[#f3eee4]/55' : 'text-[#e97862]'}`}
      initial={{ opacity: 0, x: -18 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: 0.12, duration: 0.45, ease: EASE }}
    >
      {children}
    </motion.div>
  );
}

export function Rule({ width = '5vw' }: { width?: string }) {
  return <motion.div initial={{ scaleX: 0, transformOrigin: 'left' }} animate={{ scaleX: 1 }} transition={{ delay: 0.18, duration: 0.56, ease: EASE }} className="h-px bg-[#e97862]" style={{ width }} />;
}

export function Wordmark({ compact = false }: { compact?: boolean }) {
  return (
    <div className="wordmark flex items-center gap-[0.6vw] text-[clamp(13px,1.08vw,21px)] text-[#f3eee4]">
      <span className="inline-flex h-[1.1em] w-[1.1em] items-center justify-center border border-[#e97862] text-[.72em] text-[#e97862]">CR</span>
      <span>CareerReality</span>
      {compact ? null : <span className="mono ml-[.35vw] text-[.46em] font-normal tracking-[.16em] text-[#f3eee4]/40">/ INDIA</span>}
    </div>
  );
}

export function CornerIndex({ value }: { value: string }) {
  return <div className="mono absolute right-[5.8vw] top-[5.1vw] text-[clamp(9px,.68vw,13px)] tracking-[.15em] text-[#f3eee4]/40">{value}</div>;
}

export function CharText({ children, className = '' }: { children: string; className?: string }) {
  return (
    <motion.span className={`inline-flex ${className}`} initial="hidden" animate="visible" variants={charContainerVariants}>
      {children.split('').map((char, index) => (
        <motion.span key={`${char}-${index}`} className="inline-block" variants={charVariants}>
          {char === ' ' ? '\u00a0' : char}
        </motion.span>
      ))}
    </motion.span>
  );
}