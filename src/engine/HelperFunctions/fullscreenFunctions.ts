import { Renderer } from "pixi.js";
import { tsthreeConfig } from "../../config/tsthreeConfig";

let _isFullscreen: boolean = false;

export function getIsFullscreen(): boolean {
    return _isFullscreen;
}

const elem: {
    requestFullscreen?: Function
    webkitRequestFullscreen?: Function
    msRequestFullscreen?: Function
    exitFullscreen?: Function
    webkitExitFullscreen?: Function
    msExitFullscreen?: Function
} = document.documentElement;

export function openFullscreen(): Promise<void> {
    return ((
        ENGINE.getUIManager().getRenderer() as Renderer
    ).view.requestFullscreen()
        .catch((err) => {
            console.error(err);
            // antiSpam = false;
            return Promise.resolve(true);
        })
        .then((_wasErr) => {
            if(_wasErr) return;
            setTimeout(() => {
                _isFullscreen = true;
                ENGINE.resizeRenderer(
                    window.innerWidth,
                    window.innerHeight,
                );
                // const windowState = (
                //     ENGINE.getActiveState() as Windows95
                // )?.extractInitialWindowState();
                // ENGINE.changeState(new Windows95(
                //     windowState
                // ));
            }, 17);
        })
    );
}

/* Close fullscreen */
export function closeFullscreen(): void {
    const _document: typeof elem = document;
    if (_document.exitFullscreen) {
        _document.exitFullscreen();
    } else if (_document.webkitExitFullscreen) { /* Safari */
        _document.webkitExitFullscreen();
    } else if (_document.msExitFullscreen) { /* IE11 */
        _document.msExitFullscreen();
    }
    _isFullscreen = false;
}