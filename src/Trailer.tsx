import { useEffect, useRef, useState, type ReactNode } from 'react'
import {
  Shader,
  Group,
  SolidColor,
  Text,
  LinearGradient,
  MeshGradient,
  MultiPointGradient,
  Ascii,
  Glitch,
  ChromaticAberration,
  Glass,
  Swirl,
  Chrome,
  Plastic,
  ThinFilm,
  Holographic,
  FlutedGlass,
  GlassTiles,
  Dither,
  Twirl,
  Perspective,
  Blur,
  Aurora,
  SunBurst,
  Chevron,
  LiquidMetal,
  Plasma,
  Kaleidoscope,
  Prism,
  FilmGrain,
  VHS,
} from 'shaders/react'

// ---------- helpers ----------

const clamp01 = (x: number) => Math.min(1, Math.max(0, x))
const easeOut = (p: number) => 1 - Math.pow(1 - clamp01(p), 3)
const easeInOut = (p: number) => {
  p = clamp01(p)
  return p < 0.5 ? 4 * p * p * p : 1 - Math.pow(-2 * p + 2, 3) / 2
}
const lerp = (a: number, b: number, t: number) => a + (b - a) * t
/** Sharp spikes at the given times (seconds), for glitch hits. */
const hits = (s: number, at: number[], width = 0.06) =>
  Math.max(0, ...at.map((t) => Math.exp(-(((s - t) / width) ** 2))))

const FONT = 'Inter'
/** MeshGradient ignores colorA/colorB unless its default stops are replaced. */
const mesh = (...colors: string[]) => colors.map((color, i) => ({ color, position: i / (colors.length - 1) }))
const pill = (rotY = 0) => ({ type: 'capsule3D', radius: 0.16, height: 0.3, rotX: 0, rotY, rotZ: 90 })

/** Content whose blur clears over `dur` seconds: a soft focus-pull reveal. */
function BlurIn({ s, dur = 0.8, children }: { s: number; dur?: number; children: ReactNode }) {
  return (
    <Group opacity={easeOut(s / (dur * 0.6))}>
      {children}
      <Blur intensity={lerp(60, 0, easeOut(s / dur))} />
    </Group>
  )
}

/** Fill a word with any material by masking it with the word's shape. */
function MaterialWord({ id, text, size, children }: { id: string; text: string; size: number; children: ReactNode }) {
  return (
    <>
      <Group id={id} visible={false}>
        <Text text={text} fontSize={size} fontWeight={700} fontFamily={FONT} letterSpacing={-0.02} />
      </Group>
      <Group maskSource={id} maskType="alpha">
        {children}
      </Group>
    </>
  )
}

const WALL = [
  'CursorRipples', 'CursorTrail', 'FlowField', 'FlowingGradient', 'FlutedGlass', 'LensDistortion',
  'LightEdge', 'MultiPointGradient', 'Nebula', 'Neon', 'Polygon', 'Posterize', 'Prism', 'ProgressiveBlur',
  'Sharpness', 'Shatter', 'SimplexNoise', 'SineWave', 'TiltShift', 'TimeTrail', 'Tint', 'Voronoi',
  'Voxels', 'Water', 'Watercolor', 'LiquidMetal', 'Holographic', 'Glass', 'Chrome', 'Aurora',
]

// ---------- the cut ----------

type Shot = { d: number; render: (s: number, k: number) => ReactNode }

const openSource = (bg: string, look: (id: string) => ReactNode): Shot => ({
  d: 430,
  render: () => (
    <>
      <SolidColor color={bg} />
      {look(`os-${bg}`)}
    </>
  ),
})

const word = (color: string) => (
  <Text text="open source" fontSize={0.14} fontWeight={700} fontFamily={FONT} letterSpacing={-0.02} color={color} />
)

