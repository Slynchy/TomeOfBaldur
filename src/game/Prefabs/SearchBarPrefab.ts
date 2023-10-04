import { GameObject, HelperFunctions } from "../../tsthree";
import {
    Container,
    DisplayObject,
    Graphics,
    NineSlicePlane,
    Rectangle,
    Sprite,
    Text,
    TextStyle,
    Texture
} from "pixi.js";
import {buttonify} from "../../engine/HelperFunctions/buttonify";
import {GAME_FONT} from "../Constants/Constants";
import MiniSearch, {SearchResult} from "minisearch";
import isMobile from "is-mobile";
import {isTouchDevice} from "../../engine/HelperFunctions/isTouchDevice";
import { GAME_DEBUG_MODE } from "../../engine/Constants/Constants";
import { TJsonBG3 } from "../Types/IJsonBg3";

const mobileDeviceInputGrabberSingleton = document.createElement("input");
const POOL_SIZE = 10;
const SEARCH_PREVIEW_ENTRY_HEIGHT = 40;

export class SearchbarPrefab extends GameObject {
    private static _minisearchCaches: Record<string, MiniSearch> = {};
    private static _currentSelectedInstance: SearchbarPrefab;

    private _acceptingInput: boolean = false;

    private _textOffset: number = 0;
    public get textOffset(): number {
        return this._textOffset;
    }
    public set textOffset(_val: number) {
        this._textOffset = _val;
        this._searchBarText.position.set(4 + _val, 4);
    }

    private _onSearch: (_results: { name: string, id: string, type?: string }[]) => void;
    private _onFeelingLucky: () => void;
    private _isInitialized: boolean = false;

    private _searchBarBg: NineSlicePlane;
    private _searchBarText: Text;
    private _carat: Text;
    private _caratTick: number = 0;

    private _allowFreeInput: boolean = false;
    private _fuzzy: number = 0.1;
    private _prefix: boolean = true;
    private _minisearchKey: string = "default";

    private _skipPreview: boolean = false;

    private _searchFilterFunction: (params: any) => boolean;

    private searchPreviewElements: {
        container: Container;
        textPool: Text[];
        bg: NineSlicePlane;
        selectedElementBg: DisplayObject;
        selectedElementSpr: Sprite;
        searchIcon: Sprite;
    };

    public isPreviewVisible(): boolean {
        return this.searchPreviewElements.container.visible;
    }

    public get currentText(): string {
        return this._searchBarText.text;
    }

    public set currentText(val: string) {
        this._searchBarText.text = val;
        this._carat.position.set(
            0 + (this._searchBarText.text == "" ? 0 : this._searchBarText.width) + this._textOffset,
            this._carat.position.y,
        );
        this.searchPreviewElements.container.visible = false;
        this.searchPreviewElements.selectedElementBg.visible = false;
    }

    public static getMinisearchCaches(): Record<string, MiniSearch> {
        return this._minisearchCaches;
    }

    public static setMinisearchCache(key: string, obj: MiniSearch): void {
        this._minisearchCaches[key] = obj;
    }

    public static getMinisearchCache(_key: string = "default"): MiniSearch {
        return this._minisearchCaches[_key];
    }

    public static hasMinisearchCache(_key: string): boolean {
        return Boolean(this._minisearchCaches[_key]);
    }

    public get acceptingInput(): boolean {
        return this._acceptingInput;
    }

    public set acceptingInput(_val: boolean) {
        if(SearchbarPrefab._currentSelectedInstance && SearchbarPrefab._currentSelectedInstance !== this)
            SearchbarPrefab._currentSelectedInstance.acceptingInput = false;
        SearchbarPrefab._currentSelectedInstance = this;
        this._acceptingInput = _val;
        this._carat.visible = _val;
    }

