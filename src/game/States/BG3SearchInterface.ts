import { Engine, HelperFunctions, State } from "../../tsthree";
import { SearchbarPrefab } from "../Prefabs/SearchBarPrefab";
import { BG3Index } from "./BG3Index";
import {
    Container,
    DisplayObject,
    Sprite,
    Text,
    InteractionEvent as PIXIInteractionEvent,
    TextStyle,
    Graphics
} from "pixi.js";
import { tsthreeConfig } from "../../config/tsthreeConfig";
import { TJsonBG3 } from "../Types/IJsonBg3";
import TaggedText from "pixi-tagged-text";
import { GAME_FONT, GAME_FONT_BOLD } from "../Constants/Constants";
import { BG3Categories, BG3CategorySingleton } from "../Logic/BG3CategorySingleton";
import { buttonify } from "../../engine/HelperFunctions/buttonify";
import { GoBackButtonPrefab } from "../Prefabs/GoBackButtonPrefab";
import { TEntryId } from "../Types/SharedTypes";
import { InteractionEvent } from "../../engine/Types/InteractionEvent";
import { changeToResult } from "../Logic/changeToResult";

// todo: scale with device height
const MAX_SEARCH_RESULTS_PER_PAGE = 10;

interface ISearchResultsElements {
    container: Container;
    resultText: Text;
    nextPageText: Text;
    prevPageText: Text;
    pageCountText: Text;
}

export class BG3SearchInterface extends State {

    private searchBarPrefab: SearchbarPrefab;
    private logo: Sprite;
    private listLinksText: TaggedText;
    private searchResultsElements: ISearchResultsElements;

    private currentSearchPage: number = 0;
    private currentSearchCategory: BG3Categories | null = null;
    private searchResults: Array<TEntryId> = [];

    createSearchResultsContainer(): ISearchResultsElements {
        const container = new Container();

        const selectObjContainer = new Container();
        const selectObj = new Graphics();
        selectObj.lineStyle(1, 0xb0651a, 0.3);
        selectObj.drawCircle(0, 16, 14);
        selectObjContainer.addChild(selectObj);
        container.addChild(selectObjContainer);
        selectObjContainer.visible = false;

        const resultText = new Text("", new TextStyle({
                align: "center",
                fontSize: 24,
                fontFamily: GAME_FONT,
                lineHeight: 32,
                fill: "#FFBB25",
            }));
        resultText.anchor.set(0.5, 0);
        container.addChild(resultText);
        buttonify(resultText, {
            onFire: (ev) => {
                const pos = ev.data.getLocalPosition(
                    resultText
                );
                const selectedElement = Math.min(
                    Math.floor(
                        pos.y / (
                            (resultText.height / Math.min(
                                MAX_SEARCH_RESULTS_PER_PAGE,
                                this.searchResults.slice(
                                    this.currentSearchPage * MAX_SEARCH_RESULTS_PER_PAGE
                                ).length
                            ))
                        )
                    )
                );
                const itemId = this.searchResults[
                    (
                        this.currentSearchPage * MAX_SEARCH_RESULTS_PER_PAGE
                    ) + selectedElement
                ];
                console.log(selectedElement);
                console.log(itemId);
                if(
                    (
                        ENGINE.getJSON("IndexJSON") as TJsonBG3
                    )[itemId]
                ) {
                    changeToResult(itemId);
                }
            },
            onPointerOver: () => {
                selectObjContainer.visible = true;
                selectObj.width = resultText.width * 0.8;
            },
            onPointerOut: () => {
                selectObjContainer.visible = false;
            },
            onPointerMove: (ev) => {
                if(!selectObjContainer.visible) return;
                const pos = ev.data.getLocalPosition(
                    resultText
                );
                const selectedElement = Math.floor(pos.y / (
                    (
                        resultText.height / Math.min(
                            MAX_SEARCH_RESULTS_PER_PAGE,
                            (this.searchResults.length - (this.currentSearchPage * MAX_SEARCH_RESULTS_PER_PAGE))
                        )
                    )
                ));
                selectObjContainer.position.set(0, selectedElement * 32);
            }
        });

        const goBackText = new GoBackButtonPrefab();
        goBackText.position.set(
            -(tsthreeConfig.width * 0.5),
            0,
        );
        container.addChild(goBackText);

        const pageCountText = new Text(
            "Page 1/1",
            new TextStyle({
                fontFamily: GAME_FONT_BOLD,
                fontSize: 24,
                fill: "#D7D4CA"
            })
        );
        pageCountText.alpha = 0.8;
        pageCountText.anchor.set(0.5, 0);
        container.addChild(pageCountText);

        const nextPageText = new Text(
            "Next >",
            new TextStyle({
                fontFamily: GAME_FONT_BOLD,
                fontSize: 34,
                fill: "#D7D4CA"
            })
        );
        nextPageText.anchor.set(
            1, 0
        );
        container.addChild(nextPageText);

        const prevPageText = new Text(
            "< Previous",
            new TextStyle({
                fontFamily: GAME_FONT_BOLD,
                fontSize: 34,
                fill: "#D7D4CA"
            })
        );
        prevPageText.anchor.set(
            0, 0
        );
        container.addChild(prevPageText);

        buttonify([nextPageText, prevPageText], {
            onFire: (ev: PIXIInteractionEvent) => {
                let delta = 0;
                if(ev.target === nextPageText) {
                    delta = 1;
                } else if(ev.target === prevPageText) {
                    delta = -1;
                }
                this.currentSearchPage
                    = Math.min(Math.max(
                    0,
                    this.currentSearchPage + delta
                ), Math.floor(
                    this.searchResults.length / MAX_SEARCH_RESULTS_PER_PAGE
                ));
                this.updateSearchPage();
                if (history.pushState) {
                    const newurl =
                        window.location.protocol + "//" +
                        window.location.host + window.location.pathname +
                        `?searchCategory=${
                            this.currentSearchCategory
                        }&page=${
                            this.currentSearchPage
                        }`;
                    window.history.pushState({path: newurl},'', newurl);
                }
            },
            skipPointerDownChecks: true,
        });

        return {
            container: container,
            resultText: resultText,
            nextPageText: nextPageText,
            prevPageText: prevPageText,
            pageCountText: pageCountText,
        };
    }