const shots: Shot[] = [
  // 1. Signal acquired: ASCII noise resolving into a clean frame.
  {
    d: 1400,
    render: (s, k) => (
      <>
        <MeshGradient stops={mesh('#1e3a8a', '#60a5fa', '#c4b5fd')} speed={3} />
        <Ascii cellSize={Math.round(lerp(80, 10, easeOut(k)))} characters="@#%*+=-:. " gamma={0.45} />
        <Glitch intensity={0.2 + 0.8 * hits(s, [0.15, 0.55, 0.62, 1.2])} rgbShift={18} />
        <ChromaticAberration strength={lerp(1.5, 0.2, k)} />
      </>
    ),
  },
  // 2. A glass sphere drifts in and refracts the headline.
  {
    d: 1500,
    render: (s, k) => (
      <>
        <MeshGradient stops={mesh('#020617', '#1e3a8a', '#0c4a6e')} speed={2} />
        <BlurIn s={s}>
          <Text text="SHADERS IS NOW" fontSize={0.07} fontWeight={600} fontFamily={FONT} letterSpacing={0.02} />
        </BlurIn>
        <Glass
          shape={{ type: 'sphere3D', radius: 0.38 }}
          center={{ x: lerp(0.3, 0.5, easeInOut(k)), y: 0.55 }}
          scale={lerp(0.8, 1.15, easeOut(k))}
          refraction={0.7}
          aberration={0.4}
          highlight={0.25}
        />
      </>
    ),
  },
  // 3. Same frame, new world: molten orange behind the glass.
  {
    d: 1300,
    render: (_s, k) => (
      <>
        <Swirl colorA="#0a0a0a" colorB="#f97316" speed={3} detail={1.5} />
        <Text text="SHADERS IS NOW" fontSize={0.07} fontWeight={600} fontFamily={FONT} letterSpacing={0.02} />
        <Glass
          shape={{ type: 'sphere3D', radius: 0.38 }}
          center={{ x: 0.5, y: lerp(0.55, 0.75, easeInOut(k)) }}
          scale={lerp(1.15, 1.9, easeInOut(k))}
          refraction={0.9}
          aberration={0.5}
        />
      </>
    ),
  },
  // 4. One object, four materials, cut on the beat.
  {
    d: 560,
    render: (s) => (
      <>
        <SolidColor color="#ececec" />
        <Chrome shape={pill(s * 40)} />
      </>
    ),
  },
  {
    d: 560,
    render: (s) => (
      <>
        <SolidColor color="#ececec" />
        <Plastic shape={pill(s * 40)} colorA="#7dd3fc" colorB="#38bdf8" crumple={0} roughness={0.3} />
      </>
    ),
  },
  {
    d: 560,
    render: (s) => (
      <>
        <SolidColor color="#e5e7eb" />
        <ThinFilm shape={pill(s * 40)} intensity={1.5} rimWidth={1.5} />
      </>
    ),
  },
  {
    d: 700,
    render: (s) => (
      <>
        <MeshGradient stops={mesh('#16a34a', '#1d4ed8')} speed={3} />
        <Glass shape={pill(s * 40)} refraction={1.8} aberration={0.7} highlight={0.4} />
      </>
    ),
  },
  // 5. "open source", restyled on every beat.
  openSource('#86efac', (id) => (
    <MaterialWord id={id} text="open source" size={0.14}>
      <Holographic shape={{ type: 'roundedRectSDF', width: 1, height: 1 }} scale={3} saturation={1} />
    </MaterialWord>
  )),
  openSource('#d9f99d', () => (
    <>
      {word('#d946ef')}
      <ChromaticAberration strength={0.5} />
    </>
  )),
  openSource('#fdba74', () => (
    <>
      {word('#22d3ee')}
      <FlutedGlass frequency={40} refraction={2.5} aberration={0.6} />
    </>
  )),
  openSource('#e879f9', () => (
    <>
      {word('#a7f3d0')}
      <GlassTiles tileCount={22} intensity={3} roundness={0.4} />
    </>
  )),
  openSource('#d4d4d4', () => (
    <>
      {word('#404040')}
      <Dither pixelSize={3} colorA="#d4d4d4" colorB="#262626" colorMode="custom" />
    </>
  )),
  openSource('#7f1d1d', () => (
    <>
      {word('#fda4af')}
      <Twirl intensity={1.2} />
    </>
  )),
  // 6. The catalogue, seen at an angle while the camera glides past.
  {
    d: 2400,
    render: (_s, k) => (
      <Perspective tilt={lerp(38, 30, k)} pan={lerp(-22, 12, easeInOut(k))} zoom={1.15} fov={50}>
        <SolidColor color="#0a0a0a" />
        {/* One wrapped text layer: dozens of separate Text layers stall the renderer. */}
        <Text
          text={WALL.map((name) => `<${name} />`).join('     ')}
          fontSize={0.032}
          fontWeight={500}
          fontFamily="JetBrains Mono"
          color="#a3a3a3"
          width={1.3}
          lineHeight={2.4}
          textAlign="center"
          center={{ x: 0.5 + 0.05 * Math.sin(k * Math.PI), y: 0.5 }}
        />
      </Perspective>
    ),
  },
  // 7. Breathe: soft pastel and a single quiet line.
  {
    d: 2000,
    render: (s) => (
      <>
        <MultiPointGradient
          colorA="#a5f3fc"
          colorB="#f5d0fe"
          colorC="#c4b5fd"
          colorD="#fbcfe8"
          colorE="#e0e7ff"
          smoothness={3}
        />
        <BlurIn s={s} dur={1}>
          <Text text="200+ components" fontSize={0.05} fontWeight={600} fontFamily={FONT} color="#818cf8" />
        </BlurIn>
      </>
    ),
  },
  // 8. Rapid fire: a new effect every beat.
  { d: 450, render: () => <Aurora colorA="#22d3ee" colorB="#a855f7" colorC="#22c55e" speed={8} /> },
  {
    d: 450,
    render: () => (
      <>
        <SunBurst color="#fdba74" background="#7c2d12" rayCount={18} softness={0.15} speed={1.5} />
      </>
    ),
  },
  {
    d: 450,
    render: (s) => (
      <>
        <MeshGradient stops={mesh('#0f172a', '#312e81')} />
        <Glass shape={{ type: 'gem3D', radius: 0.3, height: 0.32, facets: 8, rotX: 15, rotY: s * 120, rotZ: 0 }} refraction={1.6} aberration={1} highlight={0.6} />
      </>
    ),
  },
  { d: 450, render: (s) => <Chevron colorA="#67e8f9" colorB="#fde047" count={4} softness={0.1} offset={(s * 0.8) % 1} /> },
  {
    d: 450,
    render: (s) => (
      <>
        <SolidColor color="#000000" />
        <LiquidMetal
          shape={{ type: 'metaballs3D', balls: 4, ballRadius: 0.16, spread: 0.22, blend: 0.14, speed: 2, rotX: 0, rotY: s * 60, rotZ: 0 }}
        />
      </>
    ),
  },
  {
    d: 450,
    render: (s) => (
      <>
        <SolidColor color="#0a0a0a" />
        <Holographic shape={{ type: 'torus3D', radius: 0.3, tube: 0.12, rotX: 55 + s * 80, rotY: s * 40, rotZ: 0 }} sparkle={1} />
      </>
    ),
  },
  {
    d: 450,
    render: (s) => (
      <>
        <Plasma colorA="#ff2d95" colorB="#1e3a8a" intensity={2.2} contrast={1.6} speed={4} />
        <Kaleidoscope segments={8} angle={s * 90} />
      </>
    ),
  },
  {
    d: 550,
    render: (s) => (
      <>
        <SolidColor color="#f5f5f5" />
        <Chrome shape={{ type: 'link3D', radius: 0.18, length: 0.15, tube: 0.08, rotX: 20 + s * 60, rotY: 30 + s * 90, rotZ: 0 }} />
      </>
    ),
  },
  // 9. In a real product: a hero section, filmed at an angle.
  {
    d: 3200,
    render: (s, k) => (
      <Perspective tilt={lerp(22, 6, easeInOut(k))} pan={lerp(-34, -8, easeInOut(k))} zoom={lerp(0.78, 0.95, easeOut(k))} fov={45}>
        <SolidColor color="#030303" />
        <Prism intensity={2} spread={0.9} speed={0.4} beamColor="#ffffff" saturation={0.2} />
        <FilmGrain strength={0.3} animated />
        <BlurIn s={s - 0.3} dur={0.9}>
          <Text text="Plan, build, and ship" fontSize={0.065} fontWeight={600} fontFamily={FONT} center={{ x: 0.36, y: 0.62 }} />
          <Text text="from one place." fontSize={0.065} fontWeight={600} fontFamily={FONT} center={{ x: 0.3, y: 0.71 }} />
        </BlurIn>
      </Perspective>
    ),
  },
  // 10. Push into the screen until the pixels show.
  {
    d: 2400,
    render: (_s, k) => (
      <Perspective tilt={lerp(14, 0, k)} pan={lerp(-12, 0, k)} zoom={lerp(1, 2.1, easeInOut(k))} fov={50}>
        <LinearGradient colorA="#3b82f6" colorB="#ec4899" angle={20} />
        <Group>
          <LinearGradient colorA="#93c5fd" colorB="#fbcfe8" angle={20} />
          <Ascii characters="01 " cellSize={Math.round(lerp(18, 30, k))} />
        </Group>
        <Text text="SHIP MAGIC" fontSize={0.09} fontWeight={700} fontFamily={FONT} color="#fcd34d" />
        <VHS wobble={0.6} scanlineNoise={0.3} />
      </Perspective>
    ),
  },
  // 11. Sign-off: the glow rises, the name comes into focus, then it tips away.
  {
    d: 4600,
    render: (s, k) => {
      const out = clamp01((k - 0.78) / 0.22)
      return (
        <Group opacity={1 - easeInOut(out)}>
          <Perspective tilt={lerp(0, 40, easeInOut(out))} pan={lerp(0, 18, easeInOut(out))} zoom={lerp(1, 0.85, out)}>
            <SolidColor color="#000000" />
            <Group opacity={easeOut(k * 2.5)} transform={{ rotation: 180 }}>
              <Aurora
                colorA="#6d28d9"
                colorB="#db2777"
                colorC="#3b82f6"
                intensity={lerp(30, 90, easeOut(k * 1.5))}
                height={lerp(40, 110, easeOut(k * 1.5))}
                speed={3}
              />
              <Blur intensity={12} />
            </Group>
            <BlurIn s={s - 0.4} dur={1.2}>
              <Text text="npm i shaders" fontSize={0.055} fontWeight={600} fontFamily={FONT} />
            </BlurIn>
          </Perspective>
        </Group>
      )
    },
  },
  { d: 700, render: () => <SolidColor color="#000000" /> },
]

