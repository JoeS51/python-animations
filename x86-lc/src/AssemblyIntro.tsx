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
// 0 -> 1 at `start`, back to 0 at `end`
const win = (frame: number, start: number, end: number, dur = 10) => p(frame, start, dur) - p(frame, end, dur);
// border color from dim gray (0) to white (1)
const edge = (lit: number) => {
  const c = Math.round(lerp(0x44, 0xff, Math.min(1, Math.max(0, lit))));
  return `rgb(${c},${c},${c})`;
};

// ---------- cue sheet (seconds -> frames) ----------
// Every beat lines up with one sentence of the voiceover. Retime here.
const FPS = 30;
const s = (sec: number) => Math.round(sec * FPS);

const CUE = {
  python: s(0.3), // "In Python, you just say what you want..."
  c: s(6.5), // "One level down, in C..."
  asm: s(13), // "Go down again and you get assembly..."
  machine: s(19), // "And each of those steps is really a few bytes..."
  focusBytes: s(26.5), // "So to understand assembly..."
  memory: s(33), // "Your program sits in memory..."
  cpu: s(41), // "Inside the CPU are registers..."
  rip: s(53), // "One special register, the instruction pointer..."
  cycle: s(59), // "The CPU does the same three things over and over..."
  args: s(67), // "When our add function gets called..."
  anatomy: s(83), // "That's all assembly is..."
  anatomyEnd: s(92.5),
  wrap: s(113.5), // "Every assembly program..."
  end: s(124),
};

// one entry per instruction: fetch -> decode -> execute
const STEPS = [
  // "Fetch: grab the bytes... Decode: these three bytes mean mov rax, rdi." / "Execute: copy rdi into rax..."
  {text: 'mov rax, rdi', bytes: [0, 1, 2], fetch: s(76), decode: s(79), exec: s(93.5), fly: s(94.5), ripAt: s(97.5)},
  // "Next, add rax, rsi. rax is now 7."
  {text: 'add rax, rsi', bytes: [3, 4, 5], fetch: s(100), decode: s(101.5), exec: s(103), fly: s(103.3), ripAt: s(104.8)},
  // "And ret jumps back to whoever called us..."
  {text: 'ret', bytes: [6], fetch: s(106), decode: s(107.3), exec: s(108.6), fly: -1, ripAt: s(109)},
];
const RAX_RETURN = s(110.5); // "...they'll look for the answer in rax."
const nextFetch = (k: number) => STEPS[k + 1]?.fetch ?? CUE.wrap;

export const DURATION = CUE.end;

// ---------- shared layout ----------
const BYTES = ['48', '89', 'f8', '48', '01', 'f0', 'c3'];
const BYTE_TEXT_OFFSET = [0, 3, 6, 10, 13, 16, 20]; // char columns in "48 89 f8  48 01 f0  c3"

const CELL_W = 110;
const CELL_H = 90;
const MEM_X = 960 - (BYTES.length * CELL_W) / 2;
const MEM_Y = 760;
const cellCx = (i: number) => MEM_X + i * CELL_W + CELL_W / 2;
const cellCy = MEM_Y + CELL_H / 2;

const CPU = {x: 260, y: 110, w: 1400, h: 510};
const INSTR_CX = 580;
const INSTR_Y = 270; // top of the decoded instruction's line box
const RIP = {x: 480, y: 440, w: 200, h: 80};

const REG_Y = 290;
const REG_W = 200;
const REG_H = 110;
const REGS = [
  {name: 'rdi', note: 'a', x: 940},
  {name: 'rsi', note: 'b', x: 1170},
  {name: 'rax', note: 'return value', x: 1400},
] as const;
const regCenter = (i: number) => ({x: REGS[i].x + REG_W / 2, y: REG_Y + REG_H / 2});

// the whole CPU + memory picture dims while we zoom into one instruction, and fades at the end
const sceneOpacity = (frame: number) =>
  (1 - 0.96 * win(frame, CUE.anatomy, CUE.anatomyEnd, 20)) * (1 - p(frame, CUE.wrap, 25, inOut));

// ---------- part 1: the layers ----------
const TEXT_X = 400;
const RAIL_X = 360;

