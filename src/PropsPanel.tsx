import { useId } from 'react'
import { catalog, type PropSpec } from './scene/catalog'
import type { Layer } from './scene/schema'

type Stop = { color: string; position: number }
type Props = { layers: Layer[]; onChange: (layerIndex: number, name: string, value: unknown) => void }

const EDITABLE = new Set<PropSpec['kind']>(['number', 'color', 'select', 'boolean', 'stops'])

/** Controls generated from registry metadata: the same source the model's catalog uses. */
export function PropsPanel({ layers, onChange }: Props) {
  return (
    <div className="layers">
      {layers
        .map((layer, i) => ({ layer, i }))
        .reverse() // top layer first, like a design tool's layer list
        .map(({ layer, i }) => {
          const spec = catalog.get(layer.type)
          if (!spec) return null
          const editable = spec.props.filter((p) => EDITABLE.has(p.kind))
          const set = editable.filter((p) => p.name in layer.props)
          const rest = editable.filter((p) => !(p.name in layer.props))
          return (
            <section key={`${i}-${layer.type}`} className="layer">
              <header>
                <strong>{layer.type}</strong>
                <span className={`role role-${spec.role}`}>{spec.role}</span>
              </header>
              {set.map((p) => (
                <Control key={p.name} spec={p} value={layer.props[p.name]} onChange={(v) => onChange(i, p.name, v)} />
              ))}
              {rest.length > 0 && (
                <details>
                  <summary>{rest.length} more {rest.length === 1 ? 'setting' : 'settings'}</summary>
                  {rest.map((p) => (
                    <Control key={p.name} spec={p} value={p.default} onChange={(v) => onChange(i, p.name, v)} />
                  ))}
                </details>
              )}
            </section>
          )
        })}
    </div>
  )
}

function Control({ spec, value, onChange }: { spec: PropSpec; value: unknown; onChange: (v: unknown) => void }) {
  const id = useId()
  switch (spec.kind) {
    case 'number': {
      const n = typeof value === 'number' ? value : Number(spec.default ?? 0)
      return (
        <label className="control" title={spec.description}>
          <span>{spec.label}</span>
          <input type="range" min={spec.min} max={spec.max} step={spec.step ?? 'any'} value={n} onChange={(e) => onChange(Number(e.target.value))} />
          <output>{Number.isInteger(n) ? n : n.toFixed(2)}</output>
        </label>
      )
    }
    case 'color':
      return (
        <label className="control" title={spec.description}>
          <span>{spec.label}</span>
          <input type="color" value={typeof value === 'string' ? value : '#000000'} onChange={(e) => onChange(e.target.value)} />
        </label>
      )
    case 'select':
      return (
        <label className="control" title={spec.description}>
          <span>{spec.label}</span>
          <select value={String(value)} onChange={(e) => onChange(e.target.value)}>
            {spec.options?.map((o) => <option key={o} value={o}>{o}</option>)}
          </select>
        </label>
      )
    case 'boolean':
      return (
        <label className="control" htmlFor={id} title={spec.description}>
          <span>{spec.label}</span>
          <input id={id} type="checkbox" checked={value === true} onChange={(e) => onChange(e.target.checked)} />
        </label>
      )
    case 'stops': {
      const stops = (Array.isArray(value) ? value : []) as Stop[]
      return (
        <div className="control" title={spec.description}>
          <span>{spec.label}</span>
          <div className="stops">
            {stops.map((s, j) => (
              <input
                key={j}
                type="color"
                aria-label={`${spec.label} ${j + 1}`}
                value={s.color}
                onChange={(e) => onChange(stops.map((t, k) => (k === j ? { ...t, color: e.target.value } : t)))}
              />
            ))}
          </div>
        </div>
      )
    }
    default:
      return null
  }
}
