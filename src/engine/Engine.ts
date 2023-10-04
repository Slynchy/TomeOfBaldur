import { StateManager } from "./StateManager";
import { State } from "./State";
import {
    BaseTexture,
    Container,
    Loader,
    LoaderResource,
    SCALE_MODES,
    settings,
    Spritesheet,
    TextStyle, Texture,
    Texture as PIXITexture,
    Ticker as PIXITicker,
    PRECISION
} from "pixi.js";
import { UIManager } from "./UIManager";
import { PIXILoader } from "./Loaders/PIXILoader";
import { tsthreeConfig } from "../config/tsthreeConfig";
import {
    DEFAULT_CAMERA_FOV,
    DEFAULT_TEXTURE_B64,
    ENGINE_DEBUG_MODE,
    GAME_DEBUG_MODE,
    LOADTIME_DEBUG_MODE
} from "./Constants/Constants";
import { ENGINE_ERROR } from "./ErrorCodes/EngineErrorCodes";
import { BootAssets, LoaderType } from "../config/BootAssets";
import * as TWEEN from '@tweenjs/tween.js';
import { PlatformSDK } from "./PlatformSDKs/PlatformSDK";
import { DummySDK } from "./PlatformSDKs/DummySDK";
import { FBInstantSDK } from "./PlatformSDKs/FBInstantSDK";
import { SaveHandler } from "./Savers/SaveHandler";
import { LocalStorageSaver } from "./Savers/LocalStorageSaver";
import { FBAdManager } from "./FBAdManager";
import { FBInstantSaver } from "./Savers/FBInstantSaver";
import { Saver } from "./Savers/Saver";
import { AnalyticsHandler } from "./Analytics/AnalyticsHandler";
import { FacebookAnalytics } from "./Analytics/FacebookAnalytics";
import { BaseAnalytics } from "./Analytics/BaseAnalytics";
import { FirebaseAnalytics } from "./Analytics/FirebaseAnalytics";
import { LoadtimeMeasurer } from "./Debug/LoadtimeMeasurer";
import { GameObject, HelperFunctions } from "../tsthree";
import { FirebaseSingleton } from "./FirebaseSingleton";
import { FirebaseFeatures } from "./Types/FirebaseFeatures";
import { isWebPSupported } from "./HelperFunctions/isWebPSupported";
import { PlayerDataSingleton } from "../game/Logic/PlayerDataSingleton";
import { AdIDs } from "../game/Constants/AdIDs";
import { AdPlacements } from "../game/Constants/AdPlacements";
// import { Camera, OrthographicCamera, PerspectiveCamera, Texture as ThreeTexture, WebGLRenderer } from "three";
import isMobile from "is-mobile";
// import { EffectComposer, Pass } from "three/examples/jsm/postprocessing/EffectComposer";
// import WEBGL from "three/examples/jsm/capabilities/WebGL";
import { RENDER_MODE } from "../game/Constants/Constants";
import { JSONLoader } from "./Loaders/JSONLoader";
import { WASMLoader } from "./Loaders/WASMLoader";
import { GameAnalytics } from "./Analytics/GameAnalytics";
import { AnalyticsEventID } from "../game/Constants/AnalyticsEventIDs";

// const ENABLE_3D: boolean = false;

declare global {
    const __PRODUCTION: boolean;
    const __VERSION: string;
    const ENGINE: Engine;
    const _PAGE_START_TIME: number;
}

let _INITIAL_LOAD_TIME: number = -1;

export class Engine {

    // CONST PROPS
    // private readonly renderer3d: WebGLRenderer;
    // private readonly effectComposer: EffectComposer;
    // private readonly defaultCameraType: string;

    private readonly ticker: PIXITicker;
    private readonly stateManager: StateManager;
    private readonly loader: PIXILoader;
    private readonly jsonLoader: JSONLoader;
    private readonly wasmLoader: WASMLoader;
    private readonly uiManager: UIManager;
    private readonly stage: Container;
    private readonly defaultTexture: undefined;
    private readonly platformSdk: PlatformSDK;
    private readonly saveHandler: SaveHandler;
    private readonly fbAdManager: FBAdManager;
    private readonly analyticsHandler: AnalyticsHandler;