type Row = {label: string; y: number; lines: string[]; in: number};
const ROWS: Row[] = [
  {label: 'PYTHON', y: 150, lines: ['def add(a, b): return a + b'], in: CUE.python},
  {label: 'C', y: 312, lines: ['long add(long a, long b) { return a + b; }'], in: CUE.c},
  {label: 'ASSEMBLY', y: 474, lines: ['add:', '    mov rax, rdi', '    add rax, rsi', '    ret'], in: CUE.asm},
  {label: 'MACHINE CODE', y: 812, lines: [], in: CUE.machine}, // bytes drawn by <Bytes />
];
const codeY = (row: Row) => row.y + 32;
const dotY = (row: Row) => codeY(row) + LH / 2;

const rowOpacity = (frame: number, i: number) => {
  const entry = p(frame, ROWS[i].in, 18);
  const next = ROWS[i + 1];
  const dimmed = next ? interpolate(frame, [next.in, next.in + 18], [1, 0.35], clamp) : 1;
  return entry * dimmed;
};

const Layers: React.FC<{frame: number}> = ({frame}) => {
  const exit = 1 - p(frame, CUE.focusBytes, 25, inOut);
  if (exit <= 0) return null;

  return (
    <AbsoluteFill style={{opacity: exit}}>
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
            <circle key={i} cx={RAIL_X} cy={dotY(row)} r={6 * e} fill={WHITE} opacity={Math.max(rowOpacity(frame, i), 0.25 * e)} />
          );
        })}
      </svg>

      {ROWS.map((row, i) => {
        const entry = p(frame, row.in, 18);
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
            <div style={{fontFamily: SANS, fontSize: 20, lineHeight: '24px', fontWeight: 500, letterSpacing: 5, color: GRAY}}>
              {row.label}
            </div>
            <div style={{marginTop: 8, fontFamily: MONO, fontSize: CODE, lineHeight: `${LH}px`, color: WHITE, whiteSpace: 'pre'}}>
              {row.lines.map((line, j) => {
                const e = i === 2 ? p(frame, row.in + j * 6, 18) : 1;
                return (
                  <div key={j} style={{height: LH, opacity: e, transform: `translateY(${(1 - e) * 10}px)`}}>
                    {line}
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}
    </AbsoluteFill>
  );
};

// the machine code bytes: typed out in part 1, then fly into memory
const Bytes: React.FC<{frame: number}> = ({frame}) => (
  <AbsoluteFill style={{opacity: sceneOpacity(frame)}}>
    {BYTES.map((b, i) => {
      const e = p(frame, CUE.machine + i * 3, 10);
      const t = p(frame, CUE.memory + 20 + i * 4, 32, inOut);
      const x = lerp(TEXT_X + BYTE_TEXT_OFFSET[i] * CW, cellCx(i) - CW, t);
      const y = lerp(codeY(ROWS[3]), cellCy - LH / 2, t) - Math.sin(Math.PI * t) * 40;
      return (
        <div
          key={i}
          style={{
            position: 'absolute',
            left: 0,
            top: 0,
            transform: `translate(${x}px, ${y}px)`,
            fontFamily: MONO,
            fontSize: CODE,
            lineHeight: `${LH}px`,
            color: WHITE,
            opacity: e,
          }}
        >
          {b}
        </div>
      );
    })}
  </AbsoluteFill>
);

// ---------- part 2: memory ----------
const cellLit = (frame: number, i: number) => {
  const k = STEPS.findIndex((st) => st.bytes.includes(i));
  return win(frame, STEPS[k].fetch, nextFetch(k), 10);
};

const Memory: React.FC<{frame: number}> = ({frame}) => {
  if (frame < CUE.memory) return null;
  // draw lit cells last so their white edge sits on top of shared borders
  const order = BYTES.map((_, i) => i).sort((a, b) => cellLit(frame, a) - cellLit(frame, b));
  return (
    <AbsoluteFill style={{opacity: sceneOpacity(frame)}}>
      <svg width={1920} height={1080} style={{position: 'absolute'}}>
        {order.map((i) => (
          <rect
            key={i}
            x={MEM_X + i * CELL_W}
            y={MEM_Y}
            width={CELL_W}
            height={CELL_H}
            fill="none"
            stroke={edge(cellLit(frame, i))}
            strokeWidth={2}
            opacity={p(frame, CUE.memory + i * 3, 16)}
          />
        ))}
      </svg>
      <div
        style={{
          position: 'absolute',
          left: MEM_X - 230,
          width: 200,
          top: cellCy - 12,
          textAlign: 'right',
          fontFamily: SANS,
          fontSize: 20,
          lineHeight: '24px',
          fontWeight: 500,
          letterSpacing: 5,
          color: GRAY,
          opacity: p(frame, CUE.memory, 20),
        }}
      >
        MEMORY
      </div>
      {BYTES.map((_, i) => (
        <div
          key={i}
          style={{
            position: 'absolute',
            left: MEM_X + i * CELL_W,
            width: CELL_W,
            top: MEM_Y + CELL_H + 14,
            textAlign: 'center',
            fontFamily: MONO,
            fontSize: 20,
            color: GRAY,
            opacity: p(frame, CUE.memory + s(2.5) + i * 3, 15),
          }}
        >
          {`0x${(0x1000 + i).toString(16)}`}
        </div>
      ))}
    </AbsoluteFill>
  );
};

// ---------- part 2/3: the CPU ----------
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
            color: v === '?' || v === 'caller' ? GRAY : WHITE,
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

const FLY = 24;
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
  const y = lerp(a.y, b.y, t) - Math.sin(Math.PI * t) * 110;
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
        opacity: Math.min(1, t * 6, (1 - t) * 6),
      }}
    >
      {value}
    </div>
  );
};

