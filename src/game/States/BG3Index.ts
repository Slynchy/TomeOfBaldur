import { Engine, HelperFunctions, State } from "../../tsthree";
import { Container, Graphics, Sprite, Text, TextStyle, Texture } from "pixi.js";
import { tsthreeConfig } from "../../config/tsthreeConfig";
import { isFontReady } from "../../engine/HelperFunctions/isFontReady";
import { GAME_FONT, GAME_FONT_BOLD, GAME_FONT_ITALIC } from "../Constants/Constants";
import TaggedText from "pixi-tagged-text";
import { BootAssets, LoaderType } from "../../config/BootAssets";
import { IJsonBG3Entry, TJsonBG3 } from "../Types/IJsonBg3";
import { TRarity } from "../Types/SharedTypes";
import { buttonify } from "../../engine/HelperFunctions/buttonify";
import { BG3SearchInterface } from "./BG3SearchInterface";
import { GAME_DEBUG_MODE } from "../../engine/Constants/Constants";
import { GoBackButtonPrefab } from "../Prefabs/GoBackButtonPrefab";

const front_frame_keys: Record<TRarity, string> = {
    Legendary: "rarityFrame_legendary_front",
    None: "",
    Rare: "rarityFrame_rare_front",
    Story: "",
    Uncommon: "rarityFrame_uncommon_front",
    VeryRare: "rarityFrame_veryrare_front"
};

const back_frame_keys: Record<TRarity, string> = {
    Legendary: "rarityFrame_legendary_back",
    None: "",
    Rare: "rarityFrame_rare_back",
    Story: "",
    Uncommon: "rarityFrame_uncommon_back",
    VeryRare: "rarityFrame_veryrare_back"
};

export class BG3Index extends State {

    private damageDieMain: Sprite;
    private ACText: Text;
    private damageDieSecondary: Sprite;
    private descriptionIcon: Sprite;
    private dippableIcon: Sprite;
    private rarityText: Text;
    private damageText: Text;
    private proficiencyText: Text;
    private proficiencyIcon: Sprite;
    private damageTitleText: Text;
    private belowDamageText: Text;
    private itemIdText: Text;
    private descriptionText: TaggedText;
    private titleText: Text;
    private aspectsText: TaggedText;
    private weaponEnchantmentText: TaggedText;
    private mainFrameContainer: Container;
    private mainIconContainer: Container;
    private proficiencyIconContainer: Container;
    private boostIconContainer: Container;
    private mainIconBg: Graphics;
    private mainIcon: Sprite;
    private mainIconRarityBg: Sprite;
    private mainIconRarityFg: Sprite;
    private weaponEnchantmentContainer: Container;
    private contentsContainer: Container;
    private mainBgFrame: Graphics;
    private weaponTypeElements: {
        container: Container;
        icon: Sprite;
        text: Text;
    };
    private versatileElements: {
        container: Container;
        icon: Sprite;
        text: Text;
    };
    private proficiencySlots: Array<{
        container: Container;
        icon: Sprite;
        id: string;
    }>;
    private boostIconSlots: Array<{
        container: Container;
        icon: Sprite;
        id: string;
        upperText: Text;
        lowerText: Text;
    }>;
    private gradientObj: Graphics;

