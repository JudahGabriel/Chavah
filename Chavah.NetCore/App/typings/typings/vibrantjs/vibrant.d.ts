interface IVibrant {
    swatches: () => ISwatchList;
}

interface ISwatchList {
    DarkMuted: ISwatch;
    DarkVibrant: ISwatch;
    LightMuted: ISwatch;
    LightVibrant: ISwatch;
    Muted: ISwatch;
    Vibrant: ISwatch;
}

interface IVibrantStatic {
    new(img: HTMLImageElement, colorCountInPalette?: number, quality?: number): IVibrant;
}

interface ISwatch {
    hsl: number[];
    rgb: number[];
    getHex: () => string;
    getHsl: () => string;
    getPopulation: () => number;
    getTitleTextColor: () => string;
    getBodyTextColor: () => string;
}


declare var Vibrant: IVibrantStatic;