type StageName = 'FETCH' | 'DECODE' | 'EXECUTE';
const STAGE_NAMES: StageName[] = ['FETCH', 'DECODE', 'EXECUTE'];
const STAGES: {name: StageName; start: number; end: number; dur: number}[] = [
  // quick spin on "over and over, billions of times a second"
  ...Array.from({length: 9}, (_, k) => ({
    name: STAGE_NAMES[k % 3],
    start: CUE.cycle + s(1.5) + k * 10,
    end: CUE.cycle + s(1.5) + (k + 1) * 10,
    dur: 5,
  })),
  // "fetch an instruction, decode it, execute it"
  ...STAGE_NAMES.map((name, k) => ({name, start: CUE.cycle + s(5) + k * s(1), end: CUE.cycle + s(5) + (k + 1) * s(1), dur: 8})),
  ...STEPS.flatMap((st, k) => [
    {name: 'FETCH' as const, start: st.fetch, end: st.decode, dur: 8},
    {name: 'DECODE' as const, start: st.decode, end: st.exec, dur: 8},
    {name: 'EXECUTE' as const, start: st.exec, end: nextFetch(k), dur: 8},
  ]),
];
const stageLevel = (frame: number, name: StageName) =>
  Math.max(0, ...STAGES.filter((st) => st.name === name).map((st) => win(frame, st.start, st.end, st.dur)));

const RAX_CHANGES = [CUE.args + s(1.5), STEPS[0].fly + FLY, STEPS[1].fly + FLY];
const RIP_CHANGES = STEPS.map((st) => st.ripAt);

