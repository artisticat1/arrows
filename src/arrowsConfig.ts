import { EditorView } from "@codemirror/view";
import { Facet, Compartment } from "@codemirror/state";
import { ArrowsPluginSettings, DEFAULT_SETTINGS } from "./settings";

export const arrowsConfig = Facet.define<ArrowsPluginSettings, ArrowsPluginSettings>({
    combine: (input) => {
        if (input.length > 0) {
            return input[0];
        }
        else {
            return DEFAULT_SETTINGS;
        }
    }
});

export function getArrowConfigFromView(view: EditorView) {
    return view.state.facet(arrowsConfig);
}

export const arrowsConfigCompartment = new Compartment();

export function getArrowsConfigExtension(arrowPluginSettings: ArrowsPluginSettings) {
    return arrowsConfigCompartment.of(arrowsConfig.of(arrowPluginSettings));
}

export function reconfigureArrowsConfig(arrowPluginSettings: ArrowsPluginSettings) {
    return arrowsConfigCompartment.reconfigure(arrowsConfig.of(arrowPluginSettings));
}