    // DEBUG
    private fpsDisplay: Stats;
    private readonly loadtimeMeasurer: LoadtimeMeasurer;

    // RUNTIME PROPS
    // private renderPasses: Pass[] = [];
    // private mainCamera: Camera;
    private DEFAULT_TEXTURE: PIXITexture;
    private dt: number = 1;
    private _scaleFactor: number = 1;
    private _pauseRendering: boolean = false;
    private _onErrorFunctions: Array<typeof window.onerror> = [];
    private _onPromiseRejectionFunctions: Array<(ev: PromiseRejectionEvent) => void> = [];
    private _loadAssetsPromise: Promise<void>;
    private _autoResizeVal: typeof tsthreeConfig.autoResize;
    private _loadingScrObject: GameObject | null = null;

    // todo: abstract tsthreeConfig
    constructor(_config: typeof tsthreeConfig) {
        const analyticsModules: BaseAnalytics[] = [];
        const savers: Saver[] = [];

        if ((window as unknown as { ENGINE: Engine }).ENGINE)
            throw new Error(ENGINE_ERROR.MULTIPLE_INSTANCE);

        // if(ENABLE_3D) {
        //     if (!WEBGL.isWebGLAvailable()) throw new Error(ENGINE_ERROR.WEBGL_UNSUPPORTED);
        //     if (ENGINE_DEBUG_MODE && WEBGL.isWebGL2Available())
        //         console.log("Browser supports WebGL2");
        //
        //     this.renderer3d = new WebGLRenderer({
        //         alpha: true,
        //         antialias: _config.antialias
        //     });
        //     this.effectComposer = new EffectComposer(this.renderer3d);
        //     this.defaultCameraType =
        //         _config.defaultCameraType || "perspective";
        // }
        this.setScaleMode(_config.scaleMode);

        if (LOADTIME_DEBUG_MODE) {
            this.loadtimeMeasurer = new LoadtimeMeasurer();
        }

        if(tsthreeConfig.autoResize === "either") {
            this._autoResizeVal =
                tsthreeConfig.height > tsthreeConfig.width ?
                    "height" : "width";
        } else {
            this._autoResizeVal = _config.autoResize;
        }

        // init firebase
        if (_config.autoInitFirebase) {
            FirebaseSingleton.initialize([
                FirebaseFeatures.Auth,
                FirebaseFeatures.Analytics,
                FirebaseFeatures.Functions,
            ]);
            this.initializeFirebaseAnalytics();
        }

        if (_config.logErrors === "firebase") {
            // init hook
            this._setupHookOnError();

            this.hookOnError((
                _msg,
                v1,
                v2,
                v3,
                error
            ) => {
                if (this.analyticsHandler) {
                    this.logEvent(
                        // @ts-ignore
                        "Error",
                        undefined, error ? {
                        msg: _msg as string
                    } : undefined);
                }
            });

            this.hookOnPromiseRejection((ev) => {
                if (this.analyticsHandler) {
                    this.logEvent(
                        // @ts-ignore
                        "PromiseReject",
                        undefined, {
                        reason: typeof ev.reason === "string" ? ev.reason : undefined,
                        msg: (ev.reason as unknown as Error).message ? (ev.reason as unknown as Error).message : undefined,
                    });
                }
            });
        } else if (_config.logErrors === "sentry") {
            console.warn("`config.logErrors === \"sentry\"` is not yet implemented");
        }

        this.stage = new Container();
        this.stage.sortableChildren = true;
        this.ticker = new PIXITicker();
        this.stateManager = new StateManager(this);
        this.uiManager = new UIManager(this, _config);

        if(tsthreeConfig.loadingScreenComponent) {
            const loadingScrObject = this._loadingScrObject = new GameObject();
            loadingScrObject.addComponent(tsthreeConfig.loadingScreenComponent);
            loadingScrObject.zIndex = Number.MAX_SAFE_INTEGER;
            this.stage.addChild(loadingScrObject);
        }
        // Loader.registerPlugin(WebfontLoaderPlugin);

        this.loader = new PIXILoader();
        if(_config.enableWebP && isWebPSupported()) {
            this.loader.addPreprocessFunction((e: LoaderResource, next: Function) => {
                if(
                    (e.extension) === 'png'
                ) {
                    // @ts-ignore
                    e.extension = "webp";
                    // @ts-ignore
                    e.url = `${e.url}.webp`;
                }
                next();
            });
        }

        this.jsonLoader = new JSONLoader();
        this.wasmLoader = new WASMLoader();

        switch (_config.gamePlatform) {
            case "facebook":
                // this.platformSdk =
                this.platformSdk = new FBInstantSDK();
                this.fbAdManager = new FBAdManager({
                    fbInstantSDKRef: this.platformSdk as FBInstantSDK,
                    interstitialRetries: 0,
                    rewardedRetries: 3,
                    bannerRetries: 3
                });
                savers.push(new FBInstantSaver());
                analyticsModules.push(new FacebookAnalytics());
                break;
            case "offline":
            default:
                savers.push(new LocalStorageSaver());
                this.platformSdk = new DummySDK();
                analyticsModules.push(new GameAnalytics());
                break;
        }

        this.analyticsHandler = new AnalyticsHandler(
            analyticsModules,
            !tsthreeConfig.autoInitAnalytics
        );

        this.saveHandler = new SaveHandler(
            savers,
            _config.getLatestData
        );

        if (!_config.autoStart) {
            this.getTicker().stop();
        } else {
            this.getTicker().start();
        }

        this.getTicker().add((dt: number) => {
            return (this.deltaTime = dt);
        });
        this.getTicker().add(this.mainLoop);

        // @ts-ignore
        window.ENGINE = this;
    }

