process.title = 'NEXUS BOT';

import dotenv from 'dotenv';
dotenv.config({ path: '../.env'});

import Discord, { Snowflake, GatewayIntentBits, Client } from 'discord.js';
import MusicSubscription from './modules/subscription.js';
import Logger from './modules/logger.js';
import fs from 'fs';

const intents = [
	GatewayIntentBits.Guilds,
	GatewayIntentBits.GuildMembers,
	GatewayIntentBits.GuildBans,
	GatewayIntentBits.GuildEmojisAndStickers,
	GatewayIntentBits.GuildIntegrations,
	GatewayIntentBits.GuildWebhooks,
	GatewayIntentBits.GuildInvites,
	GatewayIntentBits.GuildVoiceStates,
	GatewayIntentBits.GuildMessages,
	GatewayIntentBits.GuildMessageReactions,
	GatewayIntentBits.GuildMessageTyping,
	GatewayIntentBits.DirectMessages,
	GatewayIntentBits.DirectMessageReactions,
	GatewayIntentBits.DirectMessageTyping,
	GatewayIntentBits.MessageContent,
];

export default class Bot {
	public static client: Client;
	public static subscriptions: Map<Snowflake, MusicSubscription>;
	public static readonly config = JSON.parse(fs.readFileSync('config.json').toString());
	private static _loadMs: number;
	public static get loadMs(): number { return Bot._loadMs; }

	static {
		Logger.info('BOT STARTED');
		this.client = new Discord.Client({ intents: intents });
		this.subscriptions = new Map<Snowflake, MusicSubscription>();

		const eventURL = new URL('events', import.meta.url);
		const eventFiles = fs.readdirSync(eventURL).filter(file => file.endsWith('.js'));

		const startTime = Date.now();

		(async () => { //to allow async loading
			for (const file of eventFiles) {
				Logger.debug(`ADDING EVENT LISTENER - ${file.split('.')[0].toUpperCase()}`);

				const {default: event} = await import(`${eventURL.href}/${file}`);

				if (event.once) {
					this.client.once(event.name, (...args) => event.execute(...args));
				} else {
					this.client.on(event.name, (...args) => event.execute(...args));
				}
			}
			this._loadMs = Date.now() - startTime;
			Logger.info(`EVENTS LOADED - ${this._loadMs}ms`);
		})();


		this.client.login(process.env.BOT_TOKEN);
	}
}


function SaveCrashData(cause: string, details: string) {
	const directory = 'crash/';
	if (!fs.existsSync(directory)) {
		fs.mkdirSync(directory);
	}

	const crashData = JSON.stringify({ timestamp: Date.now(), cause: cause, details: details });
	fs.writeFileSync(directory+'latest', crashData);
	fs.writeFileSync(`${directory}${Date.now()}`, crashData);
}

process
	.on('exit', code => {
		Bot.client.user?.setStatus('invisible');
		Logger.info(`Process exited with code: ${code}`);
		Logger.saveToFile();
	})
	.on('SIGTERM', () => {
		SaveCrashData('SIGTERM', '');
		Logger.info('Received a SIGTERM signal');
		process.exit(0);
	})
	.on('SIGINT', () => {
		SaveCrashData('SIGINT', '');
		Logger.info('Received a SIGINT signal');
		process.exit(0);
	})
	.on('uncaughtException', err => {
		SaveCrashData('uncaughtException', err.toString());
		Logger.fatal(`Uncaught Exception: ${err}`, err.stack);
		process.exit(1);
	})
	.on('unhandledRejection', (reason: Error, promise) => {
		SaveCrashData('unhandledRejection', reason.toString());
		Logger.info(`Unhandled rejection at ${promise}, reason: ${reason}`);
		process.exit(1);
	});