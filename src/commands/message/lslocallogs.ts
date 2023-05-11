import { EmbedBuilder, Message } from 'discord.js';
import fs from 'fs';
import Bot from '../../bot.js';

export default {
	name: 'lslocallogs',
	restricted: true,
	async execute(message: Message) {
		const logsEmbed = new EmbedBuilder()
			.setTitle('Logs')
			.setColor(Bot.config.themeHex);

		fs.readdir('logs', (err, data) => {
			if (err) return logsEmbed.setDescription('err');

			let descString = '';

			data.forEach((log, index) => {
				if (log === 'latest.log') return descString += `**${index}**: latest.log`;
				descString += `**${index}**: <t:${Math.floor(parseInt(log.slice(0,log.indexOf('.')))/1000)}:F> ${log}\n`;
			});

			logsEmbed.setDescription(descString);

			message.reply({ embeds: [logsEmbed] });
		});
	}
};