    constructor(_settings: {
        width: number;
        height?: number;
        fuzzy?: number;
        prefix?: boolean;
        fontSize?: number;
        allowFreeInput?: boolean;
        minisearchKey?: string;
        skipButtons: boolean;
        onType: () => void;
        searchFilterFunction?: (params: any) => boolean;
        skipPreview?: boolean;
    }) {
        super("SearchbarPrefab");

        this._fuzzy = _settings.fuzzy || this._fuzzy;
        this._allowFreeInput = _settings.allowFreeInput || this._allowFreeInput;
        this._prefix = _settings.prefix || this._prefix;
        this._minisearchKey = _settings.minisearchKey || this._minisearchKey;
        this._searchFilterFunction = _settings.searchFilterFunction || null;
        this._skipPreview = _settings.skipPreview;

        const searchBarContainer = new Container();
        this.addChild(searchBarContainer);

        const searchBarBg = this._searchBarBg = new NineSlicePlane(
            ENGINE.getPIXIResource("TT_full_bg") as Texture,
            32, 32, 32, 32
        );
        searchBarBg.scale.set(1.0, 1.0);
        searchBarBg.position.set(-4, 0);
        searchBarBg.alpha = 0.75;
        searchBarBg.height = _settings.height || 20;
        searchBarBg.width = _settings.width;
        searchBarContainer.addChild(searchBarBg);
        searchBarContainer.position.set(-(searchBarBg.width * 0.5), 0);

        buttonify(searchBarBg, {
            disableButtonMode: true,
            onFire: () => this.setAcceptInput(),
            onPointerOver: () => {
                document.body.style.cursor = "text";
            },
            onPointerOut: () => {
                document.body.style.cursor = "auto";
            }
        });

        const carat = this._carat = new Text("|", new TextStyle({
            fill: 0xeaeaea,
            fontSize: _settings?.fontSize || 11,
            fontFamily: GAME_FONT,
        }));
        carat.position.set(4, 2);
        carat.visible = false;
        searchBarContainer.addChild(carat);

        const searchBarText = this._searchBarText = new Text("", new TextStyle({
            fill: 0xeaeaea,
            fontSize: _settings?.fontSize || 11,
            fontFamily: GAME_FONT,
        }));
        searchBarText.position.set(4, 4);
        searchBarContainer.addChild(searchBarText);

        const searchIcon = new Sprite(ENGINE.getTexture("ico_search"));
        searchIcon.anchor.set(1, 0);
        searchIcon.scale.set(0.8);
        searchIcon.position.set(
            searchBarBg.width - 8,
            -2
        );
        searchBarContainer.addChild(searchIcon);

        const searchPreviewContainer = new Container();
        searchPreviewContainer.position.set(searchBarBg.position.x - (searchBarBg.width * 0.5), searchBarBg.position.y + searchBarBg.height);
        const searchPreviewBg = new NineSlicePlane(
            ENGINE.getPIXIResource("TT_full_bg") as Texture,
            120, 106, 120, 106
        );
        searchPreviewBg.width = searchBarBg.width;
        searchPreviewBg.height = SEARCH_PREVIEW_ENTRY_HEIGHT * POOL_SIZE;
        searchPreviewContainer.addChild(searchPreviewBg);
        const searchPreviewTextPool: Text[] = [];
        // const slctPreviewBg = new Graphics();
        // slctPreviewBg.beginFill(0x0000ff);
        // slctPreviewBg.drawRect(0, 0, searchPreviewBg.width, SEARCH_PREVIEW_ENTRY_HEIGHT);
        // slctPreviewBg.endFill();
        const slctPreviewBg = new Container();
        const spr = new Sprite(
            ENGINE.getTexture("Glow")
        );
        spr.alpha = 0.2;
        spr.visible = false; // fixme

        slctPreviewBg.addChild(spr);
        searchPreviewContainer.addChild(slctPreviewBg);
        for(let i = 0; i < POOL_SIZE; i++) {
            const text = new Text(
                "",
                new TextStyle({
                    fill: 0xff0000, // i === 0 ? 0xffffff : 0x000000,
                    fontSize: 22,
                    fontFamily: GAME_FONT,
                })
            );
            text.hitArea = new Rectangle(0, 0, searchPreviewBg.width, SEARCH_PREVIEW_ENTRY_HEIGHT);
            text.position.set(16, (SEARCH_PREVIEW_ENTRY_HEIGHT * i) + 4);
            searchPreviewContainer.addChild(text);
            searchPreviewTextPool.push(text);
        }
        searchPreviewContainer.visible = false;
        this.addChild(searchPreviewContainer);
        this.searchPreviewElements = {
            bg: searchPreviewBg,
            container: searchPreviewContainer,
            searchIcon: searchIcon,
            textPool: searchPreviewTextPool,
            selectedElementBg: slctPreviewBg,
            selectedElementSpr: spr,
        };

        this.addInput(_settings.onType);
    }

    public setAcceptInput(): void {
        this.acceptingInput = true;
        this._carat.visible = true;
        SearchbarPrefab._currentSelectedInstance = this;
        if(isMobile() || isTouchDevice()) {
            mobileDeviceInputGrabberSingleton
                .setAttribute(
                    "style",
                    "position:absolute; right: 0px; width: 100%; height: 5%; top: 0px; opacity: 0;"
                );
            mobileDeviceInputGrabberSingleton
                .setAttribute("type", "text");
            document.body.appendChild(mobileDeviceInputGrabberSingleton);
            mobileDeviceInputGrabberSingleton.oninput = () => {
                this._caratTick = 0;
                this._carat.visible = true;
                this.updatePreviews();
            };
            mobileDeviceInputGrabberSingleton.focus();
        }
    }

