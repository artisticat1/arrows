import { EditorState } from "@codemirror/state";
import { EditorView, ViewUpdate, Decoration, DecorationSet, ViewPlugin, WidgetType } from "@codemirror/view";
import { MatchDecoratorAll } from "./matchDecoratorAll";
import { ArrowsManager } from "./arrowsManager";
import { ArrowIdentifierData, ArrowIdentifierPosData, ArrowIdentifierCollection, arrowSourceToArrowIdentifierData, arrowIdentifierCollectionIsResolved, rangeWithinExcludedContext } from './utils';
import * as constants from "./consts";

const arrowSourceRegex = /{([^{}]+)}/g;

const arrowIdentifierHighlighter = new MatchDecoratorAll({
    regexp: arrowSourceRegex,
    decoration: (match) => {
        const arrowSource = match[1];
        const arrowData = arrowSourceToArrowIdentifierData(arrowSource);

        const startOrEnd = "";
        const className = constants.ARROW_IDENTIFIER_CLASS + " " + startOrEnd;

        return Decoration.mark({
            tagName: "span",
            class: className,
            arrowIdentifierData: arrowData
        });
    }
});


export class ArrowsViewPlugin {
    container: HTMLElement;
    arrowsManager: ArrowsManager;
    arrowIdentifierRanges: DecorationSet;
    arrowIdentifierCollections: ArrowIdentifierCollection[];
    decorations: DecorationSet;

    constructor(view: EditorView) {
        // Create a container to hold the arrows in
        this.createContainer(view);
        this.arrowsManager = new ArrowsManager(this.container);

        this.arrowIdentifierRanges = arrowIdentifierHighlighter.createDeco(view);
        const posData = this.arrowIdentifierRangesToArrowIdentifierPosData(this.arrowIdentifierRanges, view.state);
        this.arrowIdentifierCollections = this.collectArrowIdentifierPosData(posData);
        const decos = this.arrowIdentifierCollectionsToDecos(this.arrowIdentifierCollections, view.state);
        this.decorations = decos;

        queueMicrotask(() => {
            this.arrowsManager.drawArrows(view, this.arrowIdentifierCollections);
        });
    }

    createContainer(view: EditorView) {
        const container = document.createElement("div");
        container.addClass(constants.ARROW_CONTAINER_CLASS);
        view.scrollDOM.prepend(container);
        this.container = container;
    }

    update(update: ViewUpdate) {
        if (update.docChanged) {
            this.arrowIdentifierRanges = arrowIdentifierHighlighter.updateDeco(update, this.arrowIdentifierRanges);
            const posData = this.arrowIdentifierRangesToArrowIdentifierPosData(this.arrowIdentifierRanges, update.state);
            this.arrowIdentifierCollections = this.collectArrowIdentifierPosData(posData);
        }
        const decos = this.arrowIdentifierCollectionsToDecos(this.arrowIdentifierCollections, update.state);
        this.decorations = decos;

        queueMicrotask(() => {
            this.arrowsManager.drawArrows(update.view, this.arrowIdentifierCollections);
        });
    }

    destroy() {
        this.arrowsManager.removeAllArrows();
        this.container.remove();
    }

    arrowIdentifierRangesToArrowIdentifierPosData(arrowIdentifierRanges: DecorationSet, state: EditorState): ArrowIdentifierPosData[] {
        const rangeCursor = arrowIdentifierRanges.iter();
        const arrowIdentifierPosData: ArrowIdentifierPosData[] = [];

        while (rangeCursor.value != null) {
            const from = rangeCursor.from;
            const to = rangeCursor.to;

            if (rangeWithinExcludedContext(from, to, state)) {
                rangeCursor.next();
                continue;
            }

            const arrowData = rangeCursor.value.spec.arrowIdentifierData;
            if (!arrowData) {
                rangeCursor.next();
                continue;
            }

            arrowIdentifierPosData.push({from: from, to: to, arrowData: arrowData});
            rangeCursor.next();
        }

        return arrowIdentifierPosData;
    }

    collectArrowIdentifierPosData(arrowIdentifierPosData: ArrowIdentifierPosData[]): ArrowIdentifierCollection[] {
        const result: {[identifier: string]: ArrowIdentifierCollection} = {};

        for (const arrowIdentifierPos of arrowIdentifierPosData) {
            const arrowData = arrowIdentifierPos.arrowData;
            const identifier = arrowData.identifier;
            const isStart = arrowData.isStart;

            // Group by identifier
            if (!(identifier in result)) {
                result[identifier] = {identifier: identifier, ends: []};
            }

            if (isStart) {
                result[identifier].start = arrowIdentifierPos;
            }
            else {
                result[identifier].ends.push(arrowIdentifierPos);
            }
        }

        return Object.values(result);
    }

    arrowIdentifierCollectionsToDecos(arrowIdentifierCollections: ArrowIdentifierCollection[], state: EditorState): DecorationSet {
        const decos = [];

        for (const arrowIdentifierCollection of arrowIdentifierCollections) {
            const isResolved = arrowIdentifierCollectionIsResolved(arrowIdentifierCollection);
            const allArrowIdentifiers = [arrowIdentifierCollection.start, ...arrowIdentifierCollection.ends];
            let color = "";

            if (isResolved) {
                const start = arrowIdentifierCollection.start;
                if (!start) continue;

                const startColor = start.arrowData.color;
                if (startColor) color = startColor;
            }

            for (const arrowIdentifier of allArrowIdentifiers) {
                if (!arrowIdentifier) continue;

                // "Unravel" the prettified circle when the cursor lies on the arrow identifier
                const sel = state.selection.main;
                const shouldUnravel = (sel.from >= arrowIdentifier.from) && (sel.to <= arrowIdentifier.to);

                let deco;
                if (isResolved && !shouldUnravel) {
                    deco = Decoration.replace({
                        widget: new PrettifiedCircle(color, arrowIdentifier.arrowData),
                        inclusive: false,
                        block: false,
                        arrowIdentifierPosData: arrowIdentifier
                    }).range(arrowIdentifier.from, arrowIdentifier.to);
                }
                else {
                    deco = Decoration.mark({
                        tagName: "span",
                        class: constants.ARROW_IDENTIFIER_CLASS,
                        arrowIdentifierPosData: arrowIdentifier
                    }).range(arrowIdentifier.from, arrowIdentifier.to);
                }

                decos.push(deco);
            }
        }

        return Decoration.set(decos, true);
    }
}


export const arrowsViewPlugin = ViewPlugin.fromClass(
    ArrowsViewPlugin,
    {
        decorations: v => v.decorations
    }
);


class PrettifiedCircle extends WidgetType {
    private readonly color: string;
    private readonly arrowIdentifierData: ArrowIdentifierData;

    constructor(color: string, arrowIdentifierData: ArrowIdentifierData) {
        super();

        this.color = color;
        this.arrowIdentifierData = arrowIdentifierData;
    }

    eq(other: PrettifiedCircle) {
        return (other.color === this.color);
    }

    toDOM() {
        const span = document.createElement("span");
        span.style.color = this.color;
        span.className = constants.ARROW_IDENTIFIER_PRETTIFIED_CIRCLE_CLASS;

        span.textContent = "●" // •
        return span;
    }
}

