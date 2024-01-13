import { ApplicationCommandOptionType, ApplicationCommandType, ChatInputCommandInteraction } from 'discord.js';
import { LoopType } from '../../modules/subscription.js';

import musicMiddleware from '../../modules/middleware/musicMiddleware.js';

export default {
	name: 'loop',
	description: 'Set loop mode',
	type: ApplicationCommandType.ChatInput,
	options: [
		{
			name: 'mode',
			type: ApplicationCommandOptionType.String,
			description: 'Loop mode',
			required: true,
			choices: [
				{
					name: 'off',
					value: 'off'
				},
				{
					name: 'track',
					value: 'track'
				},
				{
					name: 'queue',
					value: 'queue'
				},
			]
		}
	],
	global: true,
	async execute(interaction: ChatInputCommandInteraction) {
		const { default: Bot } = await import('../../bot.js');
		const subscription = Bot.subscriptions.get(interaction.guildId!);

		musicMiddleware(interaction, async () => {
			if (!subscription) return interaction.reply({ content: 'Not playing in this server!', ephemeral: true });

			if (interaction.options.getString('mode') === 'off') {
				subscription.loop = LoopType.none;
				interaction.reply({ content: ('Loop disabled.'), ephemeral: false });
			} else if (interaction.options.getString('mode') === 'track') {
				subscription.loop = LoopType.track;
				interaction.reply({ content: ('Track loop enabled.'), ephemeral: false });
			} else if (interaction.options.getString('mode') === 'queue') {
				subscription.loop = LoopType.queue;
				interaction.reply({ content: ('Queue loop enabled.'), ephemeral: false });
			}
		});
	}
};