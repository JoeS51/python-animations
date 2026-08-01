import React from 'react';
import {
  AbsoluteFill,
  Easing,
  interpolate,
  useCurrentFrame,
} from 'remotion';

const BG = '#070a0f';
const SURFACE = '#111722';
const SURFACE_RAISED = '#171f2c';
const LINE = '#344052';
const PAPER = '#e7edf5';
const MUTED = '#7f8a9b';
const ACCENT = '#58d6c7';
const clamp = {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'} as const;

const progress = (frame: number, start: number, duration: number) =>
  interpolate(frame, [start, start + duration], [0, 1], {
    ...clamp,
    easing: Easing.inOut(Easing.cubic),
  });

const Identifier: React.FC<{
  kind: 'circle' | 'triangle' | 'square';
  color: string;
  size?: number;
}> = ({kind, color, size = 52}) => {
  if (kind === 'triangle') {
    return (
      <svg width={size} height={size} viewBox="0 0 52 52">
        <path
          d="M26 8L44 40H8L26 8Z"
          fill="none"
          stroke={color}
          strokeWidth="6"
          strokeLinejoin="round"
        />
      </svg>
    );
  }

  return (
    <div
      style={{
        width: size * 0.66,
        height: size * 0.66,
        border: `6px solid ${color}`,
        borderRadius: kind === 'circle' ? '50%' : 5,
        boxSizing: 'border-box',
      }}
    />
  );
};

type RecordDefinition = {
  kind: 'circle' | 'triangle' | 'square';
  color: string;
  bars: [number, number, number];
};

const records: RecordDefinition[] = [
  {kind: 'circle', color: '#7398ff', bars: [250, 360, 190]},
  {kind: 'triangle', color: ACCENT, bars: [330, 225, 285]},
  {kind: 'square', color: '#c689f5', bars: [210, 315, 255]},
];

const RecordCard: React.FC<{
  record: RecordDefinition;
  opacity?: number;
  glow?: number;
  style?: React.CSSProperties;
}> = ({record, opacity = 1, glow = 0, style}) => (
  <div
    style={{
      position: 'absolute',
      width: 720,
      height: 170,
      borderRadius: 24,
      border: `3px solid ${glow > 0 ? ACCENT : LINE}`,
      backgroundColor: SURFACE_RAISED,
      boxShadow: `0 0 ${36 * glow}px rgba(88, 214, 199, ${0.36 * glow})`,
      opacity,
      display: 'flex',
      alignItems: 'center',
      boxSizing: 'border-box',
      ...style,
    }}
  >
    <div
      style={{
        marginLeft: 38,
        width: 104,
        height: 104,
        borderRadius: 22,
        backgroundColor: `${record.color}18`,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <Identifier kind={record.kind} color={record.color} />
    </div>
    <div style={{marginLeft: 34, display: 'flex', flexDirection: 'column', gap: 16}}>
      {record.bars.map((width, index) => (
        <div
          key={index}
          style={{
            width,
            height: 14,
            borderRadius: 7,
            backgroundColor: index === 0 ? PAPER : MUTED,
            opacity: index === 0 ? 0.9 : 0.52,
          }}
        />
      ))}
    </div>
    <div
      style={{
        position: 'absolute',
        right: 38,
        width: 18,
        height: 18,
        borderRadius: '50%',
        backgroundColor: record.color,
      }}
    />
  </div>
);

const AppPanel: React.FC<{opacity: number}> = ({opacity}) => (
  <div
    style={{
      position: 'absolute',
      left: 90,
      top: 120,
      width: 900,
      height: 420,
      borderRadius: 36,
      border: `3px solid ${LINE}`,
      backgroundColor: SURFACE,
      opacity,
      boxSizing: 'border-box',
    }}
  >
    <div style={{position: 'absolute', top: 28, left: 34, display: 'flex', gap: 15}}>
      {[0, 1, 2].map((dot) => (
        <div
          key={dot}
          style={{width: 13, height: 13, borderRadius: '50%', backgroundColor: LINE}}
        />
      ))}
    </div>
    <div
      style={{
        position: 'absolute',
        left: 32,
        right: 32,
        top: 70,
        borderTop: `2px solid ${LINE}`,
      }}
    />
  </div>
);

const DatabasePanel: React.FC<{opacity: number}> = ({opacity}) => (
  <div
    style={{
      position: 'absolute',
      left: 90,
      top: 720,
      width: 900,
      height: 1000,
      borderRadius: 42,
      border: `3px solid ${LINE}`,
      backgroundColor: SURFACE,
      opacity,
      boxSizing: 'border-box',
    }}
  >
    <div
      style={{
        position: 'absolute',
        left: 408,
        top: 34,
        width: 80,
        height: 58,
        border: `4px solid ${MUTED}`,
        borderRadius: '50%',
      }}
    />
    <div
      style={{
        position: 'absolute',
        left: 408,
        top: 63,
        width: 80,
        height: 58,
        borderLeft: `4px solid ${MUTED}`,
        borderRight: `4px solid ${MUTED}`,
        borderBottom: `4px solid ${MUTED}`,
        borderRadius: '0 0 50% 50%',
        boxSizing: 'border-box',
      }}
    />
    {[170, 420, 670].map((top) => (
      <div
        key={top}
        style={{
          position: 'absolute',
          left: 88,
          top,
          width: 720,
          height: 170,
          borderRadius: 24,
          border: `3px dashed ${LINE}`,
          opacity: 0.5,
          boxSizing: 'border-box',
        }}
      />
    ))}
  </div>
);

const QueryToken: React.FC<{x: number; y: number; opacity: number; scale?: number}> = ({
  x,
  y,
  opacity,
  scale = 1,
}) => (
  <div
    style={{
      position: 'absolute',
      left: x - 44,
      top: y - 44,
      width: 88,
      height: 88,
      borderRadius: 24,
      border: `3px solid ${ACCENT}`,
      backgroundColor: BG,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      opacity,
      transform: `scale(${scale})`,
      boxShadow: '0 0 30px rgba(88, 214, 199, 0.18)',
      boxSizing: 'border-box',
    }}
  >
    <Identifier kind="triangle" color={ACCENT} size={46} />
  </div>
);

const LookupLines: React.FC<{amount: number; resolved: number}> = ({amount, resolved}) => {
  const rowCenters = [975, 1225, 1475];

  return (
    <svg
      width="1080"
      height="1920"
      viewBox="0 0 1080 1920"
      style={{position: 'absolute', inset: 0, overflow: 'visible'}}
    >
      {rowCenters.map((rowY, index) => {
        const length = Math.hypot(280, rowY - 820);
        const isMatch = index === 1;
        return (
          <line
            key={rowY}
            x1="540"
            y1="820"
            x2="820"
            y2={rowY}
            stroke={isMatch ? ACCENT : LINE}
            strokeWidth={isMatch ? 4 : 3}
            strokeLinecap="round"
            strokeDasharray={length}
            strokeDashoffset={length * (1 - amount)}
            opacity={isMatch ? 0.8 : 0.6 * (1 - resolved)}
          />
        );
      })}
    </svg>
  );
};

export const DatabaseBasics: React.FC = () => {
  const frame = useCurrentFrame();
  const sceneIn = progress(frame, 0, 24);
  const recordStarts = [30, 58, 86];
  const rowTops = [890, 1140, 1390];
  const lookupIn = progress(frame, 159, 22);
  const resolved = progress(frame, 181, 24);
  const returnProgress = progress(frame, 210, 48);
  const returnSettle = progress(frame, 258, 12);
  const queryTravel = progress(frame, 120, 39);
  const queryOpacity = interpolate(frame, [118, 125, 204, 216], [0, 1, 1, 0], clamp);

  return (
    <AbsoluteFill
      style={{
        backgroundColor: BG,
        overflow: 'hidden',
        backgroundImage:
          'radial-gradient(circle at 50% 28%, rgba(57, 77, 105, 0.16), transparent 34%)',
      }}
    >
      <AppPanel opacity={sceneIn} />
      <DatabasePanel opacity={sceneIn} />

      <LookupLines amount={lookupIn} resolved={resolved} />

      {records.map((record, index) => {
        const move = progress(frame, recordStarts[index], 30);
        const startY = 280 + index * 12;
        const targetY = rowTops[index];
        const unmatchedOpacity = index === 1 ? 1 : interpolate(resolved, [0, 1], [1, 0.28]);
        const targetGlow = index === 1 ? resolved : 0;

        return (
          <RecordCard
            key={record.kind}
            record={record}
            opacity={sceneIn * unmatchedOpacity}
            glow={targetGlow}
            style={{
              left: 180,
              top: interpolate(move, [0, 1], [startY, targetY]),
              transform: `translateY(${Math.sin(move * Math.PI) * -18}px)`,
              zIndex: 20 - index,
            }}
          />
        );
      })}

      <QueryToken
        x={540}
        y={interpolate(queryTravel, [0, 1], [590, 820])}
        opacity={queryOpacity}
        scale={interpolate(lookupIn, [0, 1], [1, 0.86])}
      />

      {frame >= 205 ? (
        <RecordCard
          record={records[1]}
          glow={interpolate(returnSettle, [0, 1], [1, 0.25])}
          opacity={interpolate(frame, [205, 212], [0, 1], clamp)}
          style={{
            left: 180,
            top: interpolate(returnProgress, [0, 1], [1140, 280]),
            transform: `translateY(${Math.sin(returnProgress * Math.PI) * -22}px) scale(${interpolate(
              returnSettle,
              [0, 1],
              [1, 0.97],
            )})`,
            zIndex: 40,
          }}
        />
      ) : null}
    </AbsoluteFill>
  );
};
