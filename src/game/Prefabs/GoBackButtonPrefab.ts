import { GameObject, HelperFunctions } from "../../tsthree";
import { Text, TextStyle } from "pixi.js";
import { GAME_FONT_BOLD } from "../Constants/Constants";
import { buttonify } from "../../engine/HelperFunctions/buttonify";
import { BG3SearchInterface } from "../States/BG3SearchInterface";

export class GoBackButtonPrefab extends GameObject {

    private goBackText: Text;

    public get textStyle(): TextStyle {
        return this.goBackText.style as TextStyle;
    }

    constructor(_paramsRef?: Record<string, unknown>) {
        super();
        const goBackText = this.goBackText = new Text(
            "< Go Back",
            new TextStyle({
                fontFamily: GAME_FONT_BOLD,
                fontSize: 34,
                fill: "#D7D4CA"
            })
        );
        goBackText.anchor.set(0, 1);
        goBackText.position.set(0, -16);
        this.addChild(goBackText);
        HelperFunctions.makeInteractive(goBackText);
        buttonify(goBackText, {
            onPointerOver: () => {
                goBackText.style.fill = "#adaaa2";
            },
            onPointerOut: () => {
                goBackText.style.fill = "#D7D4CA";
            },
            onFire: () => {
                if(_paramsRef && _paramsRef["origin"]) {
                    window.history.back();
                } else {
                    const url = new URL(window.location.href);
                    url.search = '';
                    window.history.replaceState({}, document.title, url.toString());
                    ENGINE.changeState(new BG3SearchInterface());
                }
            }
        });
    }
}