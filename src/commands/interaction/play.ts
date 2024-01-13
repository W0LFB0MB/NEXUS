import { DiscordGatewayAdapterCreator, entersState, joinVoiceChannel, VoiceConnectionStatus } from '@discordjs/voice';
import { GuildMember, ApplicationCommandType, ApplicationCommandOptionType, ChatInputCommandInteraction } from 'discord.js';
import https from 'https';

import MusicSubscription from '../../modules/subscription.js';
import musicMiddleware from '../../modules/middleware/musicMiddleware.js';
import Track, { TrackType } from '../../modules/track.js';
import db from '../../modules/database.js';
import Logger from '../../modules/logger.js';

export default {
	name: 'play',
	description: 'Plays a song',
	type: ApplicationCommandType.ChatInput,
	options: [
		{
			name: 'song',
			type: ApplicationCommandOptionType.String,
			description: 'The URL or title of the song to play',
			required: true,
		},
	],
	global: true,
	async execute(interaction: ChatInputCommandInteraction) {
		const { default: Bot } = await import('../../bot.js');
		let subscription = Bot.subscriptions.get(interaction.guildId!);

		musicMiddleware(interaction, async () => {
			await interaction.deferReply();
			// Extract the video URL from the command
			const toQueue = interaction.options.getString('song')!;

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
				let isUrl = true;

				try {
					new URL(toQueue);
				} catch (_) {
					isUrl = false;
				}

				//playlist code
				// if (isUrl) {
				// 	const playlistId = getYoutubePlaylistId(toQueue);
				// 	Logger.debug('pid', playlistId);

				// 	// if (playlistId) {
				// 	// 	getYoutubePlaylistItems(playlistId).then(async playlistItems => {
				// 	// 		interaction.followUp(`Queueing **${playlistItems.length} songs**`);
				// 	// 		let failed = 0;

				// 	// 		for (const item of playlistItems) {
				// 	// 			// Attempt to create a Track from the user's video URL
				// 	// 			try {
				// 	// 				const track = await Track.fromUrl(`https://www.youtube.com/watch?v=${item.contentDetails.videoId}`, {
				// 	// 					onStart() {
				// 	// 						let trackTitle = track.title;
				// 	// 						if (track.type === TrackType.youtube) trackTitle = `[${track.title}](https://www.youtube.com/watch?v=${track.location})`;
				// 	// 						interaction.followUp({ content: `Now playing **${trackTitle}!**`, ephemeral: false }).catch(console.warn);
											
				// 	// 					},
				// 	// 					onFinish() {
				// 	// 						interaction.followUp({ content: 'Now finished!', ephemeral: true }).catch(console.warn); // not required, caused extra spam
				// 	// 					},
				// 	// 					onError(error: Error) {
				// 	// 						console.warn(error);
				// 	// 						interaction.followUp({ content: 'An error has occured, please try again later.', ephemeral: true }).catch(console.warn);
				// 	// 					},
				// 	// 				});
				// 	// 				// Enqueue the track and reply a success message to the user
				// 	// 				subscription!.enqueue(track);
				// 	// 			} catch(err) {
				// 	// 				console.error(err);
				// 	// 				failed++;
				// 	// 			}
				// 	// 		}

				// 	// 		if (failed > 0) interaction.followUp(`Failed to enqueue ${failed} song${failed === 1 ? '' : 's'}.`);
				// 	// 	});
						
				// 	// 	return;
				// 	// }
				// }

				const trackCreator = isUrl ? Track.fromUrl : Track.fromTitle;
				Logger.debug('isUrl = '+isUrl);


				// Attempt to create a Track from the user's video URL
				trackCreator(toQueue, {
					onStart() {
						// interaction.followUp({ content: 'Now playing!', ephemeral: false }).catch(console.warn);
					},
					onFinish() {
						// interaction.followUp({ content: 'Now finished!', ephemeral: true }).catch(console.warn); // not required, caused extra spam
					},
					onError(error: Error) {
						console.warn(error);
						interaction.followUp({ content: 'An error has occured, please try again later.', ephemeral: true }).catch(console.warn);
					},
				}).then(async track => {
					// Enqueue the track and reply a success message to the user
					subscription!.enqueue(track);
					interaction.followUp(`Enqueued **${track.title}**`);

					db.pool.query({
						text: `
							INSERT INTO users (id, songs_played) VALUES ($1, 1)
							ON CONFLICT (id) DO
							UPDATE SET songs_played = users.songs_played + 1
						`,
						values: [interaction.user.id]
					}).then(() => {
						if (track.type == TrackType.youtube) {
							db.pool.query({
								text: `
									INSERT INTO song_plays (user_id, song_url) VALUES ($1, $2)
									ON CONFLICT (user_id, song_url) DO
									UPDATE SET count = song_plays.count + 1
								`,
								values: [interaction.user.id, track.location]
							});
						}
					});
				}).catch((error) => {
					console.error('err', error);
					interaction.followUp({ content: 'there was a error my dude', ephemeral: true });
				});
			} catch(error) {
				console.error('err', error);
				interaction.followUp('Failed to play track, please try again later!');
			}
		});
	}
};

function getYoutubePlaylistId(urlString: string): string | null {
	let url = null;

	try {
		url = new URL(urlString);
	} catch (_) {
		return null;
	}

	const splitHost = url.host.split('.');

	if (!((splitHost[1] === 'youtu' && splitHost[2] === 'be') || splitHost[1] === 'youtube')) return null;

	return url.searchParams.get('list');
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
function getYoutubePlaylistItems(playlistId: string): Promise<Array<{ contentDetails: { videoId: string } }>> {
	return new Promise((resolve, reject) => {
		const req = https.request({
			hostname: 'www.googleapis.com',
			port: 443,
			path: `/youtube/v3/playlistItems?${process.env.YOUTUBE_API_KEY}&part=contentDetails&maxResults=100&playlistId=${encodeURI(playlistId)}`,
			method: 'GET',
			ciphers: 'DEFAULT:@SECLEVEL=0'
		}, res => {
			let data = '';
			res.on('data', chunk => {
				data += chunk;
			});

			req.on('error', error => {
				reject(error);
			});

			res.on('end', async () => {
				const result = JSON.parse(data.toString());

				if (result === undefined || result === null || result.error) return reject('result null or error idk');

				resolve(result.items);
			});
		});

		req.end();
	});
}