export const ARROW_SIZE = 3;

export const DIAGONAL = "diagonal";
export const MARGIN = "margin";
export const arrowTypes = [DIAGONAL, MARGIN];
export const ARROW = "arrow";
export const NOARROW = "no-arrow";
export const arrowPlugTypes = [ARROW, NOARROW];

export interface ArrowIdentifierData {
    identifier: string,
    arrowSource: string,
    isStart: boolean,
    color?: string,
    opacity?: number,
    effectiveColor?: string,
    type?: string,
    track?: number,
    arrowArrowhead?: string
}

export interface ArrowIdentifierPosData {
    from: number,
    to: number,
    arrowData: ArrowIdentifierData
}

export interface ArrowIdentifierCollection {
    identifier: string,
    start?: ArrowIdentifierPosData,
    ends: ArrowIdentifierPosData[]
}

export function arrowSourceToArrowIdentifierData(arrowSource: string):ArrowIdentifierData {
    const options = arrowSource.split("|");
    
    const result:ArrowIdentifierData = {
        identifier: "",
        arrowSource: arrowSource,
        isStart: options.length != 1,
        type: MARGIN,
        track: 0,
    };

    result.arrowArrowhead = result.isStart ? NOARROW : ARROW;
    
    // Allow removing the arrowhead from an end identifier
    // By inserting "no-arrow" to the end of the syntax, e.g. {test|no-arrow}
    if (result.isStart && options.length === 2 && arrowPlugTypes.contains(options[1])) {
        result.isStart = false;
    }

    const identifier = options.shift();
    result.identifier = identifier ? identifier : "";
    
    if (result.isStart) {
        for (const option of options) {
            const optionAsFloat = parseFloat(option);

            if (arrowTypes.contains(option)) {
                result.type = option;
            }
            else if (arrowPlugTypes.contains(option)) {
                result.arrowArrowhead = option;
            }
            else if (!isNaN(optionAsFloat) && (optionAsFloat % 1 === 0)) {
                result.track = optionAsFloat;
            }
            else if (!isNaN(optionAsFloat) && (optionAsFloat > 0) && (optionAsFloat < 1)) {
                result.opacity = optionAsFloat;
            }
            else {
                // Don't allow re-writing the color
                // Ensures arrows keep the same color while the user is typing/adding
                // more properties to the syntax
                if (!result.color) {
                    result.color = option;
                }
            }
        }
    }

    result.effectiveColor = result.color;

    return result;
}

export function arrowIdentifierCollectionIsResolved(arrowIdentifierCollection: ArrowIdentifierCollection):boolean {
    if (!arrowIdentifierCollection.start) return false;

    return arrowIdentifierCollection.ends.length > 0;
}

// https://stackoverflow.com/questions/1573053/javascript-function-to-convert-color-names-to-hex-codes
export function getRGBAColor(colorName: string | undefined, opacity: number | undefined):string {

    // @ts-ignore
    let defaultColor = window.app.plugins.plugins["obsidian-arrows"].settings.defaultArrowColor;
    if (!defaultColor) defaultColor = "currentColor";

    const opacityNum = opacity ? opacity : 1;
    const opacityInt = Math.round(opacityNum * 255);
    const alpha = ('0' + opacityInt.toString(16)).slice(-2);

    const ctx = document.createElement('canvas').getContext('2d');
    let col = defaultColor;

    if (ctx && colorName) {
        ctx.fillStyle = colorName;

        // Fall back to default color when the color name is invalid
        // e.g. when the user is still typing out the color name
        if ((ctx.fillStyle === "#000000") && !(["black", "#000000"].contains(colorName))) {
            ctx.fillStyle = defaultColor;
        }

        col = ctx.fillStyle;
    }

    return col + alpha;
}
