import { DisplayObject, Point } from "pixi.js";

export function getScreenSpacePosition(displayObject: DisplayObject): Point {
    const screenSpacePosition = displayObject.getGlobalPosition(new Point());
    return screenSpacePosition;
}