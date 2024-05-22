import winston, { createLogger, transports, format } from "winston";
const { combine, timestamp, colorize, printf } = format;

// biome-ignore lint/complexity/noStaticOnlyClass: <explanation>
export default class Logger {
	private static readonly LOG_FILENAME = "app-combined.log";
	private static readonly LOG_DIRECTORY = "./logs";
	private static readonly LOGGER_CONFIG = {
		levels: { FATAL: 0, ERROR: 1, WARN: 2, INFO: 3, DEBUG: 4, TRACE: 5 },
		colors: {
			FATAL: "magenta",
			ERROR: "red",
			WARN: "yellow",
			INFO: "green",
			DEBUG: "blue",
			TRACE: "cyan",
		},
	} as const;
	private static readonly DEFAULT_FORMAT = printf(
		({ level, message, timestamp }) => {
			return `[${timestamp}] [${level}]:  ${message}`;
		},
	);
	private static logger: winston.Logger;
	static {
		Logger.logger = createLogger({
		levels: Logger.LOGGER_CONFIG.levels,
		format: combine(timestamp(), Logger.DEFAULT_FORMAT),
		level: "INFO",
		transports: [
			new transports.File({
				dirname: Logger.LOG_DIRECTORY,
				filename: Logger.LOG_FILENAME,
			}),
		],
	});

	static {
		winston.addColors(Logger.LOGGER_CONFIG.colors);

		Logger.logger.add(
			new winston.transports.Console({
				level: "TRACE",
				format: combine(
					timestamp(),
					colorize({ level: true }),
					Logger.DEFAULT_FORMAT,
				),
			}),
		);
	}

	public static fatal(message: string): void {
		Logger.logger.log("FATAL", message);
	}

	public static error(message: string): void {
		Logger.logger.log("ERROR", message);
	}

	public static warn(message: string): void {
		Logger.logger.log("WARN", message);
	}

	public static info(message: string): void {
		Logger.logger.log("INFO", message);
	}

	public static debug(message: string): void {
		Logger.logger.log("DEBUG", message);
	}

	public static trace(message: string): void {
		Logger.logger.log("TRACE", message);
	}
}
