import React from 'react'
import * as THREE from 'three'

export function PlaneNode({ node }) {
  const { id, type, parameters } = node
  const { size, position, rotation, color } = parameters

  return (
    <mesh position={position} rotation={rotation}>
      <planeGeometry args={[size, size]} />
      <meshStandardMaterial color={new THREE.Color(color)} />
    </mesh>
  )
}
