import { PlatformSDK } from "./PlatformSDK";
import { IPlayerInfo } from "../Types/IPlayerInfo";
import { HelperFunctions } from "../HelperFunctions";
import { AD_TYPE } from "../Types/AdType";
import { ICreateTournamentConfig } from "../Types/ICreateTournamentConfig";
import { ITournament } from "../Types/ITournament";
import { FBSDK_ERROR_CODES } from "../ErrorCodes/FBInstantErrorCodes";
import { PurchaseResult } from "../Types/PurchaseResult";
import ConnectedPlayer = FBInstant.ConnectedPlayer;
import { tsthreeConfig } from "../../config/tsthreeConfig";

interface IContextCache {
    id: string;
    type: ContextType;
}

enum ContextType {
    POST = "POST",
    THREAD = "THREAD",
    GROUP = "GROUP",
    SOLO = "SOLO"
}

interface IFBError {
    code: FBSDK_ERROR_CODES | string,
    message: string
}

export class FBInstantSDK extends PlatformSDK {

    public purchaseAsync(_productId: string): Promise<PurchaseResult> {
        return FBInstant.payments.purchaseAsync({
            productID: _productId,
            developerPayload: "{}"
        });
    }

    private _contextCache: IContextCache = {
        id: "",
        type: ContextType.SOLO // assume solo then correct later
    };

    constructor() {
        super();
    }

    public isAdsSupported(): boolean {
        return (FBInstant.getSupportedAPIs().findIndex((e) => e === "loadBannerAdAsync") !== -1);
    }

    public getIAPCatalog(): Promise<FBInstant.Product[]> {
        return FBInstant.payments.getCatalogAsync();
    }

    public isIAPAvailable(): boolean {
        return FBInstant.getSupportedAPIs().indexOf("payments.purchaseAsync") !== -1;
    }

    /**
     * {code:'CLIENT_UNSUPPORTED_OPERATION',message:'Client does not support no player IDS or multiple player IDs yet'}
     * @param _suggestedPlayerID
     */
    public createContext(_suggestedPlayerID: string /*| Array<string> | null*/): Promise<void> {
        return FBInstant.context.createAsync(
            // @ts-ignore
            _suggestedPlayerID
        ).then(() => {
            this._contextCache.id = _suggestedPlayerID;
            this._contextCache.type = ContextType.THREAD;
        });
    }

    public createTournamentAsync(_config: {
        initialScore: number,
        data?: { [key: string]: unknown },
        config: ICreateTournamentConfig
    }): Promise<ITournament | null> {
        return (FBInstant.tournament.createAsync(_config) as Promise<ITournament>)
            .catch((err: IFBError) => {
                if (err.code === FBSDK_ERROR_CODES.UserClosedPopup) {
                    return null;
                } else {
                    console.error(err);
                }
            });
    }

    public addOnPauseCallback(cb: () => void): void {
        if(!tsthreeConfig.pauseOnFocusLoss) return;
        return FBInstant.onPause(() => cb());
    }

    public addOnResumeCallback(cb: () => void): void {
        // return FBInstant.onResume(() => cb());
        if(!tsthreeConfig.pauseOnFocusLoss) return;
        window.onfocus = cb as (this: GlobalEventHandlers, ev: FocusEvent) => any;
    }

    public setLoadingProgress(_progress: number): Promise<void> {
        return Promise.resolve(FBInstant.setLoadingProgress(_progress));
    }

    public async sendCustomUpdateToUserID(
        _uid: string,
        _payload: FBInstant.CustomUpdatePayload
    ): Promise<boolean> {
        if(this.getContextType() === "SOLO") {
            // let exit: boolean = false;
            const success = await this.createContext(_uid)
                .catch((err) => {
                    if(err.code) {
                        switch(err.code) {
                            case "SAME_CONTEXT":
                                return false;
                            case "USER_INPUT":
                                return true;
                            default:
                                console.error(err);
                                return true;
                        }
                    }
                })
                .then((value) => {
                    return !value;
                });

            if(!success) {
                console.log("Error encountered when sending custom update, aborting");
                return false;
            }
            //     .catch((err) => {
            //         if(err.code === "USER_INPUT") exit = true;
            //         else throw err;
            //     });
            // if(true == exit) return false;
        }

        return await FBInstant.updateAsync(_payload)
            .catch((err) => {
                console.error(err);
                return true;
            })
            .then((e) => {
                return !e;
            });
    }

    public async initialize(): Promise<void> {
        if (!this.isReady())
            await HelperFunctions.waitForTruth(() => this.isReady(), 33);
        return FBInstant.initializeAsync();
    }

    public startGame(): Promise<void> {
        return FBInstant.startGameAsync();
    }

