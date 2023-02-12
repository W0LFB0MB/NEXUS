import { Guild } from 'discord.js';
import db from '../modules/database.js';

export default {
	name: 'guildCreate',
	once: false,
	execute(guild: Guild) {
		db.pool.query({
			text: `
			INSERT INTO guilds (id)
			VALUES ($1)
			ON CONFLICT DO NOTHING
		`,
			values: [guild.id]
		});
	}
};