import { Engine, HelperFunctions, State } from "../../tsthree";
import { ENGINE_DEBUG_MODE, GAME_DEBUG_MODE, PUPPETEER_MODE } from "../../engine/Constants/Constants";
import { PlayerDataSingleton } from "../Logic/PlayerDataSingleton";
import { SAVE_KEYS } from "../Constants/SaveKeys";
import { EntrypointTypes } from "../Constants/EntrypointTypes";
import { EMOJI_UNICODE_POSITIVE } from "../Constants/EmojiConstants";
import { setLanguageFromLocale } from "../../config/Localizations";
import { tsthreeConfig } from "../../config/tsthreeConfig";
import { FirebaseSingleton } from "../../engine/FirebaseSingleton";
import * as Mousetrap from "mousetrap";
import { FORMATS, Renderer } from "pixi.js";
import { constructSceneGraphString } from "../../engine/HelperFunctions/constructSceneGraphString";
import { loadFont } from "../../engine/HelperFunctions/loadFont";
import { GAME_FONT, GAME_FONT_BOLD, GAME_FONT_ITALIC } from "../Constants/Constants";
import { BG3Index } from "./BG3Index";
import { getQueryParams } from "../../engine/HelperFunctions/getQueryParams";
import { BG3SearchInterface } from "./BG3SearchInterface";
import { TJsonBG3 } from "../Types/IJsonBg3";
import { LoaderType } from "../../config/BootAssets";
import { BG3CategorySingleton } from "../Logic/BG3CategorySingleton";

export class GameInit extends State {

    // private _savedData: Record<string, string>;
    private _entryPoint: string;
    private _entryPointData: { [key: string]: unknown } | null;

    public onResize(_engine: Engine): void {

    }

    private static configureCheats(_engine: Engine): void {
        const saveData = (_engine: Engine): Promise<void> => {
            const data = PlayerDataSingleton.export();
            return _engine.getSaveHandler().save(data).catch((err) => {
                console.error(err);
                return _engine.getSaveHandler().save(data).catch((err) => {
                    console.error(err);
                });
            });
        };

        const key: string = (GAME_DEBUG_MODE || PUPPETEER_MODE) ? "CHEATS" : EMOJI_UNICODE_POSITIVE.NERDY;
        ((window as unknown as { [key: string]: unknown })[key]) = {
            resetData: (): void => {
                _engine.getSaveHandler().clear()
                    .then(() => {
                        console.log("Cleared data successfully; refresh page");
                    })
                    .catch((err) => {
                        console.error("Failed to clear data %o", err);
                    });
            },
            exportData: (): void => {
                console.log(PlayerDataSingleton.export(true));
            },
        };
        if (ENGINE_DEBUG_MODE) {
            // this is for cheats that have no place at all in Production
            const windowCheatObj = ((window as unknown as { [key: string]: any })[key]);
            windowCheatObj["setFirebaseProgress"] = async (_progress: number) => {
                await FirebaseSingleton.setProgressOnFirebase(
                    _engine.platformSDK.getPlayerId(),
                    await FirebaseSingleton.getLoggedInUserToken(),
                    _progress
                );
                console.log("Done");
            };
            windowCheatObj["getFriendProgress"] = async () => {
                const signedInfo =
                    await _engine.platformSDK.getSignedInfo(
                        JSON.stringify({
                                friends: (await _engine.platformSDK.getFriends())
                                    .map((e) => {
                                        return e.uid;
                                    })
                            }
                        )
                    );
                console.log(await FirebaseSingleton.getFriendsProgress(
                    signedInfo.getPlayerID(),
                    signedInfo.getSignature()
                ));
                console.log("Done");
            };
        }
    }

    async preload(_engine: Engine): Promise<void> {
        // return new Promise<void>(async (resolve, reject) => {
        ENGINE.recordLoadtime("GameInit.preload");
        GameInit.configureCheats(_engine);

        const keys =
            HelperFunctions.enumKeys(SAVE_KEYS).map((e) => SAVE_KEYS[e]);
        const _savedData = await _engine.getSaveHandler().load(keys) as unknown as Record<string, string>;

        PlayerDataSingleton.initialize(_savedData);

        this._entryPoint = await _engine.platformSDK.getEntryPointAsync();
        this._entryPointData = _engine.platformSDK.getEntryPointData();

        setLanguageFromLocale(
            _engine.platformSDK.getPlayerLocale()
            // "en_GB"
        );

        _engine.platformSDK.setLoadingProgress(70);

        const promises = [];
        if(GAME_FONT) {
            promises.push(
                loadFont(GAME_FONT)
            );
        }
        if(GAME_FONT_BOLD) {
            promises.push(
                loadFont(GAME_FONT_BOLD)
            );
        }
        if(GAME_FONT_ITALIC) {
            promises.push(
                loadFont(GAME_FONT_ITALIC)
            );
        }

        if(
            !_engine.hasJSON("IndexJSON")
        ) {
            promises.push(
                fetch(
                    "https://raw.githubusercontent.com/Slynchy/bg3-item-index-generator/main/output.json"
                )
                .then(
                    (e) => e?.json() || Promise.resolve(null)
                )
                .then((e: TJsonBG3 | null) => {
                    if(!e) {
                        return _engine.loadAssets([{
                            key: "IndexJSON",
                            path: "data/data.json",
                            type: LoaderType.JSON
                        }]).then(() => _engine.getJSON("IndexJSON")) as Promise<TJsonBG3>;
                    } else {
                        return Promise.resolve(e as TJsonBG3);
                    }
                })
                .then((e: TJsonBG3) => {
                    _engine.addJSON("IndexJSON", e);
                    return BG3CategorySingleton.initialize(e);
                })
            );
        }

        await Promise.allSettled(promises);
        return;
    }

