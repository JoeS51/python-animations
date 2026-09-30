import React from 'react';
import {AbsoluteFill, Easing, interpolate, useCurrentFrame} from 'remotion';

const BLACK = '#000000';
const WHITE = '#ffffff';
const GRAY = '#8c8c8c';
const LINE = '#333333';
const MONO = '"JetBrains Mono", ui-monospace, monospace';
const SANS = '"Inter Variable", Inter, system-ui, sans-serif';

const CODE = 44;
const LH = 60;
const CW = CODE * 0.6; // JetBrains Mono advance width is 0.6em

const out = Easing.bezier(0.33, 1, 0.68, 1);
const inOut = Easing.bezier(0.65, 0, 0.35, 1);
const clamp = {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'} as const;

const p = (frame: number, start: number, dur: number, easing = out) =>
  interpolate(frame, [start, start + dur], [0, 1], {...clamp, easing});
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

// ---------- timeline (frames @ 30fps) ----------
const T = {
  highlightAsm: 185,
  toAnatomy: 225,
  labels: [260, 274, 288],
  arrow: 300,
  anatomyOut: 338,
  toListing: 345,
  registers: 360,
  exec: [395, 450, 505], // mov, add, ret
};

// ---------- scene 1: the layers ----------
const TEXT_X = 400;
const RAIL_X = 360;

type Row = {label: string; y: number; lines: string[]; in: number};
const ROWS: Row[] = [
  {label: 'PYTHON', y: 150, lines: ['def add(a, b): return a + b'], in: 0},
  {label: 'C', y: 312, lines: ['long add(long a, long b) { return a + b; }'], in: 40},
  {label: 'ASSEMBLY', y: 474, lines: ['add:', '    mov rax, rdi', '    add rax, rsi', '    ret'], in: 85},
  {label: 'MACHINE CODE', y: 812, lines: [], in: 140},
];
const BYTES = [['48', '89', 'f8'], ['48', '01', 'f0'], ['c3']];
const codeY = (row: Row) => row.y + 32;
const dotY = (row: Row) => codeY(row) + LH / 2;

const rowOpacity = (frame: number, i: number) => {
  const entry = p(frame, ROWS[i].in, 18);
  const next = ROWS[i + 1];
  const dimmed = next ? interpolate(frame, [next.in, next.in + 18], [1, 0.35], clamp) : 1;
  const h = p(frame, T.highlightAsm, 20, inOut);
  return entry * lerp(dimmed, i === 2 ? 1 : 0.15, h);
};

const asmLineEntry = (frame: number, j: number) => p(frame, ROWS[2].in + j * 6, 18);

const Layers: React.FC<{frame: number}> = ({frame}) => {
  const exit = 1 - p(frame, T.toAnatomy, 25, inOut);
  if (exit <= 0) return null;

  return (
    <AbsoluteFill style={{opacity: exit}}>
      {/* rail */}
      <svg width={1920} height={1080} style={{position: 'absolute'}}>
        {ROWS.slice(1).map((row, k) => {
          const y1 = dotY(ROWS[k]);
          const y2 = dotY(row);
          const t = p(frame, row.in - 12, 22, inOut);
          return <line key={k} x1={RAIL_X} x2={RAIL_X} y1={y1} y2={lerp(y1, y2, t)} stroke={LINE} strokeWidth={2} />;
        })}
        {ROWS.map((row, i) => {
          const e = p(frame, row.in, 14);
          return (
            <circle
              key={i}
              cx={RAIL_X}
              cy={dotY(row)}
              r={6 * e}
              fill={WHITE}
              opacity={Math.max(rowOpacity(frame, i), 0.25 * e)}
            />
          );
        })}
      </svg>

      {ROWS.map((row, i) => {
        const entry = p(frame, row.in, 18);
        const labelLit = i === 2 ? p(frame, T.highlightAsm, 20) : 0;
        return (
          <div
            key={row.label}
            style={{
              position: 'absolute',
              left: TEXT_X,
              top: row.y,
              opacity: rowOpacity(frame, i),
              transform: `translateY(${(1 - entry) * 14}px)`,
            }}
          >
            <div
              style={{
                fontFamily: SANS,
                fontSize: 20,
                lineHeight: '24px',
                fontWeight: 500,
                letterSpacing: 5,
                color: labelLit ? `rgba(255,255,255,${lerp(0.55, 1, labelLit)})` : GRAY,
              }}
            >
              {row.label}
            </div>
            <div style={{marginTop: 32 - 24, fontFamily: MONO, fontSize: CODE, lineHeight: `${LH}px`, color: WHITE, whiteSpace: 'pre'}}>
              {row.lines.map((line, j) => (
                <div
                  key={j}
                  style={{
                    height: LH,
                    // line 1 of the assembly row is drawn by <Hero /> so it can travel
                    opacity: i === 2 ? (j === 1 ? 0 : asmLineEntry(frame, j)) : 1,
                    transform: i === 2 ? `translateY(${(1 - asmLineEntry(frame, j)) * 10}px)` : undefined,
                  }}
                >
                  {line}
                </div>
              ))}
              {i === 3 && (
                <div style={{height: LH}}>
                  {BYTES.map((group, g) => (
                    <span key={g} style={{marginRight: g < BYTES.length - 1 ? CW * 2 : 0}}>
                      {group.map((b, k) => {
                        const idx = BYTES.slice(0, g).flat().length + k;
                        return (
                          <span key={k} style={{opacity: p(frame, row.in + idx * 3, 10)}}>
                            {b}
                            {k < group.length - 1 ? ' ' : ''}
                          </span>
                        );
                      })}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>
        );
      })}
    </AbsoluteFill>
  );
};

// ---------- the traveling "mov rax, rdi" line ----------
const HERO = 'mov rax, rdi';
const LIST_X = 320;
const LIST_Y = 420;
const LISTING = ['add:', '    mov rax, rdi', '    add rax, rsi', '    ret'];

const POS_LAYERS = {x: TEXT_X + 4 * CW, y: codeY(ROWS[2]) + LH, s: 1};
const POS_ANATOMY = {x: 960 - HERO.length * CW, y: 470 - LH, s: 2};
const POS_LISTING = {x: LIST_X + 4 * CW, y: LIST_Y + LH, s: 1};

const execFocus = (frame: number, j: number) => {
  const i = j - 1; // listing line j <-> exec step j-1
  if (i < 0) return 0;
  const on = p(frame, T.exec[i], 10);
  const off = T.exec[i + 1] !== undefined ? p(frame, T.exec[i + 1], 10) : 0;
  return on - off;
};
const listingOpacity = (frame: number, j: number) => {
  const dim = p(frame, T.exec[0] - 10, 10);
  return 1 - dim * 0.65 * (1 - execFocus(frame, j));
};

const Hero: React.FC<{frame: number}> = ({frame}) => {
  if (frame < ROWS[2].in) return null;
  const t1 = p(frame, T.toAnatomy, 35, inOut);
  const t2 = p(frame, T.toListing, 33, inOut);
  const x = lerp(lerp(POS_LAYERS.x, POS_ANATOMY.x, t1), POS_LISTING.x, t2);
  const y = lerp(lerp(POS_LAYERS.y, POS_ANATOMY.y, t1), POS_LISTING.y, t2);
  const s = lerp(lerp(POS_LAYERS.s, POS_ANATOMY.s, t1), POS_LISTING.s, t2);
  const entry = asmLineEntry(frame, 1);
  const opacity = frame < T.toAnatomy ? entry * rowOpacity(frame, 2) : listingOpacity(frame, 1);

  return (
    <div
      style={{
        position: 'absolute',
        left: 0,
        top: 0,
        transformOrigin: '0 0',
        transform: `translate(${x}px, ${y + (1 - entry) * 10}px) scale(${s})`,
        fontFamily: MONO,
        fontSize: CODE,
        lineHeight: `${LH}px`,
        color: WHITE,
        whiteSpace: 'pre',
        opacity,
      }}
    >
      {HERO}
    </div>
  );
};

// ---------- scene 2a: instruction anatomy ----------
const tokenX = (charCenter: number) => POS_ANATOMY.x + charCenter * CW * POS_ANATOMY.s;
const PARTS = [
  {label: 'instruction', x: tokenX(1.5)},
  {label: 'destination', x: tokenX(5.5)},
  {label: 'source', x: tokenX(10.5)},
];

const Anatomy: React.FC<{frame: number}> = ({frame}) => {
  const fadeOut = 1 - p(frame, T.anatomyOut, 14, inOut);
  if (frame < T.labels[0] || fadeOut <= 0) return null;

  const arrowT = p(frame, T.arrow, 24, inOut);
  const from = {x: PARTS[2].x, y: 425};
  const to = {x: PARTS[1].x, y: 425};
  const c1 = {x: from.x - 50, y: 340};
  const c2 = {x: to.x + 50, y: 340};
  // arrowhead points along the final tangent (c2 -> to)
  const dx = to.x - c2.x;
  const dy = to.y - c2.y;
  const len = Math.hypot(dx, dy);
  const ux = dx / len;
  const uy = dy / len;
  const wing = (a: number) => {
    const bx = -ux * Math.cos(a) + uy * Math.sin(a);
    const by = -uy * Math.cos(a) - ux * Math.sin(a);
    return `${to.x + bx * 18},${to.y + by * 18}`;
  };
  const headOpacity = p(frame, T.arrow + 18, 8);

  return (
    <AbsoluteFill style={{opacity: fadeOut}}>
      <svg width={1920} height={1080} style={{position: 'absolute'}}>
        <path
          d={`M ${from.x} ${from.y} C ${c1.x} ${c1.y}, ${c2.x} ${c2.y}, ${to.x} ${to.y}`}
          fill="none"
          stroke={WHITE}
          strokeWidth={3}
          strokeLinecap="round"
          pathLength={1}
          strokeDasharray={1}
          strokeDashoffset={1 - arrowT}
          opacity={arrowT > 0 ? 0.9 : 0}
        />
        <polyline
          points={`${wing(0.5)} ${to.x},${to.y} ${wing(-0.5)}`}
          fill="none"
          stroke={WHITE}
          strokeWidth={3}
          strokeLinecap="round"
          strokeLinejoin="round"
          opacity={headOpacity * 0.9}
        />
        {PARTS.map((part, i) => {
          const t = p(frame, T.labels[i], 16);
          return (
            <line key={i} x1={part.x} x2={part.x} y1={542} y2={lerp(542, 570, t)} stroke={GRAY} strokeWidth={2} opacity={t} />
          );
        })}
      </svg>
      {PARTS.map((part, i) => {
        const t = p(frame, T.labels[i], 16);
        return (
          <div
            key={part.label}
            style={{
              position: 'absolute',
              left: part.x - 200,
              width: 400,
              top: 584,
              textAlign: 'center',
              fontFamily: SANS,
              fontSize: 30,
              color: WHITE,
              opacity: t * 0.8,
              transform: `translateY(${(1 - t) * 10}px)`,
            }}
          >
            {part.label}
          </div>
        );
      })}
    </AbsoluteFill>
  );
};

// ---------- scene 2b: registers ----------
const BOX_W = 200;
const BOX_H = 110;
const BOX_Y = 540 - BOX_H / 2;
const REGS = [
  {name: 'rdi', note: 'a', x: 980},
  {name: 'rsi', note: 'b', x: 1240},
  {name: 'rax', note: 'return value', x: 1500},
] as const;
const regCenter = (i: number) => ({x: REGS[i].x + BOX_W / 2, y: 540});

const MOV_AT = T.exec[0] + 10;
const ADD_AT = T.exec[1] + 10;
const FLY = 24;
const RAX_VALUES = ['0', '3', '7'];
const RAX_CHANGES = [MOV_AT + FLY, ADD_AT + FLY];

const RollingValue: React.FC<{frame: number; values: readonly string[]; changes: number[]}> = ({frame, values, changes}) => (
  <>
    {values.map((v, k) => {
      const enter = k === 0 ? 1 : p(frame, changes[k - 1], 12);
      const leave = k === values.length - 1 ? 0 : p(frame, changes[k], 12);
      return (
        <div
          key={k}
          style={{
            position: 'absolute',
            inset: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            opacity: enter * (1 - leave),
            transform: `translateY(${(1 - enter) * 26 - leave * 26}px)`,
          }}
        >
          {v}
        </div>
      );
    })}
  </>
);

const FlyingValue: React.FC<{frame: number; value: string; from: number; to: number; start: number}> = ({
  frame,
  value,
  from,
  to,
  start,
}) => {
  const t = p(frame, start, FLY, inOut);
  if (t <= 0 || t >= 1) return null;
  const a = regCenter(from);
  const b = regCenter(to);
  const x = lerp(a.x, b.x, t);
  const y = lerp(a.y, b.y, t) - Math.sin(Math.PI * t) * 150;
  const fade = Math.min(1, t * 6, (1 - t) * 6);
  return (
    <div
      style={{
        position: 'absolute',
        left: x - 60,
        top: y - 40,
        width: 120,
        height: 80,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontFamily: MONO,
        fontSize: 56,
        color: WHITE,
        opacity: fade,
      }}
    >
      {value}
    </div>
  );
};

const Registers: React.FC<{frame: number}> = ({frame}) => {
  if (frame < T.registers) return null;
  const retT = p(frame, T.exec[2] + 6, 16);

  return (
    <AbsoluteFill>
      {REGS.map((reg, i) => {
        const e = p(frame, T.registers + i * 5, 20);
        const pulse =
          reg.name === 'rax'
            ? Math.max(...RAX_CHANGES.map((c) => interpolate(frame, [c - 2, c + 4, c + 30], [0, 1, 0], clamp)), retT)
            : 0;
        const border = Math.round(lerp(0x44, 0xff, pulse));
        const noteOpacity = reg.name === 'rax' ? retT : 0.7;
        return (
          <div key={reg.name} style={{opacity: e, transform: `translateY(${(1 - e) * 14}px)`}}>
            <div
              style={{
                position: 'absolute',
                left: reg.x,
                top: BOX_Y,
                width: BOX_W,
                height: BOX_H,
                boxSizing: 'border-box',
                border: `2px solid rgb(${border},${border},${border})`,
                borderRadius: 10,
                fontFamily: MONO,
                fontSize: 56,
                color: WHITE,
                overflow: 'hidden',
              }}
            >
              {reg.name === 'rax' ? (
                <RollingValue frame={frame} values={RAX_VALUES} changes={RAX_CHANGES} />
              ) : (
                <RollingValue frame={frame} values={[reg.name === 'rdi' ? '3' : '4']} changes={[]} />
              )}
            </div>
            <div
              style={{
                position: 'absolute',
                left: reg.x,
                width: BOX_W,
                top: BOX_Y + BOX_H + 22,
                textAlign: 'center',
                fontFamily: MONO,
                fontSize: 32,
                color: WHITE,
              }}
            >
              {reg.name}
            </div>
            <div
              style={{
                position: 'absolute',
                left: reg.x - 50,
                width: BOX_W + 100,
                top: BOX_Y + BOX_H + 72,
                textAlign: 'center',
                fontFamily: SANS,
                fontSize: 24,
                color: GRAY,
                opacity: noteOpacity,
              }}
            >
              {reg.note}
            </div>
          </div>
        );
      })}
      <FlyingValue frame={frame} value="3" from={0} to={2} start={MOV_AT} />
      <FlyingValue frame={frame} value="4" from={1} to={2} start={ADD_AT} />
    </AbsoluteFill>
  );
};

const Listing: React.FC<{frame: number}> = ({frame}) => {
  if (frame < T.toListing) return null;
  const markerIn = p(frame, T.exec[0] - 6, 12);
  const lineTop = (j: number) => LIST_Y + j * LH;
  const markerY = interpolate(
    frame,
    [T.exec[1], T.exec[1] + 12, T.exec[2], T.exec[2] + 12],
    [lineTop(1), lineTop(2), lineTop(2), lineTop(3)],
    {...clamp, easing: inOut},
  );

  return (
    <AbsoluteFill>
      <div
        style={{
          position: 'absolute',
          left: LIST_X - 28,
          top: markerY + 10,
          width: 4,
          height: LH - 20,
          borderRadius: 2,
          backgroundColor: WHITE,
          opacity: markerIn,
          transform: `scaleY(${markerIn})`,
        }}
      />
      {LISTING.map((line, j) => {
        if (j === 1) return null; // drawn by <Hero />
        const e = p(frame, T.toListing + 12 + j * 4, 20);
        return (
          <div
            key={j}
            style={{
              position: 'absolute',
              left: LIST_X,
              top: lineTop(j),
              fontFamily: MONO,
              fontSize: CODE,
              lineHeight: `${LH}px`,
              color: WHITE,
              whiteSpace: 'pre',
              opacity: e * listingOpacity(frame, j),
              transform: `translateY(${(1 - e) * 10}px)`,
            }}
          >
            {line}
          </div>
        );
      })}
    </AbsoluteFill>
  );
};

export const AssemblyIntro: React.FC = () => {
  const frame = useCurrentFrame();
  return (
    <AbsoluteFill style={{backgroundColor: BLACK}}>
      <Layers frame={frame} />
      <Anatomy frame={frame} />
      <Listing frame={frame} />
      <Registers frame={frame} />
      <Hero frame={frame} />
    </AbsoluteFill>
  );
};
