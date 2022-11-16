import { ApplicationCommandType, ApplicationCommandOptionType, ChatInputCommandInteraction, EmbedBuilder } from 'discord.js';
import { AudioPlayerStatus, AudioResource } from '@discordjs/voice';

import Track, { TrackType } from '../../modules/track.js';

const pageLength = 15;

export default {
	name: 'queue',
	description: 'See the music queue',
	type: ApplicationCommandType.ChatInput,
	options: [
		{
			name: 'page',
			type: ApplicationCommandOptionType.Integer,
			description: 'Queue page',
			required: false,
		}
	],
	global: true,
	async execute(interaction: ChatInputCommandInteraction) {
		const { default: Bot } = await import('../../bot.js');
		const subscription = Bot.subscriptions.get(interaction.guildId!);

		const page = (interaction.options.getInteger('page') || 1) < 1 ? 1 : (interaction.options.getInteger('page') || 1);

		if (!subscription) return interaction.reply({ content: 'Not playing in this server!', ephemeral: true });

		let current = '';

		if (subscription.audioPlayer.state.status === AudioPlayerStatus.Idle) return interaction.reply({ content: 'Nothing is currently playing!', ephemeral: true });

		const resource = (subscription.audioPlayer.state.resource as AudioResource<Track>);
		if (resource.metadata.type === TrackType.youtube) {
			current = `Playing **[${resource.metadata.title}](https://www.youtube.com/watch?v=${resource.metadata.location})**`;
		} else {
			current = `Playing **${resource.metadata.title}**`;
		}

		const queue = subscription.queue
			.slice((page - 1) * pageLength, (page) * pageLength)
			.map((track, index) => track.type === TrackType.youtube ? `${(index + 1) + ((page - 1) * pageLength)}) [${track.title}](https://www.youtube.com/watch?v=${track.location})` : `${(index + 1) + ((page - 1) * pageLength)}) ${track.title}`)
			.join('\n');

		// const maxPagePosition = page * pageLength;
		// const maxQueue = maxPagePosition > subscription.queue.length ? subscription.queue.length : maxPagePosition;
		// const minQueue = (((page - 1) * pageLength) + 1) > subscription.queue.length ? subscription.queue.length : (((page - 1) * pageLength) + 1);

		const queueEmbed = new EmbedBuilder()
			.setColor('Random')
			.setDescription(`
			**Currently Playing**
			${current}
			
			**Queue** (page ${page})
			${subscription.queue.length ? queue : 'Queue is empty!'}
			`)
			.setFooter({
				text: `${((page - 1) * pageLength) + 1} - ${page * pageLength} of ${subscription.queue.length}`,
			});

		interaction.reply({ embeds: [queueEmbed], ephemeral: true });
	}
};