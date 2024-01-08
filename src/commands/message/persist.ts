import { Message } from 'discord.js';

export default {
	name: 'persist',
	restricted: true,
	async execute(message: Message) {
		const { default: Bot } = await import('../../bot.js');
		const subscription = Bot.subscriptions.get(message.guildId!);
		if (!subscription) return message.reply ('nah');
		subscription.persistant = !subscription.persistant;
		message.reply(`Persistance ${subscription.persistant ? 'Enabled' : 'Disabled'}`);
	}
};