const starts: number[] = []
{
  let t = 0
  for (const sh of shots) {
    starts.push(t)
    t += sh.d
  }
}
const TOTAL = shots.reduce((sum, sh) => sum + sh.d, 0)

function locate(elapsed: number) {
  if (!Number.isFinite(elapsed) || elapsed < 0) elapsed = 0
  const g = elapsed % TOTAL
  let i = shots.length - 1
  while (i > 0 && starts[i] > g) i--
  return { i, local: g - starts[i], loop: Math.floor(elapsed / TOTAL) }
}

// ---------- player ----------

function useClock(paused: boolean) {
  const [elapsed, setElapsed] = useState(0)
  const acc = useRef(0)
  useEffect(() => {
    if (paused) return
    let last = performance.now()
    let raf = 0
    const tick = (now: number) => {
      acc.current += now - last
      last = now
      setElapsed(acc.current)
      raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [paused])
  const jump = (ms: number) => {
    acc.current = Math.max(0, ms)
    setElapsed(acc.current)
  }
  return { elapsed, jump }
}

const WARM_MS_PER_SHOT = 90

export function Trailer() {
  // Before playing, flash every shot briefly behind a cover so each effect's GPU
  // program is compiled up front instead of hitching the first time it appears.
  const [warming, setWarming] = useState(0)
  const isWarming = warming < shots.length
  const [paused, setPaused] = useState(false)
  const { elapsed, jump } = useClock(paused || isWarming)

  useEffect(() => {
    if (!isWarming) return
    const t = setTimeout(() => setWarming((w) => w + 1), WARM_MS_PER_SHOT)
    return () => clearTimeout(t)
  }, [warming, isWarming])
  const { i, local, loop } = locate(elapsed)
  const shot = shots[i]

  // Dev-only handle so automated previews can scrub to exact frames.
  useEffect(() => {
    if (!import.meta.env.DEV) return
    Object.assign(window, { __trailer: { jump, setPaused, durations: shots.map((sh) => sh.d) } })
  })

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const base = Math.floor(elapsed / TOTAL) * TOTAL
      if (e.key === ' ') {
        e.preventDefault()
        setPaused((p) => !p)
      } else if (e.key === 'ArrowRight') jump(base + (i + 1 < shots.length ? starts[i + 1] : TOTAL))
      else if (e.key === 'ArrowLeft') jump(base + starts[Math.max(0, i - 1)])
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [elapsed, i, jump])

  return (
    <div className="trailer">
      <Shader className="stage">
        {isWarming ? (
          <Group key={`warm-${warming}`}>{shots[warming].render(0.3, 0.5)}</Group>
        ) : (
          <Group key={`${loop}-${i}`}>{shot.render(local / 1000, local / shot.d)}</Group>
        )}
      </Shader>
      {isWarming && (
        <div className="warmup">
          loading effects {warming + 1} / {shots.length}
        </div>
      )}
      <div className="hud">
        <span>
          {String(i + 1).padStart(2, '0')} / {shots.length}
          {paused && ' · paused'}
        </span>
        <span>
          space pause · ← → step · <a href="#gallery">gallery</a>
        </span>
      </div>
      <div className="progress" style={{ transform: `scaleX(${(elapsed % TOTAL) / TOTAL})` }} />
    </div>
  )
}
