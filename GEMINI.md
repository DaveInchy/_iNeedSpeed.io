# Project Architecture & Gemini's Understanding

This document outlines the key architectural concepts, implementation details, and project structure as understood and implemented by Gemini, with a focus on facilitating game development.

## 1. Core Setup & Technologies

*   **Vite + React:** Frontend framework and build tool.
*   **React Three Fiber (R3F):** React renderer for Three.js.
*   **React Three Drei:** Collection of useful helpers and abstractions for R3F.
*   **@react-three/rapier:** Physics engine integration for R3F.
*   **Zustand:** State management library for global state (e.g., scene graph).
*   **GLSL Shaders:** Custom shaders for visual effects.
*   **Web Workers & SharedArrayBuffer:** For offloading heavy computations and asset streaming.

## 2. Node-Based Scene Graph System

**Concept:** A flexible, data-driven system for managing all entities in the 3D scene. Each entity is represented as a "Node" with a specific `type`, `id`, and `parameters`. This allows for easy extension, modification, and serialization of the scene.

**Structure:**
*   **`src/stores/useSceneGraphStore.js`**: Zustand store managing the `nodes` array (the scene graph) and a `refs` map.
    *   `nodes`: An array of node objects, each defining an entity in the scene.
    *   `refs`: A `Map` storing live `three.js` object references (e.g., `THREE.Group`, `THREE.Mesh`) keyed by node `id`. This enables nodes to interact with each other's real-time properties.
    *   `addNode`, `removeNode`, `updateNode`, `setNodes`, `setRef`, `removeRef`: Actions for managing the scene graph and object references.

**Node Types Implemented:**

### 2.1. `MeshNode`

*   **Purpose:** Represents a 3D model loaded from GLB files.
*   **Component:** `src/components/MeshNode.jsx`
*   **Parameters:**
    *   `glbPaths`: `string[]` - Array of paths to GLB files that compose the mesh.
    *   `position`: `[number, number, number]` - World position of the mesh.
    *   `scale`: `number` - Uniform scale factor for the mesh.
*   **Implementation Details:**
    *   Uses `useLoader` with `GLTFLoader` and `DRACOLoader` to load multiple GLB files.
    *   Combines loaded GLTF scenes into a single `THREE.Group`.
    *   Registers its `THREE.Group` reference with `useSceneGraphStore.refs` for other nodes (like `CameraNode`) to access its live position/rotation.
*   **Ease of Game Dev:** Easily add new 3D models by defining a `MeshNode` in the scene graph with its GLB paths, position, and scale.

### 2.2. `CameraNode`

*   **Purpose:** Controls the main camera's position and orientation, often relative to another node.
*   **Component:** `src/components/CameraNode.jsx`
*   **Parameters:**
    *   `targetNodeId`: `string` - The `id` of the node to which the camera is attached (e.g., 'car-rx7').
    *   `behavior`: `string` - Defines how the camera behaves (e.g., 'follow', 'staticTarget').
    *   `offset`: `[number, number, number]` - Relative position offset from the `targetNode`.
    *   `lookAtOffset`: `[number, number, number]` - Relative offset from the `targetNode` for where the camera looks.
*   **Implementation Details:**
    *   Uses `useFrame` to update the camera's position and `lookAt` target every frame.
    *   Retrieves the `targetNode`'s live `three.js` object reference from `useSceneGraphStore.refs`.
    *   Applies the `offset` relative to the `targetNode`'s rotation, ensuring the camera stays behind/above/etc. even when the target rotates.
*   **Ease of Game Dev:** Define camera perspectives and behaviors declaratively in the scene graph. Easily switch camera modes or attach to different entities by changing node parameters.

### 2.3. `PlaneNode`

