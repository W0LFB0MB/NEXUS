import { CommandInteraction } from 'discord.js';

export default async function permissionsMiddleware(interaction: CommandInteraction, permissionString: Buffer, next: () => void) {
	if (interaction.user.id === interaction.guild?.ownerId) {
		next();
		return;
	}

	interaction.deferReply();

	next();
}