    public initializeAnalytics(): void {
        this.analyticsHandler.initialize();
    }

    public getWASM<T>(_key: string): T | null {
        return this.wasmLoader.get(_key) || null;
    }

    public reinitializeRenderer(_width: number, _height: number): void {
        this.uiManager.getRenderer().destroy();
        this.uiManager.initializeRenderer(tsthreeConfig);
        // this.uiManager.resize();
        UIManager.configureRenderer2d(
            tsthreeConfig,
            this,
            this.uiManager.getRenderer()
        );
    }

    public getTexture(_key: string): PIXITexture {
        if(this.loader.has(_key)) {
            const resource = (this.loader.get(_key) as LoaderResource);
            if(resource.texture) {
                return resource.texture;
            } else if(resource instanceof PIXITexture) {
                return resource;
            } else {
                console.warn("Requested asset %s is not a texture", _key);
                return Texture.EMPTY;
            }
        } else {
            console.warn("Failed to find texture %s", _key);
            return Texture.EMPTY;
        }
    }

    public setScaleMode(scaleMode: SCALE_MODES): void {
        settings.SCALE_MODE = scaleMode;

        if(settings.SCALE_MODE == SCALE_MODES.NEAREST) {
            settings.PRECISION_FRAGMENT = PRECISION.LOW;
            settings.ROUND_PIXELS = true;
        }
    }

    private _getPlayerDataSingleton(): typeof PlayerDataSingleton {
        if(ENGINE_DEBUG_MODE) {
            return PlayerDataSingleton;
        } else {
            return null;
        }
    }

    public isLoaderLoading(): boolean {
        return this.loader.isLoading;
    }

    public initializeFirebaseAnalytics(): void {
        this.analyticsHandler.addModule(
            new FirebaseAnalytics(FirebaseSingleton.getAnalytics())
        );
    }

    public getActiveState(): State {
        return this.stateManager.getState();
    }

