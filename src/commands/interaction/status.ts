import { AudioPlayerStatus, AudioResource } from '@discordjs/voice';
import { CommandInteraction, ApplicationCommandType, EmbedBuilder } from 'discord.js';
import { LoopType } from '../../modules/subscription.js';
import Track, { TrackType } from '../../modules/track.js';

export default {
	name: 'status',
	description: 'Gets the bot\'s status',
	type: ApplicationCommandType.ChatInput,
	options: [],
	global: true,
	async execute(interaction: CommandInteraction) {
		const { default: Bot } = await import('../../bot.js');
		const subscription = Bot.subscriptions.get(interaction.guildId!);
		
		if (!subscription) return interaction.reply({ content: 'Not playing in this server!', ephemeral: true });

		const statusEmbed = new EmbedBuilder()
			// .setTitle('Status')
			.setColor('Random')
			.addFields([
				{
					name: 'Loop',
					value: subscription.loop === LoopType.none ? 'None' : subscription.loop === LoopType.track ? 'Song' : 'Queue',
					inline: true,
				},
				{
					name: 'Paused',
					value: subscription.paused ? 'Yes' : 'No',
					inline: true,
				},
				{
					name: 'In Queue',
					value: subscription.queue.length.toString(),
					inline: true,
				}
			]);

		const resource = subscription.audioPlayer.state.status !== AudioPlayerStatus.Idle ? (subscription.audioPlayer.state.resource as AudioResource<Track>) : null;
		if (resource) statusEmbed.addFields([
			{
				name: 'Currently Playing',
				value: resource.metadata.type === TrackType.youtube ? `[${resource.metadata.title}](https://www.youtube.com/watch?v=${resource.metadata.location})` : resource.metadata.title,
				inline: false,
			}
		]);

		if (subscription.queue.length) {
			const queue = subscription.queue
				.slice(0, 5)
				.map((track, index) => track.type === TrackType.youtube ? `${(index + 1)}) [${track.title}](https://www.youtube.com/watch?v=${track.location})` : `${(index + 1)}) ${track.title}`)
				.join('\n');

			statusEmbed.addFields([
				{
					name: 'Queue',
					value: queue,
					inline: false,
				}
			]);
		}

		interaction.reply({ embeds: [statusEmbed], ephemeral: true });
	}
};