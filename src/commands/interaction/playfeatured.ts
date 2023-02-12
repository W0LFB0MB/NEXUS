import { DiscordGatewayAdapterCreator, entersState, joinVoiceChannel, VoiceConnectionStatus } from '@discordjs/voice';
import { GuildMember, ApplicationCommandType, ChatInputCommandInteraction } from 'discord.js';

import db from '../../modules/database.js';
import MusicSubscription from '../../modules/subscription.js';
import musicMiddleware from '../../modules/middleware/musicMiddleware.js';
import Track from '../../modules/track.js';

export default {
	name: 'playfeatured',
	description: 'Plays the currently featured song',
	type: ApplicationCommandType.ChatInput,
	options: [],
	global: true,
	async execute(interaction: ChatInputCommandInteraction) {
		const { default: Bot } = await import('../../bot.js');
		let subscription = Bot.subscriptions.get(interaction.guildId!);

		musicMiddleware(interaction, async () => {
			await interaction.deferReply();
			// Extract the video URL from the command
			const { rows } = await db.pool.query({
				text: `
						SELECT value
						FROM options
						WHERE option = 'featured'
					`
			});
			const featured = rows[0].value;

			// If a connection to the guild doesn't already exist and the user is in a voice channel, join that channel
			// and create a subscription.
			if (!subscription) {
				if (interaction.member instanceof GuildMember && interaction.member.voice.channel) {
					const channel = interaction.member.voice.channel;
					subscription = new MusicSubscription(
						joinVoiceChannel({
							channelId: channel.id,
							guildId: channel.guild.id,
							adapterCreator: channel.guild.voiceAdapterCreator as DiscordGatewayAdapterCreator,
						})
					);
					subscription.voiceConnection.on('error', console.warn);
					Bot.subscriptions.set(interaction.guildId!, subscription);
				}
			}

			// If there is no subscription, tell the user they need to join a channel.
			if (!subscription) return interaction.reply({ content: 'Join a voice channel and try that again.', ephemeral: true });

			// Make sure the connection is ready before processing the user's request
			try {
				await entersState(subscription.voiceConnection, VoiceConnectionStatus.Ready, 20e3);
			} catch (error) {
				console.warn(error);
				return interaction.followUp('Failed to join voice channel within 20 seconds, please try again later!');
			}

			try {

				// Attempt to create a Track from the user's video URL
				const track = await Track.fromUrl(`https://www.youtube.com/watch?v=${featured}`, {
					onStart() {
						interaction.followUp({ content: 'Now playing!', ephemeral: false }).catch(console.warn);
					},
					onFinish() {
						interaction.followUp({ content: 'Now finished!', ephemeral: true }).catch(console.warn); // not required, caused extra spam
					},
					onError(error: Error) {
						console.warn(error);
						interaction.followUp({ content: 'An error has occured, please try again later.', ephemeral: true }).catch(console.warn);
					},
				});
				// Enqueue the track and reply a success message to the user
				subscription.enqueue(track);
				interaction.followUp(`Enqueued **${track.title}**`);

				db.pool.query({
					text: `
						INSERT INTO users (id, songs_played) VALUES ($1, 1)
						ON CONFLICT (id) DO
						UPDATE SET songs_played = users.songs_played + 1
					`,
					values: [interaction.user.id]
				}).then(() => {
					db.pool.query({
						text: `
						INSERT INTO song_plays (user_id, song_url) VALUES ($1, $2)
						ON CONFLICT (user_id, song_url) DO
						UPDATE SET count = song_plays.count + 1
					`,
						values: [interaction.user.id, track.location]
					});
				});
			} catch (error) {
				console.error('err', error);
				interaction.followUp('Failed to play track, please try again later!');
			}
		});
	}
};