    onAwake(_engine: Engine, _params?: Record<string, string>): void {

        this.mainFrameContainer = new Container();
        this.scene.addObject(this.mainFrameContainer);
        this.mainFrameContainer.position.set(
            Math.floor(tsthreeConfig.width * 0.5),
            Math.floor( 48 + 128),
        );
        const goBackText = new GoBackButtonPrefab(_params);
        this.mainFrameContainer.addChild(goBackText);

        this.mainBgFrame = new Graphics();
        this.mainBgFrame.lineStyle(3, 0x806C5A, 1);
        this.mainBgFrame.beginFill(0x050505, 1);
        this.mainBgFrame.drawRoundedRect(0, 0, 512, 640, 35);
        this.mainBgFrame.endFill();
        this.mainBgFrame.position.set(-256, 0);
        this.mainFrameContainer.addChild(this.mainBgFrame);

        this.contentsContainer = new Container();
        this.mainBgFrame.addChild(this.contentsContainer);

        const testGradient = this.gradientObj = new Graphics();
        testGradient.beginFill(0x8CE2F7, 0.6);
        testGradient.drawRoundedRect(0, 0, 512, 512, 35);
        testGradient.endFill();
        testGradient.position.set(0, -0);
        const sprite = new Sprite(
            _engine.getTexture("color-mask")
        );
        testGradient.addChild(sprite);
        HelperFunctions.smartScale2D(
            {
                x: 512,
                y: 368
            },
            sprite
        );
        testGradient.mask = sprite;
        this.contentsContainer.addChild(testGradient);

        this.titleText = new Text("Thermodynamo Axe", new TextStyle({
            fontFamily: GAME_FONT,
            fontSize: 28,
            fill: "#8CE2F7"
        }));
        this.titleText.position.set(32, 32);
        this.contentsContainer.addChild(this.titleText);

        this.rarityText = new Text("Rare", new TextStyle({
            fontFamily: GAME_FONT,
            fontSize: 19,
            fill: "#D7D4CA"
        }));
        this.rarityText.position.set(32, 64);
        this.contentsContainer.addChild(this.rarityText);

        this.damageTitleText = new Text("1~10 Damage", new TextStyle({
            fontFamily: GAME_FONT,
            fontSize: 28,
            fill: "#D7D4CA"
        }));
        this.damageTitleText.position.set(32, 100);
        this.contentsContainer.addChild(this.damageTitleText);

        this.belowDamageText = new Text("Versatile", new TextStyle({
            fontFamily: GAME_FONT,
            fontSize: 20,
            fill: "#bda082"
        }));
        this.belowDamageText.position.set(32, 132);
        this.contentsContainer.addChild(this.belowDamageText);

        this.damageDieSecondary = new Sprite(
            _engine.getTexture("ico_d8")
        );
        this.damageDieSecondary.scale.set(0.6);
        this.damageDieSecondary.position.set(32 + 36, 160);
        this.contentsContainer.addChild(this.damageDieSecondary);

        this.damageDieMain = new Sprite(
            _engine.getTexture("ico_d10")
        );
        this.damageDieMain.scale.set(0.7);
        this.damageDieMain.position.set(32, 156);
        this.contentsContainer.addChild(this.damageDieMain);

        this.ACText = new Text(
            "20",
            new TextStyle({
                fontFamily: GAME_FONT,
                fontSize: 28,
                fill: "#f4f4f4"
            })
        );
        this.ACText.anchor.set(0.5);
        this.contentsContainer.addChild(this.ACText);

        this.damageText = new Text("1d10 (1d8) Slashing", new TextStyle({
            fontFamily: GAME_FONT,
            fontSize: 20,
            fill: "#a4a4a4"
        }));
        this.damageText.position.set(128, 176);
        this.contentsContainer.addChild(this.damageText);

        this.aspectsText = new TaggedText(
            "<title>Thermodynamo</title>: Whenever you deal damage with this weapon, you gain 2 turns of <link>Heat</link>.",
            {
                default: {
                    fontFamily: GAME_FONT,
                    fontSize: 18,
                    wordWrap: true,
                    wordWrapWidth: 512 - 32 - 32,
                    fill: "#D7D4CA",
                },
                debug: {
                    fill: "#464646",
                },
                title: {
                    fill: "#d3c8a1",
                },
                LSTag: {
                    fill: "#d3c8a1",
                    underlineThickness: 1,
                    underlineColor: "#d3c8a1",
                },
                heal: {
                    fill: "#499fec"
                }

                // temporary
                // link: {
                //     fill: "#d3c8a1",
                //     underlineThickness: 1,
                //     underlineColor: "#d3c8a1",
                // }
            },
            {
                drawWhitespace: true,
            });
        this.aspectsText.position.set(32, 230);
        this.contentsContainer.addChild(this.aspectsText);

        this.weaponEnchantmentContainer = new Container();
        this.weaponEnchantmentContainer.position.set(32, 290);
        this.contentsContainer.addChild(this.weaponEnchantmentContainer);

        this.dippableIcon = new Sprite(_engine.getTexture("ico_dippable"));
        this.weaponEnchantmentContainer.addChild(this.dippableIcon);

        this.weaponEnchantmentText = new TaggedText(
            "Weapon Enchantment <value>+1</value>",
            {
                default: {
                    fontFamily: GAME_FONT,
                    fontSize: 18,
                    fill: "#d3c8a1"
                },
                value: {
                    fill: "#8f7e65"
                }
            }
        );
        this.weaponEnchantmentText.position.set(
            60,
            15,
        );
        this.weaponEnchantmentContainer.addChild(this.weaponEnchantmentText);

        this.proficiencyIcon = new Sprite(_engine.getTexture("ico_proficiency"));
        HelperFunctions.smartScale2D(
            {
                x: 50,
                y: 50,
            },
            this.proficiencyIcon
        );
        this.proficiencyIcon.position.set(
            32 - 16, 370 - 17
        );
        this.contentsContainer.addChild(this.proficiencyIcon);

        this.proficiencyText = new Text(
            "Proficiency with this weapon type unlocks:",
            new TextStyle({
                fontFamily: GAME_FONT,
                fontSize: 18,
                fill: "#D7D4CA",
            })
        );
        this.proficiencyText.position.set(
            32 + 24,
            370
        );
        this.contentsContainer.addChild(this.proficiencyText);

        const proficiencyIconContainer =
            this.proficiencyIconContainer =
                new Container();
        proficiencyIconContainer.position.set(
            32,
            400
        );
        this.proficiencySlots = [];
        for(let i = 0; i < 8; i++) {
            const ret = BG3Index.createProficiencyAbilitySlot();
            ret.container.position.set(
                ret.container.width * i + (8 * i),
                0
            );
            proficiencyIconContainer.addChild(ret.container);
            this.proficiencySlots.push(ret);
        }
        this.contentsContainer.addChild(proficiencyIconContainer);

        const boostIconContainer =
            this.boostIconContainer =
                new Container();
        boostIconContainer.position.set(
            32,
            430
        );
        this.boostIconSlots = [];
        for(let i = 0; i < 4; i++) {
            const ret = BG3Index.createSpellAbilitySlot();
            ret.container.visible = false;
            boostIconContainer.addChild(ret.container);
            this.boostIconSlots.push(ret);
        }
        this.contentsContainer.addChild(boostIconContainer);

        this.descriptionIcon = new Sprite(_engine.getTexture("scrollBox_icon"));
        HelperFunctions.smartScale2D({
            x: 24,
            y: 24
        }, this.descriptionIcon);
        this.descriptionIcon.position.set(
            32,
            457
        );
        this.contentsContainer.addChild(this.descriptionIcon);

        this.descriptionText = new TaggedText(
            "Designed by gnomish innovation, this weapon has a dynamic core that swivels and tinkles into life whenever the axe is swung at a foe.",
            {
                default: {
                    fontFamily: GAME_FONT_ITALIC,
                    fill: 0x5a5a5a,
                    fontSize: 20,
                    wordWrapWidth: 512 - 80,
                    wordWrap: true,
                },
                LSTag: {
                    fill: "#757061",
                    underlineThickness: 1,
                    underlineColor: "#d3c8a1",
                },
                i: {
                    fontFamily: GAME_FONT_ITALIC,
                    fontSize: 18,
                }
            },
            {
                drawWhitespace: true,
            }
        );
        this.descriptionText.position.set(
            56,
            466
        );
        this.contentsContainer.addChild(this.descriptionText);

        this.weaponTypeElements = {
            container: null,
            icon: null,
            text: null,
        };
        this.weaponTypeElements.container = new Container();
        this.weaponTypeElements.container.position.set(32, 466 + this.descriptionText.height + 12);
        this.contentsContainer.addChild(this.weaponTypeElements.container);
        this.weaponTypeElements.icon = new Sprite(_engine.getTexture(
            "ico_roll_attack"
        ));
        HelperFunctions.smartScale2D(
            { x: 32, y: 32,},
            this.weaponTypeElements.icon
        );
        this.weaponTypeElements.container.addChild(this.weaponTypeElements.icon);
        this.weaponTypeElements.text = new Text("Battleaxe", new TextStyle({
            fontFamily: GAME_FONT,
            fontSize: 20,
            fill: 0xbababa
        }));
        this.weaponTypeElements.text.position.set(
            36, 5
        );
        this.weaponTypeElements.container.addChild(this.weaponTypeElements.text);

        this.versatileElements = {
            container: null,
            icon: null,
            text: null,
        };
        this.versatileElements.container = new Container();
        this.versatileElements.container.position.set(
            32 + this.weaponTypeElements.container.width + 12,
            466 + this.descriptionText.height + 12
        );
        this.contentsContainer.addChild(this.versatileElements.container);
        this.versatileElements.icon = new Sprite(_engine.getTexture(
            "ico_handedness"
        ));
        HelperFunctions.smartScale2D(
            { x: 32, y: 32,},
            this.versatileElements.icon
        );
        this.versatileElements.container.addChild(this.versatileElements.icon);
        this.versatileElements.text = new Text("Versatile", new TextStyle({
            fontFamily: GAME_FONT,
            fontSize: 20,
            fill: 0xbababa
        }));
        this.versatileElements.text.position.set(
            36, 5
        );
        this.versatileElements.container.addChild(this.versatileElements.text);

        this.mainIconContainer = new Container();
        this.mainIconContainer.position.set(
            -64,
            -120,
        );
        this.mainFrameContainer.addChild(this.mainIconContainer);

        this.mainIconBg = new Graphics();
        this.mainIconBg.lineStyle(3, 0x806C5A, 1);
        this.mainIconBg.beginFill(0x050505, 1);
        this.mainIconBg.drawRoundedRect(0, 0, 128, 128, 4);
        this.mainIconBg.endFill();
        this.mainIconBg.position.set(
            0, 0
        );
        this.mainIconContainer.addChild(this.mainIconBg);

        const invIconBg = new Sprite(_engine.getTexture("inv-slot"));
        invIconBg.anchor.set( 0.5 );
        invIconBg.position.set(
            64,
            64
        );
        HelperFunctions.smartScale2D(
            { x: 128, y: 128, },
            invIconBg
        );
        this.mainIconBg.addChild(invIconBg);
        this.mainIconRarityBg = new Sprite(_engine.getTexture("rarityFrame_rare_back"));
        this.mainIconRarityBg.anchor.set( 0.5 );
        this.mainIconRarityBg.position.set(
            64,
            64
        );
        HelperFunctions.smartScale2D(
            { x: 126, y: 126, },
            this.mainIconRarityBg
        );
        this.mainIconBg.addChild(this.mainIconRarityBg);
        this.mainIconRarityFg = new Sprite(_engine.getTexture("rarityFrame_rare_front"));
        this.mainIconRarityFg.anchor.set( 0.5 );
        this.mainIconRarityFg.position.set(
            64,
            64
        );
        HelperFunctions.smartScale2D(
            { x: 126, y: 126, },
            this.mainIconRarityFg
        );
        this.mainIconBg.addChild(this.mainIconRarityFg);
        this.mainIcon = new Sprite(
            Texture.EMPTY
        );
        HelperFunctions.smartScale2D(
            { x: 126, y: 126, },
            this.mainIcon
        );
        this.mainIcon.anchor.set( 0.5 );
        this.mainIcon.position.set(
            64,
            64
        );
        this.mainIconBg.addChild(this.mainIcon);

        this.itemIdText = new Text("", new TextStyle({
            fill: "#808080",
            fontSize: 14,
            align: "right",
            fontFamily: GAME_FONT
        }));
        this.itemIdText.anchor.set(1, 1);
        buttonify(this.itemIdText, {
            onPointerOver: () => {
                this.itemIdText.style.fill = "#505050";
            },
            onPointerOut: () => {
                this.itemIdText.style.fill = "#808080";
            },
            onFire: () => {
                const itemId = this.itemIdText.text.substring(
                    0,
                    this.itemIdText.text.indexOf("📋")
                );
                navigator.clipboard.writeText(itemId).then(() => {
                    if(this.itemIdText) {
                        this.itemIdText.text = itemId + "✔️";
                        setTimeout(
                            () => {
                                if(
                                    this.itemIdText &&
                                    this.itemIdText.text.indexOf(itemId) === 0
                                ) {
                                    this.itemIdText.text = itemId + "📋";
                                }
                            },
                            1000
                        );
                    }
                }).catch(function(err) {
                    console.error('Unable to copy text: ', err);
                });
            }
        });
        this.mainFrameContainer.addChild(this.itemIdText);

        // debug
        this.mainFrameContainer.visible = false;
        if(_params["itemId"]) {
            try {
                this.update(
                    _params["itemId"],
                    _engine.getJSON("IndexJSON")
                );
                this.onResize(ENGINE);
                this.mainFrameContainer.visible = true;
            } catch(err) {
                console.error(err);
            }
        } else {
            this.mainFrameContainer.visible = false;
        }

        HelperFunctions.wait(33).then(() => {
            ENGINE.onResize();
        });
    }

