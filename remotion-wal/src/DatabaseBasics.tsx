import React from 'react';
import {
  AbsoluteFill,
  Easing,
  interpolate,
  useCurrentFrame,
} from 'remotion';

const BG = '#000000';
const SURFACE = '#030805';
const SURFACE_RAISED = '#06120b';
const LINE = '#123d27';
const PAPER = '#b8ffd0';
const MUTED = '#356b4b';
const ACCENT = '#39ff88';
const NOTCHED =
  'polygon(0 0, calc(100% - 28px) 0, 100% 28px, 100% 100%, 28px 100%, 0 calc(100% - 28px))';
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
  {kind: 'circle', color: '#51b878', bars: [250, 360, 190]},
  {kind: 'triangle', color: ACCENT, bars: [330, 225, 285]},
  {kind: 'square', color: '#6bd391', bars: [210, 315, 255]},
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
      border: `3px solid ${glow > 0 ? ACCENT : LINE}`,
      backgroundColor: SURFACE_RAISED,
      clipPath: NOTCHED,
      boxShadow: `0 0 ${32 * glow}px rgba(57, 255, 136, ${0.28 * glow})`,
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
        clipPath: 'polygon(0 0, calc(100% - 14px) 0, 100% 14px, 100% 100%, 0 100%)',
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
            borderRadius: 1,
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
    <div
      style={{
        position: 'absolute',
        right: 26,
        top: 0,
        width: 58,
        height: 3,
        backgroundColor: glow > 0 ? ACCENT : MUTED,
      }}
    />
    <div style={{position: 'absolute', left: 22, bottom: 0, display: 'flex', gap: 7}}>
      {[28, 14, 8].map((width) => (
        <div key={width} style={{width, height: 3, backgroundColor: LINE}} />
      ))}
    </div>
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
      border: `3px solid ${LINE}`,
      backgroundColor: SURFACE,
      clipPath: NOTCHED,
      opacity,
      boxSizing: 'border-box',
    }}
  >
    <div style={{position: 'absolute', top: 28, left: 34, display: 'flex', gap: 10}}>
      {[46, 24, 12].map((width) => (
        <div
          key={width}
          style={{width, height: 8, backgroundColor: width === 46 ? MUTED : LINE}}
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
    <div style={{position: 'absolute', right: 30, top: 92, display: 'flex', gap: 8}}>
      {[0, 1, 2, 3].map((tick) => (
        <div
          key={tick}
          style={{width: 3, height: 22 + tick * 7, backgroundColor: LINE, transform: 'skewX(-25deg)'}}
        />
      ))}
    </div>
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
      border: `3px solid ${LINE}`,
      backgroundColor: SURFACE,
      clipPath: NOTCHED,
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
    <div
      style={{
        position: 'absolute',
        left: 382,
        top: 10,
        width: 132,
        height: 132,
        border: `2px solid ${LINE}`,
        borderRadius: '50%',
        borderLeftColor: 'transparent',
        borderBottomColor: 'transparent',
        transform: 'rotate(-22deg)',
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
          border: `3px dashed ${LINE}`,
          clipPath: NOTCHED,
          opacity: 0.5,
          boxSizing: 'border-box',
        }}
      />
    ))}
    {[220, 470, 720].map((top, index) => (
      <div
        key={top}
        style={{position: 'absolute', left: 42, top, display: 'flex', flexDirection: 'column', gap: 7}}
      >
        {[32, 18, 10].map((width) => (
          <div
            key={width}
            style={{width, height: 4, backgroundColor: index === 1 ? MUTED : LINE}}
          />
        ))}
      </div>
    ))}
  </div>
);

