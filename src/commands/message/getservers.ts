import { Message } from 'discord.js';

export default {
	name: 'getservers',
	restricted: true,
	async execute(message: Message) {
		const { default: Bot } = await import('../../bot.js');

		const servers = await Bot.client.guilds.cache.map((server) => `${server.name}`).join(', ');

		message.reply(servers);
	}
};