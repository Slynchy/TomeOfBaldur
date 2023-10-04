import { IVector2 } from "../Types/IVector2";
import { GameObject } from "../GameObject";
import { DisplayObject } from "pixi.js";

export function getPositionRelativeToParent(
    _child: DisplayObject,
    _parent: DisplayObject,
): IVector2 {
    const res = {x: _child.position.x, y: _child.position.y};

    let currParent = _child.parent;
    while(currParent !== _parent && Boolean(currParent)) {
        res.x += currParent.position.x;
        res.y += currParent.position.y;
        currParent = currParent.parent;
    }

    return res;
}
