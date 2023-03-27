import fs from 'fs';

export enum LogSeverity {
	TRACE = 'TRACE',
	DEBUG = 'DEBUG',
	INFO = 'INFO',
	WARN = 'WARN',
	ERROR = 'ERROR',
	FATAL = 'FATAL',
}

export class Log {
	public readonly timestamp = Date.now();
	public readonly severity: LogSeverity;
	public readonly message: string;

	constructor(severity: LogSeverity, message: string) {
		this.severity = severity;
		this.message = message;
	}

	toString(): string {
		return `${this.timestamp} [${this.severity}] : ${this.message}`;
	}
}

export default class Logger {
	private static readonly directory = 'logs/';
	private static readonly instantiated = Date.now();

	public static readonly logs: Log[] = [];

	static {
		if (!fs.existsSync(`${this.directory}/`)) {
			fs.mkdirSync(this.directory);
		} else {
			fs.rmSync(`${this.directory}/latest.log`);
		}
	}

	public static log(severity: LogSeverity, message: string) {
		const log = new Log(severity, message);
		this.logs.push(log);
		fs.appendFileSync(`${this.directory}/latest.log`, log.toString() + '\r\n');
		console.log(log.toString());
	}

	public static trace = (message: string) => this.log(LogSeverity.TRACE, message);
	public static debug = (message: string) => this.log(LogSeverity.DEBUG, message);
	public static info = (message: string) => this.log(LogSeverity.INFO, message);
	public static warn = (message: string) => this.log(LogSeverity.WARN, message);
	public static error = (message: string) => this.log(LogSeverity.ERROR, message);
	public static fatal = (message: string) => this.log(LogSeverity.FATAL, message);

	public static toString(): string {
		let logString = '';

		this.logs.forEach(log => {
			logString += `${log.toString()}\r\n`;
		});

		return logString;
	}

	public static saveLogs() {
		const logString = `\r\n## START OF LOGS - ${this.instantiated} ##\r\n` + this.toString() + `\r\n## END OF LOGS - ${Date.now()} ##\r\n`;

		fs.writeFileSync(`${this.directory}/latest.log`, logString);
		fs.writeFileSync(`${this.directory}/${this.instantiated}.log`, logString);
	}
}