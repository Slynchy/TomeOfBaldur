import { SAVE_KEYS } from "../Constants/SaveKeys";
import { ENGINE_DEBUG_MODE, GAME_DEBUG_MODE } from "../../engine/Constants/Constants";

class PlayerDataSingletonClass {
    // shared saved data

    // Properties
    private _initialized: boolean = false;

    private _dirty: Array<SAVE_KEYS> = [];

    constructor() {}

    public isInitialized(): boolean {
        return this._initialized;
    }

    public dirtify(key: (string | SAVE_KEYS) | (string[] | SAVE_KEYS[])): void {
        if(Array.isArray(key)) {
            this._dirty.push(...(key as SAVE_KEYS[]));
        } else {
            this._dirty.push(key as SAVE_KEYS);
        }
    }

    public isDirty(): boolean {
        return this._dirty.length > 0;
    }

    initialize(_data: Record<string, unknown>): void {
        const data = _data || {} as Record<string, unknown>;
        if (this.isInitialized()) {
            console.warn("PlayerDataSingleton being initialized multiple times");
        }
        this._initialized = true;
    }

    public export(_exportAll: boolean = false): { [key: string]: unknown } {
        const retVal: { [key: string]: unknown } = {};

        // shared settings
        this._dirty = [];
        return retVal;
    }

    public resetAllData(): void {
        // HACK
        try {
            window.localStorage.clear();
        } catch(err) {
            console.error(err);
        }
        // HACK

        PlayerDataSingleton = new PlayerDataSingletonClass();
    }
}

export let PlayerDataSingleton = new PlayerDataSingletonClass();

if(GAME_DEBUG_MODE || ENGINE_DEBUG_MODE) {
    // @ts-ignore
    window["PlayerDataSingleton"] = PlayerDataSingleton;
}
