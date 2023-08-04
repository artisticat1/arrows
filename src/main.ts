import { Plugin } from 'obsidian';
import { ArrowsSettingTab, ArrowsPluginSettings, DEFAULT_SETTINGS } from "./settings";
import { arrowsViewPlugin } from "./arrowsViewPlugin";
import { Extension } from '@codemirror/state';


export default class ArrowsPlugin extends Plugin {
	settings: ArrowsPluginSettings;
	extensions: Extension[];
	userDefinedColorsDict: {[colorName: string]: string};

	async onload() {
		await this.loadSettings();
		this.addSettingTab(new ArrowsSettingTab(this.app, this));
		this.loadUserDefinedColorsDict();

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
		this.extensions.pop();
		this.app.workspace.updateOptions();

		this.extensions.push(arrowsViewPlugin.extension);
		this.app.workspace.updateOptions();
	}

	loadUserDefinedColorsDict() {
		const dict: {[colorName: string]: string} = {};

		const lines = this.settings.userDefinedColors.split("\n");
		lines.forEach(val => {
			const line = val.replaceAll(" ", "").split(":");

			if (line[1])
				dict[line[0]] = line[1];
		});

		this.userDefinedColorsDict = dict;
	}
}
