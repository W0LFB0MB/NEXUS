import { CommandInteraction, ApplicationCommandType } from 'discord.js';

import musicMiddleware from '../../modules/middleware/musicMiddleware.js';

export default {
	name: 'pause',
	description: 'Pauses the song that is currently playing',
	type: ApplicationCommandType.ChatInput,
	options: [],
	global: true,
	async execute(interaction: CommandInteraction) {
		const { default: Bot } = await import('../../bot.js');
		const subscription = Bot.subscriptions.get(interaction.guildId!);

		musicMiddleware(interaction, async () => {
			if (!subscription) return interaction.reply({ content: 'Not playing in this server!', ephemeral: true });

			subscription.paused = true;

			interaction.reply({ content: 'Paused!', ephemeral: true });
		});
	}
};