    private updatePreviews(): void {
        // const lgl = SearchbarPrefab.getMinisearchCache();
        const results = SearchbarPrefab._minisearchCaches[
            this._minisearchKey
        ]?.search(
            this._searchBarText.text,
            {
                fuzzy: 0.1,
                prefix: true,
                filter: this._searchFilterFunction || null,
            }
        ).sort(
            (a,b) => {
                if(a.score > b.score) {
                    return -1;
                } else if (a.score < b.score) {
                    return 1;
                } else {
                    return 0;
                }
            }
        ).slice(0, POOL_SIZE) || [];
        // alert(JSON.stringify(results, null, "  "));
        this.searchPreviewElements.textPool.forEach((e, i) => {
            if(results[i]) {
                const data = (
                    ENGINE.getJSON("IndexJSON") as TJsonBG3
                )[results[i].id];
                e.text = `${data?.name || results[i].id} (${data.type || "Unknown"})`;
                e.visible = true;

                // HACK
                // it's late, i'm tired, time for a hack.
                // @ts-ignore
                e["__IDHACK"] = results[i].id;
                // @ts-ignore
                e["__TYPEHACK"] = results[i].type;
                // HACK
            } else {
                e.visible = false;
            }
        });
        this.searchPreviewElements.selectedElementBg.visible = !this._allowFreeInput && results.length !== 0;
        this.searchPreviewElements.bg.height = SEARCH_PREVIEW_ENTRY_HEIGHT * results.length;
        this.searchPreviewElements.container.visible = true;
        this.searchPreviewElements.selectedElementBg.position.y = 0;
        this.searchPreviewElements.textPool.forEach((e, i) => {
            if(i === 0 && this.searchPreviewElements.selectedElementBg.visible) {
                e.style.fill = "#D7D4CA";
            } else {
                e.style.fill = "#D7D4CA";
            }
        });
    }

