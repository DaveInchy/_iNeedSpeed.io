import * as THREE from "three";
import { Triplet, useCompoundBody, useRaycastClosest } from "@react-three/cannon";
import { useFrame, useThree } from "@react-three/fiber";
import { RapierRigidBody } from "@react-three/rapier";
import { getDeltaTime } from "mods@utils";
import { useEffect, useMemo, useRef, useState } from "react";
import { AnimationMixer, Object3D } from "three";

export default class ThirdPersonCamera {

    _params: any;
    _camera: THREE.Camera;
    _target: RapierRigidBody;
    _interpolationFactor: 1.0 | number;
    _currentLookat: THREE.Vector3;
    _currentPosition: THREE.Vector3;
    _debug: boolean;

    constructor(params: any)
    {
        this._params = params;
        this._camera = params.camera;
        this._target = params.target;
        this._debug = params.debug || false;
        this._interpolationFactor = params.interpolationFactor || 1.0;

        this._currentPosition = new THREE.Vector3(-5, 5, -10);
        this._currentLookat = new THREE.Vector3(-5, 5, 5);

        return this;
    }

    getDirection() {
        return this._camera.getWorldDirection(this._currentLookat);
    }

    calculateIdealOffset() {
        let idealOffset = new THREE.Vector3(-5, 5, -10);
        idealOffset.applyQuaternion(new THREE.Quaternion(this._target.rotation().x, this._target.rotation().y, this._target.rotation().z, this._target.rotation().w));
        idealOffset.add(new THREE.Vector3(this._target.worldCom().x, this._target.worldCom().y, this._target.worldCom().z));
        return idealOffset;
    }

    calculateIdealLookat() {
        const idealLookat = new THREE.Vector3(-5, 5, 5);
        idealLookat.applyQuaternion(new THREE.Quaternion(this._target.rotation().x, this._target.rotation().y, this._target.rotation().z, this._target.rotation().w));
        idealLookat.add(new THREE.Vector3(this._target.worldCom().x, this._target.worldCom().y, this._target.worldCom().z));
        return idealLookat;
    }

    Update(timeElapsed: number, target: RapierRigidBody, camera: any)
    {
        this._target = target;
        this._camera = camera;

        const idealLookat = this.calculateIdealLookat();
        const idealOffset = this.calculateIdealOffset();

        const ms = timeElapsed * 1000 || getDeltaTime()[0];
        const t = this._params.interpolationFactor - Math.pow(0.001, ms);

        this._currentPosition.lerp(idealOffset, t);
        this._currentLookat.lerp(idealLookat, t);

        this._camera.position.set(this._currentPosition.x, this._currentPosition.y, this._currentPosition.z);
        this._camera.lookAt(this._currentLookat);
    }
}


export function useCapsuleCollider({ height = 2 }) {
    const { scene } = useThree()
    const radius = height / 4
    const [, collider] = useCompoundBody(() => ({
        mass: 1,
        fixedRotation: true,
        linearDamping: 0.8,
        angularDamping: 0.5,
        material: {
            friction: 0,
            name: 'no-fric-zone',
        },
        shapes: [
            { type: 'Sphere', position: [0, radius, 0], args: [radius] },
            { type: 'Sphere', position: [0, (height + radius) / 2, 0], args: [radius] },
            {
                type: 'Sphere',
                position: [0, height, 0],
                args: [radius],
            },
        ],
        position: [0, 0, 0],
        rotation: [0, Math.PI, 0],
        collisionFilterGroup: 1,
    }))

    return collider
}


export const getAnimationFromUserInputs = (inputs: any) => {
    const { up, down, right, left, isMouseLooking } = inputs

    if (up && !down) {
        return 'RunningNormal'
    }

    if (down && !up) {
        return 'RunningBackwards'
    }

    if (!right && left) {
        return isMouseLooking ? 'StrafeLeft' : 'TurnLeft'
    }

    if (!left && right) {
        return isMouseLooking ? 'StrafeRight' : 'TurnRight'
    }

    return 'idle_move_breathing'
}

