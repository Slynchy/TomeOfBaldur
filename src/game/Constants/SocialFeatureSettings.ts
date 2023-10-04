// Basically:
//  - FTUs are excluded when on the first level
//  - Players collect collectibles to trigger the social feature
//  - If players have less than the required amount of collectibles after timer has elapsed,
//    just force the social feature on the next pickup
//  - Cannot trigger more than once per level-change

export const SOCIAL_FEATURE_SETTINGS: {
    Type: "TIMER" | "COLLECT" | "BOTH",
    CollectNumber: number,
    TimerNumber: number,
    EnableForFTU: boolean,
    PropPaths: Record<string, Array<string>>
} = {
    Type: "BOTH",
    CollectNumber: 5,
    TimerNumber: 1000 * 60 * 5, // 5mins
    EnableForFTU: false,
    PropPaths: {
        "0501": [
            // deliberately empty for first level
        ],
        "0502": [

        ],
        "0503": [
            "PeopleTents!InfrontOfEntrance!Black_Beard_and_Moustache!Body!Head",
            "PeopleTents!InTents!ColdGuy!Body!Head",
            "InfrontOfTentsPeople!Man_with_Moustache_and_BBQ_Tool!Body!Head",
            "InfrontOfTentsPeople!Person_Asleep_In_Mud!Body!Head",
            "InfrontOfTentsPeople!Man_with_Banner!Body!Head",
            "PeopleTents!MidCampingArea!Person_Putting_up_Pink_Tent!Body!Head",
            "PeopleTents!InTents!BlondeAsleep_in_blue_Orange_Red_Tent_next_to_Khaki_Gazebo!Body!Head",
            "CampingAreaPeople!Girl_Carrying_Banner!Body",
        ],
        "0504": [

        ],
    }
};