    private addInput(
        onType: () => void
    ) {
        if(this._isInitialized) return;
        const onSearch = (_retVal?: string) => {
            if(!this._onSearch) return;
            if(_retVal) {
                if(GAME_DEBUG_MODE) console.log(_retVal);
                this._onSearch([
                    {
                        name: _retVal,
                        id: _retVal,
                    }
                ]);
            }
            this.searchPreviewElements.container.visible = false;
            document.body.style.cursor = "auto";

            if(this._allowFreeInput && this.searchPreviewElements.selectedElementBg.visible == false) {
                if(this.searchPreviewElements?.selectedElementBg.visible) {
                    const ind = Math.floor((this.searchPreviewElements.selectedElementBg.position.y) / SEARCH_PREVIEW_ENTRY_HEIGHT);
                    // console.log(this.searchPreviewElements.textPool[ind].text);
                    this._onSearch([{
                        name: this.searchPreviewElements.textPool[ind].text,
                        // @ts-ignore
                        id: this.searchPreviewElements.textPool[ind]["__IDHACK"],
                        // @ts-ignore
                        type: this.searchPreviewElements.textPool[ind]["__TYPEHACK"]
                    }]);
                } else {
                    this._onSearch([{
                        name: this._searchBarText.text,
                        id: this._searchBarText.text,
                        // @ts-ignore
                        // type: this.searchPreviewElements.textPool[ind]["__TYPEHACK"]
                    }]);
                }
            } else if(this._skipPreview) {
                const results = SearchbarPrefab._minisearchCaches[
                    this._minisearchKey
                ]?.search(
                    this._searchBarText.text,
                    {
                        prefix: this._prefix,
                        fuzzy: this._fuzzy,
                        filter: this._searchFilterFunction
                    }
                ) || [];
                this._onSearch(results.map((e) => e.name));
            } else {
                const ind = Math.floor((this.searchPreviewElements.selectedElementBg.position.y) / SEARCH_PREVIEW_ENTRY_HEIGHT);
                this._onSearch([{
                    name: this.searchPreviewElements.textPool[ind].text,
                    // @ts-ignore
                    id: this.searchPreviewElements.textPool[ind]["__IDHACK"],
                    // @ts-ignore
                    type: this.searchPreviewElements.textPool[ind]["__TYPEHACK"]
                }]);
            }
        };
        const inputHandler = async (ev: KeyboardEvent): Promise<void> => {
            // debugger;
            if(!this.acceptingInput) {
                return;
            }
            if(
                ev.key !== "Backspace" &&
                ev.key !== "Enter" &&
                ev.key !== "ArrowDown" &&
                ev.key !== "ArrowUp" &&
                ev.key.length > 1
            ) return;

            const oldLen = this._searchBarText.text.length;
            let skipPreview: boolean = this._skipPreview || false;

            let txt = ev.key;
            if((ev.ctrlKey || ev.metaKey) && ev.key === "v") {
                const clipboardItem = (await navigator.clipboard.read())?.[0];
                if(
                    clipboardItem && clipboardItem.types.includes('text/plain')
                ) {
                    const text = await clipboardItem.getType('text/plain');
                    const decodedText = new TextDecoder().decode(await text.arrayBuffer());
                    txt = decodedText;
                }
            }

            if(ev.code === "ArrowDown" || ev.code === "ArrowUp") {
                const isUp: boolean = ev.code === "ArrowUp";

                const oldInd = Math.floor((this.searchPreviewElements.selectedElementBg.position.y) / SEARCH_PREVIEW_ENTRY_HEIGHT);
                const newInd = Math.min(Math.max(
                    Math.floor(
                        (
                            this.searchPreviewElements.selectedElementBg.position.y + (isUp ? -SEARCH_PREVIEW_ENTRY_HEIGHT : SEARCH_PREVIEW_ENTRY_HEIGHT)
                        ) / SEARCH_PREVIEW_ENTRY_HEIGHT),
                    0
                ), this.searchPreviewElements.textPool.filter((e) => e.text !== "" && e.visible).length - 1);
                if(
                    newInd === -1
                ) return;
                if(this.searchPreviewElements.selectedElementBg.visible == false) {
                    this.searchPreviewElements.selectedElementBg.visible = true;
                    this.searchPreviewElements.selectedElementBg.position.set(
                        0,
                        0,
                    );
                    this.searchPreviewElements.textPool[0].style.fill = "#FFBB25";
                } else {
                    this.searchPreviewElements.selectedElementBg.position.set(
                        0,
                        newInd * SEARCH_PREVIEW_ENTRY_HEIGHT,
                    );
                    this.searchPreviewElements.textPool[oldInd].style.fill = "#D7D4CA";
                    this.searchPreviewElements.textPool[newInd].style.fill = "#FFBB25";
                }
            } else if(ev.key === "Backspace") {
                this._searchBarText.text =
                    this._searchBarText.text.substring(0, this._searchBarText.text.length - 1);
                if(mobileDeviceInputGrabberSingleton) {
                    mobileDeviceInputGrabberSingleton.value = this._searchBarText.text;
                }
                this._carat.position.set(
                    0 + (this._searchBarText.text == "" ? 0 : this._searchBarText.width) + this._textOffset,
                    this._carat.position.y,
                );
                this._caratTick = 0;
                this._carat.visible = true;
                onType();
            } else if(ev.key === "Enter" || ev.key === "Tab") {
                this.acceptingInput = false;
                skipPreview = true;
                ev.preventDefault();
                if(
                    !this.searchPreviewElements.selectedElementBg.visible &&
                    this.searchPreviewElements.textPool[0].visible &&
                    // @ts-ignore
                    this.searchPreviewElements.textPool[0]["__IDHACK"]
                ) {
                    onSearch(
                        // @ts-ignore
                        this.searchPreviewElements.textPool[0]["__IDHACK"],
                    );
                } else {
                    onSearch();
                }
            } else {
                this._searchBarText.text += txt;
                this._carat.position.set(
                    0 + (this._searchBarText.text == "" ? 0 : this._searchBarText.width) + this._textOffset,
                    this._carat.position.y,
                );
                this._caratTick = 0;
                this._carat.visible = true;
                onType();
            }

            const newLen = this._searchBarText.text.length;
            if(oldLen !== newLen && newLen !== 0 && skipPreview == false) {
                this.updatePreviews();
            } else if(newLen === 0) {
                this.searchPreviewElements.container.visible = false;
            }
        };
        this.searchPreviewElements.textPool.forEach((text, i) => {
            buttonify(text, {
                disableButtonMode: false,
                onFire: () => {
                    if(GAME_DEBUG_MODE) {
                        console.log("Selecting autocomplete %s", text.text);
                    }
                    onSearch(text.text);
                },
                onPointerOver: () => {
                    const oldInd = Math.floor((this.searchPreviewElements.selectedElementBg.position.y) / SEARCH_PREVIEW_ENTRY_HEIGHT);
                    this.searchPreviewElements.selectedElementBg.position.y = (SEARCH_PREVIEW_ENTRY_HEIGHT * i);
                    const newInd = Math.floor((this.searchPreviewElements.selectedElementBg.position.y) / SEARCH_PREVIEW_ENTRY_HEIGHT);
                    // this.searchPreviewElements.selectedElementBg.visible = true;
                    if(newInd !== -1 && newInd < this.searchPreviewElements.textPool.length){
                        // donothing?
                    }
                    this.searchPreviewElements.textPool[oldInd].style.fill = "#D7D4CA";
                    this.searchPreviewElements.textPool[newInd].style.fill = "#FFBB25";
                    // if(oldInd == newInd) return;
                    this.searchPreviewElements.selectedElementBg.position.set(
                        0,
                        newInd * SEARCH_PREVIEW_ENTRY_HEIGHT,
                    );
                    HelperFunctions.smartScale2D(
                        {
                            x: this.searchPreviewElements.textPool[newInd].width * 1.3,
                            y: this.searchPreviewElements.textPool[newInd].height * 1.5
                        },
                        this.searchPreviewElements.selectedElementSpr
                    );
                    this.searchPreviewElements.selectedElementSpr.position.set(
                        -32,
                        -0
                    );
                    this.searchPreviewElements.selectedElementBg.visible = true;
                }
            });
        });
        buttonify(this.searchPreviewElements.searchIcon, {
            onFire: () => {
                if(
                    this.searchPreviewElements.textPool[0].visible &&
                    // @ts-ignore
                    this.searchPreviewElements.textPool[0]["__IDHACK"]
                ) {
                    onSearch(
                        // @ts-ignore
                        this.searchPreviewElements.textPool[0]["__IDHACK"],
                    );
                } else {
                    onSearch();
                }
            }
        });

        let inputPromise: Promise<void> | null = null;
        window.addEventListener("keydown", (ev) => {
            if(inputPromise) return;
            inputHandler(ev)
                .then(() => inputPromise = null);
        }, false);

        this._isInitialized = true;
    }

