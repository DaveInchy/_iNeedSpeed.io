import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader'
import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader'

const dracoLoader = new DRACOLoader()
dracoLoader.setDecoderPath('https://www.gstatic.com/draco/v1/decoders/')

const gltfLoader = new GLTFLoader()
gltfLoader.setDRACOLoader(dracoLoader)

self.onmessage = async (event) => {
  const { type, url } = event.data

  if (type === 'loadGltf') {
    try {
      await gltfLoader.loadAsync(url) // Load but don't process here
      self.postMessage({ type: 'gltfLoaded', url, message: 'GLTF loaded in worker' })
    } catch (error) {
      console.error('Error loading GLTF in worker:', error)
      self.postMessage({ type: 'gltfError', url, error: error.message })
    }
  }
}
