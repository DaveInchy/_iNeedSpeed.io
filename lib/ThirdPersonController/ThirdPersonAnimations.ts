import { AdditiveAnimationBlendMode, AnimationAction, AnimationClip } from "three";
import { MutableRefObject, useRef } from "react";

/* A AnimationPlayer is a class that controls the animation of a model with react-three/fiber and threejs.
 * It has function calls for movement, which would be the animations on the spot.
 * It can also direct function calls for certain movement to a InputController that can then use the react-three/rapier physics engine to move the player accordingly.
 * AnimationPlayer is part of an extended class chain that handles the player itself in a jsx component for the player and physics body.
 * * * */

export default class AnimationPlayer
{
    clip: AnimationAction | undefined;
    mixer: THREE.AnimationMixer | undefined;

    public constructor(
        public startIndex: number = 7,
        public actionList: Array<{ action: THREE.AnimationAction, name: string }> = new Array<{ action: THREE.AnimationAction, name: string }>(),
        // eslint-disable-next-line react-hooks/rules-of-hooks
        public groupRef: MutableRefObject<THREE.Group | undefined> = useRef(undefined),
        public init?: (self: AnimationPlayer) => Promise<void>,
        public render?: (self: AnimationPlayer) => void | true | false,
        public clear?: (self: AnimationPlayer) => Promise<void | any>,
    ){
        const exec = (
            startId: number = 50,
            animList: Array<{ action: THREE.AnimationAction, name: string }> = new Array<{ action: THREE.AnimationAction, name: string }>(),
            // eslint-disable-next-line react-hooks/rules-of-hooks
            forwardRef: MutableRefObject<THREE.Group | undefined> = useRef(undefined),
        ) => {

            this.play(startId);

            // log each animation action name and index in the list so it can be queued later console.log
            animList.forEach((obj, id) => {
                console.log("[AnimPlayer]", `animation ${id} is ${obj.name}`);
            });

            if(this.init !== undefined) {
                this.init(this).then(async () => {
                    console.log("[AnimPlayer]", `initializing user call.`);

                    const stopLoop = (frame: number) => {
                        if (this.clear !== undefined) {
                            this.clear(this).then(async () => {
                                console.log("[AnimPlayer]", `finishing cleanup`);
                            }).catch(e => {
                                throw new Error(e);
                            })
                        };
                        return cancelAnimationFrame(frame);
                    }

                    const runLoop = (frame?: number) => {
                        if (frame === undefined) {
                            frame = 0;
                        }
                        if (this.render !== undefined) {
                            let a = this.render(this);
                            if (a === true) {
                                stopLoop(frame);
                            }
                        }
                        return requestAnimationFrame(runLoop);
                    }
                }).catch(e => {
                    throw new Error(e);
                });
            }
            return this;
        }
        return exec(this.startIndex, this.actionList, this.groupRef);
    }

    assignActions = (action: AnimationAction, name: string) => {
        const a = action;
        const n = name;

        const obj = {
            action: a,
            name: n,
        };

        let index = this.actionList.push(obj);

        return [index, obj] as [index: number, obj: { action: AnimationAction, name: string }];
    }

    play(index: string | number) {
        this.actionList.forEach(async (obj, id) => {
            let { action, name } = obj;

            if (!action) return;
            if (!name) return;

            if (typeof index === "string" ? !name.includes(new String(index) as string) : (id) !== index) {
                return;
            }

            console.log("[AnimPlayer]", `${this.clip} transition into ${action}`);

            if (!this.clip) this.clip = action;

            action.clampWhenFinished = true;
            action.loop = 2201;
            action.zeroSlopeAtStart = true;
            action.startAt(2);

            if (this.clip.isRunning()) this.clip?.stop().reset().startAt(1);
            this.clip = action.crossFadeFrom(this.clip, 0.5, false);
            this.clip.play();
        });

        return this.clip;
    }

    stop() {
        if (this.clip?.fadeOut(0.5).stop().reset().startAt(1)) {
            return true;
        }
        return false;
    }
}

