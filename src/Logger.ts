import winston, { createLogger, transports, format } from "winston";
const { combine, timestamp, colorize, printf } = format;

const LOG_FILENAME = "app-combined.log";
const LOG_DIRECTORY = "./logs";
const LOGGER_CONFIG = {
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
const defaultFormat = printf(({ timestamp, level, message, details }) => {
	return `[${timestamp}] [${level}]:  ${message} ${
		details ? JSON.stringify(details, null, 2) : ""
	}`;
});

const initLogger = () => {
	const logger = createLogger({
		handleExceptions: false,
		handleRejections: false,
		exitOnError: false,
		levels: LOGGER_CONFIG.levels,
		level: "INFO",
		format: combine(timestamp(), colorize(), defaultFormat),
		transports: [
			new transports.File({
				dirname: LOG_DIRECTORY,
				filename: LOG_FILENAME,
			}),
		],
	});

	let levelForConsoleLogs = "INFO";
	if (process.env.NODE_ENV === "development") {
		levelForConsoleLogs = "TRACE";
	}

	winston.addColors(LOGGER_CONFIG.colors);
	logger.add(
		new winston.transports.Console({
			level: levelForConsoleLogs,
			format: combine(timestamp(), colorize(), defaultFormat),
		}),
	);
	return logger;
};

const logger: winston.Logger = initLogger();

// biome-ignore lint/suspicious/noExplicitAny: <explanation>
export const fatal = (message: string, ...meta: any) => {
	logger.log("FATAL", message);
};

export const error = (error: Error) => {
	logger.log("ERROR", error.stack);
};

// biome-ignore lint/suspicious/noExplicitAny:
export const warn = (message: string, ...meta: any) => {
	logger.log("WARN", message, {
		details: meta[0],
	});
};

// biome-ignore lint/suspicious/noExplicitAny:
export const info = (message: string, ...meta: any) => {
	logger.log("INFO", message);
};

// biome-ignore lint/suspicious/noExplicitAny: <explanation>
export const debug = (message: string, ...meta: any) => {
	logger.log("DEBUG", message, {
		details: meta[0],
	});
};

export const trace = (message: string) => {
	logger.log("TRACE", message);
};
