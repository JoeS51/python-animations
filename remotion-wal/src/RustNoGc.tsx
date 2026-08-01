import React from 'react';
import {AbsoluteFill, interpolate, useCurrentFrame} from 'remotion';

const BLACK = '#010403';
const PANEL = '#020705';
const CAPTION = '#07110b';
const GRID = '#12331f';
const MUTED = '#3c7650';
const GREEN = '#00d968';
const MINT = '#8cebad';
const WHITE = '#eaf5ec';
const TEXT_DIM = '#73917c';
const MONO = 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace';
const clamp = {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'} as const;

const linear = (frame: number, start: number, duration: number) =>
  interpolate(frame, [start, start + duration], [0, 1], clamp);

const stepped = (frame: number, start: number, duration: number, steps: number) =>
  Math.floor(linear(frame, start, duration) * steps) / steps;

const range = (length: number) => Array.from({length}, (_, index) => index);

const Tile: React.FC<{
  index: number;
  title: string;
  description: string;
  active: boolean;
  children: React.ReactNode;
}> = ({index, title, description, active, children}) => (
  <div
    style={{
      position: 'relative',
      width: 540,
      height: 480,
      overflow: 'hidden',
      backgroundColor: PANEL,
      borderRight: `1px solid ${GRID}`,
      borderBottom: `1px solid ${GRID}`,
      boxSizing: 'border-box',
      fontFamily: MONO,
    }}
  >
    <div
      style={{
        position: 'absolute',
        inset: '0 0 110px 0',
        overflow: 'hidden',
        opacity: active ? 1 : 0.82,
      }}
    >
      {children}
    </div>
    <div
      style={{
        position: 'absolute',
        left: 0,
        right: 0,
        bottom: 0,
        height: 110,
        backgroundColor: active ? '#09170f' : CAPTION,
        borderTop: `1px solid ${GRID}`,
        padding: '17px 20px',
        boxSizing: 'border-box',
      }}
    >
      <div style={{display: 'flex', alignItems: 'center', gap: 15}}>
        <span style={{fontSize: 13, color: active ? GREEN : MUTED}}>{String(index).padStart(2, '0')}</span>
        <span style={{fontSize: 15, color: active ? WHITE : MINT, letterSpacing: 2.3}}>{title}</span>
        <div
          style={{
            marginLeft: 'auto',
            width: active ? 36 : 9,
            height: 4,
            backgroundColor: active ? GREEN : GRID,
          }}
        />
      </div>
      <div style={{marginTop: 11, fontSize: 12, lineHeight: 1.45, color: TEXT_DIM, letterSpacing: 0.4}}>
        {description}
      </div>
    </div>
  </div>
);

const DotField: React.FC<{columns: number; rows: number; bright?: (x: number, y: number) => boolean}> = ({
  columns,
  rows,
  bright,
}) => (
  <div
    style={{
      position: 'absolute',
      width: columns * 24,
      display: 'grid',
      gridTemplateColumns: `repeat(${columns}, 1fr)`,
      gap: 9,
    }}
  >
    {range(columns * rows).map((index) => {
      const x = index % columns;
      const y = Math.floor(index / columns);
      const lit = bright?.(x, y) ?? false;
      return (
        <div
          key={index}
          style={{
            width: 4,
            height: 4,
            backgroundColor: lit ? GREEN : GRID,
            boxShadow: lit ? `0 0 7px ${GREEN}` : 'none',
          }}
        />
      );
    })}
  </div>
);

const OwnerRegister: React.FC<{frame: number}> = ({frame}) => {
  const move = stepped(frame, 64, 42, 10);
  const x = interpolate(move, [0, 1], [118, 382]);
  const moved = frame >= 106;
  return (
    <>
      <div style={{position: 'absolute', left: 60, top: 50, color: MUTED, fontSize: 15}}>OWNERSHIP / 01</div>
      {[105, 369].map((left, index) => (
        <div key={left} style={{position: 'absolute', left, top: 126, width: 66, height: 66}}>
          <div style={{position: 'absolute', inset: 0, border: `1px solid ${index === 1 && moved ? GREEN : MUTED}`}} />
          <div style={{position: 'absolute', top: -31, left: 26, color: index === 1 && moved ? WHITE : MUTED}}>
            {index === 0 ? 'A' : 'B'}
          </div>
          {index === 0 && moved ? (
            <>
              <div style={{position: 'absolute', left: -8, top: 31, width: 82, borderTop: `2px solid ${WHITE}`, transform: 'rotate(45deg)'}} />
              <div style={{position: 'absolute', left: -8, top: 31, width: 82, borderTop: `2px solid ${WHITE}`, transform: 'rotate(-45deg)'}} />
            </>
          ) : null}
        </div>
      ))}
      <div
        style={{
          position: 'absolute',
          left: x,
          top: 139,
          width: 40,
          height: 40,
          backgroundColor: GREEN,
          boxShadow: `0 0 14px ${GREEN}`,
        }}
      />
      <div style={{position: 'absolute', left: 70, right: 70, top: 268, borderTop: `1px dashed ${MUTED}`}} />
      <div style={{position: 'absolute', left: x + 19, top: 179, height: 88, borderLeft: `2px solid ${GREEN}`}} />
      <div style={{position: 'absolute', left: 64, bottom: 26, color: MINT, fontSize: 14, letterSpacing: 4}}>
        {moved ? 'A:INVALID  B:OWNER' : 'A:OWNER    B:EMPTY'}
      </div>
    </>
  );
};

const HeapMap: React.FC<{frame: number}> = ({frame}) => {
  const created = stepped(frame, 18, 32, 8);
  const freed = stepped(frame, 214, 24, 8);
  const remaining = Math.round(72 * created * (1 - freed));
  return (
    <>
      <div style={{position: 'absolute', left: 42, top: 37, fontSize: 13, color: MUTED, letterSpacing: 3}}>
        0X00A0 — 0X00E8
      </div>
      <div
        style={{
          position: 'absolute',
          left: 43,
          top: 78,
          width: 448,
          display: 'grid',
          gridTemplateColumns: 'repeat(12, 1fr)',
          gap: 5,
        }}
      >
        {range(72).map((index) => {
          const filled = index < remaining;
          return (
            <div
              key={index}
              style={{
                height: 33,
                backgroundColor: filled ? (index % 7 === 0 ? WHITE : index % 3 === 0 ? MINT : GREEN) : BLACK,
                border: `1px solid ${filled ? 'transparent' : GRID}`,
                color: filled ? BLACK : MUTED,
                fontSize: 10,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              {filled ? ((index * 7 + 3) % 16).toString(16).toUpperCase() : '·'}
            </div>
          );
        })}
      </div>
      <div style={{position: 'absolute', right: 44, bottom: 25, color: remaining ? GREEN : WHITE, fontSize: 14}}>
        CELLS:{String(remaining).padStart(2, '0')}
      </div>
    </>
  );
};

const MoveTrace: React.FC<{frame: number}> = ({frame}) => {
  const move = stepped(frame, 64, 42, 14);
  const head = Math.round(move * 13);
  return (
    <>
      <div style={{position: 'absolute', left: 32, top: 52, color: MUTED, fontSize: 13}}>
        REGISTER TRANSFER
      </div>
      <div style={{position: 'absolute', left: 32, right: 32, top: 184, borderTop: `1px dashed ${MUTED}`}} />
      <div style={{position: 'absolute', left: 34, top: 156, display: 'grid', gridTemplateColumns: 'repeat(15, 29px)', gap: 2}}>
        {range(15).map((index) => (
          <div
            key={index}
            style={{
              width: 25,
              height: 50,
              backgroundColor: index === head ? WHITE : index < head ? GREEN : GRID,
              opacity: index < head - 4 ? 0.34 : 1,
            }}
          />
        ))}
      </div>
      <div style={{position: 'absolute', left: 34, top: 252, color: MINT, fontSize: 17, letterSpacing: 5}}>
        {'A >>>>>>>>>>>>> B'}
      </div>
      <div style={{position: 'absolute', left: 34, top: 302, color: MUTED, fontSize: 12}}>
        MOVE / NO COPY / SINGLE OWNER
      </div>
    </>
  );
};

const BorrowField: React.FC<{frame: number}> = ({frame}) => {
  const visible = linear(frame, 118, 12) * (1 - linear(frame, 176, 16));
  const phase = Math.floor(frame / 3);
  return (
    <>
      <div style={{position: 'absolute', left: 238, top: 154, color: WHITE, fontSize: 40, opacity: visible}}>&amp;</div>
      <div
        style={{
          position: 'absolute',
          left: 37,
          top: 44,
          width: 466,
          display: 'grid',
          gridTemplateColumns: 'repeat(15, 1fr)',
          rowGap: 13,
          opacity: 0.34 + visible * 0.66,
        }}
      >
        {range(15 * 11).map((index) => {
          const x = index % 15;
          const y = Math.floor(index / 15);
          const dx = 7 - x;
          const dy = 5 - y;
          const glyph = Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? '>' : '<') : dy > 0 ? 'v' : '^';
          const wave = (Math.abs(dx) + Math.abs(dy) + phase) % 7 === 0;
          return (
            <span key={index} style={{fontSize: 16, color: wave ? WHITE : visible ? GREEN : MUTED}}>
              {glyph}
            </span>
          );
        })}
      </div>
      <div style={{position: 'absolute', left: 44, bottom: 22, color: MINT, fontSize: 13, letterSpacing: 2}}>
        {visible > 0.2 ? 'READ REFERENCES ACTIVE' : 'OWNER REMAINS LOCKED'}
      </div>
    </>
  );
};

const ScopeClock: React.FC<{frame: number}> = ({frame}) => {
  const close = stepped(frame, 190, 30, 12);
  const remaining = Math.max(0, 12 - Math.floor(close * 12));
  return (
    <>
      <div style={{position: 'absolute', left: 54, top: 55, color: MUTED, fontSize: 13}}>LEXICAL REGION</div>
      <div style={{position: 'absolute', left: 54, top: 96, width: 430, height: 190, border: `1px solid ${close ? GREEN : MUTED}`}}>
        <div style={{position: 'absolute', left: 28, top: 28, color: GREEN, fontSize: 17}}>{'{'}</div>
        {range(6).map((index) => (
          <div
            key={index}
            style={{
              position: 'absolute',
              left: 66 + index * 52,
              bottom: 34,
              width: 34,
              height: 18 + ((index * 19 + frame) % 5) * 15,
              backgroundColor: index < remaining / 2 ? GREEN : GRID,
            }}
          />
        ))}
        <div style={{position: 'absolute', right: 28, bottom: 25, color: close > 0.8 ? WHITE : GREEN, fontSize: 17}}>{'}'}</div>
      </div>
      <div style={{position: 'absolute', left: 54, bottom: 24, fontSize: 15, color: close >= 1 ? WHITE : MINT}}>
        SCOPE_TTL:{String(remaining).padStart(2, '0')}
      </div>
    </>
  );
};

const DropCascade: React.FC<{frame: number}> = ({frame}) => {
  const drop = stepped(frame, 210, 32, 12);
  return (
    <>
      <div style={{position: 'absolute', left: 42, top: 35, color: MUTED, fontSize: 13}}>DROP SEQUENCE</div>
      <div style={{position: 'absolute', left: 50, top: 86, width: 430, height: 238}}>
        {range(12).map((index) => {
          const gone = index < Math.floor(drop * 12);
          return (
            <div
              key={index}
              style={{
                position: 'absolute',
                left: 14 + index * 33,
                bottom: 20,
                width: 25,
                height: 42 + ((index * 17) % 6) * 22,
                backgroundColor: gone ? GRID : index % 4 === 0 ? WHITE : index % 2 ? MINT : GREEN,
                transform: `translateY(${gone ? 55 : 0}px)`,
                opacity: gone ? 0.18 : 1,
              }}
            />
          );
        })}
        <div style={{position: 'absolute', left: 0, right: 0, bottom: 18, borderTop: `1px dashed ${MUTED}`}} />
      </div>
      <div style={{position: 'absolute', left: 50, bottom: 25, color: drop >= 1 ? WHITE : GREEN, fontSize: 14}}>
        {drop >= 1 ? 'FREED / DETERMINISTIC' : 'DROP IN PROGRESS'}
      </div>
    </>
  );
};

const CollectorPass: React.FC<{frame: number}> = ({frame}) => {
  const scan = stepped(frame, 244, 44, 18);
  const x = interpolate(scan, [0, 1], [34, 492]);
  return (
    <>
      <div style={{position: 'absolute', left: 35, top: 53}}>
        <DotField columns={18} rows={9} bright={(column) => Math.abs(column - Math.round(scan * 17)) <= 1} />
      </div>
      <div style={{position: 'absolute', left: x, top: 43, height: 245, borderLeft: `2px solid ${WHITE}`, boxShadow: `0 0 10px ${GREEN}`}} />
      <div style={{position: 'absolute', left: Math.min(398, x + 13), top: 48, color: WHITE, fontSize: 13}}>GC</div>
      <div style={{position: 'absolute', left: 40, bottom: 25, color: scan >= 1 ? WHITE : MINT, fontSize: 14, letterSpacing: 2}}>
        {scan >= 1 ? 'MATCHES:00' : 'TRACING EMPTY CELLS'}
      </div>
    </>
  );
};

const ZeroGarbage: React.FC<{frame: number}> = ({frame}) => {
  const clear = stepped(frame, 216, 54, 18);
  const phase = Math.floor(frame / 4);
  return (
    <>
      <div style={{position: 'absolute', left: 20, top: 30, right: 20, fontSize: 15, lineHeight: 1.55, color: MUTED}}>
        {range(11).map((row) => (
          <div key={row} style={{whiteSpace: 'pre'}}>
            {range(29)
              .map((column) => {
                const threshold = (row * 3 + column + phase) % 29;
                if (threshold < clear * 29) return '0';
                return (row + column) % 5 === 0 ? '1' : (row * 7 + column) % 16 < 10 ? 'A' : 'F';
              })
              .join('')}
          </div>
        ))}
      </div>
      <div
        style={{
          position: 'absolute',
          left: 0,
          right: 0,
          top: 123,
          textAlign: 'center',
          color: clear > 0.7 ? WHITE : GREEN,
          fontSize: 52,
          fontWeight: 700,
          letterSpacing: 8,
          textShadow: `0 0 14px ${GREEN}`,
        }}
      >
        {clear > 0.72 ? '0000' : 'DROP'}
      </div>
      <div style={{position: 'absolute', left: 30, bottom: 25, color: MINT, fontSize: 14}}>
        {clear > 0.72 ? 'NO DEFERRED GARBAGE' : 'OWNER EXIT SIGNAL'}
      </div>
    </>
  );
};

export const RustNoGc: React.FC = () => {
  const frame = useCurrentFrame();
  const active = (from: number, to: number) => frame >= from && frame < to;

  return (
    <AbsoluteFill style={{backgroundColor: BLACK, color: GREEN, fontFamily: MONO}}>
      <div style={{display: 'grid', gridTemplateColumns: 'repeat(2, 540px)', gridTemplateRows: 'repeat(4, 480px)'}}>
        <Tile index={1} title="OWNER REGISTER" description="One owning handle controls the allocation." active={active(0, 64)}>
          <OwnerRegister frame={frame} />
        </Tile>
        <Tile index={2} title="HEAP MAP" description="Allocated cells remain tied to the current owner." active={active(18, 64)}>
          <HeapMap frame={frame} />
        </Tile>
        <Tile index={3} title="MOVE TRACE" description="Ownership moves from A to B without copying." active={active(64, 118)}>
          <MoveTrace frame={frame} />
        </Tile>
        <Tile index={4} title="BORROW FIELD" description="References read temporarily; the owner remains." active={active(118, 190)}>
          <BorrowField frame={frame} />
        </Tile>
        <Tile index={5} title="SCOPE CLOCK" description="The compiler knows exactly where the owner ends." active={active(176, 220)}>
          <ScopeClock frame={frame} />
        </Tile>
        <Tile index={6} title="DROP CASCADE" description="Leaving scope frees owned cells immediately." active={active(205, 248)}>
          <DropCascade frame={frame} />
        </Tile>
        <Tile index={7} title="COLLECTOR PASS" description="A later tracing sweep finds no live garbage." active={active(242, 300)}>
          <CollectorPass frame={frame} />
        </Tile>
        <Tile index={8} title="ZERO GARBAGE" description="Ownership replaces deferred collection." active={active(260, 300)}>
          <ZeroGarbage frame={frame} />
        </Tile>
      </div>
      <div
        style={{
          position: 'absolute',
          inset: 0,
          pointerEvents: 'none',
          opacity: 0.055,
          backgroundImage: `linear-gradient(rgba(140,235,173,.25) 1px, transparent 1px)`,
          backgroundSize: '100% 4px',
          mixBlendMode: 'screen',
        }}
      />
    </AbsoluteFill>
  );
};
