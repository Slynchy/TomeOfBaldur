export function isFontReady(fontFamily: string, fontWeight: string = '400', fontStyle: string = 'normal'): Promise<void> {
    return new Promise<void>((resolve, reject) => {
        if ((document as any).fonts) {
            (document as any).fonts.load(`${fontWeight} ${fontStyle} 10px ${fontFamily}`).then((fonts: any) => {
                if (fonts.length > 0) {
                    resolve();
                } else {
                    reject(`Font ${fontFamily} not available!`);
                }
            }).catch((error: any) => {
                reject(error);
            });
        } else {
            reject('FontFaceSet API not supported!');
        }
    });
}