import { CommandInteraction, ApplicationCommandType } from 'discord.js';

import musicMiddleware from '../../modules/middleware/musicMiddleware.js';

export default {
	name: 'stop',
	description: 'Stops playback & clears queue',
	type: ApplicationCommandType.ChatInput,
	options: [],
	global: true,
	async execute(interaction: CommandInteraction) {
		const { default: Bot } = await import('../../bot.js');
		const subscription = Bot.subscriptions.get(interaction.guildId!);

		musicMiddleware(interaction, async () => {
			// Print out the current queue, including up to the next 5 tracks to be played.
			if (!subscription) return interaction.reply({ content: 'Not playing in this server!', ephemeral: true });
			subscription.stop();

			interaction.reply({ content: 'Playback stopped & queue cleared.', ephemeral: false });
		});
	}
};