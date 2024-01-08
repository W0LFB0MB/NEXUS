import { CommandInteraction, GuildMember} from 'discord.js';

export default async function musicMiddleware(interaction: CommandInteraction, next: () => void) {
	const { default: Bot } = await import('../../bot.js');
	const subscription = Bot.subscriptions.get(interaction.guildId!);

	if (interaction.member instanceof GuildMember) {
		if (!interaction.member.voice.channel) {
			interaction.reply('Join a voice channel and try again!');
			return;
		} else if (subscription && (interaction.member.voice.channelId !== subscription.channelId)) {
			interaction.reply('The bot is currently in use in another channel.');
			return;
		} else {
			next();
			return;
		}
	}
}