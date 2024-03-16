import { Server as SocketServer } from "socket.io";
import ManageableClass from "./ManageableClass";
import { Server } from "node:http";

export default class SocketClient implements ManageableClass {
  private io!: SocketServer;

  constructor(private readonly httpServer: Server) {}

  async init(): Promise<void> {
    console.log("Initializing the SocketClient...");

    this.io = new SocketServer(this.httpServer);

    this.io.on("connection", (socket) => {
      console.log(
        `A user has connected to the websocket with ID: ${socket.id}`
      );
    });

    console.log("Initialized the SocketClient!");
  }

  public handleFirstSubscription(username: string): void {
    this.io.emit("alert", {
      type: "firstSub",
      username,
    });
  }

  public handleResubscription(username: string, subStreakInMonths: number) {
    this.io.emit("alert", {
      type: "reSub",
      username,
      subStreakInMonths,
    });
  }
}