    updateSearchPage(): void {
        const maxPages = Math.floor(
            this.searchResults.length / MAX_SEARCH_RESULTS_PER_PAGE
        );
        this.searchResultsElements.nextPageText.visible =
            this.currentSearchPage !== maxPages;
        this.searchResultsElements.prevPageText.visible =
            this.currentSearchPage !== 0;

        let str: string = "";
        // alert(`${
        //     MAX_SEARCH_RESULTS_PER_PAGE * (this.currentSearchPage)
        // } / ${
        //     (
        //         MAX_SEARCH_RESULTS_PER_PAGE * (this.currentSearchPage)
        //     ) + MAX_SEARCH_RESULTS_PER_PAGE
        // }`);
        this.searchResults
            .slice(
                MAX_SEARCH_RESULTS_PER_PAGE * (this.currentSearchPage),
                (
                    (
                        MAX_SEARCH_RESULTS_PER_PAGE * (this.currentSearchPage)
                    ) + MAX_SEARCH_RESULTS_PER_PAGE
                )
            )
            .forEach(
                (item, index, arr) => {
                    const data = (
                        ENGINE.getJSON("IndexJSON") as TJsonBG3
                    )[item];

                    let rarityStr: string = "";
                    if(data?.rarity) {
                        switch(data.rarity) {
                            case "Legendary":
                                rarityStr = " 🟡";
                                break;
                            case "Rare":
                                rarityStr = " 🔵";
                                break;
                            case "VeryRare":
                                rarityStr = " 🔴";
                                break;
                            case "Uncommon":
                                rarityStr = " 🟢";
                                break;
                            default:
                                rarityStr = " ⚪";
                                break;
                        }
                    }

                    // if(data) {
                        str += (
                            data?.name ||
                            item
                        ) +
                        ( rarityStr ) +
                        (
                            (
                                index !== MAX_SEARCH_RESULTS_PER_PAGE-1 &&
                                index !== arr.length-1
                            ) ? "\n" : ""
                        );
                        // str += item + "\n";
                    // }
                }
            );
        this.searchResultsElements.resultText.text = str;
        this.searchResultsElements.container.visible = true;

        this.searchResultsElements.pageCountText.text =
            `Page ${
                this.currentSearchPage + 1
            }/${
                Math.floor(this.searchResults.length / MAX_SEARCH_RESULTS_PER_PAGE) + 1
            }`;
    }

    onStep(_engine: Engine): void {
        super.onStep(_engine);
        if(this.searchBarPrefab.visible === false) {
            this.listLinksText.visible = false;
        } else if(
            this.searchBarPrefab.isPreviewVisible() === this.listLinksText.visible
        ) {
            this.listLinksText.visible =
                !this.searchBarPrefab.isPreviewVisible();
        }
    }

    onSelectCategory(_category: BG3Categories): void {
        // alert(url);

        if(!BG3CategorySingleton.categories[_category]) {
            console.warn("Invalid category %s", _category);
            return;
        }

        this.searchBarPrefab.visible = false;
        this.logo.visible = false;
        this.listLinksText.visible = false;

        this.searchResults =
            [
                ...BG3CategorySingleton.categories[_category]
            ];
        this.currentSearchCategory = _category;
        if (history.pushState) {

            let extraStr = "";
            const url = new URL(window.location.href);
            const params = new URLSearchParams(url.search);
            const pageValue = params.get('page');
            if(pageValue) {
                extraStr += `&page=${pageValue}`;
                this.currentSearchPage = parseInt(pageValue);
            }

            const newurl =
                window.location.protocol + "//" +
                window.location.host + window.location.pathname +
                `?searchCategory=${_category}${extraStr}`;
            window.history.pushState({path: newurl},'', newurl);
        } else {
            this.currentSearchPage = 0;
        }
        this.updateSearchPage();
        this.onResize(ENGINE);
    }

