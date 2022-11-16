import { CommandInteraction, ApplicationCommandType, EmbedBuilder } from 'discord.js';

export default {
	name: 'info',
	description: 'Bot Info!',
	type: ApplicationCommandType.ChatInput,
	options: [],
	global: false,
	async execute(interaction: CommandInteraction) {
		const embed = new EmbedBuilder()
			.setColor('Random')
			.setTitle('Information')
			.addFields([
				{
					name: 'Special Thanks',
					value: `
					\`\`\`diff
					+ ThatPegasus
					- Aye_Juice
					+ Eli
					- Tree
					+ James
					\`\`\`
					`,
					inline: true,
				}
			]);

		interaction.reply({ embeds: [embed], ephemeral: true });
	}
};