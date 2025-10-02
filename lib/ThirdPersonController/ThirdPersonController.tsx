import LoadingScreen from "mods@engine/LoadingScreen";
import ThirdPersonCharacter from "mods@components/Player/ThirdPersonCharacter";
import { Bounds, KeyboardControls, OrbitControls, useBounds } from "@react-three/drei";
import { extend, useFrame, useThree } from "@react-three/fiber";
import { RapierRigidBody, RigidBody } from "@react-three/rapier";
import { Player } from "models@Player";
import { Soldier } from "models@Soldier";
import { getDeltaTime } from "mods@utils";
import { useGameStore } from "mods@utils/hooks";
import { ReactNode, Suspense } from "react";
import { useEffect, useRef, useState } from "react";
import { BoxGeometry, FrontSide } from "three";
import { Group, Vector3 } from "three";

export default function PlayerController({ props }: { props: any; }) {
    "use client";

    extend({ BoxGeometry });

    // const physicsOpts: Partial<RigidBodyOptions | RigidBodyProps> = ({
    //     ccd: false,
    //     type: "dynamic",
    //     mass: 1,
    //     linearDamping: 0.8,
    //     angularDamping: 0.5,
    //     enabledRotations: [false, true, false]
    // });

    const [speed, setSpeed] = useState(25);
    const [animation, setAnimation] = useState("idle_move_lookaround");

    // const physicsComponent = useRef(undefined as unknown as Cannon);
    const groupComponent = useRef(undefined as unknown as Group);
    const gameState = useGameStore((state) => state.GameState);
    const playerState = useGameStore((state) => state.PlayerState);
    const writeState = useGameStore((state) => state.writePlayerState);

    //camera offset
    const [yOffset, setYOffset] = useState(10);
    const [zOffset, setZOffset] = useState(10);

    // const keyboardMap = ({
    //     "forward": ["KeyW", "w", "ArrowUp"],
    //     "backward": ["KeyS", "s", "ArrowDown"],
    //     "left": ["KeyA", "a", "ArrowLeft"],
    //     "right": ["KeyD", "d", "ArrowRight"],
    //     "jump": ["Space", " ", "space"],
    //     "sprint": ["Shift", "shift", "2"],
    //     "crouch": ["KeyC", "c", "2"],
    //     "attack": ["KeyF", "f", "2"],
    //     "interact": ["KeyE", "e", "2"],
    //     "inventory": ["KeyI", "i", "2"],
    //     "debug": ["`", "1", "2"],
    // });

    // const queueAnimation = (anim: string) => {
    //     // if the animation is not already the animation that is being queued then discard that call
    //     if (anim !== animation) {
    //         setAnimation(anim);
    //     }
    //     return;
    // };

    // const move = (axis: Vector3) => {

    //     const physicsObj = physicsComponent.current;

    //     if (!physicsObj) return;

    //     physicsObj.applyImpulse({ x: axis.x * speed, y: axis.y * speed, z: axis.z * speed }, true);
    //     return;
    // };

    // const turn = (axis: Vector3) => {

    //     const k = 1 - Math.pow(0.001, getDeltaTime()[0] * 1000);
    //     const physicsObj = physicsComponent.current;

    //     if (!physicsObj) return;

    //     physicsObj.applyTorqueImpulse(clamp({ x: 0, y: axis.y * speed, z: 0 } as Vector3), true);
    //     return;

    // };



    // const moveFB = (isNegative: boolean = false) => {
    //     let vec3 = new Vector3(0, 0, (isNegative ? 0 - 1 : 1));
    //     return move(vec3);
    // };

    // const moveLR = (isNegative: boolean = false) => {
    //     let vec3 = new Vector3((isNegative ? 0 - 1 : 1), 0, 0);
    //     return move(vec3);
    // };

    // const moveUD = (isNegative: boolean = false) => {
    //     let vec3 = new Vector3(0, (isNegative ? 0 - 1 : 1), 0);
    //     return move(vec3);
    // };

    // const turnLeft = () => {
    //     let vec3 = new Vector3(0, 1, 0);
    //     return turn(vec3);
    // };

    // const turnRight = () => {
    //     let vec3 = new Vector3(0, -1, 0);
    //     return turn(vec3);
    // };

    // const updateCameraOffset = (e: any) => {
    //     setYOffset(yOffset * 0.6 + e.target.scrollY);
    //     setZOffset(zOffset * 0.6 + e.target.scrollY);
    // };

    // let thirdPersonCamera: ThirdPersonCamera;

    useEffect(() => {

        // window.addEventListener("keydown", (e: KeyboardEvent) => {

        //     e.preventDefault();
        //     let isKeyModified = e.shiftKey;

        //     console.log(`[input]`, e.key, `=>`, e.code);

        //     // Movement ------------------ \\
        //     if (e.key === keyboardMap.jump[0] || e.key === keyboardMap.jump[1] || e.key === keyboardMap.jump[2]) {
        //         /* Jump
        //          * * * */
        //         moveUD(false);

        //     }

        //     if (e.key === keyboardMap.forward[0] || e.key === keyboardMap.forward[1] || e.key === keyboardMap.forward[2]) {
        //         /* Forward
        //          * * * */
        //         moveFB(true);
        //         queueAnimation("WalkingNormal");

        //     }
        //     if (e.key === keyboardMap.backward[0] || e.key === keyboardMap.backward[1] || e.key === keyboardMap.backward[2]) {
        //         /* Back
        //          * * * */
        //         moveFB(false);
        //         queueAnimation("RunningBackwards");
        //     }

        //     if (e.key === keyboardMap.left[0] || e.key === keyboardMap.left[1] || e.key === keyboardMap.left[2]) {
        //         /* Left
        //          * * * */
        //         //moveLR(true)
        //         turnLeft();

        //     }
        //     if (e.key === keyboardMap.right[0] || e.key === keyboardMap.right[1] || e.key === keyboardMap.right[2]) {
        //         /* Right
        //          * * * */
        //         //moveLR(false)
        //         turnRight();

        //     }
        //     // Movement End --------------- //
        // });
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    let playerWorldPos: Vector3[] = [new Vector3(0, 0, 0)];
    let cameraOriginWorldPos: Vector3[] = [new Vector3(0, 10, 10)];

    useFrame((rootState: { camera: { position: { x: number | undefined; y: number | undefined; z: number | undefined; }; }; }, deltaTime: number, frameInt: any) => {

        // const physicsObj = physicsComponent.current;

        // if (!physicsObj) return;

        // playerWorldPos[1] = playerWorldPos[0];
        // playerWorldPos[0] = new Vector3(physicsObj.worldCom().x, physicsObj.worldCom().y, physicsObj.worldCom().z);

        // cameraOriginWorldPos[1] = cameraOriginWorldPos[0];
        // cameraOriginWorldPos[0] = new Vector3(rootState.camera.position.x, rootState.camera.position.y, rootState.camera.position.z);

        // if (!thirdPersonCamera) {
        //     thirdPersonCamera = new ThirdPersonCamera({ camera: rootState.camera, interpolationFactor: 1, target: physicsObj });
        // }

        // thirdPersonCamera.Update(deltaTime, physicsObj, rootState.camera);

        let state = {
            position: playerWorldPos[0],
            animation: animation,
        };

        writeState(state);
    });

    // const colliderOpts: CylinderArgs = [2, 2];

    const Character = ({ charModel: "/models/glb/humanoidLocomotion.glb"})

    return (<>
    <group {...props}>
        <Soldier />
    </group>
    </>) as JSX.Element;
}
