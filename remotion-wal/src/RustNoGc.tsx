import React from 'react';
import {AbsoluteFill, interpolate, useCurrentFrame} from 'remotion';

const BLACK = '#010403';
const PANEL = '#030906';
const GRID = '#153722';
const MUTED = '#467b57';
const GREEN = '#00d968';
const MINT = '#8cebad';
const WHITE = '#eaf5ec';
const MONO = 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace';
const clamp = {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'} as const;
const positions = [280, 540, 800];

const progress = (frame: number, start: number, duration: number) =>
  interpolate(frame, [start, start + duration], [0, 1], clamp);

const stepped = (frame: number, start: number, duration: number, steps: number) =>
  Math.floor(progress(frame, start, duration) * steps) / steps;

const Header: React.FC<{mode: 'gc' | 'rust'; opacity: number}> = ({mode, opacity}) => (
  <div style={{position: 'absolute', left: 90, right: 90, top: 80, opacity}}>
    <div style={{fontSize: 14, color: MUTED, letterSpacing: 4}}>{mode === 'gc' ? '01' : '02'}</div>
    <div style={{marginTop: 20, fontSize: 38, color: WHITE, fontWeight: 700, letterSpacing: 5}}>
      {mode === 'gc' ? 'GARBAGE COLLECTION' : 'RUST OWNERSHIP'}
    </div>
    <div style={{marginTop: 30, borderTop: `1px solid ${GRID}`}} />
  </div>
);

const FrameBox: React.FC<{
  top: number;
  height: number;
  label: string;
  accent?: boolean;
}> = ({top, height, label, accent = false}) => (
  <div
    style={{
      position: 'absolute',
      left: 120,
      top,
      width: 840,
      height,
      border: `2px solid ${accent ? GREEN : GRID}`,
      backgroundColor: PANEL,
      boxSizing: 'border-box',
    }}
  >
    <div style={{position: 'absolute', left: 24, top: 18, color: accent ? MINT : MUTED, fontSize: 14, letterSpacing: 4}}>
      {label}
    </div>
  </div>
);

const Handle: React.FC<{
  x: number;
  opacity: number;
  owner: boolean;
  exit?: number;
}> = ({x, opacity, owner, exit = 0}) => (
  <div
    style={{
      position: 'absolute',
      left: x - 28,
      top: 420 + exit * 35,
      width: 56,
      height: 56,
      border: `3px solid ${owner ? GREEN : MINT}`,
      backgroundColor: owner ? GREEN : BLACK,
      boxShadow: owner ? `0 0 14px ${GREEN}` : 'none',
      opacity: opacity * (1 - exit),
      transform: owner ? 'rotate(45deg)' : 'none',
    }}
  />
);

const Link: React.FC<{
  x: number;
  opacity: number;
  owner: boolean;
  exit?: number;
}> = ({x, opacity, owner, exit = 0}) => (
  <svg width="1080" height="1920" viewBox="0 0 1080 1920" style={{position: 'absolute', opacity: opacity * (1 - exit)}}>
    <path
      d={`M${x} 478C${x} 650 ${x} 760 ${x} 1010`}
      fill="none"
      stroke={owner ? GREEN : MINT}
      strokeWidth={owner ? 4 : 3}
      strokeDasharray={owner ? undefined : '11 12'}
    />
  </svg>
);

const MemoryObject: React.FC<{
  x: number;
  opacity: number;
  stale?: boolean;
  clearing?: number;
  index: number;
}> = ({x, opacity, stale = false, clearing = 0, index}) => {
  const visibleColumns = Math.max(0, 6 - Math.floor(clearing * 7));
  return (
    <div
      style={{
        position: 'absolute',
        left: x - 92,
        top: 1000,
        width: 184,
        height: 132,
        border: `2px solid ${stale ? WHITE : GREEN}`,
        boxShadow: stale ? `0 0 12px rgba(234,245,236,.25)` : `0 0 12px rgba(0,217,104,.2)`,
        opacity: opacity * (1 - clearing * 0.65),
        boxSizing: 'border-box',
      }}
    >
      <div style={{position: 'absolute', left: 12, top: 10, color: stale ? WHITE : MINT, fontSize: 11}}>
        OBJ_{String.fromCharCode(65 + index)}
      </div>
      <div
        style={{
          position: 'absolute',
          left: 13,
          top: 37,
          display: 'grid',
          gridTemplateColumns: 'repeat(6, 22px)',
          gap: 5,
        }}
      >
        {Array.from({length: 18}, (_, cell) => {
          const column = cell % 6;
          const visible = column < visibleColumns;
          return (
            <div
              key={cell}
              style={{
                width: 22,
                height: 21,
                backgroundColor: visible
                  ? stale
                    ? cell % 4 === 0
                      ? WHITE
                      : MINT
                    : cell % 5 === 0
                      ? WHITE
                      : GREEN
                  : GRID,
              }}
            />
          );
        })}
      </div>
    </div>
  );
};

const HeapDots: React.FC = () => (
  <div
    style={{
      position: 'absolute',
      left: 166,
      top: 1215,
      width: 748,
      display: 'grid',
      gridTemplateColumns: 'repeat(25, 1fr)',
      rowGap: 18,
      opacity: 0.48,
    }}
  >
    {Array.from({length: 125}, (_, index) => (
      <div key={index} style={{width: 4, height: 4, backgroundColor: index % 29 === 0 ? MUTED : GRID}} />
    ))}
  </div>
);

const BottomMessage: React.FC<{
  text: string;
  opacity: number;
  bright?: boolean;
}> = ({text, opacity, bright = false}) => (
  <div
    style={{
      position: 'absolute',
      left: 90,
      right: 90,
      top: 1560,
      opacity,
      borderTop: `1px solid ${bright ? GREEN : GRID}`,
      paddingTop: 45,
    }}
  >
    <div style={{display: 'flex', alignItems: 'center', gap: 20}}>
      <div
        style={{
          width: 13,
          height: 13,
          backgroundColor: bright ? WHITE : GREEN,
          boxShadow: `0 0 11px ${GREEN}`,
        }}
      />
      <div style={{fontSize: 24, color: bright ? WHITE : GREEN, letterSpacing: 4}}>{text}</div>
    </div>
  </div>
);

const GarbageCollectedPhase: React.FC<{frame: number; opacity: number}> = ({frame, opacity}) => {
  const allocation = stepped(frame, 55, 105, 12);
  const referencesGone = stepped(frame, 255, 60, 8);
  const scanner = stepped(frame, 380, 100, 22);
  const scannerX = interpolate(scanner, [0, 1], [140, 940]);
  const clearStarts = [390, 420, 450];

  return (
    <div style={{position: 'absolute', inset: 0, opacity}}>
      <Header mode="gc" opacity={1} />
      <FrameBox top={285} height={330} label="SCOPE" accent={referencesGone < 1} />
      <FrameBox top={810} height={650} label="HEAP" accent={referencesGone >= 1 && scanner < 1} />
      <HeapDots />

      {positions.map((x, index) => {
        const objectIn = progress(allocation, index * 0.33, 0.34);
        const clearing = stepped(frame, clearStarts[index], 25, 6);
        return (
          <React.Fragment key={x}>
            <Handle x={x} opacity={objectIn * (1 - referencesGone)} owner={false} />
            <Link x={x} opacity={objectIn * (1 - referencesGone)} owner={false} />
            <MemoryObject
              x={x}
              index={index}
              opacity={objectIn}
              stale={referencesGone > 0.55}
              clearing={clearing}
            />
          </React.Fragment>
        );
      })}

      <div
        style={{
          position: 'absolute',
          left: 0,
          right: 0,
          top: 890,
          textAlign: 'center',
          color: WHITE,
          fontSize: 16,
          letterSpacing: 4,
          opacity: progress(frame, 310, 25) * (1 - progress(frame, 380, 15)),
        }}
      >
        UNREACHABLE OBJECTS REMAIN
      </div>

      <div
        style={{
          position: 'absolute',
          left: scannerX,
          top: 865,
          height: 475,
          borderLeft: `4px solid ${WHITE}`,
          boxShadow: `0 0 18px ${GREEN}`,
          opacity: scanner > 0 && scanner < 1 ? 1 : 0,
        }}
      />
      <div
        style={{
          position: 'absolute',
          left: Math.min(scannerX + 16, 868),
          top: 875,
          color: WHITE,
          fontSize: 15,
          letterSpacing: 2,
          opacity: scanner > 0 && scanner < 1 ? 1 : 0,
        }}
      >
        GC
      </div>

      <BottomMessage
        text={
          scanner >= 1
            ? 'MEMORY RECLAIMED LATER'
            : scanner > 0
              ? 'COLLECTOR SCANS'
              : referencesGone >= 1
                ? 'MEMORY WAITS'
                : 'OBJECTS IN USE'
        }
        opacity={1}
        bright={scanner >= 1}
      />
    </div>
  );
};

const RustPhase: React.FC<{frame: number; opacity: number}> = ({frame, opacity}) => {
  const allocation = stepped(frame, 565, 110, 12);
  const scopeExit = stepped(frame, 735, 85, 12);
  const dropStarts = [750, 775, 800];
  const drops = positions.map((_, index) => stepped(frame, dropStarts[index], 25, 6));
  const complete = drops.every((drop) => drop >= 1);

  return (
    <div style={{position: 'absolute', inset: 0, opacity}}>
      <Header mode="rust" opacity={1} />
      <FrameBox top={285} height={330} label="SCOPE" accent={!complete} />
      <FrameBox top={810} height={650} label="HEAP" accent={!complete} />
      <HeapDots />

      {positions.map((x, index) => {
        const objectIn = progress(allocation, index * 0.33, 0.34);
        return (
          <React.Fragment key={x}>
            <Handle x={x} opacity={objectIn} owner exit={drops[index]} />
            <Link x={x} opacity={objectIn} owner exit={drops[index]} />
            <MemoryObject x={x} index={index} opacity={objectIn} clearing={drops[index]} />
          </React.Fragment>
        );
      })}

      <div
        style={{
          position: 'absolute',
          left: 0,
          right: 0,
          top: 890,
          textAlign: 'center',
          color: MINT,
          fontSize: 16,
          letterSpacing: 4,
          opacity: progress(frame, 735, 20),
        }}
      >
        OWNER ENDS → DROP RUNS
      </div>

      <div
        style={{
          position: 'absolute',
          right: 142,
          top: 1374,
          color: complete ? WHITE : MUTED,
          fontSize: 14,
          letterSpacing: 3,
        }}
      >
        GC: NOT REQUIRED
      </div>

      <BottomMessage
        text={complete ? 'MEMORY FREED IMMEDIATELY' : scopeExit > 0 ? 'LEAVING SCOPE' : 'OWNERS CONTROL MEMORY'}
        opacity={1}
        bright={complete}
      />
    </div>
  );
};

export const RustNoGc: React.FC = () => {
  const frame = useCurrentFrame();
  const gcOut = 1 - progress(frame, 500, 25);
  const rustIn = progress(frame, 525, 25);
  const transition = progress(frame, 500, 50);

  return (
    <AbsoluteFill style={{backgroundColor: BLACK, color: GREEN, fontFamily: MONO, overflow: 'hidden'}}>
      <GarbageCollectedPhase frame={frame} opacity={gcOut} />
      <RustPhase frame={frame} opacity={rustIn} />

      <div
        style={{
          position: 'absolute',
          left: 0,
          right: 0,
          top: interpolate(transition, [0, 1], [-10, 1930]),
          height: 7,
          backgroundColor: WHITE,
          boxShadow: `0 0 18px ${GREEN}`,
          opacity: transition > 0 && transition < 1 ? 1 : 0,
        }}
      />
      <div
        style={{
          position: 'absolute',
          inset: 0,
          opacity: 0.055,
          pointerEvents: 'none',
          backgroundImage: 'linear-gradient(rgba(140,235,173,.22) 1px, transparent 1px)',
          backgroundSize: '100% 4px',
          mixBlendMode: 'screen',
        }}
      />
      <div style={{position: 'absolute', inset: 18, border: `1px solid ${GRID}`, pointerEvents: 'none'}} />
    </AbsoluteFill>
  );
};
