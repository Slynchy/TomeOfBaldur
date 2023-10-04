import { System } from "./System";
import { ENGINE_DEBUG_MODE } from "../Constants/Constants";
import { ReverseSpriteMaskComponent } from "../Components/ReverseSpriteMaskComponent";

export class ReverseSpriteMaskSystem extends System {
    constructor() {
        super();
    }

    public static destroy(_component: ReverseSpriteMaskComponent): void {
    }

    public static onAwake(_component: ReverseSpriteMaskComponent): void {
    }

    public static onStep(_dt: number, _component: ReverseSpriteMaskComponent): void {
        if(_component["_cachedParent"] !== _component.parent.parent) {
            if(_component["_mask"].parent) {
                _component["_mask"].parent.removeChild(_component["_mask"]);
            }
            _component.onAttach();
        }
    }

    public static onDestroy(_component: ReverseSpriteMaskComponent): void {
    }

    public static onEnable(_component: ReverseSpriteMaskComponent): void {
    }

    public static onDisable(_component: ReverseSpriteMaskComponent): void {
    }
}
