# R3F Vite Racing Project

This project is a 3D racing game built with React, React Three Fiber (R3F), and Vite. It leverages a node-based scene graph system for modularity, web workers for offloading heavy tasks, and Rapier for physics.

## How to Run the Project

1.  **Navigate to the project directory:**
    ```bash
    cd r3f-vite-racing/r3f-racing
    ```
2.  **Install dependencies:**
    ```bash
    npm install
    ```
3.  **Start the development server:**
    ```bash
    npm run dev
    ```
    The application will typically be available at `http://localhost:5173/`.

**Note:** This project uses `SharedArrayBuffer`, which requires Cross-Origin Isolation headers. These are configured in `vite.config.js`. If you encounter issues, ensure your browser supports these features and that the development server is correctly applying the headers.

## Project Goals & Features

This project aims to build a robust and extensible 3D racing game. Key features and architectural goals include:

*   **Node-Based Scene Graph:** A flexible system for managing all 3D entities (meshes, cameras, lights, physics bodies) as nodes.
*   **Modular Components:** Reusable React components for different node types.
*   **Efficient Asset Streaming:** Offloading GLTF/GLB asset loading and parsing to web workers.
*   **Physics Simulation:** Realistic vehicle physics using Rapier.
*   **Custom Shaders:** Integration of GLSL for advanced visual effects.
*   **Multi-threading:** Utilizing web workers and `SharedArrayBuffer` for heavy computations.
*   **Dynamic Camera System:** A camera that can attach to and follow specific nodes with configurable behaviors.

## Progress Checklist

Here's a checklist of implemented features and their current status:

*   **Core Setup (Vite, R3F, Drei, Zustand):** ✅
*   **GLSL Shader Integration:** ✅
*   **Web Workers for Data Generation:** ✅
*   **Web Workers for Asset Loading (Basic):** ✅
*   **Node-Based Scene Graph System:** ✅
    *   `MeshNode` (for 3D models): ✅
    *   `CameraNode` (for camera control): ✅
    *   `PlaneNode` (for ground/static elements): ✅
*   **Vehicle Model Loading (RX7):** ✅
*   **Dynamic Camera Following Car:** ✅
*   **Physics Integration (Rapier):** 🚧 (Basic setup, no vehicle physics controller yet)
*   **Vehicle Controller (Input & Movement):** 🚧 (Basic input handling, needs integration with physics)
*   **Efficient GLTF Data Transfer (SharedArrayBuffer):** ⬜
*   **Advanced Camera Behaviors (Bobbing, Shaking, Scripted):** ⬜
*   **Game Loop & State Management:** ⬜
*   **UI/HUD Integration:** ⬜

**Legend:**
*   ✅: Implemented and working
*   🚧: In progress / Basic implementation
*   ⬜: Not yet started

## Gained Knowledge & Concepts (GEMINI.md)

All detailed architectural concepts, implementation specifics, and progress insights are documented in `GEMINI.md` in the project root. This file serves as a living document for Gemini's understanding of the project's evolving structure and goals.