    static createSpellAbilitySlot(): {
        container: Container,
        icon: Sprite,
        upperText: Text,
        lowerText: Text,
        id: string
    } {
        const ret = new Container();

        const bg = new Graphics();
        bg.lineStyle(1, 0xD7D4CA);
        bg.drawRect(0, 0, 48, 48);
        ret.addChild(bg);

        const bgSprite = new Sprite(
            ENGINE.getTexture("spell_bg")
        );
        bgSprite.alpha = 0.8;
        bgSprite.width =
            bgSprite.height =
                48;
        ret.addChild(bgSprite);

        const upperText = new Text("Sunbeam", new TextStyle({
            fontFamily: GAME_FONT,
            fill: "#d3c8a1",
            fontSize: 22,
        }));
        upperText.position.set(
            48 + 8,
            0,
        );
        ret.addChild(upperText);

        const lowerText = new Text("Level 6 Evocation Spell", new TextStyle({
            fontFamily: GAME_FONT,
            fill: "#A18F81",
            fontSize: 16,
        }));
        lowerText.position.set(
            48 + 8,
            upperText.height,
        );
        ret.addChild(lowerText);

        const spr = new Sprite(
            Texture.EMPTY
        );
        HelperFunctions.smartScale2D({
            x: 48,
            y: 48,
        }, spr);
        ret.addChild(spr);

        return {
            container: ret,
            icon: spr,
            upperText,
            lowerText,
            id: ""
        };
    }

