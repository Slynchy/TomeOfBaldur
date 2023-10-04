import { Engine, HelperFunctions } from "./tsthree";
import { BootAssets } from "./config/BootAssets";
import { tsthreeConfig } from "./config/tsthreeConfig";
import { GameInit } from "./game/States/GameInit";

async function main(): Promise<void> {
    if (tsthreeConfig.gamePlatform === "facebook") {
        await HelperFunctions.waitForTruth(() => Boolean(window["FBInstant"]));
        await FBInstant.initializeAsync();
    }

    try {
        // if(tsthreeConfig.gamePlatform === "facebook") {
        //     tsthreeConfig.adjustHeightForBannerAd = FBInstant.getSupportedAPIs()
        //         .findIndex((e) => e === "loadBannerAdAsync") !== -1;
        // }
        const engine: Engine = new Engine(tsthreeConfig);

        engine.platformSDK.setLoadingProgress(15);
        ENGINE.recordLoadtime("before engine.init()");
        engine.init(
            new GameInit(),
            BootAssets
        )
            .catch((err) => {
                console.error(err);
                throw err;
            })
            .then(() => {
                ENGINE.recordLoadtime("after engine.init()");
                console.log("Engine initialized without errors.");
            });
    } catch (err) {
        console.error(err);
        if(tsthreeConfig.printFatalErrorsToHTML) {
            // if(tsthreeConfig.gamePlatform === "facebook") {
            //     // start FBInstant so we can actually see the error
            //     FBInstant.startGameAsync();
            // }
            document.documentElement.innerHTML = '';
            document.documentElement.innerHTML = err.toString() + "\n" + err.stack;
        } else {
            throw err;
        }
    }
}

main();
