import React, {useMemo} from 'react';
import rough from 'roughjs';
import {
  AbsoluteFill,
  Easing,
  Sequence,
  interpolate,
  useCurrentFrame,
} from 'remotion';
import '@fontsource-variable/inter';
import '@fontsource/caveat/600.css';

const BG = '#070707';
const PAPER = '#f4f1e8';
const DIM = '#777773';
const MONO = '"Inter Variable", sans-serif';
const HAND = '"Caveat", cursive';
const clamp = {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'} as const;

const reveal = (frame: number, start: number, duration = 10) =>
  interpolate(frame, [start, start + duration], [0, 1], {
    ...clamp,
    easing: Easing.out(Easing.cubic),
  });

type RoughRectProps = {
  width: number;
  height: number;
  seed: number;
  stroke?: string;
  fill?: string;
  roughness?: number;
  strokeWidth?: number;
  progress?: number;
  style?: React.CSSProperties;
  children?: React.ReactNode;
};

const RoughRect: React.FC<RoughRectProps> = ({
  width,
  height,
  seed,
  stroke = PAPER,
  fill = 'transparent',
  roughness = 1.6,
  strokeWidth = 3,
  progress = 1,
  style,
  children,
}) => {
  const paths = useMemo(() => {
    const generator = rough.generator();
    return generator.toPaths(
      generator.rectangle(7, 7, width - 14, height - 14, {
        seed,
        stroke,
        fill,
        fillStyle: 'solid',
        roughness,
        bowing: 1.2,
        strokeWidth,
      }),
    );
  }, [fill, height, roughness, seed, stroke, strokeWidth, width]);

  return (
    <div style={{position: 'relative', width, height, ...style}}>
      <svg
        width={width}
        height={height}
        viewBox={`0 0 ${width} ${height}`}
        style={{position: 'absolute', inset: 0, overflow: 'visible'}}
      >
        <g
          style={{
            clipPath: `inset(0 ${(1 - progress) * 100}% 0 0)`,
          }}
        >
          {paths.map((path, index) => (
            <path
              key={`${seed}-${index}`}
              d={path.d}
              stroke={path.stroke}
              strokeWidth={path.strokeWidth}
              fill={path.fill ?? 'none'}
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          ))}
        </g>
      </svg>
      <div style={{position: 'absolute', inset: 0}}>{children}</div>
    </div>
  );
};

type RoughArrowProps = {
  width: number;
  height: number;
  seed: number;
  direction?: 'down' | 'right';
  color?: string;
  progress?: number;
  style?: React.CSSProperties;
};

const RoughArrow: React.FC<RoughArrowProps> = ({
  width,
  height,
  seed,
  direction = 'down',
  color = PAPER,
  progress = 1,
  style,
}) => {
  const paths = useMemo(() => {
    const generator = rough.generator();
    const options = {seed, stroke: color, strokeWidth: 3, roughness: 1.8};
    if (direction === 'right') {
      return [
        ...generator.toPaths(generator.line(8, height / 2, width - 18, height / 2, options)),
        ...generator.toPaths(
          generator.linearPath(
            [
              [width - 34, height / 2 - 15],
              [width - 12, height / 2],
              [width - 34, height / 2 + 15],
            ],
            {...options, seed: seed + 1},
          ),
        ),
      ];
    }
    return [
      ...generator.toPaths(generator.line(width / 2, 8, width / 2, height - 20, options)),
      ...generator.toPaths(
        generator.linearPath(
          [
            [width / 2 - 15, height - 36],
            [width / 2, height - 12],
            [width / 2 + 15, height - 36],
          ],
          {...options, seed: seed + 1},
        ),
      ),
    ];
  }, [color, direction, height, seed, width]);

  return (
    <svg
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      style={{...style, overflow: 'visible'}}
    >
      <g style={{clipPath: `inset(0 0 ${(1 - progress) * 100}% 0)`}}>
        {paths.map((path, index) => (
          <path
            key={`${seed}-${index}`}
            d={path.d}
            stroke={path.stroke}
            strokeWidth={path.strokeWidth}
            fill={path.fill ?? 'none'}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        ))}
      </g>
    </svg>
  );
};

const Frame: React.FC<{chapter: string; children: React.ReactNode}> = ({chapter, children}) => (
  <AbsoluteFill style={{backgroundColor: BG, color: PAPER, fontFamily: MONO}}>
    <div
      style={{
        position: 'absolute',
        left: 64,
        right: 64,
        top: 54,
        borderTop: `2px solid ${PAPER}`,
        opacity: 0.2,
      }}
    />
    <div
      style={{
        position: 'absolute',
        left: 66,
        top: 72,
        fontSize: 19,
        letterSpacing: 3,
        fontWeight: 700,
      }}
    >
      {chapter}
    </div>
    <div
      style={{
        position: 'absolute',
        left: 66,
        right: 66,
        bottom: 48,
        display: 'flex',
        justifyContent: 'space-between',
        fontSize: 16,
        letterSpacing: 2,
        color: DIM,
      }}
    >
      <span>DB / INTERNALS</span>
      <span>WRITE-AHEAD LOGGING</span>
    </div>
    {children}
  </AbsoluteFill>
);

const Database: React.FC<{
  progress?: number;
  opacity?: number;
  label?: string;
  style?: React.CSSProperties;
  seed?: number;
}> = ({progress = 1, opacity = 1, label = 'PRIMARY DATA', style, seed = 12}) => (
  <RoughRect
    width={440}
    height={210}
    seed={seed}
    progress={progress}
    style={{opacity, ...style}}
  >
    <div
      style={{
        position: 'absolute',
        inset: 0,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: 23,
        letterSpacing: 4,
        fontWeight: 700,
      }}
    >
      {label}
    </div>
    <div style={{position: 'absolute', left: 50, right: 50, top: 62, borderTop: `2px solid ${DIM}`}} />
    <div style={{position: 'absolute', left: 50, right: 50, bottom: 62, borderTop: `2px solid ${DIM}`}} />
  </RoughRect>
);

const Transaction: React.FC<{progress: number; style?: React.CSSProperties}> = ({progress, style}) => (
  <RoughRect width={700} height={126} seed={41} progress={progress} style={style}>
    <div
      style={{
        height: '100%',
        display: 'grid',
        gridTemplateColumns: '150px 1fr',
        alignItems: 'center',
        fontSize: 25,
        letterSpacing: 2,
      }}
    >
      <span style={{textAlign: 'center', color: DIM}}>TX 0842</span>
      <span style={{borderLeft: `2px solid ${DIM}`, paddingLeft: 45}}>TRANSFER $100</span>
    </div>
  </RoughRect>
);

const Wal: React.FC<{progress?: number; active?: number; style?: React.CSSProperties}> = ({
  progress = 1,
  active = 0,
  style,
}) => (
  <RoughRect width={610} height={230} seed={72} progress={progress} style={style}>
    <div
      style={{
        position: 'absolute',
        top: 35,
        width: '100%',
        textAlign: 'center',
        fontFamily: HAND,
        fontSize: 39,
        letterSpacing: 2,
      }}
    >
      WAL / durable log
    </div>
    <div style={{position: 'absolute', left: 54, right: 54, bottom: 40, display: 'flex', gap: 16}}>
      {[0, 1, 2].map((index) => (
        <RoughRect
          key={index}
          width={155}
          height={62}
          seed={80 + index}
          fill={index < active ? PAPER : 'transparent'}
          stroke={PAPER}
          strokeWidth={2}
        />
      ))}
    </div>
  </RoughRect>
);

const HookScene: React.FC = () => {
  const frame = useCurrentFrame();
  const txIn = reveal(frame, 16, 12);
  const dbIn = reveal(frame, 32, 12);
  const ackIn = reveal(frame, 51, 9);

  return (
    <Frame chapter="01 / THE PROMISE">
      <div
        style={{
          position: 'absolute',
          top: 230,
          left: 70,
          fontSize: 132,
          fontWeight: 850,
          letterSpacing: -7,
          lineHeight: 0.9,
          clipPath: `inset(0 ${(1 - reveal(frame, 0, 13)) * 100}% 0 0)`,
        }}
      >
        COMMIT.
      </div>
      <div
        style={{
          position: 'absolute',
          top: 630,
          left: 190,
          opacity: txIn,
          transform: `translateY(${interpolate(txIn, [0, 1], [36, 0])}px)`,
        }}
      >
        <Transaction progress={txIn} />
      </div>
      <RoughArrow
        width={80}
        height={160}
        seed={20}
        progress={reveal(frame, 28, 14)}
        style={{position: 'absolute', top: 770, left: 500}}
      />
      <Database
        progress={dbIn}
        style={{
          position: 'absolute',
          top: 925,
          left: 320,
          opacity: dbIn,
          transform: `translateY(${interpolate(dbIn, [0, 1], [28, 0])}px)`,
        }}
      />
      <div
        style={{
          position: 'absolute',
          top: 1240,
          left: 330,
          width: 420,
          height: 82,
          backgroundColor: PAPER,
          color: BG,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: 24,
          fontWeight: 850,
          letterSpacing: 3,
          clipPath: `inset(0 ${(1 - ackIn) * 100}% 0 0)`,
          transform: 'rotate(-1deg)',
        }}
      >
        ACKNOWLEDGED ✓
      </div>
      <div
        style={{
          position: 'absolute',
          top: 1480,
          left: 70,
          fontFamily: HAND,
          fontSize: 52,
          color: DIM,
          opacity: reveal(frame, 60, 10),
          transform: 'rotate(-2deg)',
        }}
      >
        The database just made a promise.
      </div>
    </Frame>
  );
};

const CrashScene: React.FC = () => {
  const frame = useCurrentFrame();
  const flash = interpolate(frame, [0, 2, 6], [0, 1, 0], clamp);
  const shake = frame < 14 ? Math.sin(frame * 2.7) * (14 - frame) * 0.7 : 0;
  const slash = reveal(frame, 23, 10);

  return (
    <Frame chapter="02 / THE FAILURE">
      <div style={{position: 'absolute', inset: 0, backgroundColor: PAPER, opacity: flash, zIndex: 10}} />
      <div style={{position: 'absolute', inset: 0, transform: `translateX(${shake}px)`}}>
        <div
          style={{
            position: 'absolute',
            top: 240,
            left: 70,
            fontSize: 116,
            fontWeight: 850,
            letterSpacing: -6,
            lineHeight: 0.9,
            clipPath: `inset(0 ${(1 - reveal(frame, 8, 14)) * 100}% 0 0)`,
          }}
        >
          THEN THE
          <br />
          POWER DIES.
        </div>
        <Database
          opacity={interpolate(frame, [12, 28], [1, 0.22], clamp)}
          style={{position: 'absolute', top: 830, left: 320}}
          seed={99}
        />
        <div
          style={{
            position: 'absolute',
            top: 925,
            left: 210,
            width: 660,
            height: 12,
            backgroundColor: PAPER,
            transform: `rotate(-12deg) scaleX(${slash})`,
          }}
        />
        <div
          style={{
            position: 'absolute',
            top: 1240,
            width: '100%',
            textAlign: 'center',
            fontFamily: HAND,
            fontSize: 57,
            opacity: reveal(frame, 38, 10),
          }}
        >
          before the data file is updated
        </div>
      </div>
    </Frame>
  );
};

const QuestionScene: React.FC = () => {
  const frame = useCurrentFrame();
  const word = reveal(frame, 5, 16);
  return (
    <Frame chapter="03 / THE QUESTION">
      <div
        style={{
          position: 'absolute',
          top: 360,
          left: 70,
          right: 70,
          fontSize: 107,
          fontWeight: 850,
          letterSpacing: -6,
          lineHeight: 0.96,
          clipPath: `inset(0 ${(1 - word) * 100}% 0 0)`,
        }}
      >
        WHY ISN'T
        <br />
        IT LOST?
      </div>
      <div
        style={{
          position: 'absolute',
          top: 810,
          left: 75,
          width: interpolate(frame, [20, 36], [0, 780], clamp),
          borderTop: `6px solid ${PAPER}`,
          transform: 'rotate(-1deg)',
        }}
      />
      <div
        style={{
          position: 'absolute',
          top: 940,
          left: 75,
          fontFamily: HAND,
          fontSize: 55,
          color: DIM,
          opacity: reveal(frame, 30, 12),
        }}
      >
        durability depends on one rule...
      </div>
    </Frame>
  );
};

const WalScene: React.FC = () => {
  const frame = useCurrentFrame();
  const memoryIn = reveal(frame, 16, 10);
  const arrowOne = reveal(frame, 35, 13);
  const walIn = reveal(frame, 45, 12);
  const active = frame < 68 ? 0 : frame < 82 ? 1 : frame < 96 ? 2 : 3;
  const ack = reveal(frame, 102, 9);

  return (
    <Frame chapter="04 / WRITE AHEAD">
      <div
        style={{
          position: 'absolute',
          top: 180,
          left: 70,
          fontSize: 84,
          fontWeight: 850,
          letterSpacing: -4,
          lineHeight: 0.95,
          clipPath: `inset(0 ${(1 - reveal(frame, 0, 13)) * 100}% 0 0)`,
        }}
      >
        WRITE THE LOG
        <br />
        <span style={{color: DIM}}>BEFORE “OK”.</span>
      </div>
      <div style={{position: 'absolute', top: 520, left: 190, opacity: memoryIn}}>
        <Transaction progress={memoryIn} />
        <div
          style={{
            position: 'absolute',
            top: -34,
            left: 0,
            fontFamily: HAND,
            fontSize: 34,
            color: DIM,
          }}
        >
          change in memory
        </div>
      </div>
      <RoughArrow
        width={80}
        height={145}
        seed={130}
        progress={arrowOne}
        style={{position: 'absolute', top: 645, left: 500}}
      />
      <Wal progress={walIn} active={active} style={{position: 'absolute', top: 775, left: 235}} />
      <div
        style={{
          position: 'absolute',
          top: 1030,
          left: 290,
          fontFamily: HAND,
          fontSize: 38,
          opacity: reveal(frame, 68, 8),
          transform: 'rotate(-2deg)',
        }}
      >
        1. flush this to durable storage
      </div>
      <div
        style={{
          position: 'absolute',
          top: 1190,
          left: 300,
          width: 480,
          height: 88,
          backgroundColor: PAPER,
          color: BG,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: 25,
          fontWeight: 850,
          letterSpacing: 3,
          clipPath: `inset(0 ${(1 - ack) * 100}% 0 0)`,
          transform: 'rotate(1deg)',
        }}
      >
        2. ACK COMMIT
      </div>
      <Database
        label="DATA FILE / LATER"
        opacity={0.28}
        style={{position: 'absolute', top: 1400, left: 320}}
        seed={142}
      />
    </Frame>
  );
};

const RecoveryScene: React.FC = () => {
  const frame = useCurrentFrame();
  const replay = reveal(frame, 25, 22);
  const restored = reveal(frame, 55, 10);
  const packetY = interpolate(frame, [24, 49], [0, 305], clamp);

  return (
    <Frame chapter="05 / RECOVERY">
      <div
        style={{
          position: 'absolute',
          top: 190,
          left: 70,
          fontSize: 105,
          fontWeight: 850,
          letterSpacing: -6,
          clipPath: `inset(0 ${(1 - reveal(frame, 0, 12)) * 100}% 0 0)`,
        }}
      >
        REPLAY.
      </div>
      <Wal active={3} style={{position: 'absolute', top: 560, left: 235}} />
      <RoughArrow
        width={80}
        height={250}
        seed={210}
        progress={replay}
        style={{position: 'absolute', top: 790, left: 500}}
      />
      {[0, 1, 2].map((index) => (
        <div
          key={index}
          style={{
            position: 'absolute',
            top: 790 + packetY - index * 25,
            left: 515,
            width: 48,
            height: 28,
            backgroundColor: PAPER,
            opacity: interpolate(frame, [24 + index * 3, 30 + index * 3, 48, 54], [0, 1, 1, 0], clamp),
            transform: `rotate(${index % 2 ? 4 : -3}deg)`,
          }}
        />
      ))}
      <Database
        progress={replay}
        style={{position: 'absolute', top: 1050, left: 320}}
        seed={211}
      />
      <div
        style={{
          position: 'absolute',
          top: 1370,
          left: 330,
          width: 420,
          height: 84,
          backgroundColor: PAPER,
          color: BG,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: 25,
          fontWeight: 850,
          letterSpacing: 3,
          clipPath: `inset(0 ${(1 - restored) * 100}% 0 0)`,
          transform: 'rotate(-1deg)',
        }}
      >
        DATA RESTORED
      </div>
      <div
        style={{
          position: 'absolute',
          top: 1530,
          left: 180,
          fontFamily: HAND,
          fontSize: 50,
          color: DIM,
          opacity: reveal(frame, 60, 10),
        }}
      >
        the promise survives the crash
      </div>
    </Frame>
  );
};

const SummaryScene: React.FC = () => {
  const frame = useCurrentFrame();
  const titleIn = reveal(frame, 0, 12);
  return (
    <Frame chapter="06 / THE IDEA">
      <div
        style={{
          position: 'absolute',
          top: 370,
          width: '100%',
          textAlign: 'center',
          fontSize: 210,
          fontWeight: 900,
          letterSpacing: -14,
          clipPath: `inset(0 ${(1 - titleIn) * 100}% 0 0)`,
          transform: `translateY(${interpolate(titleIn, [0, 1], [32, 0])}px)`,
        }}
      >
        WAL
      </div>
      <div
        style={{
          position: 'absolute',
          top: 670,
          left: 180,
          width: interpolate(frame, [10, 24], [0, 720], clamp),
          borderTop: `8px solid ${PAPER}`,
          transform: 'rotate(-1deg)',
        }}
      />
      <div
        style={{
          position: 'absolute',
          top: 810,
          left: 120,
          right: 120,
          fontSize: 70,
          fontWeight: 750,
          lineHeight: 1.25,
          letterSpacing: -2,
          opacity: reveal(frame, 18, 12),
        }}
      >
        RECORD FIRST.
        <br />
        <span style={{color: DIM}}>APPLY LATER.</span>
      </div>
      <div
        style={{
          position: 'absolute',
          top: 1250,
          left: 120,
          fontFamily: HAND,
          fontSize: 53,
          opacity: reveal(frame, 34, 10),
          transform: 'rotate(-2deg)',
        }}
      >
        first record the promise,
        <br />
        then fulfill it.
      </div>
    </Frame>
  );
};

const Grain: React.FC = () => (
  <AbsoluteFill
    style={{
      pointerEvents: 'none',
      opacity: 0.055,
      mixBlendMode: 'screen',
      backgroundImage:
        'url("data:image/svg+xml,%3Csvg viewBox=%270 0 180 180%27 xmlns=%27http://www.w3.org/2000/svg%27%3E%3Cfilter id=%27n%27%3E%3CfeTurbulence type=%27fractalNoise%27 baseFrequency=%27.9%27 numOctaves=%272%27 stitchTiles=%27stitch%27/%3E%3C/filter%3E%3Crect width=%27100%25%27 height=%27100%25%27 filter=%27url(%23n)%27 opacity=%27.55%27/%3E%3C/svg%3E")',
    }}
  />
);

export const WalShort: React.FC = () => {
  return (
    <AbsoluteFill style={{backgroundColor: BG}}>
      <Sequence from={0} durationInFrames={105} premountFor={15}>
        <HookScene />
      </Sequence>
      <Sequence from={105} durationInFrames={90} premountFor={15}>
        <CrashScene />
      </Sequence>
      <Sequence from={195} durationInFrames={75} premountFor={15}>
        <QuestionScene />
      </Sequence>
      <Sequence from={270} durationInFrames={175} premountFor={15}>
        <WalScene />
      </Sequence>
      <Sequence from={445} durationInFrames={90} premountFor={15}>
        <RecoveryScene />
      </Sequence>
      <Sequence from={535} durationInFrames={65} premountFor={15}>
        <SummaryScene />
      </Sequence>
      <Grain />
    </AbsoluteFill>
  );
};