    public requestHapticFeedback(): Promise<boolean> {
        if(
            !isMobile()
            // || PlayerDataSingleton.isVibrationDisabled()
        ) return Promise.resolve(false);
        else {
            return this.platformSDK.requestHapticFeedbackAsync();
        }
    }

    public trackInitialLoadTime(): Promise<void> {
        if (_INITIAL_LOAD_TIME === -1) {
            const done = () => {
                _INITIAL_LOAD_TIME = Date.now() - _PAGE_START_TIME;
                // this.logEvent(
                //     "SHLoadTime",
                //     _INITIAL_LOAD_TIME,
                // );
                console.log(`Loadtime was ` + _INITIAL_LOAD_TIME + `ms`);

                // fixme: HACK!
                if(this.platformSDK.isAdsSupported()) {
                    this.platformSDK.showBannerAd(
                        AdIDs[AdPlacements.BANNER]
                    ).catch((err) => console.error(err));
                }
            };
            this.platformSDK.setLoadingProgress(100);
            return this.platformSDK.startGame().then(() => done()).catch(() => done());
        } else {
            if(this.platformSDK.isAdsSupported()) {
                this.platformSDK.showBannerAd(
                    AdIDs[AdPlacements.BANNER]
                ).catch((err) => console.error(err));
            }
            return Promise.resolve();
        }
    }

    public hookOnError(_func: typeof window.onerror): void {
        this._onErrorFunctions.push(_func);
    }

    public hookOnPromiseRejection(_func: (ev: PromiseRejectionEvent) => void): void {
        this._onPromiseRejectionFunctions.push(_func);
    }

    public _setupHookOnError(): void {
        window.onunhandledrejection = (
            e: PromiseRejectionEvent
        ) => {
            this._onPromiseRejectionFunctions.forEach((_f) => _f(e));
        };
        window.onerror = (
            _msg,
            _url,
            _lineNo,
            _columnNo,
            _error
        ) => {
            this._onErrorFunctions.forEach((_f) => _f(
                _msg,
                _url,
                _lineNo,
                _columnNo,
                _error
            ));
        };
    }

    // public static configureRenderer3d(_config: typeof tsthreeConfig, _renderer: WebGLRenderer): void {
    //     _renderer.setPixelRatio(
    //         _config.devicePixelRatio * (RENDER_MODE ? 1 : (
    //             isMobile() ? tsthreeConfig.scale3D.mobile : tsthreeConfig.scale3D.desktop
    //         ))
    //     );
    //     const size: IVector2 = {x: 0, y: 0};
    //
    //     switch (_config.autoResize) {
    //         case "width":
    //             size.x = window.innerWidth;
    //             size.y = Math.floor(window.innerWidth * (_config.height / _config.width));
    //             break;
    //         case "height":
    //             size.x = Math.floor(window.innerHeight * (_config.width / _config.height));
    //             size.y = window.innerHeight;
    //             break;
    //         case "none":
    //             _renderer.setSize(_config.width, _config.height);
    //             size.x = _config.width;
    //             size.y = _config.height;
    //             break;
    //     }
    //     _renderer.setSize(
    //         (_config.maintainResolution ? _config.width : size.x) * (1),
    //         (_config.maintainResolution ? _config.height : size.y) * (1)
    //     );
    //     _renderer.getContext().canvas.style.width = `${size.x}px`;
    //     _renderer.getContext().canvas.style.height = `${size.y}px`;
    //     const alpha = _renderer.getClearAlpha();
    //     _renderer.setClearColor(_config.backgroundColor);
    //     _renderer.setClearAlpha(alpha);
    // }

    public get scaleFactor(): number {
        return this._scaleFactor;
    }

    public get platformSDK(): PlatformSDK {
        return this.platformSdk;
    }

    public getSaveHandler(): SaveHandler {
        return this.saveHandler;
    }

    public get renderingPaused(): boolean {
        return this._pauseRendering;
    }

