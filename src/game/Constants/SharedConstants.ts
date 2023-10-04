const INCORRECT_EXAM_SCORE_PENALTY: number = -20;
const CORRECT_EXAM_SCORE_REWARD: number = 100;

const INCORRECT_TRT_SCORE_PENALTY: number = -75;
const CORRECT_TRT_SCORE_REWARD: number = 175;

// Measured in 15m intervals (i.e. 0 is <15, 1 is >15 & <30, etc.)
const SPEED_BONUS_REWARDS: Record<number, number> = {
    0: 100,
    1: 50,
    2: 20,
    3: 10,
};

const DOUBLE_CLICK_TIMER = 300; // milliseconds

export {
    INCORRECT_EXAM_SCORE_PENALTY,
    CORRECT_EXAM_SCORE_REWARD,
    INCORRECT_TRT_SCORE_PENALTY,
    CORRECT_TRT_SCORE_REWARD,
    SPEED_BONUS_REWARDS,
    DOUBLE_CLICK_TIMER,
};