*   **Purpose:** Represents a simple flat plane in the scene (e.g., ground).
*   **Component:** `src/components/PlaneNode.jsx`
*   **Parameters:**
    *   `size`: `number` - Width and height of the square plane.
    *   `position`: `[number, number, number]` - World position of the plane.
    *   `rotation`: `[number, number, number]` - Rotation of the plane (e.g., `[-Math.PI / 2, 0, 0]` for horizontal).
    *   `color`: `string` - Hex color string for the plane's material.
*   **Implementation Details:**
    *   Renders a `mesh` with `planeGeometry` and `meshStandardMaterial`.
*   **Ease of Game Dev:** Quickly add static ground or platform elements to the scene.

## 3. Asset Management & Streaming

**Concept:** Offloading asset loading and parsing to web workers to keep the main thread free for rendering and user interaction, improving responsiveness.

**Implementation Details:**

*   **`src/assetWorker.js`**: A dedicated web worker for loading GLTF/GLB assets.
    *   Uses `GLTFLoader` and `DRACOLoader` within the worker.
    *   Currently, it loads the asset and sends a confirmation message back to the main thread.
    *   **Future Enhancement (SharedArrayBuffer):** This worker is designed to be extended to parse GLTF data and transfer raw `ArrayBuffer`s (e.g., geometry data) via `SharedArrayBuffer` to the main thread, avoiding costly serialization/deserialization.
*   **`public/cache/gltf/vehicle/rx7/`**: Directory structure for cached GLB assets.
    *   `BRAKE_OFF.glb`, `BRAKE_ON.glb`, `MAIN.glb`, `WHEELS.glb`: Individual GLB files composing the RX7 vehicle.
*   **`vite.config.js`**: Configured with `Cross-Origin-Opener-Policy` and `Cross-Origin-Embedder-Policy` headers to enable `SharedArrayBuffer` usage.

## 4. Physics Integration

**Concept:** Using Rapier for realistic physics simulations.

**Implementation Details:**

*   **`@react-three/rapier`**: R3F bindings for the Rapier physics engine.
*   **`Physics` component:** Wraps the scene to enable physics simulation.
*   **`RigidBody` component:** Attaches a physics body to a 3D object.
    *   `colliders="cuboid"`: Defines a cuboid collider.
    *   `type="fixed"`: For static objects like the ground.
*   **`src/components/VehicleController.jsx`**: Handles user input (keyboard) and applies impulses/torques to a `RigidBody` to control a vehicle.

## 5. GLSL Shaders

**Concept:** Custom visual effects using GLSL (OpenGL Shading Language).

**Implementation Details:**

*   **`src/shaders/vertexShader.glsl` & `src/shaders/fragmentShader.glsl`**: Raw GLSL code files.
*   **`?raw` suffix:** Vite's mechanism to import GLSL files as plain strings.
*   **`CustomShaderMaterialImpl`**: A custom `THREE.ShaderMaterial` extending `THREE.ShaderMaterial` to use the imported GLSL code.
*   **`extend({ CustomShaderMaterial: CustomShaderMaterialImpl })`**: Registers the custom material with R3F.

## 6. Data Generation Worker

**Concept:** Offloading general data generation tasks to a web worker, utilizing `SharedArrayBuffer` for efficient data transfer.

**Implementation Details:**

*   **`src/worker.js`**: A web worker that generates random `Int32Array` data into a `SharedArrayBuffer`.
*   **`SharedArrayBuffer`**: Used to share memory directly between the main thread and the worker, avoiding data copying.

## 7. Project Structure (Code)

*   **`src/App.jsx`**: Main application component, initializes the scene graph, renders nodes, and sets up global lighting/camera.
*   **`src/main.jsx`**: Entry point for the React application.
*   **`src/index.css`**: Global CSS for basic layout (full screen canvas).
*   **`src/App.css`**: (Currently empty) Can be used for app-specific CSS.
*   **`src/components/`**: Contains reusable React components for 3D entities.
    *   `MeshNode.jsx`: Renders 3D models from GLB files.
    *   `CameraNode.jsx`: Controls camera behavior.
    *   `PlaneNode.jsx`: Renders a simple ground plane.
    *   `Vehicle.jsx`: (Deprecated/Not used in current node system) Previously combined individual GLB components.
    *   `VehicleController.jsx`: Handles vehicle input and physics control.
    *   `vehicle/rx7/`: Directory for `gltfjsx` generated components (e.g., `BrakeOff.jsx`, `Main.jsx`). These are currently not used in the node-based system but are available.