    public set renderingPaused(val: boolean) {
        this._pauseRendering = val;
    }

    public resizeRenderer(_w: number, _h: number): void {
        tsthreeConfig.width = _w;
        tsthreeConfig.height = _h;
        if(tsthreeConfig.autoResize === "either") {
            this._autoResizeVal =
                tsthreeConfig.height > tsthreeConfig.width ?
                    "height" : "width";
        } else {
            this._autoResizeVal = tsthreeConfig.autoResize;
        }
        ENGINE.getUIManager().getRenderer().resize(
            tsthreeConfig.width,
            tsthreeConfig.height,
        );
        UIManager.configureRenderer2d(tsthreeConfig, this, this.uiManager.getRenderer());
    }

    /**
     * @deprecated
     * @param elements
     * @param _config
     */
    public static resize_d(elements: HTMLElement[], _config: typeof tsthreeConfig): void {
        let w = window.innerWidth;
        let h = window.innerHeight;
        elements.forEach((e) => {
            if (!e) {
                return;
            }
            switch (tsthreeConfig.autoResize) {
                case "height":
                    e.style.height = `${Math.floor(h)}px`;
                    w = _config.width * (parseInt(e.style.height) / _config.height);
                    e.style.width = `${Math.floor(w)}px`;
                    break;
                case "width":
                    e.style.width = `${Math.floor(w)}px`;
                    h = _config.height * (parseInt(e.style.width) / _config.width);
                    e.style.height = `${Math.floor(h)}px`;
                    break;
                case "none":
                    e.style.width = `${_config.width}px`;
                    e.style.height = `${_config.height}px`;
                    break;
            }
        });
    }

    get deltaTime(): number {
        return this.dt;
    }

    set deltaTime(dt: number) {
        this.dt = dt;
    }

    // public addRenderPass(_obj: Pass): void {
    //     this.effectComposer.addPass(_obj);
    //     this.renderPasses.push(_obj);
    // }

    /**
     * Returns the specified texture if available, otherwise returns defaultTexture
     * @param key
     */
    // public getThreeTexture(key?: string): ThreeTexture {
    //     // load from cache
    //     // otherwise:
    //     return this.defaultTexture;
    // }
    //
    // public removeRenderPass(_obj: Pass): void {
    //     this.effectComposer.removePass(_obj);
    //     const ind = this.renderPasses.findIndex((e) => e === _obj);
    //     if (ind === -1) {
    //         console.warn("Failed to remove %o because it wasn't added", _obj);
    //     } else {
    //         this.renderPasses.splice(ind, 1);
    //     }
    // }
    //
    // public getMainCamera(): Camera {
    //     return this.mainCamera;
    // }

    private static hideFontPreload(): void {
        const collection: HTMLCollection =
            document.getElementsByClassName("fontPreload");

        // tslint:disable-next-line:prefer-for-of
        for (let i: number = collection.length - 1; i >= 0; i--) {
            collection[i].parentNode.removeChild(collection[i]);
        }
    }

    public changeState(_newState: State, _params?: unknown): Promise<void> {
        return this.stateManager.setState(_newState, _params);
    }

    // public getRenderer(): WebGLRenderer {
    //     return this.renderer3d;
    // }

    /**
     * Forces a frame update
     * @deprecated
     */
    public forceRender(): void {
        // this.renderer2d.render(this.stateManager.currentState.getScene().stage);
    }

    public addJSON(_key: string, _json: Record<string, any>): void {
        this.jsonLoader.cache(_key, _json);
    }

    public setMaxFPS(fps: number): void {
        // Not in v5 typedef?
        // @ts-ignore
        this.ticker.maxFPS = fps;
    }

    public setBackgroundColor(_col: number, _alpha?: number): void {
        this.uiManager.getRenderer().backgroundColor = _col;
        if (typeof _alpha !== "undefined") {
            this.uiManager.getRenderer().backgroundAlpha = _alpha;
        }
    }

    public getTicker(): PIXITicker {
        return this.ticker;
    }

