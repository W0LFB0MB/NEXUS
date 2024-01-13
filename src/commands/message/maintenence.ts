import { Message } from 'discord.js';
import Bot from '../../bot.js';

export default {
	name: 'maintenence',
	restricted: true,
	async execute(message: Message) {
		Bot.maintenence = !Bot.maintenence;
		message.reply(`Maintenence mode ${Bot.maintenence ? 'enabled' : 'disabled'}.`);
	}
};