import { ApplicationCommandType, ApplicationCommandOptionType, ChatInputCommandInteraction } from 'discord.js';
import { TrackType } from '../../modules/track.js';

import musicMiddleware from '../../modules/middleware/musicMiddleware.js';

export default {
	name: 'remove',
	description: 'Removes a track from the queue',
	type: ApplicationCommandType.ChatInput,
	options: [
		{
			name: 'position',
			type: ApplicationCommandOptionType.Integer,
			description: 'Queue position',
			required: true,
		}
	],
	global: true,
	async execute(interaction: ChatInputCommandInteraction) {
		const { default: Bot } = await import('../../bot.js');
		const subscription = Bot.subscriptions.get(interaction.guildId!);

		const position = (interaction.options.getInteger('position') || 1) < 1 ? 1 : (interaction.options.getInteger('position') || 1);

		musicMiddleware(interaction, async () => {
			// Print out the current queue, including up to the next 5 tracks to be played.
			if (!subscription) return interaction.reply({ content: 'Not playing in this server!', ephemeral: true });
			if (subscription.queue.length === 0) return interaction.reply({ content: 'Nothing is currently playing!', ephemeral: true });

			const toRemove =  subscription.queue[position-1];
			subscription.queue = subscription.queue.filter((_, index) => index != (position - 1));

			interaction.reply({ content: `Removed item ${position} - ${toRemove.type === TrackType.youtube ? `[${toRemove.title}](https://www.youtube.com/watch?v=${toRemove.location})` : toRemove.title}`, ephemeral: false, flags: 'SuppressEmbeds' });
		});
	}
};