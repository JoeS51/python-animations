import React from 'react';
import {Composition} from 'remotion';
import {AssemblyIntro, DURATION} from './AssemblyIntro';

export const RemotionRoot: React.FC = () => {
  return (
    <Composition
      id="AssemblyIntro"
      component={AssemblyIntro}
      durationInFrames={DURATION}
      fps={30}
      width={1920}
      height={1080}
    />
  );
};
