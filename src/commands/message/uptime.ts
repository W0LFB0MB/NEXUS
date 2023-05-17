import { Message } from 'discord.js';
// import fs from 'fs';
// import { LogFile } from 'modules/logger';
import Bot from '../../bot.js';

// const weekMs = 1000*60*60*24*7; //s(ms) * m * h * d * w

export default {
	name: 'uptime',
	restricted: true,
	async execute(message: Message) {
		// fs.readdir('logs', (err, data) => {
		// 	if (err) return message.reply('err');
		// 	let uptime = 0;

		// 	data.forEach(log => {
		// 		if (log === 'latest.log') return;
		// 		const logData = fs.readFileSync(`logs/${log}`).toString();
		// 		const logJSON: LogFile = JSON.parse(logData);

		// 		console.log(logJSON.startTimestamp, Date.now(), weekMs);

		// 		if (logJSON.startTimestamp > (Date.now() - weekMs)) {
		// 			uptime += logJSON.endTimestamp -logJSON.startTimestamp ;
		// 		}
		// 	});

		// 	const uptimeSecondsTotal = Math.floor(uptime / 1000);
		// 	const uptimeMinutesTotal = Math.floor(uptimeSecondsTotal / 60);
		// 	const uptimeHoursTotal = Math.floor(uptimeMinutesTotal / 60);
		// 	const uptimeDaysTotal = Math.floor(uptimeHoursTotal / 24);

		// 	const millisecondsFormatted = (uptime - uptimeSecondsTotal * 1000).toString().padStart(3,'0');
		// 	const secondsFormatted = (uptimeSecondsTotal - uptimeMinutesTotal * 60).toString().padStart(2, '0');
		// 	const minutesFormatted = (uptimeMinutesTotal - uptimeHoursTotal * 60).toString().padStart(2, '0');
		// 	const hoursFormatted = (uptimeHoursTotal - uptimeDaysTotal * 24).toString().padStart(2, '0');
			

		// 	message.reply(`${uptimeDaysTotal}:${hoursFormatted}:${minutesFormatted}:${secondsFormatted}:${millisecondsFormatted} uptime in the past 7 days`);
		// });

		//const { default: Bot } = await import('src/bot.js');

		const uptime = Date.now() - Bot.startTime;

		const uptimeSecondsTotal = Math.floor(uptime / 1000);
		const uptimeMinutesTotal = Math.floor(uptimeSecondsTotal / 60);
		const uptimeHoursTotal = Math.floor(uptimeMinutesTotal / 60);
		const uptimeDaysTotal = Math.floor(uptimeHoursTotal / 24);

		const millisecondsFormatted = (uptime - uptimeSecondsTotal * 1000).toString().padStart(3, '0');
		const secondsFormatted = (uptimeSecondsTotal - uptimeMinutesTotal * 60).toString().padStart(2, '0');
		const minutesFormatted = (uptimeMinutesTotal - uptimeHoursTotal * 60).toString().padStart(2, '0');
		const hoursFormatted = (uptimeHoursTotal - uptimeDaysTotal * 24).toString().padStart(2, '0');

		message.reply(`${uptimeDaysTotal}:${hoursFormatted}:${minutesFormatted}:${secondsFormatted}:${millisecondsFormatted}`);
	}
};