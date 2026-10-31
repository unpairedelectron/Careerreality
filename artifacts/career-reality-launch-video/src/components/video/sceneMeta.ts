// Optional scene metadata for Replit workspace integrations. When the
// workspace's scene controls are enabled for this project, a viewer's click on
// a scene segment scopes their next chat request to that scene's source file.
// Fill one entry per SCENE_DURATIONS key in VideoTemplate.tsx only when a
// skill reference asks for it; otherwise leave the map empty. Scenes missing
// from the map still play and can be jumped to.
//
// Example:
//   export const SCENE_DETAILS: Record<string, SceneDetails> = {
//     open: { title: 'Intro', filePath: 'src/components/video/video_scenes/Scene1.tsx' },
//   };

export interface SceneDetails {
  title: string;
  filePath: string;
}

export const VIDEO_METADATA = {
  title: 'CareerReality — Know what you’re choosing.',
  description: 'A 28.2 second editorial launch film for India’s most honest career platform.',
  aspectRatio: '16:9' as const,
  palette: {
    primary: '#114c43',
    deep: '#092f2b',
    paper: '#f3eee4',
    coral: '#e97862',
    saffron: '#e5ad56',
  },
  fonts: {
    display: 'Newsreader',
    body: 'Manrope',
    data: 'DM Mono',
  },
  motionDirection: 'Editorial signal / noise: clip reveals, persistent grid, slow orbital marks, and documentary texture.',
};

export const SCENE_DETAILS: Record<string, SceneDetails> = {
  opening: { title: 'Stop guessing', filePath: 'src/components/video/video_scenes/Scene1.tsx' },
  ctc: { title: 'CTC is not cash', filePath: 'src/components/video/video_scenes/Scene2.tsx' },
  risk: { title: 'Risk profile', filePath: 'src/components/video/video_scenes/Scene3.tsx' },
  signal: { title: 'Evidence over noise', filePath: 'src/components/video/video_scenes/Scene4.tsx' },
  workspace: { title: 'Ask better, move wiser', filePath: 'src/components/video/video_scenes/Scene5.tsx' },
  promise: { title: 'The reality check', filePath: 'src/components/video/video_scenes/Scene6.tsx' },
  lockup: { title: 'Know what you are choosing', filePath: 'src/components/video/video_scenes/Scene7.tsx' },
};