*   **`src/stores/`**: Contains Zustand stores for global state management.
    *   `useSceneGraphStore.js`: Manages the scene graph and object references.
*   **`src/shaders/`**: Contains GLSL shader files.
    *   `vertexShader.glsl`
    *   `fragmentShader.glsl`
*   **`src/worker.js`**: General data generation web worker.
*   **`src/assetWorker.js`**: GLTF asset loading web worker.

## 8. Project Structure (Public Assets)

*   **`public/`**: Static assets served directly by Vite.
    *   `Box.gltf`: Placeholder GLTF model.
    *   `vite.svg`: Default Vite logo.
    *   **`public/cache/`**: Directory for cached assets.
        *   `cache.constants.json`, `cache.mapping.json`, `cache.metadata.json`, `index.json`: Metadata/configuration files for caching.
        *   **`public/cache/gltf/`**: GLTF/GLB specific cached assets.
            *   `characters/Soldier.gltf`: Example GLTF.
            *   `index.json`: Metadata.
            *   **`public/cache/gltf/vehicle/`**: Vehicle specific assets.
                *   `index.json`: Metadata.
                *   **`public/cache/gltf/vehicle/rx7/`**: RX7 specific GLB files.
                    *   `BRAKE_OFF.glb`, `BRAKE_ON.glb`, `MAIN.glb`, `WHEELS.glb`: Individual GLB files for the RX7 model.
    *   **`public/settings/`**: Configuration settings.
        *   `index.json`, `settings.client.json`, `settings.constants.json`, `settings.metadata.json`, `settings.server.json`: Various settings files.
    *   **`public/workers/`**: Worker-related configurations/metadata.
        *   `logic/`, `methods/`, `specifications/`: Subdirectories for different worker logic.
        *   `types.logic.json`, `types.methods.json`, `types.specs.json`: Type definitions for worker communication.
        *   `workers.index.json`: Worker metadata.

## 9. Secure and Safe Implementation

*   **Cross-Origin Isolation:** `vite.config.js` is configured with `Cross-Origin-Opener-Policy: 'same-origin'` and `Cross-Origin-Embedder-Policy: 'require-corp'` to enable `SharedArrayBuffer`. This is a security requirement for using shared memory.
*   **Web Worker Isolation:** Web workers run in their own isolated global scope, preventing direct DOM manipulation and ensuring that heavy computations don't block the main thread.
*   **Structured Communication:** Communication between main thread and workers is done via `postMessage` and `onmessage` with structured data, minimizing direct access and potential vulnerabilities.
*   **Asset Caching:** The `public/cache` structure suggests an intention for local caching of assets, which can improve load times and reduce network requests.

## 10. Ease of Game Development

*   **Declarative Scene Graph:** Define your entire scene (models, cameras, lights, physics bodies) as a data structure in `useSceneGraphStore`. This makes it easy to add, remove, or modify entities without changing core rendering logic.
*   **Modular Components:** Each node type (e.g., `MeshNode`, `CameraNode`) is a self-contained React component, promoting reusability and separation of concerns.
*   **Centralized State:** Zustand provides a clear way to manage global state, including the scene graph and object references, making it easy for different parts of the application to interact.
*   **Physics Integration:** `@react-three/rapier` simplifies adding physics to your scene, allowing for realistic interactions.
*   **Shader Customization:** Easy integration of GLSL shaders for custom visual effects.
*   **Offloaded Tasks:** Web workers ensure that heavy tasks like asset loading and data generation don't impact the main thread's performance, leading to a smoother user experience.
