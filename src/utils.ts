import LeaderLine from "leaderline";
import { EditorView } from "@codemirror/view";
import { ARROW, MARGIN, NOARROW, DISC, arrowTypes, arrowPlugTypes } from "./consts";

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

export function getStartEndArrowPlugs(arrowheadName: string, arrowStartPlug?: string, arrowEndPlug?: string) {
    // Returns the start and end arrow plug names and sizes for use with LeaderLine options

    // arrowheadName is either "arrow1" or "arrow2":
    // "arrow2" for diagonal arrows
    // "arrow1" for margin arrows (adds an extra horizontal offset to the arrowhead)

    const startPlug = (arrowStartPlug === ARROW) ? arrowheadName : DISC;
    const startPlugSize = (arrowStartPlug === ARROW) ? 0.65 : 0.4;
    
    const endPlug = (arrowEndPlug === ARROW) ? arrowheadName : DISC;
    const endPlugSize = (arrowEndPlug === ARROW) ? 0.65 : 0.4;

    return {
        startPlug: startPlug,
        startPlugSize: startPlugSize,
        endPlug: endPlug,
        endPlugSize: endPlugSize
    };
}

export function fixMarginArrowTrackNo(track: number) {
    // Handle leader-line's startSocketGravity behaving strangely
    if (track === 10) {
        return 11;
    }
    else if (track >= 11) {
        return track + 10;
    }
    else {
        return track;
    }
}

// https://github.com/anseki/leader-line/issues/28
export function makeArrowArc(line: LeaderLine, radius: number) {
    
    function addArc(pathData: string, radius: number) {
        const reL = /^L ?([\d.\-+]+) ([\d.\-+]+) ?/;
        let newPathData, curXY, curDir, newXY, newDir,
        sweepFlag, arcXY, arcStartXY;
    
        function getDir(xy1: {x: number, y: number}, xy2: {x: number, y: number}) {
            if (xy1.x === xy2.x) {
                return xy1.y < xy2.y ? 'd' : 'u';
            } else if (xy1.y === xy2.y) {
                return xy1.x < xy2.x ? 'r' : 'l';
            }
            throw new Error('Invalid data');
        }
    
        function captureXY(s: any, x :number, y:number) {
            newXY = {x: +x, y: +y};
            return '';
        }
    
        function offsetXY(xy: {x: number, y: number}, dir: string, offsetLen: number, toBack: boolean) {
            return {
                x: xy.x + (dir === 'l' ? -offsetLen : dir === 'r' ? offsetLen : 0) * (toBack ? -1 : 1),
                y: xy.y + (dir === 'u' ? -offsetLen : dir === 'd' ? offsetLen : 0) * (toBack ? -1 : 1)
            };
        }
    
        pathData = pathData.trim().replace(/,/g, ' ').replace(/\s+/g, ' ')
            .replace(/^M ?([\d.\-+]+) ([\d.\-+]+) ?/, function(s, x, y) {
                curXY = {x: +x, y: +y};
                return '';
            });
        if (!curXY) { throw new Error('Invalid data'); }
        // @ts-ignore
        newPathData = 'M' + curXY.x + ' ' + curXY.y;
    
        while (pathData) {
            newXY = null;
            pathData = pathData.replace(reL, captureXY);
            if (!newXY) { throw new Error('Invalid data'); }
        
            newDir = getDir(curXY, newXY);
            if (curDir) {
                arcStartXY = offsetXY(curXY, curDir, radius, true);
                arcXY = offsetXY(curXY, newDir, radius, false);
                sweepFlag =
                curDir === 'l' && newDir === 'u' ? '1' :
                curDir === 'l' && newDir === 'd' ? '0' :
                curDir === 'r' && newDir === 'u' ? '0' :
                curDir === 'r' && newDir === 'd' ? '1' :
                curDir === 'u' && newDir === 'l' ? '0' :
                curDir === 'u' && newDir === 'r' ? '1' :
                curDir === 'd' && newDir === 'l' ? '1' :
                curDir === 'd' && newDir === 'r' ? '0' :
                null;
                if (!sweepFlag) { throw new Error('Invalid data'); }
                newPathData += 'L' + arcStartXY.x + ' ' + arcStartXY.y +
                'A ' + radius + ' ' + radius + ' 0 0 ' + sweepFlag + ' ' + arcXY.x + ' ' + arcXY.y;
            }
        
            curXY = newXY;
            curDir = newDir;
        }
        // @ts-ignore
        newPathData += 'L' + curXY.x + ' ' + curXY.y;
        return newPathData;
    }

    try {
        // @ts-ignore
        const arrowId:number = line._id;
        
        const elmsPath = document.getElementById("leader-line-" + arrowId + "-line-path");
        if (!elmsPath) return;
        
        const pathData = elmsPath.getAttribute('d');
        if (!pathData) return;
        
        elmsPath.setAttribute('d', addArc(pathData, radius));
    }
    catch {
        // Invalid path data.
    }
}

// -1: offscreen before the user's view
// 0: onscreen
// 1: offscreen after the user's view
export type OffscreenPosition = -1|0|1;

export function posToOffscreenPosition(view: EditorView, pos: number):OffscreenPosition {
    const viewport = view.viewport;

    if (pos < viewport.from) {
        return -1;
    }
    else if (pos > viewport.to) {
        return 1;
    }
    else {
        return 0;
    }
}