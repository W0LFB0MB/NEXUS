import { CommandInteraction, ApplicationCommandType, ApplicationCommandOptionType } from 'discord.js';

import permissionsMiddleware from '../../modules/middleware/permissionsMiddleware.js';
import db from '../../modules/database.js';

export default {
	name: 'blacklist',
	description: 'Add, remove or check the user\'s status in the blacklist',
	type: ApplicationCommandType.ChatInput,
	options: [
		{
			name: 'mode',
			type: ApplicationCommandOptionType.String,
			description: 'Command mode',
			required: true,
			choices: [
				{
					name: 'add',
					value: 'add',
				},
				{
					name: 'remove',
					value: 'remove',
				},
				{
					name: 'status',
					value: 'status',
				},
			],
		},
		{
			name: 'user',
			type: ApplicationCommandOptionType.User,
			description: 'The user to apply the command to',
			required: true,
		},
	],
	global: false,
	async execute(interaction: CommandInteraction) {
		const mode = interaction.options.get('mode')!.value! as string;
		const user = interaction.options.get('user')!.value! as string;

		interaction.reply(mode + '   ' + user);

		if (mode !== 'status') {
			permissionsMiddleware(interaction, Buffer.from('000', 'binary'), async () => {
				const blacklist = mode === 'add' ? true : false;

				db.query({
					text: `
							INSERT INTO users (id)
							VALUES ($1)
							ON CONFLICT DO NOTHING
						`,
					values: [user]
				});

				db.query({
					text: `
							INSERT INTO servers_users (users_id, servers_id)
							VALUES ($1, $2)
							ON CONFLICT DO
							UPDATE SET blacklisted = $3
						`,
					values: [user, interaction.guildId, blacklist]
				});

				interaction.followUp('User ' + blacklist ? 'blacklisted' : 'unblacklisted');
			});
		} else {
			interaction.deferReply();

			const { rows } = await db.query({
				text: `
						SELECT blacklisted
						FROM servers_users
						WHERE id = $1
					`,
				values: [user]
			});

			const blacklisted = rows[0]?.blacklisted ?? false;

			interaction.reply('User is ' + blacklisted ? '' : 'not' + 'blacklisted');
		}
	}
};