export function useCharacterState(inputs: any, position: any, mixer: any) {
    const [characterState, setCharacterState] = useState({
        animation: 'idle_move_breathing',
        isJumping: false,
        inAir: false,
        isMoving: false,
        isLanding: false,
    })

    const [jumpPressed, setJumpPressed] = useState(false)
    const [landed, setLanded] = useState(true)

    const { up, down, right, left, jump, isMouseLooking } = inputs
    const { isJumping, inAir, isLanding } = characterState

    useEffect(() => {
        setJumpPressed(jump)
        setLanded(false)
    }, [jump])

    const rayFrom = [position[0], position[1], position[2]] as Triplet
    const rayTo = [position[0], position[1] - 0.05, position[2]] as Triplet
    useRaycastClosest(
        {
            from: rayFrom,
            to: rayTo,
            skipBackfaces: true,
        },
        (e: { hasHit: any; }) => {
            if (e.hasHit && !landed) {
                setLanded(true)
            }
        },
        [position]
    )

    useEffect(() => {
        if (inAir && landed) {
            setCharacterState((prevState) => ({
                ...prevState,
                inAir: false,
                animation: 'landing',
                isLanding: true,
            }))
        }
    }, [landed, inAir])

    useEffect(() => {
        setCharacterState((prevState) => ({
            ...prevState,
            isMoving: up || down || left || right,
        }))
    }, [up, down, left, right])

    useEffect(() => {
        if (isJumping || inAir) {
            return
        }
        const newState = {
            animation: getAnimationFromUserInputs(inputs),
            isJumping: false,
        }

        if (jump && !jumpPressed) {
            newState.animation = 'jump'
            newState.isJumping = true
        }

        // let landing animation playout if we're still landing
        if (isLanding && newState.animation === 'idle') {
            return
        }

        setCharacterState((prevState) => ({
            ...prevState,
            isLanding: false,
            ...newState,
        }))
    }, [up, down, left, right, jump, isMouseLooking, isJumping, inAir])

    useEffect(() => {
        let timer = 0 as any
        const checker = () => {
            setCharacterState((prevState) => ({
                ...prevState,
                isJumping: false,
                inAir: true,
                animation: 'inAir',
            }))
        }
        if (characterState.isJumping) {
            // play 200ms of jump animation then transition to inAir
            timer = setTimeout(checker, 200)
        }
        return () => {
            clearTimeout(timer)
        }
    }, [characterState.isJumping])

    useEffect(() => {
        if (!mixer) {
            return
        }
        const onMixerFinish = () => {
            setCharacterState((prevState) => ({
                ...prevState,
                isJumping: false,
                inAir: false,
                isLanding: false,
                animation: 'idle',
            }))
        }

        mixer.addEventListener('finished', onMixerFinish)

        return () => {
            mixer.removeEventListener('finished', onMixerFinish)
        }
    }, [mixer])

    return characterState
}


