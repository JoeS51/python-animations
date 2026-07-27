import React from 'react';
import {Composition} from 'remotion';
import {WalShort} from './WalShort';

export const RemotionRoot: React.FC = () => {
  return (
    <Composition
      id="WALShort"
      component={WalShort}
      durationInFrames={600}
      fps={30}
      width={1080}
      height={1920}
    />
  );
};
