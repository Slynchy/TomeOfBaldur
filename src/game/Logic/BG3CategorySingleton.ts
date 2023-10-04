import { TDataTypeBG3, TRarity } from "../Types/SharedTypes";
import { IJsonBG3Entry, TJsonBG3 } from "../Types/IJsonBg3";
import { GAME_DEBUG_MODE } from "../../engine/Constants/Constants";

export enum BG3Categories {
    UNKNOWN,

    // items by slot
    Amulets,
    Rings,
    Helmets,
    Cloaks,
    Gloves,
    Boots,
    Chests,
    Underwear,
    "Ranged Main Weapon",
    "Melee Main Weapon",
    "Melee Offhand Weapon",
    VanityBody,
    VanityBoots,
    MusicalInstrument,

    // items by Armor Class
    LightArmour,
    MedArmour,
    HeavyArmour,
    Shields,

    // items by rarity
    UncommonRarity,
    RareRarity,
    VeryRareRarity,
    LegendaryRarity,

    // spells by school
    // SchoollessSpells,
    // EvocationSpells,
    // EnchantmentSpells,
    // NecromancySpells,
    // ConjurationSpells,
    // TransmutationSpells,
    // IllusionSpells,

}

export class BG3CategorySingleton {
    constructor() {}

    static categories: Record<BG3Categories, string[]> = {

        [BG3Categories.UNKNOWN]: [],
        [BG3Categories.Amulets]: [],
        [BG3Categories.Rings]: [],
        [BG3Categories.VanityBody]: [],
        [BG3Categories.VanityBoots]: [],
        [BG3Categories["Ranged Main Weapon"]]: [],
        [BG3Categories["Melee Main Weapon"]]: [],
        // [BG3Categories["Ranged Offhand Weapon"]]: [],
        [BG3Categories["Melee Offhand Weapon"]]: [],
        [BG3Categories.Helmets]: [],
        [BG3Categories.Cloaks]: [],
        [BG3Categories.Gloves]: [],
        [BG3Categories.Boots]: [],
        [BG3Categories.Underwear]: [],
        [BG3Categories.Chests]: [],
        [BG3Categories.MusicalInstrument]: [],

        [BG3Categories.LightArmour]: [],
        [BG3Categories.MedArmour]: [],
        [BG3Categories.HeavyArmour]: [],
        [BG3Categories.Shields]: [],

        // [BG3Categories.CommonRarity]: [],
        [BG3Categories.UncommonRarity]: [],
        [BG3Categories.RareRarity]: [],
        [BG3Categories.VeryRareRarity]: [],
        [BG3Categories.LegendaryRarity]: [],

        // [BG3Categories.SchoollessSpells]: [],
        // [BG3Categories.EvocationSpells]: [],
        // [BG3Categories.EnchantmentSpells]: [],
        // [BG3Categories.NecromancySpells]: [],
        // [BG3Categories.ConjurationSpells]: [],
        // [BG3Categories.TransmutationSpells]: [],
        // [BG3Categories.IllusionSpells]: [],
    };
    static initialized: boolean = false;

    public static isInitialized(): boolean { return BG3CategorySingleton.initialized; }