export function useInputEventManager(container = document.body) {
    const [subscriptions, setSubscriptions] = useState({} as any)

    const subscribe = (eventName: string, key: string, subscribeFn: (_: any) => any) => {
        setSubscriptions((prevState: any) => ({
            ...prevState,
            [eventName]: {
                ...prevState[eventName],
                [key]: subscribeFn,
            },
        }))
    }

    const unsubscribe = (eventName: string, key: string) => {
        setSubscriptions((prevState: any) => {
            delete prevState?.[eventName]?.[key]
            return prevState
        })
    }

    const makeEventHandler = (eventName: string) => (event: Event) => {
        const handlers = subscriptions[eventName] ?? {}
        const subscribers = Object.values(handlers)
        subscribers.forEach((sub: any) => sub(event))
    }

    const keydownHandler = makeEventHandler("keydown")
    const keyupHandler = makeEventHandler("keyup")
    const wheelHandler = makeEventHandler("wheel")
    const pointerdownHandler = makeEventHandler("pointerdown")
    const pointerupHandler = makeEventHandler("pointerup")
    const pointermoveHandler = makeEventHandler("pointermove")
    const pointercancelHandler = makeEventHandler("pointercancel")
    const pointerlockchangeHandler = makeEventHandler("pointerlockchange")
    const pointerlockerrorHandler = makeEventHandler("pointerlockerror")
    const contextmenuHandler = makeEventHandler("contextmenu")

    const setupEventListeners = () => {
        window.addEventListener("keydown", keydownHandler)
        window.addEventListener("keyup", keyupHandler)

        container.addEventListener("wheel", wheelHandler)
        container.addEventListener("pointerdown", pointerdownHandler)
        container.addEventListener("pointerup", pointerupHandler)
        container.addEventListener("pointermove", pointermoveHandler)
        container.addEventListener("pointercancel", pointercancelHandler)
        container.addEventListener("contextmenu", contextmenuHandler)

        document.addEventListener("pointerlockchange", pointerlockchangeHandler)
        document.addEventListener("pointerlockerror", pointerlockerrorHandler)

        return () => {
            window.removeEventListener("keydown", keydownHandler)
            window.removeEventListener("keyup", keyupHandler)

            container.removeEventListener("wheel", wheelHandler)
            container.removeEventListener("pointerdown", pointerdownHandler)
            container.removeEventListener("pointerup", pointerupHandler)
            container.removeEventListener("pointermove", pointermoveHandler)
            container.removeEventListener("pointercancel", pointercancelHandler)
            container.removeEventListener("contextmenu", contextmenuHandler)

            document.removeEventListener(
                "pointerlockchange",
                pointerlockchangeHandler
            )
            document.removeEventListener("pointerlockerror", pointerlockerrorHandler)
        }
    }

    useEffect(setupEventListeners, [subscriptions, container])

    return {
        subscribe,
        unsubscribe,
    }
}

export const defaultMap = {
    up: "w",
    down: "s",
    right: "d",
    left: "a",
    jump: " ",
    walk: "Shift",
}

export const getInputFromKeyboard = (keyMap: { [key: string]: string }, keyPressed: string) => {
    let inputFound = ""
    Object.entries(keyMap).forEach(([k, v]) => {
        if (v === keyPressed) {
            inputFound = k
        }
    })
    return inputFound
}

export type InputManager = {
    unsubscribe: (eventName: string, key: string) => void
    subscribe: (eventName: string, key: string, subscribeFn: (_: any) => any) => void
}

export function useKeyboardInput(inputManager: InputManager, userKeyMap = {}) {
    const [isMouseLooking, setIsMouseLooking] = useState(false)
    const [inputsPressed, setInputsPressed] = useState({})
    const keyMap = {
        ...defaultMap,
        ...userKeyMap,
    }

    function downHandler({ key = '' }) {
        const input = getInputFromKeyboard(keyMap, key)
        if (input) {
            setInputsPressed((prevState) => ({
                ...prevState,
                [input]: true,
            }))
        }
    }

    const upHandler = ({ key = '' }) => {
        const input = getInputFromKeyboard(keyMap, key)
        if (input) {
            setInputsPressed((prevState) => ({
                ...prevState,
                [input]: false,
            }))
        }
    }

    function pointerdownHandler({ button = 0 }) {
        if (button === 2) {
            setIsMouseLooking(true)
        }
    }

    const pointerupHandler = ({ button = 0 }) => {
        if (button === 2) {
            setIsMouseLooking(false)
        }
    }

    useEffect(() => {
        inputManager.subscribe("keydown", "character-controls", downHandler)
        inputManager.subscribe("keyup", "character-controls", upHandler)
        inputManager.subscribe(
            "pointerdown",
            "character-controls",
            pointerdownHandler
        )
        inputManager.subscribe("pointerup", "character-controls", pointerupHandler)

        return () => {
            inputManager.unsubscribe("keydown", "character-controls")
            inputManager.unsubscribe("keyup", "character-controls")
            inputManager.unsubscribe("pointerdown", "character-controls")
            inputManager.unsubscribe("pointerup", "character-controls")
        }
    }, [])

    return { ...inputsPressed, isMouseLooking }
}


