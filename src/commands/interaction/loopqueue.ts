import { CommandInteraction, ApplicationCommandType } from 'discord.js';
import { LoopType } from '../../modules/subscription.js';

import musicMiddleware from '../../modules/middleware/musicMiddleware.js';

export default {
	name: 'loopqueue',
	description: 'loops the music queue',
	type: ApplicationCommandType.ChatInput,
	options: [],
	global: true,
	async execute(interaction: CommandInteraction) {
		const { default: Bot } = await import('../../bot.js');
		const subscription = Bot.subscriptions.get(interaction.guildId!);

		musicMiddleware(interaction, async () => {
			if (!subscription) return interaction.reply({ content: 'Not playing in this server!', ephemeral: true });

			if (subscription.loop !== LoopType.queue) {
				subscription.loop = LoopType.queue;
			} else {
				subscription.loop = LoopType.none;
			}

			interaction.reply({ content: (subscription.loop === LoopType.queue ? 'Queue looped!' : 'Queue loop stopped.'), ephemeral: false });
		});
	}
};