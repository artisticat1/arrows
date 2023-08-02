import { Plugin } from 'obsidian';
import { ArrowsSettingTab, ArrowsPluginSettings, DEFAULT_SETTINGS } from "./settings";
import { arrowsViewPlugin } from "./arrowsViewPlugin";
import { Extension } from '@codemirror/state';


export default class ArrowsPlugin extends Plugin {
	settings: ArrowsPluginSettings;
	extensions: Extension[];

	async onload() {
		await this.loadSettings();
		this.addSettingTab(new ArrowsSettingTab(this.app, this));

		this.extensions = [arrowsViewPlugin.extension];
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

	reloadArrowsViewPlugin() {
		// Unload
		this.extensions.pop();
		this.app.workspace.updateOptions();

		// Reload
		this.extensions.push(arrowsViewPlugin.extension);
		this.app.workspace.updateOptions();
	}
}