const Cpu: React.FC<{frame: number}> = ({frame}) => {
  if (frame < CUE.cpu) return null;
  const boxT = p(frame, CUE.cpu, 36, inOut);
  const regsIn = CUE.cpu + s(2.5);
  const retLit = p(frame, RAX_RETURN, 16);

  const values: Record<string, {values: string[]; changes: number[]}> = {
    rdi: {values: ['', '3'], changes: [CUE.args + s(3)]},
    rsi: {values: ['', '4'], changes: [CUE.args + s(4.2)]},
    rax: {values: ['', '?', '3', '7'], changes: RAX_CHANGES},
  };
  const noteOpacity = (name: string) =>
    name === 'rax' ? retLit : p(frame, values[name].changes[0], 16) * 0.8;
  const pulse = (changes: number[]) =>
    Math.max(0, ...changes.map((c) => interpolate(frame, [c - 2, c + 4, c + 30], [0, 1, 0], clamp)));

  return (
    <AbsoluteFill style={{opacity: sceneOpacity(frame)}}>
      <svg width={1920} height={1080} style={{position: 'absolute'}}>
        <rect
          x={CPU.x}
          y={CPU.y}
          width={CPU.w}
          height={CPU.h}
          rx={18}
          fill="none"
          stroke="#555555"
          strokeWidth={2}
          pathLength={1}
          strokeDasharray={1}
          strokeDashoffset={1 - boxT}
        />
      </svg>
      <div
        style={{
          position: 'absolute',
          left: CPU.x + 32,
          top: CPU.y + 26,
          fontFamily: SANS,
          fontSize: 20,
          fontWeight: 500,
          letterSpacing: 5,
          color: GRAY,
          opacity: p(frame, CUE.cpu + 10, 20),
        }}
      >
        CPU
      </div>

      {/* fetch -> decode -> execute */}
      <div
        style={{
          position: 'absolute',
          right: 1920 - (CPU.x + CPU.w) + 32,
          top: CPU.y + 26,
          display: 'flex',
          gap: 18,
          fontFamily: SANS,
          fontSize: 20,
          fontWeight: 500,
          letterSpacing: 5,
          color: WHITE,
          opacity: p(frame, CUE.cycle, 20),
        }}
      >
        {STAGE_NAMES.map((name, k) => (
          <React.Fragment key={name}>
            {k > 0 && <span style={{opacity: 0.3}}>→</span>}
            <span style={{opacity: 0.3 + 0.7 * stageLevel(frame, name)}}>{name}</span>
          </React.Fragment>
        ))}
      </div>

      {/* registers */}
      {REGS.map((reg, i) => {
        const e = p(frame, regsIn + i * 6, 20);
        const v = values[reg.name];
        const lit = Math.max(pulse(v.changes.slice(1)), reg.name === 'rax' ? retLit : 0);
        return (
          <div key={reg.name} style={{opacity: e, transform: `translateY(${(1 - e) * 14}px)`}}>
            <div
              style={{
                position: 'absolute',
                left: reg.x,
                top: REG_Y,
                width: REG_W,
                height: REG_H,
                boxSizing: 'border-box',
                border: `2px solid ${edge(lit)}`,
                borderRadius: 10,
                fontFamily: MONO,
                fontSize: 56,
                overflow: 'hidden',
              }}
            >
              <RollingValue frame={frame} values={v.values} changes={v.changes} />
            </div>
            <div
              style={{
                position: 'absolute',
                left: reg.x,
                width: REG_W,
                top: REG_Y + REG_H + 18,
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
                width: REG_W + 100,
                top: REG_Y + REG_H + 64,
                textAlign: 'center',
                fontFamily: SANS,
                fontSize: 24,
                color: GRAY,
                opacity: noteOpacity(reg.name),
              }}
            >
              {reg.note}
            </div>
          </div>
        );
      })}
      <div
        style={{
          position: 'absolute',
          left: REGS[0].x,
          width: REGS[2].x + REG_W - REGS[0].x,
          top: REG_Y + REG_H + 120,
          textAlign: 'center',
          fontFamily: SANS,
          fontSize: 22,
          color: GRAY,
          opacity: p(frame, CUE.cpu + s(6.5), 20) * 0.7,
        }}
      >
        + 13 more registers
      </div>

      {/* instruction pointer */}
      <div style={{opacity: p(frame, CUE.rip, 20), transform: `translateY(${(1 - p(frame, CUE.rip, 20)) * 14}px)`}}>
        <div
          style={{
            position: 'absolute',
            left: RIP.x,
            top: RIP.y,
            width: RIP.w,
            height: RIP.h,
            boxSizing: 'border-box',
            border: `2px solid ${edge(pulse(RIP_CHANGES))}`,
            borderRadius: 10,
            fontFamily: MONO,
            fontSize: 34,
            overflow: 'hidden',
          }}
        >
          <RollingValue frame={frame} values={['0x1000', '0x1003', '0x1006', 'caller']} changes={RIP_CHANGES} />
        </div>
        <div
          style={{
            position: 'absolute',
            left: RIP.x,
            width: RIP.w,
            top: RIP.y + RIP.h + 14,
            textAlign: 'center',
            fontFamily: MONO,
            fontSize: 26,
            color: WHITE,
          }}
        >
          rip
        </div>
      </div>

      <div
        style={{
          position: 'absolute',
          left: INSTR_CX - 200,
          width: 400,
          top: INSTR_Y - 44,
          textAlign: 'center',
          fontFamily: SANS,
          fontSize: 20,
          fontWeight: 500,
          letterSpacing: 5,
          color: GRAY,
          opacity: p(frame, STEPS[0].fetch - 15, 20),
        }}
      >
        INSTRUCTION
      </div>

      <FlyingValue frame={frame} value="3" from={0} to={2} start={STEPS[0].fly} />
      <FlyingValue frame={frame} value="4" from={1} to={2} start={STEPS[1].fly} />
    </AbsoluteFill>
  );
};