    async onAwake(_engine: Engine, _params?: unknown): Promise<void> {

        const entryPointType: EntrypointTypes = this.checkEntryPoint(this._entryPointData);
        if (entryPointType) {
            switch (entryPointType) {
                case EntrypointTypes.NONE:
                default:
                    break;
            }
        }

        if(tsthreeConfig.pauseOnFocusLoss) {
            ENGINE.platformSDK.addOnPauseCallback(() => {
                ENGINE.getTicker().stop();
            });
            ENGINE.platformSDK.addOnResumeCallback(() => {
                ENGINE.getTicker().start();
            });
        }

        // Detect mouseover and signal to parent to disable scroll
        // window.addEventListener('mouseover', function() {
        //     parent.document.body.style.overflow = 'hidden';
        // });
        //
        // // Detect mouseout and signal to parent to enable scroll
        // window.addEventListener('mouseout', function() {
        //     parent.document.body.style.overflow = '';
        // });

        // _engine.setMaxFPS(60);

        console.log(`Entrypoint type was: ${entryPointType}`);
        console.log(this._entryPointData);

        this.tryAddMousetrapBindings();

        // if(tsthreeConfig.autoLoadState) {
        //     ENGINE.changeState(
        //         new BG3Index(),
        //         getQueryParams(window.location.href)
        //     );
        window.addEventListener("popstate", (ev) => {
            if(ev.state && ev.state.path) {
                const queryParams = getQueryParams(ev.state.path);
                if(
                    queryParams["itemId"]
                ) {
                    ENGINE.changeState(
                        new BG3Index(),
                        queryParams
                    );
                } else if(
                    queryParams["searchCategory"]
                ) {
                    ENGINE.changeState(
                        new BG3SearchInterface(),
                        queryParams
                    );
                }
            } else {
                ENGINE.changeState(
                    new BG3SearchInterface(),
                    queryParams
                );
            }
        });
        // let func = window.history.pushState;
        // window.history.pushState = function(state, ...args) {
        //     console.log(state);
        //     // Call the original method
        //     return func.apply(window.history, args);
        // };
        const queryParams = getQueryParams(window.location.href);
        if(
            queryParams["itemId"]
        ) {
            ENGINE.changeState(
                new BG3Index(),
                queryParams
            );
        } else {
            ENGINE.changeState(
                new BG3SearchInterface(),
                queryParams
            );
        }
        // }
    }

    private tryAddMousetrapBindings(): void {
        if(ENGINE_DEBUG_MODE || GAME_DEBUG_MODE) {
            let drawCount = 0;
            let printDrawCount = false;
            const renderer = ENGINE.getUIManager().getRenderer();
            // @ts-ignore
            const drawElements = renderer.gl.drawElements;
            // @ts-ignore
            renderer.gl.drawElements = (...args: any[]) => {
                // @ts-ignore
                drawElements.call(renderer.gl, ...args);
                drawCount++;
            }; // rewrite drawElements to count draws
            ENGINE.getTicker().add(() => {
                if(printDrawCount) {
                    console.log("Draw count %i", drawCount);
                    printDrawCount = false;
                }
                drawCount = 0; // clear count per frame
            });

            const log = () => {
                printDrawCount = true;
                const renderer = ENGINE.getUIManager().getRenderer() as Renderer;
                console.log("%ix%i", renderer.width, renderer.height);
                // @ts-ignore
                const buffers = renderer.geometry.managedGeometries;
                const rts = renderer.framebuffer.managedFramebuffers;
                const formatToSize: { [key: number]: number } = {
                    [FORMATS.RGB]: 3,
                    [FORMATS.RGBA]: 4,
                    [FORMATS.DEPTH_COMPONENT]: 3,
                    [FORMATS.DEPTH_STENCIL]: 4,
                    [FORMATS.ALPHA]: 1,
                    [FORMATS.LUMINANCE]: 1,
                    [FORMATS.LUMINANCE_ALPHA]: 2
                };
                const textures = renderer.texture.managedTextures;
                let textureTotalMem = 0;
                for (const key in textures) {
                    const t = textures[key];
                    textureTotalMem += t.width * t.height * formatToSize[t.format];
                }
                let bufferTotalMem = 0;
                for (const key in buffers) {
                    const b = buffers[key];
                    b.buffers.forEach((e) => {
                        bufferTotalMem += e.data.byteLength;
                    });
                }
                console.log(`{
                count: {
                    textures: ${textures.length},
                    buffers: ${Object.keys(buffers).length},
                    renderTextures: ${rts.length}
                },
                mem: {
                    // in MBs
                    textures: ${textureTotalMem / (1024 * 1024)},
                    buffers: ${bufferTotalMem / (1024 * 1024)}
                }
            }`);

                console.log(renderer);
            };
            Mousetrap.bind("ctrl+alt+r", log);
            Mousetrap.bind("c r a s h", () => {
                throw new Error("Test");
            });
            Mousetrap.bind("s c e n e", () => {
                console.log(constructSceneGraphString(ENGINE.getActiveState()["scene"]));
            });
        }
    }

    private checkEntryPoint(data: { [key: string]: unknown }): EntrypointTypes {
        return (data && data["from"] as EntrypointTypes) || EntrypointTypes.NONE;
    }

    onDestroy(engine: Engine): void {
    }

    onStep(_engine: Engine): void {
    }
}