export function useRay({
    rayVector = { current: new THREE.Vector3() },
    position = [0, 0, 0],
    collisionFilterMask = 1,
}) {
    const rayChecker = useRef(setTimeout)
    const from = [position[0], position[1], position[2]] as Triplet
    const to = [rayVector.current.x, rayVector.current.y, rayVector.current.z] as Triplet
    const [ray, setRay] = useState({})
    useRaycastClosest(
        {
            from,
            to,
            skipBackfaces: true,
            collisionFilterMask: 1,
        },
        (e: { hasHit: any; distance: any; }) => {
            // clearTimeout(rayChecker.current);
            setRay({
                hasHit: e.hasHit,
                distance: e.distance,
            })
            // this callback only fires constantly on collision so this
            // timeout resets state once we've stopped colliding
            // rayChecker.current = setTimeout(() => {
            //   setRay({});
            // }, 100);
        },
        [from, to]
    )

    return ray
}

//@ts-ignore
export const FBX_LOADER = new FBXLoader()
//@ts-ignore
export const GLTF_LOADER = new GLTFLoader()

export const keys = [
    'idle',
    'walk',
    'run',
    'jump',
    'landing',
    'inAir',
    'backpedal',
    'turnLeft',
    'turnRight',
    'strafeLeft',
    'strafeRight',
]

export type Callback = (value: string, index: number, array: string[]) => void;
export type AnimationPaths = {
    [key in typeof keys[number]]: string
}

export async function asyncForEach(array: string[], callback: Callback) {
    for (let index = 0; index < array.length; index++) {
        await callback(array[index], index, array)
    }
}

export function loadModelSync(url: string, loader: any) {
    return new Promise((resolve, reject) => {
        loader.load(url, (data: any) => resolve(data), null, reject)
    })
}

export function useThirdPersonAnimations(
    characterObj = new Object3D(),
    animationPaths = {} as AnimationPaths,
    onLoad = () => {
    }
) {
    const ref = useRef<any>({})
    const [clips, setClips] = useState<THREE.AnimationClip[]>([])
    const [actualRef, setRef] = useState(ref)
    const [mixer, setMixer] = useState(new AnimationMixer(new THREE.Object3D()))
    const lazyActions = useRef<any>({})
    const [animations, setAnimations] = useState({} as { [key in typeof keys[number]]: any })

    // set character obj + mixer for character
    useEffect(() => {
        if (characterObj) {
            setRef({ current: characterObj })
            setMixer(new AnimationMixer(new THREE.Object3D()))
        }
    }, [characterObj.name])

    // load animations async initially
    useEffect(() => {
        const loadAnimations = async () => {
            const newAnimations = {} as { [key in typeof keys[number]]: any }

            await asyncForEach(keys, async (key) => {
                const fileExt = animationPaths[key].split('.').pop()
                const loader = fileExt === 'fbx' ? FBX_LOADER : GLTF_LOADER
                const model = await loadModelSync(animationPaths[key], loader)
                newAnimations[key] = model
            })
            setAnimations(newAnimations)
            onLoad()
        }

        loadAnimations()
    }, [])

    // set clips once animations are loaded
    useEffect(() => {
        const clipsToSet = [] as THREE.AnimationClip[]

        Object.keys(animations).forEach((name) => {
            if (animations[name]?.animations?.length) {
                animations[name].animations[0].name = name
                clipsToSet.push(animations[name].animations[0])
            }
        })

        if (clips.length < clipsToSet.length) {
            setClips(clipsToSet)
        }
    }, [animations])

    const api = useMemo(() => {
        if (!mixer || !clips.length) {
            return {
                actions: {},
            }
        }
        const actions = {}
        clips.forEach((clip) =>
            Object.defineProperty(actions, clip.name, {
                enumerable: true,
                get() {
                    if (actualRef.current) {
                        lazyActions.current[clip.name] = mixer.clipAction(
                            clip,
                            actualRef.current
                        )

                        const clampers = ['jump', 'landing']
                        if (clampers.includes(clip.name)) {
                            lazyActions.current[clip.name].setLoop(2200) // 2200 = THREE.LoopOnce
                            lazyActions.current[clip.name].clampWhenFinished = true
                        }

                        return lazyActions.current[clip.name]
                    }

                    return null
                },
            })
        )
        return {
            ref: actualRef,
            clips,
            actions,
            names: clips.map((c) => c.name),
            mixer,
        }
    }, [clips, characterObj.name, mixer])

    useEffect(() => {
        const currentRoot = actualRef.current
        return () => {
            // Clean up only when clips change, wipe out lazy actions and uncache clips
            lazyActions.current = {}
            Object.values(api.actions).forEach((action: any) => {
                if (currentRoot) {
                    mixer.uncacheAction(action, currentRoot)
                }
            })
        }
    }, [clips])

    useFrame((_, delta) => {
        mixer.update(delta)
    })

    return api
}

