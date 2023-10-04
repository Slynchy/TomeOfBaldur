import {DisplayObject} from "pixi.js";

export function bringToFront<T extends DisplayObject>(_target: T) {
    if(_target.parent) {
        const parent = _target.parent;
        parent.removeChild(_target);
        parent.addChild(_target);
    }
}