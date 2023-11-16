import { App } from "@capacitor/app";
import { ScreenOrientation } from "@capacitor/screen-orientation";
import { DummySDK } from "./DummySDK";

export class CapacitorSDK extends DummySDK {

    constructor() {
        super();
    }

    addOnBackCallback(cb: () => void): void {
        App.addListener("backButton", cb);
    }

    addOnPauseCallback(cb: () => void): void {
        App.addListener("pause", cb);
    }

    addOnResumeCallback(cb: () => void): void {
        App.addListener("resume", cb);
    }

    public lockOrientation(_orientation: "portrait" | "landscape"): Promise<boolean> {
        return ScreenOrientation.lock({
            orientation: _orientation
        })
            .catch(() => {
                return false;
            })
            .then((_val) => {
                return _val !== false;
            });
    }

    public unlockOrientation(): Promise<boolean> {
        return ScreenOrientation.unlock()
            .catch(() => {
                return false;
            })
            .then((_val) => {
                return _val !== false;
            });
    }

}