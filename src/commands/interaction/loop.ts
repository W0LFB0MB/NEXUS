import { ApplicationCommandType, ChatInputCommandInteraction } from 'discord.js';
import { LoopType } from '../../modules/subscription.js';

import musicMiddleware from '../../modules/middleware/musicMiddleware.js';

export default {
	name: 'loop',
	description: 'Loops the currently playing track',
	type: ApplicationCommandType.ChatInput,
	options: [],
	global: true,
	async execute(interaction: ChatInputCommandInteraction) {
		const { default: Bot } = await import('../../bot.js');
		const subscription = Bot.subscriptions.get(interaction.guildId!);

		musicMiddleware(interaction, async () => {
			if (!subscription) return interaction.reply({ content: 'Not playing in this server!', ephemeral: true });

			if (subscription.loop !== LoopType.track) {
				subscription.loop = LoopType.track;
			} else {
				subscription.loop = LoopType.none;
			}

			interaction.reply({ content: (subscription.loop === LoopType.track ? 'Song looped!' : 'Loop stopped.'), ephemeral: false });
		});
	}
};