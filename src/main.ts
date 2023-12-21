import { Plugin } from 'obsidian';
import { Extension } from '@codemirror/state';
import { ArrowsSettingTab, ArrowsPluginSettings, DEFAULT_SETTINGS } from "./settings";
import { arrowsViewPlugin, refreshAllArrows } from "./arrowsViewPlugin";
import { getArrowsConfigExtension, reconfigureArrowsConfig } from './arrowsConfig';
import { iterateCM6 } from './utils';

export default class ArrowsPlugin extends Plugin {
	settings: ArrowsPluginSettings;
	extensions: Extension[];
	userDefinedColorsDict: {[colorName: string]: string};

	async onload() {
		await this.loadSettings();
		this.addSettingTab(new ArrowsSettingTab(this.app, this));

		this.extensions = [
			getArrowsConfigExtension(this.settings),
			arrowsViewPlugin.extension
		];
		this.registerEditorExtension(this.extensions);
	}

	onunload() {
		const leaderLineDefs = document.getElementById("leader-line-defs");
		if (leaderLineDefs) leaderLineDefs.remove();
	}

	async loadSettings() {
		this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
	}

	async saveSettings() {
		await this.saveData(this.settings);
	}

	reconfigureArrowsConfig() {
		iterateCM6(this.app.workspace, (view) => {
			view.dispatch({
				effects: reconfigureArrowsConfig(this.settings)
			});
		})
	}

	reloadArrowsViewPlugin() {
		iterateCM6(this.app.workspace, (view) => {
			view.dispatch({
				effects: refreshAllArrows.of(null)
			});
		})
	}
}