    static createProficiencyAbilitySlot(): {
        container: Container,
        icon: Sprite,
        id: string
    } {
        const ret = new Container();

        const bg = new Graphics();
        bg.lineStyle(1, 0xD7D4CA);
        bg.drawRect(0, 0, 48, 48);
        ret.addChild(bg);

        const spr = new Sprite(
            Texture.EMPTY
        );
        HelperFunctions.smartScale2D({
            x: 48,
            y: 48,
        }, spr);
        ret.addChild(spr);

        return {
            container: ret,
            icon: spr,
            id: ""
        };
    }

    static extractRangeStringFromDice(
        _str: string, // 1d6
        _modifier: number | string
    ): string {
        const basePrefix = _str.substring(
            0,
            _str.indexOf("d")
        );
        const baseSuffix = _str.substring(
            _str.indexOf("d") + 1
        );
        let prefixNum = parseInt(basePrefix);
        let suffixNum = parseInt(baseSuffix);

        if(_modifier) {
            const modifierNum = parseInt(_modifier as string);
            suffixNum = (suffixNum * prefixNum) + (modifierNum);
            prefixNum = (prefixNum + modifierNum);
        } else {
            suffixNum = (suffixNum * prefixNum);
        }

        return `${
            prefixNum
        }~${
            suffixNum
        }`;
    }

