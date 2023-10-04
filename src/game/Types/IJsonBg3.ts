import { TDataTypeBG3, TRarity } from "./SharedTypes";

export interface IJsonBG3Entry {
    name: string;
    description: string;
    inheritsFrom?: string;
    rarity: TRarity;
    type: TDataTypeBG3;
    otherData: Record<string, string>;
}
export type TJsonBG3 = Record<string, IJsonBG3Entry>;