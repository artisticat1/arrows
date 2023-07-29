import { EditorView } from "@codemirror/view";
import LeaderLine from "leaderline";
import { ArrowIdentifierCollection, ArrowIdentifierData, ArrowIdentifierPosData, getStartEndArrowPlugs, fixMarginArrowTrackNo, makeArrowArc, posToOffscreenPosition, OffscreenPosition } from './utils';
import * as constants from "./consts";


export class ArrowsManager {
    private readonly container: HTMLElement;
    private readonly arrows: LeaderLine[];

    constructor(container: HTMLElement) {
        this.container = container;
        this.arrows = [];
    }

    drawArrows(view: EditorView, arrowIdentifierCollections: ArrowIdentifierCollection[]) {
        this.removeAllArrows();

        for (const arrowIdentifierCollection of arrowIdentifierCollections) {
            const start = arrowIdentifierCollection.start;
            if (!start) continue;
            const startOffscreen = posToOffscreenPosition(view, start.from);

            const startEl = this.arrowIdentifierPosDataToDomElement(view, start);
            if (!(startEl instanceof HTMLElement)) continue;
            
            for (const end of arrowIdentifierCollection.ends) {
                const endEl = this.arrowIdentifierPosDataToDomElement(view, end);
                if (!(endEl instanceof HTMLElement)) continue;
                const endOffscreen = posToOffscreenPosition(view, end.to);

                // Draw an arrow between startEl and endEl
                // console.log("Drawing an arrow between", startEl, "and", endEl);
                this.drawArrow(startEl, endEl, start.arrowData, end.arrowData, startOffscreen, endOffscreen);
            }
        }
    }

    drawArrow(startEl: HTMLElement, endEl: HTMLElement, startArrowData: ArrowIdentifierData, endArrowData: ArrowIdentifierData, startOffscreen?: OffscreenPosition, endOffscreen?: OffscreenPosition) {
        let line;
        if (startArrowData.type == constants.DIAGONAL) {
            line = this.drawDiagonalArrow(startEl, endEl, startArrowData, endArrowData);
        }
        else {
            line = this.drawMarginArrow(startEl, endEl, startArrowData, endArrowData, startOffscreen, endOffscreen);
        }

        if (line != null)
            this.arrows.push(line);
    }

    drawDiagonalArrow(startEl: HTMLElement, endEl: HTMLElement, startArrowData: ArrowIdentifierData, endArrowData: ArrowIdentifierData) {
        if (startEl == endEl) return;

        let color = startArrowData.color;
        if (!color) color = "currentColor"; // TODO

        const plugs = getStartEndArrowPlugs(constants.DIAGONAL_ARROW, startArrowData.arrowArrowhead, endArrowData.arrowArrowhead);

        // @ts-ignore
        const line = new LeaderLine({
            parent: this.container,
            start: startEl,
            end: endEl,
            color: color,
            size: constants.ARROW_SIZE,
            ...plugs
        });

        return line;
    }

    drawMarginArrow(startEl: HTMLElement, endEl: HTMLElement, startArrowData: ArrowIdentifierData, endArrowData: ArrowIdentifierData, startOffscreen?: OffscreenPosition, endOffscreen?: OffscreenPosition) {
        const res = this.getMarginArrowStartEndAnchors(startEl, endEl, startOffscreen, endOffscreen);
        if (!res) return;
        const {startAnchor, endAnchor} = res;

        let color = startArrowData.color;
        if (!color) color = "currentColor"; // TODO

        const plugs = getStartEndArrowPlugs(constants.MARGIN_ARROW, startArrowData.arrowArrowhead, endArrowData.arrowArrowhead);
        let track = startArrowData.track ? startArrowData.track : 0;
        track = fixMarginArrowTrackNo(track);

        // @ts-ignore
        const line = new LeaderLine({
            parent: this.container,
            start: startAnchor,
            end: endAnchor,
            color: color,
            size: constants.ARROW_SIZE,
            ...plugs,
            path: "grid",
            startSocket: "left",
            endSocket: "left",
            startSocketGravity: [-3*track, 0],
        });

        // Give the arrow rounded corners
        // Not supported by the leader-line library, so do this manually
        const radius = 22.5 + 3/2*track;
        makeArrowArc(line, radius);

        return line;
    }

    arrowIdentifierPosDataToDomElement(view: EditorView, arrow: ArrowIdentifierPosData) {
        // Returns the `span.arrow-identifier-prettified-circle` element that corresponds to
        // the specified document position
        
        try {
            const pos = arrow.from + 1;
            const {node, offset} = view.domAtPos(pos);
            
            let el;
            if (node.nodeType === Node.TEXT_NODE) {
                // When the decoration is a MarkDecoration (when the cursor is on an arrow identifier), node is a text node
                el = node.parentElement;
            }
            else {
                // Otherwise, node is an Element
                el = node.childNodes[offset-1] as HTMLElement;
            }

            if (!el) return;
            
            if (el.hasClass(constants.ARROW_IDENTIFIER_PRETTIFIED_CIRCLE_CLASS)) {
                return el;
            }
            else {
                const offscreen = posToOffscreenPosition(view, arrow.from);
                const lines = view.contentDOM.children;
                const firstLine = lines[1];
                const lastLine = lines[lines.length-2];

                if (offscreen === -1) return firstLine;
                else if (offscreen === 1) return lastLine;
                else return el;
            }
        }
        catch (e) {
            console.log(e);   
            return;
        }
    }

    getMarginArrowStartEndAnchors(start: HTMLElement, end: HTMLElement, startOffscreen?: OffscreenPosition, endOffscreen?: OffscreenPosition) {
        // Draw the arrow at the same y-position as the arrow identifier
        // If a start/end identifier is off-screen, then start and end point to the first/last .cm-lines in the editor
        
        const s = start.closest(".cm-line");
        if (!(s instanceof HTMLElement)) return;
        let sy;
        if (startOffscreen != undefined && startOffscreen != 0) {
            // Stop long margin arrows from flickering when scrolling up/down a page
            // By drawing long margin arrows past the very top/bottom of the screen by setting y appropriately
            sy = startOffscreen * 1000;
        }
        else {
            sy = start.offsetTop + (start.offsetHeight / 2);
        }

        const e = end.closest(".cm-line");
        if (!(e instanceof HTMLElement)) return;
        let ey;
        if (endOffscreen != undefined && endOffscreen != 0) {
            ey = endOffscreen * 1000;
        }
        else {
            ey = end.offsetTop + (end.offsetHeight / 2);
        }

        return {
            startAnchor: LeaderLine.PointAnchor(s, {x: -constants.MARGIN_ARROW_X_OFFSET, y: sy}), endAnchor: LeaderLine.PointAnchor(e, {x: -constants.MARGIN_ARROW_X_OFFSET, y: ey})
        };
    }

    removeAllArrows() {
        while (this.arrows.length > 0) {
            const arrow = this.arrows.pop();
            if (arrow) arrow.remove();
        }
    }
}