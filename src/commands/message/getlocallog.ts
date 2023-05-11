import { AttachmentBuilder, Message } from 'discord.js';
import fs from 'fs';

export default {
	name: 'getlocallog',
	restricted: true,
	async execute(message: Message) {
		const spaceIndex = message.content.indexOf(' ');
		const logFileName = message.content.slice(spaceIndex+1);
		if (logFileName == '') return message.reply('No log file specified.');

		if (isNaN(parseInt(logFileName))) {
			fs.readFile(`logs/${logFileName}`, (err, data) => {
				if (err) return message.reply('err');

				const attatchment = new AttachmentBuilder(data, { name: logFileName });
				message.reply({ files: [attatchment] });
			});
		} else {
			fs.readdir('logs', (err, data) => {
				if (err) return message.reply('err');
				let foundLog: string | null = null;
				data.forEach((log, index) => {
					if (index == parseInt(logFileName) || log.slice(0, log.indexOf('.')) == logFileName) foundLog = log;
				});

				if (foundLog === null) message.reply('No log with specified name found');

				const attatchment = new AttachmentBuilder(fs.readFileSync(`logs/${foundLog}`), { name: foundLog! });
				message.reply({ files: [attatchment] });
			});
		}
	}
};