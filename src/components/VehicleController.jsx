import React, { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { useKeyboardControls } from '@react-three/drei'
import { RigidBody } from '@react-three/rapier'

export function VehicleController({ children }) {
  const rigidBodyRef = useRef()
  const [_, get] = useKeyboardControls()

  useFrame(() => {
    const { forward, backward, left, right } = get()

    if (rigidBodyRef.current) {
      const impulse = { x: 0, y: 0, z: 0 }
      const torque = { x: 0, y: 0, z: 0 }
      const linVel = rigidBodyRef.current.linvel()

      if (forward) {
        impulse.z -= 0.1
      }
      if (backward) {
        impulse.z += 0.1
      }
      if (left) {
        torque.y += 0.05
      }
      if (right) {
        torque.y -= 0.05
      }

      rigidBodyRef.current.applyImpulse(impulse, true)
      rigidBodyRef.current.applyTorqueImpulse(torque, true)
    }
  })

  return <RigidBody ref={rigidBodyRef}>{children}</RigidBody>
}
