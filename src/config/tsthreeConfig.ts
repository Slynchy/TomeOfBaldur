import { IData } from "../game/Types/IData";
import {ENGINE_DEBUG_MODE, GAME_DEBUG_MODE} from "../engine/Constants/Constants";
import { SCALE_MODES } from "pixi.js";
import {getNearest4to3Resolution} from "../engine/HelperFunctions/getNearest4to3Resolution";
import { Component } from "../tsthree";

export const tsthreeConfig: {
  loadingScreenComponent: Component | null;
  autoHideLoadingScreen?: boolean;
  width: number;
  height: number;
  showFPSTracker: boolean;
  backgroundColor: number;
  backgroundAlpha: number;
  antialias: boolean;
  sharedTicker: boolean;
  sharedLoader: boolean;
  autoStart: boolean;
  defaultCameraType?: "perspective" | "orthographic";
  devicePixelRatio: number;
  autoResize: "either" | "width" | "height" | "none";
  // maintainResolution: boolean; // if true, continue using config resolution even if canvas size changes
  gamePlatform: "offline" | "facebook" | "capacitor",
  autoSave: number | 0, // if >0, then save every specified milliseconds
  getLatestData: (e: IData[]) => IData,
  logErrors: "none" | "firebase" | "sentry", // sentry not yet supported
  autoInitFirebase: boolean,
  adjustHeightForBannerAd: boolean,
  enableWebP: boolean,
  scaleMode: SCALE_MODES,
  printFatalErrorsToHTML: boolean,
  pauseOnFocusLoss: boolean,
  autoInitAnalytics: boolean,
  // autoLoadState: State | null,

  // DEPRECATED
  // transparent: boolean; // deprecated since pixi v6
  // scale3D?: {
  //   mobile: number,
  //   desktop: number,
  // }; // how much to scale the width/height for the 3D renderer
} = {
  width: Math.ceil(window.innerWidth),
      // Math.floor(
      //     window.innerWidth * 0.8
      // ), // Math.max(Math.ceil(window.innerHeight * 1.3333), 640),
  height: Math.max(Math.ceil(window.innerHeight), 820),
      // Math.floor(
      //   window.innerHeight * 0.8
      // ), // Math.max(window.innerHeight, 480),
  // scale3D: {
  //   mobile: 0.35,
  //   desktop: 0.75
  // },
  showFPSTracker: GAME_DEBUG_MODE,
  backgroundAlpha: 0,
  backgroundColor: 0x000000, // 0x008080,
  antialias: true,
  scaleMode: SCALE_MODES.LINEAR,
  sharedTicker: true,
  sharedLoader: false,
  autoStart: true,
  defaultCameraType: "perspective",
  devicePixelRatio: window.devicePixelRatio || 1,
  autoResize: "none",
  adjustHeightForBannerAd: false,
  // maintainResolution: false,
  gamePlatform: "offline",
  autoSave: GAME_DEBUG_MODE ? 100 : 10000,
  logErrors: "none",
  autoInitFirebase: false,
  printFatalErrorsToHTML: !__PRODUCTION,
  // disabled because of 200mb bundle size limit on FBInstant :shrug:
  enableWebP: false, // isWebPSupported(),
  pauseOnFocusLoss: __PRODUCTION,
  // autoLoadState: new Sevastapol(),
  autoInitAnalytics: false,
  loadingScreenComponent: undefined,

  getLatestData: e => {
    return e[0];
  }
};

// const res = getNearest4to3Resolution(window.innerWidth, window.innerHeight);
// tsthreeConfig.width = res.width;
// tsthreeConfig.height = res.height;

