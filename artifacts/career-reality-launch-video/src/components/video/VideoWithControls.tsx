import {
  ChevronDown,
  ChevronUp,
  Lock,
  Pause,
  Play,
  Repeat,
  Volume2,
  VolumeX,
} from 'lucide-react';
import { useCallback, useEffect, useRef, useState } from 'react';

import VideoTemplate, {
  SCENE_DURATIONS,
} from '@/components/video/VideoTemplate';
import { useSceneControls } from './useSceneControls';

const PROGRESS_TICK_MS = 60;

const SCENE_DETAILS: Record<string, { title: string; filePath: string }> = {
  opening: { title: 'The question', filePath: 'src/components/video/video_scenes/Scene1.tsx' },
  ctc: { title: 'The number behind the number', filePath: 'src/components/video/video_scenes/Scene2.tsx' },
  risk: { title: 'The risk layer', filePath: 'src/components/video/video_scenes/Scene3.tsx' },
  signal: { title: 'The signal desk', filePath: 'src/components/video/video_scenes/Scene4.tsx' },
  workspace: { title: 'Your decision workspace', filePath: 'src/components/video/video_scenes/Scene5.tsx' },
  promise: { title: 'Less noise, more signal', filePath: 'src/components/video/video_scenes/Scene6.tsx' },
  lockup: { title: 'CareerReality', filePath: 'src/components/video/video_scenes/Scene7.tsx' },
};

function formatPlaybackTime(durationMs: number): string {
  const totalSeconds = Math.max(0, Math.floor(durationMs / 1000));
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
}

function announceSceneSelection(index: number, sceneKeys: string[]) {
  const key = sceneKeys[index];
  const details = SCENE_DETAILS[key];
  if (!details?.filePath) return;

  window.parent.postMessage(
    {
      type: 'REPLIT_VIDEO_SCENE_SELECTED',
      payload: {
        sceneIndex: index,
        sceneCount: sceneKeys.length,
        sceneTitle: details.title || key,
        filePath: details.filePath,
        lineNumber: 1,
      },
    },
    '*',
  );
}

function PlaybackStatus({
  sceneKeys,
  activeIndex,
  activeDuration,
  activeStartTime,
  totalDuration,
  tick,
  paused,
  onJumpTo,
}: {
  sceneKeys: string[];
  activeIndex: number;
  activeDuration: number;
  activeStartTime: number;
  totalDuration: number;
  tick: number;
  paused: boolean;
  onJumpTo: (index: number) => void;
}) {
  const [elapsed, setElapsed] = useState(0);
  const elapsedBaseRef = useRef(0);

  useEffect(() => {
    setElapsed(0);
    elapsedBaseRef.current = 0;
  }, [tick]);

  useEffect(() => {
    if (paused) return;
    const startedAt = performance.now();
    const intervalId = window.setInterval(() => {
      setElapsed(elapsedBaseRef.current + (performance.now() - startedAt));
    }, PROGRESS_TICK_MS);

    return () => {
      window.clearInterval(intervalId);
      elapsedBaseRef.current += performance.now() - startedAt;
    };
  }, [paused, tick]);

  const progress = activeDuration > 0 ? Math.min(1, elapsed / activeDuration) : 0;
  const totalElapsed = Math.min(
    totalDuration,
    activeStartTime + Math.min(elapsed, activeDuration),
  );

  return (
    <div className="video-playback-status flex min-w-0 flex-1 items-center gap-1.5">
      <div className="flex min-w-0 flex-1 items-center gap-1.5">
        {sceneKeys.map((key, index) => (
          <button
            key={key}
            type="button"
            onClick={() => onJumpTo(index)}
            className="relative h-3 min-h-3 flex-1 cursor-pointer overflow-hidden rounded-full bg-white/20 transition-all hover:h-4 hover:bg-white/25"
            aria-label={`Jump to scene ${index + 1}`}
            aria-current={index === activeIndex ? 'true' : undefined}
          >
            <span
              className="absolute inset-y-0 left-0 rounded-full bg-white/90 transition-[width] duration-100"
              style={{ width: `${index === activeIndex ? progress * 100 : 0}%` }}
            />
          </button>
        ))}
      </div>
      <div className="shrink-0 font-mono text-sm tabular-nums text-white/65">
        {activeIndex + 1}/{sceneKeys.length}
      </div>
      <div
        className="min-w-[9ch] shrink-0 text-right font-mono text-sm tabular-nums text-white/80"
        role="timer"
        aria-label={`Playback time ${formatPlaybackTime(totalElapsed)} of ${formatPlaybackTime(totalDuration)}`}
      >
        {formatPlaybackTime(totalElapsed)} / {formatPlaybackTime(totalDuration)}
      </div>
    </div>
  );
}

