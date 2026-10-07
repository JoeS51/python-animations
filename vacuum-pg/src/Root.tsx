import React from 'react';
import {Composition} from 'remotion';
import {VacuumIntro, DURATION} from './VacuumIntro';

export const RemotionRoot: React.FC = () => {
  return (
    <Composition
      id="VacuumIntro"
      component={VacuumIntro}
      durationInFrames={DURATION}
      fps={30}
      width={1920}
      height={1080}
    />
  );
};