    public getStage(): Container {
        return this.stage;
    }

    public hasJSON(key: string): boolean {
        return this.jsonLoader.isAssetLoaded(key);
    }

    public getJSON<T extends object>(key: string): T {
        return this.jsonLoader.get(key);
    }

    /**
     * Helper function for if a PIXI resource is loaded; also checks if it loaded with error
     * @param key
     */
    public hasPIXIResource(key: string): boolean {
        let exists = this.loader.has(key);
        let target = exists ? this.loader.get(key) : null;
        return exists && !(target as LoaderResource).error;
    }

    public getPIXIResource(key: string): LoaderResource | PIXITexture | Spritesheet {
        const tex: LoaderResource = this.loader.get(key);
        if (ENGINE_DEBUG_MODE && !tex) {
            console.warn("Failed to find texture: " + key);
        }
        if (tex?.texture) {
            return tex.texture;
        } else if (tex?.spritesheet) {
            return tex.spritesheet;
        } else {
            return tex;
        }
        return (tex && tex.texture ? tex.texture : tex);
    }

    public cachePIXIResource(key: string, asset: LoaderResource | PIXITexture | Spritesheet | BaseTexture): void {
        this.loader.cache(key, asset);
    }

    public unloadPIXIResource(key: string): void {
        this.loader.unload(key);
    }

    /**
     *
     * @param _spritesheet
     * @returns True on success, false on failure
     */
    public processSpritesheet(_spritesheet: Spritesheet): boolean {
        try {
            Object.keys(_spritesheet.textures).forEach((k) => {
                if (
                    !Object.prototype.hasOwnProperty.call(_spritesheet.textures, k) ||
                    this.hasPIXIResource(k)
                )
                    return;
                // if(GAME_DEBUG_MODE || ENGINE_DEBUG_MODE) {
                //     console.log("Cached %s", k);
                // }
                this.cachePIXIResource(k, _spritesheet.textures[k]);
            });
        } catch (err) {
            console.error(err);
            return false;
        }
        return true;
    }

    public getUIManager(): UIManager {
        return this.uiManager;
    }

    // public getFBX(_key: string): Group {
    //     const res = (this.fbxLoader.get(_key) as Group);
    //     if (!res) return res;
    //     return res.clone ? res.clone(true) : res;
    // }
    //
    // public getGLTF(_key: string): GLTF {
    //     const res = (this.gltfLoader.get(_key) as GLTF);
    //     if (!res) return res;
    //     return res;
    // }

    // public setMainCamera(camera: Camera): void {
    //     this.mainCamera = camera;
    //     this.renderPasses.find((e) => {
    //         if (e instanceof RenderPass) {
    //             e.camera = camera;
    //         }
    //     });
    // }

    public logEvent(eventName: AnalyticsEventID, valueToSum?: number, parameters?: { [key: string]: string; }): void {
        parameters = parameters || {};
        return this.analyticsHandler.logEvent(
            eventName,
            valueToSum || undefined,
            {
                version: __VERSION,
                ...parameters
            }
        );
    }

    public isAssetLoaded(_key: string): boolean {
        return this.loader.isAssetLoaded(_key) ||
            false;
    }

    // public getOBJ(_key: string): Group {
    //     const res = (this.objLoader.get(_key) as Group);
    //     if (!res) return res;
    //     return res.clone ? res.clone(true) : res;
    // }

    public getFont(key: string): TextStyle {
        return (this.loader.get(key) as LoaderResource)
            // @ts-ignore
            ?.styles[0] as TextStyle;
    }

    public getAdManager(): FBAdManager {
        return this.fbAdManager;
    }

