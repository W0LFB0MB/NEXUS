import { Message } from 'discord.js';

export default {
	name: 'lgdeployclear',
	restricted: true,
	async execute(message: Message) {
		message.guild?.commands.fetch({ force: true }).then(commands => {
			for (const command of commands) {
				command[1].delete();
			}

			message.reply('Local Interactions Cleared!');
		});
	}
};