    onAwake(_engine: Engine, _params?: Record<string, string>): void {
        this.searchResultsElements = this.createSearchResultsContainer();
        this.searchResultsElements.container.visible = false;
        this.scene.addObject(this.searchResultsElements.container);

        this.logo = new Sprite(
            _engine.getTexture("Logo")
        );
        this.logo.anchor.set(0.5, 0);
        HelperFunctions.smartScale2D(
            {
                x: 256,
            },
            this.logo
        );
        this.scene.addObject(this.logo);

        this.searchBarPrefab = new SearchbarPrefab(
            {
                onType(): void {
                },
                allowFreeInput: true,
                skipButtons: true,
                height: 36,
                fontSize: 24,
                width: Math.min(tsthreeConfig.width - 32, 400)
            }
        );
        this.scene.addObject(this.searchBarPrefab);

        this.searchBarPrefab.updateSearch(
            (e) => {
                if(
                    e.length > 0 &&
                    e[0].id &&
                    (_engine.getJSON("IndexJSON") as TJsonBG3)[e[0].id]
                ) {
                    changeToResult(e[0].id);
                }
            },
            _engine.getJSON("IndexJSON")
        );

        let str: string = "";
        let catKeys = HelperFunctions.enumKeys(BG3Categories);
        catKeys.forEach((e, i) => {
            if( i === 0 ) return;
            str +=
                `${i % 2 == 0 ? " • " : ""}<link categoryId="${i}">${e}</link>${i % 2 == 0 ? "\n" : ""}`;
            // str += `<link categoryId="${i}">${e}</link>${i === catKeys.length - 1 ? "" : " • "}`;
        });
        this.listLinksText = new TaggedText(str, {
            default: {
                fontSize: 18,
                align: "center",
                wordWrap: true,
                wordWrapWidth: this.searchBarPrefab.width,
                fill: "#4c52a2",
                lineSpacing: 4,
                fontFamily: GAME_FONT,
            },
            link: {
                underlineThickness: 1,
                underlineColor: "#4c52a2",
                underlineOffset: 0,
            }
        }, {
            drawWhitespace: true,
        });
        this.listLinksText.visible = true;
        this.listLinksText.textFields.forEach((e) => {
            // @ts-ignore
            const targetUrl: BG3Categories = e.style?.categoryId;
            if(targetUrl) {
                buttonify(e, {
                    onFire: () => this.onSelectCategory(targetUrl),
                    onPointerOver: () => {
                        e.style.fill = "#404ace";
                        this.listLinksText.textFields.forEach((t) => {
                            // @ts-ignore
                            if(t.style?.categoryId === targetUrl) {
                                t.style.fill = "#404ace";
                            }
                        });
                    },
                    onPointerOut: () => {
                        e.style.fill = "#4c52a2";
                        this.listLinksText.textFields.forEach((t) => {
                            // @ts-ignore
                            if(t.style?.categoryId === targetUrl) {
                                t.style.fill = "#4c52a2";
                            }
                        });
                    }
                });
            }
        });
        this.listLinksText.anchor.set(0.5, 0);
        this.scene.addObject(this.listLinksText);

        this.onResize(_engine);
        if(
            _params
        ) {
            if(_params["page"]) {
                const pageNum = parseInt(_params["page"]);
                this.currentSearchPage = Number.isNaN(pageNum) ? 0 : pageNum;
                this.updateSearchPage();
            }
            if(
                _params["searchCategory"]
            ) {
                this.onSelectCategory(
                    _params["searchCategory"] as unknown as BG3Categories
                );
            }
        }
    }

    onResize(_engine: Engine): void {
        this.logo.position.set(
            tsthreeConfig.width * 0.5,
            0,
        );
        this.searchBarPrefab.position.set(
            tsthreeConfig.width * 0.5,
            this.logo.y + this.logo.height,
        );
        this.listLinksText.position.set(
            (
                this.listLinksText.textContainer.width * -0.5
            ) + (tsthreeConfig.width * 0.5) - 30,
            this.searchBarPrefab.y + this.searchBarPrefab.height + 16
        );

        // why the fuck does it need to be at 0.33 while others are at 0.5?
        // i really cba to fix that.
        this.searchResultsElements.container.position.set(
            tsthreeConfig.width * 0.5,
            64,
        );
        this.searchResultsElements.nextPageText.position.set(
            (tsthreeConfig.width * 0.5) - 32,
            this.searchResultsElements.resultText.height + 36,
        );
        this.searchResultsElements.prevPageText.position.set(
            (tsthreeConfig.width * -0.5) + 32,
            this.searchResultsElements.resultText.height + 36,
        );
        this.searchResultsElements.pageCountText.position.set(
            0,
            this.searchResultsElements.resultText.height
        );
        // this.searchResultsElements.resultText.position.set(
        //     -(this.searchResultsElements.resultText.width),
        //     -(0),
        // );
    }

    onDestroy(_engine: Engine) {
        super.onDestroy(_engine);
        this.scene.getStageChildren().forEach((e: DisplayObject) => {
            e.parent = null;
        });
    }

    preload(_engine: Engine): Promise<void> {
        return Promise.resolve(undefined);
    }

}