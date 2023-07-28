import { App, PluginSettingTab, Setting } from 'obsidian';
import ArrowsPlugin from './main';


export interface ArrowsPluginSettings {
	defaultArrowColor: string;
	// diagonalArrowStyle: LeaderLine.PathType;
	userDefinedColors: string[];
}


export const DEFAULT_SETTINGS: ArrowsPluginSettings = {
	defaultArrowColor: "currentColor",
	// diagonalArrowStyle: "fluid",
	userDefinedColors: []
}


export class ArrowsSettingTab extends PluginSettingTab {
	plugin: ArrowsPlugin;

	constructor(app: App, plugin: ArrowsPlugin) {
		super(app, plugin);
		this.plugin = plugin;
	}

	display(): void {
		const {containerEl} = this;
		containerEl.empty();
	}
}
