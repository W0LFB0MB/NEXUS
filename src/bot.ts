process.title = 'NEXUS BOT';

import dotenv from 'dotenv';
dotenv.config({ path: '../.env'});

import Discord, { Snowflake, GatewayIntentBits, Client } from 'discord.js';
import db from './modules/database.js';
import MusicSubscription from './modules/subscription.js';
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

db.connect();

export default class Bot {
	public static client: Client;
	public static subscriptions: Map<Snowflake, MusicSubscription>;
	public static readonly heroku: boolean = (!!process.env._ && process.env._.indexOf('heroku') !== -1);
	private static _loadMs: number;
	public static get loadMs(): number { return Bot._loadMs; }

	static {
		this.client = new Discord.Client({ intents: intents });
		this.subscriptions = new Map<Snowflake, MusicSubscription>();

		const eventURL = new URL('events', import.meta.url);
		const eventFiles = fs.readdirSync(eventURL).filter(file => file.endsWith('.js'));

		const startTime = Date.now();

		(async () => { //to allow async loading
			for (const file of eventFiles) {
				console.log(`ADDING EVENT LISTENER - ${file.split('.')[0].toUpperCase()}`);

				const {default: event} = await import(`${eventURL.href}/${file}`);

				if (event.once) {
					this.client.once(event.name, (...args) => event.execute(...args));
				} else {
					this.client.on(event.name, (...args) => event.execute(...args));
				}
			}
			this._loadMs = Date.now() - startTime;
			console.log(`EVENTS LOADED - ${this._loadMs}ms`);
		})();


		this.client.login(process.env.BOT_TOKEN);
	}
}


//SAVING CRASH TIMESTAMP TO DATABASE

const crashTimestampLog = () => db.query({
	text: `
		UPDATE options
		SET value = $1
		WHERE option = 'crashedTime'
	`,
	values: [Date.now()]
});

process.on('beforeExit', async code => {
	// Can make asynchronous calls
	await crashTimestampLog();
	console.log(`Process will exit with code: ${code}`);
	process.exit(code);
});

process.on('exit', async code => {
	// Only synchronous calls
	await crashTimestampLog();
	console.log(`Process exited with code: ${code}`);
});

process.on('SIGTERM', async () => {
	await crashTimestampLog();
	console.log(`Process ${process.pid} received a SIGTERM signal`);
	process.exit(0);
});

process.on('SIGINT', async () => {
	await crashTimestampLog();
	console.log(`Process ${process.pid} has been interrupted`);
	process.exit(0);
});

process.on('uncaughtException', async err => {
	await crashTimestampLog();
	console.log(`Uncaught Exception: ${err.message}`);
	process.exit(1);
});

process.on('unhandledRejection', async (reason, promise) => {
	await crashTimestampLog();
	console.log('Unhandled rejection at ', promise, `reason: ${reason}`);
	process.exit(1);
});