    public updateSearch(
        _onSearch: (_results: { name: string, id: string, type?: string, description?: string }[]) => void,
        _dataJSON: TJsonBG3
    ): void {
        if(!SearchbarPrefab.hasMinisearchCache("default")) {
            SearchbarPrefab._minisearchCaches["default"] = new MiniSearch({
                fields: ['name', 'id'], // fields to index for full-text search
                storeFields: ['id'] // fields to return with search results
            });

            SearchbarPrefab._minisearchCaches["default"].addAll(
                Object.keys(_dataJSON)
                    .map((key) => {
                        const data = _dataJSON[key];
                        if(
                            data.type === "StatusData" ||
                            data.type === "PassiveData" ||
                            data.type === "SpellData"
                        ) return null;
                        return {
                            id: key,
                            // type: data.type || null,
                            name: data.name || null,
                            // description: data.description || null,
                        };
                    })
                    .filter((e) => Boolean(e))
            );
        }

        this._searchBarText.text = "";
        if(isMobile() || isTouchDevice()) {
            this._onSearch = (_results: { name: string, id: string }[]) => {
                mobileDeviceInputGrabberSingleton.remove();
                mobileDeviceInputGrabberSingleton.oninput = null;
                mobileDeviceInputGrabberSingleton.value = "";
                _onSearch(_results);
            };
        } else {
            this._onSearch = _onSearch;
        }
        // this._onFeelingLucky = _onFeelingLucky;
    }

    public hide() {
        if(this.parent) {
            this.parent.removeChild(this);
        }
        this.visible = false;
    }

    public show(_parent: Container) {
        this.visible = true;
        _parent.addChild(this);
        this._carat.position.set(4 + this._textOffset, 2);
        this._searchBarText.text = "";
    }

    public static buildBasicMinisearchObject(_strings: string[]): any[] {
        return _strings.map((e) => ({
            id: e, //.replace(/http:\/\/|www\.|\.com|\.net/g, ""),
            name: e,
        }));
    }

    onStep(_dt: number) {
        super.onStep(_dt);
        if(!this.visible || !this.parent || !this.acceptingInput) return;
        this._caratTick += _dt * 20;
        if(this._caratTick >= 1000) {
            this._caratTick = 0;
            this._carat.visible = !this._carat.visible;
        }
        if((isMobile() || isTouchDevice()) && this._searchBarText) {
            this._searchBarText.text = mobileDeviceInputGrabberSingleton.value;
            this._carat.position.set(
                0 + (this._searchBarText.text == "" ? 0 : this._searchBarText.width) + this._textOffset,
                this._carat.position.y,
            );
        }
    }
}