import type { Server } from "node:http";
import { Server as SocketIO } from "socket.io";
import type { Initializable } from "./ObjectManager";
import * as Logger from "./Logger";

export class SocketConnectionError extends Error {
	public constructor(message: string) {
		super(message);
		this.name = "SocketConnectionError";
	}
}

export default class SocketServer implements Initializable {
	private io: SocketIO;

	constructor(private readonly httpServer: Server) {
		this.io = new SocketIO(this.httpServer);
	}

	public getSocketIO(): SocketIO {
		return this.io;
	}

	public async init(): Promise<void> {
		Logger.info(`Initializing the ${this.constructor.name}...`);

		this.io.on("connection", (socket) => {
			Logger.trace(
				`A user has connected to the websocket with ID: ${socket.id}`,
			);
		});

		Logger.info(`Initialized the ${this.constructor.name}!`);
	}
}
