import type { ComponentType } from 'react'
import * as Shaders from 'shaders/react'
import type { Scene } from './scene/schema'

const components = Shaders as unknown as Record<string, ComponentType<Record<string, unknown>>>

type Props = { scene: Scene; className?: string; sceneKey?: string | number }

/**
 * Renders a validated scene. Layers stack in mount order, so a new scene must
 * remount the whole tree (`sceneKey`); prop edits within a scene keep the key.
 */
export function SceneView({ scene, className, sceneKey }: Props) {
  return (
    <Shaders.Shader key={sceneKey} className={className}>
      {scene.layers.map((layer, i) => {
        const Component = components[layer.type]
        return Component ? <Component key={`${i}-${layer.type}`} {...layer.props} /> : null
      })}
    </Shaders.Shader>
  )
}
