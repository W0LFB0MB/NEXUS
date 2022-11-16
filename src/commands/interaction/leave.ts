import { CommandInteraction, ApplicationCommandType } from 'discord.js';

import musicMiddleware from '../../modules/middleware/musicMiddleware.js';

export default {
	name: 'leave',
	description: 'Leave the voice channel',
	type: ApplicationCommandType.ChatInput,
	options: [],
	global: true,
	async execute(interaction: CommandInteraction) {
		const { default: Bot } = await import('../../bot.js');
		const subscription = Bot.subscriptions.get(interaction.guildId!);

		musicMiddleware(interaction, async () => {
			if (!subscription) return interaction.reply({ content: 'Not playing in this server!', ephemeral: true });

			subscription.destroy();

			interaction.reply({ content: 'Left channel!', ephemeral: false });
		});
	}
};