    public static async initialize(
        _dataJSON: TJsonBG3
    ): Promise<void> {
        if(BG3CategorySingleton.isInitialized()) {
            console.warn("BG3CategorySingleton is already initialized");
            return;
        }

        const cats = BG3CategorySingleton.categories;
        const json = _dataJSON;
        Object.keys(_dataJSON)
            .forEach((e) => {
                const data = json[e];
                if(!data.type)
                    return;

                if(data.type === "Weapon" || data.type === "Armor") {
                    let rootSlotData: IJsonBG3Entry | null = data;
                    let rootProfData: IJsonBG3Entry | null = data;
                    while(
                        rootSlotData &&
                        rootSlotData.inheritsFrom &&
                        !rootSlotData.otherData["Slot"]
                    ) {
                        rootSlotData = _dataJSON[rootSlotData.inheritsFrom];
                    }
                    while(
                        rootProfData &&
                        rootProfData.inheritsFrom &&
                        !rootProfData.otherData["Proficiency Group"]
                    ) {
                        rootProfData = _dataJSON[rootProfData.inheritsFrom];
                    }
                    if(rootSlotData) {
                        switch(rootSlotData.otherData["Slot"]) {
                            case "MusicalInstrument":
                                cats[BG3Categories["MusicalInstrument"]].push(e);
                                break;
                            case "VanityBody":
                                cats[BG3Categories["VanityBody"]].push(e);
                                break;
                            case "VanityBoots":
                                cats[BG3Categories["VanityBoots"]].push(e);
                                break;
                            case "Melee Offhand Weapon":
                                cats[BG3Categories["Melee Offhand Weapon"]].push(e);
                                break;
                            // case "Ranged Offhand Weapon":
                            //     cats[BG3Categories["Ranged Offhand Weapon"]].push(e);
                            //     break;
                            case "Melee Main Weapon":
                                cats[BG3Categories["Melee Main Weapon"]].push(e);
                                break;
                            case "Ranged Main Weapon":
                                cats[BG3Categories["Ranged Main Weapon"]].push(e);
                                break;
                            case "Breast":
                                cats[BG3Categories.Chests].push(e);
                                break;
                            case "Underwear":
                                cats[BG3Categories.Underwear].push(e);
                                break;
                            case "Boots":
                                cats[BG3Categories.Boots].push(e);
                                break;
                            case "Gloves":
                                cats[BG3Categories.Gloves].push(e);
                                break;
                            case "Helmet":
                                cats[BG3Categories.Helmets].push(e);
                                break;
                            case "Cloak":
                                cats[BG3Categories.Cloaks].push(e);
                                break;
                            case "Ring":
                                cats[BG3Categories.Rings].push(e);
                                break;
                            case "Amulet":
                                cats[BG3Categories.Amulets].push(e);
                                break;
                            default:
                                // unknown
                                cats[BG3Categories.UNKNOWN].push(e);
                                break;
                        }
                    }

                    if(rootProfData) {
                        switch(rootProfData.otherData["Proficiency Group"]) {
                            case "LightArmor":
                                this.categories[BG3Categories.LightArmour].push(
                                    e
                                );
                                break;
                            case "MediumArmor":
                                this.categories[BG3Categories.MedArmour].push(
                                    e
                                );
                                break;
                            case "HeavyArmor":
                                this.categories[BG3Categories.HeavyArmour].push(
                                    e
                                );
                                break;
                            case "Shields":
                                this.categories[BG3Categories.Shields].push(
                                    e
                                );
                                break;
                        }
                    }

                    let rootRarityData: IJsonBG3Entry | null = data;
                    while(
                        rootRarityData &&
                        rootRarityData.inheritsFrom &&
                        (rootRarityData.rarity && rootRarityData.rarity !== "None")
                    ) {
                        rootRarityData = _dataJSON[rootRarityData.inheritsFrom];
                    }
                    let rarity: TRarity = null;
                    if(data.rarity !== "None") {
                        rarity = data.rarity;
                    } else if(
                        (rootRarityData &&
                            rootRarityData.rarity)
                    ) {
                        rarity = rootRarityData.rarity;
                    }

                    switch(rarity) {
                        case "Legendary":
                            this.categories[BG3Categories.LegendaryRarity].push(e);
                            break;
                        case "Rare":
                            this.categories[BG3Categories.RareRarity].push(e);
                            break;
                        case "VeryRare":
                            this.categories[BG3Categories.VeryRareRarity].push(e);
                            break;
                        case "Uncommon":
                            this.categories[BG3Categories.UncommonRarity].push(e);
                            break;
                        default:
                            break;
                    }
                } else if(data.type === "SpellData") {
                    let rootSpellData: IJsonBG3Entry | null = data;
                    while(
                        rootSpellData &&
                        rootSpellData.inheritsFrom &&
                        !rootSpellData.otherData["SpellSchool"]
                    ) {
                        rootSpellData = _dataJSON[rootSpellData.inheritsFrom];
                    }
                    // if(rootSpellData) {
                    //     switch(rootSpellData.otherData["SpellSchool"]) {
                    //         default:
                    //             break;
                    //         case "None":
                    //             cats[BG3Categories.SchoollessSpells].push(e);
                    //             break;
                    //         case "Evocation":
                    //             cats[BG3Categories.EvocationSpells].push(e);
                    //             break;
                    //         case "Enchantment":
                    //             cats[BG3Categories.EnchantmentSpells].push(e);
                    //             break;
                    //         case "Necromancy":
                    //             cats[BG3Categories.NecromancySpells].push(e);
                    //             break;
                    //         case "Conjuration":
                    //             cats[BG3Categories.ConjurationSpells].push(e);
                    //             break;
                    //         case "Transmutation":
                    //             cats[BG3Categories.TransmutationSpells].push(e);
                    //             break;
                    //         case "Illusion":
                    //             cats[BG3Categories.IllusionSpells].push(e);
                    //             break;
                    //     }
                    // }
                }
            });

        if(GAME_DEBUG_MODE) {
            console.log(this.categories);
            console.log(
                Object.keys(_dataJSON)
                    .filter((e) => {
                        return this.categories[BG3Categories.Boots].indexOf(e) !== -1;
                    })
                    .map((e) => ({
                        key: e,
                        ..._dataJSON[e]
                    }))
            );
        }

        BG3CategorySingleton.initialized = true;
    }
}