const QueryToken: React.FC<{
  x: number;
  y: number;
  opacity: number;
  scale?: number;
  rotation?: number;
}> = ({
  x,
  y,
  opacity,
  scale = 1,
  rotation = 0,
}) => (
  <div
    style={{
      position: 'absolute',
      left: x - 44,
      top: y - 44,
      width: 88,
      height: 88,
      opacity,
      transform: `scale(${scale})`,
      boxSizing: 'border-box',
    }}
  >
    <svg
      width="132"
      height="132"
      viewBox="0 0 132 132"
      style={{
        position: 'absolute',
        left: -25,
        top: -25,
        transform: `rotate(${rotation}deg)`,
        overflow: 'visible',
      }}
    >
      <circle
        cx="66"
        cy="66"
        r="57"
        fill="none"
        stroke={MUTED}
        strokeWidth="3"
        strokeDasharray="38 14 8 14"
      />
      {[0, 90, 180, 270].map((angle) => (
        <line
          key={angle}
          x1="66"
          y1="0"
          x2="66"
          y2="12"
          stroke={ACCENT}
          strokeWidth="4"
          transform={`rotate(${angle} 66 66)`}
        />
      ))}
    </svg>
    <div
      style={{
        position: 'absolute',
        inset: 0,
        border: `3px solid ${ACCENT}`,
        backgroundColor: BG,
        clipPath: NOTCHED,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        boxShadow: '0 0 26px rgba(57, 255, 136, 0.2)',
        boxSizing: 'border-box',
      }}
    >
      <Identifier kind="triangle" color={ACCENT} size={46} />
    </div>
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

const InterfaceFrame: React.FC<{amount: number}> = ({amount}) => (
  <AbsoluteFill style={{pointerEvents: 'none', opacity: amount}}>
    <svg width="1080" height="1920" viewBox="0 0 1080 1920">
      <g fill="none" stroke={LINE} strokeWidth="3">
        <path d="M42 190V42H260" />
        <path d="M820 42H1038V238" />
        <path d="M1038 1660V1878H824" />
        <path d="M250 1878H42V1694" />
      </g>
      <g fill={MUTED}>
        <path d="M775 41H805L793 51H763Z" />
        <path d="M720 41H754L742 51H708Z" />
        <path d="M674 41H699L687 51H662Z" />
      </g>
      <g fill={LINE}>
        {[0, 1, 2, 3, 4, 5].map((tick) => (
          <rect key={tick} x="35" y={720 + tick * 32} width={tick === 2 ? 25 : 14} height="4" />
        ))}
        {[0, 1, 2, 3].map((tick) => (
          <rect key={tick} x={934 + tick * 18} y="1870" width="10" height="8" />
        ))}
      </g>
      <path d="M994 570L1038 526V588L994 632Z" fill={LINE} opacity="0.7" />
      <path d="M42 1450L78 1414V1474L42 1510Z" fill={LINE} opacity="0.7" />
    </svg>
  </AbsoluteFill>
);

const TransferRails: React.FC<{
  y: number;
  intensity: number;
  direction: 'down' | 'up';
}> = ({y, intensity, direction}) => {
  const startY = direction === 'down' ? y - 125 : y + 175;
  const endY = direction === 'down' ? y + 45 : y + 15;

  return (
    <svg
      width="1080"
      height="1920"
      viewBox="0 0 1080 1920"
      style={{position: 'absolute', inset: 0, opacity: intensity * 0.8}}
    >
      {[150, 164, 916, 930].map((x, index) => (
        <line
          key={x}
          x1={x}
          y1={startY + (index % 2) * 28}
          x2={x}
          y2={endY - (index % 2) * 18}
          stroke={index % 2 ? LINE : MUTED}
          strokeWidth={index % 2 ? 3 : 5}
        />
      ))}
      <path
        d={`M140 ${direction === 'down' ? endY - 18 : startY + 18}L164 ${
          direction === 'down' ? endY : startY
        }L188 ${direction === 'down' ? endY - 18 : startY + 18}`}
        fill="none"
        stroke={ACCENT}
        strokeWidth="4"
      />
    </svg>
  );
};

const BrandSignature: React.FC<{frame: number}> = ({frame}) => {
  const reveal = progress(frame, 258, 14);
  const nodes = [
    {x: 0, y: 24, start: 264},
    {x: 48, y: 12, start: 272},
    {x: 96, y: 0, start: 280},
  ];

  return (
    <div
      style={{
        position: 'absolute',
        left: 486,
        top: 1800,
        width: 108,
        height: 48,
        opacity: reveal,
      }}
    >
      <svg width="108" height="48" viewBox="0 0 108 48">
        <path
          d="M6 30L54 18L102 6"
          fill="none"
          stroke={LINE}
          strokeWidth="3"
          strokeLinecap="round"
          pathLength="1"
          strokeDasharray="1"
          strokeDashoffset={1 - reveal}
        />
      </svg>
      {nodes.map((node, index) => {
        const pulse = interpolate(
          frame,
          [node.start, node.start + 4, node.start + 10],
          [1, 1.6, 1],
          clamp,
        );
        return (
          <div
            key={index}
            style={{
              position: 'absolute',
              left: node.x,
              top: node.y,
              width: 12,
              height: 12,
              borderRadius: '50%',
              backgroundColor: ACCENT,
              transform: `scale(${pulse})`,
              boxShadow: `0 0 ${12 * pulse}px rgba(57, 255, 136, 0.4)`,
            }}
          />
        );
      })}
    </div>
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
      }}
    >
      <AppPanel opacity={sceneIn} />
      <DatabasePanel opacity={sceneIn} />

      <LookupLines amount={lookupIn} resolved={resolved} />

      {records.map((record, index) => {
        const move = progress(frame, recordStarts[index], 30);
        const startY = 280 + index * 12;
        const targetY = rowTops[index];
        const currentY =
          interpolate(move, [0, 1], [startY, targetY]) + Math.sin(move * Math.PI) * -18;
        const railIntensity = Math.sin(move * Math.PI);
        const unmatchedOpacity = index === 1 ? 1 : interpolate(resolved, [0, 1], [1, 0.28]);
        const targetGlow = index === 1 ? resolved : 0;

        return (
          <React.Fragment key={record.kind}>
            <TransferRails y={currentY} intensity={railIntensity} direction="down" />
            <RecordCard
              record={record}
              opacity={sceneIn * unmatchedOpacity}
              glow={targetGlow}
              style={{
                left: 180,
                top: currentY,
                zIndex: 20 - index,
              }}
            />
          </React.Fragment>
        );
      })}

      <QueryToken
        x={540}
        y={interpolate(queryTravel, [0, 1], [590, 820])}
        opacity={queryOpacity}
        scale={interpolate(lookupIn, [0, 1], [1, 0.86])}
        rotation={interpolate(frame, [120, 205], [0, 70], clamp)}
      />

      {frame >= 205 ? (
        <>
          <TransferRails
            y={
              interpolate(returnProgress, [0, 1], [1140, 280]) +
              Math.sin(returnProgress * Math.PI) * -22
            }
            intensity={Math.sin(returnProgress * Math.PI)}
            direction="up"
          />
          <RecordCard
            record={records[1]}
            glow={interpolate(returnSettle, [0, 1], [1, 0.25])}
            opacity={interpolate(frame, [205, 212], [0, 1], clamp)}
            style={{
              left: 180,
              top:
                interpolate(returnProgress, [0, 1], [1140, 280]) +
                Math.sin(returnProgress * Math.PI) * -22,
              transform: `scale(${interpolate(returnSettle, [0, 1], [1, 0.97])})`,
              zIndex: 40,
            }}
          />
        </>
      ) : null}

      <InterfaceFrame amount={sceneIn} />
      <BrandSignature frame={frame} />
    </AbsoluteFill>
  );
};
