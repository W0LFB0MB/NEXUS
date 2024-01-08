import { CommandInteraction, ApplicationCommandType, ApplicationCommandOptionType, EmbedBuilder, PermissionsBitField } from 'discord.js';
import ytdlc from 'ytdl-core';

import db from '../../modules/database.js';

export default {
	name: 'profile',
	description: 'Check someones profile',
	type: ApplicationCommandType.ChatInput,
	options: [
		{
			name: 'user',
			type: ApplicationCommandOptionType.User,
			description: 'The user to check the profile of',
			required: false,
		}
	],
	global: true,
	async execute(interaction: CommandInteraction) {
		const user = await (interaction.options.getUser('user') || interaction.user).fetch(true);
		const { rows: dbUserRows } = await db.pool.query({
			text: `
				SELECT *
				FROM users
				WHERE id = $1
			`,
			values: [user.id]
		});

		const dbUser = dbUserRows[0];

		const { rows: dbSongPlaysRows } = await db.pool.query({
			text: `
				SELECT *
				FROM song_plays
				WHERE user_id = $1
			`,
			values: [user.id]
		});

		dbSongPlaysRows.sort((a, b) => a.count < b.count ? 1 : -1);

		const { default: Bot } = await import('../../bot.js');

		if (!Bot.client.application?.owner) await Bot.client.application?.fetch();
		const isOwner = user.id === Bot.client.application?.owner?.id;

		const profileEmbed = new EmbedBuilder()
			.setTitle(user.username)
			.setColor(user.accentColor ?? null)
			.setThumbnail(user.avatarURL())
			.setDescription('Chad music enjoyer.');
			// .addFields([
			// 	{
			// 		name: 'GPL',
			// 		value: isOwner ? 'Owner' : 'Basic',
			// 		inline: true,
			// 	}
			// ]);

		if (isOwner) profileEmbed.setAuthor({ iconURL: 'https://cdn.discordapp.com/attachments/1006983950629097625/1006984053028823050/nstaffs.png', name: 'NEXUS STAFF' });

		// if (interaction.inGuild()) {
		// 	const isGuildOwner = await interaction.guild!.ownerId === user.id;
		// 	const isAdministrator = await (await interaction.guild!.members.fetch(user)).permissions.has(PermissionsBitField.Flags.Administrator);

		// 	profileEmbed.addFields([
		// 		{
		// 			name: 'LPL',
		// 			value: isGuildOwner ? 'Owner' : isAdministrator ? 'Administrator' : 'Basic',
		// 			inline: true,
		// 		}
		// 	]);
		// }

		profileEmbed.addFields([
			{
				name: 'Songs Played',
				value: (dbUser?.songs_played ?? 0).toString(),
				inline: true,
			},
		]);

		interaction.reply({ embeds: [profileEmbed], ephemeral: true });

		if (dbSongPlaysRows.length > 0) {
			ytdlc.getInfo(dbSongPlaysRows[0].song_url).then(info => {
				profileEmbed.addFields([
					{
						name: 'Favorite Song',
						value: `[${info.videoDetails.title}](${info.videoDetails.video_url}) (Played ${dbSongPlaysRows[0].count} time${dbSongPlaysRows[0].count === 1 ? '' : 's'}!)`,
						inline: false,
					},
				])
					.setImage(info.videoDetails.thumbnails[0].url);

				interaction.editReply({ embeds: [profileEmbed] });
			});
		}
	}
};