    public getContextId(): string {
        return this._contextCache.id || (this._contextCache.id = FBInstant.context.getID());
    }

    public getContextType(): string {
        return this._contextCache.type || (this._contextCache.type = FBInstant.context.getType() as ContextType);
    }

    public getPlayerId(): string {
        return FBInstant.player.getID();
    }

    public getEntryPointData(): { [key: string]: unknown } {
        return FBInstant.getEntryPointData();
    }

    public submitTournamentScoreAsync(_score: number): Promise<void> {
        if (_score <= 0) {
            console.warn("Attempted to submit score of zero to tournament");
            return Promise.resolve();
        }
        return FBInstant.tournament.postScoreAsync(_score);
    }

    public getEntryPointAsync(): Promise<string> {
        return FBInstant.getEntryPointAsync();
    }

    public shareTournamentAsync(_config: { score: number, data?: { [key: string]: any } }): Promise<void> {
        return FBInstant.tournament.shareAsync(_config);
    }

    public switchContext(_id: string): Promise<boolean> {
        return FBInstant.context.switchAsync(_id)
            .catch((err: Error & { code: FBSDK_ERROR_CODES }) => {
                switch (err.code) {
                    case FBSDK_ERROR_CODES.UserClosedPopup:
                        // don't care
                        break;
                    case FBSDK_ERROR_CODES.SameContext:
                        console.warn("User attempted to switch to the current context");
                        break;
                    default:
                        console.error("Failed to switch context ", err);
                        break;
                }
                return false;
            })
            .then(() => {
                const newID = FBInstant.context.getID();
                this._contextCache.id = newID;
                this._contextCache.type = FBInstant.context.getType() as ContextType;
                return (newID === _id);
            });
    }

    public getTournamentsAsync(): Promise<ITournament[]> {
        return FBInstant.tournament.getTournamentsAsync() as Promise<ITournament[]>;
    }

    public getPlayerInfo(): IPlayerInfo {
        return {
            playerId: this.getPlayerId(),
            contextId: this.getContextId(),
            contextType: this.getContextType(),
            playerPicUrl: this.getPlayerPicUrl(),
            playerName: this.getPlayerName(),
        };
    }

    public requestHapticFeedbackAsync(): Promise<boolean> {
        if(FBInstant.getSupportedAPIs().indexOf("payments.purchaseAsync") !== -1) {
            return FBInstant.performHapticFeedbackAsync() as Promise<boolean>;
        } else {
            return Promise.resolve(false);
        }
    }

    public getPlayerName(): string {
        return FBInstant.player.getName();
    }

    public getPlayerPicUrl(): string {
        return FBInstant.player.getPhoto();
    }

    public flush(): Promise<void> {
        return FBInstant.player.flushDataAsync();
    }

    public showBannerAd(_placementId: string): Promise<void> {
        return FBInstant.loadBannerAdAsync(_placementId);
    }

    public hideBannerAd(_placementId: string): Promise<void> {
        return FBInstant.hideBannerAdAsync(_placementId);
    }

    public getAdvertisementInstance(_type: AD_TYPE, _placementId: string): Promise<FBInstant.AdInstance> {
        switch (_type) {
            case AD_TYPE.BANNER:
                throw new Error("Use other functions for banner ads");
            case AD_TYPE.INTERSTITIAL:
                return FBInstant.getInterstitialAdAsync(_placementId);
            case AD_TYPE.REWARDED:
                return FBInstant.getRewardedVideoAsync(_placementId);
        }
    }

    public getPlayerLocale(): string {
        return FBInstant.getLocale() || "en_GB";
    }

    public load(_keys: Array<string> = []): Promise<Record<string, unknown>> {
        return FBInstant.player.getDataAsync(_keys);
    }

    public save(_data: Record<string, unknown>): Promise<void> {
        return FBInstant.player.setDataAsync(_data);
    }

    isReady(): boolean {
        return Boolean(window.FBInstant);
    }

    public getTournamentAsync(): Promise<ITournament> {
        return FBInstant.getTournamentAsync() as unknown as Promise<ITournament>;
    }

    public getSignedInfo(_payload?: string): Promise<FBInstant.SignedPlayerInfo> {
        return FBInstant.player.getSignedPlayerInfoAsync(_payload);
    }

    public async getFriends(): Promise<IPlatformFriend[]> {
        const friends =
            await FBInstant.player.getConnectedPlayersAsync()
                .catch((err) => {
                    console.error(err);
                    return [] as ConnectedPlayer[];
                });

        return friends.map<IPlatformFriend>((e): IPlatformFriend => {
            return {
                name: e?.getName() || "",
                uid: e?.getID() || "",
                photoUrl: e?.getPhoto() || ""
            };
        });
    }

}
