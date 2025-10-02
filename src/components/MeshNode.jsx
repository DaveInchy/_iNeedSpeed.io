import React, { Suspense, useRef, useEffect } from 'react'
import { useLoader } from '@react-three/fiber'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader'
import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader'
import * as THREE from 'three'
import { useSceneGraphStore } from '../stores/useSceneGraphStore'

// Configure DRACOLoader for the main thread's GLTFLoader
const dracoLoader = new DRACOLoader()
dracoLoader.setDecoderPath('https://www.gstatic.com/draco/v1/decoders/')

const gltfLoader = new GLTFLoader()
gltfLoader.setDRACOLoader(dracoLoader)

export function MeshNode({ node }) {
  const { id, type, parameters } = node
  const { glbPaths, position, scale } = parameters

  const groupRef = useRef()
  const { setRef, removeRef } = useSceneGraphStore()

  useEffect(() => {
    if (groupRef.current) {
      setRef(id, groupRef.current)
    }
    return () => {
      removeRef(id)
    }
  }, [id, setRef, removeRef])

  const loadedGltfs = useLoader(GLTFLoader, glbPaths, (loader) => {
    loader.setDRACOLoader(dracoLoader)
  })

  const combinedScene = new THREE.Group()
  loadedGltfs.forEach(gltf => {
    combinedScene.add(gltf.scene)
  })

  return (
    <group ref={groupRef} position={position} scale={scale}>
      <primitive object={combinedScene} />
    </group>
  )
}