/*
 * Based on code written by knav.eth for chainspace (https://somnet.chainrunners.xyz/chainspace)
 */
const CameraControlOperation = {
    NONE: -1,
    ROTATE: 0,
    TOUCH_ROTATE: 3,
    TOUCH_ZOOM_ROTATE: 6,
}

const ROTATION_ANGLE = new THREE.Vector3(0, 1, 0)

class CameraState {
    operation = CameraControlOperation.NONE
    pointers = [] as any[]
    pointerPositions = {} as any

    reset() {
        this.operation = CameraControlOperation.NONE
        this.pointers = []
        this.pointerPositions = {}
    }
}

class ThirdPersonCameraControls {
    enabled = true
    // How far you can zoom in and out ( PerspectiveCamera only )
    minDistance = 0
    maxDistance = Infinity

    // How far you can orbit vertically, upper and lower limits.
    // Range is 0 to Math.PI radians.
    minPolarAngle = 0
    maxPolarAngle = Math.PI

    enableZoom = true
    zoomSpeed = 1.75

    enableRotate = true
    rotateSpeed = 1.0

    // "target" sets the location of focus, where the object orbits around
    targetOffset = new THREE.Vector3(0, 0, 0)

    spherical = new THREE.Spherical(3.5, Math.PI / 3, Math.PI)

    rotateStart = new THREE.Vector2()
    rotateEnd = new THREE.Vector2()
    rotateDelta = new THREE.Vector2()

    zoomStart = new THREE.Vector2()
    zoomEnd = new THREE.Vector2()
    zoomDelta = new THREE.Vector2()

    outerCameraContainer = new THREE.Object3D()

    camera
    cameraState
    cameraContainer
    domElement
    input: { [key: string]: any }
    target
    cameraCollisionOn
    lastCheck: number | undefined
    rightClickTime: number | undefined

    constructor(
        camera = new THREE.PerspectiveCamera(),
        domElement = document.body,
        target = new THREE.Object3D(),
        inputManager = {} as any,
        options = {} as any,
        cameraContainer = new THREE.Object3D()
    ) {
        this.camera = camera
        this.cameraState = new CameraState()
        this.cameraContainer = cameraContainer
        this.domElement = domElement

        this.input = {}
        const k = 'camera'
        inputManager.subscribe('wheel', k, this.handleMouseWheel.bind(this))
        inputManager.subscribe(
            'pointerlockchange',
            k,
            this.onPointerLockChange.bind(this)
        )
        inputManager.subscribe('pointerdown', k, this.onPointerDown.bind(this))
        inputManager.subscribe('pointerup', k, this.onPointerUp.bind(this))
        inputManager.subscribe('pointermove', k, this.onPointerMove.bind(this))
        inputManager.subscribe('pointercancel', k, this.onPointerCancel.bind(this))
        inputManager.subscribe('pointerlockerror', k, (e: any) =>
            console.error('POINTERLOCK ERROR ', e)
        )
        inputManager.subscribe('contextmenu', k, this.onContextMenu.bind(this))
        this.cameraCollisionOn = options?.cameraCollisionOn
        this.targetOffset.y = options?.yOffset ?? 1.6
        this.outerCameraContainer.position.copy(this.targetOffset)
        this.outerCameraContainer.add(this.cameraContainer)

        this.target = target
        this.target.add(this.outerCameraContainer)
    }

    _cameraPos = new THREE.Vector3()
    _raycastTargetVector = new THREE.Vector3()

