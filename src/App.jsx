import { Canvas } from '@react-three/fiber'
import { Suspense, useEffect } from 'react'
import { useSceneGraphStore } from './stores/useSceneGraphStore'
import { MeshNode } from './components/MeshNode'
import { CameraNode } from './components/CameraNode'
import { PlaneNode } from './components/PlaneNode'
import { Physics, RigidBody } from '@react-three/rapier'
import { KeyboardControls } from '@react-three/drei'
import { VehicleController } from './components/VehicleController'
import * as THREE from 'three'

function App() {
  const { nodes, setNodes } = useSceneGraphStore()

  useEffect(() => {
    // Initialize scene graph with a MeshNode for the car and a CameraNode
    setNodes([
      {
        id: 'car-rx7',
        type: 'MeshNode',
        parameters: {
          glbPaths: [
            '/cache/gltf/vehicle/rx7/BRAKE_OFF.glb',
            '/cache/gltf/vehicle/rx7/BRAKE_ON.glb',
            '/cache/gltf/vehicle/rx7/MAIN.glb',
            '/cache/gltf/vehicle/rx7/WHEELS.glb',
          ],
          position: [0, 0.5, 0], // Lift car slightly above ground
          scale: 1,
        },
      },
      {
        id: 'main-camera',
        type: 'CameraNode',
        parameters: {
          targetNodeId: 'car-rx7',
          behavior: 'follow',
          offset: [-6, 1.4, 0], // x, y, z offset from target (now behind the car, assuming X is forward)
          lookAtOffset: [0, 0.6, 0], // x, y, z offset for where the camera looks relative to target
        },
      },
      {
        id: 'ground-plane',
        type: 'PlaneNode',
        parameters: {
          size: 2000,
          position: [0, -0.1, 0],
          rotation: [-Math.PI / 2, 0, 0], // Rotate to be horizontal
          color: '#969696', // RGB 150, 150, 150
        },
      },
    ])
  }, [setNodes])

  return (
    <KeyboardControls
      map={[
        { name: "forward", keys: ["ArrowUp", "w", "W"] },
        { name: "backward", keys: ["ArrowDown", "s", "S"] },
        { name: "left", keys: ["ArrowLeft", "a", "A"] },
        { name: "right", keys: ["ArrowRight", "d", "D"] },
      ]}>
      <Canvas camera={{ position: [0, 5, 10], fov: 75 }}>
        <ambientLight intensity={0.8} />
        <directionalLight position={[5, 10, 5]} intensity={1} color={0xffffff} />
        <Physics>
          {nodes.map((node) => {
            if (node.type === 'MeshNode') {
              return (
                <VehicleController key={node.id}>
                  <RigidBody colliders="cuboid" position={node.parameters.position} scale={node.parameters.scale}>
                    <Suspense fallback={null}>
                      <MeshNode node={node} />
                    </Suspense>
                  </RigidBody>
                </VehicleController>
              )
            } else if (node.type === 'CameraNode') {
              return <CameraNode key={node.id} node={node} />
            } else if (node.type === 'PlaneNode') {
              return (
                <RigidBody key={node.id} type="fixed" colliders="cuboid" position={node.parameters.position}>
                  <PlaneNode node={node} />
                </RigidBody>
              )
            }
            return null
          })}
        </Physics>
      </Canvas>
    </KeyboardControls>
  )
}

export default App