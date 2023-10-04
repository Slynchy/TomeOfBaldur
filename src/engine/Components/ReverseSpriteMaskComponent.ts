import { Component } from "../Component";
import { ReverseSpriteMaskShader } from "../../../lib/ReverseSpriteMaskShader";
import { Sprite, Graphics, SpriteMaskFilter } from "pixi.js";
import { System } from "../Systems/System";
import { ReverseSpriteMaskSystem } from "../Systems/ReverseSpriteMaskSystem";
import { GAME_DEBUG_MODE } from "../Constants/Constants";
import { GameObject } from "../GameObject";

export class ReverseSpriteMaskComponent extends Component {

    public static readonly id: string = "ReverseSpriteMaskComponent";
    public static readonly _system: typeof System = ReverseSpriteMaskSystem;

    private _mask: Sprite;
    private _filter: SpriteMaskFilter;
    private _cachedParent: GameObject;

    /**
     * @param _mask
     */
    constructor(_mask: Sprite) {
        super();
        this._filter = new SpriteMaskFilter(
            undefined,
            ReverseSpriteMaskShader
        );
        this._filter.maskSprite = _mask;
        this._mask = _mask;
    }

    public set mask(_val: Sprite) {
        this._mask = _val;
    }

    onAttach(): void {
        this._cachedParent = this.parent.parent as GameObject || null;

        this.parent.addChild(this._mask);

        if(GAME_DEBUG_MODE) {
            // const graph = new Graphics()
            //     .beginFill(0xffff00)
            //     .drawCircle(0, 0, 15)
            //     .endFill();
            // this.parent.addChild(graph);
        }

        if(!this._cachedParent) return;

        if(!this.parent.parent.filters) {
            this.parent.parent.filters = [this._filter];
        } else if(this.parent.parent.filters.indexOf(this._filter) === -1) {
            this.parent.parent.filters.push(this._filter);
        } else {
            // nothing
        }
    }

    onComponentAttached(_componentId: string, _component: Component): void {
    }

    onDetach(): void {
        this.parent.removeChild(this._mask);
        const ind = this.parent.filters.indexOf(this._filter);
        if(ind !== -1) {
            this.parent.filters.splice(
                ind,
                1
            );
        }
    }

}