// the wire from rip down to the byte it points at
const Pointer: React.FC<{frame: number}> = ({frame}) => {
  const draw = p(frame, CUE.rip + 10, 22, inOut);
  if (draw <= 0) return null;
  const [r0, r1] = RIP_CHANGES;
  const x = interpolate(frame, [r0, r0 + 16, r1, r1 + 16], [cellCx(0), cellCx(3), cellCx(3), cellCx(6)], {
    ...clamp,
    easing: inOut,
  });
  const from = {x: RIP.x + RIP.w / 2, y: CPU.y + CPU.h};
  const to = {x, y: MEM_Y - 22};
  const opacity = sceneOpacity(frame) * (1 - p(frame, RIP_CHANGES[2], 15));
  return (
    <svg width={1920} height={1080} style={{position: 'absolute', opacity}}>
      <line x1={from.x} y1={from.y} x2={lerp(from.x, to.x, draw)} y2={lerp(from.y, to.y, draw)} stroke="#666666" strokeWidth={2} />
      <polygon
        points={`${x - 10},${MEM_Y - 22} ${x + 10},${MEM_Y - 22} ${x},${MEM_Y - 8}`}
        fill={WHITE}
        opacity={p(frame, CUE.rip + 26, 10)}
      />
    </svg>
  );
};

// ---------- part 3: fetch + decode ----------
const POS_ANATOMY = {x: 960 - STEPS[0].text.length * CW, y: 470 - LH, s: 2};
const decodePos = (text: string) => ({x: INSTR_CX - (text.length * CW) / 2, y: INSTR_Y, s: 1});

const Instructions: React.FC<{frame: number}> = ({frame}) => {
  const scene = sceneOpacity(frame);
  const wrapFade = 1 - p(frame, CUE.wrap, 25, inOut);
  return (
    <AbsoluteFill>
      {STEPS.map((st, k) => {
        if (frame < st.fetch) return null;
        const decoded = p(frame, st.decode, 12);
        const bytesText = st.bytes.map((b) => BYTES[b]).join(' ');
        const bytesX = INSTR_CX - (bytesText.length * CW) / 2;

        // decoded text: the first one also zooms out for the anatomy beat
        const textIn = p(frame, st.decode + 4, 14);
        const textOut = p(frame, nextFetch(k), 10);
        const base = decodePos(st.text);
        const z = k === 0 ? p(frame, CUE.anatomy, 30, inOut) * (1 - p(frame, CUE.anatomyEnd, 30, inOut)) : 0;
        const tx = lerp(base.x, POS_ANATOMY.x, z);
        const ty = lerp(base.y, POS_ANATOMY.y, z) + (1 - textIn) * 12;
        const ts = lerp(base.s, POS_ANATOMY.s, z);
        const textOpacity = textIn * (1 - textOut) * (k === 0 ? wrapFade : scene);

        return (
          <React.Fragment key={k}>
            {st.bytes.map((b, j) => {
              const t = p(frame, st.fetch + j * 4, 26, inOut);
              const x = lerp(cellCx(b), bytesX + (j * 3 + 1) * CW, t);
              const y = lerp(cellCy, INSTR_Y + LH / 2, t);
              return (
                <div
                  key={j}
                  style={{
                    position: 'absolute',
                    left: x - 40,
                    top: y - LH / 2,
                    width: 80,
                    textAlign: 'center',
                    fontFamily: MONO,
                    fontSize: CODE,
                    lineHeight: `${LH}px`,
                    color: WHITE,
                    opacity: Math.min(1, t * 4) * (1 - decoded) * scene,
                    transform: `scale(${1 - decoded * 0.15})`,
                  }}
                >
                  {BYTES[b]}
                </div>
              );
            })}
            <div
              style={{
                position: 'absolute',
                left: 0,
                top: 0,
                transformOrigin: '0 0',
                transform: `translate(${tx}px, ${ty}px) scale(${ts})`,
                fontFamily: MONO,
                fontSize: CODE,
                lineHeight: `${LH}px`,
                color: WHITE,
                whiteSpace: 'pre',
                opacity: textOpacity,
              }}
            >
              {st.text}
            </div>
          </React.Fragment>
        );
      })}
    </AbsoluteFill>
  );
};

