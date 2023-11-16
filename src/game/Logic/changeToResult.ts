import { TEntryId } from "../Types/SharedTypes";
import { BG3Index } from "../States/BG3Index";

export function changeToResult(id: TEntryId): void {
    if (history.pushState) {
        const newurl =
            window.location.protocol + "//" +
            window.location.host + window.location.pathname +
            `?itemId=${id}`;
        window.history.pushState({path: newurl},'', newurl);
    }
    ENGINE.changeState(
        new BG3Index(),
        {
            itemId: id,
            origin: true,
        }
    );
}