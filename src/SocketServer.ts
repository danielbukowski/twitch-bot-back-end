import type { Server } from "node:http";
import { Server as SocketIO } from "socket.io";
import type { Initializable } from "./ObjectManager";

export default class SocketServer implements Initializable {
	private io: SocketIO;

	constructor(private readonly httpServer: Server) {
		this.io = new SocketIO(this.httpServer);
	}

	public getSocketIO(): SocketIO {
		return this.io;
	}

	public async init(): Promise<void> {
		console.log("Initializing the SocketClient...");

		this.io.on("connection", (socket) => {
			console.log(
				`A user has connected to the websocket with ID: ${socket.id}`,
			);
		});

		console.log("Initialized the SocketClient!");
	}
}
