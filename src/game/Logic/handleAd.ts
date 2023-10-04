import { AD_DEBUG } from "../../engine/Constants/Constants";
import { ANALYTICS_AD_TYPES } from "../../engine/Analytics/AnalyticsAdTypes";
import { AD_TYPE } from "../../engine/Types/AdType";
import { Engine } from "../../tsthree";
import { AdPlacements } from "../Constants/AdPlacements";
import { AnalyticsEventID } from "../Constants/AnalyticsEventIDs";

let promiseCacheForInterstitials: Promise<boolean> = null;

export function handleAd(_engine: Engine, _adType: AD_TYPE, _placement: string, _levelNumber?: number): Promise<boolean> {
    let _levelNumForAnalytics: string;
    if (typeof _levelNumber !== "undefined") {
        _levelNumForAnalytics = _levelNumber.toString();
    }
    const _adTypeForAnalytics: string = ANALYTICS_AD_TYPES[_adType];

    const adManager = _engine.getAdManager();
    if (adManager) {
        _engine.logEvent(
            AnalyticsEventID.AdRequested,
            undefined,
            {
                placement: _placement,
                level: _levelNumForAnalytics,
                adType: _adTypeForAnalytics
            }
        );

        if (promiseCacheForInterstitials && _adType === AD_TYPE.INTERSTITIAL)
            return promiseCacheForInterstitials;

        return promiseCacheForInterstitials = adManager.preloadAdInstance(_adType)
            .catch((err) => {
                // I tried setting this to `COUNTER - 1` but turns out FB would
                // throw an error even if the ad was successful, so...
                _engine.logEvent(
                    AnalyticsEventID.AdFail,
                    undefined,
                    {
                        placement: _placement,
                        level: _levelNumForAnalytics,
                        adType: _adTypeForAnalytics
                    }
                );
                console.error("Ad error encountered");
                console.error(err);
                if (_adType === AD_TYPE.INTERSTITIAL) {
                    promiseCacheForInterstitials = null;
                }
                return false;
            })
            .then(() => {
                _engine.getUIManager().showOverlay();
                return _engine.getAdManager().showAd(_adType)
                    .catch((err) => {
                        _engine.getUIManager().hideOverlay();
                        if (_adType === AD_TYPE.INTERSTITIAL) {
                            promiseCacheForInterstitials = null;
                        }
                        return Promise.reject(err);
                    })
                    .then(() => {
                        _engine.getUIManager().hideOverlay();
                        _engine.logEvent(
                            AnalyticsEventID.AdShown,
                            undefined,
                            {
                                placement: _placement,
                                level: _levelNumForAnalytics,
                                adType: _adTypeForAnalytics
                            }
                        );
                        if (_adType === AD_TYPE.INTERSTITIAL) {
                            promiseCacheForInterstitials = null;
                        }
                        return true;
                    });
            });
    } else {
        console.warn("Missing ad manager");
        return Promise.resolve(AD_DEBUG);
    }
}
