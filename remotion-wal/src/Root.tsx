import React from 'react';
import {Composition} from 'remotion';
import {DatabaseBasics} from './DatabaseBasics';
import {WalShort} from './WalShort';

export const RemotionRoot: React.FC = () => {
  return (
    <>
      <Composition
        id="DatabaseBasics"
        component={DatabaseBasics}
        durationInFrames={300}
        fps={30}
        width={1080}
        height={1920}
      />
      <Composition
        id="WALShort"
        component={WalShort}
        durationInFrames={600}
        fps={30}
        width={1080}
        height={1920}
      />
    </>
  );
};
