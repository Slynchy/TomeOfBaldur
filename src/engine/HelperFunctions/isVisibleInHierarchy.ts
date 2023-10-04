import {DisplayObject} from "pixi.js";

export function isVisibleInHierarchy<T extends DisplayObject>(_target: T): boolean {
    if(!_target.visible) return false;

    let parent = _target.parent;
    while(parent !== null) {
        if(!parent.visible) return false;
        parent = parent.parent;
    }
    return true;
}