import type { ReactNode } from 'react'
import {
  Shader,
  LinearGradient,
  CursorTrail,
  Aurora,
  MeshGradient,
  LiquidMetal,
  Glass,
  CursorRipples,
  Glitch,
  Halftone,
  Ascii,
  Plasma,
  FilmGrain,
  SolidColor,
  Text,
} from 'shaders/react'

type Demo = { title: string; useCase: string; scene: ReactNode }

const demos: Demo[] = [
  {
    title: 'Aurora',
    useCase: 'Landing page hero background',
    scene: <Aurora colorA="#22d3ee" colorB="#a855f7" colorC="#22c55e" />,
  },
  {
    title: 'Mesh gradient',
    useCase: 'Soft, slowly moving brand background',
    scene: <MeshGradient colorA="#f97316" colorB="#ec4899" />,
  },
  {
    title: 'Liquid metal',
    useCase: 'Premium product or brand feel',
    scene: (
      <>
        <LinearGradient colorA="#0f172a" colorB="#1e293b" />
        <LiquidMetal />
      </>
    ),
  },
  {
    title: 'Glass',
    useCase: 'Frosted-glass panel over a colorful background',
    scene: (
      <>
        <MeshGradient colorA="#3b82f6" colorB="#f43f5e" />
        <Glass scale={1.4} refraction={2} blur={10} aberration={1} highlight={0.3} />
      </>
    ),
  },
  {
    title: 'Cursor ripples',
    useCase: 'Interactive hover effect (move your mouse here)',
    scene: (
      <>
        <LinearGradient colorA="#0ea5e9" colorB="#6366f1" />
        <CursorRipples intensity={20} radius={1} chromaticSplit={3} />
      </>
    ),
  },
  {
    title: 'Cursor trail',
    useCase: 'Playful mouse-following glow',
    scene: (
      <>
        <LinearGradient colorA="#0f172a" colorB="#7c3aed" />
        <CursorTrail radius={1.5} length={1.5} />
      </>
    ),
  },
  {
    title: 'Glitch',
    useCase: 'Music, gaming or event sites',
    scene: (
      <>
        <Plasma />
        <Glitch intensity={1} rgbShift={15} colorBarIntensity={0.6} scanlineIntensity={0.6} />
      </>
    ),
  },
  {
    title: 'Halftone',
    useCase: 'Retro comic / print look on any image',
    scene: (
      <>
        <Aurora colorA="#facc15" colorB="#ef4444" colorC="#3b82f6" />
        <Halftone frequency={35} misprint={0.006} />
      </>
    ),
  },
  {
    title: 'ASCII',
    useCase: 'Turns any visual into text characters',
    scene: (
      <>
        <SolidColor color="#000000" />
        <Text text="ASCII" fontSize={0.35} fontWeight={900} />
        <Ascii cellSize={22} />
      </>
    ),
  },
  {
    title: 'Film grain',
    useCase: 'Subtle analog texture for creative sites',
    scene: (
      <>
        <MeshGradient colorA="#78350f" colorB="#fcd34d" />
        <FilmGrain strength={1} animated />
      </>
    ),
  },
]

export function Gallery() {
  return (
    <main className="page">
      <h1>Shaders demo</h1>
      <p className="intro"><a href="#">← Back to the studio</a></p>
      <p className="intro">
        Each tile is a separate <code>&lt;Shader&gt;</code> with one or two stacked effects.
      </p>
      <div className="grid">
        {demos.map((d) => (
          <figure key={d.title} className="card">
            <Shader className="tile">{d.scene}</Shader>
            <figcaption>
              <strong>{d.title}</strong>
              <span>{d.useCase}</span>
            </figcaption>
          </figure>
        ))}
      </div>
    </main>
  )
}

