import { App, PluginSettingTab, Setting, debounce } from 'obsidian';
import { LeaderLinePath } from 'leaderline';
import ArrowsPlugin from './main';


export interface ArrowsPluginSettings {
	defaultArrowColor: string;
	diagonalArrowStyle: LeaderLinePath;
	userDefinedColors: string;
}


export const DEFAULT_SETTINGS: ArrowsPluginSettings = {
	defaultArrowColor: "var(--text-normal)",
	diagonalArrowStyle: "fluid",
	userDefinedColors: ""
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

		new Setting(containerEl)
			.setName('Default arrow color')
			.setDesc('The default arrow color, in any valid CSS notation. Use `var(--text-normal)` to default to black/white in light/dark mode.')
			.addText(text => text
				.setPlaceholder('var(--text-normal)')
				.setValue(this.plugin.settings.defaultArrowColor)
				.onChange(async (value) => {
					this.plugin.settings.defaultArrowColor = value;

					debounce(() => {
						this.plugin.reconfigureArrowsConfig();
						this.plugin.reloadArrowsViewPlugin();
					}, 1000);
					await this.plugin.saveSettings();
				}));


		new Setting(containerEl)
		.setName('Diagonal arrow style')
		.setDesc('The style of diagonal arrows.')
		.addDropdown(text => text
			.addOptions({straight: "straight", fluid: "fluid", arc: "arc", magnet: "magnet"})
			.setValue(this.plugin.settings.diagonalArrowStyle)
			.onChange(async (value) => {
				this.plugin.settings.diagonalArrowStyle = value as LeaderLinePath;
				this.plugin.reconfigureArrowsConfig();
				this.plugin.reloadArrowsViewPlugin();
				await this.plugin.saveSettings();
			}));


		const customColorsSetting = new Setting(containerEl)
		.setName('User-defined colors')
		.setDesc('A list of custom user-defined colors. Arrows whose color is set to a value in this list will have their color overridden by the specified value. Use the format custom-color-name: color, with each color separated by a new line. e.g. my-custom-color: #26edab')
		.addTextArea(text => text
		.setValue(this.plugin.settings.userDefinedColors)
		.setPlaceholder("my-custom-color: #26edab\nblue: rgb(0, 98, 255)\ngreen: limegreen")
		.onChange(async (value) => {
			this.plugin.settings.userDefinedColors = value;

			debounce(() => {
				this.plugin.reconfigureArrowsConfig();
				this.plugin.reloadArrowsViewPlugin();
			}, 1000);

			await this.plugin.saveSettings();
		}));

		customColorsSetting.controlEl.addClass("arrows-custom-colors-input");
	}
}
