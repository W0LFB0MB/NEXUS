import { Message, ApplicationCommandData } from 'discord.js';

export default {
	name: 'ldeploy',
	restricted: true,
	async execute(message: Message) {
		const { commands } = await import('../../events/interactionCreate.js');
		const commandsToPush: Array<ApplicationCommandData> = [];

		for (const command of commands) {
			if (!command.global) continue;
			commandsToPush.push({
				name: command.name,
				description: command.description,
				type: command.type,
				options: command.options,
			});
		}

		message.guild!.commands.set(commandsToPush).then(() => {
			message.reply('Deployed!');
		}).catch(() => {
			message.reply('Deployment Failure.');
		});
	}
};