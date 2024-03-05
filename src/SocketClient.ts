import { Server as SocketServer} from "socket.io";
import ManageableClass from "./ManageableClass";
import { Server } from "node:http"


export default class SocketClient implements ManageableClass {
  private io!: SocketServer;

  constructor(private readonly httpServer: Server) { }

  async init(): Promise<void> {
    console.log("Initializing the SocketClient...");

    this.io = new SocketServer(this.httpServer);

    console.log("Initialized the SocketClient!");
  }

  public handleFirstSubscription(username: string): void {
    this.io.emit("alert", "firstSubscription", username)
  }
}
