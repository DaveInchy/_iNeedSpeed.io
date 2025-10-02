import React, { useRef } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import * as THREE from 'three'
import { useSceneGraphStore } from '../stores/useSceneGraphStore'

export function CameraNode({ node }) {
  const { id, type, parameters } = node
  const { targetNodeId, behavior, offset, lookAtOffset } = parameters

  const { camera } = useThree()
  const { refs } = useSceneGraphStore()

  useFrame(() => {
    const targetObject = refs.get(targetNodeId)

    if (targetObject) {
      const targetPosition = targetObject.position
      const targetQuaternion = targetObject.quaternion

      if (behavior === 'follow') {
        const tempVector = new THREE.Vector3()
        const tempQuaternion = new THREE.Quaternion()

        // Calculate camera position based on target and offset
        tempVector.set(offset[0], offset[1], offset[2])
        tempVector.applyQuaternion(targetQuaternion) // Apply target's rotation to offset
        tempVector.add(targetPosition)
        camera.position.copy(tempVector)

        // Calculate camera lookAt point
        tempVector.set(lookAtOffset[0], lookAtOffset[1], lookAtOffset[2])
        tempVector.applyQuaternion(targetQuaternion)
        tempVector.add(targetPosition)
        camera.lookAt(tempVector)

        // Ensure camera up vector is correct
        camera.up.set(0, 1, 0)
      } else if (behavior === 'staticTarget') {
        // Camera stays at its initial position relative to the target
        // and looks at the target
        const cameraPosition = new THREE.Vector3().fromArray(offset || [0, 5, 10])
        camera.position.copy(targetPosition.clone().add(cameraPosition))
        camera.lookAt(targetPosition.clone().add(new THREE.Vector3().fromArray(lookAtOffset || [0, 0, 0])))
      }
      // Add other behaviors (bobbing, shaking, scripted) here
    }
  })

  return null // CameraNode doesn't render anything directly
}
