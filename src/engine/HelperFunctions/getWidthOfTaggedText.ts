import TaggedText from "pixi-tagged-text";
import { IVector2 } from "../Types/IVector2";
import { Container, Text } from "pixi.js";

export function getDimensionsOfTaggedText(_target: TaggedText): IVector2 {
    const res: IVector2 = {x: 0, y: 0};
    // const lowestValues: IVector2 = {x: 0, y: 0};

    const childContainers: Container[] = _target.children as Container[];
    const childTexts: Text[] = [];
    childContainers.forEach((e) => {
        childTexts.push(...e.children as Text[]);
    });

    childTexts.forEach((e) => {
        const x = e.x + (e.width * e.anchor.x);
        const y = e.y + (e.height * e.anchor.y);

        // if(x < lowestValues.x) {
        //     lowestValues.x = x;
        // }
        // if(y < lowestValues.y) {
        //     lowestValues.y = y;
        // }

        if(x > res.x) {
            res.x = x;
        }
        if(y > res.y) {
            res.y = y;
        }
    });

    // res.x = lowestValues.x + res.x;
    // res.y = lowestValues.y + res.y;

    return res;
}