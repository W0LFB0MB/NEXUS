import fs from 'fs';

export enum LogSeverity {
	TRACE = 'TRACE',
	DEBUG = 'DEBUG',
	INFO = 'INFO',
	WARN = 'WARN',
	ERROR = 'ERROR',
	FATAL = 'FATAL',
}

class Log {
	public readonly timestamp = Date.now();
	public readonly severity: LogSeverity;
	public readonly message: string;
	public readonly stack: string | undefined;

	constructor(severity: LogSeverity, message: string, stack: string | undefined) {
		this.severity = severity;
		this.message = message;
		this.stack = stack;
	}

	toString(): string {
		const extraSpacing = ' '.repeat(5 - this.severity.length);
		return `${this.timestamp} [${this.severity}]${extraSpacing} : ${this.message}`;
	}

	toConsoleString(): string {
		const extraSpacing = ' '.repeat(5 - this.severity.length);
		const consoleReset = '\x1b[0m';

		let severityColor = '';

		if (this.severity === LogSeverity.TRACE) severityColor = '\x1b[0;90m';  // Grey FG
		if (this.severity === LogSeverity.DEBUG) severityColor = '\x1b[0;90m';  // White FG
		if (this.severity === LogSeverity.INFO) severityColor = '\x1b[0;97m';   // White FG
		if (this.severity === LogSeverity.WARN) severityColor = '\x1b[0;93m';   // Yellow FG
		if (this.severity === LogSeverity.ERROR) severityColor = '\x1b[0;91m';  // Red FG
		if (this.severity === LogSeverity.FATAL) severityColor = '\x1b[41;39m';  // Red FG Black BG

		const stackString = this.stack ? `\r\n${this.stack}` : '';

		return `\x1b[0;90m${this.timestamp} ${severityColor}[${this.severity}]${consoleReset}${extraSpacing} : ${this.message}${consoleReset}${stackString}`;
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

	public static log(severity: LogSeverity, message: string, stack: string | undefined): void {
		const log = new Log(severity, message, stack);
		this.logs.push(log);
		fs.appendFileSync(`${this.directory}/latest.log`, log.toString() + '\r\n');
		console.log(log.toConsoleString());
	}

	public static trace = (message: string): void => this.log(LogSeverity.TRACE, message, undefined);
	public static debug = (message: string): void => this.log(LogSeverity.DEBUG, message, undefined);
	public static info = (message: string): void => this.log(LogSeverity.INFO, message, undefined);
	public static warn = (message: string): void => this.log(LogSeverity.WARN, message, undefined);
	public static error = (message: string, trace: string | undefined): void => this.log(LogSeverity.ERROR, message, trace);
	public static fatal = (message: string, trace: string | undefined): void => this.log(LogSeverity.FATAL, message, trace);

	public static toString(): string {
		let logString = '';

		this.logs.forEach(log => {
			logString += `${log.toString()}\r\n`;
		});

		return logString;
	}

	public static saveLogs(): void {
		//const logString = `\r\n## START OF LOGS - ${this.instantiated} ##\r\n` + this.toString() + `\r\n## END OF LOGS - ${Date.now()} ##\r\n`;

		let logString = '[\r\n';

		this.logs.forEach(log => {
			logString += '	' + JSON.stringify(log) + ',\r\n';
		});

		logString += ']';

		fs.writeFileSync(`${this.directory}/latest.log`, logString);
		fs.writeFileSync(`${this.directory}/${this.instantiated}.log`, logString);
	}
}