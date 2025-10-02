import React from 'react'
import * as THREE from 'three'
import { useTexture } from '@react-three/drei'

export function PlaneNode({ node }) {
  const { id, type, parameters } = node
  const { size, position, rotation } = parameters

  const [diffuse, normal, roughness, specular] = useTexture([
    '/cache/textures/prototype/grid_diffuse.png',
    '/cache/textures/prototype/grid_normal.png',
    '/cache/textures/prototype/grid_rougness.png',
    '/cache/textures/prototype/grid_specular.png',
  ])

  // Configure tiling
  const repeatX = size / 10; // Adjust tiling frequency as needed
  const repeatY = size / 10; // Adjust tiling frequency as needed

  [diffuse, normal, roughness, specular].forEach((texture) => {
    texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
    texture.repeat.set(repeatX, repeatY);
  });

  return (
    <mesh position={position} rotation={rotation}>
      <planeGeometry args={[size, size]} />
      <meshStandardMaterial
        map={diffuse}
        normalMap={normal}
        roughnessMap={roughness}
        metalnessMap={specular} // Assuming specular map can be used as metalness map
      />
    </mesh>
  )
}
