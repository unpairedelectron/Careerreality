import {
  VideoCanvas,
  VideoPausedContext,
  type VideoAspectRatio,
  useVideoPlayer,
} from '@/lib/video';
import { AnimatePresence, motion } from 'framer-motion';
import { useEffect, useRef } from 'react';
import { Scene1 } from './video_scenes/Scene1';
import { Scene2 } from './video_scenes/Scene2';
import { Scene3 } from './video_scenes/Scene3';
import { Scene4 } from './video_scenes/Scene4';
import { Scene5 } from './video_scenes/Scene5';
import { Scene6 } from './video_scenes/Scene6';
import { Scene7 } from './video_scenes/Scene7';

export const SCENE_DURATIONS = {
  opening: 4200,
  ctc: 3900,
  risk: 4300,
  signal: 4100,
  workspace: 3600,
  promise: 3900,
  lockup: 4200,
};

const VIDEO_ASPECT_RATIO: VideoAspectRatio = '16:9';

const SCENE_COMPONENTS: Record<string, React.ComponentType> = {
  opening: Scene1,
  ctc: Scene2,
  risk: Scene3,
  signal: Scene4,
  workspace: Scene5,
  promise: Scene6,
  lockup: Scene7,
};

const SCENE_START_SEC: Record<string, number> = (() => {
  const starts: Record<string, number> = {};
  let cumulativeMs = 0;
  for (const [key, duration] of Object.entries(SCENE_DURATIONS)) {
    starts[key] = cumulativeMs / 1000;
    cumulativeMs += duration;
  }
  return starts;
})();

export default function VideoTemplate({
  durations = SCENE_DURATIONS,
  loop = true,
  paused = false,
  muted = false,
  audioEnabled = true,
  onSceneChange,
}: {
  durations?: Record<string, number>;
  loop?: boolean;
  paused?: boolean;
  muted?: boolean;
  audioEnabled?: boolean;
  onSceneChange?: (sceneKey: string) => void;
} = {}) {
  const { currentScene, currentSceneKey } = useVideoPlayer({
    durations,
    loop,
    paused,
  });
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const lastSceneKeyRef = useRef<string | null>(null);
  const baseSceneKey = currentSceneKey.replace(/_r[12]$/, '');
  const sceneIndex = Object.keys(SCENE_DURATIONS).indexOf(baseSceneKey);
  const SceneComponent = SCENE_COMPONENTS[baseSceneKey];

  useEffect(() => {
    onSceneChange?.(currentSceneKey);
  }, [currentSceneKey, onSceneChange]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    audio.volume = 0.22;
    if (paused) {
      audio.pause();
      return;
    }

    if (lastSceneKeyRef.current !== currentSceneKey) {
      lastSceneKeyRef.current = currentSceneKey;
      const targetTime = SCENE_START_SEC[baseSceneKey] ?? 0;
      if (Math.abs(audio.currentTime - targetTime) > 0.18) {
        audio.currentTime = targetTime;
      }
    }
    audio.play().catch(() => {});
  }, [baseSceneKey, currentSceneKey, paused]);

  return (
    <VideoPausedContext.Provider value={paused}>
      <VideoCanvas
        aspectRatio={VIDEO_ASPECT_RATIO}
        className="film-root"
        style={{ backgroundColor: '#092f2b' }}
      >
        <motion.div
          className="absolute inset-0"
          animate={{
            background: [
              'radial-gradient(circle at 13% 18%, rgba(233,120,98,.18), transparent 30%), linear-gradient(135deg,#0b3d37,#092f2b 55%,#062521)',
              'radial-gradient(circle at 80% 68%, rgba(229,173,86,.15), transparent 28%), linear-gradient(135deg,#062521,#0b3d37 55%,#092f2b)',
            ],
          }}
          transition={{ duration: 8, repeat: Infinity, repeatType: 'reverse', ease: 'easeInOut' }}
        />
        <motion.div
          className="absolute -left-[9vw] top-[54%] h-[18vw] w-[18vw] rounded-full bg-[#e97862]/12 blur-[2px]"
          animate={{ x: ['0vw', '7vw', '0vw'], y: ['0vw', '-3vw', '0vw'], scale: [1, 1.12, 1] }}
          transition={{ duration: 9, repeat: Infinity, ease: 'easeInOut' }}
        />
        <motion.div
          className="absolute right-[7vw] top-[12%] h-[10vw] w-[10vw] rounded-full border border-[#e5ad56]/20"
          animate={{ rotate: [0, 180, 360], scale: [1, 1.06, 1] }}
          transition={{ duration: 15, repeat: Infinity, ease: 'linear' }}
        />
        <div className="absolute inset-0 film-noise" />
        <div className="absolute inset-0 film-vignette" />
        <AnimatePresence mode="sync" initial={false}>
          {SceneComponent && <SceneComponent key={currentSceneKey} />}
        </AnimatePresence>
        {audioEnabled && (
          <audio
            ref={audioRef}
            src={`${import.meta.env.BASE_URL}audio/bg_music.mp3`}
            preload="auto"
            autoPlay
            loop
            muted={muted}
          />
        )}
      </VideoCanvas>
    </VideoPausedContext.Provider>
  );
}
