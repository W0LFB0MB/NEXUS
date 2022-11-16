import { CommandInteraction, ApplicationCommandType } from 'discord.js';

import musicMiddleware from '../../modules/middleware/musicMiddleware.js';

export default {
	name: 'skip',
	description: 'Skip to the next song in the queue',
	type: ApplicationCommandType.ChatInput,
	options: [],
	global: true,
	async execute(interaction: CommandInteraction) {
		const { default: Bot } = await import('../../bot.js');
		const subscription = Bot.subscriptions.get(interaction.guildId!);

		musicMiddleware(interaction, async () => {
			if (!subscription) return interaction.reply({ content: 'Not playing in this server!', ephemeral: true });
			// Calling .stop() on an AudioPlayer causes it to transition into the Idle state. Because of a state transition
			// listener defined in music/subscription.ts, transitions into the Idle state mean the next track from the queue
			// will be loaded and played.
			subscription.audioPlayer.stop();
			interaction.reply('Skipped song!');
		});
	}
};