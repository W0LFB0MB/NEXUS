import {
	AudioPlayer,
	AudioPlayerStatus,
	AudioResource,
	createAudioPlayer,
	entersState,
	VoiceConnection,
	VoiceConnectionDisconnectReason,
	VoiceConnectionState,
	VoiceConnectionStatus
} from '@discordjs/voice';
import { Guild, VoiceChannel } from 'discord.js';
import Track from './track.js';
import { promisify } from 'util';

import db from '../modules/database.js';
import Logger from '../modules/logger.js';

export enum LoopType {
	none = 0,
	track = 1,
	queue = 2,
}

const wait = promisify(setTimeout);

export default class MusicSubscription {
	public readonly voiceConnection: VoiceConnection;
	public readonly audioPlayer: AudioPlayer;
	public queue: Track[] = [];
	public queueLock = false;
	public readyLock = false;
	public loop = LoopType.none;
	public persistant = false;

	private _paused = false;
	private _stateChange = Date.now();

	public get paused(): boolean {
		return this._paused;
	}
	public set paused(value: boolean) {
		this._paused = value;
		if (value) {
			this.audioPlayer.pause();
		} else {
			this.audioPlayer.unpause();
		}

		db.pool.query({
			text: `
				UPDATE servers
				SET track_pause = $2
				WHERE id = $1
			`,
			values: [this.guildId, this.paused ? Date.now() : null]
		});
	}
	
	public get guildId(): string { return this.voiceConnection.joinConfig.guildId; }
	public get guild(): Promise<Guild> {
		return new Promise(() => {
			import('../bot.js').then(i => {
				const { default: Bot } = i;
				return Bot.client.guilds.fetch(this.guildId);
			});
		});
	}

	public get channelId(): string | null { return this.voiceConnection.joinConfig.channelId; }
	public get channel(): Promise<VoiceChannel | null> {
		return new Promise(() => {
			import('../bot.js').then(i => {
				const { default: Bot } = i;
				return Bot.client.channels.fetch(this.channelId!);
			});
		});
	}

	constructor(voiceConnection: VoiceConnection) {
		this.audioPlayer = createAudioPlayer();
		this.voiceConnection = voiceConnection;

		this.voiceConnection.on('stateChange', async (oldState, newState) => {
			console.log(newState.status);
			const oldNetworking = Reflect.get(oldState, 'networking');
			const newNetworking = Reflect.get(newState, 'networking');

			const networkStateChangeHandler = (oldNetworkState: VoiceConnectionState, newNetworkState: VoiceConnectionState) => {
				const newUdp = Reflect.get(newNetworkState, 'udp');
				clearInterval(newUdp?.keepAliveInterval);
			};

			oldNetworking?.off('stateChange', networkStateChangeHandler);
			newNetworking?.on('stateChange', networkStateChangeHandler);

			if (newState.status === VoiceConnectionStatus.Disconnected) {
				if (newState.reason === VoiceConnectionDisconnectReason.WebSocketClose && newState.closeCode === 4014) {
					/*
						If the WebSocket closed with a 4014 code, this means that we should not manually attempt to reconnect,
						but there is a chance the connection will recover itself if the reason of the disconnect was due to
						switching voice channels. This is also the same code for the bot being kicked from the voice channel,
						so we allow 5 seconds to figure out which scenario it is. If the bot has been kicked, we should destroy
						the voice connection.
					*/
					try {
						await entersState(this.voiceConnection, VoiceConnectionStatus.Connecting, 5_000);
						// Probably moved voice channel
					} catch (err) {
						this.voiceConnection.destroy();
						// Probably removed from voice channel
					}
				} else if (this.voiceConnection.rejoinAttempts < 5) {
					/*
						The disconnect in this case is recoverable, and we also have <5 repeated attempts so we will reconnect.
					*/
					await wait((this.voiceConnection.rejoinAttempts + 1) * 5_000);
					this.voiceConnection.rejoin();
				} else {
					/*
						The disconnect in this case may be recoverable, but we have no more remaining attempts - destroy.
					*/
					this.voiceConnection.destroy();
				}
			} else if (newState.status === VoiceConnectionStatus.Destroyed) {
				/*
					Once destroyed, Remove the subscription
				*/
				const { default: Bot } = await import('../bot.js');
				Bot.subscriptions.delete(this.guildId);
			} else if (
				!this.readyLock &&
				(newState.status === VoiceConnectionStatus.Connecting || newState.status === VoiceConnectionStatus.Signalling)
			) {
				/*
					In the Signalling or Connecting states, we set a 20 second time limit for the connection to become ready
					before destroying the voice connection. This stops the voice connection permanently existing in one of these
					states.
				*/
				this.readyLock = true;
				try {
					await entersState(this.voiceConnection, VoiceConnectionStatus.Ready, 20_000);
				} catch (err) {
					if (this.voiceConnection.state.status !== VoiceConnectionStatus.Destroyed) this.voiceConnection.destroy();
				} finally {
					this.readyLock = false;
				}
			}
		});

		// Configure audio player
		this.audioPlayer.on('stateChange', (oldState, newState) => {
			const timeOutMs = 5 * 60 * 1000; // 5 minutes
			this._stateChange = Date.now();

			if (newState.status === AudioPlayerStatus.Idle && !this.persistant) {
				setTimeout(() => {
					if (Date.now() - this._stateChange >= timeOutMs && !this.persistant) this.destroy();
				}, timeOutMs + 100);
			}

			if (newState.status === AudioPlayerStatus.Idle && oldState.status !== AudioPlayerStatus.Idle) {
				// If the Idle state is entered from a non-Idle state, it means that an audio resource has finished playing.
				// The queue is then processed to start playing the next track, if one is available.
				(oldState.resource as AudioResource<Track>).metadata.onFinish();
				if (this.loop === LoopType.track) {
					this.queue.unshift(oldState.resource.metadata as Track);
				} else if (this.loop === LoopType.queue) {
					this.queue.push(oldState.resource.metadata as Track);
				}
				void this.processQueue();
			} else if (newState.status === AudioPlayerStatus.Playing) {
				// If the Playing state has been entered, then a new track has started playback.
				(newState.resource as AudioResource<Track>).metadata.onStart();
			}
		});

		this.audioPlayer.on('error', (error) => (error.resource as AudioResource<Track>).metadata.onError(error));

		voiceConnection.subscribe(this.audioPlayer);
	}

