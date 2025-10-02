import React, { Suspense } from 'react'
import { useLoader } from '@react-three/fiber'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader'
import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader'
import * as THREE from 'three'

// Configure DRACOLoader for the main thread's GLTFLoader
const dracoLoader = new DRACOLoader()
dracoLoader.setDecoderPath('https://www.gstatic.com/draco/v1/decoders/')

const gltfLoader = new GLTFLoader()
gltfLoader.setDRACOLoader(dracoLoader)

export function Vehicle(props) {
  const glbFiles = [
    '/cache/gltf/vehicle/rx7/BRAKE_OFF.glb',
    '/cache/gltf/vehicle/rx7/BRAKE_ON.glb',
    '/cache/gltf/vehicle/rx7/MAIN.glb',
    '/cache/gltf/vehicle/rx7/WHEELS.glb',
  ]

  const loadedGltfs = useLoader(GLTFLoader, glbFiles, (loader) => {
    loader.setDRACOLoader(dracoLoader)
  })

  const combinedScene = new THREE.Group()
  loadedGltfs.forEach(gltf => {
    combinedScene.add(gltf.scene)
  })

  return (
    <group {...props}>
      <primitive object={combinedScene} />
      {/* Temporary fallback mesh for debugging */}
      <mesh>
        <boxGeometry args={[1, 1, 1]} />
        <meshBasicMaterial color="red" />
      </mesh>
    </group>
  )
}
