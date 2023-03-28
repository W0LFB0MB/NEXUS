// import { DiscordGatewayAdapterCreator, joinVoiceChannel } from '@discordjs/voice';
import { EmbedBuilder, TextChannel } from 'discord.js';

// import Track, { TrackType } from '../modules/track.js';
// import MusicSubscription from '..//modules/subscription.js';
import db from '../modules/database.js';

export default {
	name: 'ready',
	once: true,
	async execute() {
		const { default: Bot } = await import('../bot.js');
		
		if (!Bot.client.user) return;

		const BotGuild = Bot.client.guilds.cache.find(guild => guild.id === '799255751713095720')!;
		const BotStartChannel = BotGuild.channels.cache.find(channel => channel.id === '983801228062507140')! as TextChannel;

		const startupEmbed = new EmbedBuilder()
			.setColor('#553f62')
			.setTitle('BOT STARTUP')
			.setDescription(`${Bot.client.user.username} is starting`)
			.setTimestamp();

		startupEmbed.setFooter({ text: `${Bot.loadMs}ms` });
		BotStartChannel.send({ embeds: [startupEmbed] });

		const { rows: activityAndStatusRows } = await db.pool.query({
			text: `
				SELECT *
				FROM options
				WHERE option = 'status' OR option = 'activityName' OR option = 'activityType' OR option = 'activityURL'
				`,
		});

		Bot.client.user.setPresence({
			status: activityAndStatusRows.find(options => options.option === 'status').value.toLowerCase(),
			activities: [{
				name: activityAndStatusRows.find(options => options.option === 'activityName').value,
				type: parseInt(activityAndStatusRows.find(options => options.option === 'activityType').value),
				url: activityAndStatusRows.find(options => options.option === 'activityURL').value
			}],
		});


		// // //CRASH RECOVERY

		// const { rows: [{ value: crashTimestamp }] }: { rows: Array<{ value: string }>} = await db.pool.query({
		// 	text: `
		// 		SELECT value
		// 		FROM options
		// 		WHERE option = 'crashedTime'
		// 	`
		// });

		// if (!crashTimestamp || (Date.now() - parseInt(crashTimestamp)) > (30 * 1000)) return; //if no timestamp or crashed more than 30 seconds ago return
		// Logger.info('crash recovery');

		// const { rows: servers } : {
		// 	rows: Array<{
		// 		id: string,
		// 		track_location: string,
		// 		track_response_id: string,
		// 		track_type: number,
		// 		track_start: string,
		// 		track_pause: string,
		// 		queue: Array<{
		// 			location: string,
		// 			type: number,
		// 		}>,
		// 		track_loop: number,
		// 		channel_id: string,
		// 	}>
		// } = await db.pool.query({
		// 	text: `
		// 		SELECT id, track_location, track_type, track_start, track_pause, queue, track_loop, channel_id
		// 		FROM servers
		// 		WHERE track_location IS NOT NULL
		// 	`
		// });

		// servers.forEach(async server => {
		// 	if (server.id !== '799255751713095720') return;
		// 	Logger.trace('s');
		// 	const guild = await Bot.client.guilds.fetch(server.id);

		// 	const subscription = new MusicSubscription(
		// 		joinVoiceChannel({
		// 			channelId: server.channel_id,
		// 			guildId: server.id,
		// 			adapterCreator: guild.voiceAdapterCreator as DiscordGatewayAdapterCreator,
		// 		})
		// 	);

		// 	Bot.subscriptions.set(guild.id, subscription);

		// 	// can't figure out how to get interaction with id
		// 	// const response = channel.messages.fetch(server.track_response_id);
		// 	// const interaction = (await response).interaction!;

		// 	// const e = CommandInteraction
		// 	if (server.track_type === TrackType.youtube) {
		// 		Track.fromUrl(`https://www.youtube.com/watch?v=${server.track_location}`, {
		// 			onStart() {
		// 				// interaction.followUp({ content: 'Now playing!', ephemeral: false }).catch(console.warn);
		// 				Logger.trace('a');
		// 			},
		// 			onFinish() {
		// 				// interaction.followUp({ content: 'Now finished!', ephemeral: true }).catch(console.warn); // not required, caused extra spam
		// 				Logger.trace('b');
		// 			},
		// 			onError(error: Error) {
		// 				console.error(error);
		// 				// interaction.followUp({ content: 'An error has occured, please try again later.', ephemeral: true }).catch(console.warn);
		// 			},
		// 		}).then(async track => {
		// 			// Enqueue the track and reply a success message to the user
		// 			const playFrom = (((server.track_pause === null ? parseInt(crashTimestamp) : parseInt(server.track_pause)) - parseInt(server.track_start)) / 1000);
		// 			Logger.trace(playFrom);
		// 			subscription.audioPlayer.play(await track.createAudioResource(playFrom));
		// 			if (server.track_pause !== null) subscription.paused = true;
		// 		});
		// 	}

		// 	// server.queue.forEach((trackData) => {
		// 	// 	if (trackData.type === TrackType.youtube) Track.fromUrl(`https://www.youtube.com/watch?v=${trackData.id}`, {
		// 	// 		onStart() {
		// 	// 			// interaction.followUp({ content: 'Now playing!', ephemeral: false }).catch(console.warn);
		// 	// 		},
		// 	// 		onFinish() {
		// 	// 			// interaction.followUp({ content: 'Now finished!', ephemeral: true }).catch(console.warn); // not required, caused extra spam
		// 	// 		},
		// 	// 		onError(error: Error) {
		// 	// 			console.warn(error);
		// 	// 			// interaction.followUp({ content: 'An error has occured, please try again later.', ephemeral: true }).catch(console.warn);
		// 	// 		},
		// 	// 	}).then(async track => {
		// 	// 		// Enqueue the track and reply a success message to the user
		// 	// 		subscription!.enqueue(track);
		// 	// 	});
		// 	// });
		// });
	},
};