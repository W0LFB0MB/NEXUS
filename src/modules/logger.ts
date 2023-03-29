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
		return JSON.stringify(this);
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
			if (fs.existsSync(`${this.directory}/latest.log`)) fs.rmSync(`${this.directory}/latest.log`);
		}
	}

	/**
	 * Adds a new log
	 *
	 * @param {LogSeverity} severity - Log severity
	 * @param {string} message - Log message
	 * @param {string | undefined} stack - Stack trace
	 */
	public static log(severity: LogSeverity, message: string, stack: string | undefined): void {
		const log = new Log(severity, message, stack);
		this.logs.push(log);
		this.saveToFile();
		console.log(log.toConsoleString());
	}

	/**
	 * Adds a new trace log to logger
	 *
	 * @param {string} message - Log message
	 */
	public static trace = (message: string): void => this.log(LogSeverity.TRACE, message, undefined);
	/**
	 * Adds a new debug log to logger
	 *
	 * @param {string} message - Log message
	 */
	public static debug = (message: string): void => this.log(LogSeverity.DEBUG, message, undefined);
	/**
	 * Adds a new info log to logger
	 *
	 * @param {string} message - Log message
	 */
	public static info = (message: string): void => this.log(LogSeverity.INFO, message, undefined);
	/**
	 * Adds a new warning log to logger
	 *
	 * @param {string} message - Log message
	 */
	public static warn = (message: string): void => this.log(LogSeverity.WARN, message, undefined);
	/**
	 * Adds a new error log to logger
	 *
	 * @param {string} message - Log message
	 * @param {string | undefined} trace - Stack trace
	 */
	public static error = (message: string, trace: string | undefined): void => this.log(LogSeverity.ERROR, message, trace);
	/**
	 * Adds a new fatal log to logger
	 *
	 * @param {string} message - Log message
	 * @param {string | undefined} trace - Stack trace
	 */
	public static fatal = (message: string, trace: string | undefined): void => this.log(LogSeverity.FATAL, message, trace);

	/**
	 * Saves logs to the logs directory
	 */
	public static saveToFile(): void {
		let logJson = '{\r\n';
		logJson += `\t"startTimestamp":${this.instantiated},\r\n\t"endTimestamp":${Date.now()},\r\n`;
		logJson += '\t"logs":[\r\n';
		this.logs.forEach(log => logJson += `\t\t${log.toString()},\r\n`);
		logJson += '\t]\r\n}';

		fs.writeFileSync(`${this.directory}/latest.log`, logJson);
		fs.writeFileSync(`${this.directory}/${this.instantiated}.log`, logJson);
	}
}