// ---------- part 3: instruction anatomy ----------
const tokenX = (charCenter: number) => POS_ANATOMY.x + charCenter * CW * POS_ANATOMY.s;
const A = CUE.anatomy;
const PARTS = [
  {label: 'instruction', x: tokenX(1.5), at: A + s(1.8)},
  {label: 'destination', x: tokenX(5.5), at: A + s(4.8)},
  {label: 'source', x: tokenX(10.5), at: A + s(6.2)},
];
const COPY_AT = A + s(3.3); // "mov means copy"
const ARROW_AT = A + s(7.3);

const Anatomy: React.FC<{frame: number}> = ({frame}) => {
  const fadeOut = 1 - p(frame, CUE.anatomyEnd - 12, 14, inOut);
  if (frame < PARTS[0].at || fadeOut <= 0) return null;

  const arrowT = p(frame, ARROW_AT, 24, inOut);
  const from = {x: PARTS[2].x, y: 425};
  const to = {x: PARTS[1].x, y: 425};
  const c1 = {x: from.x - 50, y: 340};
  const c2 = {x: to.x + 50, y: 340};
  // arrowhead points along the final tangent (c2 -> to)
  const len = Math.hypot(to.x - c2.x, to.y - c2.y);
  const ux = (to.x - c2.x) / len;
  const uy = (to.y - c2.y) / len;
  const wing = (a: number) => {
    const bx = -ux * Math.cos(a) + uy * Math.sin(a);
    const by = -uy * Math.cos(a) - ux * Math.sin(a);
    return `${to.x + bx * 18},${to.y + by * 18}`;
  };
  const copyT = p(frame, COPY_AT, 16);

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
          opacity={p(frame, ARROW_AT + 18, 8) * 0.9}
        />
        {PARTS.map((part, i) => {
          const t = p(frame, part.at, 16);
          return <line key={i} x1={part.x} x2={part.x} y1={542} y2={lerp(542, 570, t)} stroke={GRAY} strokeWidth={2} opacity={t} />;
        })}
      </svg>
      {PARTS.map((part) => {
        const t = p(frame, part.at, 16);
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
              opacity: t * 0.85,
              transform: `translateY(${(1 - t) * 10}px)`,
            }}
          >
            {part.label}
          </div>
        );
      })}
      <div
        style={{
          position: 'absolute',
          left: PARTS[0].x - 200,
          width: 400,
          top: 630,
          textAlign: 'center',
          fontFamily: SANS,
          fontSize: 24,
          color: GRAY,
          opacity: copyT,
          transform: `translateY(${(1 - copyT) * 8}px)`,
        }}
      >
        = copy
      </div>
    </AbsoluteFill>
  );
};

// ---------- part 4: wrap ----------
const LISTING = ['add:', '    mov rax, rdi', '    add rax, rsi', '    ret'];
const Wrap: React.FC<{frame: number}> = ({frame}) => {
  if (frame < CUE.wrap) return null;
  const x = 960 - (16 * CW) / 2;
  const top = 540 - (LISTING.length * LH) / 2;
  return (
    <AbsoluteFill>
      {LISTING.map((line, j) => {
        const e = p(frame, CUE.wrap + 20 + j * 6, 22);
        return (
          <div
            key={j}
            style={{
              position: 'absolute',
              left: x,
              top: top + j * LH,
              fontFamily: MONO,
              fontSize: CODE,
              lineHeight: `${LH}px`,
              color: WHITE,
              whiteSpace: 'pre',
              opacity: e,
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
      <Memory frame={frame} />
      <Cpu frame={frame} />
      <Pointer frame={frame} />
      <Bytes frame={frame} />
      <Instructions frame={frame} />
      <Anatomy frame={frame} />
      <Wrap frame={frame} />
    </AbsoluteFill>
  );
};
