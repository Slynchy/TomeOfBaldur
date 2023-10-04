import { Component, System } from "../../tsthree";
import { ENGINE_DEBUG_MODE } from "../../engine/Constants/Constants";


export class TutorialStageSystem extends System {


    public static destroy(_component: Component): void {
        this.onDestroy(_component);
    }

    public static onAwake(_component: Component): void {
    }

    public static onStep(_dt: number, _component: Component): void {
    }

    public static onDestroy(_component: Component): void {
    }

    public static onEnable(_component: Component): void {
    }

    public static onDisable(_component: Component): void {
    }
}