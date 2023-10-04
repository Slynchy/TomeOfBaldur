import { CRTFilter } from "pixi-filters";
import { uid } from "../../engine/HelperFunctions/uid";

export class CRTEffectHandler {
    private static _enabled: boolean = false;
    private static _intervalId: number = null;

    public static addToGame(): void {
        if(
            CRTEffectHandler._enabled ||
            CRTEffectHandler._intervalId
        ) { return; }

        ENGINE.getActiveState().getScene().getStage().parent.filters = [
            // @ts-ignore
            new CRTFilter({
                seed: parseInt(uid()),
                curvature: -0.2,
                vignetting: 0.04,
                noise: 0.1,
                noiseSize: 1,
                verticalLine: 0,
                lineWidth: 4,
                lineContrast: 0.05,
            }),
        ];
        const intervalId = setInterval(() => {
            const stage = ENGINE.getActiveState().getScene().getStage();
            const stageParent = stage?.parent;
            if (stageParent && stageParent.filters.length !== 0) {
                stageParent.filters.forEach((e) => {
                    if (e instanceof CRTFilter) {
                        (e).time += 0.1;
                        (e).noise = Math.abs(Math.sin((e).time * 0.33) * 0.03);
                    }
                });
            }
        }, 20) as unknown as number;
        CRTEffectHandler._intervalId = intervalId;
    }

    public static removeFromGame(): void {
        ENGINE.getActiveState().getScene().getStage().parent.filters = [];
        CRTEffectHandler._enabled = false;
        if(CRTEffectHandler._intervalId) {
            clearInterval(CRTEffectHandler._intervalId);
        }
        CRTEffectHandler._intervalId = null;
    }
}