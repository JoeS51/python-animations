import React from 'react';
import {AbsoluteFill, Easing, interpolate, useCurrentFrame} from 'remotion';
import {ELEPHANT} from './elephant';

const BLACK = '#000000';
const WHITE = '#ffffff';
const GRAY = '#8c8c8c';
const MONO = '"JetBrains Mono", ui-monospace, monospace';
const SANS = '"Inter Variable", Inter, system-ui, sans-serif';

const QUERY = 36;
const CW = QUERY * 0.6; // JetBrains Mono advance width is 0.6em

const out = Easing.bezier(0.33, 1, 0.68, 1);
const inOut = Easing.bezier(0.65, 0, 0.35, 1);
const linear = (t: number) => t;
const clamp = {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'} as const;

const p = (frame: number, start: number, dur: number, easing = out) =>
  interpolate(frame, [start, start + dur], [0, 1], {...clamp, easing});
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
// 0 -> 1 at `start`, back to 0 at `end`
const win = (frame: number, start: number, end: number, dur = 10) => p(frame, start, dur) - p(frame, end, dur);
const pulse = (frame: number, at: number) => interpolate(frame, [at - 2, at + 4, at + 26], [0, 1, 0], clamp);
const gray = (v: number) => {
  const c = Math.round(Math.min(255, Math.max(0, v)));
  return `rgb(${c},${c},${c})`;
};

// ---------- cue sheet (seconds -> frames) ----------
// No audio: each beat gets enough screen time to read. Retime here.
const FPS = 30;
const s = (sec: number) => Math.round(sec * FPS);

const CUE = {
  title: s(0.2), // elephant + title card
  table: s(3.6), // the table fades in
  update: s(6.2), // UPDATE types out
  newRow: s(7.8), // new version appended...
  kill: s(8.2), // ...and the old one grays out
  burst: s(11), // updates pile up dead rows
  scan: s(14.4), // SELECT wades through all of them
  vacuum: s(18.6), // VACUUM types out
  sweep: s(19.4), // dead rows become free space
  insert: s(23), // INSERT reuses a free slot
  wrap: s(26), // what VACUUM did
  fade: s(29.1),
  end: s(30),
};
const SCAN_START = CUE.scan + s(0.8);
const SCAN_DUR = s(3);
const SWEEP_DUR = s(3);
const ERIN_LAND = CUE.insert + s(1.2);
// the burst starts slow enough to read, then speeds up
const BURST_GAPS = [0.6, 0.5, 0.4, 0.3, 0.25, 0.25, 0.25];

export const DURATION = CUE.end;

// ---------- the tuples ----------
// Every row version ever written gets its own slot. An UPDATE appends a new
// version -- it never edits in place -- and the old version is left behind, dead.
type Tuple = {id: number; name: string; born: number; dies?: number};
const TUPLES: Tuple[] = ['alice', 'bob', 'carol', 'dave'].map((name, i) => ({id: i + 1, name, born: CUE.table + s(0.25) * i}));
const LIVE: Record<number, number> = {1: 0, 2: 1, 3: 2, 4: 3};

const update = (id: number, name: string, kill: number, born: number) => {
  TUPLES[LIVE[id]].dies = kill;
  TUPLES.push({id, name, born});
  LIVE[id] = TUPLES.length - 1;
};

update(1, 'ally', CUE.kill, CUE.newRow);
const BURST: [number, string][] = [
  [2, 'bobby'],
  [3, 'cara'],
  [1, 'al'],
  [4, 'dan'],
  [2, 'rob'],
  [3, 'cat'],
  [1, 'alex'],
  [4, 'davy'],
];
const BURST_AT = BURST.map((_, k) => CUE.burst + s(BURST_GAPS.slice(0, k).reduce((a, b) => a + b, 0)));
BURST.forEach(([id, name], k) => update(id, name, BURST_AT[k] + 3, BURST_AT[k] + 6));

type Query = {text: string; at: number; type: number; burst?: boolean};
const QUERIES: Query[] = [
  {text: "UPDATE users SET name = 'ally' WHERE id = 1;", at: CUE.update, type: s(1.2)},
  {text: 'UPDATE users SET name = …;', at: CUE.burst - s(0.8), type: s(0.5), burst: true},
  {text: 'SELECT * FROM users;', at: CUE.scan, type: s(0.5)},
  {text: 'VACUUM users;', at: CUE.vacuum, type: s(0.5)},
  {text: "INSERT INTO users VALUES (5, 'erin');", at: CUE.insert, type: s(1)},
];

// ---------- layout ----------
// Coordinates are relative to the content block, which is re-centered vertically as the table grows.
const ROW_W = 520;
const ROW_H = 48;
const PITCH = 58;
const TABLE_X = 960 - ROW_W / 2;
const QUERY_Y = 0;
const TABLE_Y = 156;
const rowY = (i: number) => TABLE_Y + i * PITCH;
const TABLE_BOTTOM = rowY(TUPLES.length - 1) + ROW_H;
const NEVER = 1e6;

// the "camera": keep query + table centered, easing as rows are added
const blockOffset = (frame: number) => {
  const rows = Math.max(
    4,
    TUPLES.reduce((n, t) => n + p(frame, t.born, 24, inOut), 0),
  );
  return (1080 - (TABLE_Y + rows * PITCH - (PITCH - ROW_H))) / 2;
};

// when a horizontal line moving from the table's top to bottom crosses a row's middle
const crossAt = (start: number, dur: number, i: number) =>
  start + ((rowY(i) + ROW_H / 2 - (TABLE_Y - 12)) / (TABLE_BOTTOM + 12 - (TABLE_Y - 12))) * dur;
const freeAt = (i: number) => (TUPLES[i].dies !== undefined ? crossAt(CUE.sweep, SWEEP_DUR, i) : NEVER);
const scanAt = (i: number) => crossAt(SCAN_START, SCAN_DUR, i);
const isDead = (i: number, frame: number) => TUPLES[i].dies !== undefined && TUPLES[i].dies! <= frame;

const deadCount = (frame: number) => TUPLES.filter((_, i) => isDead(i, frame) && freeAt(i) > frame).length;
// frames at which the dead count changes
const COUNT_CHANGES = TUPLES.flatMap((t, i) => (t.dies !== undefined ? [t.dies, freeAt(i)] : []));

const label: React.CSSProperties = {fontFamily: SANS, fontSize: 20, lineHeight: '24px', fontWeight: 500, letterSpacing: 5, color: GRAY};

// a number that rolls in each time it changes
const Ticker: React.FC<{frame: number; value: number; changes: number[]; style: React.CSSProperties}> = ({
  frame,
  value,
  changes,
  style,
}) => {
  const last = Math.max(0, ...changes.filter((c) => c <= frame));
  const e = p(frame, last, 8);
  return <div style={{...style, opacity: e, transform: `translateY(${(1 - e) * -16}px)`}}>{value}</div>;
};

// ---------- title card ----------
const ART = 11; // px per character row of the elephant
// glyphs from faint to dense; every character in the art is on this ramp
const RAMP = '.:^~!7?J' + 'Y5PGB#&@';
const hash = (i: number, j: number) => {
  const x = Math.sin(i * 127.1 + j * 311.7) * 43758.5453;
  return x - Math.floor(x);
};
const DEVELOP_AT = CUE.title;
const DEVELOP_DUR = s(1.3);
const TEXT_AT = CUE.title + s(1.4); // title text cuts in once the elephant has developed
const ASIDE_AT = TEXT_AT + s(0.8); // a beat later, the aside cuts in too
const TITLE_END = CUE.table - 3; // hard cut to the table

// each character climbs the density ramp until it reaches its own glyph, like a photo developing
const develop = (line: string, k: number, t: number) =>
  [...line]
    .map((c, j) => {
      if (c === ' ') return c;
      const step = Math.floor((t * 1.35 - hash(k, j) * 0.35) * RAMP.length);
      if (step < 0) return ' ';
      return RAMP[Math.min(step, RAMP.indexOf(c))];
    })
    .join('');

const Title: React.FC<{frame: number}> = ({frame}) => {
  if (frame >= TITLE_END) return null;
  const t = p(frame, DEVELOP_AT, DEVELOP_DUR, linear);
  const textOn = frame >= TEXT_AT;
  return (
    <AbsoluteFill style={{alignItems: 'center', justifyContent: 'center'}}>
      <div style={{fontFamily: MONO, fontSize: ART, lineHeight: `${ART}px`, color: WHITE, whiteSpace: 'pre'}}>
        {ELEPHANT.map((line, k) => (
          <div key={k} style={{height: ART}}>
            {develop(line, k, t)}
          </div>
        ))}
      </div>
      <div style={{marginTop: 36, fontFamily: MONO, fontSize: 96, lineHeight: '112px', color: WHITE, opacity: textOn ? 1 : 0}}>
        VACUUM
      </div>
      <div style={{fontFamily: MONO, fontSize: 28, lineHeight: '36px', color: GRAY, marginTop: 10, opacity: textOn ? 1 : 0}}>
        in postgres
      </div>
      <div style={{fontFamily: MONO, fontSize: 18, lineHeight: '24px', color: GRAY, marginTop: 28, opacity: frame >= ASIDE_AT ? 1 : 0}}>
        (the simple version)
      </div>
    </AbsoluteFill>
  );
};

// ---------- the query line ----------
const QueryLine: React.FC<{frame: number}> = ({frame}) => (
  <AbsoluteFill style={{opacity: 1 - p(frame, CUE.wrap, 15)}}>
    {QUERIES.map((q, k) => {
      const next = QUERIES[k + 1]?.at ?? CUE.wrap;
      if (frame < q.at || frame >= next + 6) return null;
      const shown = Math.floor(q.text.length * p(frame, q.at, q.type, linear));
      const typing = shown < q.text.length;
      const cursor = typing || Math.floor((frame - q.at) / 15) % 2 === 0;
      const runs = q.burst ? BURST_AT.filter((t) => t <= frame).length : 0;
      return (
        <div
          key={k}
          style={{
            position: 'absolute',
            left: 960 - (q.text.length * CW) / 2,
            top: QUERY_Y,
            fontFamily: MONO,
            fontSize: QUERY,
            lineHeight: '48px',
            color: WHITE,
            whiteSpace: 'pre',
            opacity: 1 - p(frame, next, 6),
          }}
        >
          {q.text.slice(0, shown)}
          {q.burst ? (
            <span style={{position: 'absolute', left: q.text.length * CW + 28, top: 0, color: GRAY, opacity: p(frame, BURST_AT[0], 8)}}>
              <span>× </span>
              <Ticker frame={frame} value={runs} changes={BURST_AT} style={{display: 'inline-block', color: WHITE}} />
            </span>
          ) : (
            <span style={{opacity: cursor && frame < next ? 0.8 : 0}}>▌</span>
          )}
        </div>
      );
    })}
  </AbsoluteFill>
);

// "13 rows read · 4 visible" while the SELECT scans
const ScanReadout: React.FC<{frame: number}> = ({frame}) => {
  const o = win(frame, SCAN_START, CUE.vacuum, 12);
  if (o <= 0) return null;
  const crossed = TUPLES.map((_, i) => i).filter((i) => scanAt(i) <= frame);
  const visible = crossed.filter((i) => !isDead(i, frame)).length;
  return (
    <div
      style={{
        position: 'absolute',
        left: 0,
        width: 1920,
        top: QUERY_Y + 58,
        textAlign: 'center',
        fontFamily: SANS,
        fontSize: 26,
        color: GRAY,
        opacity: o,
      }}
    >
      <span style={{fontFamily: MONO, color: WHITE}}>{crossed.length}</span> rows read
      <span style={{margin: '0 18px', opacity: 0.5}}>·</span>
      <span style={{fontFamily: MONO, color: WHITE}}>{visible}</span> visible
    </div>
  );
};

// ---------- the table ----------
const Table: React.FC<{frame: number}> = ({frame}) => {
  const erinIn = p(frame, ERIN_LAND, 14);
  const scanY = interpolate(frame, [SCAN_START, SCAN_START + SCAN_DUR], [TABLE_Y - 12, TABLE_BOTTOM + 12], {...clamp, easing: linear});
  const scanOpacity = win(frame, SCAN_START - 6, SCAN_START + SCAN_DUR, 8);
  const sweepY = interpolate(frame, [CUE.sweep, CUE.sweep + SWEEP_DUR], [TABLE_Y - 12, TABLE_BOTTOM + 12], {...clamp, easing: linear});
  const sweepOpacity = win(frame, CUE.sweep - 6, CUE.sweep + SWEEP_DUR, 8);

  return (
    <AbsoluteFill>
      <div style={{...label, position: 'absolute', left: TABLE_X, top: TABLE_Y - 44, opacity: p(frame, CUE.table, 20)}}>USERS</div>

      <svg width={1920} height={1600} style={{position: 'absolute', overflow: 'visible'}}>
        {TUPLES.map((t, i) => {
          const inT = p(frame, t.born, 14);
          const deadT = t.dies !== undefined ? p(frame, t.dies, 12) : 0;
          const freeT = p(frame, freeAt(i), 12);
          const lit = Math.max(
            i >= 4 ? pulse(frame, t.born) : 0,
            pulse(frame, scanAt(i)) * (isDead(i, frame) ? 1 : 0.5),
            freeT < 1 ? pulse(frame, freeAt(i)) : 0,
            i === 0 ? pulse(frame, ERIN_LAND) : 0,
          );
          const base = lerp(0x66, 0x33, deadT);
          const y = rowY(i) + (1 - inT) * 14;
          return (
            <g key={i} opacity={inT}>
              <rect
                x={TABLE_X}
                y={y}
                width={ROW_W}
                height={ROW_H}
                rx={8}
                fill="none"
                stroke={gray(lerp(base, 255, lit))}
                strokeWidth={2}
                opacity={Math.max(1 - freeT, i === 0 ? erinIn : 0)}
              />
              <rect
                x={TABLE_X + 4}
                y={y + 3}
                width={ROW_W - 8}
                height={ROW_H - 6}
                rx={6}
                fill="none"
                stroke="#3c3c3c"
                strokeWidth={2}
                strokeDasharray="6 10"
                opacity={freeT * (i === 0 ? 1 - erinIn : 1)}
              />
              {/* strike-through on dead versions */}
              <line
                x1={TABLE_X + 24}
                x2={TABLE_X + 24 + (ROW_W - 48) * deadT}
                y1={y + ROW_H / 2}
                y2={y + ROW_H / 2}
                stroke="#666666"
                strokeWidth={2}
                opacity={deadT > 0 ? 1 - freeT : 0}
              />
            </g>
          );
        })}
        <line x1={TABLE_X - 50} x2={TABLE_X + ROW_W + 50} y1={scanY} y2={scanY} stroke={WHITE} strokeWidth={2} opacity={scanOpacity * 0.6} />
        <line x1={TABLE_X - 50} x2={TABLE_X + ROW_W + 50} y1={sweepY} y2={sweepY} stroke={WHITE} strokeWidth={3} opacity={sweepOpacity} />
      </svg>

      {TUPLES.map((t, i) => {
        const inT = p(frame, t.born, 14);
        const deadT = t.dies !== undefined ? p(frame, t.dies, 12) : 0;
        const freeT = p(frame, freeAt(i), 12);
        const y = rowY(i) + (1 - inT) * 14;
        return (
          <React.Fragment key={i}>
            <Cells y={y} id={t.id} name={t.name} color={gray(lerp(255, 0x5a, deadT))} opacity={inT * (1 - freeT)} />
            <div
              style={{
                position: 'absolute',
                left: TABLE_X,
                width: ROW_W,
                top: y,
                height: ROW_H,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontFamily: SANS,
                fontSize: 22,
                color: '#666666',
                opacity: p(frame, freeAt(i) + 8, 12) * (i === 0 ? 1 - erinIn : 1),
              }}
            >
              free
            </div>
          </React.Fragment>
        );
      })}

      {/* only the first old version is labelled; the counter takes over from there */}
      <div
        style={{
          position: 'absolute',
          left: TABLE_X + ROW_W + 28,
          top: rowY(0),
          height: ROW_H,
          display: 'flex',
          alignItems: 'center',
          fontFamily: SANS,
          fontSize: 24,
          color: GRAY,
          opacity: win(frame, CUE.kill + 4, CUE.burst - s(0.3), 14),
        }}
      >
        old version
      </div>

      {/* the INSERT lands in the first free slot instead of growing the table */}
      <Cells y={rowY(0) - (1 - erinIn) * 40} id={5} name="erin" color={WHITE} opacity={erinIn} />
    </AbsoluteFill>
  );
};

const Cells: React.FC<{y: number; id: number; name: string; color: string; opacity: number}> = ({y, id, name, color, opacity}) => (
  <div
    style={{
      position: 'absolute',
      left: TABLE_X + 32,
      top: y,
      height: ROW_H,
      display: 'flex',
      alignItems: 'center',
      fontFamily: MONO,
      fontSize: 28,
      color,
      opacity,
      whiteSpace: 'pre',
    }}
  >
    <span style={{width: 90, display: 'inline-block'}}>{id}</span>
    {name}
  </div>
);

// ---------- dead row counter ----------
// takes the place of the single "dead" label, to the right of the table
const Counter: React.FC<{frame: number}> = ({frame}) => {
  const e = p(frame, CUE.burst - s(0.3), 18);
  return (
    <div
      style={{
        position: 'absolute',
        left: TABLE_X + ROW_W + 28,
        top: rowY(0) - 2,
        opacity: e,
        transform: `translateX(${(1 - e) * 12}px)`,
      }}
    >
      <div style={label}>DEAD ROWS</div>
      <Ticker
        frame={frame}
        value={deadCount(frame)}
        changes={COUNT_CHANGES}
        style={{marginTop: 10, fontFamily: MONO, fontSize: 72, lineHeight: '84px', color: WHITE}}
      />
    </div>
  );
};

// ---------- wrap ----------
// spell out what just happened
const WRAP_LINES = [
  {
    at: CUE.wrap,
    top: QUERY_Y,
    size: 38,
    color: WHITE,
    content: (
      <>
        <span style={{fontFamily: MONO}}>VACUUM</span> cleans up dead rows so their space can be reused
      </>
    ),
  },
];

const Wrap: React.FC<{frame: number}> = ({frame}) => (
  <>
    {WRAP_LINES.map((line, k) => {
      const e = p(frame, line.at + 10, 22);
      return (
        <div
          key={k}
          style={{
            position: 'absolute',
            left: 0,
            width: 1920,
            top: line.top,
            lineHeight: `${line.size + 12}px`,
            textAlign: 'center',
            fontFamily: SANS,
            fontSize: line.size,
            color: line.color,
            opacity: e,
            transform: `translateY(${(1 - e) * 10}px)`,
          }}
        >
          {line.content}
        </div>
      );
    })}
  </>
);

export const VacuumIntro: React.FC = () => {
  const frame = useCurrentFrame();
  return (
    <AbsoluteFill style={{backgroundColor: BLACK}}>
      <Title frame={frame} />
      <AbsoluteFill style={{opacity: 1 - p(frame, CUE.fade, 30, inOut), transform: `translateY(${blockOffset(frame)}px)`}}>
        <QueryLine frame={frame} />
        <ScanReadout frame={frame} />
        <Table frame={frame} />
        <Counter frame={frame} />
        <Wrap frame={frame} />
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
