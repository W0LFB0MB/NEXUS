import { VoiceState } from 'discord.js';

export default {
	name: 'voiceStateUpdate',
	once: false,
	async execute(oldState: VoiceState, newState: VoiceState) {
		const { default: Bot } = await import('../bot.js');

		const subscription = Bot.subscriptions.get(newState.guild.id);
		if (!subscription || subscription.persistant) return;

		if (oldState.member!.user.id === Bot.client.user!.id) {
			if (newState.channel?.members.size === 1) subscription.destroy();
		} else {
			if (subscription.channelId === oldState.channelId && oldState.channel!.members.size === 1) subscription.destroy();
		}
	}
};