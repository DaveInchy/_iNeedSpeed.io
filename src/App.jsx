import * as THREE from "three";
import { Canvas } from "@react-three/fiber";
import { Suspense, useEffect } from "react";
import { CameraNode } from "./components/CameraNode";
import { MeshNode } from "./components/MeshNode";
import { PlaneNode } from "./components/PlaneNode";
import { useSceneGraphStore } from "./stores/useSceneGraphStore";

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
          position: [0, 0, 0],
          scale: 1, // Scaled back to 1
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
    <Canvas camera={{ position: [0, 5, 10], fov: 75 }}>
      <ambientLight intensity={0.8} />
      <directionalLight position={[5, 10, 5]} intensity={1} color={0xffffff} />
      <Suspense fallback={null}>
        {nodes.map((node) => {
          if (node.type === 'MeshNode') {
            return <MeshNode key={node.id} node={node} />
          } else if (node.type === 'CameraNode') {
            return <CameraNode key={node.id} node={node} />
          } else if (node.type === 'PlaneNode') {
            return <PlaneNode key={node.id} node={node} />
          }
          return null
        })}
      </Suspense>
    </Canvas>
  )
}

export default App