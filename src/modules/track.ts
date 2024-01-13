'use strict';
import ytdlc from 'ytdl-core';
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { AudioResource, createAudioResource, demuxProbe, StreamType } from '@discordjs/voice';
import https from 'https';
import ffmpeg from 'fluent-ffmpeg';
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import he from 'he';
import { Readable, Writable } from 'stream';
import Logger from '../modules/logger.js';
const getInfo = ytdlc.getInfo;

// eslint-disable-next-line @typescript-eslint/no-empty-function
const noop = () => {};

export interface TrackData {
	type: number
	location: string;
	title: string;
	onStart: () => void;
	onFinish: () => void;
	onError: (error: Error) => void;
}

export const TrackType = Object.freeze({
	local: 0,
	youtube: 1,
	spotify: 2,
	soundcloud: 3,
});

export default class Track implements TrackData {
	public readonly type: number;
	public readonly location: string;
	public readonly title: string;
	public readonly onStart: () => void;
	public readonly onFinish: () => void;
	public readonly onError: (error: Error) => void;

	constructor({ type, location, title, onStart, onFinish, onError}: Partial<TrackData>) {
		this.type = type || 0;
		this.location = location || '';
		this.title = title || '';
		this.onStart = onStart || noop;
		this.onFinish = onFinish || noop;
		this.onError = onError || noop;
	}

	public async createAudioResource(seekTime?: number): Promise<AudioResource<Track>> {
		if (this.type === TrackType.youtube) {
			const info = await ytdlc.getInfo(this.location);
			// const aformat = ytdlc.filterFormats(info.formats, 'audioonly')[0];

			const ytstream = ytdlc(this.location, {
				quality: 'highestaudio',
				highWaterMark: 1 << 25,
				dlChunkSize: 0,
			});

			return createAudioResource(ytstream, { metadata: this, inputType: StreamType.Arbitrary });
			// if (seekTime !== undefined) {
			// 	return new Promise((resolve, reject) => {

			// 		const rs = new Readable({
			// 			read(this: Readable) {
			// 				return true;
			// 			}
			// 		});

			// 		const ws = new Writable({
			// 			write(this: Writable, chunk: unknown, encoding: BufferEncoding, callback: (error?: Error | null | undefined) => void) {
			// 				rs.push(chunk);
			// 				callback();
			// 			}
			// 		});

			// 		ffmpeg()
			// 			.setFfmpegPath('C:\\ffmpeg\\bin\\ffmpeg.exe')
			// 			.input(ytstream)
			// 			.inputOptions('-thread_queue_size 16384')
			// 			.format(format.container)
			// 			.audioCodec(format.audioCodec!)
			// 			.audioBitrate(format.audioBitrate!)
			// 			.seek(Math.ceil(seekTime))
			// 			.output(ws)
			// 			.on('codecData', (data) => {
			// 				Logger.trace('Input is ' + data.audio + ' audio ' +
			// 					'with ' + data.video + ' video');
			// 			})
			// 			.on('stderr', (stderrLine) => {
			// 				Logger.error('Stderr output: ' + stderrLine, undefined);
			// 			})
			// 			.on('start', () => {
			// 				Logger.trace('ffmpeg start');
			// 			})
			// 			.on('progress', (info) => {
			// 				Logger.trace('progress ' + info.percent + '%');
			// 			})
			// 			.on('error', (err) => {
			// 				Logger.error('An error occurred: ' + err.message, err.trace);
			// 				reject(err);
			// 			})
			// 			.on('end', () => {
			// 				resolve(createAudioResource(rs, { metadata: this, inputType: StreamType.WebmOpus }));
			// 			})
			// 			.run();
			// 	});
			// } else {
			// 	return createAudioResource(ytstream, { metadata: this, inputType: StreamType.WebmOpus });
			// }

			

		} else if (this.type === TrackType.local) {
			return createAudioResource(this.location, { metadata: this, inputType: StreamType.WebmOpus });
		}

		return createAudioResource(this.location, { metadata: this, inputType: StreamType.WebmOpus });
	}

	/**
	 * Creates a Track from a video URL and lifecycle callback methods.
	 *
	 * @param url The URL of the video
	 * @param methods Lifecycle callbacks
	 * @returns The created Track
	 */
	public static async fromUrl(url: string, methods: Pick<Track, 'onStart' | 'onFinish' | 'onError'>): Promise<Track> {
		const info = await getInfo(url);

		// The methods are wrapped so that we can ensure that they are only called once.
		const wrappedMethods = {
			onStart() {
				wrappedMethods.onStart = noop;
				methods.onStart();
			},
			onFinish() {
				wrappedMethods.onFinish = noop;
				methods.onFinish();
			},
			onError(error: Error) {
				wrappedMethods.onError =  noop;
				methods.onError(error);
			},
		};

		return new Track({
			type: TrackType.youtube,
			title: he.decode(info.videoDetails.title),
			location: info.videoDetails.videoId,
			...wrappedMethods,
		});
	}

	/**
	 * Creates a Track from a video URL and lifecycle callback methods.
	 *
	 * @param title The title of the video
	 * @param methods Lifecycle callbacks
	 * @returns The created Track
	 */
	public static async fromTitle(title: string, methods: Pick<Track, 'onStart' | 'onFinish' | 'onError'>): Promise<Track> {
		return new Promise((resolve, reject) => {
			const req = https.request({
				hostname: 'www.googleapis.com',
				port: 443,
				path: `/youtube/v3/search?maxResults=1&key=${process.env.YOUTUBE_API_KEY}&part=snippet&q=${encodeURI(title)}`,
				method: 'GET',
				ciphers: 'DEFAULT:@SECLEVEL=0'
			}, res => {
				let data = '';
				res.on('data', chunk => {
					data += chunk;
				});

				res.on('end', async () => {
					// The methods are wrapped so that we can ensure that they are only called once.
					const wrappedMethods = {
						onStart() {
							wrappedMethods.onStart = noop;
							methods.onStart();
						},
						onFinish() {
							wrappedMethods.onFinish = noop;
							methods.onFinish();
						},
						onError(error: Error) {
							wrappedMethods.onError = noop;
							methods.onError(error);
						},
					};

					const result = JSON.parse(data.toString());

					if (result.items.length === 0) return reject('No Results');

					const id = JSON.parse(data.toString()).items[0].id.videoId;

					if (id === undefined || id === null || id === 'undefined') return reject('no id');

					resolve(
						new Track({
							type: TrackType.youtube,
							title: he.decode(JSON.parse(data.toString()).items[0].snippet.title),
							location: id,
							...wrappedMethods,
						})
					);
				});
			});

			req.on('error', error => {
				reject(error);
			});

			req.end();
		});
	}
}