    getCameraPosition(rayResult: any) {
        this.cameraContainer.position.setFromSphericalCoords(
            this.spherical.radius,
            this.spherical.phi,
            this.spherical.theta
        )

        if (rayResult.hasHit && this.cameraCollisionOn) {
            this.cameraContainer.position.setFromSphericalCoords(
                rayResult.distance - 0.1,
                this.spherical.phi,
                this.spherical.theta
            )
        }

        this.cameraContainer.getWorldPosition(this._cameraPos)
        return this._cameraPos
    }

    _workingVec = new THREE.Vector3()

    getCameraLookVec() {
        this.target.getWorldPosition(this._workingVec).add(this.targetOffset)
        return this._workingVec
    }

    _workingQuat = new THREE.Quaternion()

    update(rayResult: any) {
        if (this.input.isMouseLooking) {
            this._workingQuat.setFromAxisAngle(
                ROTATION_ANGLE,
                this.spherical.theta - Math.PI
            )

            this.target.quaternion.multiply(this._workingQuat)
            this.spherical.theta = Math.PI
        }

        // restrict phi to be between desired limits
        this.spherical.phi = Math.max(
            this.minPolarAngle,
            Math.min(this.maxPolarAngle, this.spherical.phi)
        )
        this.spherical.makeSafe()

        // restrict radius to be between desired limits
        this.spherical.radius = Math.max(
            this.minDistance,
            Math.min(this.maxDistance, this.spherical.radius)
        )

        // copy maths to actual three.js camera
        this.camera.position.copy(this.getCameraPosition(rayResult))
        this.camera.lookAt(this.getCameraLookVec())
    }

    getZoomScale() {
        return 0.95 ** this.zoomSpeed
    }

    rotateLeft(angle: number) {
        this.spherical.theta -= angle
    }

    rotateUp(angle: number) {
        this.spherical.phi -= angle
    }

    handleApplyRotate(speedMultiplier = 1) {
        this.rotateDelta
            .subVectors(this.rotateEnd, this.rotateStart)
            .multiplyScalar(this.rotateSpeed * speedMultiplier)

        const element = this.domElement

        this.rotateLeft((2 * Math.PI * this.rotateDelta.x) / element.clientHeight) // yes, height

        this.rotateUp((2 * Math.PI * this.rotateDelta.y) / element.clientHeight)

        this.rotateStart.copy(this.rotateEnd)
    }

    zoomOut(zoomScale: number) {
        this.spherical.radius /= zoomScale
    }

    zoomIn(zoomScale: number) {
        this.spherical.radius *= zoomScale
    }

    // Event Handlers
    handleMouseDownRotate(event: any) {
        this.rotateEnd.set(event.clientX, event.clientY)
        this.rotateStart.set(event.clientX, event.clientY)
    }

    handleMouseMoveRotate(event: any) {
        if (document.pointerLockElement === this.domElement) {
            this.rotateEnd.x += event.movementX * 0.25
            this.rotateEnd.y += event.movementY * 0.25 * 0.8
        } else {
            this.domElement.requestPointerLock()
            this.domElement.style.cursor = 'none'
            this.rotateEnd.set(event.clientX, event.clientY)
        }
        this.handleApplyRotate()
    }

    handleMouseWheel(event: any) {
        if (event.deltaY < 0) {
            this.zoomIn(this.getZoomScale())
        } else if (event.deltaY > 0) {
            this.zoomOut(this.getZoomScale())
        }
    }

    handleTouchStartRotate() {
        if (this.cameraState.pointers.length === 1) {
            this.rotateStart.set(
                this.cameraState.pointers[0].pageX,
                this.cameraState.pointers[0].pageY
            )
        } else {
            const x =
                0.5 *
                (this.cameraState.pointers[0].pageX +
                    this.cameraState.pointers[1].pageX)
            const y =
                0.5 *
                (this.cameraState.pointers[0].pageY +
                    this.cameraState.pointers[1].pageY)

            this.rotateStart.set(x, y)
        }
    }

    handleTouchStartZoom() {
        const dx =
            this.cameraState.pointers[0].pageX - this.cameraState.pointers[1].pageX
        const dy =
            this.cameraState.pointers[0].pageY - this.cameraState.pointers[1].pageY

        const distance = Math.sqrt(dx * dx + dy * dy)

        this.zoomStart.set(0, distance)
    }

