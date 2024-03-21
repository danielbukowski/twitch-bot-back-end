import { Server as SocketIOServer } from "socket.io";
import ManageableClass from "./ManageableClass";
import { Server } from "node:http";

export default class SocketServer implements ManageableClass {
  private io!: SocketIOServer;

  constructor(private readonly httpServer: Server) {}

  async init(): Promise<void> {
    console.log("Initializing the SocketClient...");

    this.io = new SocketIOServer(this.httpServer);

    this.io.on("connection", (socket) => {
      console.log(
        `A user has connected to the websocket with ID: ${socket.id}`
      );
    });

    console.log("Initialized the SocketClient!");
  }

  public handleFirstSubscription(username: string): void {
    this.io.emit("twitch-alert-message", {
      type: "FIRST_SUB",
      username,
    });
  }

  public handleResubscription(username: string, subStreakInMonths: number): void {
    this.io.emit("twitch-alert-message", {
      type: "RE_SUB",
      username,
      subStreakInMonths,
    });
  }
}
