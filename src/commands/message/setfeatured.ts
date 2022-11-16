import { Message } from 'discord.js';
import ytdlc from 'ytdl-core';

import db from '../../modules/database.js';

export default {
	name: 'setfeatured',
	restricted: true,
	async execute(message: Message) {
		const url = message.content.split(' ')[1];
		let isYoutubeVideo = true;

		try {
			await ytdlc.getInfo(url);
		} catch {
			isYoutubeVideo = false;
		}

		if (!isYoutubeVideo) return message.reply('Must supply youtube link.');

		const curl = new URL(url); 

		db.query({
			text: `
					UPDATE options
					SET value = $1
					WHERE option = 'featured'
				`,
			values: [curl.searchParams.get('v')]
		});

		message.reply('Featured video set.');
	}
};