import { PlatformSDK } from "./PlatformSDK";
import { IPlayerInfo } from "../Types/IPlayerInfo";
import { DEFAULT_TEXTURE_B64 } from "../Constants/Constants";
import { AD_TYPE } from "../Types/AdType";
import { ICreateTournamentConfig } from "../Types/ICreateTournamentConfig";
import { ITournament } from "../Types/ITournament";
import { utils } from "pixi.js";
import { PurchaseResult } from "../Types/PurchaseResult";
import { uid } from "../HelperFunctions/uid";
import { IAPNames, IAPProductID } from "../../game/Constants/IAPData";
import CustomUpdatePayload = FBInstant.CustomUpdatePayload;
import { tsthreeConfig } from "../../config/tsthreeConfig";
import { ScreenOrientation } from "@capacitor/screen-orientation";

export class DummySDK extends PlatformSDK {

    private _contextId: string = null;

    constructor() {
        super();
    }

    public isIAPAvailable(): boolean {
        return true;
    }

    public isAdsSupported(): boolean {
        return true;
    }

    public requestHapticFeedbackAsync(): Promise<boolean> {
        try {
            window.navigator.vibrate(100);
            return Promise.resolve(true);
        } catch(err) {
            return Promise.resolve(false);
        }
    }

    public lockOrientation(_orientation: "portrait" | "landscape"): Promise<boolean> {
        return Promise.resolve(true);
    }

    public unlockOrientation(): Promise<boolean> {
        return Promise.resolve(true);
    }

    public sendCustomUpdateToUserID(
        _uid: string,
        _payload: CustomUpdatePayload
    ): Promise<boolean> {
        return Promise.resolve(true);
    }

    public addOnBackCallback(cb: () => void): void {
        window.addEventListener('popstate', cb, false);
    }

    public addOnPauseCallback(cb: () => void): void {
        if(!tsthreeConfig.pauseOnFocusLoss) return;
        window.onblur = cb as (this: GlobalEventHandlers, ev: FocusEvent) => any;
    }

    public addOnResumeCallback(cb: () => void): void {
        if(!tsthreeConfig.pauseOnFocusLoss) return;
        window.onfocus = cb as (this: GlobalEventHandlers, ev: FocusEvent) => any;
    }

    public setLoadingProgress(_progress: number): Promise<void> {
        const obj = ENGINE["_loadingScrObject"];
        if(
            obj &&
            // @ts-ignore
            typeof tsthreeConfig.loadingScreenComponent["progress"] !== "undefined"
        ) {
            // @ts-ignore
            tsthreeConfig.loadingScreenComponent["progress"] = _progress;
        }

        return Promise.resolve(undefined);
    }

    public initialize(): Promise<void> {
        return Promise.resolve(undefined);
    }

    public startGame(): Promise<void> {
        return Promise.resolve(undefined);
    }

    public getContextId(): string {
        return this._contextId;
    }

    public getContextType(): string {
        return "SOLO";
    }

    public getPlayerId(): string {
        return "1234";
    }

    public getEntryPointAsync(): Promise<string> {
        return Promise.resolve("debug");
    }

    public submitTournamentScoreAsync(_score: number): Promise<void> {
        return Promise.resolve();
    }

    public switchContext(_id: string): Promise<boolean> {
        this._contextId = _id;
        return Promise.resolve(true);
    }

    public getTournamentsAsync(): Promise<ITournament[]> {
        return Promise.resolve([
            {
                getContextID: () => utils.uid().toString(),
                getID: () => utils.uid().toString(),
                getTitle: () => "DebugTournament",
                getPayload: () => JSON.stringify({
                    levelNum: 0
                }),
                getEndTime: () => Number.MAX_SAFE_INTEGER
            } as ITournament
        ]);
    }

    public shareTournamentAsync(_config: { score: number, data?: { [key: string]: any } }): Promise<void> {
        return Promise.resolve();
    }

    public async createTournamentAsync(_config: {
        initialScore: number,
        data?: { [key: string]: unknown },
        config: ICreateTournamentConfig
    }): Promise<ITournament | null> {
        return (await this.getTournamentsAsync())[0];
    }

    public async getAdvertisementInstance(_type: AD_TYPE, _placementId: string): Promise<FBInstant.AdInstance> {
        return {
            loadAsync(): Promise<void> {
                return Promise.resolve();
            },
            showAsync(): Promise<void> {
                return Promise.resolve();
            }
        } as FBInstant.AdInstance;
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

    public getPlayerName(): string {
        return "TEST";
    }

    public getPlayerPicUrl(): string {
        return DEFAULT_TEXTURE_B64;
    }

    public flush(): Promise<void> {
        return Promise.resolve(undefined);
    }

    public load(): Promise<Record<string, unknown>> {
        return Promise.resolve({});
    }

    public save(_data: Record<string, unknown>): Promise<void> {
        return Promise.resolve(undefined);
    }

    isReady(): boolean {
        return true;
    }

    public getPlayerLocale(): string {
        return "en_GB"; // ja_JP
    }

    hideBannerAd(_placementId: string): Promise<void> {
        return Promise.resolve(undefined);
    }

    showBannerAd(_placementId: string): Promise<void> {
        return Promise.resolve(undefined);
    }

    getEntryPointData(): { [key: string]: unknown } {
        return {};
    }

    createContext(_suggestedPlayerID: string | Array<string> | null): Promise<void> {
        return Promise.resolve();
    }

    getTournamentAsync(): Promise<ITournament> {
        return Promise.resolve(null);
    }

    getIAPCatalog(): Promise<FBInstant.Product[]> {

        const res: FBInstant.Product[] = [];

        for(const key in IAPProductID) {
            // @ts-ignore
            const prodKey: IAPProductID = IAPProductID[key];
            res.push(
                {
                    productID: prodKey as unknown as string,
                    title: IAPNames[prodKey],
                    description: "Debug",
                    imageURI: "",
                    price: "$0.01",
                    priceCurrencyCode: "GBP"
                }
            );
        }

        return Promise.resolve(res);
    }

    getSignedInfo(_payload?: string): Promise<FBInstant.SignedPlayerInfo> {
        return Promise.reject(new Error("Not supported in localhost"));
    }

    getFriends(): Promise<IPlatformFriend[]> {
        return Promise.resolve([
            {
                name: "Ricky",
                uid: "123454321234",
                photoUrl: DEFAULT_TEXTURE_B64
            }
        ]);
    }

    purchaseAsync(_productId: string): Promise<PurchaseResult> {
        console.log(`Buying product ${_productId}`);
        return Promise.resolve({
            paymentID: uid(),
            productID: _productId,
            purchaseTime: (Math.floor(Date.now() / 1000)).toString(),
            purchaseToken: uid(),
            signedRequest: uid()
        });
    }

}
