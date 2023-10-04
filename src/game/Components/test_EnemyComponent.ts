import { Component, System } from "../../tsthree";
import { Test_EnemySystem } from "../Systems/test_EnemySystem";
import { AnimatedSprite, FrameObject, Resource, Texture } from "pixi.js";

interface IEnemyFrameObjs {
    "default": Texture<Resource>[],
    "walk_up": Texture<Resource>[],
    "walk_down": Texture<Resource>[],
    "walk_left": Texture<Resource>[],
    "walk_right": Texture<Resource>[],
}

export class Test_EnemyComponent extends Component {
    public static readonly id: string = "Test_EnemyComponent";
    protected static readonly _system: typeof Test_EnemySystem = Test_EnemySystem;

    public frameObjsRef: IEnemyFrameObjs;
    public animSpr: AnimatedSprite;

    constructor(_settings: {
        frameObjs: IEnemyFrameObjs
    }) {
        super();
        this.frameObjsRef = _settings.frameObjs;
        this.animSpr = new AnimatedSprite(this.frameObjsRef.default);
        this.animSpr.anchor.set(0.5);
    }

    onAttach(): void {
        this.parent.addChild(this.animSpr);
    }

    onComponentAttached(_componentId: string, _component: Component): void {
    }

    onDetach(): void {
        this.animSpr.parent.removeChild(this.animSpr);
    }

}