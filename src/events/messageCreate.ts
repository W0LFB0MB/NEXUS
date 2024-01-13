import { Message } from 'discord.js';
import fs from 'fs';
import Logger from '../modules/logger.js';

export const commands: Array<{
	name: string,
	restricted: boolean,
	execute: (message: Message) => null
}> = [];

const commandURL = new URL('../commands/message', import.meta.url);
const commandFiles = fs.readdirSync(commandURL).filter(file => file.endsWith('.js'));

Logger.info('--- LOADING COMMANDS ---');
for (const file of commandFiles) {
	const { default: command } = await import(`${commandURL.href}/${file}`);
	Logger.debug(`Command <${command.name}> loaded! ${!command.restricted ? 'RESTRICTED' : ''}`);
	commands.push(command);
}

export default {
	name: 'messageCreate',
	once: false,
	async execute( message: Message ) {
		if (!message.guild) return;
		if (message.author.bot) return;

		const { default: Bot } = await import('../bot.js');

		if (!Bot.client.application?.owner) await Bot.client.application?.fetch();
		if (!(process.env._ && process.env._.indexOf('heroku') !== -1) && message.author.id !== Bot.client.application?.owner?.id) return;
		if (!message.content.toLowerCase().startsWith(`<@${Bot.client.user?.id}>`)) return; // check if message is actually a command
		const messageCommand = message.content.toLowerCase().slice(`<@${Bot.client.user?.id}>`.length).split(' ')[1]; // get command keyword
		Logger.trace(message.content.toLowerCase());
		Logger.trace(messageCommand);
		let foundCommand = false;

		for (const command of commands) {
			if (messageCommand !== command.name) continue;
			foundCommand = true;
			if (command.restricted && message.author.id !== Bot.client.application?.owner?.id) {
				message.reply('Access Denied');
				break; 
			}
			command.execute(message);
			break;
		}

		if (!foundCommand) message.reply('Unknown command.');
	}
};