    handleTouchStartZoomRotate() {
        if (this.enableZoom) this.handleTouchStartZoom()

        if (this.enableRotate) this.handleTouchStartRotate()
    }

    handleTouchMoveRotate(event: any) {
        if (this.cameraState.pointers.length === 1) {
            this.rotateEnd.set(event.pageX, event.pageY)
        } else {
            const position = this.getSecondPointerPosition(event)

            const x = 0.5 * (event.pageX + position.x)
            const y = 0.5 * (event.pageY + position.y)

            this.rotateEnd.set(x, y)
        }

        this.handleApplyRotate(1.3)
    }

    handleTouchMoveZoom(event: any) {
        const position = this.getSecondPointerPosition(event)

        const dx = event.pageX - position.x
        const dy = event.pageY - position.y

        const distance = Math.sqrt(dx * dx + dy * dy)

        this.zoomEnd.set(0, distance)

        this.zoomDelta.set(
            0,
            (this.zoomEnd.y / this.zoomStart.y) ** this.zoomSpeed
        )

        this.zoomOut(this.zoomDelta.y)

        this.zoomStart.copy(this.zoomEnd)
    }

    handleTouchMoveZoomRotate(event: any) {
        if (this.enableZoom) this.handleTouchMoveZoom(event)
        if (this.enableRotate) this.handleTouchMoveRotate(event)
    }

    // Event Controllers
    onPointerDown(event: any) {
        if (!this.enabled) return

        if (this.cameraState.pointers.length === 0) {
            this.domElement.setPointerCapture(event.pointerId)
        }

        this.addPointer(event)
        if (event.pointerType === 'touch') {
            this.onTouchStart(event)
        } else {
            this.onMouseDown(event)
        }
    }

    onPointerMove(event: any) {
        this.lastCheck = Date.now()
        if (!this.enabled) return
        if (!this.input.isMouseLocked && !this.cameraState.pointers.length) return
        if (
            !this.cameraState.pointers.find((e) => e.pointerId === event.pointerId)
        ) {
            return
        }

        if (event.pointerType === 'touch') {
            this.onTouchMove(event)
        } else {
            this.onMouseMove(event)
        }
    }

    onPointerUp(event: any) {
        if (event.pointerType === 'touch') {
            this.onTouchEnd()
        } else {
            this.onMouseUp()
        }

        this.removePointer(event)

        if (
            this.cameraState.pointers.length === 0 &&
            event.pointerType === 'touch'
        ) {
            this.domElement.releasePointerCapture(event.pointerId)
        }
    }

    // Touch
    onTouchStart(event: any) {
        this.trackPointer(event)

        switch (this.cameraState.pointers.length) {
            case 1:
                if (!this.enableRotate) return

                this.handleTouchStartRotate()
                this.input.isMouseLooking = true
                this.cameraState.operation = CameraControlOperation.TOUCH_ROTATE
                break

            case 2:
                if (!this.enableZoom && !this.enableRotate) return

                this.handleTouchStartZoomRotate()
                this.input.isMouseLooking = true
                this.cameraState.operation = CameraControlOperation.TOUCH_ZOOM_ROTATE
                break

            default:
                this.cameraState.operation = CameraControlOperation.NONE
        }
    }

    onTouchMove(event: any) {
        this.trackPointer(event)

        switch (this.cameraState.operation) {
            case CameraControlOperation.TOUCH_ROTATE:
                if (!this.enableRotate) return

                this.handleTouchMoveRotate(event)
                break

            case CameraControlOperation.TOUCH_ZOOM_ROTATE:
                if (!this.enableZoom && !this.enableRotate) return

                this.handleTouchMoveZoomRotate(event)
                break

            default:
                this.cameraState.operation = CameraControlOperation.NONE
        }
    }

    onTouchEnd() {
        this.cameraState.operation = CameraControlOperation.NONE
    }

