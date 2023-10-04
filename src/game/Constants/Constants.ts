import { GAME_DEBUG_MODE } from "../../engine/Constants/Constants";
export const LEVEL_EDIT_MODE: boolean = false;
export const GAME_ID: string = "";
export const ENABLE_BETTER_SHADOWS: boolean = false;
export function shouldEnableShadows(_numOfCars: number): boolean {
    return false;
}

export const INTERSTITIAL_AD_TIMER_MS: number = 1000 * 60 * 4; // 4 minutes
export const BANNER_AD_TIMER_MS: number = 1000 * 60 * 3; // 3 minutes

export const TOURNAMENT_DEBUG_MODE: boolean = GAME_DEBUG_MODE;

export const TUTORIAL_LEVEL: string = "0501";

export let GAME_FONT: string = "Quadraat-Offc-Pro";
export let GAME_FONT_BOLD: string = ""; // "Quadraat-Offc-Pro-Bold";
export let GAME_FONT_ITALIC: string = "Quadraat-Offc-Pro-Italic";

export const RENDER_MODE: boolean = false;
export const DEBUG_CAMERA_MODE: boolean = false;

/**
 * For stuff that is hidden (e.g. tapping the main menu icon alot)
 */
export const SECRET_DEBUG_FLAG = true;