export default function VideoWithControls() {
  const isIframed =
    typeof window !== 'undefined' && window.self !== window.top;

  const {
    sceneKeys,
    activeIndex,
    locked,
    paused,
    mountKey,
    tick,
    durations,
    activeDuration,
    activeStartTime,
    totalDuration,
    onSceneChange,
    jumpTo,
    toggleLock,
    togglePause,
  } = useSceneControls(SCENE_DURATIONS);
  const audioEnabled =
    typeof window === 'undefined' ||
    new URLSearchParams(window.location.search).get('audio') !== 'off';
  const [muted, setMuted] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const [hovering, setHovering] = useState(false);
  const [tapPinned, setTapPinned] = useState(false);
  const sensorRef = useRef<HTMLDivElement | null>(null);

  const handleJumpTo = useCallback(
    (index: number) => {
      jumpTo(index);
      announceSceneSelection(index, sceneKeys);
    },
    [jumpTo, sceneKeys],
  );

  useEffect(() => {
    if (!paused) return;
    const frozenAnimations = document
      .getAnimations()
      .filter((animation) => animation.playState === 'running');
    frozenAnimations.forEach((animation) => animation.pause());
    return () => frozenAnimations.forEach((animation) => animation.play());
  }, [paused]);

  useEffect(() => {
    if (!(collapsed && tapPinned)) return;
    const handlePointerDown = (event: PointerEvent) => {
      if (event.pointerType === 'mouse') return;
      if (!sensorRef.current?.contains(event.target as Node)) {
        setTapPinned(false);
      }
    };
    document.addEventListener('pointerdown', handlePointerDown);
    return () => document.removeEventListener('pointerdown', handlePointerDown);
  }, [collapsed, tapPinned]);

  if (!isIframed) return <VideoTemplate />;

  const barVisible = !collapsed || hovering || tapPinned;

  return (
    <div className="relative h-[100dvh] w-full">
      <VideoTemplate
        key={mountKey}
        durations={durations}
        loop
        paused={paused}
        muted={muted}
        audioEnabled={audioEnabled}
        onSceneChange={onSceneChange}
      />
      <div
        ref={sensorRef}
        className="absolute bottom-0 left-0 right-0 z-50 flex h-1/4 flex-col justify-end"
        onPointerEnter={(event) => {
          if (event.pointerType === 'mouse') setHovering(true);
        }}
        onPointerLeave={(event) => {
          if (event.pointerType === 'mouse') setHovering(false);
        }}
        onPointerDown={(event) => {
          if (event.pointerType !== 'mouse' && collapsed) setTapPinned(true);
        }}
      >
        <div className="w-full flex-1" aria-hidden="true" />
        <div
          className={`video-controls-bar flex items-center gap-2 bg-[#072521]/85 px-3 py-2 text-white backdrop-blur-md transition-all duration-200 ${
            barVisible
              ? 'pointer-events-auto translate-y-0 opacity-100'
              : 'pointer-events-none translate-y-full opacity-0'
          }`}
          aria-hidden={!barVisible}
        >
          <button
            type="button"
            onClick={togglePause}
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md text-white/70 transition-colors hover:bg-white/10 hover:text-white"
            title={paused ? 'Play' : 'Pause'}
            aria-label={paused ? 'Play' : 'Pause'}
          >
            {paused ? <Play size={18} /> : <Pause size={18} />}
          </button>
          <button
            type="button"
            onClick={toggleLock}
            className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-md transition-colors ${
              locked ? 'bg-white/15 text-white' : 'text-white/70 hover:bg-white/10 hover:text-white'
            }`}
            title={locked ? 'Loop current scene: on' : 'Loop current scene: off'}
            aria-label={locked ? 'Loop current scene: on' : 'Loop current scene: off'}
            aria-pressed={locked}
          >
            {locked ? <Lock size={17} /> : <Repeat size={18} />}
          </button>
          {audioEnabled && (
            <>
              <button
                type="button"
                onClick={() => setMuted((current) => !current)}
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md text-white/70 transition-colors hover:bg-white/10 hover:text-white"
                title={muted ? 'Unmute music' : 'Mute music'}
                aria-label={muted ? 'Unmute music' : 'Mute music'}
                aria-pressed={muted}
              >
                {muted ? <VolumeX size={18} /> : <Volume2 size={18} />}
              </button>
              <div className="h-7 w-px shrink-0 bg-white/15" aria-hidden="true" />
            </>
          )}
          <PlaybackStatus
            sceneKeys={sceneKeys}
            activeIndex={activeIndex}
            activeDuration={activeDuration}
            activeStartTime={activeStartTime}
            totalDuration={totalDuration}
            tick={tick}
            paused={paused}
            onJumpTo={handleJumpTo}
          />
          <button
            type="button"
            onClick={() => {
              setCollapsed((current) => {
                if (!current) {
                  setHovering(false);
                  setTapPinned(false);
                }
                return !current;
              });
            }}
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md text-white/70 transition-colors hover:bg-white/10 hover:text-white"
            title={collapsed ? 'Show controls' : 'Hide controls'}
            aria-label={collapsed ? 'Show controls' : 'Hide controls'}
            aria-expanded={!collapsed}
          >
            {collapsed ? <ChevronUp size={19} /> : <ChevronDown size={19} />}
          </button>
        </div>
      </div>
    </div>
  );
}