	/**
	 * Saves the queue to the database.
	 */
	private saveQueue() {
		const dbQueue = this.queue.map(track => {
			return {
				location: track.location,
				type: track.type,
			};
		});

		db.pool.query({
			text: `
					UPDATE servers
					SET queue = $2
					WHERE id = $1
				`,
			values: [this.guildId, JSON.stringify(dbQueue)]
		});
	}

	/**
	 * Adds a new Track to the queue.
	 *
	 * @param track The track to add to the queue
	 */
	public enqueue(track: Track): void {
		this.queue.push(track);
		this.saveQueue();
		this.processQueue();
	}

	/**
	 * Stops audio playback and empties the queue
	 */
	public stop(): void {
		this.queue = [];
		this.audioPlayer.stop(true);

		db.pool.query({
			text: `
					UPDATE servers
					SET track_location = null, track_type = null, track_loop = null, channel_id = null, track_start = null, track_pause = null, queue = null
					WHERE id = $1
				`,
			values: [this.guildId]
		});
	}

	public async destroy(): Promise<void> {
		const { default: Bot } = await import('../bot.js');
		this.stop();
		Bot.subscriptions.delete(this.guildId);
		try { this.voiceConnection.destroy(); } catch {/**/}
	}

	public scrub(): void {
		//???
	}

	/**
	 * Attempts to play a Track from the queue
	 */
	private async processQueue(): Promise<void> {
		// If the queue is locked (already being processed), is empty, or the audio player is already playing something, return
		if (this.queueLock || this.audioPlayer.state.status !== AudioPlayerStatus.Idle || this.queue.length === 0) {
			return;
		}
		// Lock the queue to guarantee safe access
		this.queueLock = true;

		// Take the first item from the queue. This is guaranteed to exist due to the non-empty check above.
		const nextTrack = this.queue.shift();
		if (!nextTrack) {
			db.pool.query({
				text: `
					UPDATE servers
					SET track_location = null, track_type = null, track_loop = null, channel_id = null, track_start = null, track_pause = null, queue = null
					WHERE id = $1
				`,
				values: [this.guildId]
			});

			return;
		}

		this.saveQueue();
		
		try {
			// Attempt to convert the Track into an AudioResource (i.e. start streaming the video)
			const resource = await nextTrack.createAudioResource();
			// const resource = this.audioPlayer.res
			Logger.debug(resource.metadata.toString());
			
			this.audioPlayer.play(resource);
			this.queueLock = false;
			
			db.pool.query({
				text: `
					UPDATE servers
					SET track_location = $2, track_type = $3, track_loop = $4, channel_id = $5, track_start = $6
					WHERE id = $1
				`,
				values: [this.guildId, resource.metadata.location, resource.metadata.type, this.loop, this.channelId, Date.now()]
			});

			if (!this.paused) {
				db.pool.query({ 
					text: `
						UPDATE servers
						SET track_pause = null
						WHERE id = $1
					`,
					values: [this.guildId],
				});
			}
		} catch (error) {
			// If an error occurred, try the next item of the queue instead
			nextTrack.onError(error as Error);
			console.error(error);
			this.queueLock = false;
			this.processQueue();
		}
	}

	// public async treeJoined(): Promise<void> {
	// 	if (this.audioPlayer.state.status === AudioPlayerStatus.Idle) {
	// 		const tsp = new Track({
	// 			type: TrackType.local,
	// 			location: 'audio/treeJoined.wav', 
	// 			title: 'Tree has soft paws <3', 
	// 		});
	// 		const resource = await tsp.createAudioResource();
	// 		this.audioPlayer.play(resource);
	// 	}
	// }
}