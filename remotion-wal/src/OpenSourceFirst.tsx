import React from 'react';
import {
  AbsoluteFill,
  Easing,
  interpolate,
  useCurrentFrame,
} from 'remotion';

const PAPER = '#f2e6cf';
const INK = '#17233b';
const RED = '#df4b38';
const TEAL = '#327d78';
const GOLD = '#dfa735';
const CREAM = '#fff8e8';
const clamp = {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'} as const;

const progress = (frame: number, start: number, duration: number) =>
  interpolate(frame, [start, start + duration], [0, 1], {
    ...clamp,
    easing: Easing.inOut(Easing.cubic),
  });

const pop = (frame: number, start: number, duration = 10) =>
  interpolate(frame, [start, start + duration * 0.55, start + duration], [0, 1.12, 1], {
    ...clamp,
    easing: Easing.out(Easing.cubic),
  });

const bezier = (
  amount: number,
  start: {x: number; y: number},
  control: {x: number; y: number},
  end: {x: number; y: number},
) => {
  const inverse = 1 - amount;
  return {
    x: inverse * inverse * start.x + 2 * inverse * amount * control.x + amount * amount * end.x,
    y: inverse * inverse * start.y + 2 * inverse * amount * control.y + amount * amount * end.y,
  };
};

const RetroBackdrop: React.FC = () => (
  <AbsoluteFill style={{backgroundColor: PAPER, overflow: 'hidden'}}>
    <div
      style={{
        position: 'absolute',
        width: 390,
        height: 390,
        borderRadius: '50%',
        right: -68,
        top: 54,
        backgroundColor: RED,
      }}
    />
    <div
      style={{
        position: 'absolute',
        inset: 0,
        opacity: 0.13,
        backgroundImage: `radial-gradient(${INK} 1.4px, transparent 1.4px)`,
        backgroundSize: '13px 13px',
        maskImage: 'linear-gradient(115deg, transparent 12%, black 36%, transparent 72%)',
      }}
    />
    <svg width="1080" height="1920" viewBox="0 0 1080 1920" style={{position: 'absolute'}}>
      <path d="M42 240V42H276" fill="none" stroke={INK} strokeWidth="7" />
      <path d="M804 1878H1038V1680" fill="none" stroke={INK} strokeWidth="7" />
      <path d="M38 1540L126 1452" stroke={RED} strokeWidth="18" />
      <path d="M38 1590L152 1476" stroke={GOLD} strokeWidth="8" />
      {[0, 1, 2, 3, 4].map((line) => (
        <path
          key={line}
          d={`M${820 + line * 42} 500L${1030 + line * 12} ${710 + line * 34}`}
          stroke={INK}
          strokeWidth={line === 2 ? 8 : 4}
          opacity="0.3"
        />
      ))}
    </svg>
    <div
      style={{
        position: 'absolute',
        inset: 18,
        border: `3px solid ${INK}`,
        opacity: 0.22,
        pointerEvents: 'none',
      }}
    />
  </AbsoluteFill>
);

const BranchSymbol: React.FC<{color?: string}> = ({color = CREAM}) => (
  <svg width="210" height="74" viewBox="0 0 210 74">
    <path d="M18 18H98C130 18 126 56 158 56H190" fill="none" stroke={color} strokeWidth="8" />
    <circle cx="18" cy="18" r="11" fill={color} />
    <circle cx="190" cy="56" r="11" fill={color} />
    <circle cx="98" cy="18" r="8" fill={GOLD} />
  </svg>
);

const Crack: React.FC<{opacity: number}> = ({opacity}) => (
  <svg width="96" height="70" viewBox="0 0 96 70" style={{opacity}}>
    <path
      d="M51 1L39 22L56 29L34 48L45 69"
      fill="none"
      stroke={CREAM}
      strokeWidth="7"
      strokeLinejoin="bevel"
    />
  </svg>
);

const RepoPanel: React.FC<{
  reveal: number;
  issuePulse: number;
  merged: boolean;
}> = ({reveal, issuePulse, merged}) => {
  const modules = [0, 1, 2, 3, 4, 5];

  return (
    <div
      style={{
        position: 'absolute',
        left: 180,
        top: 250,
        width: 720,
        height: 470,
        backgroundColor: INK,
        border: `7px solid ${INK}`,
        clipPath: 'polygon(0 0, 90% 0, 100% 15%, 100% 100%, 10% 100%, 0 85%)',
        boxShadow: `14px 16px 0 ${GOLD}`,
        opacity: reveal,
        transform: `translateY(${interpolate(reveal, [0, 1], [-30, 0])}px)`,
        boxSizing: 'border-box',
      }}
    >
      <div style={{position: 'absolute', left: 38, top: 32}}>
        <BranchSymbol />
      </div>
      <div style={{position: 'absolute', right: 42, top: 42, display: 'flex', gap: 12}}>
        {[58, 32, 18].map((width) => (
          <div key={width} style={{width, height: 9, backgroundColor: width === 58 ? RED : GOLD}} />
        ))}
      </div>
      {modules.map((module) => {
        const col = module % 3;
        const row = Math.floor(module / 3);
        const isIssue = module === 4;
        return (
          <div
            key={module}
            style={{
              position: 'absolute',
              left: 52 + col * 210,
              top: 164 + row * 118,
              width: 174,
              height: 84,
              backgroundColor: isIssue ? (merged ? TEAL : RED) : CREAM,
              border: `5px solid ${isIssue ? CREAM : INK}`,
              boxShadow: isIssue && !merged ? `0 0 ${28 * issuePulse}px ${RED}` : 'none',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxSizing: 'border-box',
            }}
          >
            {isIssue && !merged ? <Crack opacity={0.65 + issuePulse * 0.35} /> : null}
            {isIssue && merged ? (
              <svg width="82" height="58" viewBox="0 0 82 58">
                <path d="M10 29L31 49L72 8" fill="none" stroke={CREAM} strokeWidth="9" />
              </svg>
            ) : null}
            {!isIssue ? (
              <div style={{display: 'flex', flexDirection: 'column', gap: 9}}>
                {[96, 66, 112].map((width) => (
                  <div key={width} style={{width, height: 7, backgroundColor: INK, opacity: 0.72}} />
                ))}
              </div>
            ) : null}
          </div>
        );
      })}
    </div>
  );
};

const PersonNode: React.FC<{
  x: number;
  y: number;
  scale?: number;
  opacity?: number;
  active?: boolean;
}> = ({x, y, scale = 1, opacity = 1, active = false}) => (
  <div
    style={{
      position: 'absolute',
      left: x - 48,
      top: y - 48,
      width: 96,
      height: 96,
      borderRadius: '50%',
      backgroundColor: active ? RED : CREAM,
      border: `7px solid ${INK}`,
      boxShadow: `${active ? 8 : 5}px ${active ? 8 : 5}px 0 ${active ? GOLD : TEAL}`,
      opacity,
      transform: `scale(${scale})`,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      boxSizing: 'border-box',
    }}
  >
    <svg width="58" height="58" viewBox="0 0 58 58">
      <circle cx="29" cy="19" r="11" fill={INK} />
      <path d="M10 53C11 36 18 30 29 30C40 30 47 36 48 53Z" fill={INK} />
    </svg>
  </div>
);

const ContributorNetwork: React.FC<{pulse: number}> = ({pulse}) => {
  const nodes = [
    {x: 116, y: 330},
    {x: 962, y: 350},
    {x: 112, y: 650},
    {x: 966, y: 650},
  ];

  return (
    <>
      <svg width="1080" height="1920" viewBox="0 0 1080 1920" style={{position: 'absolute'}}>
        {nodes.map((node) => (
          <line
            key={`${node.x}-${node.y}`}
            x1={node.x}
            y1={node.y}
            x2={node.x < 500 ? 180 : 900}
            y2={node.y}
            stroke={TEAL}
            strokeWidth={5}
            opacity={0.45 + pulse * 0.45}
          />
        ))}
      </svg>
      {nodes.map((node, index) => (
        <PersonNode
          key={`${node.x}-${node.y}`}
          x={node.x}
          y={node.y}
          scale={0.56 + pulse * (index % 2 ? 0.07 : 0.12)}
        />
      ))}
    </>
  );
};

const Workbench: React.FC<{reveal: number; fix: number; tested: number; opacity: number}> = ({
  reveal,
  fix,
  tested,
  opacity,
}) => (
  <div
    style={{
      position: 'absolute',
      left: 130,
      top: 940,
      width: 820,
      height: 450,
      backgroundColor: CREAM,
      border: `7px solid ${INK}`,
      clipPath: 'polygon(0 0, 94% 0, 100% 12%, 100% 100%, 6% 100%, 0 88%)',
      boxShadow: `13px 15px 0 ${TEAL}`,
      opacity: reveal * opacity,
      transform: `translateX(${interpolate(reveal, [0, 1], [90, 0])}px)`,
      boxSizing: 'border-box',
    }}
  >
    <svg width="820" height="450" viewBox="0 0 820 450" style={{position: 'absolute'}}>
      <path d="M96 224H260C310 224 295 128 360 128H490" fill="none" stroke={INK} strokeWidth="10" />
      <path d="M260 224C310 224 295 320 360 320H660" fill="none" stroke={TEAL} strokeWidth="10" />
      <circle cx="96" cy="224" r="18" fill={INK} />
      <circle cx="260" cy="224" r="15" fill={RED} />
      <circle cx="660" cy="320" r="18" fill={TEAL} />
    </svg>
    <div
      style={{
        position: 'absolute',
        left: 360,
        top: 65,
        width: 188,
        height: 126,
        backgroundColor: fix > 0.5 ? TEAL : RED,
        border: `6px solid ${INK}`,
        transform: `rotate(${interpolate(fix, [0, 1], [-5, 0])}deg) scale(${pop(fix * 10, 0, 10)})`,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        boxSizing: 'border-box',
      }}
    >
      {fix < 0.5 ? (
        <Crack opacity={1} />
      ) : (
        <div style={{transform: 'scale(0.7)'}}>
          <BranchSymbol color={CREAM} />
        </div>
      )}
    </div>
    <div style={{position: 'absolute', left: 382, top: 280, display: 'flex', gap: 14}}>
      {[100, 58, 30].map((width) => (
        <div key={width} style={{width, height: 12, backgroundColor: INK, opacity: 0.74}} />
      ))}
    </div>
    <div
      style={{
        position: 'absolute',
        right: 50,
        top: 48,
        width: 104,
        height: 104,
        borderRadius: '50%',
        backgroundColor: GOLD,
        border: `6px solid ${INK}`,
        transform: `scale(${tested}) rotate(-8deg)`,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <svg width="72" height="58" viewBox="0 0 72 58">
        <path d="M7 29L27 49L65 8" fill="none" stroke={INK} strokeWidth="10" />
      </svg>
    </div>
  </div>
);

const MovingModule: React.FC<{x: number; y: number; rotation: number; opacity: number}> = ({
  x,
  y,
  rotation,
  opacity,
}) => (
  <div
    style={{
      position: 'absolute',
      left: x - 64,
      top: y - 42,
      width: 128,
      height: 84,
      backgroundColor: RED,
      border: `6px solid ${INK}`,
      boxShadow: `8px 8px 0 ${GOLD}`,
      opacity,
      transform: `rotate(${rotation}deg)`,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 30,
      boxSizing: 'border-box',
    }}
  >
    <Crack opacity={1} />
  </div>
);

const ReviewBurst: React.FC<{amount: number}> = ({amount}) => (
  <div
    style={{
      position: 'absolute',
      left: 478,
      top: 477,
      width: 124,
      height: 124,
      transform: `scale(${amount})`,
      opacity: amount,
      zIndex: 40,
    }}
  >
    <svg width="124" height="124" viewBox="0 0 124 124">
      <path
        d="M62 0L75 28L105 14L96 45L124 62L96 78L105 110L75 96L62 124L49 96L19 110L28 78L0 62L28 45L19 14L49 28Z"
        fill={GOLD}
        stroke={INK}
        strokeWidth="6"
      />
      <path d="M31 62L52 82L94 38" fill="none" stroke={INK} strokeWidth="11" />
    </svg>
  </div>
);

export const OpenSourceFirst: React.FC = () => {
  const frame = useCurrentFrame();
  const repoIn = progress(frame, 0, 24);
  const issuePulse = interpolate(frame, [20, 28, 36, 44], [0, 1, 0.35, 1], clamp);
  const forkProgress = progress(frame, 45, 38);
  const forkPoint = bezier(forkProgress, {x: 540, y: 548}, {x: 820, y: 760}, {x: 540, y: 1068});
  const workbenchIn = progress(frame, 70, 20);
  const fix = progress(frame, 96, 34);
  const tested = pop(frame, 138, 14);
  const pullProgress = progress(frame, 174, 42);
  const pullPoint = bezier(pullProgress, {x: 540, y: 1128}, {x: 940, y: 830}, {x: 540, y: 548});
  const review = pop(frame, 226, 17);
  const reviewOut = interpolate(frame, [244, 260], [1, 0], clamp);
  const merged = frame >= 239;
  const workbenchOut = interpolate(frame, [244, 260], [1, 0], clamp);
  const joinProgress = progress(frame, 255, 35);
  const joinPoint = bezier(joinProgress, {x: 540, y: 1660}, {x: 70, y: 1210}, {x: 112, y: 650});
  const networkPulse = interpolate(frame, [276, 284, 292, 299], [0, 1, 0.35, 0.8], clamp);

  return (
    <AbsoluteFill style={{backgroundColor: PAPER, overflow: 'hidden'}}>
      <RetroBackdrop />
      <ContributorNetwork pulse={networkPulse} />
      <RepoPanel reveal={repoIn} issuePulse={issuePulse} merged={merged} />

      <svg width="1080" height="1920" viewBox="0 0 1080 1920" style={{position: 'absolute'}}>
        <path
          d="M540 548Q820 760 540 1068"
          fill="none"
          stroke={RED}
          strokeWidth="8"
          strokeDasharray="18 14"
          pathLength="1"
          strokeDashoffset={1 - forkProgress}
          opacity={interpolate(frame, [42, 50, 82, 92], [0, 0.7, 0.7, 0], clamp)}
        />
        <path
          d="M540 1128Q940 830 540 548"
          fill="none"
          stroke={TEAL}
          strokeWidth="9"
          pathLength="1"
          strokeDasharray="1"
          strokeDashoffset={1 - pullProgress}
          opacity={interpolate(frame, [170, 178, 216, 232, 250], [0, 1, 1, 0.4, 0], clamp)}
        />
        <path
          d="M540 1660Q70 1210 112 650"
          fill="none"
          stroke={RED}
          strokeWidth="8"
          pathLength="1"
          strokeDasharray="1"
          strokeDashoffset={1 - joinProgress}
          opacity={joinProgress * interpolate(frame, [280, 298], [1, 0], clamp)}
        />
      </svg>

      <Workbench reveal={workbenchIn} fix={fix} tested={tested} opacity={workbenchOut} />

      {frame >= 42 && frame <= 92 ? (
        <MovingModule
          x={forkPoint.x}
          y={forkPoint.y}
          rotation={interpolate(forkProgress, [0, 1], [-8, 5])}
          opacity={interpolate(frame, [42, 48, 82, 92], [0, 1, 1, 0], clamp)}
        />
      ) : null}

      {frame >= 170 && frame <= 228 ? (
        <div
          style={{
            position: 'absolute',
            left: pullPoint.x - 62,
            top: pullPoint.y - 40,
            width: 124,
            height: 80,
            backgroundColor: TEAL,
            border: `6px solid ${INK}`,
            boxShadow: `8px 8px 0 ${GOLD}`,
            transform: `rotate(${interpolate(pullProgress, [0, 1], [7, -6])}deg)`,
            zIndex: 34,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxSizing: 'border-box',
          }}
        >
          <div style={{transform: 'scale(0.42)'}}>
            <BranchSymbol color={CREAM} />
          </div>
        </div>
      ) : null}

      <ReviewBurst amount={review * reviewOut} />

      <PersonNode
        x={540}
        y={1660}
        active
        opacity={1 - progress(frame, 255, 12)}
        scale={pop(frame, 12, 14)}
      />
      {frame >= 255 ? (
        <PersonNode
          x={joinPoint.x}
          y={joinPoint.y}
          active
          scale={interpolate(joinProgress, [0, 1], [1, 0.56])}
        />
      ) : null}
    </AbsoluteFill>
  );
};
