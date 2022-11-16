import { Message } from 'discord.js';

export default {
	name: 'gdeployclear',
	restricted: true,
	async execute(message: Message) {
		const { default: Bot } = await import('../../bot.js');
		Bot.client.application?.commands.fetch({ force: true }).then(commands => {
			for (const command of commands) {
				command[1].delete();
			}
		
			message.reply('Global Interactions Cleared!');
		});
	}
};