export function extractNumFromBoostStr(
    boostStr: string
): number | null {
    const splitParams =
        boostStr.match(/\(([^)]+)\)/)?.[1]?.split(",") || [];
    const funcName = boostStr.substring(0, boostStr.indexOf("("));
    switch(
        funcName
    ) {
        case "SpellSaveDC": // (num)
            return parseInt(splitParams[0]);
        case "Ability": // (type, amt, max?)
        case "RollBonus": // (type: str, amt: str, skill?: str)
        case "ActionResource":
        case "Skill": // (skillname, amt)
        case "AbilityOverrideMinimum": // (skill, amt)
            return parseInt(splitParams[1]);
        case "Disadvantage": // (type, name)
        case "Advantage": // (type, name)
        case "UnlockSpell":
        case "CriticalHit": // (AttackTarget,Success,Never)
        default:
            return null;
    }
}