import { CommandInteraction, ApplicationCommandType } from 'discord.js';

import db from '../../modules/database.js';

export default {
	name: 'featured',
	description: 'Shows the currently featured song',
	type: ApplicationCommandType.ChatInput,
	options: [],
	global: true,
	async execute(interaction: CommandInteraction) {
		const { rows } = await db.query({
			text: `
						SELECT value
						FROM options
						WHERE option = 'featured'
					`
		});
		const featured = rows[0].value;

		interaction.reply({ content: `The currently featured song is ${featured}`, ephemeral: true});
	}
};