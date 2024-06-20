import winston, { createLogger, transports, format } from "winston";
const { combine, timestamp, colorize, printf } = format;
import dotenv from "dotenv";
dotenv.config();

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
		({ timestamp, level, message, details }) => {
			return `[${timestamp}] [${level}]:  ${message} ${
				details ? JSON.stringify(details, null, 2) : ""
			}`;
		},
	);
	private static readonly ERROR_STACK_FORMAT = format((info) => {
		if (info.stack) {
			info.message = `${info.message} ${info.stack}`;
		}
		return info;
	});
	private static logger: winston.Logger;

	static {
		Logger.logger = createLogger({
			levels: Logger.LOGGER_CONFIG.levels,
			format: combine(
				timestamp(),
				Logger.ERROR_STACK_FORMAT(),
				Logger.DEFAULT_FORMAT,
			),
			level: "INFO",
			transports: [
				new transports.File({
					dirname: Logger.LOG_DIRECTORY,
					filename: Logger.LOG_FILENAME,
				}),
			],
		});

		winston.addColors(Logger.LOGGER_CONFIG.colors);

		let levelForConsoleLogs = "INFO";

		if (process.env.NODE_ENV === "development") {
			levelForConsoleLogs = "TRACE";
		}

		Logger.logger.add(
			new winston.transports.Console({
				level: levelForConsoleLogs,
				format: combine(
					timestamp(),
					colorize({ level: true }),
					Logger.DEFAULT_FORMAT,
				),
			}),
		);
	}

	public static fatal(message: string, error?: Error): void {
		Logger.logger.log("FATAL", message, { stack: error?.stack });
	}

	// biome-ignore lint/suspicious/noExplicitAny:
	public static error(message: string, ...meta: any): void {
		Logger.logger.log("ERROR", message, {
			details: meta[0],
		});
	}

	// biome-ignore lint/suspicious/noExplicitAny:
	public static warn(message: string, ...meta: any): void {
		Logger.logger.log("WARN", message, {
			details: meta[0],
		});
	}

	// biome-ignore lint/suspicious/noExplicitAny:
	public static info(message: string, ...meta: any): void {
		Logger.logger.log("INFO", message, {
			details: meta[0],
		});
	}

	// biome-ignore lint/suspicious/noExplicitAny:
	public static debug(message: string, ...meta: any): void {
		Logger.logger.log("DEBUG", message, {
			details: meta[0],
		});
	}

	// biome-ignore lint/suspicious/noExplicitAny:
	public static trace(message: string): void {
		Logger.logger.log("TRACE", message);
	}
}