    public init(
        _initialState: State,
        _bootAssets: typeof BootAssets,
        _onProgress?: (_val: number) => void
    ): Promise<unknown> {
        // @ts-ignore
        clearInterval(window.preloadIntervalId);

        this.platformSdk.setLoadingProgress(25);

        // if(ENABLE_3D) {
        //     this.renderer3d.domElement.id = "main-canvas";
        //     Engine.configureRenderer3d(tsthreeConfig, this.renderer3d);
        //     this._scaleFactor = tsthreeConfig.width / this.renderer3d.getContext().canvas.width;
        //     document.body.appendChild(this.renderer3d.domElement);
        //
        //     if (this.defaultCameraType === "orthographic") {
        //         this.mainCamera = new OrthographicCamera(
        //             -85,
        //             85,
        //             48,
        //             -48,
        //             1,
        //             1000
        //         );
        //     } else if (this.defaultCameraType === "perspective") {
        //         this.mainCamera = new PerspectiveCamera(
        //             DEFAULT_CAMERA_FOV,
        //             // fixme: don't use tsthreeConfig directly
        //             tsthreeConfig.width > tsthreeConfig.height ? tsthreeConfig.height / tsthreeConfig.width : tsthreeConfig.width / tsthreeConfig.height,
        //             0.3,
        //             1000
        //         );
        //     } else {
        //         throw new Error("Engine @ init() - Unknown camera type " + this.defaultCameraType);
        //     }
        // }

        if (tsthreeConfig.showFPSTracker) {
            // eslint-disable-next-line @typescript-eslint/no-var-requires
            const Stats = require('stats.js');
            this.fpsDisplay = new Stats();
            this.fpsDisplay.showPanel(0); // 0: fps, 1: ms, 2: mb, 3+: custom
            document.body.appendChild(this.fpsDisplay.dom);
        }

        if (ENGINE_DEBUG_MODE) {
            console.log(`
this: %O
this.ticker: %O
this.stateManager: %O
this.uiManager: %O
this.loader: %O
`,
                this,
                this.ticker,
                this.stateManager,
                this.uiManager,
                this.loader,
            );
        }

        // this.addRenderPass(new RenderPass(this.stage, this.mainCamera));
        this.uiManager.init(this);
        // if (tsthreeConfig.autoResize !== "none")
        this.hookResize();
        Engine.hideFontPreload();

        if (ENGINE_DEBUG_MODE) {
            console.log("Loading boot assets %o", _bootAssets);
        }

        this.platformSdk.setLoadingProgress(42);

        const loadPromise = this.loadAssets(
            _bootAssets,
            (p) => {
                if(GAME_DEBUG_MODE) {
                    console.log("BootAssets load progress %i", p);
                }
                this.platformSDK.setLoadingProgress(p);
                _onProgress ? _onProgress(p) : null;
            }
        )
            .then(() => {
                // process spritesheets
                _bootAssets.forEach((e) => {
                    if(this.hasPIXIResource(e.key)) {
                        const asset = this.getPIXIResource(e.key);
                        if(asset instanceof Spritesheet) {
                            this.processSpritesheet(
                                asset
                            );
                        }
                    }
                });

                this.platformSdk.setLoadingProgress(50);
                if (ENGINE_DEBUG_MODE) {
                    console.log("Successfully loaded bootassets");
                }
            })
            .then(() => this.changeState(_initialState))
            .then(() => (tsthreeConfig.autoHideLoadingScreen && this._loadingScrObject) ? (this._loadingScrObject.visible = false) : null)
            .catch((err) => {
                // Fatal!
                console.error(err);
            });

        this.DEFAULT_TEXTURE = new Texture(new BaseTexture(DEFAULT_TEXTURE_B64));
        return Promise.allSettled([
            loadPromise,
            HelperFunctions.waitForTruth(() => this.DEFAULT_TEXTURE.valid)
        ]);
    }

    public recordLoadtime(_name?: string, _force?: boolean): Promise<void> {
        // const-guarded/written this way to support tree-shaking easier
        if (LOADTIME_DEBUG_MODE) {
            if(!_force) {
                return HelperFunctions.wait(1).then(() => {
                    this.loadtimeMeasurer.recordLoadtime(_name);
                });
            } else {
                this.loadtimeMeasurer.recordLoadtime(_name);
            }
        }
        return Promise.resolve();
    }

