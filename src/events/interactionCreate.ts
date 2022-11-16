import { Interaction/*, GuildMember*/, CommandInteraction, ApplicationCommandOptionData, ApplicationCommandType } from 'discord.js';
import fs from 'fs';

export const commands: Array<{
	name: string,
	description: string,
	type: ApplicationCommandType,
	options?: Array<ApplicationCommandOptionData>,
	global: boolean,
	execute: (interaction: CommandInteraction) => null
}> = [];

const commandURL = new URL('../commands/interaction', import.meta.url);
const commandFiles = fs.readdirSync(commandURL).filter(file => file.endsWith('.js'));

console.log('--- LOADING INTERACTIONS ---');
for (const file of commandFiles) {
	console.log(file);
	const { default: command } = await import(`${commandURL.href}/${file}`);
	console.log(`Interaction <${command.name}> loaded! ${!command.global ? 'HIDDEN' : ''}`);
	commands.push(command);
}

export default {
	name: 'interactionCreate',
	once: false,
	async execute(interaction: Interaction) {
		if (!interaction.isCommand()) return;
		if (!interaction.guildId) return interaction.reply({content: 'Direct message Interactions are disabled.', ephemeral: true});

		const { default: Bot } = await import('../bot.js');

		if (!Bot.client.application?.owner) await Bot.client.application?.fetch();
		if (!(process.env._ && process.env._.indexOf('heroku') !== -1) && interaction.user.id !== Bot.client.application?.owner?.id) return interaction.reply({content: '🦊', ephemeral: true});
		// if (interaction.user.id !== client.application?.owner?.id) {
		// 	if (interaction.member instanceof GuildMember) {
		// 		await interaction.followUp('Currently under maintenence, try again later.');
		// 	}
		// 	return;
		// }

		let foundCommand = false;

		for (const command of commands) {
			if (interaction.commandName !== command.name) continue;
			console.log(command.name);
			foundCommand = true;
			if (!command.global && interaction.user.id !== Bot.client.application?.owner?.id) {
				interaction.reply('Access Denied');
				break;
			}
			command.execute(interaction);
			break;
		}

		if (!foundCommand) interaction.reply('Unknown command');
	}
};