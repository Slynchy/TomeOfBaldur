import { SAVE_KEYS } from "../Constants/SaveKeys";
import { PlayerDataSingleton } from "./PlayerDataSingleton";
import { ENGINE_DEBUG_MODE } from "../../engine/Constants/Constants";

export class SavedDataUpgradeFunctions {

    // Inner array is format of [...fromVersions, toVersion]
    public static readonly versions: Array<Array<string>> = [
        ["0.*.*",
            "1.0.0"],
    ];

    public static readonly versionsToFunctions: Record<string, Function> = {
        "1.0.0": SavedDataUpgradeFunctions.up_100,
    };

    constructor() {
        throw new Error("Static class not meant for instantiation");
    }

    private static up_100(_pdataSingleton: typeof PlayerDataSingleton): void {
        // do nothing
    }

    public static upgradeData(
        _playerDataSingleton: (typeof PlayerDataSingleton),
        _toVersion: string,
    ): void {
        const fromStr = "0.0.0";
        console.error("fixme! _playerDataSingleton.getGameVersionStr();");
        if(fromStr === _toVersion) {
            if(ENGINE_DEBUG_MODE) {
                console.log("[SavedDataUpgradeFunctions] Skipping upgrade from %s", fromStr);
            }
            return;
        }

        const toSplit = _toVersion.split(".");
        const toMajor = toSplit[0];
        const toMinor = toSplit[1];
        const toPatch = toSplit[2];
        const fromSplit = (fromStr).split(".");
        const fromMajor = fromSplit[0];
        const fromMinor = fromSplit[1];
        const fromPatch = fromSplit[2];

        if(ENGINE_DEBUG_MODE) {
            console.log("[SavedDataUpgradeFunctions] Upgrading from %s to %s", fromStr, _toVersion);
        }

        const versionData = SavedDataUpgradeFunctions.versions.find((e) => {
            return e[e.length - 1] === _toVersion;
        });
        const versionFunc = SavedDataUpgradeFunctions.versionsToFunctions[_toVersion];

        if(!versionData || !versionFunc) {
            console.error("Missing version data/function!");
            return;
        }

        if(
            !versionData.find((e) => {
                return fromStr.match(e);
            })
        ) {
            console.warn(
                "There isn't a valid upgrade path from %s to %s, skipping...",
                fromStr,
                _toVersion
            );
            return;
        }

        // run versionFunc
        versionFunc(_playerDataSingleton);
        // _playerDataSingleton.setGameVersionStr(__VERSION);

        if(ENGINE_DEBUG_MODE) {
            console.log("[SavedDataUpgradeFunctions] Upgraded from %s to %s", fromStr, __VERSION);
        }

        return;
    }


}