    public alertLoadtime(): void {
        if (LOADTIME_DEBUG_MODE) {
            alert(this.exportLoadtimeAsString());
        }
    }

    public exportLoadtimeAsString(): string {
        if (LOADTIME_DEBUG_MODE) {
            return this.loadtimeMeasurer.exportLoadtime();
        }
    }

    public onResize = () => {
        tsthreeConfig.width = window.innerWidth;
        tsthreeConfig.height = Math.max(
            window.innerHeight,
            ENGINE.getStage().height + 176
        );

        UIManager.configureRenderer2d(
            tsthreeConfig,
            this,
            this.uiManager.getRenderer()
        );
        this.getActiveState()?.onResize?.(this);
    };

    private hookResize(): void {
        window.addEventListener('resize', this.onResize);
        this.onResize();
    }

    public loadAssets(_assets: typeof BootAssets, _onProgress?: (_prog: number) => void): Promise<void> {
        if(this._loadAssetsPromise) {
            return this._loadAssetsPromise.then(() => this.loadAssets(_assets, _onProgress));
        }
        return this._loadAssetsPromise = new Promise<void>((_resolve: () => void, _reject: (err: unknown) => void): void => {
            const progress = [0, 0, 0];
            const onProgress = (e: number) => {
                return _onProgress ? _onProgress((progress[0] + progress[1] + progress[2]) / 3) : null;
            };

            for (const k in _assets) {
                if (!Object.prototype.hasOwnProperty.call(_assets, k)) continue;
                if (_assets[k]) {
                    switch (_assets[k].type) {
                        case LoaderType.PIXI:
                            this.loader.add(_assets[k].key, `./assets/${_assets[k].path}`);
                            break;
                        case LoaderType.JSON:
                            this.jsonLoader.add(_assets[k].key, `./assets/${_assets[k].path}`);
                            break;
                        case LoaderType.WASM:
                            this.wasmLoader.add(_assets[k].key, `./assets/${_assets[k].path}`);
                            break;
                    }
                }
            }

            Promise.allSettled([
                this.loader.load((e) => onProgress(progress[0] = e))
                    .catch(async () => {
                        // todo: add proper retry
                        try {
                            await this.loader.load();
                            this._loadAssetsPromise = null;
                            _resolve();
                        } catch (err) {
                            this._loadAssetsPromise = null;
                            _reject(err);
                        }
                    }),
                this.jsonLoader.load((e) => onProgress(progress[1] = e))
                    .catch(async () => {
                        // todo: add proper retry
                        try {
                            await this.jsonLoader.load();
                            this._loadAssetsPromise = null;
                            _resolve();
                        } catch (err) {
                            this._loadAssetsPromise = null;
                            _reject(err);
                        }
                    }),
                this.wasmLoader.load((e) => onProgress(progress[2] = e))
                    .catch(async () => {
                        // todo: add proper retry
                        try {
                            await this.wasmLoader.load();
                            this._loadAssetsPromise = null;
                            _resolve();
                        } catch (err) {
                            this._loadAssetsPromise = null;
                            _reject(err);
                        }
                    }),
            ]).then(() => {
                this._loadAssetsPromise = null;
                if(GAME_DEBUG_MODE || ENGINE_DEBUG_MODE) {
                    console.log("Loaded %s", _assets
                        .map((e) => e.key)
                        .join(", ")
                    );
                }
                _resolve();
            }).catch(_reject);

        });
    }

    private readonly mainLoop: () => void = () => {
        if (this.fpsDisplay)
            this.fpsDisplay.begin();
        TWEEN.update(Date.now());
        this.stateManager.onStep();
        // if (!this._pauseRendering)
        //     this.effectComposer.render(this.deltaTime);
        this.uiManager.getRenderer().render(this.stage);
        if (this.fpsDisplay)
            this.fpsDisplay.end();
    };
}
