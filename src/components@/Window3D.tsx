import "mods@css/main.css";
import "mods@css/tw.css";
import LoadingScreen from "./LoadingScreen";
import { Canvas } from "@react-three/fiber";
import { Physics } from "@react-three/rapier";
import { Suspense } from "react";

export default function Window3D({ children, usePhysics = true }: {
  children?: React.ReactNode,
  usePhysics?: boolean,
}): JSX.Element {
  "use client"
  return (
    <Canvas shadows style={{ width: "100%", height: "100%" }} camera={{ position: [0, 2, 5], fov: 60 }}>
        <Suspense fallback={<LoadingScreen/>} />
        {usePhysics ? (
          <Physics gravity={[0, -10, 0]}>
            {children}
          </Physics>
        ) : (
          children
        )}
      </Canvas>
  );
}