    parseStringForDescParams(
        descVal: string, // e.g. "[1]", "[69]", etc.
        typeStr: string,
        strToReplace: string,
    ): string {
        let paramData: string | null =
            typeStr.match(/\(([^)]+)\)/)?.[1];
        if(paramData) {
            const splitParams =
                paramData.split(",");
            switch(
                typeStr.substring(0, typeStr.indexOf("("))
            ) {
                case "DealDamage": // (die, type)
                    paramData = `${splitParams[0]} (${splitParams[1].trim()})`;
                    break;
                case "Distance": // (meters)
                    paramData = `${paramData}m`;
                    break;
                case "RegainHitPoints": // (die)
                    if(splitParams[0].indexOf("d") === -1) {
                        paramData = `<heal>${
                            splitParams[0]
                        } hit points</heal>`;
                    } else {
                        paramData = `<heal>${
                            BG3Index.extractRangeStringFromDice(paramData, 0)
                        } hit points</heal>`;
                    }
                    break;
                default:
                    break;
            }
        }
        let res = "" + strToReplace;
        while(
            res.indexOf(descVal) !== -1
        ) {
            res = res.replace(descVal, paramData || typeStr);
        }
        return res;
    }

    update(
        _key: string,
        _jsonData: TJsonBG3
    ) {
        const data = _jsonData[_key];
        this.titleText.text = data.name;
        if((data.otherData["SpellProperties"]?.indexOf("AI_ONLY") || -1) !== -1) {
            this.titleText.text += " (AI only)";
        }

        this.rarityText.visible = true;
        switch(data.rarity) {
            case "VeryRare":
                this.rarityText.text = "Very Rare";
                break;
            case "Uncommon":
            case "Legendary":
            case "Rare":
                this.rarityText.text = data.rarity;
                break;
            case "None":
            case "Story":
            default:
                // check if it's a skill or ability
                if(
                    data.type === "PassiveData" ||
                    data.type === "StatusData" ||
                    data.type === "SpellData"
                ) {
                    this.rarityText.text = data.type.substring(
                        0,
                        data.type.indexOf("Data")
                    );
                } else {
                    this.rarityText.text = "";
                    this.rarityText.visible = false;
                }
                break;
        }

        if(
            data.rarity &&
            data.rarity !== "None" &&
            data.rarity !== "Story"
        ) {
            this.mainIconRarityBg.visible = true;
            this.mainIconRarityFg.visible = true;
            this.mainIconRarityBg.texture = ENGINE.getTexture(
                back_frame_keys[data.rarity]
            );
            this.mainIconRarityFg.texture = ENGINE.getTexture(
                front_frame_keys[data.rarity]
            );
            this.gradientObj.clear();
            switch(data.rarity) {
                case "VeryRare":
                    this.gradientObj.beginFill(0x730848, 0.6);
                    this.titleText.style.fill = "#b80a6f";
                    break;
                case "Uncommon":
                    this.gradientObj.beginFill(0x2be117, 0.6);
                    break;
                case "Legendary":
                    this.gradientObj.beginFill(0xFFBB25, 0.6);
                    this.titleText.style.fill = "#FFBB25";
                    break;
                case "Rare":
                    this.gradientObj.beginFill(0x8CE2F7, 0.6);
                    this.titleText.style.fill = "#8CE2F7";
                    break;
                default:
                    this.gradientObj.beginFill(0x000000, 0.0);
                    this.titleText.style.fill = "#fafafa";
                    break;
            }
            this.gradientObj.drawRoundedRect(0, 0, 512, 512, 35);
            this.gradientObj.endFill();
            this.gradientObj.visible = true;
        } else {
            this.titleText.style.fill = "#fff2d1";
            this.mainIconRarityBg.visible = false;
            this.mainIconRarityFg.visible = false;
            this.gradientObj.visible = false;
        }

        let str: string = "";
        if(data.otherData["PassivesOnEquip"]) {
            const passives: string[] = [];
            if(data.otherData["PassivesOnEquip"].indexOf(";") !== -1) {
                passives.push(...(data.otherData["PassivesOnEquip"].split(";")));
            } else {
                passives.push(data.otherData["PassivesOnEquip"]);
            }
            const passiveData: IJsonBG3Entry[] =
                passives.map((e) => _jsonData[e]).filter((e) => Boolean(e));
            passiveData.forEach((e) => {
                let desc = e.description;
                let name = e.name;
                let inheritedPassiveData = e;
                const isHidden = (e.otherData["Properties"] &&
                    e.otherData["Properties"].split(";").indexOf("IsHidden") !== -1);
                if(
                    isHidden ||
                    !e.description
                ) {
                    if(e.inheritsFrom && !isHidden) {
                        while(
                            inheritedPassiveData.inheritsFrom &&
                            !inheritedPassiveData.description
                        ) {
                            inheritedPassiveData = _jsonData[inheritedPassiveData.inheritsFrom];
                        }
                        if(
                            inheritedPassiveData &&
                            inheritedPassiveData.description &&
                            !e.description
                        ) {
                            desc = inheritedPassiveData.description;
                        }
                        if(
                            inheritedPassiveData &&
                            inheritedPassiveData.name &&
                            !e.name
                        ) {
                            name = inheritedPassiveData.name;
                        }
                    } else {
                        return;
                    }
                }
                if(e.otherData["DescriptionParams"]) {
                    e.otherData["DescriptionParams"].split(";")
                        .forEach((s, i) => {
                            desc = this.parseStringForDescParams(`[${i+1}]`, s, desc);
                        });
                }
                str += `<title>${name}</title>: ${desc}\n\n`;
            });
        }

        const allInheritedData: IJsonBG3Entry[] = [data];
        let currEntry: IJsonBG3Entry = data;
        while(currEntry && currEntry.inheritsFrom) {
            currEntry = _jsonData[currEntry.inheritsFrom];
            allInheritedData.push(currEntry);
        }

        let allBoosts: string[] | string = allInheritedData
            .filter((e) => {
                return Boolean(e.otherData["Boosts"]);
            })
            .map((e) => {
                return e.otherData["Boosts"];
            });
        if(allBoosts.length > 0) {
            allBoosts = allBoosts.reduce((a, b) => (a + ";" + b));
            const boostSplit = allBoosts.split(";");
            boostSplit.forEach((boostStr) => {
                let paramData: string | null =
                    boostStr.match(/\(([^)]+)\)/)?.[1];
                const splitParams =
                    paramData?.split(",") || [];
                const funcName = boostStr.substring(0, boostStr.indexOf("("));
                switch(
                    funcName
                ) {
                    case "SpellSaveDC": // (num)
                        str += `<debug>[Hidden]</debug>: +${splitParams[0]} to <LSTag Tooltip="SpellSaveDC">Spell Save DC</LSTag>\n\n`;
                        break;
                    case "Ability": // (type, amt, max?)
                        str += `<LSTag Tooltip="${splitParams[0].trim()}">${
                            splitParams[0].trim()
                        }</LSTag> +${splitParams[1].trim()} ${
                            splitParams[2] ? 
                                `(up to ${splitParams[2].trim()})`
                                :
                                ""
                        }\n\n`;
                        break;
                    case "RollBonus": // (type: str, amt: str, skill?: str)
                        let type = splitParams[0].trim();
                        if(type == "SavingThrow") {
                            type = "Saving Throws";
                        }
                        if(splitParams.length >= 3) {
                            str += `<LSTag Tooltip="${splitParams[2].trim()}">${
                                splitParams[2].trim()
                            }</LSTag> ${
                                type
                            } +${splitParams[1].trim()}\n\n`;
                        } else {
                            str += `${
                                type
                            } +${splitParams[1].trim()}\n\n`;
                        }
                        break;
                    case "Disadvantage": // (type, name)
                    case "Advantage": // (type, name)
                        if(splitParams.length > 1) {
                            str += `<LSTag Tooltip="${funcName}">${funcName}</LSTag> on <LSTag Tooltip="${
                                splitParams[1].trim()
                            }">${splitParams[1].trim()}</LSTag> checks\n\n`;
                        } else {
                            str += `<LSTag Tooltip="${funcName}">${funcName}</LSTag> on <LSTag Tooltip="${
                                splitParams[0].trim()
                            }">${splitParams[0].trim()}</LSTag> checks\n\n`;
                        }
                        break;
                    case "UnlockSpell":
                        // handled below
                        break;
                    case "Skill": // (skillname, amt)
                        const amtParsed = parseInt(splitParams[1]);
                        str += `<LSTag Tooltip="${
                            splitParams[0]
                        }">${splitParams[0]}</LSTag> ${
                            amtParsed >= 0 ? "+" : "-"
                        }${
                            amtParsed
                        }\n\n`;
                        break;
                    case "AbilityOverrideMinimum": // (skill, amt)
                        str += `Increases the wearer's <LSTag Tooltip="${
                            splitParams[0]
                        }">${splitParams[0]}</LSTag> to ${
                            splitParams[1]
                        }\n\n`;
                        break;
                    case "CriticalHit": // (AttackTarget,Success,Never)
                        if(splitParams[2] === "Never") {
                            str += "Attackers can't land <LSTag>Critical Hits</LSTag> on the wearer.\n\n";
                        }
                        break;
                    default:
                        // if(GAME_DEBUG_MODE)
                        console.warn("Failed to handle boost type %o with params %o", funcName, splitParams);
                        str += `[${boostStr}]\n\n`;
                        break;
                }
            });
        }
        this.aspectsText.text = str.trimEnd();

        let baseWeaponChild = data;
        while(
            baseWeaponChild &&
            !baseWeaponChild.otherData["Proficiency Group"]
            ) {
            baseWeaponChild =
                _jsonData[baseWeaponChild.inheritsFrom];
        }
        if(baseWeaponChild) {
            const splitProfGroups = baseWeaponChild.otherData["Proficiency Group"].split(";");
            let str = "";
            splitProfGroups.forEach((e, i) => str += e + (
                (i === splitProfGroups.length - 1) ? "" : ", "
            ));
            this.weaponTypeElements.text.text = str;
            this.weaponTypeElements.text.visible = true;

            if(this.weaponTypeElements.text.text.indexOf("Armor") !== -1) {
                this.weaponTypeElements.icon.texture =
                    ENGINE.getTexture("ico_AC");
            } else {
                this.weaponTypeElements.icon.texture =
                    ENGINE.getTexture("ico_roll_attack");
            }
            this.weaponTypeElements.icon.visible = true;

        } else {
            this.weaponTypeElements.text.visible = false;
            this.weaponTypeElements.icon.visible = false;
        }

        // Proficiency stuff
        let proficiencyBoostIds: string[] = [];
        let spellBoostIds: string[] = [];
        for (let i = 0; i < allInheritedData.length; i++) {
            const currInhrData = allInheritedData[i];
            if(
                currInhrData.otherData["BoostsOnEquipMainHand"]
            ) {
                currInhrData.otherData["BoostsOnEquipMainHand"].split(";")
                    .forEach((e) => {
                        const match = e.match(/UnlockSpell\(([^)]+)\)/);
                        if (match && match[1]) {
                            if(currInhrData == baseWeaponChild) {
                                proficiencyBoostIds.push(
                                    match[1]
                                );
                            // } else {
                            //     spellBoostIds.push(
                            //         match[1]
                            //     );
                            }
                        }
                    });
            }
            if(
                currInhrData.otherData["Boosts"]
            ) {
                currInhrData.otherData["Boosts"].split(";")
                    .forEach((e) => {
                        const match = e.match(/UnlockSpell\(([^)]+)\)/);
                        if (match && match[1]) {
                            if(currInhrData == baseWeaponChild) {
                                proficiencyBoostIds.push(
                                    match[1]
                                );
                            } else {
                                spellBoostIds.push(
                                    match[1]
                                );
                            }
                        }
                    });
            }
        }
        proficiencyBoostIds = [...new Set(proficiencyBoostIds)];
        if(proficiencyBoostIds.length > 0) {
            this.proficiencyIcon.visible = true;
            this.proficiencyText.visible = true;
            this.proficiencySlots.forEach(
                (e) => {
                    e.id = "";
                    e.container.visible = false;
                }
            );
            proficiencyBoostIds.forEach((boostId, i) => {
                const boostData = _jsonData[boostId];
                this.proficiencySlots[i].container.visible = true;
                this.proficiencySlots[i].id = boostId;
                let iconData = boostData;
                while(iconData && iconData.inheritsFrom && !iconData.otherData["Icon"]) {
                    iconData = _jsonData[iconData.inheritsFrom];
                }
                let promise: Promise<void>;
                if(iconData && !ENGINE.hasPIXIResource(iconData.otherData["Icon"])) {
                    promise = ENGINE.loadAssets([
                        {
                            key: iconData.otherData["Icon"],
                            path: `sprites/Tooltips/${iconData.otherData["Icon"]}.png`,
                            type: LoaderType.PIXI,
                        }
                    ]);
                } else if(ENGINE.hasPIXIResource(iconData.otherData["Icon"])) {
                    promise = Promise.resolve();
                }
                promise
                    .then(() => {
                        this.proficiencySlots[i].icon.texture =
                            ENGINE.getTexture(iconData.otherData["Icon"]);
                        HelperFunctions.smartScale2D({
                            x: 48,
                            y: 48,
                        }, this.proficiencySlots[i].icon);
                    });
            });
        } else {
            this.proficiencySlots
                .forEach((e) => e.container.visible = false);
            this.proficiencyIcon.visible = false;
            this.proficiencyText.visible = false;
        }

        if(spellBoostIds.length > 0) {
            this.boostIconSlots.forEach(
                (e, i) => {
                    e.id = "";
                    e.container.visible = false;
                    let yOffset = 0;
                    if(this.aspectsText.text == "") {
                        yOffset -= 64;
                    }
                    e.container.position.set(
                        0,
                        e.container.height * i + (8 * i) + yOffset
                    );
                }
            );
            spellBoostIds.forEach((boostId, i) => {
                if(i >= this.boostIconSlots.length) {
                    return;
                }
                const boostData = _jsonData[boostId];
                this.boostIconSlots[i].container.visible = true;
                this.boostIconSlots[i].id = boostId;
                let iconData = boostData;
                while(iconData && iconData.inheritsFrom && !iconData.otherData["Icon"]) {
                    iconData = _jsonData[iconData.inheritsFrom];
                }
                let spellLevelSchoolData = boostData;
                let spellNameData = boostData;
                while(
                    spellNameData &&
                    spellNameData.inheritsFrom &&
                    !spellNameData.name
                ) {
                    spellNameData = _jsonData[spellNameData.inheritsFrom];
                }
                while(
                    spellLevelSchoolData &&
                    spellLevelSchoolData.inheritsFrom &&
                    !spellLevelSchoolData.otherData["SpellSchool"]
                ) {
                    spellLevelSchoolData = _jsonData[spellLevelSchoolData.inheritsFrom];
                }
                this.boostIconSlots[i].upperText.text = spellNameData?.name || boostId;

                if(spellLevelSchoolData) {
                    if(
                        spellLevelSchoolData.otherData["Level"] === "0"
                    ) {
                        this.boostIconSlots[i].lowerText.text = `${
                            spellLevelSchoolData.otherData[
                                "SpellSchool"
                                ]
                        } Cantrip`;
                    } else if(
                        spellLevelSchoolData.otherData["Level"] &&
                        spellLevelSchoolData.otherData["SpellSchool"]
                    ) {
                        this.boostIconSlots[i].lowerText.text = `Level ${
                            spellLevelSchoolData.otherData["Level"]
                        } ${
                            spellLevelSchoolData.otherData[
                                "SpellSchool"
                            ]
                        } Spell`;
                    } else {
                        this.boostIconSlots[i].lowerText.text = "";
                    }
                }
                let promise: Promise<void>;
                if(
                    iconData && iconData.otherData &&
                    iconData.otherData["Icon"]
                ) {
                    if(
                        !ENGINE.hasPIXIResource(iconData.otherData["Icon"])) {
                        promise = ENGINE.loadAssets([
                            {
                                key: iconData.otherData["Icon"],
                                path: `sprites/Tooltips/${iconData.otherData["Icon"]}.png`,
                                type: LoaderType.PIXI,
                            }
                        ]);
                    } else if(ENGINE.hasPIXIResource(iconData.otherData["Icon"])) {
                        promise = Promise.resolve();
                    }
                }
                if(promise) {
                    promise
                        .then(() => {
                            this.boostIconSlots[i].icon.texture =
                                ENGINE.getTexture(iconData.otherData["Icon"]);
                            HelperFunctions.smartScale2D({
                                x: 48,
                                y: 48,
                            }, this.boostIconSlots[i].icon);
                        });
                }
            });
        }

        if(
            data.description ||
            (data.inheritsFrom)
        ) {
            this.descriptionText.visible = true;
            this.descriptionIcon.visible = true;

            let inhrDesc = data.description;
            while(!inhrDesc && data.inheritsFrom) {
                inhrDesc = allInheritedData.find((d) => {
                    return d.description;
                }).description;
            }
            // alert(inhrDesc);

            let desc: string = inhrDesc.replace(/<br>/g, "\n");
            if(data.otherData["DescriptionParams"]) {
                data.otherData["DescriptionParams"].split(";")
                    .forEach((s, i) => {
                        desc = this.parseStringForDescParams(`[${i+1}]`, s, desc);
                    });
            }

            if(
                data.type == "SpellData" ||
                data.type == "PassiveData" ||
                data.type == "StatusData"
            ) {
                this.aspectsText.text += `\n\n${
                    desc
                }`;
                this.descriptionText.text = "";
                this.descriptionText.visible = false;
                this.descriptionIcon.visible = false;
            } else {
                this.descriptionText.text = desc;
            }
        } else {
            this.descriptionText.visible = false;
            this.descriptionIcon.visible = false;
        }

        // WEAPON ENCHANTMENT STUFF
        let enchantmentValue: string = null;
        this.weaponEnchantmentText.text = "";
        for (let i = 0; i < allInheritedData.length; i++) {
            const currInhrData = allInheritedData[i];
            if(
                currInhrData.otherData["DefaultBoosts"] &&
                currInhrData.otherData["DefaultBoosts"].indexOf(
                    "WeaponEnchantment"
                ) !== -1
            ) {
                const ench = currInhrData.otherData["DefaultBoosts"]
                    .substr(
                        currInhrData.otherData["DefaultBoosts"].indexOf("WeaponEnchantment") +
                        "WeaponEnchantment(".length,
                        1
                    );
                enchantmentValue = ench;
                this.weaponEnchantmentText.text = `Weapon Enchantment +${ench}`;
                break;
            }
        }
        if(!this.weaponEnchantmentText.text) {
            this.weaponEnchantmentText.visible = false;
        }

        // itemid
        if(data.otherData["RootTemplate"]) {
            this.itemIdText.text = data.otherData["RootTemplate"] + "📋";
        } else {
            this.itemIdText.text = "";
        }
        document.getElementsByTagName("title")[0].text = `${data.name} - Tome of Baldur`;

        // Damage
        let dmgData: IJsonBG3Entry = null;
        if(
            // eslint-disable-next-line no-cond-assign
            dmgData = allInheritedData.find((e) => {
                return Boolean(e.otherData["Damage"]);
            })
        ) {
            let str = `${
                dmgData.otherData["Damage"]
            }`;
            this.damageTitleText.text = `${BG3Index.extractRangeStringFromDice(str, enchantmentValue)} Damage`;
            if(enchantmentValue) {
                str += `+${enchantmentValue}`;
            }
            if(dmgData.otherData["VersatileDamage"]) {
                str += ` (${dmgData.otherData["VersatileDamage"]})`;
                this.damageDieSecondary.texture =
                    ENGINE.getTexture(`ico_${
                        dmgData.otherData["VersatileDamage"].substring(
                            dmgData.otherData["VersatileDamage"].indexOf("d")
                        )
                    }`);
                this.damageDieSecondary.visible = true;
            } else {
                this.damageDieSecondary.visible = false;
            }
            str += ` ${dmgData.otherData["Damage Type"]}`;
            this.damageText.text = str;
            this.damageDieMain.texture =
                ENGINE.getTexture(`ico_${
                    dmgData.otherData["Damage"].substring(
                        dmgData.otherData["Damage"].indexOf("d")
                    )
                }`);
            this.damageText.visible = true;
            this.damageTitleText.visible = true;
            this.damageDieMain.visible = true;
        } else if(
            // eslint-disable-next-line no-cond-assign
            dmgData = allInheritedData.find((e) => e.otherData["ArmorClass"])
        ) {

            this.damageDieMain.texture =
                ENGINE.getTexture(`ico_AC_primary`);
            this.ACText.text =
                dmgData.otherData["ArmorClass"].length > 1 ?
                    dmgData.otherData["ArmorClass"] : `+${dmgData.otherData["ArmorClass"]}`;

            this.damageDieSecondary.visible = false;
            this.damageDieMain.visible = true;
            this.damageText.visible = false;
            this.damageTitleText.visible = false;
        } else {
            this.damageDieSecondary.visible = false;
            this.damageDieMain.visible = false;
            this.damageText.visible = false;
            this.damageTitleText.visible = false;
        }

        // WEAPON PROPERTIES
        const weaponPropsEntry: IJsonBG3Entry | undefined = allInheritedData.find(
            (e) => e.otherData["Weapon Properties"]
        );
        if(
            weaponPropsEntry
        ) {
            let weaponProps = weaponPropsEntry.otherData["Weapon Properties"].split(";");
            if(
                weaponProps.indexOf("Dippable") !== -1
            ) {
                this.dippableIcon.visible = true;
            } else {
                this.dippableIcon.visible = false;
            }
            if(
                weaponProps.indexOf("Versatile") !== -1
            ) {
                this.versatileElements.container.visible = true;
                this.belowDamageText.visible = true;
            } else {
                this.versatileElements.container.visible = false;
                this.belowDamageText.visible = false;
            }
        } else {
            this.belowDamageText.visible = false;
            this.versatileElements.container.visible = false;
            this.dippableIcon.visible = false;
        }

        let iconData: IJsonBG3Entry;
        if(
            // eslint-disable-next-line no-cond-assign
            iconData = (
                allInheritedData.find((e) => Boolean(e.otherData["Icon"]))
            )
        ) {
            if(
                !ENGINE.hasPIXIResource(iconData.otherData["Icon"])
            ) {
                let path = `sprites/%TYPE%/${iconData.otherData["Icon"]}.png`;
                switch(iconData.type) {
                    case "Object":
                    case "Weapon":
                    case "Armor":
                        path = path.replace("%TYPE%", "Items");
                        break;
                    case "PassiveData":
                    case "SpellData":
                    case "StatusData":
                        path = path.replace("%TYPE%", "Tooltips");
                        break;
                }

                ENGINE.loadAssets([
                    {
                        key: iconData.otherData["Icon"],
                        path: path,
                        type: LoaderType.PIXI,
                    }
                ])
                .then(() => {
                    this.mainIcon.texture = ENGINE.getTexture(iconData.otherData["Icon"]);
                    HelperFunctions.smartScale2D(
                        { x: 126, y: 126, },
                        this.mainIcon
                    );
                });
            } else {
                this.mainIcon.texture = ENGINE.getTexture(iconData.otherData["Icon"]);
                HelperFunctions.smartScale2D(
                    { x: 126, y: 126, },
                    this.mainIcon
                );
            }
            this.mainIconContainer.visible = true;
        } else {
            this.mainIcon.texture = Texture.EMPTY;
            this.mainIconContainer.visible = false;
        }

        this.reposition();
    }

    reposition(): void {
        HelperFunctions.smartScale2D(
            { x: 126, y: 126, },
            this.mainIcon
        );

        let rarityOffset = 0;
        if(this.rarityText.visible === false || this.rarityText.text == "") {
            rarityOffset = -24;
        }

        if(this.belowDamageText && this.belowDamageText.visible) {
            this.damageDieMain.position.set(this.damageDieMain.x, 156 + rarityOffset);
            this.damageDieSecondary.position.set(this.damageDieSecondary.x, 156 + rarityOffset);
            this.damageText.position.set(this.damageText.x, 176 + rarityOffset);
            this.damageTitleText.position.set(this.damageTitleText.x, 100 + rarityOffset);
            this.belowDamageText.position.set(this.damageTitleText.x, 132 + rarityOffset);
            this.damageDieMain.scale.set(0.7);
            this.ACText.visible = false;
        } else if(
            this.damageDieMain.texture ==
            ENGINE.getTexture(`ico_AC_primary`)
        ) {
            this.damageDieMain.scale.set(0.6);
            this.damageDieMain.position.set(this.damageDieMain.x, 104 + rarityOffset);
            this.ACText.position.set(
                this.damageDieMain.x + (this.damageDieMain.width * 0.5),
                this.damageDieMain.y + (this.damageDieMain.height * 0.5)
            );
            this.ACText.visible = true;
        } else {
            this.damageDieMain.position.set(this.damageDieMain.x, 136 + rarityOffset);
            this.damageDieSecondary.position.set(this.damageDieSecondary.x, 136 + rarityOffset);
            this.damageText.position.set(this.damageText.x, 156 + rarityOffset);
            this.damageTitleText.position.set(this.damageTitleText.x, 100 + rarityOffset);
            this.damageDieMain.scale.set(0.7);
            this.ACText.visible = false;
        }
        if(
            this.damageDieMain.texture ==
            ENGINE.getTexture(`ico_AC_primary`)
        ) {
            this.aspectsText.position.set(this.aspectsText.x, this.damageDieMain.y + 90);
        } else {
            this.aspectsText.position.set(this.aspectsText.x, this.damageDieMain.y + 70);
        }
        this.weaponEnchantmentContainer.position.set(
            this.dippableIcon.visible ? 30 : -26,
            this.aspectsText.y + this.aspectsText.textContainer.height + 16
        );

        this.boostIconContainer.position.set(
            this.boostIconContainer.x,
            this.weaponEnchantmentContainer.y + this.weaponEnchantmentContainer.height + 18
        );

        this.proficiencyIcon.position.set(
            this.proficiencyIcon.position.x,
            this.boostIconContainer.y + this.boostIconContainer.height - 1
        );
        this.proficiencyText.position.set(
            this.proficiencyText.position.x,
            this.proficiencyIcon.y + 17
        );

        this.proficiencyIconContainer.position.set(
            this.proficiencyIconContainer.x,
            this.proficiencyText.y + 32
        );

        this.descriptionIcon.position.set(
            this.descriptionIcon.x,
            this.proficiencyIconContainer.y + this.proficiencyIconContainer.height + 16,
        );
        this.descriptionText.position.set(
            this.descriptionText.x,
            this.proficiencyIconContainer.y + this.proficiencyIconContainer.height + 24
        );
        this.weaponTypeElements.container.position.set(
            this.weaponTypeElements.container.x,
            this.descriptionText.y + this.descriptionText.textContainer.height + 16,
        );
        this.versatileElements.container.position.set(
            this.weaponTypeElements.container.x + this.weaponTypeElements.container.width + 8,
            this.weaponTypeElements.container.y,
        );

        this.mainBgFrame.clear();
        this.mainBgFrame.lineStyle(3, 0x806C5A, 1);
        this.mainBgFrame.beginFill(0x050505, 1);
        this.mainBgFrame.drawRoundedRect(0, 0, 512, this.contentsContainer.height + this.titleText.y + 48, 35);
        this.mainBgFrame.endFill();
        this.itemIdText.position.set(
            (this.mainBgFrame.width * 0.5) - 32,
            this.mainBgFrame.height - 8
        );

        this.boostIconSlots.forEach((e) => {
            if(e.lowerText.text === "") {
                e.upperText.position.set(
                    e.upperText.position.x,
                    10,
                );
            } else {
                e.upperText.position.set(
                    e.upperText.position.x,
                    0,
                );
            }
        });

        if(this.mainFrameContainer.width > tsthreeConfig.width) {
            HelperFunctions.smartScale2D(
                {
                    x: tsthreeConfig.width - 32,
                    y: null,
                },
                this.mainFrameContainer
            );
        }
    }

    onResize(_engine: Engine): void {
        this.mainFrameContainer.position.set(
            Math.floor(tsthreeConfig.width * 0.5),
            Math.floor( 48 + 128),
        );
        this.reposition();
    }

    preload(_engine: Engine): Promise<void> {
        const assets: typeof BootAssets = [
            // {
            //     key: "Action_Cleave_New",
            //     type: LoaderType.PIXI,
            //     path: "sprites/Tooltips/Action_Cleave_New.png",
            // },
            // {
            //     key: "Action_Slash_New",
            //     type: LoaderType.PIXI,
            //     path: "sprites/Tooltips/Action_Slash_New.png",
            // },
            // {
            //     key: "Action_CripplingStrike",
            //     type: LoaderType.PIXI,
            //     path: "sprites/Tooltips/Action_CripplingStrike.png",
            // },
            // {
            //     key: "Item_WPN_HUM_Battleaxe_A_1",
            //     type: LoaderType.PIXI,
            //     path: "sprites/Items/Item_WPN_HUM_Battleaxe_A_1.png",
            // },
        ];


        return Promise.allSettled([
            // _engine.loadAssets(assets),
            isFontReady(GAME_FONT),
            isFontReady(GAME_FONT_ITALIC),
        ]) as unknown as Promise<void>;
    }

}