    // Mouse
    onPointerLockChange() {
        // do initial check to see if mouse is locked
        this.input.isMouseLocked = document.pointerLockElement === this.domElement
        if (!this.input.isMouseLocked) {
            // wait 100ms and then check again as sometimes document.pointerLockElement
            // is null after doing a document.requestPointerLock()
            setTimeout(() => {
                this.input.isMouseLocked =
                    document.pointerLockElement === this.domElement
                if (!this.input.isMouseLocked) {
                    this.input.isMouseLooking = false
                    this.cameraState.operation = CameraControlOperation.NONE
                }
            }, 100)
        }
    }

    onMouseDown(event: any) {
        switch (event.button) {
            case 0:
                if (!this.enableRotate) return

                this.handleMouseDownRotate(event)
                this.cameraState.operation = CameraControlOperation.ROTATE
                break
            case 1:
                this.cameraState.operation = CameraControlOperation.NONE
                break
            case 2:
                if (!this.enableRotate) return
                this.input.isMouseLooking = true
                this.rightClickTime = Date.now()
                this.handleMouseDownRotate(event)
                this.cameraState.operation = CameraControlOperation.ROTATE
                break
            default:
                this.cameraState.operation = CameraControlOperation.NONE
        }
    }

    onMouseMove(event: any) {
        if (!this.enabled) return

        if (this.cameraState.operation === CameraControlOperation.ROTATE) {
            if (!this.enableRotate) return
            this.handleMouseMoveRotate(event)
        }
    }

    onMouseUp() {
        this.domElement.style.cursor = 'initial'
        document.exitPointerLock()
        this.input.isMouseLooking = false
    }

    onMouseWheel(event: any) {
        if (
            !this.enabled ||
            !this.enableZoom ||
            (this.cameraState.operation !== CameraControlOperation.NONE &&
                this.cameraState.operation !== CameraControlOperation.ROTATE)
        ) {
            return
        }
        this.handleMouseWheel(event)
    }

    // Pointer Utils
    getSecondPointerPosition(event: any) {
        const pointer =
            event.pointerId === this.cameraState.pointers[0].pointerId
                ? this.cameraState.pointers[1]
                : this.cameraState.pointers[0]

        return this.cameraState.pointerPositions[pointer.pointerId]
    }

    addPointer(event: any) {
        this.cameraState.pointers.push(event)
    }

    removePointer(event: any) {
        delete this.cameraState.pointerPositions[event.pointerId]

        for (let i = 0; i < this.cameraState.pointers.length; i++) {
            if (this.cameraState.pointers[i].pointerId === event.pointerId) {
                this.cameraState.pointers.splice(i, 1)
                return
            }
        }
    }

    trackPointer(event: any) {
        let position = this.cameraState.pointerPositions[event.pointerId]

        if (position === undefined) {
            position = new THREE.Vector2()
            this.cameraState.pointerPositions[event.pointerId] = position
        }

        position.set(event.pageX, event.pageY)
    }

    onPointerCancel(event: any) {
        this.removePointer(event)
    }

    onContextMenu(event: any) {
        if (!this.enabled) return
        event.preventDefault()
    }

    reset() {
        this.cameraState.reset()
        this.domElement.style.cursor = 'initial'
        try {
            document.exitPointerLock()
        } catch (e) {
            // lol
        }
    }

    dispose() {
        // remove event listeners here
    }
}

export function useThirdPersonCameraControls({
    camera = new THREE.PerspectiveCamera(),
    domElement = document.body,
    target = new THREE.Object3D(),
    inputManager = {},
    cameraOptions = {} as any,
    cameraContainer = { current: new THREE.Object3D() }
}) {
    const [controls, setControls] = useState<any>(null)

    useEffect(() => {
        if (!target) {
            return
        }
        const newControls = new ThirdPersonCameraControls(
            camera,
            domElement,
            target,
            inputManager,
            { yOffset: cameraOptions.yOffset || 0 },
            cameraContainer.current
        )

        newControls.minDistance = cameraOptions?.minDistance || 404
        newControls.maxDistance = cameraOptions?.maxDistance || 808
        setControls(newControls)
        return () => {
            newControls.dispose()
        }
    }, [camera, domElement, target])

    return controls
}