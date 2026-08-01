import React from 'react';
import {Composition} from 'remotion';
import {DatabaseBasics} from './DatabaseBasics';
import {OpenSourceFirst} from './OpenSourceFirst';
import {RustNoGc} from './RustNoGc';
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
        id="OpenSourceFirst"
        component={OpenSourceFirst}
        durationInFrames={300}
        fps={30}
        width={1080}
        height={1920}
      />
      <Composition
        id="RustNoGc"
        component={RustNoGc}
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
